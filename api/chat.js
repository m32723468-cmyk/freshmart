// Vercel serverless function: forwards the chat to Ollama.
// Env vars (Vercel → Project → Settings → Environment Variables):
//   OLLAMA_HOST     e.g. https://ollama.com  (Ollama Cloud)  or your tunnel URL
//   OLLAMA_MODEL    e.g. gpt-oss:20b  /  qwen3.5:4b
//   OLLAMA_API_KEY  (only for Ollama Cloud)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const host = (process.env.OLLAMA_HOST || "").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL;
  if (!host || !model) return res.status(500).json({ error: "Assistant not configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body?.messages) ? body.messages : [];

  // Keep only valid roles, last 13 messages, and cap sizes so the endpoint can't be abused.
  const messages = raw
    .filter(m => m && ["system", "user", "assistant"].includes(m.role) && typeof m.content === "string")
    .slice(-13)
    .map(m => ({ role: m.role, content: m.content.slice(0, m.role === "system" ? 40000 : 2000) }));
  if (!messages.some(m => m.role === "user")) return res.status(400).json({ error: "No message" });

  const headers = { "Content-Type": "application/json" };
  const key = (process.env.OLLAMA_API_KEY || "").trim().replace(/^Bearer\s+/i, "");
  if (key) headers.Authorization = `Bearer ${key}`;

  try {
    const r = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, stream: false, think: false }),
      signal: AbortSignal.timeout(55000),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      console.error("Ollama error", r.status, detail);
      return res.status(502).json({ error: `Ollama returned ${r.status}` });
    }
    const data = await r.json();
    return res.status(200).json({ message: { role: "assistant", content: data?.message?.content || "" } });
  } catch (e) {
    console.error("Ollama unreachable", e);
    return res.status(502).json({ error: "Ollama unreachable" });
  }
}
