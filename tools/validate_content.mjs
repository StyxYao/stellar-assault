import fs from 'node:fs';
import vm from 'node:vm';

function loadVar(file, name) {
  const code = fs.readFileSync(file, 'utf8') + `\n;globalThis.__value = ${name};`;
  const ctx = { console };
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx); } catch (e) { throw new Error(`${file}: ${e.message}`); }
  return ctx.__value;
}

const ET = loadVar('src/content/enemy-archetypes.js', 'ET');
const waves = loadVar('src/content/stage5-waves.js', 'STAGE5_WAVES');
const errors = [];
if (ET.length !== 15) errors.push(`ET length ${ET.length}, expected 15`);
for (let t = 9; t <= 14; t++) {
  if (!waves.some(w => w.type === t)) errors.push(`stage5 waves never use enemy type ${t}`);
}
for (let i = 1; i < waves.length; i++) {
  if (!(waves[i].t > waves[i - 1].t)) errors.push(`wave times not increasing at ${i}`);
}
for (const w of waves) {
  if (!Number.isFinite(w.t) || !Number.isFinite(w.n) || w.n <= 0) errors.push(`bad wave ${JSON.stringify(w)}`);
  if (!ET[w.type]) errors.push(`wave references missing ET[${w.type}]`);
}
if (errors.length) { errors.forEach(e => console.error('ERROR:', e)); process.exit(1); }
console.log(`content ok: ${ET.length} archetypes, ${waves.length} stage-5 waves`);
