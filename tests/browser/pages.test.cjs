const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

test('static Pages demo works under the repository path without a backend', async t => {
  const root = path.resolve(__dirname, '../..');
  const temp = mkdtempSync(path.join(tmpdir(), 'olaf-pages-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  execFileSync('python3', ['scripts/build_pages.py', '--output', path.join(temp, 'Website')], { cwd: root });
  const server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', temp]);
  t.after(() => server.kill());
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Static server did not start')), 10000);
    server.once('error', reject);
    server.stdout.on('data', data => {
      const match = String(data).match(/port (\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [], apiRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (new URL(r.url()).pathname.includes('/api/')) apiRequests.push(r.url()); });
  const base = `http://127.0.0.1:${port}/Website`;
  await page.goto(`${base}/`);
  await page.getByRole('navigation').getByRole('link', { name: 'Padvinder' }).click();
  await page.selectOption('#speed', '0');
  await page.click('#clear-walls'); await page.click('#run');
  assert.match(await page.textContent('#bfs-result'), /12 stappen/);
  await page.goto(`${base}/pages/games.html`);
  assert.equal(await page.locator('.memory-card').count(), 12);
  await page.locator('.memory-card').first().click();
  assert.equal(await page.locator('.is-open').count(), 1);
  await page.click('#reaction-pad');
  assert.equal(await page.locator('#reaction-pad').getAttribute('data-state'), 'waiting');
  await page.goto(`${base}/pages/multiplayer.html?game=gomoku&room=ABCDEF`);
  assert.match(await page.textContent('.local-note'), /online demo niet speelbaar/);
  assert.equal(await page.locator('#lobby').isVisible(), false);
  assert.ok(await page.getByRole('link', { name: 'Ontdek Padvinder' }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(apiRequests, []);
  assert.deepEqual(errors, []);
});
