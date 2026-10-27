import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { Math, Date };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/core/rng.js', 'utf8') + '\n' + fs.readFileSync('src/core/math.js', 'utf8') + '\n;globalThis.api={rand,clamp,clamp01,lerp,dist2};', ctx);
const { rand, clamp, clamp01, lerp, dist2 } = ctx.api;
for (let i = 0; i < 1000; i++) { const r = rand(-3, 7); if (r < -3 || r > 7) throw new Error('rand out of range'); }
if (clamp(5, 0, 1) !== 1 || clamp(-1, 0, 1) !== 0) throw new Error('clamp failed');
if (clamp01(2) !== 1 || clamp01(-2) !== 0) throw new Error('clamp01 failed');
if (lerp(0, 10, .25) !== 2.5) throw new Error('lerp failed');
if (dist2(0, 0, 3, 4) !== 25) throw new Error('dist2 failed');
console.log('math ok');
