// R3 local co-op. P1 keeps the legacy global slot; P2 is a first-class slot
// with independent ship/skin/state. Ship-system calls use a scoped context so
// P1/P2 state cannot leak between updates.
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
  if (!coopEnabled) return 'LOCAL SOLO';
  var a=(typeof controlModeLabel==='function')?controlModeLabel(controlModeP1):String(controlModeP1||'auto').toUpperCase();
  var b=(typeof controlModeLabel==='function')?controlModeLabel(controlModeP2):String(controlModeP2||'keyboard').toUpperCase();
  return 'P1 ' + a + ' · P2 ' + b;
}

function coopSetMode(mode) {
  if (mode === 'solo' || mode === 'off') {
    coopEnabled = false; coopInputMode = 'off'; player2 = null;
    pickupMsg = 'LOCAL SOLO'; pickupT = 1.2;
    return;
  }
  coopEnabled = true;
  coopInputMode = 'custom';
  if (typeof controlModeP2 === 'undefined' || (typeof controlModeP2 !== 'undefined' && !controlModeP2)) controlModeP2 = 'keyboard';
  coopEnsureDistinct();
  pickupMsg = 'LOCAL CO-OP · P1 ' + String(typeof controlModeP1!=='undefined'?controlModeP1:'auto').toUpperCase() + ' / P2 ' + String(typeof controlModeP2!=='undefined'?controlModeP2:'keyboard').toUpperCase();
  pickupT = 1.4;
}

function coopToggle() {
  if (!coopEnabled) coopSetMode('coop');
  else coopSetMode('solo');
  pickupT = 1.6;
}

var World = { players: [], stage: 0, time: 0 };
function worldBindPlayers() {
  player.slot = 1; player.owner = 'P1';
  World.players = [player];
  if (player2) { player2.slot = 2; player2.owner = 'P2'; World.players.push(player2); }
  World.stage = stage;
  World.time = time;
}

World.snapshot = function () {
  return {
    stage: World.stage, time: World.time, state: state, rng: getRngSeed(),
    stageT: stageT, waveIndex: waveIndex, score: score,
    players: World.players.map(function (p) {
      return {
        slot: p.slot, owner: p.owner, ship: p.ship, skin: p.skin,
        x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, lives: p.lives, bombs: p.bombs,
        invuln: p.invuln, od: p.od, odT: p.odT, power: p.power, options: p.options,
        weapon: p.weapon, specialPower: p.specialPower
      };
    }),
    enemies: enemies.map(function (e) {
      return { type: e.type, x: e.x, y: e.y, hp: e.hp, max: e.max, t: e.t, mode: e.mode, fireT: e.fireT, mini: !!e.mini };
    }),
    shots: shots.map(function (s) { return { x: s.x, y: s.y, vx: s.vx || 0, vy: s.vy, dmg: s.dmg }; }),
    ebullets: ebullets.map(function (b) { return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, rad: b.rad }; }),
    items: items.map(function (it) { return { x: it.x, y: it.y, type: it.type, vy: it.vy, t: it.t }; }),
    boss: boss ? { id: boss.id, x: boss.x, y: boss.y, hp: boss.hp, max: boss.max, phase: boss.phase, invuln: boss.invuln } : null
  };
};

function worldClone(v) { return (v == null) ? v : JSON.parse(JSON.stringify(v)); }

World.snapshotFull = function () {
  var out = {
    v: 1,
    stage: stage, state: state, time: time, stageT: stageT, waveIndex: waveIndex,
    score: score, rng: getRngSeed(), selectedShip: selectedShip,
    selectedSkins: worldClone(selectedSkins), coopEnabled: coopEnabled,
    coopInputMode: coopInputMode, coopShip2: coopShip2, coopSkin2: coopSkin2,
    player: worldClone(player), target: worldClone(target),
    player2: worldClone(player2), target2: worldClone(target2),
    aegis: worldClone(aegisState), aegis2: worldClone(aegisState2),
    phantom: worldClone(phantomState), phantom2: worldClone(phantomState2),
    enemies: worldClone(enemies), shots: worldClone(shots), ebullets: worldClone(ebullets),
    items: worldClone(items), missiles: worldClone(missiles), wingBeams: worldClone(wingBeams),
    beams: worldClone(beams), orbBullets: worldClone(orbBullets), blastZones: worldClone(blastZones),
    parts: worldClone(parts), fx: worldClone(fx), phaseFx: worldClone(phaseFx), odLaserFx: worldClone(odLaserFx),
    bombT: bombT, bombX: bombX, bombY: bombY, shake: shake,
    boss: worldClone(boss), nextTransport: nextTransport, mech: worldClone(typeof stageMech!=='undefined'?stageMech:null), bossMech: worldClone(typeof bossMech!=='undefined'?bossMech:null)
  };
  return out;
};

World.restore = function (s) {
  if (!s || s.v !== 1) return false;
  stage = s.stage; state = s.state; time = s.time; stageT = s.stageT;
  waveIndex = s.waveIndex; score = s.score; selectedShip = s.selectedShip;
  selectedSkins = worldClone(s.selectedSkins) || selectedSkins;
  coopEnabled = !!s.coopEnabled; coopInputMode = s.coopInputMode || 'off';
  coopShip2 = s.coopShip2 || 'vector'; coopSkin2 = s.coopSkin2 || 'void_lance';
  player = worldClone(s.player); target = worldClone(s.target);
  player2 = s.player2 ? worldClone(s.player2) : null;
  target2 = worldClone(s.target2) || { x: W / 2 - 70, y: H - 150 };
  aegisState = worldClone(s.aegis); aegisState2 = s.aegis2 ? worldClone(s.aegis2) : null;
  phantomState = worldClone(s.phantom); phantomState2 = s.phantom2 ? worldClone(s.phantom2) : null;
  enemies = worldClone(s.enemies) || [];
  shots = worldClone(s.shots) || [];
  ebullets = worldClone(s.ebullets) || [];
  items = worldClone(s.items) || [];
  missiles = worldClone(s.missiles) || [];
  wingBeams = worldClone(s.wingBeams) || [];
  beams = worldClone(s.beams) || [];
  orbBullets = worldClone(s.orbBullets) || [];
  blastZones = worldClone(s.blastZones) || [];
  parts = worldClone(s.parts) || [];
  fx = worldClone(s.fx) || [];
  phaseFx = worldClone(s.phaseFx) || [];
  odLaserFx = worldClone(s.odLaserFx) || [];
  bombT = s.bombT || 0; bombX = s.bombX || 0; bombY = s.bombY || 0; shake = s.shake || 0;
  boss = s.boss ? worldClone(s.boss) : null;
  nextTransport = s.nextTransport || 0;
  if(typeof stageMech!=='undefined'&&s.mech) stageMech=worldClone(s.mech);
  if(typeof bossMech!=='undefined'&&s.bossMech) bossMech=worldClone(s.bossMech);
  setRngSeed(s.rng || 1);
  worldBindPlayers();
  return true;
};

World.digest = function () {
  return JSON.stringify(World.snapshot());
};

function coopUseSlot(p, fn) {
  if (!p || p === player) return fn();
  var saved = {
    player: player, target: target, aegis: aegisState, phantom: phantomState,
    ship: selectedShip, skin: selectedSkins[p.ship]
  };
  player = p; target = target2;
  selectedShip = p.ship; selectedSkins[p.ship] = p.skin;
  if (p.ship === 'aegis') aegisState = aegisState2;
  if (p.ship === 'phantom') phantomState = phantomState2;
  try { return fn(); }
  finally {
    player = saved.player; target = saved.target;
    aegisState = saved.aegis; phantomState = saved.phantom;
    selectedShip = saved.ship;
    selectedSkins[p.ship] = saved.skin;
  }
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

function coopEnsureP2State() {
  if (!player2) return;
  if (player2.ship === 'aegis' && !aegisState2) {
    aegisState2 = JSON.parse(JSON.stringify(aegisState));
    coopUseSlot(player2, function () { aegisReset(); });
  }
  if (player2.ship === 'phantom' && !phantomState2) {
    phantomState2 = JSON.parse(JSON.stringify(phantomState));
    coopUseSlot(player2, function () { phantomReset(); });
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
    respawnT: 0, respawnGift: false, invuln: 2.0, hitFlashT: 0, bank: 0, noBlink: false,
    power: 1, weapon: 'normal', specialPower: 1, options: 0, wingPower: 1,
    ship: ship, skin: skin, slot: 2, owner: 'P2', trail: [], wingEntry: []
  };
  var d = coopSkinDef(ship, skin);
  player2.maxHp = (d && d.maxHp) ? d.maxHp : 3;
  player2.hp = player2.maxHp;
  player2.extraBullets = (d && d.extraBullets) ? d.extraBullets : 0;
  player2.damageMult = (d && d.damageMult) ? d.damageMult : 1;
  player2.normalBuff = 1;
  if (ship === 'aegis') {
    aegisState2 = JSON.parse(JSON.stringify(aegisState));
    coopUseSlot(player2, function () { aegisReset(); });
  }
  if (ship === 'phantom') {
    phantomState2 = JSON.parse(JSON.stringify(phantomState));
    coopUseSlot(player2, function () { phantomReset(); });
  }
  target2.x = player2.x; target2.y = player2.y;
  worldBindPlayers();
}

function coopPrepareP2ForStage() {
  if (!player2) return;
  var p = player2;
  p.x = W / 2 - 72; p.y = H - 150;
  p.respawnT = 0; p.invuln = Math.max(p.invuln || 0, 2.0);
  p.bank = 0; p.noBlink = false;
  target2.x = p.x; target2.y = p.y;
  worldBindPlayers();
}

function coopHitP2() {
  var p = player2;
  if (!p || p.invuln > 0 || p.odT > 0 || (state !== 'play' && state !== 'boss')) return false;
  if (p.ship === 'aegis') {
    var absorbed = false;
    coopUseSlot(p, function () { absorbed = (typeof aegisAbsorbHit === 'function') && aegisAbsorbHit(); });
    if (absorbed) return true;
  }
  p.noBlink = false;
  p.hitFlashT = 0.22;
  p.hp--;
  p.invuln = 1.0;
  shake = Math.max(shake, 7);
  try { part(p.x, p.y, '#8fe9ff', 10, 150); } catch (e) {}
  if (p.hp <= 0) {
    p.lives--;
    if (p.lives <= 0) {
      // Shared run failure: P2's last life ends the run. No implicit lives=3.
      p.hp = 0; p.lives = 0; p.respawnT = 0;
      state = 'over';
      if (typeof recordRunEnd === 'function') recordRunEnd(false);
      try { playBgm('m5'); } catch (e) {}
      return true;
    }
    p.hp = p.maxHp;
    p.invuln = 2.0;
    p.x = W / 2 - 72; p.y = H - 150;
    target2.x = p.x; target2.y = p.y;
    try { boom(p.x, p.y, 0.8, 'normal'); } catch (e) {}
  }
  return true;
}
function coopButtonAt(p) {
  if (!player2) return null;
  if (player2.ship === 'aegis') {
    if (Math.hypot(p.x - (W - 138), p.y - (H - 78)) <= 32) return 'primary';
    if (Math.hypot(p.x - (W - 64), p.y - (H - 78)) <= 38) return 'secondary';
    return null;
  }
  if (Math.hypot(p.x - (W - 64), p.y - (H - 78)) <= 54) return 'primary';
  return null;
}

function coopSpecial(kind) {
  if (!player2 || (state !== 'play' && state !== 'boss')) return;
  coopEnsureP2State();
  coopUseSlot(player2, function () {
    if (player2.ship === 'phantom') {
      if (kind !== 'secondary') phantomSkill();
    } else if (player2.ship === 'aegis') {
      if (kind === 'secondary') aegisTapForce(); else aegisTapCharge();
    } else if (kind !== 'secondary') {
      if (player2.bombs > 0) bomb();
    }
  });
}

function coopKey(e, down) {
  var k = String(e.key || '').toLowerCase();
  if (['i','j','k','l','u','o'].indexOf(k) < 0) return;
  var allowed = (typeof controlModeAllows !== 'function' || controlModeAllows(2, 'keyboard'));
  coopKeys[k] = allowed ? !!down : false;
  if (allowed && down && !e.repeat) {
    if (k === 'u' || k === 'o') coopSpecial(k === 'o' ? 'secondary' : 'primary');
    if (e.preventDefault) e.preventDefault();
  }
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
  coopUseSlot(player2, function () { collectItem(it); });
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
  coopEnsureP2State();
  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
  if (p.odT > 0) p.odT = Math.max(0, p.odT - dt);
  if (coopLaserFx) { coopLaserFx.t -= dt; if (coopLaserFx.t <= 0) coopLaserFx = null; }

  var dx = 0, dy = 0;
  if (coopRemote) {
    dx = lanRemoteInput.dx || 0; dy = lanRemoteInput.dy || 0;
    if (lanRemoteInput.primary) { coopSpecial('primary'); lanRemoteInput.primary = false; }
    if (lanRemoteInput.secondary) { coopSpecial('secondary'); lanRemoteInput.secondary = false; }
  } else {
  var p2Kb = (typeof controlModeAllows !== 'function' || controlModeAllows(2, 'keyboard'));
  var p2Pad = (typeof controlModeAllows !== 'function' || controlModeAllows(2, 'gamepad'));
  if (p2Kb) {
  if (coopKeys.j) dx -= 1;
  if (coopKeys.l) dx += 1;
  if (coopKeys.i) dy -= 1;
  if (coopKeys.k) dy += 1;
  }
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (p2Pad && pads[1]) {
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
    coopUseSlot(p, function () {
      if (p.ship === 'aegis') updateAegis(dt);
      if (p.ship === 'phantom') phantomUpdate(dt);
      if (p.options > 0) { updateWingEntries(dt); updateOptions(dt); }
      var hold = p.ship === 'aegis' && aegisState && (aegisState.charge === 'charging' || p.odT > 0 || aegisState.normalLockT > 0);
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
    });
  }
  worldBindPlayers();
}

function coopDrawP2() {
  if (!coopEnabled || !player2) return;
  var p = player2;
  coopEnsureP2State();
  coopUseSlot(p, function () { drawPlayerEntity(); if (p.options > 0) drawOptions(); });
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
  if (typeof location !== 'undefined' && /(?:[?&])coop=1(?:&|$)/.test(location.search || '')) { coopEnabled = true; coopInputMode = 'custom'; }
} catch (e) {}
