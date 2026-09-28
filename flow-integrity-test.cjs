// Run with: node flow-integrity-test.cjs
// Exercises the real inline collection code with a small DOM fixture; no network or NFC hardware.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const block = (start, end) => {
  const a = html.indexOf(start);
  assert(a >= 0, `Missing ${start}`);
  const b = html.indexOf(end, a + start.length);
  assert(b >= 0, `Missing end of ${start}`);
  return html.slice(a, b + end.length);
};
// Keep syntax validation separate from DOM execution.
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new vm.Script(match[1]);
}

const coreCode = block('const Core = (() => {', '\n})();');
const collectionCode = block('(function(){\n const KEY=', '\n})();');
class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.value = '';
    this.hidden = false;
    this.classList = { contains: () => false, add() {}, remove() {} };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute() {}
  querySelector() { return null; }
  focus() {}
}
const elements = new Map();
const get = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
get('collection-format').value = 'capsule43';
const storage = new Map();
const ctx = {
  URL, console, structuredClone, Object, Array, Set, Map, Date, Math,
  document: { getElementById: get, createElement: tag => new Element(tag), activeElement: null },
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  window: { addEventListener() {} },
  state: { items: [], results: [], page: 0, pageSize: 8, slots: Array(12).fill(null),
    design: null, preset: 'capsule43', geometry: null, calibration: { x: 0, y: 0 },
    dump: null, dumpText: '', dumpName: '' },
  toast() {}, ask: async () => true, go() {}, step() {}, search() {},
  syncControls() {}, populateArt() {}, renderEditor() {}, updateBridge() {},
  showDump() {}, findDumps() {}, checkpoint() {}, syncCalibration() {},
  renderSheet: async () => {}, paperMode: () => get('print-side').value === 'front' ? 'front' : 'duplex',
  filename: x => x, saveJSON() {}, portableDesign: async x => x,
  formatNotes: { capsule43: '43 mm' },
  dumpCoverTitle: x => x, dumpTitleVariants: x => [x], saveBlob() {},
};
vm.createContext(ctx);
vm.runInContext(coreCode + '\nthis.Core=Core;', ctx);
const design = { ...ctx.Core.initialDesign(), top: 'Serie', bottom: 'Folge', audioId: 'audio-17',
  image: 'https://example.org/cover.png', source: {
    key: 'catalog-key-17', title: 'Folge', series: 'Serie', audioIds: ['audio-17'],
    language: 'de', pictures: [{ url: 'https://example.org/cover.png', label: 'Cover' }]
  }
};
ctx.state.design = structuredClone(design);
ctx.state.geometry = ctx.Core.geometry(ctx.Core.presets.capsule43);
const old = { format: 'orbit-collection', version: 2, name: 'Alt', preset: 'capsule43',
  items: [{ id: 'item-legacy', place: 0, confirmed: true, title: 'Folge', series: 'Serie',
    design, uid: '', dumpText: '', dumpName: '' }] };
storage.set('taggen-orbit-collection-v1', JSON.stringify(old));
vm.runInContext(collectionCode, ctx);
const api = ctx.window.orbitCollection;
let snapshot = api.snapshot();
assert.equal(snapshot.items[0].entryId, 'item-legacy');
assert.equal(snapshot.items[0].tag.uid, '');
assert.equal(snapshot.items[0].content.design.source.key, 'catalog-key-17');
assert.equal(snapshot.items[0].content.design.audioId, 'audio-17');
assert.equal(snapshot.items[0].physical.type, 'capsule43');
assert.equal(api.flowProbe('catalog-key-17').valid, true);
const v1 = { format: 'orbit-collection', version: 1, items: [
  { id: 'item-v1', confirmed: true, title: 'Alt', series: 'Serie', design, uid: '' }
] };
assert.equal(api.validate(v1).items[0].place, 0);

// A saved entry remains the same entry when its cover is edited via either editor button.
const article = get('collection-list').children[0];
const actions = article.children.find(x => x.className === 'row collection-row-actions');
actions.children[0].onclick();
ctx.state.design = { ...structuredClone(ctx.state.design), bottom: 'Neues Cover' };
get('collection-add-cover').onclick();
snapshot = api.snapshot();
assert.equal(snapshot.items.length, 1);
assert.equal(snapshot.items[0].entryId, 'item-legacy');
assert.equal(snapshot.items[0].content.design.bottom, 'Neues Cover');
assert.equal(snapshot.items[0].content.design.audioId, 'audio-17');

// A second physical tag can point to the same catalog content with a distinct entryId.
ctx.state.design = structuredClone(design);
get('collection-add-cover').onclick();
snapshot = api.snapshot();
assert.equal(snapshot.items.length, 2);
assert.notEqual(snapshot.items[0].entryId, snapshot.items[1].entryId);
const exported = JSON.parse(JSON.stringify(snapshot));
const restored = api.validate(exported);
assert.equal(JSON.stringify(restored.items.map(x => x.id)), JSON.stringify(snapshot.items.map(x => x.entryId)));
assert.equal(JSON.stringify(restored.items.map(x => x.design.audioId)), JSON.stringify(['audio-17', 'audio-17']));
assert.throws(() => api.validate({ ...exported, items: [{ ...exported.items[0], entryId: 'item-other' }] }), /Widersprüchliche/);

// An explicit front-only choice survives the collection-to-print transition.
get('print-side').value = 'front';
get('collection-print').onclick().then(() => {
  assert.equal(get('print-side').value, 'front');
  assert.equal(ctx.state.slots[0].collectionId, 'item-legacy');
  assert.equal(ctx.state.slots[0].audioId, 'audio-17');
  assert.equal(ctx.state.slots[0].back.uid, '');
  assert.equal(api.flowProbe('catalog-key-17').valid, true);
  assert.equal(api.validate(JSON.parse(storage.get('taggen-orbit-collection-v1'))).items.length, 2);
  get('collection-from-sheet').onclick();
  assert.equal(api.snapshot().items.length, 2, 'Print-first must not duplicate linked collection entries');
  console.log('Flow Integrity: migration, identity, edit, round-trip and front-only transfer passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
