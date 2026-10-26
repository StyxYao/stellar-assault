// R3.0 local co-op vertical slice. P1 is the existing player; P2 is a VECTOR
// slot controlled by IJKL or the second gamepad. This module intentionally
// keeps P2 self-contained so single-player paths are untouched.
var coopEnabled = false;
var coopInputMode = 'off'; // off | kb | mouse
var player2 = null;
var aegisState2 = null;
var phantomState2 = null;
var target2 = { x: W / 2 - 70, y: H - 150 };
var coopKeys = Object.create(null);
var coopLastShot = 0, coopLastSpecial = 0, coopLastMissile = 0;
var coopPadPrevB = false, coopPadPrevF = false;

function coopModeLabel() {
  if (!coopEnabled) return 'CO-OP OFF';
  return coopInputMode === 'mouse' ? 'P1 KB + P2 MOUSE' : '2P KEYBOARD';
}

function coopToggle() {
  if (!coopEnabled) { coopEnabled = true; coopInputMode = 'kb'; pickupMsg = 'CO-OP · 2P KEYBOARD'; }
  else if (coopInputMode === 'kb') { coopInputMode = 'mouse'; pickupMsg = 'CO-OP · P1 KB + P2 MOUSE'; }
  else { coopEnabled = false; coopInputMode = 'off'; player2 = null; pickupMsg = 'CO-OP OFF'; }
  pickupT = 1.6;
}

function coopClone(o) { return JSON.parse(JSON.stringify(o)); }
function coopSwapEnter() {
  var s = { player: player, target: target, aegis: aegisState, phantom: phantomState };
  player = player2; target = target2;
  if (player2.ship === 'aegis') aegisState = aegisState2;
  if (player2.ship === 'phantom') phantomState = phantomState2;
  return s;
}
function coopSwapExit(s) {
  player = s.player; target = s.target; aegisState = s.aegis; phantomState = s.phantom;
}
function coopSpawn() {
  if (!coopEnabled) { player2 = null; return; }
  var ship = (typeof selectedShip !== 'undefined') ? selectedShip : 'vector';
  var skin = (selectedSkins && selectedSkins[ship]) ? selectedSkins[ship] : (ship === 'aegis' ? 'orbital' : (ship === 'phantom' ? 'quantum' : 'void_lance'));
  player2 = {
    x: W / 2 - 72, y: H - 150, r: 6,
    lives: 3, hp: 3, maxHp: 3,
    bombs: 3, od: 0, odT: 0, powerXp: 0,
    respawnT: 0, respawnGift: false, invuln: 2.0, bank: 0, noBlink: false,
    power: 1, weapon: 'normal', specialPower: 1, options: 0, wingPower: 1,
    ship: ship, skin: skin, trail: [], wingEntry: []
  };
  var d = (typeof currentSkinDef === 'function') ? currentSkinDef() : null;
  player2.maxHp = (d && d.maxHp) ? d.maxHp : 3;
  player2.hp = player2.maxHp;
  player2.extraBullets = (d && d.extraBullets) ? d.extraBullets : 0;
  player2.damageMult = (d && d.damageMult) ? d.damageMult : 1;
  player2.normalBuff = 1;
  if (ship === 'aegis') {
    aegisState2 = JSON.parse(JSON.stringify(aegisState));
    var sA = coopSwapEnter(); aegisReset(); coopSwapExit(sA);
  }
  if (ship === 'phantom') {
    phantomState2 = JSON.parse(JSON.stringify(phantomState));
    var sP = coopSwapEnter(); phantomReset(); coopSwapExit(sP);
  }
  target2.x = player2.x; target2.y = player2.y;
}

function coopHitP2() {
  var p = player2;
  if (!p || p.invuln > 0 || (state !== 'play' && state !== 'boss')) return;
  p.hp--;
  p.invuln = 1.0;
  shake = Math.max(shake, 7);
  try { part(p.x, p.y, '#8fe9ff', 10, 150); } catch (e) {}
  if (p.hp <= 0) {
    p.lives--;
    p.hp = p.maxHp;
    p.invuln = 2.0;
    p.x = W / 2 - 72; p.y = H - 150;
    target2.x = p.x; target2.y = p.y;
    try { boom(p.x, p.y, 0.8, 'normal'); } catch (e) {}
    if (p.lives <= 0) {
      p.lives = 3; p.hp = p.maxHp;
      p.x = W / 2 - 72; p.y = H - 150;
      target2.x = p.x; target2.y = p.y;
      pickupMsg = 'P2 RECOVERED';
      pickupT = 1.5;
    }
  }
}

function coopSpecial(kind) {
  if (!player2 || (state !== 'play' && state !== 'boss')) return;
  var s = coopSwapEnter();
  try {
    if (player2.ship === 'phantom') {
      if (kind !== 'secondary') phantomSkill();
    } else if (player2.ship === 'aegis') {
      if (kind === 'secondary') aegisTapForce(); else aegisTapCharge();
    } else if (kind !== 'secondary') {
      if (player2.bombs > 0) bomb();
    }
  } catch (e) {}
  coopSwapExit(s);
}

function coopKey(e, down) {
  var k = String(e.key || '').toLowerCase();
  if (['i','j','k','l','u','o'].indexOf(k) < 0) return;
  coopKeys[k] = !!down;
  if (down && !e.repeat) {
    if (k === 'u' || k === 'o') coopSpecial(k === 'o' ? 'secondary' : 'primary');
  }
  if (e.preventDefault) e.preventDefault();
}

function coopCollectItem(it) {
  if (!player2) return;
  var s = coopSwapEnter();
  try { collectItem(it); } catch (e) {}
  coopSwapExit(s);
}

function coopUpdate(dt) {
  if (!coopEnabled) { player2 = null; return; }
  if (!player2) coopSpawn();
  var p = player2;
  if (!p || (state !== 'play' && state !== 'boss')) return;
  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);

  var dx = 0, dy = 0;
  if (coopKeys.j) dx -= 1;
  if (coopKeys.l) dx += 1;
  if (coopKeys.i) dy -= 1;
  if (coopKeys.k) dy += 1;
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (pads[1]) {
    var pad = pads[1], ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    var padB = !!(pad.buttons[1] && pad.buttons[1].pressed);
    var padF = !!(pad.buttons[5] && pad.buttons[5].pressed);
    if (padB && !coopPadPrevB) coopSpecial('primary');
    if (padF && !coopPadPrevF) coopSpecial('secondary');
    coopPadPrevB = padB; coopPadPrevF = padF;
    if (Math.abs(ax) > 0.22) dx += ax;
    if (Math.abs(ay) > 0.22) dy += ay;
    if (pad.buttons[14] && pad.buttons[14].pressed) dx -= 1;
    if (pad.buttons[15] && pad.buttons[15].pressed) dx += 1;
    if (pad.buttons[12] && pad.buttons[12].pressed) dy -= 1;
    if (pad.buttons[13] && pad.buttons[13].pressed) dy += 1;
  }
  if (dx || dy) {
    var len = Math.hypot(dx, dy) || 1;
    target2.x += (dx / len) * 390 * dt;
    target2.y += (dy / len) * 390 * dt;
  }
  target2.x = Math.max(26, Math.min(W - 26, target2.x));
  target2.y = Math.max(110, Math.min(H - 70, target2.y));
  var mx = target2.x - p.x, my = target2.y - p.y, md = Math.hypot(mx, my);
  if (md > 0.5) { var step = Math.min(md, 390 * dt); p.x += mx / md * step; p.y += my / md * step; }
  p.x = Math.max(16, Math.min(W - 16, p.x));
  p.y = Math.max(110, Math.min(H - 56, p.y));
  p.bank += ((mx * 0.004) - p.bank) * Math.min(1, dt * 8);
  p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 80) p.trail.pop();

  if (state === 'play' || state === 'boss') {
    var s = coopSwapEnter();
    try {
      if (p.ship === 'aegis') updateAegis(dt);
      if (p.ship === 'phantom') phantomUpdate(dt);
      var hold = p.ship === 'aegis' && aegisState2 && (aegisState2.charge === 'charging' || p.odT > 0 || aegisState2.normalLockT > 0);
      if (!hold) {
        if (p.weapon === 'spread') {
          if (time - coopLastSpecial > 0.16) { coopLastSpecial = time; fireSpread(); }
        } else if (p.weapon === 'missile') {
          if (time - coopLastMissile > 0.46) { coopLastMissile = time; launchMissiles(); }
        } else if (time - coopLastShot > 0.10) {
          coopLastShot = time; fireNormal();
        }
      }
    } catch (e) {}
    coopSwapExit(s);
  }
}

function coopDrawP2() {
  if (!coopEnabled || !player2) return;
  var p = player2;
  var s = coopSwapEnter();
  try { drawPlayerEntity(); } catch (e) {}
  coopSwapExit(s);
  ctx.save(); ctx.fillStyle = '#8fe9ff'; ctx.font = '700 7px monospace'; ctx.textAlign = 'center';
  ctx.fillText('P2', p.x, p.y - 48); ctx.restore();
}

function coopDrawHUD() {
  if (!coopEnabled || !player2) return;
  var p = player2;
  ctx.save();
  ctx.fillStyle = 'rgba(4,12,22,0.72)'; ctx.fillRect(W - 152, 70, 136, 34);
  ctx.strokeStyle = 'rgba(143,233,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(W - 152, 70, 136, 34);
  ctx.fillStyle = '#8fe9ff'; ctx.font = '700 7px monospace'; ctx.textAlign = 'left';
  ctx.fillText('P2 · ' + String(p.ship || 'vector').toUpperCase(), W - 144, 84);
  ctx.fillStyle = '#dff8ff'; ctx.fillText('HP ' + '●'.repeat(Math.max(0, p.hp)) + '○'.repeat(Math.max(0, p.maxHp - p.hp)), W - 144, 96);
  ctx.textAlign = 'right'; ctx.fillStyle = '#7893a8'; ctx.fillText('LIFE ' + p.lives + ' · B' + p.bombs, W - 22, 96);
  ctx.restore();
}

try {
  window.addEventListener('keydown', function (e) { coopKey(e, true); });
  window.addEventListener('keyup', function (e) { coopKey(e, false); });
  if (typeof location !== 'undefined' && /(?:[?&])coop=1(?:&|$)/.test(location.search || '')) { coopEnabled = true; coopInputMode = 'kb'; }
} catch (e) {}
