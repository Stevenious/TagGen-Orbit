// Run with: node tests/teddycloud-plugin.cjs
// TeddyCloud plugin mode against a mock TeddyCloud that mirrors the field names of the real server
// (src/handler_api.c: getTagIndex, toniesJson, toniesCustomJson; cookie login from handler_web_auth.c).
// Proves: detection, catalogue from TeddyCloud, tags → preview → collection, re-read, read-only guard,
// expired session, embedding in TeddyCloud's iframe and the plugin package.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..');
const valid = JSON.parse(fs.readFileSync(path.join(dir, 'exchange', 'examples', 'valid.json'), 'utf8'));
const images = new Map();
for (const e of valid.entries) if (e.cover.imageRef) images.set(e.teddycloud.model, Buffer.from(valid.images[e.cover.imageRef].data.split(',')[1], 'base64'));
const tagged = valid.entries.filter(e => e.tag);
const tags = [
  ...tagged.map(e => ({ ruid: e.tag.ruid, uid: e.tag.nfcUid.replace(/ /g, ':'), type: 'tag', valid: true, exists: true, live: false, nocloud: true, hasCloudAuth: false, hide: false, claimed: false,
    source: 'lib://Demo/' + e.teddycloud.model + '.taf', trackSeconds: [0, 300], lengthSeconds: 600, audioUrl: '/content/download/X?overlay=', tonieInfo: { tracks: [], model: e.teddycloud.model, series: e.series, episode: e.title,
      picture: images.has(e.teddycloud.model) ? '/custom_img/' + e.teddycloud.model + '.jpg' : '/img_unknown.png', language: 'de' } })),
  { ruid: '0000000101000000', uid: '00:00:00:01:01:00:00:00', type: 'system', valid: true, exists: true, hide: false, source: '', tonieInfo: { tracks: [], model: '', series: '', episode: '', picture: '/img_unknown.png' } },
  { ruid: 'aa00112233445566', uid: '66:55:44:33:22:11:00:AA', type: 'tag', valid: true, exists: false, hide: true, source: '', tonieInfo: { tracks: [], model: '', series: '', episode: '', picture: '/img_unknown.png' } },
];
const custom = valid.entries.filter(e => e.series === 'Leuchtturm-Lotte').map((e, i) => ({ no: String(i), model: e.teddycloud.model, audio_id: e.teddycloud.audioIds, hash: e.teddycloud.hashes, title: e.title, series: e.series, episodes: e.title, tracks: [], release: '0', language: 'de-de', category: 'custom', pic: images.has(e.teddycloud.model) ? '/custom_img/' + e.teddycloud.model + '.jpg' : '' }));
const official = [{ no: '1', model: '10000001', audio_id: ['111'], hash: [], title: 'Demo-Katalog', series: 'Demo-Katalog', episodes: 'Offizieller Eintrag', tracks: [], release: '0', language: 'de-de', category: 'audio-play', pic: '' }];

const log = [];
let loggedIn = true;
const PLUGIN = '/plugins/taggen-orbit/';
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), route = decodeURIComponent(url.pathname);
  log.push({ method: req.method, route });
  const json = value => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
  const cookieOk = /(^|;\s*)tc_session=ok/.test(req.headers.cookie || '');
  if (route.startsWith('/api/') && route !== '/api/auth/status' && !(cookieOk && loggedIn)) { res.writeHead(401); res.end('{"error":"login required"}'); return; }
  if (route === '/api/getTagIndex') return json({ tags });
  if (route === '/api/toniesJson') return json(official);
  if (route === '/api/toniesCustomJson') return json(custom);
  if (route === '/api/auth/status') return json({ enabled: true, authenticated: cookieOk && loggedIn });
  if (route.startsWith('/api/') || route.startsWith('/content/')) { res.writeHead(404); res.end(); return; }
  if (route.startsWith('/custom_img/')) { const img = images.get(path.basename(route, '.jpg')); if (!img) { res.writeHead(404); res.end(); return; } res.setHeader('Content-Type', 'image/jpeg'); res.end(img); return; }
  if (route === '/web/host.html') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>TeddyCloud</title><iframe id="tc" src="/plugins/taggen-orbit/index.html" style="width:100%;height:900px;border:0"></iframe>'); return; }
  if (route === '/plugins/taggen-orbit') { // static servers do not add the slash themselves
    res.setHeader('Content-Type', 'text/html'); res.end(fs.readFileSync(path.join(dir, 'index.html'))); return; }
  if (route.startsWith(PLUGIN)) {
    const rel = route.slice(PLUGIN.length) || 'index.html';
    const file = rel === 'plugin.json' ? path.join(dir, 'teddycloud-plugin', 'plugin.json') : path.join(dir, rel);
    if (!file.startsWith(dir + path.sep)) { res.writeHead(403); res.end(); return; }
    try { const body = fs.readFileSync(file); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.json') ? 'application/json' : 'text/html'); res.end(body); }
    catch { res.writeHead(404); res.end(); }
    return;
  }
  res.writeHead(404); res.end();
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await context.addCookies([{ name: 'tc_session', value: 'ok', url: origin, httpOnly: true, sameSite: 'Lax' }]);
    let github = 0;
    await context.route('https://raw.githubusercontent.com/**', route => { github++; return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(20000);

    // 1. A link without trailing slash is corrected; plugin mode is detected; catalogue comes from TeddyCloud.
    await page.goto(origin + '/plugins/taggen-orbit', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => location.pathname.endsWith('/plugins/taggen-orbit/') && window.OrbitTeddyCloud?.active && window.orbitCollection?.library().ready && state.items.length >= 6);
    assert.equal(await page.evaluate(() => window.OrbitTeddyCloud.base), '');
    assert.equal(github, 0, 'no GitHub request in plugin mode');
    const catalog = await page.evaluate(() => state.items.map(i => ({ title: i.title, local: Boolean(i.pictures[0]?.url?.startsWith('data:image/')) })));
    assert(catalog.some(i => i.title === 'Offizieller Eintrag'));
    assert.equal(catalog.filter(i => i.local).length, 5, 'custom tonie pictures are embedded from TeddyCloud');

    // 2. One tag is already known in Orbit from a Flipper file (same UID).
    const known = tagged[1];
    await page.evaluate(([uid]) => { const d = { ...Core.initialDesign(), bottom: 'Aus Flipper-Datei' }; window.orbitCollection.load({ format: 'orbit-collection', version: 3, name: 'Werkstatt', preset: 'capsule43', items: [{ id: 'item-flipper', entryId: 'item-flipper', place: 0, confirmed: true, content: { title: 'Aus Flipper-Datei', series: '', design: d }, tag: { uid, dumpName: '', dumpText: '' }, physical: { type: 'capsule43', preset: '' }, universe: { world: '', printedAt: '' } }] }); }, [known.tag.nfcUid]);

    // 3. Read tags: preview with statuses, system tag left out, nothing changed yet.
    await page.locator('.main-nav [data-view="create"]').click();
    assert(await page.locator('#teddycloud-start').isVisible());
    assert.equal(await page.locator('#teddycloud-own-window').count(), 0, 'no extra link outside a frame');
    await page.locator('#teddycloud-start').click();
    await page.waitForFunction(() => /deiner TeddyCloud/.test(document.getElementById('exchange-status').textContent));
    const status = await page.locator('#exchange-status').textContent();
    assert.match(status, /6 Einträge aus deiner TeddyCloud · 5 neu · 1 bereits vorhanden · 0 Konflikt · 0 fehlerhaft · 1 System-Tags ausgelassen/);
    assert.equal(await page.locator('.exchange-row img').count(), 5);
    assert.equal(await page.locator('#exchange-title').textContent(), 'Tags aus TeddyCloud');
    const reasons = await page.locator('.exchange-reason').allTextContents();
    assert(reasons.some(r => /Tag schon in „Werkstatt“ als „Aus Flipper-Datei“/.test(r)));
    assert(reasons.some(r => /noch kein Inhalt zugeordnet/.test(r) && /ausgeblendet/.test(r)));
    assert.equal((await page.evaluate(() => window.orbitCollection.library().collections)).length, 1);

    // 4. Apply: entries keep RUID-based identity, the UID in Orbit's format and the TeddyCloud cover.
    await page.locator('#exchange-apply').click();
    await page.locator('#confirm-yes').click();
    await page.waitForFunction(() => state.view === 'collection');
    const entries = await page.evaluate(() => window.orbitCollection.entries());
    const first = entries.find(e => e.content.design?.source?.key === 'exchange:tag:' + tagged[0].tag.ruid);
    assert(first, 'entry keyed by RUID');
    assert.equal(first.tag.uid, tagged[0].tag.nfcUid);
    assert.equal(first.content.design.source.model, tagged[0].teddycloud.model);
    assert(first.content.design.image.startsWith('data:image/'));
    const raw = 'Filetype: Flipper NFC device\nVersion: 4\nDevice type: ISO15693-3\nUID: ' + tagged[0].tag.nfcUid + '\nBlock Count: 2\nBlock Size: 04\nData Content: 01 02 03 04 05 06 07 08\n';
    assert.equal((await page.evaluate(dump => window.orbitCollection.lookupUid(Core.dumpParse(dump).uid, Core.dumpParse(dump)), raw)).status, 'exact', 'a read tag finds the TeddyCloud entry');

    // 5. Reading again: everything is known.
    await page.locator('.main-nav [data-view="create"]').click();
    await page.locator('#teddycloud-start').click();
    await page.waitForFunction(() => /0 neu · 6 bereits vorhanden/.test(document.getElementById('exchange-status').textContent));

    // 6. Read-only guard: anything outside the allow-list is refused before a request is made.
    const before = log.length;
    for (const forbidden of ['/api/settings/set/core.x', '/content/json/set/0011223344556677', '/api/toniesCustomJsonUpsert', '/api/fileDelete']) {
      const message = await page.evaluate(p => window.OrbitTeddyCloud.get(p).then(() => '', e => e.message), forbidden);
      assert.match(message, /nicht erlaubt/, forbidden);
    }
    assert.equal(log.length, before, 'refused calls never reach the server');

    // 7. Expired session: a clear hint instead of a silent failure.
    loggedIn = false;
    await page.locator('#teddycloud-start').click();
    await page.waitForFunction(() => /anmelden/.test(document.getElementById('exchange-status').textContent));
    loggedIn = true;

    // 8. Inside TeddyCloud's iframe: plugin mode works and offers the own window.
    const host = await context.newPage();
    await host.goto(origin + '/web/host.html', { waitUntil: 'networkidle' });
    const frame = host.frameLocator('#tc');
    await frame.locator('.main-nav [data-view="create"]').click();
    assert(await frame.locator('#teddycloud-own-window').isVisible());
    assert.equal(await frame.locator('#teddycloud-own-window').getAttribute('target'), '_blank');
    await host.close();

    // 9. Every request Orbit sent to TeddyCloud was a GET on an allowed endpoint or a static file.
    const allowed = await page.evaluate(() => window.OrbitTeddyCloud.allowed);
    assert(log.every(r => r.method === 'GET'), 'only GET requests');
    const apiCalls = [...new Set(log.filter(r => r.route.startsWith('/api/')).map(r => r.route))];
    assert(apiCalls.every(r => allowed.includes(r)), 'only allowed endpoints: ' + apiCalls.join(', '));
    assert(!log.some(r => r.route.startsWith('/content/')), 'no audio or content access');
    assert.deepEqual(errors, []);
    await context.close();

    // 10. The plugin package contains plugin.json and the app files only.
    const build = spawnSync('python3', [path.join(dir, 'tools', 'build-teddycloud-plugin.py')], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr);
    const list = spawnSync('python3', ['-c', 'import sys,zipfile;print("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))', path.join(dir, 'dist', 'taggen-orbit-teddycloud-plugin.zip')], { encoding: 'utf8' }).stdout.trim().split('\n');
    for (const name of ['plugin.json', 'preview.png', 'index.html', 'teddycloud.js', 'exchange.js', 'universe.js', 'universe.css', 'sw.js']) assert(list.includes('taggen-orbit/' + name), name);
    assert(!list.some(n => /tests\/|exchange\/examples|screenshots/.test(n)), 'no tests, examples or screenshots in the package');
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'teddycloud-plugin', 'plugin.json'), 'utf8'));
    assert.equal(meta.pluginName, 'TagGen Orbit');
    assert.equal(meta.standalone, false);
    console.log('TeddyCloud plugin: slash fix, detection, catalogue from TeddyCloud, tags → preview → collection, known Flipper UID, re-read, read-only guard, expired session, iframe and package passed');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
