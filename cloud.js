// YOLO ARC cloud sync — Clerk sign-in + Convex save backup. Fully optional:
// no keys configured or offline => the game just plays locally.
// Both SDKs load from esm.sh (the one channel proven reachable) — no CDN scripts needed.
import { ConvexClient } from 'https://esm.sh/convex/browser';
import { Clerk } from 'https://esm.sh/@clerk/clerk-js@5';

const cfg = (typeof window !== 'undefined' && window.YOLO_CONFIG) || {};
let client = null;
let clerk = null;
let pushT = null;
let lastCloudErr = 'starting…';

function el(id) { return document.getElementById(id); }
function setStatus(t, err) { const s = el('cloudStatus'); if (s) s.textContent = t; if (err) lastCloudErr = err; }
function me() { return (clerk && clerk.user) || null; }

function diagnose() {
  let msg;
  if (!clerk) msg = 'Cloud: auth library did not load. Check connection, then reload.';
  else if (!me()) msg = 'Cloud: you are signed OUT. Tap SIGN IN — sync starts after login.';
  else msg = 'Cloud: signed in. ' + lastCloudErr;
  try { toast(msg); } catch (e) { alert(msg); }
  try { if (window.YOLO) addLog('Diagnose: ' + msg); } catch (e) {}
}

function paintAuth() {
  const slot = el('authSlot');
  if (!slot || !clerk) return;
  const user = me();
  if (!user) {
    slot.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn small dark';
    b.type = 'button';
    b.textContent = 'SIGN IN';
    b.onclick = () => { try { clerk.openSignIn(); } catch (e) { toast('Sign-in failed to open.'); } };
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
  out.onclick = () => { try { clerk.signOut(); } catch (e) {} };
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
      setStatus('SYNCED — cloud save loaded', 'last pull: cloud was newer, loaded it');
    } else {
      setStatus('SYNCED', 'connected, saves flowing both ways');
    }
  } catch (e) { setStatus('LOCAL — cloud unreachable', 'pull failed: ' + (e && e.message ? e.message.slice(0, 90) : e)); }
}

function schedulePush() {
  if (!client || !me()) return;
  clearTimeout(pushT);
  pushT = setTimeout(pushNow, 2000);
}

async function pushNow() {
  if (!client || !me()) return;
  try {
    const s = window.YOLO.get();
    await client.mutation('saves:put', { data: s, updatedAt: s.savedAt || Date.now() });
    setStatus('SYNCED — ' + new Date().toLocaleTimeString(), 'last push ok');
  } catch (e) { setStatus('LOCAL — will retry', 'push failed: ' + (e && e.message ? e.message.slice(0, 90) : e)); }
}

async function init() {
  const st = el('cloudStatus');
  if (st) { st.title = 'Tap to diagnose'; st.style.cursor = 'pointer'; st.onclick = diagnose; }
  if (!cfg.CLERK_KEY || String(cfg.CLERK_KEY).indexOf('PASTE') === 0) { setStatus('LOCAL — add keys to config.js', 'config.js still has placeholders'); return; }
  try {
    clerk = new Clerk(cfg.CLERK_KEY);
    await clerk.load();
  } catch (e) { setStatus('LOCAL — auth failed', 'Clerk load failed: ' + (e && e.message ? e.message.slice(0, 80) : e)); return; }
  paintAuth();
  try { clerk.addListener(paintAuth); } catch (e) {}
  window.__cloudPush = schedulePush;
  if (me() && cfg.CONVEX_URL && String(cfg.CONVEX_URL).indexOf('PASTE') !== 0) {
    client = new ConvexClient(cfg.CONVEX_URL);
    client.setAuth(async () => {
      try { if (!clerk.session) return null; return await clerk.session.getToken({ template: 'convex' }); }
      catch (e) { return null; }
    });
    pull();
  } else {
    setStatus(me() ? 'LOCAL — add Convex URL' : 'LOCAL', me() ? 'signed in but CONVEX_URL missing in config.js' : 'loaded fine — you are signed out');
  }
}

init();
