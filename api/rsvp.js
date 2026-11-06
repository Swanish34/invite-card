module.exports = async function handler(req, res) {

  // Rule 1: only people delivering a form can come in
  if (req.method !== "POST") {
    return res.status(405).json({ message: "POST only" });
  }

  // Rule 2: is the party still on?
  if (new Date() > new Date(process.env.EXPIRES_AT)) {
    return res.status(403).json({ message: "This invitation has ended. Thank you! 💛" });
  }

  // Rule 3: name and phone are needed
  const { name, phone, guests, message } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone needed" });
  }

  // Clean the form so nobody can sneak in huge or silly values
  const row = {
    name: String(name).slice(0, 80),
    phone: String(phone).slice(0, 20),
    guests: Math.min(Number(guests) || 1, 10),
    message: String(message || "").slice(0, 300)
  };

  // Write it in the guest book (Supabase)
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rsvps?on_conflict=phone`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(row)
    }
  );

  // Did the notebook accept it?
  if (!response.ok) {
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }

  res.status(200).json({ message: "Thank you! See you there 🎉" });
};