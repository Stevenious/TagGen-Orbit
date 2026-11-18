// Run with: node tests/exchange-import.cjs
// TeddyStudio import: taggen-exchange files and today's TeddyStudio exports (Cover-Manifest, Sammlung, images).
// Uses only the invented example data in exchange/examples.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..');
const ex = path.join(dir, 'exchange', 'examples');
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
const outDir = path.join(dir, 'test-output');

async function open(browser, url, width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width < 900, hasTouch: width < 900 });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  page.setDefaultTimeout(15000);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.orbitCollection?.library().ready && window.OrbitExchange);
  page.errors = errors;
  return page;
}
async function startImport(page) {
  await page.locator('.main-nav [data-view="create"]').click();
  await page.locator('#exchange-start').click();
  assert(await page.locator('#exchange-import').isVisible());
}
async function pick(page, files) {
  await page.locator('#exchange-files').setInputFiles(files);
  await page.waitForFunction(() => /Einträge|Datei|Version|JSON/.test(document.getElementById('exchange-status').textContent) && !/geprüft/.test(document.getElementById('exchange-status').textContent));
  return page.locator('#exchange-status').textContent();
}
const confirm = page => page.locator('#confirm-yes').click();
const statuses = page => page.evaluate(() => [...document.querySelectorAll('.exchange-row')].map(r => r.className.match(/exchange-(new|existing|conflict|broken)/)[1]));

async function exchangeJourney(browser, url) {
  const page = await open(browser, url, 1280);
  await startImport(page);
  // 1. A valid exchange file: 14 new entries, preview only.
  let status = await pick(page, path.join(ex, 'valid.json'));
  assert.match(status, /14 Einträge aus der Austauschdatei · 14 neu · 0 bereits vorhanden · 0 Konflikt · 0 fehlerhaft/);
  assert.equal(await page.locator('.exchange-row').count(), 14);
  assert.equal(await page.locator('.exchange-row img').count(), 13);
  assert.equal((await page.evaluate(() => window.orbitCollection.library().collections)).length, 1, 'nothing changes before applying');
  assert.match(await page.locator('#exchange-target option').first().textContent(), /2 × bis zu 12/);
  fs.mkdirSync(outDir, { recursive: true });
  await page.locator('#exchange-import').screenshot({ path: path.join(outDir, 'exchange-preview-desktop.png') });
  // 2. Applying splits 14 entries into two new collections and keeps identity, cover, model and tag.
  await page.locator('#exchange-apply').click();
  await confirm(page);
  await page.waitForFunction(() => state.view === 'collection');
  let info = await page.evaluate(() => window.orbitCollection.library());
  const imported = info.collections.filter(c => c.name.startsWith('Demo-Hörspiele'));
  assert.deepEqual(imported.map(c => [c.name, c.count]), [['Demo-Hörspiele (1/2)', 12], ['Demo-Hörspiele (2/2)', 2]]);
  const entries = await page.evaluate(() => window.orbitCollection.entries());
  const first = entries.find(e => e.content.design.source.key === 'exchange:model:mondbaer-001');
  assert(first, 'entry keeps its exchange key');
  assert.equal(first.content.design.source.model, 'mondbaer-001');
  assert.equal(first.content.design.audioId, '1731900097');
  assert.equal(first.tag.uid, 'E0 04 03 50 1A 2B 01 41');
  assert(first.content.design.image.startsWith('data:image/'), 'cover embedded');
  assert.equal(first.confirmed, true);
  assert.equal(first.physical.preset, 'capsule43');
  const noCover = entries.find(e => e.content.design.source.key === 'exchange:model:leuchtturm-lotte-006');
  assert.equal(noCover.confirmed, false, 'entry without cover still needs one');
  const raw = 'Filetype: Flipper NFC device\nVersion: 4\nDevice type: ISO15693-3\nUID: E0 04 03 50 1A 2B 01 41\nBlock Count: 2\nBlock Size: 04\nData Content: 01 02 03 04 05 06 07 08\n';
  const hit = await page.evaluate(dump => window.orbitCollection.lookupUid('E0 04 03 50 1A 2B 01 41', Core.dumpParse(dump)), raw);
  assert.equal(hit.status, 'exact', 'a physical tag finds its imported entry');
  // 2b. Demonstrator end point: the first imported collection becomes a print sheet without manual work.
  await page.evaluate(id => window.orbitCollection.switchTo(id), imported[0].id);
  await page.evaluate(() => document.getElementById('collection-print').click());
  await page.waitForFunction(() => state.view === 'print' && state.slots.filter(Boolean).length === 12);
  assert.equal(await page.evaluate(() => state.preset), 'capsule43');
  assert.equal(await page.evaluate(() => state.slots[0].back.uid), 'E0 04 03 50 1A 2B 01 41', 'tag UID travels to the print back side');
  await page.locator('#sheet').screenshot({ path: path.join(outDir, 'exchange-print-sheet.png') });
  // 3. The same file again: everything is already there and nothing is preselected.
  await startImport(page);
  status = await pick(page, path.join(ex, 'valid.json'));
  assert.match(status, /0 neu · 14 bereits vorhanden/);
  assert(await page.locator('#exchange-apply').isDisabled());
  // 4. Conflicts and broken entries are explained and protected.
  status = await pick(page, path.join(ex, 'conflicts.json'));
  assert.match(status, /7 Einträge .* 1 neu · 1 bereits vorhanden · 1 Konflikt · 4 fehlerhaft/);
  assert.deepEqual(await statuses(page), ['existing', 'conflict', 'new', 'broken', 'broken', 'broken', 'broken']);
  const reasons = await page.locator('.exchange-reason').allTextContents();
  assert(reasons.some(r => /RUID passt nicht/.test(r)));
  assert(reasons.some(r => /mehrfach vor/.test(r)));
  assert(reasons.some(r => /Coverbild fehlt/.test(r)));
  assert(reasons.some(r => /Tag-UID gehört zu/.test(r)));
  assert(await page.locator('.exchange-broken input').first().isDisabled());
  await page.locator('.exchange-conflict input').check();
  await page.locator('#exchange-name').fill('Konflikt-Test');
  await page.locator('#exchange-apply').click();
  await confirm(page);
  await page.waitForFunction(() => state.view === 'collection');
  const conflictEntry = (await page.evaluate(() => window.orbitCollection.entries())).find(e => e.content.title === 'Mondbär Sonderfolge');
  assert.equal(conflictEntry.tag.uid, '', 'conflict entry is imported without the clashing tag');
  assert.equal((await page.evaluate(() => window.orbitCollection.snapshot())).name, 'Konflikt-Test');
  // 5. Import into an existing collection with free places.
  await startImport(page);
  await pick(page, path.join(ex, 'conflicts.json'));
  assert(await page.locator('#exchange-apply').isDisabled(), 'after step 4 nothing is new any more');
  await page.locator('.exchange-existing input').first().check(); // a deliberate second copy
  const target = await page.evaluate(() => window.orbitCollection.library().collections.find(c => c.name === 'Demo-Hörspiele (2/2)').id);
  await page.locator('#exchange-target').selectOption(target);
  assert(await page.locator('#exchange-name').isHidden());
  await page.locator('#exchange-apply').click();
  await confirm(page);
  await page.waitForFunction(id => window.orbitCollection.library().active === id && window.orbitCollection.snapshot().items.length === 3, target);
  // 6. A file with another major version is refused as a whole.
  await startImport(page);
  status = await pick(page, path.join(ex, 'broken.json'));
  assert.match(status, /Version 2 wird nicht unterstützt/);
  assert.equal(await page.locator('.exchange-row').count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
}

async function teddyStudioJourney(browser, url) {
  const page = await open(browser, url, 390);
  await startImport(page);
  const images = fs.readdirSync(path.join(ex, 'teddystudio', 'bilder')).map(f => path.join(ex, 'teddystudio', 'bilder', f));
  const status = await pick(page, [path.join(ex, 'teddystudio', 'Cover-Manifest.json'), path.join(ex, 'teddystudio', 'Sammlung.json'), ...images]);
  assert.match(status, /14 Einträge aus dem TeddyStudio-Export · 14 neu/);
  assert.equal(await page.locator('.exchange-row img').count(), 6, 'unique image names are matched');
  const reasons = await page.locator('.exchange-reason').allTextContents();
  assert.equal(reasons.filter(r => /mehrdeutig/.test(r)).length, 7, 'ambiguous cover.jpg is never guessed');
  const keys = await page.evaluate(() => [...document.querySelectorAll('.exchange-row small:first-of-type')].map(x => x.textContent));
  assert(keys.some(k => /Modell mondbaer-002/.test(k)), 'Sammlung.json adds the TeddyCloud model');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow on mobile');
  fs.mkdirSync(outDir, { recursive: true });
  await page.locator('#exchange-import').screenshot({ path: path.join(outDir, 'exchange-preview-mobile.png') });
  await page.locator('#exchange-apply').click();
  await confirm(page);
  await page.waitForFunction(() => state.view === 'collection');
  const entries = await page.evaluate(() => window.orbitCollection.entries());
  assert.equal(entries.length, 14);
  assert.equal(entries.filter(e => e.confirmed).length, 6);
  assert(entries.some(e => e.content.design.source.key.startsWith('exchange:local:')), 'titles without TeddyCloud model keep their local key');
  assert(!JSON.stringify(entries).includes('C:\\\\Users'), 'no local paths are stored');
  // Only the pure parser: the manifest without Sammlung.json still works.
  const parsed = await page.evaluate(async () => { const manifest = await (await fetch('exchange/examples/teddystudio/Cover-Manifest.json')).json(); return window.OrbitExchange.parseTeddyStudio(manifest, null, []).entries.map(e => e.key.split(':')[0]); });
  assert(parsed.every(k => k === 'local'));
  assert.deepEqual(page.errors, []);
  await page.context().close();
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ headless: true });
  try {
    await exchangeJourney(browser, url);
    await teddyStudioJourney(browser, url);
    console.log('TeddyStudio import: exchange preview, split into collections, identity/tag/cover, re-import, conflicts, broken file, print sheet, existing target, TeddyStudio manifest + collection + images and mobile layout passed');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
