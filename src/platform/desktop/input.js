// Desktop input adapter: keyboard, gamepad, pause and fullscreen-friendly UX.
// The web pointer adapter remains active; this layer is additive.
var desktopPaused = false;
var desktopPauseBgmWasPlaying = false;
var desktopKeys = Object.create(null);
var desktopPadPrev = Object.create(null);
var desktopPadSeen = Object.create(null);

function desktopCanPause() { return state === 'play' || state === 'boss'; }

function desktopSetPaused(v) {
  v = !!v;
  if (v === desktopPaused) return;
  if (v) {
    if (!desktopCanPause()) return;
    desktopPaused = true;
    desktopPauseBgmWasPlaying = !!(bgmAudio && !bgmAudio.paused);
    try { if (bgmAudio) bgmAudio.pause(); } catch (e) {}
  } else {
    desktopPaused = false;
    if (desktopPauseBgmWasPlaying && bgmAudio) {
      try { bgmAudio.play().catch(function(){}); } catch (e) {}
    }
    desktopPauseBgmWasPlaying = false;
  }
}

function desktopTogglePause() {
  if (desktopPaused) desktopSetPaused(false);
  else desktopSetPaused(true);
}

function desktopPrime() {
  try { if (typeof primeVideos === 'function') primeVideos(); } catch (e) {}
  try { if (typeof initAudio === 'function') initAudio(); } catch (e) {}
  try { if (typeof loadSfxExtras === 'function') loadSfxExtras(); } catch (e) {}
  try { if (AC && AC.state === 'suspended') AC.resume(); } catch (e) {}
}

function desktopMenuStart() {
  desktopPrime();
  try { startAtStage(selectedStage); } catch (e) {}
}

function desktopChangeStage(delta) {
  selectedStage = Math.max(0, Math.min(STAGES.length - 1, selectedStage + delta));
}

function desktopConfirm() {
  if (desktopPaused) { desktopSetPaused(false); return; }
  if (state === 'menu') { desktopMenuStart(); return; }
  if (state === 'cast') { state = 'menu'; playBgm('m'); return; }
  if (state === 'win' || state === 'over') { startGame(); return; }
  if (state === 'bossOmen') { bossOmenT = 6.5; return; }
}

function desktopQuit() {
  try {
    if (window.desktopBridge && window.desktopBridge.quit) window.desktopBridge.quit();
  } catch (e) {}
}

function desktopBomb() {
  if (!desktopPaused && (state === 'play' || state === 'boss')) bomb();
}

function desktopKeyDown(e) {
  var k = String(e.key || '').toLowerCase();
  var movement = ['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'];
  if (movement.indexOf(k) >= 0) {
    desktopKeys[k] = true;
    if (e.preventDefault) e.preventDefault();
    if (state === 'menu' && (k === 'arrowleft' || k === 'a')) { desktopChangeStage(-1); return; }
    if (state === 'menu' && (k === 'arrowright' || k === 'd')) { desktopChangeStage(1); return; }
    return;
  }
  if (k === 'z' || k === ' ') {
    if (e.preventDefault) e.preventDefault();
    if (!e.repeat) desktopBomb();
    return;
  }
  if (k === 'escape') {
    if (e.preventDefault) e.preventDefault();
    if (!e.repeat) desktopTogglePause();
    return;
  }
  if (k === 'f11' || (k === 'enter' && e.alt)) {
    if (e.preventDefault) e.preventDefault();
    try { if (window.desktopBridge) window.desktopBridge.toggleFullscreen(); } catch (err) {}
    return;
  }
  if (k === 'enter') {
    if (e.preventDefault) e.preventDefault();
    if (!e.repeat) desktopConfirm();
    return;
  }
  if (k === 'q' && desktopPaused && !e.repeat) desktopQuit();
}

function desktopKeyUp(e) {
  desktopKeys[String(e.key || '').toLowerCase()] = false;
}

function desktopPadButton(pad, i) {
  var b = pad && pad.buttons && pad.buttons[i];
  return !!(b && (b.pressed || b.value > 0.5));
}

function desktopPadEdge(pad, i) {
  var now = desktopPadButton(pad, i);
  var prev = !!desktopPadPrev[i];
  desktopPadPrev[i] = now;
  return now && !prev;
}

function desktopPoll() {
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  var pad = null;
  for (var i = 0; i < pads.length; i++) if (pads[i]) { pad = pads[i]; break; }
  if (!pad) return;

  var a = desktopPadEdge(pad, 0);
  var b = desktopPadEdge(pad, 1);
  var x = desktopPadEdge(pad, 2);
  var start = desktopPadEdge(pad, 9) || desktopPadEdge(pad, 8);
  var left = desktopPadEdge(pad, 14) || (pad.axes[0] < -0.65 && !desktopPadSeen.left);
  var right = desktopPadEdge(pad, 15) || (pad.axes[0] > 0.65 && !desktopPadSeen.right);
  desktopPadSeen.left = pad.axes[0] < -0.65;
  desktopPadSeen.right = pad.axes[0] > 0.65;

  if (start) desktopTogglePause();
  if (a) desktopConfirm();
  if (b || x) desktopBomb();
  if (state === 'menu') {
    if (left) desktopChangeStage(-1);
    if (right) desktopChangeStage(1);
  }
}

function updateDesktopInput(dt) {
  if (desktopPaused) return;
  if (state !== 'play' && state !== 'boss') return;
  var dx = 0, dy = 0;
  if (desktopKeys['arrowleft'] || desktopKeys['a']) dx -= 1;
  if (desktopKeys['arrowright'] || desktopKeys['d']) dx += 1;
  if (desktopKeys['arrowup'] || desktopKeys['w']) dy -= 1;
  if (desktopKeys['arrowdown'] || desktopKeys['s']) dy += 1;
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (var i = 0; i < pads.length; i++) {
    var pad = pads[i]; if (!pad) continue;
    var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    if (Math.abs(ax) > 0.22) dx += ax;
    if (Math.abs(ay) > 0.22) dy += ay;
    if (desktopPadButton(pad, 14)) dx -= 1;
    if (desktopPadButton(pad, 15)) dx += 1;
    if (desktopPadButton(pad, 12)) dy -= 1;
    if (desktopPadButton(pad, 13)) dy += 1;
    break;
  }
  if (!dx && !dy) return;
  var len = Math.hypot(dx, dy) || 1;
  var speed = 410;
  target.x = Math.max(22, Math.min(W - 22, target.x + (dx / len) * speed * dt));
  target.y = Math.max(70, Math.min(H - 70, target.y + (dy / len) * speed * dt));
}

function drawDesktopPause() {
  if (!desktopPaused) return;
  ctx.save();
  ctx.fillStyle = 'rgba(2,6,14,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(159,232,255,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, H * 0.28, W - 44, 230);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 34px Orbitron, Arial, sans-serif';
  ctx.fillText('PAUSED', W / 2, H * 0.38);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '600 15px Rajdhani, Arial, sans-serif';
  ctx.fillText('ESC / START  RESUME', W / 2, H * 0.45);
  ctx.fillStyle = '#8fb8ca';
  ctx.font = '15px Rajdhani, Arial, sans-serif';
  ctx.fillText('Q  QUIT', W / 2, H * 0.49);
  ctx.textAlign = 'left';
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

window.addEventListener('keydown', desktopKeyDown, { passive: false });
window.addEventListener('keyup', desktopKeyUp);
window.addEventListener('blur', function() { desktopKeys = Object.create(null); if (desktopCanPause()) desktopSetPaused(true); });
window.addEventListener('gamepadconnected', function(e) { desktopPadPrev = Object.create(null); });
window.addEventListener('gamepaddisconnected', function() { desktopPadPrev = Object.create(null); });
document.addEventListener('visibilitychange', function() {
  if (document.hidden && desktopCanPause()) desktopSetPaused(true);
  try { if (!document.hidden && AC && AC.state === 'suspended') AC.resume(); } catch (e) {}
});

window.__desktop = function() {
  return { paused: desktopPaused, state: state, targetX: target.x, targetY: target.y, audio: (typeof AC !== 'undefined' && AC) ? AC.state : 'none' };
};
window.__desktopPause = function(v) { desktopSetPaused(!!v); };

// Mouse left button: menu confirm, or a manual fire pulse while playing.
// Normal auto-fire remains active, so holding is never required.
function desktopPrimaryFire() {
  if (desktopPaused) return;
  if (state === 'menu') { desktopMenuStart(); return; }
  if (state === 'cast') { state = 'menu'; playBgm('m'); return; }
  if (state === 'win' || state === 'over') { startGame(); return; }
  if (state !== 'play' && state !== 'boss') return;
  try {
    if (player.weapon === 'spread' && typeof fireSpread === 'function') fireSpread();
    else if (player.weapon === 'missile' && typeof launchMissiles === 'function') launchMissiles();
    else if (typeof fireNormal === 'function') fireNormal();
  } catch (e) {}
}
