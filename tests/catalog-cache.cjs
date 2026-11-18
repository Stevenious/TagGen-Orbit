// Run with: node tests/catalog-cache.cjs
// Catalog loading on slow or missing networks: longer download time, IndexedDB cache,
// migration of the old localStorage cache and a fallback without IndexedDB.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..');
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
const catalog = Array.from({ length: 12 }, (_, i) => ({ series: 'Waldgeschichten', episodes: 'Waldabenteuer ' + (i + 1), language: 'de', audio_id: 'audio-' + (i + 1), model: String(i + 1) }));
const KEY = 'taggen-orbit-catalog-v3';

async function page(context, url, mode) {
  const p = await context.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.route('https://raw.githubusercontent.com/**', async route => {
    if (mode === 'offline') return route.abort('internetdisconnected');
    if (mode === 'slow') await new Promise(r => setTimeout(r, 16000)); // longer than the former 14 s limit
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(catalog) });
  });
  p.setDefaultTimeout(60000);
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  p.errors = errors;
  return p;
}
const ready = p => p.waitForFunction(() => state.catalogPhase !== 'loading' && state.items.length > 0);
const idbCache = p => p.evaluate(() => catalogTx('readonly', s => s.get('taggen-orbit-catalog-v3')).then(v => v ? v.catalogs.map(g => g.length) : null));

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ headless: true });
  try {
    // 1. Slow network: a download that takes 16 s still succeeds, and the cache lands in IndexedDB.
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
    let p = await page(context, url, 'slow');
    await ready(p);
    assert.equal(await p.evaluate(() => state.items.length), 12);
    await p.waitForFunction(() => catalogTx('readonly', s => s.get('taggen-orbit-catalog-v3')).then(Boolean));
    assert.deepEqual(await idbCache(p), [12, 12]);
    assert.equal(await p.evaluate(k => localStorage.getItem(k), KEY), null, 'no large copy left in localStorage');
    assert.deepEqual(p.errors, []);
    await p.close();

    // 2. No network: the catalog comes from IndexedDB, searches work.
    p = await page(context, url, 'offline');
    await ready(p);
    assert.equal(await p.evaluate(() => state.items.length), 12);
    assert(await p.evaluate(() => state.sourceStatus.every(x => /Cache/.test(x))), 'status names the cache');
    await p.close();
    await context.close();

    // 3. An old localStorage cache (previous versions) is still used and moved into IndexedDB.
    const old = await browser.newContext();
    await old.addInitScript(([key, value]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', '1'); } },
      [KEY, JSON.stringify({ version: 3, savedAt: Date.now() - 3600e3, catalogs: [[{ key: 'k1', series: 'Alt', title: 'Alter Cache', audioIds: [], pictures: [], language: 'de', model: '', source: 'v1', figure: false }], []] })]);
    p = await page(old, url, 'offline');
    await ready(p);
    assert.equal(await p.evaluate(() => state.items[0].title), 'Alter Cache');
    await p.close();
    p = await page(old, url, 'online');
    await ready(p);
    await p.waitForFunction(k => localStorage.getItem(k) === null, KEY);
    assert.deepEqual(await idbCache(p), [12, 12]);
    await p.close();
    await old.close();

    // 4. Without IndexedDB the previous localStorage cache keeps working.
    const plain = await browser.newContext();
    await plain.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); });
    p = await page(plain, url, 'online');
    await ready(p);
    await p.waitForFunction(k => Boolean(localStorage.getItem(k)), KEY);
    await p.close();
    p = await page(plain, url, 'offline');
    await ready(p);
    assert.equal(await p.evaluate(() => state.items.length), 12);
    assert.deepEqual(p.errors, []);
    await plain.close();

    // 5. Clearing the cache removes both copies.
    const clear = await browser.newContext();
    p = await page(clear, url, 'online');
    await ready(p);
    await p.waitForFunction(() => catalogTx('readonly', s => s.get('taggen-orbit-catalog-v3')).then(Boolean));
    await p.evaluate(() => clearCatalogCache());
    await p.waitForFunction(() => catalogTx('readonly', s => s.get('taggen-orbit-catalog-v3')).then(v => !v));
    await clear.close();
    console.log('Catalog cache: 16-second download, IndexedDB cache, offline start, old localStorage cache migration, fallback without IndexedDB and cache clearing passed');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
