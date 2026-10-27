// Deterministic PRNG for replay and future LAN state sync.
// All simulation randomness should call rng(), not rng().
var rngState = ((Date.now() ^ (Date.now() >>> 7)) >>> 0) || 0x9e3779b9;

function setRngSeed(seed) {
  rngState = (Number(seed) >>> 0) || 0x9e3779b9;
  return rngState;
}

function getRngSeed() { return rngState >>> 0; }

function rng() {
  // mulberry32
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  var t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rngInt(n) { return Math.floor(rng() * n); }

// Visual-only RNG: shake/background must not consume simulation RNG.
var vrngState = ((Date.now() ^ 0xA5A5A5A5) >>> 0) || 0x85ebca6b;
function setVisualSeed(seed) { vrngState = (Number(seed) >>> 0) || 0x85ebca6b; return vrngState; }
function vrng() {
  vrngState = (vrngState + 0x6D2B79F5) >>> 0;
  var t = vrngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function vrand(a, b) { return a + vrng() * (b - a); }
