// PHANTOM prototype: cloak, decoy clones, full-weapon cloning.
var phantomState = {
  cloakT: 0,
  wCount: 0,
  capBase: 1,
  cap: 1,
  clones: [],
  beams: [],
  flashT: 0
};

function phantomSkinId() { return (selectedSkins && selectedSkins.phantom) || 'quantum'; }
function phantomIsRaven() { return phantomSkinId() === 'raven'; }
function phantomIsButterfly() { return phantomSkinId() === 'butterfly'; }
function phantomBaseCap() { return phantomIsButterfly() ? 2 : 1; }
function phantomMaxCharges() { return 6; }
function phantomSkillButton() { return { x: W - 64, y: H - 78, r: 38 }; }

function phantomReset() {
  phantomState.cloakT = 0;
  phantomState.wCount = 0;
  phantomState.capBase = phantomBaseCap();
  phantomState.cap = phantomState.capBase;
  phantomState.clones.length = 0;
  phantomState.beams.length = 0;
  phantomState.flashT = 0;
}

function phantomOnDeath() { phantomReset(); }

function phantomDamageMult() {
  if (player.ship !== 'phantom' || phantomState.cloakT <= 0) return 1;
  if (phantomIsRaven()) return 1.6;
  if (phantomIsButterfly()) return 1;
  return 1.3;
}

function phantomSpawnClone(offset) {
  var skin = currentSkinDef();
  var hp = phantomIsRaven() ? 1 : 3;
  var c = {
    x: Math.max(26, Math.min(W - 26, player.x + (offset || 0))),
    y: player.y - 12,
    hp: hp, maxHp: hp,
    weapon: player.weapon,
    power: player.specialPower,
    extra: player.extraBullets || 0,
    damageMult: player.damageMult || 1,
    fireT: 0.12 + Math.random() * 0.06,
    target: null,
    retargetT: 0,
    slot: phantomState.clones.length,
    age: 0,
    life: 25,
    skin: skin ? skin.id : 'quantum'
  };
  phantomState.clones.push(c);
  while (phantomState.clones.length > phantomState.cap) phantomState.clones.shift();
  return c;
}

function phantomSkill() {
  if ((state !== 'play' && state !== 'boss') || player.ship !== 'phantom') return false;
  if (player.bombs <= 0) return false;
  player.bombs--;
  phantomState.cloakT = 3.0;
  phantomState.flashT = 0.55;
  player.invuln = Math.max(player.invuln, 3.2);
  var n = phantomIsButterfly() ? 2 : 1;
  var side = phantomState.clones.length ? -1 : 1;
  for (var i = 0; i < n; i++) {
    var off = n === 1 ? 58 * side : (i === 0 ? -34 : 34);
    phantomSpawnClone(off);
  }
  try { sfx('b_charge', 0.42); } catch (e) {}
  try { sfx('aegis_force', 0.55); } catch (e) {}
  try { if (typeof part === 'function') for (var k = 0; k < 20; k++) part(player.x, player.y, k % 2 ? '#c98bff' : '#8fe9ff', 1, 180); } catch (e) {}
  return true;
}

function phantomCollectW() {
  if (phantomState.wCount < 3) {
    phantomState.wCount++;
    if (phantomState.wCount >= 3) {
      phantomState.cap = phantomState.capBase * 2;
      pickupMsg = 'CLONE LIMIT +1 · CAP ' + phantomState.cap;
    } else {
      pickupMsg = 'CLONE CHARGE ' + phantomState.wCount + '/3';
    }
    score += 40;
  } else {
    pickupMsg = gainOD(15) ? 'OVERDRIVE!' : 'CLONE MAX +15 OD';
    score += 40;
  }
}

function phantomCollectB() {
  if (player.bombs < phantomMaxCharges()) {
    player.bombs++;
    pickupMsg = 'PHASE CHARGE +1';
  } else {
    pickupMsg = gainOD(15) ? 'OVERDRIVE!' : 'PHASE MAX +15 OD';
  }
  score += 30;
}

function phantomAimAngle(c) {
  if (c.target) return Math.atan2(c.target.y - c.y, c.target.x - c.x);
  return -Math.PI / 2;
}

function phantomFireLaser(c, aimAngle) {
  var w = 8 + Math.min(c.power, 3) * 5;
  var dmg = (2 + c.power * 2) * powerDamageFactor();
  var sx = c.x, sy = c.y - 16;
  var ex = sx + Math.cos(aimAngle) * 900, ey = sy + Math.sin(aimAngle) * 900;
  var vx = ex - sx, vy = ey - sy, L = vx * vx + vy * vy || 1;
  var hit = false;
  function nearBeam(px, py, pad) {
    var t = Math.max(0, Math.min(1, ((px - sx) * vx + (py - sy) * vy) / L));
    var dx = px - (sx + vx * t), dy = py - (sy + vy * t);
    return Math.hypot(dx, dy) < w / 2 + pad;
  }
  if (typeof enemies !== 'undefined') {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (!nearBeam(e.x, e.y, enemyW(e) * 0.30)) continue;
      e.hp -= dmg; e.flash = 0.12; hit = true;
      if (e.hp <= 0) { score += ET[e.type].score; enemyDeath(e); maybeDrop(e); removeEnemy(i); }
    }
  }
  if (boss && state === 'boss' && nearBeam(boss.x, boss.y, boss.def.w * 0.20)) {
    boss.hp -= dmg; boss.hitFlash = 0.18; boss.hitX = c.x; boss.hitY = boss.y; hit = true;
  }
  phantomState.beams.push({ x1: sx, y1: sy, x2: ex, y2: ey, w: w, t: 0, life: 0.12 });
  if (hit) { try { sfx('p_laser', 0.08); } catch (e) {} }
}

function phantomCloneFire(c) {
  var save = {
    x: player.x, y: player.y, weapon: player.weapon, specialPower: player.specialPower,
    extraBullets: player.extraBullets, damageMult: player.damageMult,
    normalBuff: player.normalBuff, odT: player.odT, invuln: player.invuln
  };
  player.x = c.x; player.y = c.y;
  player.weapon = c.weapon; player.specialPower = c.power;
  player.extraBullets = c.extra; player.damageMult = (c.damageMult || 1) * 0.5;
  player.normalBuff = 1; player.odT = 0;
  var aim = phantomAimAngle(c);
  var shotStart = shots.length, missileStart = missiles.length;
  if (c.weapon === 'spread') fireSpread();
  else if (c.weapon === 'missile') launchMissiles();
  else if (c.weapon === 'laser') phantomFireLaser(c, aim);
  else fireNormal();
  // Rotate only the projectiles created by this clone so the copied pattern
  // points at the selected target instead of always firing straight up.
  var rot = aim + Math.PI / 2;
  if (Math.abs(rot) > 0.0001) {
    var co = Math.cos(rot), si = Math.sin(rot);
    for (var si2 = shotStart; si2 < shots.length; si2++) {
      var sh = shots[si2], vx0 = sh.vx || 0, vy0 = sh.vy || 0;
      sh.vx = vx0 * co - vy0 * si; sh.vy = vx0 * si + vy0 * co;
    }
    for (var mi2 = missileStart; mi2 < missiles.length; mi2++) {
      var mi = missiles[mi2], mx0 = mi.vx || 0, my0 = mi.vy || 0;
      mi.vx = mx0 * co - my0 * si; mi.vy = mx0 * si + my0 * co;
    }
  }
  player.x = save.x; player.y = save.y; player.weapon = save.weapon;
  player.specialPower = save.specialPower; player.extraBullets = save.extraBullets;
  player.damageMult = save.damageMult; player.normalBuff = save.normalBuff;
  player.odT = save.odT; player.invuln = save.invuln;
}

function phantomFindTarget(c) {
  var best = null, bestD = 1e9;
  if (typeof enemies !== 'undefined') {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.hp <= 0 || e.entering) continue;
      var d = Math.hypot(e.x - c.x, e.y - c.y);
      if (d < bestD) { bestD = d; best = e; }
    }
  }
  if (boss && state === 'boss' && boss.hp > 0) {
    var bd = Math.hypot(boss.x - c.x, boss.y - c.y);
    if (bd < bestD || !best) { bestD = bd; best = boss; }
  }
  return best;
}

function phantomMoveClone(c, dt) {
  if (c.retargetT > 0) c.retargetT -= dt;
  var valid = c.target && c.target.hp > 0 && (c.target === boss || (typeof enemies !== 'undefined' && enemies.indexOf(c.target) >= 0));
  if (!valid) { c.target = phantomFindTarget(c); c.retargetT = 0.45; }
  var offset = (c.slot - (phantomState.cap - 1) / 2) * 32;
  var tx = player.x + offset;
  var ty = player.y - 26;
  tx = Math.max(34, Math.min(W - 34, tx));
  ty = Math.max(92, Math.min(H - 96, ty));
  var dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
  if (d > 12) {
    var step = Math.min(d, 105 * dt);
    c.x += dx / d * step;
    c.y += dy / d * step;
  }
}
function phantomUpdate(dt) {
  if (player.ship !== 'phantom') return;
  if (state !== 'play' && state !== 'boss') return;
  if (phantomState.cloakT > 0) phantomState.cloakT = Math.max(0, phantomState.cloakT - dt);
  if (phantomState.flashT > 0) phantomState.flashT = Math.max(0, phantomState.flashT - dt);
  for (var i = phantomState.clones.length - 1; i >= 0; i--) {
    var c = phantomState.clones[i];
    c.age += dt;
    if (c.hp <= 0 || c.age > c.life) {
      try { if (typeof part === 'function') for (var p = 0; p < 8; p++) part(c.x, c.y, '#c98bff', 1, 130); } catch (e) {}
      phantomState.clones.splice(i, 1);
      continue;
    }
    phantomMoveClone(c, dt);
    c.fireT -= dt;
    if (c.fireT <= 0) {
      c.fireT = c.weapon === 'spread' ? 0.16 : (c.weapon === 'laser' ? 0.08 : (c.weapon === 'missile' ? 0.46 : 0.10));
      phantomCloneFire(c);
    }
  }
  for (var b = phantomState.beams.length - 1; b >= 0; b--) {
    phantomState.beams[b].t += dt;
    if (phantomState.beams[b].t >= phantomState.beams[b].life) phantomState.beams.splice(b, 1);
  }
}

function phantomHitClone(x, y, r) {
  for (var i = phantomState.clones.length - 1; i >= 0; i--) {
    var c = phantomState.clones[i];
    if (Math.hypot(x - c.x, y - c.y) < player.r + (r || 4)) {
      c.hp--;
      try { if (typeof part === 'function') for (var p = 0; p < 6; p++) part(c.x, c.y, '#c98bff', 1, 120); } catch (e) {}
      return true;
    }
  }
  return false;
}

function phantomAimTarget() {
  if (player.ship !== 'phantom') return { x: player.x, y: player.y };
  if (phantomState.clones.length) return { x: phantomState.clones[0].x, y: phantomState.clones[0].y };
  if (phantomState.cloakT > 0) return { x: player.x, y: -240 };
  return { x: player.x, y: player.y };
}

function phantomButtonAt(p) {
  var b = phantomSkillButton();
  return Math.hypot(p.x - b.x, p.y - b.y) <= b.r;
}

function drawPhantomClones() {
  if (player.ship !== 'phantom') return;
  for (var i = 0; i < phantomState.clones.length; i++) {
    var c = phantomState.clones[i];
    var img = GIMG[currentSkinImage()];
    ctx.save();
    ctx.globalAlpha = 0.52;
    if (img && img.complete) ctx.drawImage(img, c.x - 34, c.y - 34, 68, 68);
    else {
      ctx.strokeStyle = '#c98bff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c.x, c.y - 24); ctx.lineTo(c.x + 20, c.y); ctx.lineTo(c.x, c.y + 24); ctx.lineTo(c.x - 20, c.y); ctx.closePath(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(6,12,24,0.8)'; ctx.fillRect(c.x - 22, c.y + 27, 44, 4);
    ctx.fillStyle = '#c98bff'; ctx.fillRect(c.x - 22, c.y + 27, 44 * (c.hp / c.maxHp), 4);
    ctx.restore();
  }
  for (var b = 0; b < phantomState.beams.length; b++) {
    var bm = phantomState.beams[b], a = 1 - bm.t / bm.life;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75 * a;
    ctx.strokeStyle = '#8fe9ff'; ctx.lineWidth = bm.w; ctx.beginPath();
    ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    ctx.globalAlpha = 0.7 * a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawPhantomControls() {
  if (player.ship !== 'phantom' || (state !== 'play' && state !== 'boss')) return;
  var b = phantomSkillButton();
  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = 'rgba(12,8,26,0.9)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = phantomState.cloakT > 0 ? '#e7a8ff' : '#c98bff'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#f4e9ff'; ctx.font = '700 9px monospace'; ctx.textAlign = 'center';
  ctx.fillText(phantomState.cloakT > 0 ? 'CLOAK' : 'PHASE', b.x, b.y - 3);
  ctx.fillStyle = '#c9a0ff'; ctx.font = '700 9px monospace';
  ctx.fillText('x' + player.bombs, b.x, b.y + 18);
  ctx.textAlign = 'left'; ctx.restore(); ctx.globalAlpha = 1;
}

try { window.__phantomSelect=function(id){ setSelectedShip('phantom', false); setSelectedSkin('phantom', id||'quantum', false); phantomReset(); }; window.__phantom=function(){return {ship:player.ship,bombs:player.bombs,cloakT:phantomState.cloakT,clones:phantomState.clones.map(function(c){return {x:c.x,y:c.y,hp:c.hp,weapon:c.weapon,power:c.power};}),cap:phantomState.cap,wCount:phantomState.wCount,cloakDamage:phantomDamageMult()};}; } catch(e) {}
