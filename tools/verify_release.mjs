#!/usr/bin/env node
// Lightweight release guard. Run before tagging an RC/final build.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const desktop = JSON.parse(fs.readFileSync(path.join(root, 'desktop/package.json'), 'utf8'));
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const required = ['dist/index.html', 'dist/build.txt', 'tools/lan_server.mjs', 'desktop/main.cjs', 'docs/RELEASE_1_0.md'];
const errors = [];
if (!version) errors.push('VERSION empty');
if (desktop.version !== version) errors.push(`desktop version ${desktop.version} != ${version}`);
if (!readme.includes(version)) errors.push('README does not mention VERSION');
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) errors.push(`missing ${rel}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`release guard ok: ${version}`);
