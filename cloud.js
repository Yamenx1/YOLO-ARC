// YOLO ARC cloud sync — Clerk sign-in + Convex save backup. Fully optional:
// no keys configured or offline => the game just plays locally.
import { ConvexClient } from 'https://esm.sh/convex/browser';

const cfg = (typeof window !== 'undefined' && window.YOLO_CONFIG) || {};
let client = null;
let pushT = null;

function el(id) { return document.getElementById(id); }
function setStatus(t) { const s = el('cloudStatus'); if (s) s.textContent = t; }

function paintAuth() {
  const slot = el('authSlot');
  if (!slot || !window.Clerk) return;
  const user = window.Clerk.user;
  if (!user) {
    slot.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn small dark';
    b.type = 'button';
    b.textContent = 'SIGN IN';
    b.onclick = () => window.Clerk.openSignIn();
    slot.appendChild(b);
    return;
  }
  slot.innerHTML = '';
  const name = document.createElement('span');
  name.className = 'who mono';
  name.textContent = (user.firstName || user.username || 'HERO').toUpperCase();
  const out = document.createElement('button');
  out.className = 'btn small ghost';
  out.type = 'button';
  out.textContent = 'OUT';
  out.title = 'Sign out';
  out.onclick = () => window.Clerk.signOut();
  slot.appendChild(name);
  slot.appendChild(out);
}

async function pull() {
  if (!client) return;
  try {
    const row = await client.query('saves:get', {});
    const local = (window.YOLO && window.YOLO.get()) || {};
    if (row && row.data && (row.updatedAt || 0) > (local.savedAt || 0)) {
      window.YOLO.set(row.data);
      setStatus('SYNCED — cloud save loaded');
    } else {
      setStatus('SYNCED');
    }
  } catch (e) { setStatus('LOCAL — cloud unreachable'); }
}

function schedulePush() {
  if (!client || !window.Clerk || !window.Clerk.user) return;
  clearTimeout(pushT);
  pushT = setTimeout(pushNow, 2000);
}

async function pushNow() {
  if (!client || !window.Clerk || !window.Clerk.user) return;
  try {
    const s = window.YOLO.get();
    await client.mutation('saves:put', { data: s, updatedAt: s.savedAt || Date.now() });
    setStatus('SYNCED — ' + new Date().toLocaleTimeString());
  } catch (e) { setStatus('LOCAL — will retry'); }
}

async function init() {
  if (!cfg.CLERK_KEY || String(cfg.CLERK_KEY).indexOf('PASTE') === 0) { setStatus('LOCAL — add keys to config.js'); return; }
  if (!window.Clerk) { setStatus('LOCAL — auth offline'); return; }
  try {
    await window.Clerk.load({ publishableKey: cfg.CLERK_KEY });
  } catch (e) { setStatus('LOCAL — auth failed'); return; }
  paintAuth();
  try { window.Clerk.addListener(paintAuth); } catch (e) {}
  window.__cloudPush = schedulePush;
  if (window.Clerk.user && cfg.CONVEX_URL && String(cfg.CONVEX_URL).indexOf('PASTE') !== 0) {
    client = new ConvexClient(cfg.CONVEX_URL);
    client.setAuth(async () => {
      try { return await window.Clerk.session.getToken({ template: 'convex' }); }
      catch (e) { return null; }
    });
    pull();
  } else {
    setStatus(window.Clerk.user ? 'LOCAL — add Convex URL' : 'LOCAL');
  }
}

init();
