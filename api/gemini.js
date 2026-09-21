// Vercel serverless Gemini proxy — same contract as server.js /api/gemini.
// Secret key lives in Vercel env (GEMINI_API_KEY), never in the page.
const EP = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODELS = [process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']
  .filter((m, i, a) => m && a.indexOf(m) === i);

// tiny per-instance rate limit (Vercel-safe best effort; use KV for hard limits later)
const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length <= 40;
}

function cleanContent(c) {
  if (typeof c === 'string') return c.slice(0, 6000);
  if (Array.isArray(c)) return c.slice(0, 3).map((p) => {
    if (!p || typeof p !== 'object') return null;
    if (p.type === 'image_url' && p.image_url && typeof p.image_url.url === 'string')
      return { type: 'image_url', image_url: { url: p.image_url.url.slice(0, 700000) } };
    if (p.type === 'text') return { type: 'text', text: String(p.text || '').slice(0, 6000) };
    return null;
  }).filter(Boolean);
  return '';
}

module.exports = async function handler(req, res) {
  try {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  if (!rateOk(ip)) return res.status(429).json({ error: 'slow down' });
  const KEY = process.env.GEMINI_API_KEY || '';
  if (!KEY) return res.status(503).json({ error: 'no-server-key' });
  const msgs = (req.body && req.body.messages) || [];
  if (!Array.isArray(msgs) || !msgs.length || msgs.length > 12)
    return res.status(400).json({ error: 'bad messages' });
  for (let i = 0; i < msgs.length; i++) {
    const r = msgs[i] && msgs[i].role;
    if (r !== 'user' && r !== 'system') return res.status(400).json({ error: 'bad role (user|system only)' });
  }
  const temp = Math.min(1.2, Math.max(0, Number((req.body || {}).temperature) || 0.7));
  const messages = msgs.slice(0, 12).map((m) => ({
    role: m.role === 'system' ? 'system' : 'user',
    content: cleanContent(m.content)
  }));
  if (messages.some((m) => (typeof m.content === 'string' ? !m.content : !m.content.length)))
    return res.status(400).json({ error: 'bad content' });
  for (const model of MODELS) {
    try {
      const r = await fetch(EP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
        body: JSON.stringify({ model, response_format: { type: 'json_object' }, temperature: temp, messages })
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 404) continue;
      if (!r.ok) return res.status(502).json({ error: 'ai-' + r.status });
      const content = (((j.choices || [])[0] || {}).message || {}).content || '';
      return res.status(200).json({ content, model });
    } catch (e) { return res.status(502).json({ error: 'ai-unreachable' }); }
  }
  return res.status(502).json({ error: 'ai-404-no-model' });
  } catch (e) { try { return res.status(500).json({ error: 'crashed', detail: String((e && e.message) || e).slice(0, 160) }); } catch (e2) {} }
};
