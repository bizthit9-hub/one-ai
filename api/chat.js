export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Message is required." });

    const input = [
      ...Array.isArray(history) ? history.slice(-12).map(x => ({
        role: x.role === "assistant" ? "assistant" : "user",
        content: String(x.content || "")
      })) : [],
      { role: "user", content: message.trim() }
    ];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.6", input })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "AI request failed." });
    const reply = data.output_text || data.output?.flatMap(x => x.content || []).find(x => x.type === "output_text")?.text;
    if (!reply) return res.status(502).json({ error: "AI returned no text." });
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error." });
  }
}
