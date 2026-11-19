# FreshMart

Grocery store demo website with an AI shopping assistant (Arabic, Darija, French, English).

- `index.html` — the whole store (catalogue, cart, wishlist, chat panel).
- `api/chat.js` — Vercel serverless function that forwards chat messages to Ollama.

## Environment variables (Vercel)

| Name | Example |
|---|---|
| `OLLAMA_HOST` | `https://ollama.com` (Ollama Cloud) or a tunnel URL to a local Ollama |
| `OLLAMA_MODEL` | `glm-5.3-flash` |
| `OLLAMA_API_KEY` | Ollama Cloud key (not needed for a local Ollama) |

The API key is never stored in the code.

## Deploy

```
npx vercel deploy --prod
```
