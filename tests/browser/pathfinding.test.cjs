const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
test('BFS and DFS compare editable grids in the browser', async t => {
 const server = spawn('python3', ['start.py', '--port', '0'], { cwd: path.resolve(__dirname, '../..'), env: {...process.env, PYTHONUNBUFFERED:'1'} });
 t.after(()=>server.kill());
 const port = await new Promise((resolve,reject)=>{ server.once('error',reject); server.once('exit',code=>reject(new Error(`Server exited: ${code}`))); server.stdout.on('data',data=>{ const match=String(data).match(/port (\d+)/); if(match)resolve(match[1]); }); });
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'], headless:true});
 t.after(()=>browser.close());
 const page = await browser.newPage(); const errors=[];
 page.on('pageerror', e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/pages/pathfinding.html`);
 assert.equal(await page.locator('.path-cell').count(),494);
 await page.selectOption('#speed','0');
 await page.click('#clear-walls'); await page.click('#run');
 assert.match(await page.textContent('#bfs-result'),/12 stappen/);
 assert.match(await page.textContent('#dfs-result'),/Pad gevonden/);
 for(const name of ['bfs','dfs']) {
  const valid=await page.locator(`#${name}-grid`).evaluate(el=>{
   const cells=[...el.children]; const route=cells.map((c,i)=>c.classList.contains('cell-path')||c.classList.contains('cell-start')||c.classList.contains('cell-end')?i:-1).filter(i=>i>=0);
   const target=cells.findIndex(c=>c.classList.contains('cell-end')); const seen=new Set(); const pending=[cells.findIndex(c=>c.classList.contains('cell-start'))];
   while(pending.length){const n=pending.pop();if(seen.has(n))continue;seen.add(n);for(const next of route)if(Math.abs(next-n)===19||(Math.floor(next/19)===Math.floor(n/19)&&Math.abs(next-n)===1))pending.push(next);}
   return seen.has(target);
  }); assert.ok(valid,`${name} route connects start to end`);
 }
 // Enclose the default end point.
 for(const id of [110,148,128,130]) await page.locator('#bfs-grid button').nth(id).click();
 await page.click('#run');
 assert.match(await page.textContent('#bfs-result'),/Geen pad mogelijk/);
 assert.match(await page.textContent('#dfs-result'),/Geen pad mogelijk/);
 await page.click('#clear-walls');
 await page.check('input[value="start"]'); await page.locator('#dfs-grid button').nth(0).click();
 assert.equal(await page.locator('.cell-start').count(),2);
 await page.check('input[value="end"]'); await page.locator('#bfs-grid button').nth(1).click(); await page.click('#run');
 assert.match(await page.textContent('#bfs-result'),/1 stappen/);
 await page.selectOption('#speed','45'); await page.click('#run'); await page.click('#clear-results');
 await page.waitForTimeout(100); assert.equal(await page.locator('.cell-visited').count(),0);
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no overflow at ${width}`);}
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/tmp/pathfinding-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);
});
