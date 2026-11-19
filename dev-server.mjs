// Local test server: serves index.html and runs api/chat.js like Vercel does.
// Run:  node dev-server.mjs   →  http://localhost:3000
// Reads OLLAMA_HOST / OLLAMA_MODEL / OLLAMA_API_KEY from .env.local (defaults to local Ollama).
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import handler from "./api/chat.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of (await readFile(path.join(dir, ".env.local"), "utf8")).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
process.env.OLLAMA_HOST ||= "http://localhost:11434";
process.env.OLLAMA_MODEL ||= "qwen3.5:4b";

const port = Number(process.env.PORT) || 3000;
http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/chat")) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); };
    return handler(req, res);
  }
  if (req.url === "/" || req.url.startsWith("/?") || req.url === "/index.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(await readFile(path.join(dir, "index.html")));
  }
  res.statusCode = 404; res.end("Not found");
}).listen(port, () => console.log(`FreshMart on http://localhost:${port} → ${process.env.OLLAMA_HOST} (${process.env.OLLAMA_MODEL})`));
