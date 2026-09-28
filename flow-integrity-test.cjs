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
get('collection-print').onclick().then(async () => {
  assert.equal(get('print-side').value, 'front');
  assert.equal(ctx.state.slots[0].collectionId, 'item-legacy');
  assert.equal(ctx.state.slots[0].audioId, 'audio-17');
  assert.equal(ctx.state.slots[0].back.uid, '');
  assert.equal(api.flowProbe('catalog-key-17').valid, true);
  assert.equal(api.validate(JSON.parse(storage.get('taggen-orbit-collection-v1'))).items.length, 2);
  get('collection-from-sheet').onclick();
  assert.equal(api.snapshot().items.length, 2, 'Print-first must not duplicate linked collection entries');
  const raw = 'Filetype: Flipper NFC device\nVersion: 4\nDevice type: ISO15693-3\nUID: E0 04 03 11 22 33 44 55\nBlock Count: 2\nBlock Size: 04\nData Content: 01 02 03 04 05 06 07 08\n';
  const changed = raw.replace('07 08', '07 09');
  const unknown = raw.replace('E0 04 03 11 22 33 44 55', 'E0 04 03 11 22 33 44 56');
  const parsed = ctx.Core.dumpParse(raw);
  assert.equal(ctx.Core.tagIdentity(parsed).type, 'ICODE SLIX-L UID-Kennung');
  assert.equal(ctx.Core.tagIdentity(ctx.Core.dumpParse(unknown)).uid.endsWith('56'), true);
  assert.equal(ctx.Core.tagIdentity(ctx.Core.dumpParse(raw.replace('E0 04 03', 'E0 04 05'))).slixL, false);
  const community = [{ uid: 'E004031122334455', name: 'Folge', path: 'data/tonies/German/Serie/Folge.nfc' }];
  assert.equal(ctx.Core.communityUidMatches(community, parsed).length, 1);
  assert.equal(ctx.Core.communityUidMatches(community, ctx.Core.dumpParse(unknown)).length, 0);
  assert.equal(ctx.Core.communityUidMatches([...community, community[0]], parsed).length, 2);
  assert.equal(ctx.Core.sameTagMemory(parsed, ctx.Core.dumpParse(raw)), true);
  assert.equal(ctx.Core.sameTagMemory(parsed, ctx.Core.dumpParse(changed)), false);
  const tagged = JSON.parse(JSON.stringify(api.snapshot()));
  tagged.items[0].tag = { uid: parsed.uid, dumpName: 'Folge.nfc', dumpText: raw };
  api.load(tagged);
  assert.equal(api.lookupUid(parsed.uid, parsed).status, 'exact');
  assert.equal(api.lookupUid(parsed.uid, ctx.Core.dumpParse(changed)).status, 'changed');
  assert.equal(api.openReadByUid(parsed.uid, changed, 'Tag.nfc'), false, 'changed memory must not open the known cover');
  assert.equal(api.lookupUid(ctx.Core.dumpParse(unknown).uid, ctx.Core.dumpParse(unknown)).status, 'unknown');
  assert.equal(api.openReadByUid(parsed.uid, raw, 'Tag.nfc'), true);
  const duplicated = JSON.parse(JSON.stringify(api.snapshot()));
  duplicated.items[1].tag.uid = parsed.uid;
  api.load(duplicated);
  assert.equal(api.lookupUid(parsed.uid, parsed).status, 'ambiguous');
  assert.equal(api.openReadByUid(parsed.uid, raw, 'Tag.nfc'), false);

  // Execute the real BLE guard: attempted writes never reach the transport.
  const bleRaw = html.match(/BLE\.raw=async function\(frame\)\{[^\n]+\};/);
  assert(bleRaw);
  ctx.BLE = { rawAvailable: () => true, sent: [], send(bytes) { this.sent.push(bytes); return Promise.resolve([0x90, 0, 1, 0]); } };
  vm.runInContext(bleRaw[0], ctx);
  await assert.rejects(ctx.BLE.raw([0x22, 0x21, 0]), /ausschließlich lesende/);
  assert.equal(ctx.BLE.sent.length, 0);
  await ctx.BLE.raw([0x26, 0x01, 0]);
  assert.equal(ctx.BLE.sent.length, 1);

  // The on-demand community lookup verifies a unique UID against the actual dump bytes.
  ctx.document.createTextNode = value => ({ textContent: value });
  ctx.AbortSignal = AbortSignal;
  ctx.fetchJSON = async () => ({ tonies: [{ uid: 'E004031122334456', name: 'Folge', series: 'Serie', path: 'data/tonies/German/Serie/Folge.nfc' }] });
  ctx.fetch = async () => ({ ok: true, text: async () => unknown });
  ctx.state.dump = ctx.Core.dumpParse(unknown);
  ctx.Element = Element;
  ctx.$ = get;
  const lookup = block('verifyRepo.onclick=async()=>{', '\nfunction showDump');
  vm.runInContext('const verifyRepo=new Element();const verifyPanel=new Element();const verifyChoose=new Element();\n' +
    lookup.slice(0, -'\nfunction showDump'.length) + '\nthis.testVerify={verifyRepo,verifyPanel,verifyChoose};', ctx);
  await ctx.testVerify.verifyRepo.onclick();
  assert.equal(ctx.testVerify.verifyChoose.textContent, 'Vorschlag in Bibliothek suchen');
  assert.equal(ctx.testVerify.verifyChoose.hidden, false);
  assert(ctx.testVerify.verifyPanel.children.some(x => x.textContent.includes('byteweise überein')));
  ctx.state.dump = ctx.Core.dumpParse(unknown.replace('07 08', '07 09'));
  ctx.testVerify.verifyPanel.replaceChildren();
  await ctx.testVerify.verifyRepo.onclick();
  assert(ctx.testVerify.verifyPanel.children.some(x => x.textContent.includes('Speicher stimmt nicht überein')));
  console.log('Flow Integrity: migration, identity, edit, round-trip and front-only transfer passed');
  console.log('NFC Read & Verify: known, changed, unknown, ambiguous and write guard passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
