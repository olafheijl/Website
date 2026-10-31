const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');

test('portfolio and games work in a real browser', async (t) => {
  const server = spawn('python3', ['start.py', '--port', '0'], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });
  t.after(() => server.kill());
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('HTTP server did not start')), 10000);
    server.once('error', reject);
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    server.stdout.on('data', data => {
      const match = String(data).match(/port (\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  await t.test('portfolio, navigation and responsive layout', async () => {
    await page.goto(`http://127.0.0.1:${port}/`);
    assert.match(await page.title(), /Portfolio/);
    assert.equal(await page.locator('.project-card').count(), 2);
    await page.screenshot({ path: '/tmp/olaf-portfolio-desktop.png', fullPage: true });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: '/tmp/olaf-portfolio-mobile.png', fullPage: true });
    await page.getByRole('navigation').getByRole('link', { name: /Speelveld/ }).click();
    assert.match(await page.title(), /Speelveld/);
    assert.equal(await page.locator('.memory-card').count(), 12);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: '/tmp/olaf-games-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  await t.test('memory blocks duplicate flips and resets safely during a turn', async () => {
    const cards = page.locator('.memory-card');
    await cards.nth(0).click();
    await cards.nth(0).click();
    assert.equal(await page.locator('#memory-turns').textContent(), '0');
    for (let attempt = 0; attempt < 30; attempt++) {
      await page.locator('#memory-reset').click();
      await cards.nth(0).click();
      const symbol = await cards.nth(0).textContent();
      await cards.nth(1).click();
      if (symbol !== await cards.nth(1).textContent()) break;
      assert.ok(attempt < 29, 'Found a mismatch');
    }
    await cards.nth(2).click();
    assert.equal(await cards.nth(2).textContent(), '?', 'Board locked during mismatch');
    await page.locator('#memory-reset').click();
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('.is-open').count(), 0);
    assert.equal(await page.locator('#memory-turns').textContent(), '0');
    assert.equal(await page.locator('#memory-pairs').textContent(), '0 / 6');
  });

  await t.test('a complete memory game can be won', async () => {
    const cards = page.locator('.memory-card');
    const known = new Map();
    for (let i = 0; i < 12; i += 2) {
      await cards.nth(i).click();
      const a = await cards.nth(i).textContent();
      await cards.nth(i + 1).click();
      const b = await cards.nth(i + 1).textContent();
      for (const [symbol, index] of [[a, i], [b, i + 1]]) known.set(symbol, [...(known.get(symbol) || []), index]);
      if (a !== b) await page.waitForTimeout(1000);
    }
    assert.equal(known.size, 6);
    for (const indices of known.values()) {
      for (const index of indices) {
        if (!(await cards.nth(index).getAttribute('class')).includes('is-matched')) await cards.nth(index).click();
      }
    }
    assert.equal(await page.locator('.is-matched').count(), 12);
    assert.equal(await page.locator('#memory-pairs').textContent(), '6 / 6');
    assert.match(await page.locator('#memory-status').textContent(), /Goed gedaan!/);
  });

  await t.test('reaction handles early input, keyboard, results and persistence', async () => {
    const pad = page.locator('#reaction-pad');
    await pad.click();
    await pad.click();
    assert.equal(await pad.getAttribute('data-state'), 'early');
    assert.equal(await page.locator('#reaction-last').textContent(), '—');
    await page.evaluate(() => { Math.random = () => 0; });
    await pad.focus();
    await page.keyboard.press('Space');
    assert.equal(await pad.getAttribute('data-state'), 'waiting');
    await page.waitForFunction(() => document.querySelector('#reaction-pad').dataset.state === 'ready');
    await page.keyboard.press('Space');
    assert.equal(await pad.getAttribute('data-state'), 'result');
    const score = await page.locator('#reaction-last').textContent();
    assert.match(score, /^\d+ ms$/);
    assert.equal(await page.locator('#reaction-best').textContent(), score);
    await page.reload();
    assert.equal(await page.locator('#reaction-best').textContent(), score);
    assert.deepEqual(errors, [], 'No JavaScript errors or failed HTTP requests');
  });
});
