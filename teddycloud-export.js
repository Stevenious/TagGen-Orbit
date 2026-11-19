/* TagGen Orbit — export for TeddyCloud's tonies.custom.json.
   Builds a ZIP with tonies.custom.json (merged with the user's existing file) and the covers
   for custom_img/orbit/. Orbit never writes to TeddyCloud itself: the user copies the files.
   Rules taken from TeddyCloud: models are named custom-<n>; pic is a path below /custom_img/;
   audio_id/hash are left empty, because catalogue IDs of real Tonies would override them. */
(function () {
'use strict';
const IMG_DIR = 'orbit';
const PIC_PREFIX = '/custom_img/' + IMG_DIR + '/';
const COVER_SIZE = 480;
const PLACEHOLDER = 'Ohne Titel'; // Orbit's name for an entry nobody has named yet
let existing = null, existingLabel = '';

/* ---------- ZIP (stored, no compression; PNGs are compressed already) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes) { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const now = new Date(), time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1),
    date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, time, true); local.setUint16(12, date, true); local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, name.length, true); local.setUint16(28, 0, true);
    parts.push(local, name, data);
    const head = new DataView(new ArrayBuffer(46));
    head.setUint32(0, 0x02014b50, true); head.setUint16(4, 20, true); head.setUint16(6, 20, true); head.setUint16(8, 0x0800, true); head.setUint16(10, 0, true);
    head.setUint16(12, time, true); head.setUint16(14, date, true); head.setUint32(16, crc, true);
    head.setUint32(20, data.length, true); head.setUint32(24, data.length, true); head.setUint16(28, name.length, true);
    head.setUint32(42, offset, true);
    central.push(head, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((s, p) => s + p.byteLength, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

/* ---------- tonies.custom.json ---------- */
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
function parseExisting(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw Error('Die Datei ist kein gültiges JSON.'); }
  if (!Array.isArray(data)) throw Error('Eine tonies.custom.json ist eine Liste ([ … ]). Diese Datei ist es nicht.');
  if (data.some(e => !e || typeof e !== 'object' || Array.isArray(e))) throw Error('Die Liste enthält Einträge, die keine Objekte sind.');
  return data;
}
const modelNumber = m => { const x = /^custom-(\d+)$/i.exec(String(m || '').trim()); return x ? Number(x[1]) : 0; };
const imageName = id => String(id).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 60) + '.png';
/* items: [{ id, series, title, uid, hasCover }] → merged list plus a report. Existing entries are kept
   unchanged; an entry Orbit exported before (recognised by its picture path) keeps its model and
   everything set in TeddyCloud (audio, tracks, language …), only names and picture are refreshed. */
function merge(current, items) {
  const result = current.map(e => ({ ...e })), byPic = new Map();
  result.forEach((e, i) => { if (typeof e.pic === 'string' && e.pic.startsWith(PIC_PREFIX)) byPic.set(e.pic, i); });
  let next = Math.max(0, ...result.map(e => modelNumber(e.model))) + 1;
  const rows = [];
  for (const item of items) {
    const series = clean(item.series, 120) || clean(item.title, 120), episodes = clean(item.title, 180);
    if (!series && !episodes) { rows.push({ item, status: 'skipped', reason: 'ohne Titel' }); continue; }
    const pic = PIC_PREFIX + imageName(item.id);
    const names = { title: episodes && episodes !== series ? series + ' - ' + episodes : series, series, episodes: episodes !== series ? episodes : '' };
    if (byPic.has(pic)) {
      const entry = result[byPic.get(pic)];
      Object.assign(entry, names); // the picture path stays: it identifies the entry, and an earlier image may still be in TeddyCloud
      rows.push({ item, model: entry.model, status: 'updated', pic: item.hasCover ? pic : '' });
    } else {
      const entry = { no: '', model: 'custom-' + next++, audio_id: [], hash: [], ...names, tracks: [], release: '0', language: '', category: '' };
      if (item.hasCover) entry.pic = pic;
      result.push(entry);
      rows.push({ item, model: entry.model, status: 'new', pic: item.hasCover ? pic : '' });
    }
  }
  return { entries: result, rows };
}
function guide(rows, collection) {
  const lines = [
    'TagGen Orbit → TeddyCloud · Titel und Bilder für eigene Tags',
    'Sammlung: ' + collection, '',
    'Orbit schreibt nichts in deine TeddyCloud. So übernimmst du die Dateien:', '',
    '1. Sicherung: Kopiere deine bisherige tonies.custom.json, bevor du sie ersetzt.',
    '2. Bilder: Den Ordner custom_img/orbit in den custom_img-Ordner von TeddyCloud kopieren',
    '   (Docker: Volume custom_img → /teddycloud/data/www/custom_img/orbit/).',
    '   Alternativ in TeddyCloud unter Bibliothek → custom_img einen Ordner „orbit“ anlegen und die Bilder hochladen.',
    '3. tonies.custom.json in den config-Ordner von TeddyCloud kopieren (Docker: /teddycloud/config/).',
    '4. In TeddyCloud die Tonies-Daten neu laden (Einstellungen → tonies.json neu laden) oder TeddyCloud neu starten.',
    '5. Tag bearbeiten → Modell: das passende custom-Modell aus der Liste unten auswählen.', '',
    'Audio-ID und Hash bleiben leer. Den Inhalt weist du wie gewohnt in TeddyCloud zu;',
    'im Modell-Editor von TeddyCloud kannst du das Audio später verknüpfen. Orbit behält das bei künftigen Exporten bei.', '',
    'Modelle:'
  ];
  for (const r of rows) {
    if (r.status === 'skipped') { lines.push('  –  übersprungen (' + r.reason + ')'); continue; }
    lines.push('  ' + r.model + '  ·  ' + [r.item.series, r.item.title].filter(Boolean).join(' – ') + (r.item.uid ? '  ·  Tag-UID ' + r.item.uid : '') + (r.status === 'updated' ? '  (aktualisiert)' : '') + (r.pic ? '' : '  (ohne Bild)'));
  }
  return lines.join('\r\n') + '\r\n';
}

/* ---------- Orbit side ---------- */
function collectionItems() {
  const snap = window.orbitCollection.snapshot();
  return { name: snap.name || 'Sammlung', items: snap.items.map(row => ({ id: row.entryId || row.id, series: row.content?.series || row.content?.design?.top || '', title: [row.content?.title, row.content?.design?.bottom].find(t => t && t !== PLACEHOLDER) || '', uid: row.tag?.uid || '', design: row.content?.design || null })) };
}
async function renderCover(design) {
  const canvas = await coverCanvas(design, COVER_SIZE);
  if (canvas.orbitExportable === false) return null;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}
async function build() {
  const { name, items } = collectionItems();
  if (!items.length) throw Error('Diese Sammlung ist leer.');
  const images = [], locked = [];
  for (const item of items) {
    item.hasCover = false;
    if (!item.design || !item.design.image && !item.design.top && !item.design.bottom) continue;
    const png = await renderCover(item.design).catch(() => null);
    if (png) { item.hasCover = true; images.push({ name: 'custom_img/' + IMG_DIR + '/' + imageName(item.id), data: png }); }
    else locked.push(item);
  }
  const merged = merge(existing || [], items);
  const files = [{ name: 'tonies.custom.json', data: JSON.stringify(merged.entries, null, 2) + '\n' }, ...images, { name: 'LIESMICH.txt', data: guide(merged.rows, name) }];
  return { blob: zip(files), name: 'orbit-teddycloud-' + filename(name) + '.zip', rows: merged.rows, locked, kept: (existing || []).length };
}

function status(message) { const el = document.getElementById('tc-export-status'); if (el) el.textContent = message; }
async function loadFromTeddyCloud() {
  const tc = window.OrbitTeddyCloud;
  if (!tc?.active) return;
  try { existing = parseExisting(JSON.stringify(await tc.get('/api/toniesCustomJson'))); existingLabel = 'aus deiner TeddyCloud'; status('Vorhandene tonies.custom.json aus deiner TeddyCloud gelesen: ' + existing.length + ' Einträge. Neue Modelle werden dahinter nummeriert.'); }
  catch (error) { status('Die vorhandene tonies.custom.json konnte nicht gelesen werden: ' + error.message); }
}
function buildUi() {
  const anchor = document.querySelector('.universe-batch-actions');
  if (!anchor || document.getElementById('tc-export')) return;
  const box = document.createElement('details'); box.id = 'tc-export'; box.className = 'universe-collection-tools tc-export';
  box.innerHTML = '<summary>Für TeddyCloud exportieren · Titel &amp; Bilder</summary><div class="details-body">'
    + '<p>Erstellt eine ZIP-Datei mit einer <code>tonies.custom.json</code> und den Covern dieser Sammlung. In TeddyCloud bekommen deine eigenen Tags damit Titel und Bild. Orbit schreibt dabei nichts in deine TeddyCloud; die Schritte stehen in der <code>LIESMICH.txt</code>.</p>'
    + '<label class="file-label">Vorhandene tonies.custom.json einbeziehen (empfohlen)<input id="tc-export-existing" type="file" accept="application/json,.json"></label>'
    + '<small class="muted">Damit bleiben deine bisherigen Einträge erhalten und neue Modelle bekommen freie Nummern. Ohne Datei beginnt die Nummerierung bei custom-1.</small>'
    + '<div class="row"><button id="tc-export-build" type="button" class="primary">ZIP für TeddyCloud erstellen</button></div>'
    + '<small id="tc-export-status" class="muted" role="status" aria-live="polite">Noch keine vorhandene Datei geladen.</small></div>';
  anchor.after(box);
  document.getElementById('tc-export-existing').onchange = async event => {
    const file = event.target.files[0]; event.target.value = '';
    if (!file) return;
    try { existing = parseExisting(await file.text()); existingLabel = file.name; status('„' + file.name + '“ geladen: ' + existing.length + ' Einträge bleiben erhalten.'); }
    catch (error) { existing = null; status(error.message); }
  };
  const button = document.getElementById('tc-export-build');
  button.onclick = async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      const r = await build();
      saveBlob(r.blob, r.name);
      const count = s => r.rows.filter(x => x.status === s).length;
      status('✓ ' + r.name + ' erstellt · ' + count('new') + ' neu, ' + count('updated') + ' aktualisiert' + (r.kept ? ', aus ' + existingLabel + ' übernommen: ' + r.kept : '') + (count('skipped') ? ', ' + count('skipped') + ' ohne Titel übersprungen' : '') + (r.locked.length ? '. ' + r.locked.length + ' Cover ohne Bild: Online-Bildquelle ohne Exportfreigabe, bitte als eigenes Bild hochladen.' : '.'));
    } catch (error) { status(error.message); } finally { button.disabled = false; }
  };
  box.addEventListener('toggle', () => { if (box.open && !existing) loadFromTeddyCloud(); });
}

window.OrbitTeddyCloudExport = { zip, crc32, merge, parseExisting, guide, build, PIC_PREFIX };
if (typeof document !== 'undefined' && document.querySelector) buildUi();
})();
