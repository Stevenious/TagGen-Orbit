// Run with: node tests/library-storage.cjs
// Library and storage regression: IndexedDB primary store, legacy migration, several collections,
// moving entries, deletion, file backup reminder, library export/import and localStorage fallback.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..');
const catalog = Array.from({ length: 10 }, (_, i) => ({ series: 'Waldgeschichten', episodes: 'Waldabenteuer ' + (i + 1), language: 'de', audio_id: 'audio-' + (i + 1), model: String(i + 1) }));
const server = http.createServer((req, res) => {
  const route = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(dir, route === '/' ? 'index.html' : route);
  if (!file.startsWith(dir + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const body = fs.readFileSync(file);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

const KEY = 'taggen-orbit-collection-v1';
const design = (title, n) => ({ shape: 'round', fit: 'contain', top: 'Serie', bottom: title, audioId: 'audio-' + n, image: '', zoom: 100, x: 0, y: 0, font: 100, accent: '#da2355', background: '#ffffff' });
const entry = (title, n, place) => ({ id: 'item-test-' + n, entryId: 'item-test-' + n, place, confirmed: true, content: { title, series: 'Serie', design: design(title, n) }, tag: { uid: '', dumpName: '', dumpText: '' }, physical: { type: 'capsule43', preset: '' }, universe: { world: '', printedAt: '' } });
const legacy = { format: 'orbit-collection', version: 3, privacy: 'private', name: 'Alte Sammlung', preset: 'capsule43', items: [entry('Eins', 1, 0), entry('Zwei', 2, 1)] };

async function open(context, url) {
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(catalog) }));
  page.setDefaultTimeout(15000);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.orbitCollection?.library().ready);
  page.errors = errors;
  return page;
}
const lib = page => page.evaluate(() => window.orbitCollection.library());
const snap = page => page.evaluate(() => window.orbitCollection.snapshot());
const flush = page => page.evaluate(() => window.orbitCollection.flush());
async function confirm(page) { await page.locator('#confirm-yes').click(); }

async function indexedDbJourney(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  try {
    // 1. A collection written by the previous version is migrated into the library unchanged.
    await context.addInitScript(([key, value]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(legacy)]);
    let page = await open(context, url);
    let info = await lib(page);
    assert.equal(info.backend, 'idb');
    assert.equal(info.collections.length, 1);
    assert.equal(info.collections[0].name, 'Alte Sammlung');
    assert.equal((await snap(page)).items.length, 2);
    await flush(page);
    const stored = await page.evaluate(() => new Promise((resolve, reject) => { const r = indexedDB.open('taggen-orbit'); r.onsuccess = () => { const tx = r.result.transaction('library'); const g = tx.objectStore('library').get('index'); g.onsuccess = () => resolve(g.result); g.onerror = () => reject(g.error); }; r.onerror = () => reject(r.error); }));
    assert.equal(stored.format, 'orbit-library-index');
    assert.equal(stored.collections.length, 1);

    // 2. The file-backup reminder is shown for unsaved collections.
    await page.locator('.main-nav [data-view="collection"]').click();
    assert(await page.locator('#collection-backup-hint').isVisible(), 'backup hint visible');
    assert(await page.locator('#collection-switcher').isVisible(), 'switcher visible in collection view');

    // 3. A new collection keeps the old one; entries can be moved across.
    await page.locator('#collection-new').click();
    info = await lib(page);
    assert.equal(info.collections.length, 2);
    assert.equal((await snap(page)).items.length, 0);
    const second = info.active;
    await page.evaluate(() => { const el = document.getElementById('collection-name'); el.value = 'Weihnachten'; el.onchange(); });
    await page.locator('#collection-switch').selectOption({ index: 0 });
    assert.equal((await snap(page)).name, 'Alte Sammlung');
    assert.equal((await snap(page)).items.length, 2);
    await page.evaluate(() => { const s = document.querySelector('.collection-move-select'); s.value = s.options[1].value; s.onchange(); });
    assert.equal((await snap(page)).items.length, 1);
    info = await lib(page);
    assert.equal(info.collections.find(c => c.id === second).count, 1);
    assert.equal(info.collections.find(c => c.id === second).name, 'Weihnachten');

    // 3b. The tag card (passport) offers the same move without the expert view.
    await page.locator('#universe-collection-cards .universe-card').first().click();
    await page.locator('#universe-passport-move').selectOption(second);
    await page.waitForFunction(() => state.view === 'collection');
    assert.equal((await snap(page)).items.length, 0);
    await page.evaluate(id => window.orbitCollection.switchTo(id), second);
    await page.evaluate(() => { const s = document.querySelector('.collection-move-select'); s.value = s.options[1].value; s.onchange(); });
    await page.locator('#collection-switch').selectOption({ index: 0 });
    assert.equal((await snap(page)).items.length, 1);
    info = await lib(page);
    assert.equal(info.collections.find(c => c.id === second).count, 1);

    // 4. Everything survives a reload, including the active collection.
    await flush(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.orbitCollection?.library().ready);
    info = await lib(page);
    assert.equal(info.collections.length, 2);
    assert.equal((await snap(page)).name, 'Alte Sammlung');
    assert.equal((await snap(page)).items.length, 1);
    await page.evaluate(id => window.orbitCollection.switchTo(id), second);
    assert.deepEqual((await snap(page)).items.map(x => x.entryId), ['item-test-2']);

    // 5. Library export clears the reminder and can be imported again as additional collections.
    await page.locator('.main-nav [data-view="collection"]').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#library-export-now').click()]);
    const file = await download.path();
    const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(backup.format, 'orbit-library');
    assert.equal(backup.collections.length, 2);
    assert(!backup.collections.some(c => 'savedAt' in c), 'internal fields not exported');
    await page.waitForFunction(() => document.getElementById('collection-backup-hint').hidden);
    await page.locator('#collection-file').setInputFiles(file);
    await confirm(page);
    await page.waitForFunction(() => window.orbitCollection.library().collections.length === 4);
    info = await lib(page);
    assert(info.collections.some(c => c.name === 'Weihnachten (2)'), 'imported names are unique');

    // 6. Deleting the active collection opens another one and removes it from storage.
    const before = info.active;
    await page.locator('#collection-delete').click();
    await confirm(page);
    await page.waitForFunction(id => window.orbitCollection.library().active !== id, before);
    assert.equal((await lib(page)).collections.length, 3);

    // 7. A full collection points to a new collection instead of silently failing.
    await page.locator('#collection-new').click();
    await page.evaluate(([one]) => { const items = Array.from({ length: 12 }, (_, i) => ({ ...one, id: 'item-full-' + i, entryId: 'item-full-' + i, place: i })); window.orbitCollection.load({ ...window.orbitCollection.snapshot(), items }); }, [entry('Voll', 9, 0)]);
    const rejected = await page.evaluate(() => { try { window.orbitCollection.addDesigns([{ bottom: 'Mehr' }], 'capsule43'); return ''; } catch (error) { return error.message; } });
    assert.match(rejected, /neue Sammlung/);

    // 8. Edits made by an older Orbit version (no library marker) are kept as their own collection.
    await flush(page);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, JSON.stringify({ ...legacy, name: 'Altversion', items: [entry('Nur alt', 7, 0)] })]);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.orbitCollection?.library().ready);
    info = await lib(page);
    assert(info.collections.some(c => c.name === 'Altversion (ältere Version)' && c.count === 1), 'older-version data preserved');
    assert.equal(info.collections.length, 5);
    // 9. A collection that lost its index entry (two tabs writing) is recovered from its stored document.
    await flush(page);
    const orphan = info.collections.find(c => c.id !== info.active && c.count > 0);
    await page.evaluate(id => new Promise((resolve, reject) => { const r = indexedDB.open('taggen-orbit'); r.onsuccess = () => { const tx = r.result.transaction('library', 'readwrite'), s = tx.objectStore('library'); const g = s.get('index'); g.onsuccess = () => { const v = g.result; v.collections = v.collections.filter(c => c.id !== id); s.put(v, 'index'); }; tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }; }), orphan.id);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.orbitCollection?.library().ready);
    assert((await lib(page)).collections.some(c => c.id === orphan.id && c.count === orphan.count), 'orphaned collection recovered');

    // 10. A second tab is detected and both tabs show a warning.
    const second2 = await open(context, url);
    await page.waitForFunction(() => /weiteren Tab/.test(document.getElementById('collection-storage').textContent));
    await second2.waitForFunction(() => /weiteren Tab/.test(document.getElementById('collection-storage').textContent));
    await second2.close();
    assert.deepEqual(page.errors, []);
    await page.close();
  } finally { await browser.close(); }
}

async function fallbackJourney(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true });
  try {
    await context.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); });
    let page = await open(context, url);
    let info = await lib(page);
    assert.equal(info.backend, 'local');
    await page.evaluate(([one]) => window.orbitCollection.load({ ...window.orbitCollection.snapshot(), name: 'Erste', items: [one] }), [entry('Lokal', 3, 0)]);
    await page.evaluate(() => window.orbitCollection.newCollection());
    await page.evaluate(([one]) => window.orbitCollection.load({ ...window.orbitCollection.snapshot(), name: 'Zweite', items: [one] }), [entry('Lokal zwei', 4, 0)]);
    await flush(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.orbitCollection?.library().ready);
    info = await lib(page);
    assert.equal(info.collections.length, 2);
    assert.equal((await snap(page)).name, 'Zweite');
    const other = info.collections.find(c => c.id !== info.active).id;
    await page.evaluate(id => window.orbitCollection.switchTo(id), other);
    assert.equal((await snap(page)).items[0].content.title, 'Lokal');
    await page.locator('.main-nav [data-view="collection"]').click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow on mobile');
    assert.deepEqual(page.errors, []);
  } finally { await browser.close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  try {
    await indexedDbJourney(url);
    await fallbackJourney(url);
    console.log('Library & storage: migration, IndexedDB, switch, move, reload, backup reminder, export/import, delete, full collection, older-version data, orphan recovery, second-tab warning and localStorage fallback passed');
  } finally { server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
