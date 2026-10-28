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
    try { if (typeof recordScoreSnapshot === 'function') recordScoreSnapshot(); } catch (e) {}
    desktopPauseBgmWasPlaying = !!(bgmAudio && !bgmAudio.paused);
    try { if (bgmAudio) bgmAudio.pause(); } catch (e) {}
  } else {
    desktopPaused = false;
    if (typeof closeSettings === 'function') closeSettings();
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
  if (typeof menuMoveSfx === 'function') menuMoveSfx();
  var modes = (typeof menuModeButtons === 'function') ? menuModeButtons() : [];
  var mode = modes[typeof menuModeIndex === 'number' ? menuModeIndex : 0];
  if (mode && typeof activateMainMode === 'function') activateMainMode(mode.id);
  else if (typeof openStartConfirm === 'function') openStartConfirm();
}

function desktopChangeStage(delta) {
  var before = selectedStage;
  selectedStage = Math.max(0, Math.min(STAGES.length - 1, selectedStage + delta));
  if (selectedStage !== before && typeof menuMoveSfx === 'function') menuMoveSfx();
}

function desktopConfirm() {
  if (desktopPaused) { desktopSetPaused(false); return; }
  if (state === 'menu' && typeof tutorialOpen !== 'undefined' && tutorialOpen) {
    if (typeof menuConfirmSfx === 'function') menuConfirmSfx();
    tutorialNext();
    return;
  }
  if (state === 'menu' && typeof controlSelectOpen !== 'undefined' && controlSelectOpen) {
    if (k === 'escape') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); closeControlSelect(); return; }
    if (k === 'arrowup' || k === 'w') { controlSelectIndex = (controlSelectIndex + 4) % 5; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'arrowdown' || k === 's') { controlSelectIndex = (controlSelectIndex + 1) % 5; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k >= '1' && k <= '5') { controlSelectIndex = Number(k) - 1; if (typeof menuConfirmSfx === 'function') menuConfirmSfx(); controlSelectChoose(controlSelectIndex); return; }
    if (k === 'enter' || k === ' ') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) controlSelectChoose(controlSelectIndex); return; }
    return;
  }
  if (state === 'menu' && typeof startConfirmOpen !== 'undefined' && startConfirmOpen) {
    if (typeof menuConfirmSfx === 'function') menuConfirmSfx();
    closeStartConfirm();
    startAtStage(selectedStage);
    return;
  }
  if (state === 'menu' && typeof skinSelectOpen !== 'undefined' && skinSelectOpen) {
    if (typeof menuConfirmSfx === 'function') menuConfirmSfx();
    skinSelectChoose(skinSelectIndex);
    return;
  }
  if (state === 'menu' && typeof shipSelectOpen !== 'undefined' && shipSelectOpen) {
    if (shipSelectChoose(shipSelectIndex) && typeof menuMoveSfx === 'function') menuMoveSfx();
    return;
  }
  if (state === 'menu') { desktopMenuStart(); return; }
  if (state === 'cast') { state = 'menu'; playBgm('m'); return; }
  if (state === 'win' || state === 'over') { startGame(); return; }
  if (state === 'bossOmen') { bossOmenT = 6.5; return; }
}

function desktopQuit() {
  try { if (typeof recordScoreSnapshot === 'function') recordScoreSnapshot(); } catch (e) {}
  try {
    if (window.desktopBridge && window.desktopBridge.quit) window.desktopBridge.quit();
  } catch (e) {}
}

function desktopBomb() {
  if (!desktopPaused && (state === 'play' || state === 'boss')) bomb();
}

function desktopKeyDown(e) {
  if (state === 'menu') desktopPrime();
  var k = String(e.key || '').toLowerCase();
  if (typeof settingsOpen !== 'undefined' && settingsOpen) {
    if (k === 'escape' || k === 'q') { closeSettings(); return; }
    if (k === 'arrowup' || k === 'w') { settingsMove(-1); return; }
    if (k === 'arrowdown' || k === 's') { settingsMove(1); return; }
    if (k === 'arrowleft' || k === 'a') { settingsAdjust(-1); return; }
    if (k === 'arrowright' || k === 'd') { settingsAdjust(1); return; }
    if (k === 'enter' || k === ' ') { settingsActivate(); return; }
    return;
  }
  if (state === 'menu' && typeof tutorialOpen !== 'undefined' && tutorialOpen) {
    if (k === 'escape') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); closeTutorial(); return; }
    if (k === 'enter' || k === ' ' || k === 'arrowright' || k === 'd') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) desktopConfirm(); return; }
    if (k === 'arrowleft' || k === 'a') { if (!e.repeat) tutorialPrev(); return; }
    return;
  }
  if (state === 'menu' && typeof startConfirmOpen !== 'undefined' && startConfirmOpen) {
    if (k === 'escape') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); closeStartConfirm(); return; }
    if (k === 'enter' || k === ' ') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) desktopConfirm(); return; }
    if (k === 'v') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openShipSelect('p1'); return; }
    if (k === 'b') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openSkinSelect('p1'); return; }
    if (k === 'arrowleft' || k === 'a') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); selectedStage = (selectedStage + 4) % 5; return; }
    if (k === 'arrowright' || k === 'd') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); selectedStage = (selectedStage + 1) % 5; return; }
    if (k >= '1' && k <= '5') { selectedStage = Number(k) - 1; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'p') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openControlSelect(1); return; }
    if (k === 'o') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openControlSelect(2); return; }
    if (k === 'j') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openShipSelect('p2'); return; }
    if (k === 'k') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openSkinSelect('p2'); return; }
    return;
  }
  if (state === 'menu' && typeof skinSelectOpen !== 'undefined' && skinSelectOpen) {
    var skList = (typeof skinList === 'function') ? skinList(selectedShip) : [];
    if (k === 'arrowup' || k === 'w') { skinSelectIndex = (skinSelectIndex + skList.length - 1) % skList.length; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'arrowdown' || k === 's') { skinSelectIndex = (skinSelectIndex + 1) % skList.length; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'enter' || k === ' ') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) desktopConfirm(); return; }
    if (k === 't') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); openTutorial(selectShipId()); return; }
    if (k === 'b') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); backToShipSelect(); return; }
    if (k === 'escape') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); closeSkinSelect(); return; }
    return;
  }
  if (state === 'menu' && typeof shipSelectOpen !== 'undefined' && shipSelectOpen) {
    if (k === 'arrowup' || k === 'w') { shipSelectIndex = (shipSelectIndex + 2) % 3; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'arrowdown' || k === 's') { shipSelectIndex = (shipSelectIndex + 1) % 3; if (typeof menuMoveSfx === 'function') menuMoveSfx(); return; }
    if (k === 'enter' || k === ' ') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) desktopConfirm(); return; }
    if (k === 't') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); var trows=shipSelectRows(); openTutorial(trows[shipSelectIndex]?trows[shipSelectIndex].def.id:selectedShip); return; }
    if (k === 'escape' || k === 'v') { if (typeof menuMoveSfx === 'function') menuMoveSfx(); closeShipSelect(); return; }
    return;
  }
  if (state === 'menu' && (k === '1' || k === '2' || k === '3')) {
    if (e.preventDefault) e.preventDefault();
    menuModeIndex = k === '1' ? 0 : (k === '2' ? 1 : 2);
    if (typeof menuMoveSfx === 'function') menuMoveSfx();
    desktopMenuStart();
    return;
  }
  if (state === 'menu' && k === 'tab') {
    if (e.preventDefault) e.preventDefault();
    menuModeIndex = (menuModeIndex + 1) % 3;
    if (typeof menuMoveSfx === 'function') menuMoveSfx();
    return;
  }
  if (k === 'c' && player && player.ship === 'aegis' && (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'keyboard'))) { e.preventDefault && e.preventDefault(); if (!e.repeat) aegisTapCharge(); return; }
  if (k === 'f' && player && player.ship === 'aegis' && (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'keyboard'))) { e.preventDefault && e.preventDefault(); if (!e.repeat) aegisTapForce(); return; }
  if (k === 's' && desktopPaused) { openSettings(); return; }
  var movement = ['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'];
  if (movement.indexOf(k) >= 0) {
    if (state !== 'menu' && (typeof controlModeAllows === 'function' && !controlModeAllows(1, 'keyboard'))) return;
    desktopKeys[k] = true;
    if (e.preventDefault) e.preventDefault();
    if (state === 'menu' && (k === 'arrowleft' || k === 'a')) { desktopChangeStage(-1); return; }
    if (state === 'menu' && (k === 'arrowright' || k === 'd')) { desktopChangeStage(1); return; }
    return;
  }
  if (k === 'z' || k === ' ') {
    if (e.preventDefault) e.preventDefault();
    if (!e.repeat && (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'keyboard'))) desktopBomb();
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
  if (typeof settingsOpen !== 'undefined' && settingsOpen) {
    var sup = desktopPadEdge(pad, 12) || (pad.axes[1] < -0.65 && !desktopPadSeen.up);
    var sdown = desktopPadEdge(pad, 13) || (pad.axes[1] > 0.65 && !desktopPadSeen.down);
    var sleft = desktopPadEdge(pad, 14) || (pad.axes[0] < -0.65 && !desktopPadSeen.left);
    var sright = desktopPadEdge(pad, 15) || (pad.axes[0] > 0.65 && !desktopPadSeen.right);
    desktopPadSeen.up = pad.axes[1] < -0.65;
    desktopPadSeen.down = pad.axes[1] > 0.65;
    desktopPadSeen.left = pad.axes[0] < -0.65;
    desktopPadSeen.right = pad.axes[0] > 0.65;
    if (sup) settingsMove(-1);
    if (sdown) settingsMove(1);
    if (sleft) settingsAdjust(-1);
    if (sright) settingsAdjust(1);
    if (a) settingsActivate();
    if (b) closeSettings();
    return;
  }
  var left = desktopPadEdge(pad, 14) || (pad.axes[0] < -0.65 && !desktopPadSeen.left);
  var right = desktopPadEdge(pad, 15) || (pad.axes[0] > 0.65 && !desktopPadSeen.right);
  desktopPadSeen.left = pad.axes[0] < -0.65;
  desktopPadSeen.right = pad.axes[0] > 0.65;

  if (state === 'menu' && typeof skinSelectOpen !== 'undefined' && skinSelectOpen) {
    var padSkins = (typeof skinList === 'function') ? skinList(selectedShip) : [];
    if (desktopPadEdge(pad, 12)) skinSelectIndex = (skinSelectIndex + padSkins.length - 1) % padSkins.length;
    if (desktopPadEdge(pad, 13)) skinSelectIndex = (skinSelectIndex + 1) % padSkins.length;
    if (desktopPadEdge(pad, 0)) desktopConfirm();
    if (desktopPadEdge(pad, 1)) closeSkinSelect();
    if (desktopPadEdge(pad, 3)) closeSkinSelect();
    return;
  }
  if (state === 'menu' && typeof shipSelectOpen !== 'undefined' && shipSelectOpen) {
    if (desktopPadEdge(pad, 12)) shipSelectIndex = (shipSelectIndex + 2) % 3;
    if (desktopPadEdge(pad, 13)) shipSelectIndex = (shipSelectIndex + 1) % 3;
    if (desktopPadEdge(pad, 0)) desktopConfirm();
    if (desktopPadEdge(pad, 1)) closeShipSelect();
    if (desktopPadEdge(pad, 3)) closeShipSelect();
    return;
  }
  var p1PadPlay = (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'gamepad'));
  if (p1PadPlay && player && player.ship === 'aegis' && (state === 'play' || state === 'boss')) {
    if (desktopPadEdge(pad, 3)) aegisTapCharge();
    if (desktopPadEdge(pad, 5)) aegisTapForce();
  }
  if (start) desktopTogglePause();
  if (a) desktopConfirm();
  if (p1PadPlay && (b || x)) desktopBomb();
}

function updateDesktopInput(dt) {
  if (desktopPaused) return;
  if (state !== 'play' && state !== 'boss') return;
  var dx = 0, dy = 0;
  var p1Kb = (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'keyboard'));
  var p1Pad = (typeof controlModeAllows !== 'function' || controlModeAllows(1, 'gamepad'));
  if (p1Kb) {
    if (desktopKeys['arrowleft'] || desktopKeys['a']) dx -= 1;
    if (desktopKeys['arrowright'] || desktopKeys['d']) dx += 1;
    if (desktopKeys['arrowup'] || desktopKeys['w']) dy -= 1;
    if (desktopKeys['arrowdown'] || desktopKeys['s']) dy += 1;
  }
  var pads = p1Pad ? (navigator.getGamepads ? navigator.getGamepads() : []) : [];
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

function pauseMenuButtons(){
  return {
    resume:{x:W*0.20,y:H*0.43,w:W*0.60,h:48},
    settings:{x:W*0.20,y:H*0.51,w:W*0.60,h:44},
    quit:{x:W*0.20,y:H*0.59,w:W*0.60,h:44}
  };
}
function pauseMenuAt(p){
  var b=pauseMenuButtons();
  for(var k in b){var q=b[k];if(p.x>=q.x&&p.x<=q.x+q.w&&p.y>=q.y&&p.y<=q.y+q.h)return k;}
  return '';
}
function pauseQuitToMenu(){
  try { if (typeof recordScoreSnapshot === 'function') recordScoreSnapshot(); } catch(e){}
  try { if (typeof desktopSetPaused === 'function') desktopSetPaused(false); } catch(e){}
  try { if (typeof closeSettings === 'function') closeSettings(); } catch(e){}
  selectedStage = Math.max(0, Math.min(STAGES.length-1, stage||0));
  state = 'menu';
  try { playBgm('m'); } catch(e){}
}

function drawDesktopPause() {
  if (!desktopPaused) return;
  if (typeof settingsOpen !== 'undefined' && settingsOpen) { drawSettingsPanel(); return; }
  ctx.save();
  ctx.fillStyle='rgba(2,6,14,0.78)';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(159,232,255,0.55)';ctx.lineWidth=1;
  ctx.strokeRect(22,H*0.30,W-44,H*0.40);
  ctx.textAlign='center';
  ctx.fillStyle='#ffffff';ctx.font='600 34px Orbitron, Arial, sans-serif';
  ctx.fillText('PAUSED',W/2,H*0.37);
  ctx.fillStyle='#8fb8ca';ctx.font='12px Rajdhani, Arial, sans-serif';
  ctx.fillText('ESC / START  RESUME',W/2,H*0.405);
  var b=pauseMenuButtons();
  function btn(q,label,col){
    ctx.fillStyle='rgba(6,18,30,0.94)';ctx.fillRect(q.x,q.y,q.w,q.h);
    ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.strokeRect(q.x,q.y,q.w,q.h);
    ctx.fillStyle='#eaf8ff';ctx.font='700 15px Rajdhani, Arial, sans-serif';ctx.textAlign='center';
    ctx.fillText(label,q.x+q.w/2,q.y+q.h/2+5);
  }
  btn(b.resume,'RESUME','#9fe8ff');
  btn(b.settings,'SETTINGS','#8fb8ca');
  btn(b.quit,'QUIT TO MENU','#ff9a7a');
  ctx.fillStyle='#6d879b';ctx.font='9px monospace';
  ctx.fillText('S  SETTINGS   Q  QUIT',W/2,H*0.67);
  ctx.textAlign='left';ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
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
  if (player.ship === 'aegis' && typeof aegisState !== 'undefined' && (aegisState.charge === 'charging' || player.odT > 0)) return;
  try {
    if (player.weapon === 'spread' && typeof fireSpread === 'function') fireSpread();
    else if (player.weapon === 'missile' && typeof launchMissiles === 'function') launchMissiles();
    else if (typeof fireNormal === 'function') fireNormal();
  } catch (e) {}
}

// Desktop starts the menu score without requiring a click. Electron is launched
// with autoplay-policy=no-user-gesture-required; the web build keeps the
// normal first-gesture policy.
function desktopBootAudio(){
  if (!window.desktopBridge) return;
  try {
    if (typeof initAudio === 'function') initAudio();
    if (typeof loadSfxExtras === 'function') loadSfxExtras();
    if (typeof AC !== 'undefined' && AC && AC.state === 'suspended') AC.resume();
    if (typeof audioReady !== 'undefined') audioReady = true;
    if (typeof playBgm === 'function' && state === 'menu') playBgm('m');
  } catch (e) {}
}
if (typeof window !== 'undefined') {
  window.addEventListener('load', function () { setTimeout(desktopBootAudio, 250); });
}
