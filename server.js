// YOLO ARC production server — zero dependencies, Node 18+.
// Serves the game and proxies Gemini so the API key stays server-side (never in the page).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_EP = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// 40 /api requests per minute per IP.
const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length <= 40;
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json' });
  res.end(body);
}

function serveFile(urlPath, res) {
  let p = decodeURIComponent(String(urlPath).split('?')[0]);
  if (p === '/' || !path.extname(p)) p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) return send(res, 403, 'forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, data, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
}

function handleGemini(req, res) {
  const ip = (req.socket && req.socket.remoteAddress) || 'x';
  if (!rateOk(ip)) return send(res, 429, JSON.stringify({ error: 'slow down' }));
  if (!GEMINI_KEY) return send(res, 503, JSON.stringify({ error: 'no-server-key' }));
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 50000) req.destroy(); });
  req.on('end', async () => {
    let body = {};
    try { body = JSON.parse(raw || '{}'); }
    catch (e) { return send(res, 400, JSON.stringify({ error: 'bad json' })); }
    if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 12)
      return send(res, 400, JSON.stringify({ error: 'bad messages' }));
    const temp = Math.min(1.2, Math.max(0, Number(body.temperature) || 0.7));
    for (let i = 0; i < body.messages.length; i++) {
      const r0 = body.messages[i] && body.messages[i].role;
      if (r0 !== 'user' && r0 !== 'system') return send(res, 400, JSON.stringify({ error: 'bad role (user|system only)' }));
    }
    const messages = body.messages.slice(0, 12).map((m) => ({
      role: m.role === 'system' ? 'system' : 'user',
      content: String(m.content || '').slice(0, 6000)
    }));
    const MODELS = [GEMINI_MODEL, 'gemini-2.5-flash-lite', 'gemini-2.0-flash'].filter((m, i, a) => m && a.indexOf(m) === i);
    for (const model of MODELS) {
      try {
        const r = await fetch(GEMINI_EP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GEMINI_KEY },
          body: JSON.stringify({ model, response_format: { type: 'json_object' }, temperature: temp, messages })
        });
        const j = await r.json().catch(() => ({}));
        if (r.status === 404) continue;
        if (!r.ok) return send(res, 502, JSON.stringify({ error: 'ai-' + r.status }));
        const content = (((j.choices || [])[0] || {}).message || {}).content || '';
        return send(res, 200, JSON.stringify({ content, model }));
      } catch (e) { return send(res, 502, JSON.stringify({ error: 'ai-unreachable' })); }
    }
    return send(res, 502, JSON.stringify({ error: 'ai-404-no-model' }));
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.split('?')[0] === '/api/health')
    return send(res, 200, JSON.stringify({ ok: true, ai: !!GEMINI_KEY, model: GEMINI_MODEL }));
  if (req.url.split('?')[0] === '/api/gemini' && req.method === 'POST') return handleGemini(req, res);
  if (req.method !== 'GET') return send(res, 405, 'method not allowed', 'text/plain');
  serveFile(req.url, res);
});

server.listen(PORT, () => console.log('YOLO ARC live on port ' + PORT + ' (ai:' + (GEMINI_KEY ? 'on' : 'off') + ')'));
