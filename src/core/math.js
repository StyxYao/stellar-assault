// Pure math helpers. No DOM / canvas / audio.
function rand(a, b) { return a + rng() * (b - a); }
function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
