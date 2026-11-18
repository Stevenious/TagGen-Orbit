// Run with: node tests/cover-assist.cjs
// Cover assist: colours from the motif (Color Thief) and crop suggestion (smartcrop.js), undo,
// square covers, missing image and a display-only image source.
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

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    let pngForRemote = null;
    await page.route('https://images.example.test/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: pngForRemote })); // no CORS header
    page.setDefaultTimeout(20000);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.OrbitCoverAssist && window.orbitCollection?.library().ready);

    // Pure colour choice: a dark dominant colour becomes a light, readable background.
    const pure = await page.evaluate(() => { const A = window.OrbitCoverAssist; const r = A.chooseColors('#1b2a4a', { Vibrant: '#e63946' }, ['#1b2a4a', '#e63946']); return { ...r, bg: A.contrast(r.background, '#172033'), ac: A.contrast(r.accent, r.background) }; });
    assert(pure.bg >= 4.5 && pure.ac >= 3, JSON.stringify(pure));

    // A test motif: light sky, red subject on the right.
    const dataUrl = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#bfe3ff'; x.fillRect(0, 0, 800, 400); x.fillStyle = '#d62828'; x.beginPath(); x.arc(640, 200, 95, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fcbf49'; x.fillRect(610, 170, 60, 60); x.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) x.fillRect(60 + i * 70, 320, 30, 8); return c.toDataURL('image/png'); });
    const png = Buffer.from(dataUrl.split(',')[1], 'base64'); pngForRemote = png;

    // Without an image the buttons explain what is missing.
    await page.locator('.main-nav [data-view="create"]').click();
    await page.locator('#universe-start-own').click();
    await page.waitForFunction(() => state.view === 'studio');
    await page.locator('#assist-colors').waitFor({ state: 'visible' });
    assert(await page.evaluate(() => document.getElementById('cover-assist').parentElement.id === 'universe-smart'), 'helpers sit in the visible quick settings');
    await page.locator('#assist-colors').click();
    await page.waitForFunction(() => /Erst ein Motiv/.test(document.getElementById('assist-status').textContent));

    await page.locator('#image-file').setInputFiles({ name: 'motiv.png', mimeType: 'image/png', buffer: png });
    await page.waitForFunction(() => state.design.image && state.design.image.startsWith('data:image/'));
    const before = await page.evaluate(() => ({ accent: state.design.accent, background: state.design.background, zoom: state.design.zoom, x: state.design.x, y: state.design.y }));

    // Colours from the motif: readable and taken from the picture.
    await page.locator('#assist-colors').click();
    await page.waitForFunction(() => /übernommen/.test(document.getElementById('assist-status').textContent));
    const colors = await page.evaluate(() => ({ accent: state.design.accent, background: state.design.background, input: document.getElementById('accent').value, dirty: state.dirty }));
    assert.notEqual(colors.background, before.background, 'background changed');
    assert.equal(colors.input, colors.accent, 'controls show the new values');
    const check = await page.evaluate(c => ({ bg: OrbitCoverAssist.contrast(c.background, '#172033'), ac: OrbitCoverAssist.contrast(c.accent, c.background) }), colors);
    assert(check.bg >= 4.5, 'dark title stays readable: ' + check.bg);
    assert(check.ac >= 3, 'series text stands out: ' + check.ac);
    const [r, g, b] = [1, 3, 5].map(i => parseInt(colors.accent.slice(i, i + 2), 16));
    assert(r > g + 40 && r > b + 40, 'accent comes from the red subject: ' + colors.accent);
    assert(await page.locator('#assist-undo').isVisible());
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });

    // Undo restores exactly the colours.
    await page.locator('#assist-undo').click();
    assert.deepEqual(await page.evaluate(() => ({ accent: state.design.accent, background: state.design.background })), { accent: before.accent, background: before.background });
    assert(await page.locator('#assist-undo').isHidden());

    // Crop suggestion: the subject on the right moves to the centre and fills the round cover.
    await page.locator('#assist-crop').click();
    await page.waitForFunction(() => /Ausschnitt vorgeschlagen/.test(document.getElementById('assist-status').textContent));
    const crop = await page.evaluate(() => ({ zoom: state.design.zoom, x: state.design.x, y: state.design.y, slider: Number(document.getElementById('zoom').value) }));
    assert(crop.zoom > 100 && crop.zoom <= 180, 'zoom within limits: ' + crop.zoom);
    assert(crop.x < 0 && crop.x >= -25, 'image shifts left to centre the subject: ' + crop.x);
    assert(Math.abs(crop.y) <= 3, 'vertical centre kept: ' + crop.y);
    assert.equal(crop.slider, crop.zoom);
    // Manual change after the suggestion is kept apart: undo resets only the crop values.
    await page.evaluate(() => { document.getElementById('accent').value = '#123456'; document.getElementById('accent').dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('#assist-undo').click();
    assert.deepEqual(await page.evaluate(() => ({ zoom: state.design.zoom, x: state.design.x, y: state.design.y, accent: state.design.accent })), { zoom: before.zoom, x: before.x, y: before.y, accent: '#123456' });

    // Square cover with "Flächig": still within limits.
    await page.locator('#universe-pro > summary').click();
    await page.locator('#cover-shape').selectOption('square');
    await page.locator('#square-fit').selectOption('cover');
    await page.locator('#assist-crop').click();
    await page.waitForFunction(() => /Ausschnitt vorgeschlagen/.test(document.getElementById('assist-status').textContent) && state.design.shape === 'square');
    const square = await page.evaluate(() => ({ zoom: state.design.zoom, x: state.design.x }));
    assert(square.zoom >= 40 && square.zoom <= 180 && square.x < 0, JSON.stringify(square));

    // A display-only image source (loaded without CORS, so its pixels are locked): clear message, nothing changed.
    // Playwright's request routing always answers with CORS headers, so the app's own marker is set directly.
    await page.evaluate(async () => { state.design.image = 'https://images.example.test/motiv.png'; syncControls(); readControls(); displayOnlyImages.add(await getImage(state.design.image)); });
    const keep = await page.evaluate(() => state.design.background);
    await page.locator('#assist-colors').click();
    await page.waitForFunction(() => /erlaubt kein Auslesen/.test(document.getElementById('assist-status').textContent));
    assert.equal(await page.evaluate(() => state.design.background), keep);

    // Both helpers are loaded only on demand and come from the app itself.
    assert(await page.evaluate(() => [...document.scripts].some(s => s.src.endsWith('/vendor/color-thief.js')) && [...document.scripts].some(s => s.src.endsWith('/vendor/smartcrop.js'))));
    assert.deepEqual(errors, []);
    console.log('Cover assist: readable colours from the motif, undo, crop suggestion centring the subject, undo limited to its own values, square cover, missing image and display-only source passed');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
