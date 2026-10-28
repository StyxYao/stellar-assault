// Headless render/input smoke. Uses Playwright when available; the desktop CI
// installs it explicitly. Local runs can set NODE_PATH to a Playwright install.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  try { ({ chromium } = require('playwright-core')); }
  catch { console.error('SKIP: playwright/playwright-core is not installed'); process.exit(0); }
}

const HTTP_PORT = 8911, WS_PORT = 8912;
const server = spawn(process.execPath, ['tools/lan_server.mjs', String(HTTP_PORT), String(WS_PORT)], { stdio: 'ignore' });
const errors = [];
let browser;
try {
  await new Promise(r => setTimeout(r, 700));
  browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(`http://127.0.0.1:${HTTP_PORT}/index.html?debug=1`);
  await page.waitForTimeout(700);
  const menuVideos = await page.evaluate(() => Array.from(document.querySelectorAll('video')).filter(v => !v.paused).length);
  if (menuVideos) throw new Error('menu started ' + menuVideos + ' videos');

  await page.evaluate(() => { window.__selectShip('vector'); window.__runStage(4); });
  await page.waitForTimeout(1300);
  await page.evaluate(() => document.querySelectorAll('video').forEach(v => v.pause()));
  await page.evaluate(() => window.__boss());
  await page.waitForTimeout(500);
  for (let phase = 0; phase < 3; phase++) {
    await page.evaluate(p => window.__setBossPhase(p), phase);
    await page.waitForTimeout(150);
    const info = await page.evaluate(() => ({ state: window.__g().state, stage: window.__g().stage, phase: window.__g().phase, hp: window.__playerState().hp }));
    if (info.stage !== 4 || info.state === 'menu' || info.hp <= 0) throw new Error('phase render state invalid: ' + JSON.stringify(info));
  }
  // Exercise the real phase3 video path, including the alpha mask. The earlier
  // checks intentionally pause videos to cover the static fallback.
  await page.evaluate(() => {
    const v = Array.from(document.querySelectorAll('video')).find(x => x.src.includes('phase3-loop'));
    if (v) v.play();
    window.__setBossPhase(2);
  });
  await page.waitForTimeout(900);
  const phase3 = await page.evaluate(() => {
    const v = Array.from(document.querySelectorAll('video')).find(x => x.src.includes('phase3-loop'));
    return { paused: v ? v.paused : null, mask: v ? !!v.__phase3Mask : null, errors: window.__errorLog ? window.__errorLog() : [] };
  });
  if (phase3.paused) throw new Error('phase3 video did not play');
  if (!phase3.mask) throw new Error('phase3 alpha mask was not generated');
  if (phase3.errors.length) throw new Error('phase3 reported errors: ' + JSON.stringify(phase3.errors));

  const logged = await page.evaluate(() => window.__errorLog ? window.__errorLog() : []);
  if (logged.length) throw new Error('reported errors: ' + JSON.stringify(logged));
  if (errors.length) throw new Error(errors.join('\n'));

  await page.evaluate(() => window.__runStage(0));
  await page.waitForTimeout(3200);
  await page.keyboard.press('p');
  await page.waitForTimeout(100);
  const paused = await page.evaluate(() => window.__desktop ? window.__desktop().paused : false);
  if (!paused) throw new Error('P did not pause');
  console.log('render smoke: PASS');
} catch (e) {
  console.error('render smoke: FAIL');
  console.error(e && e.stack || e);
  process.exitCode = 1;
} finally {
  try { if (browser) await browser.close(); } catch {}
  try { server.kill(); } catch {}
}
