// Run with: node tests/teddycloud-export.cjs
// Export for TeddyCloud's tonies.custom.json: ZIP layout, merge with an existing file, stable models on
// re-export, values set in TeddyCloud preserved, covers as PNG, locked image sources, plugin mode and bad files.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const dir = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-tc-export-'));
const server = http.createServer((req, res) => {
  const route = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(dir, route === '/' ? 'index.html' : route);
  if (!file.startsWith(dir + path.sep)) { res.writeHead(403); res.end(); return; }
  try { const body = fs.readFileSync(file); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
// Read a ZIP with Python's zipfile (independent implementation, checks every CRC).
function unzip(file) {
  const out = execFileSync('python3', ['-I', '-c', `
import json, sys, zipfile, base64
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
print(json.dumps({n: base64.b64encode(z.read(n)).decode() for n in z.namelist()}))`, file]).toString();
  return Object.fromEntries(Object.entries(JSON.parse(out)).map(([k, v]) => [k, Buffer.from(v, 'base64')]));
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    page.setDefaultTimeout(20000);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.OrbitTeddyCloudExport && window.orbitCollection?.library().ready);

    // Pure merge: numbering after the highest custom model, existing entries untouched, nameless rows skipped.
    const pure = await page.evaluate(() => {
      const X = OrbitTeddyCloudExport;
      const r = X.merge([{ model: 'custom-7', series: 'Alt' }, { model: '10001234', series: 'Fremd' }], [{ id: 'a', series: 'Serie', title: 'Folge', hasCover: true }, { id: 'b', series: '', title: '' }, { id: 'c', series: 'Nur Serie', title: 'Nur Serie', hasCover: false }]);
      return { models: r.entries.map(e => e.model), status: r.rows.map(x => x.status), c: r.entries[3] };
    });
    assert.deepEqual(pure.models, ['custom-7', '10001234', 'custom-8', 'custom-9']);
    assert.deepEqual(pure.status, ['new', 'skipped', 'new']);
    assert.equal(pure.c.episodes, ''); assert.equal(pure.c.title, 'Nur Serie'); assert(!('pic' in pure.c), 'no picture without cover');

    // A collection: cover with image, cover with text only, entry without any title.
    const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, 300, 300); x.fillStyle = '#e9c46a'; x.fillRect(80, 80, 140, 140); return c.toDataURL('image/png'); });
    await page.evaluate(image => {
      const d = (top, bottom, img) => Core.validateDesign({ ...Core.initialDesign(), top, bottom, image: img || '' });
      orbitCollection.importRows([
        { title: 'Der Mond', series: 'Gute Nacht', design: d('Gute Nacht', 'Der Mond', image), confirmed: true },
        { title: 'Lieder', series: 'Oma singt', design: d('Oma singt', 'Lieder'), confirmed: true },
        { title: '', series: '', design: d('', ''), confirmed: false }
      ], { target: 'new', name: 'Export Test' });
    }, png);
    await page.locator('.main-nav [data-view="collection"]').click();
    await page.locator('#tc-export > summary').click();
    await page.waitForFunction(() => /Noch keine/.test(document.getElementById('tc-export-status').textContent));

    // A broken file is refused with a clear message.
    await page.locator('#tc-export-existing').setInputFiles({ name: 'tonies.custom.json', mimeType: 'application/json', buffer: Buffer.from('{"model":"x"}') });
    await page.waitForFunction(() => /ist eine Liste/.test(document.getElementById('tc-export-status').textContent));

    // Existing file with an entry of the user's own.
    const own = [{ no: '0', model: 'custom-3', audio_id: ['1700000001'], hash: ['a'.repeat(40)], title: 'Papa liest', series: 'Papa liest', episodes: '', tracks: ['Kapitel 1'], release: '0', language: 'de-de', category: '', pic: '/custom_img/papa.png' }];
    await page.locator('#tc-export-existing').setInputFiles({ name: 'tonies.custom.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(own)) });
    await page.waitForFunction(() => /1 Einträge bleiben erhalten/.test(document.getElementById('tc-export-status').textContent));

    const exportZip = async label => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#tc-export-build').click()]);
      assert.match(download.suggestedFilename(), /^orbit-teddycloud-Export-Test\.zip$/);
      const file = path.join(tmp, label + '.zip'); await download.saveAs(file);
      await page.waitForFunction(() => /✓/.test(document.getElementById('tc-export-status').textContent));
      return unzip(file);
    };
    const first = await exportZip('first');
    if (process.env.SHOT) await page.locator('#tc-export').screenshot({ path: process.env.SHOT });
    const names = Object.keys(first).sort();
    assert.deepEqual(names.filter(n => !n.startsWith('custom_img/')), ['LIESMICH.txt', 'tonies.custom.json']);
    const pics = names.filter(n => n.startsWith('custom_img/orbit/'));
    assert.equal(pics.length, 2, 'two covers rendered: ' + names);
    for (const p of pics) assert.equal(first[p].subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG signature');
    const json1 = JSON.parse(first['tonies.custom.json']);
    assert.deepEqual(json1[0], own[0], 'own entry kept exactly');
    assert.deepEqual(json1.slice(1).map(e => e.model), ['custom-4', 'custom-5']);
    const moon = json1.find(e => e.episodes === 'Der Mond');
    assert.equal(moon.series, 'Gute Nacht'); assert.equal(moon.title, 'Gute Nacht - Der Mond');
    assert.deepEqual(moon.audio_id, []); assert.deepEqual(moon.hash, []);
    assert(moon.pic.startsWith('/custom_img/orbit/') && pics.includes(moon.pic.slice(1)), 'pic points at a file in the ZIP');
    const readme = first['LIESMICH.txt'].toString();
    assert.match(readme, /custom-4 .*Gute Nacht – Der Mond/); assert.match(readme, /übersprungen \(ohne Titel\)/); assert.match(readme, /\/teddycloud\/config\//);
    assert.match(await page.locator('#tc-export-status').textContent(), /2 neu, 0 aktualisiert, aus tonies\.custom\.json übernommen: 1, 1 ohne Titel/);

    // Re-export after audio was linked in TeddyCloud: same models, TeddyCloud values kept.
    json1[1].audio_id = ['1700000099']; json1[1].hash = ['b'.repeat(40)]; json1[1].tracks = ['Teil 1'];
    await page.locator('#tc-export-existing').setInputFiles({ name: 'tonies.custom.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(json1)) });
    await page.waitForFunction(() => /3 Einträge bleiben erhalten/.test(document.getElementById('tc-export-status').textContent));
    const second = await exportZip('second');
    const json2 = JSON.parse(second['tonies.custom.json']);
    assert.deepEqual(json2.map(e => e.model), ['custom-3', 'custom-4', 'custom-5'], 'no duplicates, stable models');
    assert.deepEqual(json2[1].audio_id, ['1700000099']); assert.deepEqual(json2[1].tracks, ['Teil 1']);
    assert.match(await page.locator('#tc-export-status').textContent(), /0 neu, 2 aktualisiert/);

    // Image source that may only be displayed: entry exported without a new picture, user is told why.
    await page.evaluate(async () => {
      const id = orbitCollection.snapshot().items.find(i => i.content.title === 'Der Mond').id;
      const img = await getImage(orbitCollection.snapshot().items.find(i => i.id === id).content.design.image);
      displayOnlyImages.add(img);
    });
    const third = await exportZip('third');
    assert.equal(Object.keys(third).filter(n => n.startsWith('custom_img/')).length, 1);
    assert.match(await page.locator('#tc-export-status').textContent(), /1 Cover ohne Bild/);
    assert.equal(JSON.parse(third['tonies.custom.json']).length, 3, 'entry still exported, picture path kept');

    // Plugin mode: the existing file is read from TeddyCloud when the panel opens.
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => { window.OrbitTeddyCloud = { active: true, get: async p => { if (p !== '/api/toniesCustomJson') throw Error('nicht erlaubt'); return [{ model: 'custom-12', series: 'Server' }]; } }; });
    await page.waitForFunction(() => window.orbitCollection?.library().ready);
    await page.locator('.main-nav [data-view="collection"]').click();
    await page.locator('#tc-export > summary').click();
    await page.waitForFunction(() => /aus deiner TeddyCloud gelesen: 1 Einträge/.test(document.getElementById('tc-export-status').textContent));
    const fourth = await exportZip('fourth');
    assert.deepEqual(JSON.parse(fourth['tonies.custom.json']).map(e => e.model).slice(0, 2), ['custom-12', 'custom-13']);

    assert.deepEqual(errors, []);
    console.log('TeddyCloud export: ZIP checked by zipfile, merge with existing file, stable models and kept TeddyCloud values on re-export, PNG covers, locked image source, skipped entry, bad file and plugin mode passed');
  } finally { await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
