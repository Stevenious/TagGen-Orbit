/* TagGen Orbit — Cover-Hilfen im Studio.
   „Farben aus Motiv“ (Color Thief, MIT) und „Ausschnitt vorschlagen“ (smartcrop.js, MIT).
   Beide setzen nur Werte, die man auch von Hand einstellen kann (Akzent, Hintergrund,
   Motivgröße, Position), und lassen sich mit „Rückgängig“ zurücknehmen.
   Die Bibliotheken liegen in vendor/ und werden erst beim ersten Klick geladen. */
(function () {
'use strict';
const TEXT_DARK = '#172033';   // colour of the bottom text in Orbit's cover renderer
const LIMITS = { zoom: [40, 180], x: [-25, 25], y: [-25, 25] };
const scripts = new Map();
let undo = null;

function loadScript(src) {
  if (!scripts.has(src)) scripts.set(src, new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = resolve; s.onerror = () => { scripts.delete(src); reject(Error('Hilfsbibliothek konnte nicht geladen werden.')); };
    document.head.append(s);
  }));
  return scripts.get(src);
}

/* ---------- Colours: pure helpers (also used by the tests) ---------- */
const hex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const rgbOf = value => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
function luminance(value) {
  const [r, g, b] = rgbOf(value).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const mix = (a, b, t) => hex(rgbOf(a).map((v, i) => v + (rgbOf(b)[i] - v) * t));
/* Background must keep the dark title readable; the accent (series text) must stand out from it. */
function chooseColors(dominant, swatches, palette) {
  const list = [dominant, swatches.LightMuted, swatches.LightVibrant, ...palette].filter(Boolean);
  let background = list.find(c => contrast(c, TEXT_DARK) >= 4.5);
  if (!background) { background = dominant || '#ffffff'; for (let t = 0.1; t <= 1 && contrast(background, TEXT_DARK) < 4.5; t += 0.1) background = mix(dominant, '#ffffff', t); }
  const candidates = [swatches.Vibrant, swatches.DarkVibrant, swatches.Muted, swatches.DarkMuted, ...palette].filter(Boolean)
    .filter(c => c.toLowerCase() !== background.toLowerCase());
  let accent = candidates.find(c => contrast(c, background) >= 3);
  if (!accent && candidates.length) { accent = candidates[0]; for (let t = 0.1; t <= 1 && contrast(accent, background) < 3; t += 0.1) accent = mix(candidates[0], '#000000', t); }
  if (!accent || contrast(accent, background) < 3) accent = TEXT_DARK;
  return { accent, background };
}

/* ---------- Crop: map a crop rectangle (image pixels) to Orbit's zoom / x / y ---------- */
const clamp = (v, [lo, hi]) => Math.round(Math.max(lo, Math.min(hi, v)));
/* Mirrors coverCanvas()/drawSquare() with size = 1: the area the motif should fill and its base scale. */
function frame(d, iw, ih) {
  if (d.shape !== 'square') return { w: 0.64, h: 0.64, base: 0.64 / Math.max(iw, ih) };
  const full = d.fit === 'cover';
  const top = d.top ? 0.14 : 0, bottom = (d.bottom ? 0.19 : 0) + (d.showId && d.audioId ? 0.06 : 0);
  const w = full ? 1 : 0.88, h = full ? 1 : Math.max(0.2, 1 - top - bottom - 0.08);
  return { w, h, base: full ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih) };
}
function placement(d, iw, ih, crop) {
  const f = frame(d, iw, ih);
  const zoom = clamp(100 * (f.w / crop.width) / f.base, LIMITS.zoom);
  const scale = f.base * zoom / 100, cx = crop.x + crop.width / 2, cy = crop.y + crop.height / 2;
  return { zoom, x: clamp(100 * scale * (iw / 2 - cx), LIMITS.x), y: clamp(100 * scale * (ih / 2 - cy), LIMITS.y) };
}

/* ---------- Studio actions ---------- */
async function readableImage() {
  const src = state.design?.image;
  if (!src) throw Error('Erst ein Motiv wählen oder ein eigenes Bild hinzufügen.');
  const image = await getImage(src);
  if (!image) throw Error('Das Motiv konnte nicht geladen werden.');
  if (displayOnlyImages.has(image)) throw Error('Diese Bildquelle erlaubt kein Auslesen. Lade das Bild als eigenes Bild hoch, dann klappt es.');
  return image;
}
function remember(label, keys) {
  const d = state.design;
  undo = { design: d, label, values: Object.fromEntries(keys.map(k => [k, d[k]])) };
}
function apply(values) { Object.assign(state.design, values); syncControls(); readControls(); }
function status(message) { const el = document.getElementById('assist-status'); if (el) el.textContent = message; refresh(); }
async function run(button, work) {
  if (button.disabled) return;
  button.disabled = true;
  try { await work(); } catch (error) { status(error.message); } finally { button.disabled = false; refresh(); }
}
async function colorsFromMotif() {
  const image = await readableImage();
  await loadScript('./vendor/color-thief.js');
  const CT = window.ColorThief;
  const palette = (CT.getPaletteSync(image, { colorCount: 8, quality: 5, ignoreWhite: false }) || []).map(c => c.hex());
  const sw = CT.getSwatchesSync(image, { quality: 5, ignoreWhite: false }) || {};
  const swatches = Object.fromEntries(Object.entries(sw).map(([k, v]) => [k, v ? v.color.hex() : null]));
  if (!palette.length) throw Error('Im Motiv wurden keine Farben gefunden.');
  const chosen = chooseColors(palette[0], swatches, palette);
  remember('Farben', ['accent', 'background']);
  apply(chosen);
  status('Farben aus dem Motiv übernommen: Akzent ' + chosen.accent + ', Hintergrund ' + chosen.background + '.');
}
async function suggestCrop() {
  const image = await readableImage();
  await loadScript('./vendor/smartcrop.js');
  const d = state.design, iw = image.naturalWidth, ih = image.naturalHeight, f = frame(d, iw, ih);
  const result = await window.smartcrop.crop(image, { width: Math.round(f.w * 1000), height: Math.round(f.h * 1000), minScale: 0.6 });
  if (!result?.topCrop) throw Error('Für dieses Motiv wurde kein Ausschnitt gefunden.');
  const values = placement(d, iw, ih, result.topCrop);
  remember('Ausschnitt', ['zoom', 'x', 'y']);
  apply(values);
  status('Ausschnitt vorgeschlagen: Motivgröße ' + values.zoom + ' %. Feinkorrektur mit den Reglern.');
}
function revert() {
  if (!undo || undo.design !== state.design) return refresh();
  const label = undo.label; apply(undo.values); undo = null; status(label + ' zurückgesetzt.');
}
/* The Universe layer moves the classic controls into the collapsed "Feinabstimmung · Pro" section;
   the helpers belong to the always visible quick settings next to the style buttons. */
function place() {
  const box = document.getElementById('cover-assist'), smart = document.getElementById('universe-smart');
  if (box && smart && box.parentElement !== smart) smart.append(box);
}
function refresh() {
  place();
  const back = document.getElementById('assist-undo'); if (!back) return;
  const valid = undo && undo.design === state.design;
  if (!valid) undo = null;
  back.hidden = !valid;
  if (valid) back.textContent = '↶ ' + undo.label + ' rückgängig';
  const has = Boolean(state.design?.image);
  for (const id of ['assist-colors', 'assist-crop']) { const b = document.getElementById(id); if (b) b.dataset.ready = String(has); }
}

function buildUi() {
  const accent = document.getElementById('accent');
  if (!accent || document.getElementById('cover-assist')) return;
  const group = accent.closest('.control-group') || accent.parentElement;
  const box = document.createElement('div'); box.id = 'cover-assist'; box.className = 'cover-assist';
  box.innerHTML = '<div class="row"><button id="assist-colors" type="button">Farben aus Motiv</button><button id="assist-crop" type="button">Ausschnitt vorschlagen</button><button id="assist-undo" type="button" class="quiet" hidden></button></div><small id="assist-status" class="muted" role="status" aria-live="polite">Automatische Vorschläge für Farben und Bildausschnitt – rückgängig machbar.</small>';
  group.append(box);
  document.getElementById('assist-colors').onclick = e => run(e.currentTarget, colorsFromMotif);
  document.getElementById('assist-crop').onclick = e => run(e.currentTarget, suggestCrop);
  document.getElementById('assist-undo').onclick = revert;
  // A different motif or entry makes an old undo meaningless; check whenever the user interacts.
  document.addEventListener('click', refresh, true);
  document.addEventListener('input', refresh, true);
  refresh();
}

window.OrbitCoverAssist = { chooseColors, contrast, placement, frame, colorsFromMotif, suggestCrop, revert };
if (typeof document !== 'undefined' && document.getElementById) buildUi();
})();
