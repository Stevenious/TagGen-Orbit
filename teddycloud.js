/* TagGen Orbit — Plugin-Modus für TeddyCloud (Prototyp).
   Aktiv nur, wenn Orbit von TeddyCloud unter <base>/plugins/<name>/ ausgeliefert wird.
   Orbit liest dann Tags, Custom-Tonies und den Katalog vom selben Server – ausschließlich lesend.
   Zugangsdaten sieht Orbit nie: TeddyCloud meldet den Browser per HttpOnly-Cookie an. */
(function () {
'use strict';
const plugin = typeof TC_PLUGIN !== 'undefined' ? TC_PLUGIN : null;
/* Read-only by construction: only these GET endpoints are ever requested. */
const ALLOWED = ['/api/getTagIndex', '/api/toniesCustomJson', '/api/toniesJson', '/api/auth/status'];
const IMAGE_MAX = 5e6, CATALOG_IMAGES_MAX = 300;
const UID_RE = /^[0-9A-F]{2}( [0-9A-F]{2}){7}$/, RUID_RE = /^[0-9a-f]{16}$/;
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function assertAllowed(path) {
  const clean = String(path).split('?')[0];
  if (!ALLOWED.includes(clean)) throw Error('Orbit liest in TeddyCloud nur freigegebene Daten; „' + clean + '“ ist nicht erlaubt.');
}
async function get(path) {
  if (!plugin) throw Error('Orbit läuft nicht als TeddyCloud-Plugin.');
  assertAllowed(path);
  const response = await fetch(plugin.base + path, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  if (response.status === 401 || response.status === 403) throw Error('Bitte zuerst in TeddyCloud anmelden und Orbit dann erneut öffnen.');
  if (!response.ok) throw Error('TeddyCloud antwortet mit HTTP ' + response.status + '.');
  return response.json();
}
/* Images are only loaded from TeddyCloud's own static folders, never from its API or content download. */
function sameOriginImagePath(value) {
  const path = text(value, 500);
  if (!path.startsWith('/') || path.startsWith('//')) return '';
  if (/^\/(api|content|reverse|cache|v[0-9])\b/i.test(path) || path.includes('..')) return '';
  if (/\/img_unknown\.png$/i.test(path)) return '';
  return path;
}
async function imageData(value) {
  const path = sameOriginImagePath(value);
  if (!path) return '';
  try {
    const response = await fetch(plugin.base + path, { method: 'GET', credentials: 'same-origin' });
    if (!response.ok) return '';
    const blob = await response.blob();
    if (!/^image\/(png|jpeg|webp)$/.test(blob.type) || blob.size > IMAGE_MAX) return '';
    const url = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
    return window.OrbitExchange?.shrink ? await window.OrbitExchange.shrink(url) : url;
  } catch { return ''; }
}
async function limited(items, worker, size = 4) {
  const queue = [...items]; const runners = Array.from({ length: Math.min(size, queue.length) }, async () => { while (queue.length) await worker(queue.shift()); });
  await Promise.all(runners);
}
/* Custom tonies reference pictures on the TeddyCloud server; Orbit stores them as embedded images. */
async function prepareCatalog(raw) {
  if (!Array.isArray(raw)) return raw;
  const copy = raw.map(item => item && typeof item === 'object' ? { ...item } : item);
  const withLocal = copy.filter(item => item && sameOriginImagePath(item.pic)).slice(0, CATALOG_IMAGES_MAX);
  await limited(withLocal, async item => { item.pic = await imageData(item.pic); });
  return copy;
}
function uidFromTeddyCloud(value) { const uid = text(value, 30).replace(/:/g, ' ').toUpperCase(); return UID_RE.test(uid) ? uid : ''; }

/* getTagIndex → entries for the shared import preview (one entry per physical tag, key tag:<ruid>). */
async function readTags() {
  const index = await get('/api/getTagIndex?_t=' + Date.now());
  const tags = Array.isArray(index?.tags) ? index.tags : [];
  const E = window.OrbitExchange;
  let system = 0;
  const entries = [];
  for (const tag of tags) {
    if (!tag || typeof tag !== 'object') continue;
    if (tag.type === 'system') { system++; continue; }
    const e = E.blankEntry();
    const ruid = text(tag.ruid, 20).toLowerCase(), info = tag.tonieInfo && typeof tag.tonieInfo === 'object' ? tag.tonieInfo : {};
    e.key = RUID_RE.test(ruid) ? 'tag:' + ruid : '';
    if (!e.key) e.errors.push('Tag ohne gültige Kennung');
    e.ruid = RUID_RE.test(ruid) ? ruid : '';
    e.nfcUid = uidFromTeddyCloud(tag.uid) || (e.ruid ? E.uidFromRuid(e.ruid) : '');
    if (e.nfcUid && e.ruid && E.ruidFromUid(e.nfcUid) !== e.ruid) e.errors.push('UID und RUID passen nicht zusammen');
    e.model = /^[A-Za-z0-9._-]{1,160}$/.test(text(info.model, 160)) ? text(info.model, 160) : '';
    e.series = text(info.series, 120);
    e.title = text(info.episode, 180) || e.series || (e.model ? 'Modell ' + e.model : 'Tag ' + (e.nfcUid || ruid));
    e.language = text(info.language, 10) || 'de';
    e.imageSource = 'TeddyCloud';
    const picture = text(info.picture, 500);
    if (/^https:\/\//i.test(picture)) e.image = picture;
    else if (sameOriginImagePath(picture)) e.imagePath = picture;
    if (!e.model && !text(tag.source, 300)) e.warnings.push('In TeddyCloud ist noch kein Inhalt zugeordnet');
    if (tag.exists === false) e.warnings.push('Audiodatei fehlt auf dem Server');
    if (tag.hide === true) e.warnings.push('In TeddyCloud ausgeblendet');
    e.confirmed = true;
    entries.push(e);
  }
  await limited(entries.filter(e => e.imagePath), async e => { e.image = await imageData(e.imagePath); delete e.imagePath; });
  for (const e of entries) if (!e.image) e.confirmed = false;
  return { kind: 'teddycloud', name: 'Aus TeddyCloud', app: 'TeddyCloud', entries, note: system ? system + ' System-Tags ausgelassen' : '' };
}

function buildUi() {
  if (!plugin || !document.getElementById('view-create') || document.getElementById('teddycloud-start')) return;
  document.body.dataset.teddycloudPlugin = 'true';
  const box = document.createElement('div'); box.className = 'teddycloud-plugin universe-section'; box.id = 'teddycloud-plugin';
  const note = document.createElement('p'); note.className = 'muted';
  note.textContent = 'Orbit läuft als TeddyCloud-Plugin und liest nur: Tags, Custom-Tonies und Katalog. Zuordnungen änderst du weiterhin in TeddyCloud.';
  const start = document.createElement('button'); start.id = 'teddycloud-start'; start.type = 'button'; start.className = 'primary';
  start.textContent = 'Tags aus TeddyCloud lesen →';
  start.onclick = () => window.OrbitExchange.present(readTags, 'Tags werden aus TeddyCloud gelesen …');
  box.append(note, start);
  if (window.top !== window) {
    // Inside TeddyCloud's frame the page grows with its content; on phones the own window is easier to use.
    const own = document.createElement('a'); own.id = 'teddycloud-own-window'; own.href = location.pathname; own.target = '_blank'; own.rel = 'noopener'; own.className = 'teddycloud-own-window';
    own.textContent = 'Orbit in eigenem Fenster öffnen ↗'; box.append(own);
  }
  const anchor = document.getElementById('exchange-start') || document.getElementById('universe-start-nfc') || document.querySelector('#view-create .universe-choices');
  (anchor || document.getElementById('view-create').lastElementChild).after(box);
}

window.OrbitTeddyCloud = { active: Boolean(plugin), base: plugin ? plugin.base : '', allowed: ALLOWED.slice(), get, readTags, prepareCatalog, assertAllowed };
if (typeof document !== 'undefined' && document.getElementById) buildUi();
})();
