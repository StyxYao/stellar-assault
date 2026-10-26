// R3.0 local co-op vertical slice. P1 is the existing player; P2 is a VECTOR
// slot controlled by IJKL or the second gamepad. This module intentionally
// keeps P2 self-contained so single-player paths are untouched.
var coopEnabled = false;
var coopInputMode = 'off'; // off | kb | mouse
var coopShip2 = 'vector', coopSkin2 = 'void_lance';
var coopRemote = false;
var coopRemoteP1 = false;
var lanRemoteInput = { dx: 0, dy: 0, primary: false, secondary: false };
var lanRemoteInput1 = { dx: 0, dy: 0, primary: false, secondary: false };
var player2 = null;
var aegisState2 = null;
var phantomState2 = null;
var target2 = { x: W / 2 - 70, y: H - 150 };
var coopKeys = Object.create(null);
var coopLastShot = 0, coopLastSpecial = 0, coopLastMissile = 0, coopLaserT = 0, coopLaserFx = null;
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
  var s = { player: player, target: target, aegis: aegisState, phantom: phantomState, ship: selectedShip, skin: selectedSkins[player2.ship] };
  player = player2; target = target2;
  selectedShip = player2.ship; selectedSkins[player2.ship] = player2.skin;
  if (player2.ship === 'aegis') aegisState = aegisState2;
  if (player2.ship === 'phantom') phantomState = phantomState2;
  return s;
}
function coopSwapExit(s) {
  player = s.player; target = s.target; aegisState = s.aegis; phantomState = s.phantom;
  selectedShip = s.ship; selectedSkins[player2 ? player2.ship : selectedShip] = s.skin;
}
function coopSkinDef(ship, id) {
  if (typeof skinList !== 'function') return null;
  var list = skinList(ship), fallback = list[0];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return fallback;
}

function coopPickSkin2(ship, preferred) {
  var list = (typeof skinList === 'function' ? skinList(ship) : []);
  if (!list.length) return 'void_lance';
  for (var i = 0; i < list.length; i++) {
    var id = list[i].id;
    if (id === preferred && !(selectedShip === ship && selectedSkins[selectedShip] === id)) return id;
    if (!(selectedShip === ship && selectedSkins[selectedShip] === id)) return id;
  }
  return list[0].id;
}

function coopShipLabel2() { return (typeof SHIP_DEFS !== 'undefined' && SHIP_DEFS[coopShip2]) ? SHIP_DEFS[coopShip2].label : String(coopShip2).toUpperCase(); }
function coopSkinLabel2() { var d = coopSkinDef(coopShip2, coopSkin2); return d ? d.label : String(coopSkin2).toUpperCase(); }

function coopCycleShip2() {
  var ships = ['vector', 'aegis', 'phantom'];
  var i = ships.indexOf(coopShip2);
  coopShip2 = ships[(i + 1) % ships.length];
  coopSkin2 = coopPickSkin2(coopShip2, coopSkin2);
  if (selectedShip === coopShip2 && selectedSkins[selectedShip] === coopSkin2) coopSkin2 = coopPickSkin2(coopShip2, '');
}

function coopCycleSkin2() {
  var list = (typeof skinList === 'function' ? skinList(coopShip2) : []);
  if (!list.length) return;
  var i = 0;
  for (var k = 0; k < list.length; k++) if (list[k].id === coopSkin2) i = k;
  for (var n = 0; n < list.length; n++) {
    i = (i + 1) % list.length;
    var id = list[i].id;
    if (!(selectedShip === coopShip2 && selectedSkins[selectedShip] === id)) { coopSkin2 = id; break; }
  }
}

function coopEnsureDistinct() {
  if (!coopEnabled) return;
  if (selectedShip === coopShip2 && selectedSkins[selectedShip] === coopSkin2) {
    coopSkin2 = coopPickSkin2(coopShip2, '');
  }
}

function coopSpawn() {
  coopEnsureDistinct();
  if (!coopEnabled) { player2 = null; return; }
  var ship = coopShip2;
  var skin = coopSkin2;
  player2 = {
    x: W / 2 - 72, y: H - 150, r: 6,
    lives: 3, hp: 3, maxHp: 3,
    bombs: 3, od: 0, odT: 0, powerXp: 0,
    respawnT: 0, respawnGift: false, invuln: 2.0, bank: 0, noBlink: false,
    power: 1, weapon: 'normal', specialPower: 1, options: 0, wingPower: 1,
    ship: ship, skin: skin, trail: [], wingEntry: []
  };
  var d = coopSkinDef(ship, skin);
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

function coopLaserDamage(dt) {
  var p = player2;
  if (!p) return;
  coopLaserT -= dt; if (coopLaserT > 0) return; coopLaserT = 0.08;
  var w = 8 + Math.min(p.specialPower, 3) * 5;
  var dmg = (2 + p.specialPower * 2) * powerDamageFactor();
  var target = null, tIdx = -1, tY = 0;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (Math.abs(e.x - p.x) < w / 2 + enemyW(e) * 0.32 && e.y < p.y && e.y > tY) { target = e; tIdx = i; tY = e.y; }
  }
  var isBoss = false;
  if (boss && state === 'boss' && boss.invuln <= 0 && Math.abs(boss.x - p.x) < w / 2 + boss.def.w * 0.24 * 1.15 && boss.y < p.y && boss.y > tY) {
    target = boss; isBoss = true; tY = boss.y;
  }
  coopLaserFx = { x: p.x, endY: target ? tY : 0, level: p.specialPower, t: 0.12 };
  if (!target) return;
  if (isBoss) {
    boss.hp -= dmg * 0.7; boss.hitFlash = 0.12; boss.hitX = p.x; boss.hitY = boss.y + 20;
  } else {
    var et = ET[target.type];
    target.hp -= dmg; target.flash = 0.1;
    if (target.hp <= 0) { score += et.score; part(target.x, target.y, '#ffb066', 9, 160); enemyDeath(target); maybeDrop(target); removeEnemy(tIdx); }
  }
}

function coopCollectItem(it) {
  if (!player2) return;
  var s = coopSwapEnter();
  try { collectItem(it); } catch (e) {}
  coopSwapExit(s);
}

function coopRemoteP1Update(dt) {
  if (!coopRemoteP1 || (state !== 'play' && state !== 'boss')) return;
  var inp = lanRemoteInput1;
  if (inp.tx != null && inp.ty != null) {
    target.x = Math.max(22, Math.min(W - 22, inp.tx));
    target.y = Math.max(70, Math.min(H - 70, inp.ty));
  } else {
    target.x = Math.max(22, Math.min(W - 22, target.x + (inp.dx || 0) * 390 * dt));
    target.y = Math.max(70, Math.min(H - 70, target.y + (inp.dy || 0) * 390 * dt));
  }
  if (inp.primary) {
    inp.primary = false;
    if (player.ship === 'phantom') phantomSkill();
    else if (player.ship === 'aegis') aegisTapCharge();
    else if (player.bombs > 0) bomb();
  }
  if (inp.secondary) {
    inp.secondary = false;
    if (player.ship === 'aegis') aegisTapForce();
  }
}

function coopUpdate(dt) {
  if (!coopEnabled) { player2 = null; return; }
  if (!player2) coopSpawn();
  var p = player2;
  if (!p || (state !== 'play' && state !== 'boss')) return;
  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
  if (p.odT > 0) p.odT = Math.max(0, p.odT - dt);
  if (coopLaserFx) { coopLaserFx.t -= dt; if (coopLaserFx.t <= 0) coopLaserFx = null; }

  var dx = 0, dy = 0;
  if (coopRemote) {
    dx = lanRemoteInput.dx || 0; dy = lanRemoteInput.dy || 0;
    if (lanRemoteInput.primary) { coopSpecial('primary'); lanRemoteInput.primary = false; }
    if (lanRemoteInput.secondary) { coopSpecial('secondary'); lanRemoteInput.secondary = false; }
  } else {
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
  }
  if (coopRemote && lanRemoteInput.tx != null && lanRemoteInput.ty != null) {
    target2.x = Math.max(26, Math.min(W - 26, lanRemoteInput.tx));
    target2.y = Math.max(110, Math.min(H - 70, lanRemoteInput.ty));
  } else if (dx || dy) {
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
      if (p.options > 0) { updateWingEntries(dt); updateOptions(dt); }
      var hold = p.ship === 'aegis' && aegisState2 && (aegisState2.charge === 'charging' || p.odT > 0 || aegisState2.normalLockT > 0);
      if (!hold) {
        if (p.weapon === 'spread') {
          if (time - coopLastSpecial > 0.16) { coopLastSpecial = time; fireSpread(); }
        } else if (p.weapon === 'missile') {
          if (time - coopLastMissile > 0.46) { coopLastMissile = time; launchMissiles(); }
        } else if (p.weapon === 'laser') {
          coopLaserDamage(dt);
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
  try { drawPlayerEntity(); if (p.options > 0) drawOptions(); } catch (e) {}
  coopSwapExit(s);
  if (coopLaserFx) {
    var lf = coopLaserFx, cols = ['80,190,255','120,240,255','255,120,220','255,215,100'], cc = cols[Math.max(0,Math.min(3,(lf.level||1)-1))];
    var by = lf.endY > 0 ? lf.endY : 0, h = Math.max(0, p.y - 16 - by);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var lg = ctx.createLinearGradient(p.x - 18, 0, p.x + 18, 0);
    lg.addColorStop(0, 'rgba(' + cc + ',0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.8)'); lg.addColorStop(1, 'rgba(' + cc + ',0)');
    ctx.fillStyle = lg; ctx.fillRect(p.x - 18, by, 36, h);
    ctx.restore();
  }
  ctx.save(); ctx.fillStyle = '#8fe9ff'; ctx.font = '700 7px monospace'; ctx.textAlign = 'center';
  ctx.fillText('P2', p.x, p.y - 48); ctx.restore();
}

function coopDrawHUD() {
  if (!coopEnabled || !player2) return;
  var p = player2;
  ctx.save();
  ctx.fillStyle = 'rgba(4,12,22,0.72)'; ctx.fillRect(W - 160, 70, 144, 50);
  ctx.strokeStyle = 'rgba(143,233,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(W - 160, 70, 144, 50);
  ctx.fillStyle = '#8fe9ff'; ctx.font = '700 7px monospace'; ctx.textAlign = 'left';
  var pd = coopSkinDef(p.ship, p.skin); ctx.fillText('P2 · ' + String(p.ship || 'vector').toUpperCase() + (pd ? ' · ' + pd.label : ''), W - 152, 82);
  ctx.fillStyle = '#dff8ff'; ctx.fillText('HP ' + '●'.repeat(Math.max(0, p.hp)) + '○'.repeat(Math.max(0, p.maxHp - p.hp)), W - 152, 94);
  ctx.textAlign = 'right'; ctx.fillStyle = '#7893a8'; ctx.fillText('LIFE ' + p.lives + ' · B' + p.bombs, W - 22, 94);
  ctx.textAlign = 'left'; ctx.fillStyle = '#a8d8e8';
  var st = '';
  if (p.ship === 'aegis' && aegisState2) st = 'FORCE ' + String(aegisState2.force).toUpperCase() + ' · SHD ' + Math.round(aegisState2.shield / aegisShieldMax() * 100) + '%';
  else if (p.ship === 'phantom' && phantomState2) st = 'CLOAK ' + phantomState2.cloakT.toFixed(1) + ' · CLONES ' + phantomState2.clones.length + '/' + phantomState2.cap;
  else st = 'WING ' + p.options + ' · P' + p.wingPower;
  ctx.fillText(st, W - 152, 110);
  ctx.restore();
}

try {
  window.addEventListener('keydown', function (e) { coopKey(e, true); });
  window.addEventListener('keyup', function (e) { coopKey(e, false); });
  if (typeof location !== 'undefined' && /(?:[?&])coop=1(?:&|$)/.test(location.search || '')) { coopEnabled = true; coopInputMode = 'kb'; }
} catch (e) {}
