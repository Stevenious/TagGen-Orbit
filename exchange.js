/* TagGen Orbit — Import aus TeddyStudio.
   Liest das Austauschformat taggen-exchange v1 (exchange/SCHEMA.md) sowie die heutigen
   TeddyStudio-Exporte (Cover-Manifest, optional Sammlung.json, dazu die Coverbilder).
   Alles geschieht im Browser. Nichts wird verändert, bis „Übernehmen“ gewählt wird. */
(function () {
'use strict';
const MAX_FILE = 60e6, MAX_IMAGE_CHARS = 4e6, MAX_ENTRIES = 500, IMAGE_EDGE = 800;
const KEY_RE = /^(model:[A-Za-z0-9._-]{1,160}|audio:[A-Za-z0-9._-]{1,100}:[0-9a-fA-F]{40}|local:[0-9a-f]{24}|tag:[0-9a-f]{16})$/;
const MODEL_RE = /^[A-Za-z0-9._-]{1,160}$/, UID_RE = /^[0-9A-F]{2}( [0-9A-F]{2}){7}$/, RUID_RE = /^[0-9a-f]{16}$/;
const DATA_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/;
const CARRIERS = [['capsule43', '43-mm-Kapsel'], ['customTag', 'Custom Tag'], ['creativeTonie', 'Kreativ-Tonie'], ['customFigure', 'Custom-Figur'], ['unknown', 'Unbekannt']];
const STATUS = { new: 'neu', existing: 'bereits vorhanden', conflict: 'Konflikt', broken: 'fehlerhaft' };

const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const ruidFromUid = uid => uid.split(' ').reverse().join('').toLowerCase();
const uidFromRuid = ruid => ruid.match(/../g).reverse().join(' ').toUpperCase();
const baseName = path => text(path, 1000).split(/[\\/]/).pop() || '';

/* ---------- Pure parsing: no DOM, no storage (also used by the tests) ---------- */
function blankEntry() {
  return { key: '', title: '', series: '', episode: null, language: 'de', model: '', audioIds: [], hashes: [], nfcUid: '', ruid: '',
    image: '', imageFile: null, imageName: '', imageSource: '', confirmed: false, errors: [], warnings: [], status: 'new', reason: '', selected: false };
}
function checkTag(entry, tag) {
  if (!tag || typeof tag !== 'object') return;
  const uid = text(tag.nfcUid, 30).toUpperCase(), ruid = text(tag.ruid, 20).toLowerCase();
  if (uid && !UID_RE.test(uid)) entry.errors.push('Tag-UID hat ein ungültiges Format');
  if (ruid && !RUID_RE.test(ruid)) entry.errors.push('TeddyCloud-Tag-Nummer (RUID) ist ungültig');
  if (uid && ruid && UID_RE.test(uid) && RUID_RE.test(ruid) && ruidFromUid(uid) !== ruid) entry.errors.push('RUID passt nicht zur Tag-UID');
  entry.nfcUid = UID_RE.test(uid) ? uid : (RUID_RE.test(ruid) ? uidFromRuid(ruid) : '');
  entry.ruid = entry.nfcUid ? ruidFromUid(entry.nfcUid) : '';
}
function parseExchange(raw) {
  if (!raw || raw.format !== 'taggen-exchange') throw Error('Keine taggen-exchange-Datei.');
  if (raw.version !== 1) throw Error('Version ' + raw.version + ' wird nicht unterstützt (erwartet: 1).');
  if (!Array.isArray(raw.entries)) throw Error('Die Datei enthält keine Einträge.');
  if (raw.entries.length > MAX_ENTRIES) throw Error('Zu viele Einträge (maximal ' + MAX_ENTRIES + ').');
  const images = raw.images && typeof raw.images === 'object' ? raw.images : {};
  const entries = raw.entries.map(item => {
    const e = blankEntry();
    if (!item || typeof item !== 'object') { e.errors.push('Eintrag ist kein Objekt'); return e; }
    e.key = text(item.key, 300); e.title = text(item.title, 180); e.series = text(item.series, 120);
    e.episode = Number.isInteger(item.episode) && item.episode >= 0 ? item.episode : null;
    e.language = text(item.language, 10) || 'de';
    if (!KEY_RE.test(e.key)) e.errors.push('Schlüssel fehlt oder ist ungültig');
    if (!e.title) e.errors.push('Titel fehlt');
    const tc = item.teddycloud && typeof item.teddycloud === 'object' ? item.teddycloud : {};
    const model = text(tc.model, 160);
    if (model && MODEL_RE.test(model)) e.model = model; else if (model) e.warnings.push('Modellkennung ignoriert (ungültig)');
    e.audioIds = Array.isArray(tc.audioIds) ? tc.audioIds.slice(0, 30).map(x => text(String(x), 100)).filter(Boolean) : [];
    e.hashes = Array.isArray(tc.hashes) ? tc.hashes.slice(0, 30).map(x => text(x, 40)).filter(x => /^[0-9a-fA-F]{40}$/.test(x)) : [];
    if (!e.model && e.key.startsWith('model:')) e.model = e.key.slice(6);
    const cover = item.cover && typeof item.cover === 'object' ? item.cover : {};
    const ref = text(cover.imageRef, 100);
    if (ref) {
      const image = images[ref];
      if (!image || typeof image.data !== 'string') e.errors.push('Coverbild fehlt in der Datei');
      else if (image.data.length > MAX_IMAGE_CHARS || !DATA_RE.test(image.data)) e.errors.push('Coverbild ist kein PNG/JPEG/WebP oder zu groß');
      else { e.image = image.data; e.imageSource = text(image.source || cover.source, 80); }
    }
    e.confirmed = Boolean(e.image) && cover.confirmed !== false;
    if (raw.meta?.privacy !== 'public') checkTag(e, item.tag);
    return e;
  });
  return { kind: 'exchange', name: text(raw.meta?.collection, 80) || 'TeddyStudio-Import', app: text(raw.meta?.app, 40), entries };
}
function classifyJson(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && value.format === 'taggen-exchange') return 'exchange';
  if (Array.isArray(value) && value.length && value.every(x => x && typeof x === 'object')) {
    if (value.some(x => Array.isArray(x.tracks))) return 'collection';
    if (value.some(x => 'cover' in x || 'folder' in x)) return 'manifest';
  }
  return 'unknown';
}
/* manifest: TeddyStudio Cover-Manifest rows; books: optional TeddyStudio Sammlung.json; files: selected image files. */
function parseTeddyStudio(manifest, books, files) {
  const rows = Array.isArray(manifest) && manifest.length ? manifest : (books || []);
  if (!rows.length) throw Error('Keine TeddyStudio-Einträge gefunden.');
  if (rows.length > MAX_ENTRIES) throw Error('Zu viele Einträge (maximal ' + MAX_ENTRIES + ').');
  const byId = new Map((books || []).filter(b => b && typeof b.id === 'string').map(b => [b.id, b]));
  const names = new Map();
  for (const row of rows) { const n = baseName(row?.cover).toLowerCase(); if (n) names.set(n, (names.get(n) || 0) + 1); }
  const pictures = new Map();
  for (const file of files || []) { const n = file.name.toLowerCase(); pictures.set(n, pictures.has(n) ? null : file); }
  const entries = rows.map(row => {
    const e = blankEntry();
    if (!row || typeof row !== 'object') { e.errors.push('Eintrag ist kein Objekt'); return e; }
    const book = byId.get(row.id) || (row.tracks ? row : null);
    e.title = text(row.title || book?.title, 180); e.series = text(row.series || book?.series, 120);
    if (!e.title) e.errors.push('Titel fehlt');
    const model = text(book?.remote_model, 160);
    if (model && MODEL_RE.test(model)) e.model = model;
    const id = text(row.id, 40);
    e.key = e.model ? 'model:' + e.model : (/^[0-9a-f]{24}$/.test(id) ? 'local:' + id : '');
    if (!e.key) e.errors.push('Weder TeddyCloud-Modell noch gültige TeddyStudio-ID');
    if (book) { e.episode = Number.isInteger(book.episode) ? book.episode : null; e.language = text(book.language, 10) || 'de'; }
    const path = text(row.cover, 1000), name = baseName(path);
    e.imageSource = text(row.source || book?.cover_source, 80);
    if (!path) e.warnings.push('Kein Cover in TeddyStudio zugeordnet');
    else if (/^https?:\/\//i.test(path)) e.warnings.push('Online-Bild wird nicht geladen – Cover später wählen');
    else if ((names.get(name.toLowerCase()) || 0) > 1) e.warnings.push('Bildname „' + name + '“ ist mehrdeutig – ohne Cover übernommen');
    else {
      const file = pictures.get(name.toLowerCase());
      if (file) { e.imageFile = file; e.imageName = name; }
      else if (file === null) e.warnings.push('„' + name + '“ wurde mehrfach ausgewählt – ohne Cover übernommen');
      else e.warnings.push('Bild „' + name + '“ nicht ausgewählt – ohne Cover übernommen');
    }
    e.confirmed = book ? book.cover_confirmed !== false : true;
    return e;
  });
  return { kind: 'teddystudio', name: 'TeddyStudio-Import', app: 'TeddyStudio', entries };
}
/* Marks duplicates inside the file and compares against every collection of the library. */
function classify(entries, library) {
  const keys = new Map(), uids = new Map();
  for (const item of library) {
    const key = item.content?.design?.source?.key || '';
    if (key.startsWith('exchange:')) keys.set(key.slice(9), item);
    if (item.tag?.uid) uids.set(item.tag.uid, item);
  }
  const seenKeys = new Set(), seenUids = new Set();
  for (const e of entries) {
    if (e.key && seenKeys.has(e.key)) e.errors.push('Schlüssel kommt in der Datei mehrfach vor');
    if (e.key) seenKeys.add(e.key);
    if (e.nfcUid && seenUids.has(e.nfcUid)) e.errors.push('Tag-UID kommt in der Datei mehrfach vor');
    if (e.nfcUid) seenUids.add(e.nfcUid);
    const known = keys.get(e.key), owner = e.nfcUid ? uids.get(e.nfcUid) : null;
    if (e.errors.length) { e.status = 'broken'; e.reason = e.errors.join(' · '); }
    else if (known) { e.status = 'existing'; e.reason = 'schon in „' + known.collectionName + '“'; }
    else if (owner && e.key.startsWith('tag:')) { e.status = 'existing'; e.reason = 'Tag schon in „' + owner.collectionName + '“ als „' + (owner.content?.title || 'Eintrag') + '“'; }
    else if (owner) { e.status = 'conflict'; e.reason = 'Tag-UID gehört zu „' + (owner.content?.title || 'Eintrag') + '“ in „' + owner.collectionName + '“ – Übernahme ohne Tag'; }
    else { e.status = 'new'; e.reason = e.warnings.join(' · '); }
    e.selected = e.status === 'new';
  }
  return entries;
}
function counts(entries) { const out = { new: 0, existing: 0, conflict: 0, broken: 0, selected: 0 }; for (const e of entries) { out[e.status]++; if (e.selected) out.selected++; } return out; }
function toRow(e, carrier, preset) {
  const design = Core.validateDesign({ ...Core.initialDesign(), top: e.series, bottom: e.title, audioId: e.audioIds[0] || '', image: e.image || '',
    source: { key: 'exchange:' + e.key, series: e.series, title: e.title, language: e.language, model: e.model, source: 'teddystudio', audioIds: e.audioIds, pictures: [] } });
  return { title: e.title, series: e.series, design, confirmed: Boolean(e.image) && e.confirmed, uid: e.status === 'conflict' ? '' : e.nfcUid, carrier, preset };
}

/* ---------- Browser helpers ---------- */
function readFile(file, as) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(Error('Datei konnte nicht gelesen werden.')); as === 'text' ? r.readAsText(file) : r.readAsDataURL(file); });
}
/* Large covers are reduced so the library stays small (browser storage is limited, especially on iPhone). */
function shrink(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const edge = Math.max(img.naturalWidth, img.naturalHeight);
      if (edge <= IMAGE_EDGE && dataUrl.length < 1.2e6) return resolve(dataUrl);
      const scale = Math.min(1, IMAGE_EDGE / edge), canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve('');
    img.src = dataUrl;
  });
}
async function loadFiles(fileList) {
  const files = [...fileList];
  if (!files.length) throw Error('Keine Dateien ausgewählt.');
  if (files.some(f => f.size > MAX_FILE)) throw Error('Eine Datei ist größer als 60 MB.');
  const jsons = files.filter(f => /\.json$/i.test(f.name) || f.type === 'application/json');
  const images = files.filter(f => /^image\/(png|jpeg|webp)$/.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name));
  if (!jsons.length) throw Error('Bitte eine JSON-Datei mitwählen (Austauschdatei oder TeddyStudio-Cover-Manifest).');
  const parsed = [];
  for (const f of jsons) { let value; try { value = JSON.parse(await readFile(f, 'text')); } catch { throw Error('„' + f.name + '“ ist kein gültiges JSON.'); } parsed.push({ name: f.name, kind: classifyJson(value), value }); }
  const exchange = parsed.filter(p => p.kind === 'exchange');
  let result;
  if (exchange.length > 1) throw Error('Bitte nur eine Austauschdatei auf einmal laden.');
  if (exchange.length) result = parseExchange(exchange[0].value);
  else {
    const manifest = parsed.find(p => p.kind === 'manifest'), books = parsed.find(p => p.kind === 'collection');
    const unknown = parsed.find(p => p.kind === 'unknown');
    if (!manifest && !books) throw Error('„' + (unknown?.name || jsons[0].name) + '“ ist weder eine Austauschdatei noch ein TeddyStudio-Export.');
    result = parseTeddyStudio(manifest?.value, books?.value, images);
  }
  for (const e of result.entries) {
    if (e.imageFile) { try { e.image = await shrink(await readFile(e.imageFile, 'url')); } catch { e.image = ''; } if (!e.image) { e.warnings.push('Bild „' + e.imageName + '“ nicht lesbar – ohne Cover übernommen'); } }
    else if (e.image) { const small = await shrink(e.image); if (small) e.image = small; else { e.image = ''; e.errors.push('Coverbild nicht lesbar'); } }
    e.imageFile = null;
    if (!e.image) e.confirmed = false;
  }
  if (exchange.length && parsed.length > 1) result.note = 'Zusätzliche JSON-Dateien wurden ignoriert, die Austauschdatei hat Vorrang.';
  return result;
}

/* ---------- User interface (Erstellen → TeddyStudio-Import) ---------- */
const el = id => document.getElementById(id);
const api = () => window.orbitCollection;
const node = (tag, value, cls) => { const n = document.createElement(tag); if (value !== undefined) n.textContent = value; if (cls) n.className = cls; return n; };
const view = { result: null, busy: false, filter: 'all' };

function buildPanel() {
  if (el('exchange-import') || !el('view-create')) return;
  const start = node('button', 'Aus TeddyStudio importieren →', 'quiet universe-section'); start.id = 'exchange-start'; start.type = 'button';
  const anchor = el('universe-start-nfc') || el('view-create').lastElementChild; anchor.after(start);
  const section = node('section', undefined, 'panel universe-section exchange-panel'); section.id = 'exchange-import'; section.hidden = true;
  section.innerHTML = '<div class="panel-body"><h2 id="exchange-title">TeddyStudio-Import</h2>'
    + '<p class="universe-lead">Laden, prüfen, übernehmen. Bis zum Übernehmen bleibt deine Bibliothek unverändert.</p>'
    + '<label class="file-label">Dateien auswählen<input id="exchange-files" type="file" multiple accept=".json,application/json,image/png,image/jpeg,image/webp"></label>'
    + '<small class="muted">Entweder eine Austauschdatei (taggen-exchange) · oder das TeddyStudio-Cover-Manifest, optional mit Sammlung.json, zusammen mit den Coverbildern.</small>'
    + '<p id="exchange-status" class="status" role="status" aria-live="polite"></p>'
    + '<div id="exchange-filter" class="universe-filter exchange-filter" hidden></div>'
    + '<div id="exchange-list" class="exchange-list"></div>'
    + '<div id="exchange-options" class="exchange-options" hidden>'
    + '<label>Ziel<select id="exchange-target"></select></label>'
    + '<label>Name der neuen Sammlung<input id="exchange-name" type="text" maxlength="70"></label>'
    + '<label>Druckformat<select id="exchange-preset"></select></label>'
    + '<label>Träger<select id="exchange-carrier"></select></label></div>'
    + '<div class="row"><button id="exchange-apply" class="primary" type="button" disabled>Übernehmen</button><button id="exchange-cancel" type="button">Abbrechen</button></div>'
    + '<small class="muted">Orbit übernimmt Titel, Serie, Cover, Modellkennung, Audio-ID und Tag-UID. Audio, TeddyCloud-Einstellungen und Dateipfade werden nicht gelesen oder verändert.</small></div>';
  (el('universe-batch') || start).after(section);
  start.onclick = () => { section.hidden = false; section.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  el('exchange-files').onchange = async event => { const files = [...event.target.files]; event.target.value = ''; await load(files); };
  el('exchange-cancel').onclick = reset;
  el('exchange-apply').onclick = apply;
  el('exchange-target').onchange = syncOptions;
  for (const [value, label] of CARRIERS) { const o = node('option', label); o.value = value; el('exchange-carrier').append(o); }
}
function presetOptions() {
  const select = el('exchange-preset'); if (select.options.length) return;
  const source = el('universe-batch-format') || el('collection-format');
  for (const option of source?.options || []) { const o = node('option', option.textContent); o.value = option.value; select.append(o); }
  if (!select.options.length) for (const key of Object.keys(Core.presets)) { const o = node('option', key); o.value = key; select.append(o); }
  select.value = [...select.options].some(o => o.value === 'capsule43') ? 'capsule43' : select.options[0]?.value;
}
function reset() { view.result = null; view.filter = 'all'; el('exchange-list').replaceChildren(); el('exchange-status').textContent = ''; el('exchange-filter').hidden = true; el('exchange-options').hidden = true; el('exchange-apply').disabled = true; el('exchange-import').hidden = true; }
async function load(files) { await present(() => loadFiles(files), 'Dateien werden geprüft …'); }
/* Shared entry point: any source (files, TeddyCloud plugin) delivers a parsed result for the same preview. */
async function present(produce, message) {
  if (view.busy) return; view.busy = true; buildPanel(); el('exchange-import').hidden = false; el('exchange-status').textContent = message || 'Wird geprüft …';
  try {
    const result = await produce();
    classify(result.entries, api().entries ? api().entries() : []);
    view.result = result; view.filter = 'all'; presetOptions();
    el('exchange-name').value = result.name;
    render(); el('exchange-import').scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  } catch (error) { view.result = null; el('exchange-list').replaceChildren(); el('exchange-options').hidden = true; el('exchange-filter').hidden = true; el('exchange-apply').disabled = true; el('exchange-status').textContent = error.message; }
  finally { view.busy = false; }
}
function targetChoices(selectedCount) {
  const select = el('exchange-target'), before = select.value; select.replaceChildren();
  const chunks = Math.max(1, Math.ceil(selectedCount / 12));
  const fresh = node('option', chunks > 1 ? 'Neue Sammlungen (' + chunks + ' × bis zu 12)' : 'Neue Sammlung'); fresh.value = 'new'; select.append(fresh);
  const info = api().library ? api().library() : null;
  for (const m of info?.collections || []) { const free = 12 - m.count; const o = node('option', m.name + ' · ' + free + ' frei'); o.value = m.id; o.disabled = free < selectedCount || selectedCount === 0; select.append(o); }
  select.value = [...select.options].some(o => o.value === before && !o.disabled) ? before : 'new';
}
function syncOptions() { el('exchange-name').closest('label').hidden = el('exchange-target').value !== 'new'; }
function render() {
  const result = view.result; if (!result) return;
  const c = counts(result.entries);
  el('exchange-title').textContent = result.kind === 'teddycloud' ? 'Tags aus TeddyCloud' : 'TeddyStudio-Import';
  el('exchange-status').textContent = result.entries.length + ' Einträge aus ' + (result.kind === 'exchange' ? 'der Austauschdatei' : result.kind === 'teddycloud' ? 'deiner TeddyCloud' : 'dem TeddyStudio-Export')
    + ' · ' + c.new + ' neu · ' + c.existing + ' bereits vorhanden · ' + c.conflict + ' Konflikt · ' + c.broken + ' fehlerhaft' + (result.note ? ' · ' + result.note : '');
  const filter = el('exchange-filter'); filter.replaceChildren(); filter.hidden = false;
  for (const [key, label] of [['all', 'Alle'], ['new', 'Neu'], ['existing', 'Vorhanden'], ['conflict', 'Konflikte'], ['broken', 'Fehlerhaft']]) {
    const b = node('button', label + (key === 'all' ? '' : ' (' + c[key] + ')')); b.type = 'button'; b.setAttribute('aria-pressed', String(view.filter === key)); b.onclick = () => { view.filter = key; render(); }; filter.append(b);
  }
  const list = el('exchange-list'); list.replaceChildren();
  result.entries.forEach((e, index) => {
    if (view.filter !== 'all' && e.status !== view.filter) return;
    const row = node('label', undefined, 'exchange-row exchange-' + e.status); row.dataset.exchangeIndex = String(index);
    const box = node('input'); box.type = 'checkbox'; box.checked = e.selected; box.disabled = e.status === 'broken'; box.setAttribute('aria-label', (e.title || 'Eintrag') + ' übernehmen');
    box.onchange = () => { e.selected = box.checked; render(); };
    const thumb = node('span', undefined, 'exchange-thumb'); if (e.image) { const img = node('img'); img.src = e.image; img.alt = ''; thumb.append(img); } else thumb.textContent = '◌';
    const copy = node('span', undefined, 'exchange-copy');
    copy.append(node('strong', e.title || 'Ohne Titel'), node('small', [e.series, e.episode !== null ? 'Folge ' + e.episode : '', e.model ? 'Modell ' + e.model : '', e.nfcUid ? 'Tag ' + e.nfcUid : ''].filter(Boolean).join(' · ')));
    if (e.reason) copy.append(node('small', e.reason, 'exchange-reason'));
    row.append(box, thumb, copy, node('span', STATUS[e.status], 'exchange-chip'));
    list.append(row);
  });
  targetChoices(c.selected); syncOptions(); el('exchange-options').hidden = false;
  el('exchange-apply').disabled = !c.selected; el('exchange-apply').textContent = c.selected ? 'Übernehmen (' + c.selected + ')' : 'Übernehmen';
}
async function apply() {
  const result = view.result; if (!result || view.busy) return;
  const chosen = result.entries.filter(e => e.selected && e.status !== 'broken'); if (!chosen.length) return;
  const target = el('exchange-target').value, preset = el('exchange-preset').value, carrier = el('exchange-carrier').value;
  const name = el('exchange-name').value.trim() || result.name;
  const conflicts = chosen.filter(e => e.status === 'conflict').length, existing = chosen.filter(e => e.status === 'existing').length;
  const where = target === 'new' ? (chosen.length > 12 ? Math.ceil(chosen.length / 12) + ' neue Sammlungen „' + name + '“' : 'die neue Sammlung „' + name + '“') : 'die gewählte Sammlung';
  if (!await ask(chosen.length + ' Einträge übernehmen?', 'Sie kommen in ' + where + '.' + (existing ? ' ' + existing + ' davon gibt es schon – sie werden zusätzlich angelegt.' : '') + (conflicts ? ' ' + conflicts + ' Konflikt-Einträge kommen ohne Tag-UID.' : '') + ' Vorhandene Einträge bleiben unverändert.')) return;
  view.busy = true;
  try {
    const rows = chosen.map(e => toRow(e, carrier, preset));
    const done = api().importRows(rows, { target, name, preset });
    toast('✓ ' + done.entries + ' Einträge übernommen' + (done.collections > 1 ? ' · ' + done.collections + ' Sammlungen' : '') + '.');
    view.busy = false; reset(); go('collection');
  } catch (error) { toast('Import nicht möglich: ' + error.message); }
  finally { view.busy = false; }
}

window.OrbitExchange = { parseExchange, parseTeddyStudio, classify, classifyJson, counts, toRow, ruidFromUid, uidFromRuid, loadFiles, present, blankEntry, shrink };
if (typeof document !== 'undefined' && document.getElementById) buildPanel();
})();
