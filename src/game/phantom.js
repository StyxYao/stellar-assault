// PHANTOM prototype: cloak, decoy clones, full-weapon cloning.
var phantomState = {
  cloakT: 0,
  wCount: 0,
  cloneHp: 3,
  capBase: 1,
  cap: 1,
  clones: [],
  beams: [],
  flashT: 0,
  dashT: 0,
  dashFromX: 0,
  dashFromY: 0,
  cloneFiring: false,
  odClones: [],
  odActive: false,
  odAnchorY: 0,
  bursts: []
};

function phantomSkinId() { return (selectedSkins && selectedSkins.phantom) || 'quantum'; }
function phantomIsRaven() { return phantomSkinId() === 'raven'; }
function phantomIsButterfly() { return phantomSkinId() === 'butterfly'; }
function phantomBaseCap() {
  if (phantomIsRaven()) return 1;
  if (phantomIsButterfly()) return 4;
  return 2;
}
function phantomMaxCharges() { return 6; }
function phantomSkillButton() { return { x: W - 64, y: H - 78, r: 38 }; }

function phantomReset() {
  phantomState.cloakT = 0;
  phantomState.wCount = 0;
  phantomState.cloneHp = 3;
  phantomState.capBase = phantomBaseCap();
  phantomState.cap = phantomState.capBase;
  phantomState.clones.length = 0;
  phantomState.beams.length = 0;
  phantomState.bursts.length = 0;
  phantomState.odClones.length = 0;
  phantomState.odActive = false;
  phantomState.odAnchorY = 0;
  phantomState.flashT = 0;
}

function phantomOnDeath() { phantomReset(); }

function phantomOdOwnsAttack() {
  return player.ship === 'phantom' && phantomState.odActive;
}
function playerOdPatternActive() {
  return player.odT > 0 && !phantomOdOwnsAttack();
}

function phantomDamageMult() {
  if (player.ship !== 'phantom' || phantomState.cloakT <= 0 || phantomState.cloneFiring) return 1;
  if (phantomIsRaven()) return 2.5;
  return 1.5;
}

function phantomBurst(x,y,kind){
  phantomState.bursts.push({x:x,y:y,t:0,life:kind==='vanish'?0.34:0.28,kind:kind||'spawn'});
}
function phantomSpawnClone(offset) {
  var skin = currentSkinDef();
  if (phantomState.clones.length >= phantomState.cap) return null;
  var skin = currentSkinDef();
  var hp = phantomState.cloneHp || 3;
  var c = {
    x: Math.max(26, Math.min(W - 26, player.x + (offset || 0))),
    y: player.y - 12,
    hp: hp, maxHp: hp, invulnT: 0,
    weapon: player.weapon,
    power: player.specialPower,
    extra: player.extraBullets || 0,
    damageMult: player.damageMult || 1,
    fireT: 0.12 + rng() * 0.06,
    target: null,
    retargetT: 0,
    slot: phantomState.clones.length,
    age: 0,
    spawnT: 0.24,
    life: 25,
    skin: skin ? skin.id : 'quantum'
  };
  phantomState.clones.push(c);
  phantomBurst(c.x,c.y,'spawn');
  while (phantomState.clones.length > phantomState.cap) {
    var old = phantomState.clones.shift();
    if (old) phantomBurst(old.x, old.y, 'vanish');
  }
  return c;
}

function phantomWhooshB() {
  if (typeof AC === 'undefined' || !AC || typeof master === 'undefined' || !master) return;
  try {
    if (typeof noiseBurst === 'function') noiseBurst(0.44, 0.30, 1100);
    if (typeof tone === 'function') {
      tone(70, 185, 0.40, 0.34, 'sine');
      tone(145, 430, 0.18, 0.10, 'triangle', 0.015);
    }
  } catch (e) {}
}

function phantomBulletDistance(px, py) {
  var best = 1e9;
  if (typeof ebullets !== 'undefined') {
    for (var i = 0; i < ebullets.length; i++) {
      var b = ebullets[i];
      if (b.y < 0 || b.y > H + 20) continue;
      best = Math.min(best, Math.hypot(px - b.x, py - b.y));
    }
  }
  if (typeof beams !== 'undefined') {
    for (var j = 0; j < beams.length; j++) {
      var bm = beams[j];
      if (bm.t < bm.charge) continue;
      var ex = bm.x + Math.cos(bm.ang) * bm.len;
      var ey = bm.y + Math.sin(bm.ang) * bm.len;
      var vx = ex - bm.x, vy = ey - bm.y, L = vx * vx + vy * vy || 1;
      var tt = Math.max(0, Math.min(1, ((px - bm.x) * vx + (py - bm.y) * vy) / L));
      best = Math.min(best, Math.hypot(px - (bm.x + vx * tt), py - (bm.y + vy * tt)) - (bm.w || 8) * 0.5);
    }
  }
  return best;
}

function phantomDashAway() {
  var cx = player.x, cy = player.y;
  var candidates = [
    { x: cx - 96, y: cy }, { x: cx + 96, y: cy },
    { x: cx - 76, y: cy - 54 }, { x: cx + 76, y: cy - 54 },
    { x: cx - 72, y: cy + 46 }, { x: cx + 72, y: cy + 46 },
    { x: cx, y: cy - 82 }
  ];
  var best = null, bestScore = -1;
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    c.x = Math.max(32, Math.min(W - 32, c.x));
    c.y = Math.max(100, Math.min(H - 100, c.y));
    var score = phantomBulletDistance(c.x, c.y);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best) return;
  phantomState.dashFromX = cx; phantomState.dashFromY = cy; phantomState.dashT = 0.24;
  player.x = target.x = best.x;
  player.y = target.y = best.y;
  player.trail.unshift({ x: cx, y: cy });
  if (player.trail.length > 140) player.trail.pop();
  try { for (var k = 0; k < 16; k++) { var q = k / 15; part(cx + (best.x - cx) * q, cy + (best.y - cy) * q, k % 2 ? '#c98bff' : '#8fe9ff', 1, 90); } } catch (e) {}
  try { shake = Math.max(shake, 5); } catch (e) {}
}

function phantomSkill() {
  if ((state !== 'play' && state !== 'boss') || player.ship !== 'phantom') return false;
  if (player.bombs <= 0) return false;
  player.bombs--;
  var cloakDur = phantomIsRaven() ? 4.0 : 3.0;
  phantomState.cloakT = cloakDur;
  phantomState.flashT = 0.55;
  player.invuln = Math.max(player.invuln, cloakDur + 0.2);
  var n = phantomIsButterfly() ? 2 : 1;
  var side = phantomState.clones.length ? -1 : 1;
  for (var i = 0; i < n; i++) {
    var off = n === 1 ? 58 * side : (i === 0 ? -34 : 34);
    phantomSpawnClone(off);
  }
  phantomDashAway();
  phantomWhooshB();
  try { if (typeof part === 'function') for (var k = 0; k < 20; k++) part(player.x, player.y, k % 2 ? '#c98bff' : '#8fe9ff', 1, 180); } catch (e) {}
  return true;
}

function phantomCollectW() {
  if (phantomState.cloneHp < 6) {
    phantomState.cloneHp++;
    for (var i = 0; i < phantomState.clones.length; i++) {
      phantomState.clones[i].maxHp = phantomState.cloneHp;
      phantomState.clones[i].hp = phantomState.cloneHp;
    }
    pickupMsg = 'CLONE HP ' + phantomState.cloneHp + '/6';
    score += 40;
  } else {
    pickupMsg = gainOD(15) ? 'OVERDRIVE!' : 'CLONE HP MAX +15 OD';
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

function phantomFireLaser(c) {
  var w = 8 + Math.min(c.power, 3) * 5;
  var dmg = (2 + c.power * 2) * powerDamageFactor();
  var hit = false, endY = 0;
  if (typeof enemies !== 'undefined') {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.y > c.y + 14) continue;
      if (Math.abs(e.x - c.x) > w / 2 + enemyW(e) * 0.30) continue;
      if (endY <= 0 || e.y < endY) endY = e.y;
      e.hp -= dmg; e.flash = 0.12; hit = true;
      if (e.hp <= 0) { score += ET[e.type].score; enemyDeath(e); maybeDrop(e); removeEnemy(i); }
    }
  }
  if (boss && state === 'boss' && boss.y < c.y + 14 && Math.abs(boss.x - c.x) < w / 2 + boss.def.w * 0.20) {
    if (endY <= 0 || boss.y < endY) endY = boss.y;
    damageBoss(dmg); boss.hitFlash = 0.18; boss.hitX = c.x; boss.hitY = boss.y; hit = true;
  }
  phantomState.beams.push({ x: c.x, y: c.y - 16, endY: endY, w: w, level: c.power, t: 0, life: 0.12 });
  if (hit) { try { sfx('p_laser', 0.08); } catch (e) {} }
}

function phantomCloneFire(c) {
  var save = {
    x: player.x, y: player.y, weapon: player.weapon, specialPower: player.specialPower,
    extraBullets: player.extraBullets, damageMult: player.damageMult,
    normalBuff: player.normalBuff, odT: player.odT, invuln: player.invuln, options: player.options
  };
  try {
    player.x = c.x; player.y = c.y;
    player.weapon = c.weapon; player.specialPower = c.power;
    player.extraBullets = c.extra; player.damageMult = (c.damageMult || 1) * 0.70;
    player.normalBuff = 1; player.odT = 0;
    if (c.od) player.options = 0;
    phantomState.cloneFiring = true;
    if (c.weapon === 'spread') fireSpread();
    else if (c.weapon === 'missile') launchMissiles();
    else if (c.weapon === 'laser') phantomFireLaser(c);
    else fireNormal();
  } finally {
    phantomState.cloneFiring = false;
    player.x = save.x; player.y = save.y; player.weapon = save.weapon;
    player.specialPower = save.specialPower; player.extraBullets = save.extraBullets;
    player.damageMult = save.damageMult; player.normalBuff = save.normalBuff;
    player.odT = save.odT; player.invuln = save.invuln; player.options = save.options;
  }
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
  // Horizontal aiming: clones slide under the target, but stay in a safe
  // vertical formation near the player instead of flying into enemies.
  var tx = c.target ? c.target.x : (player.x + (c.slot === 0 ? -24 : 24));
  var ty = player.y - 28 - c.slot * 16;
  tx = Math.max(34, Math.min(W - 34, tx));
  ty = Math.max(92, Math.min(H - 96, ty));
  var dx = tx - c.x, dy = ty - c.y;
  var hstep = Math.min(Math.abs(dx), 185 * dt);
  var vstep = Math.min(Math.abs(dy), 110 * dt);
  if (Math.abs(dx) > 1) c.x += (dx > 0 ? 1 : -1) * hstep;
  if (Math.abs(dy) > 1) c.y += (dy > 0 ? 1 : -1) * vstep;
}
function phantomSpawnOdClones() {
  phantomState.odClones.length = 0;
  // Five invincible OD clones span the full playfield from left to right.
  // They fire their own random weapon, but never the VECTOR OD patterns:
  // phantomCloneFire() forces player.odT = 0 for the clone shot only.
  var weapons = ['normal', 'spread', 'laser', 'missile'];
  for (var i = 0; i < 5; i++) {
    var x = W * (0.10 + i * 0.20);
    var y = Math.max(110, Math.min(H - 130, phantomState.odAnchorY));
    var c = {
      x: x, y: y, hp: 999999, maxHp: 999999, invulnT: 0,
      weapon: weapons[Math.floor(rng() * weapons.length)],
      power: player.specialPower,
      extra: 0, options: 0, damageMult: player.damageMult || 1,
      fireT: 0.10 + i * 0.045, target: null, retargetT: 0,
      slot: i, age: 0, spawnT: 0.30, life: 999999, od: true,
      skin: (currentSkinDef() ? currentSkinDef().id : 'quantum')
    };
    phantomState.odClones.push(c);
    phantomBurst(x, y, 'spawn');
  }
}
function phantomClearOdClones() {
  for (var i = 0; i < phantomState.odClones.length; i++) {
    var c = phantomState.odClones[i];
    phantomBurst(c.x, c.y, 'vanish');
  }
  phantomState.odClones.length = 0;
}

function phantomUpdate(dt) {
  if (player.ship !== 'phantom') return;
  if (state !== 'play' && state !== 'boss') return;
  if (player.odT > 0 && !phantomState.odActive) { phantomState.odActive = true; phantomState.odAnchorY = player.y; if (typeof odLaserFx !== 'undefined') odLaserFx.length = 0; phantomSpawnOdClones(); }
  else if (player.odT <= 0 && phantomState.odActive) { phantomState.odActive = false; phantomClearOdClones(); }
  if (phantomState.cloakT > 0) phantomState.cloakT = Math.max(0, phantomState.cloakT - dt);
  if (phantomState.flashT > 0) phantomState.flashT = Math.max(0, phantomState.flashT - dt);
  if (phantomState.dashT > 0) phantomState.dashT = Math.max(0, phantomState.dashT - dt);
  for (var bi = phantomState.bursts.length - 1; bi >= 0; bi--) {
    phantomState.bursts[bi].t += dt;
    if (phantomState.bursts[bi].t >= phantomState.bursts[bi].life) phantomState.bursts.splice(bi, 1);
  }
  for (var oi = 0; oi < phantomState.odClones.length; oi++) {
    var oc = phantomState.odClones[oi];
    oc.age += dt;
    if (oc.spawnT > 0) oc.spawnT = Math.max(0, oc.spawnT - dt);
    oc.fireT -= dt;
    if (oc.fireT <= 0) {
      oc.fireT = oc.weapon === 'spread' ? 0.16 : (oc.weapon === 'laser' ? 0.08 : (oc.weapon === 'missile' ? 0.46 : 0.10));
      phantomCloneFire(oc);
    }
  }
  for (var i = phantomState.clones.length - 1; i >= 0; i--) {
    var c = phantomState.clones[i];
    c.age += dt;
    if (c.spawnT > 0) c.spawnT = Math.max(0, c.spawnT - dt);
    if (c.invulnT > 0) c.invulnT = Math.max(0, c.invulnT - dt);
    if (c.hp <= 0 || c.age > c.life) {
      if (c.hp <= 0) {
        // Destroyed clone: full explosion + destruction sound.
        try { if (typeof boom === 'function') boom(c.x, c.y, 0.58, 'normal'); } catch (e) {}
        try { if (typeof part === 'function') for (var p = 0; p < 16; p++) part(c.x, c.y, p % 2 ? '#c98bff' : '#8fe9ff', 1, 170); } catch (e) {}
      } else {
        try { if (typeof part === 'function') for (var p2 = 0; p2 < 8; p2++) part(c.x, c.y, '#c98bff', 1, 90); } catch (e) {}
      }
      phantomBurst(c.x, c.y, 'vanish');
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
    if (c.od || c.invulnT > 0) continue;
    if (Math.hypot(x - c.x, y - c.y) < player.r + (r || 4)) {
      c.hp--;
      c.invulnT = 1.0;
      try { if (typeof part === 'function') for (var p = 0; p < 6; p++) part(c.x, c.y, '#c98bff', 1, 120); } catch (e) {}
      return true;
    }
  }
  return false;
}

function phantomAimTarget() {
  if (typeof coopEnabled !== 'undefined' && coopEnabled && player2) {
    var a = { x: player.x, y: player.y }, b = { x: player2.x, y: player2.y };
    return Math.hypot(a.x - 195, a.y - 500) <= Math.hypot(b.x - 195, b.y - 500) ? a : b;
  }
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
  if (phantomState.dashT > 0) {
    var dimg = GIMG[currentSkinImage()];
    ctx.save(); ctx.globalAlpha = 0.28 * (phantomState.dashT / 0.24);
    if (dimg && dimg.complete) ctx.drawImage(dimg, phantomState.dashFromX - 40, phantomState.dashFromY - 40, 80, 80);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  for (var oi = 0; oi < phantomState.odClones.length; oi++) {
    var oc = phantomState.odClones[oi];
    var oimg = GIMG[currentSkinImage()];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var og = ctx.createRadialGradient(oc.x, oc.y, 2, oc.x, oc.y, 40);
    og.addColorStop(0, 'rgba(255,225,130,0.30)'); og.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(oc.x, oc.y, 40, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.78;
    if (oimg && oimg.complete) ctx.drawImage(oimg, oc.x - 34, oc.y - 34, 68, 68);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,215,120,0.78)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(oc.x, oc.y, 28 + Math.sin(time * 9 + oi) * 2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(143,233,255,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(oc.x, oc.y, 34, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffe7a0'; ctx.font = '700 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('OD', oc.x, oc.y - 38);
    ctx.restore(); ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  for (var i = 0; i < phantomState.clones.length; i++) {
    var c = phantomState.clones[i];
    var img = GIMG[currentSkinImage()];
    ctx.save();
    ctx.globalAlpha = 0.70;
    if (img && img.complete) ctx.drawImage(img, c.x - 34, c.y - 34, 68, 68);
    else {
      ctx.strokeStyle = '#c98bff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c.x, c.y - 24); ctx.lineTo(c.x + 20, c.y); ctx.lineTo(c.x, c.y + 24); ctx.lineTo(c.x - 20, c.y); ctx.closePath(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (c.invulnT > 0) {
      ctx.strokeStyle = 'rgba(143,233,255,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, 26, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(6,12,24,0.8)'; ctx.fillRect(c.x - 22, c.y + 27, 44, 4);
    ctx.fillStyle = '#c98bff'; ctx.fillRect(c.x - 22, c.y + 27, 44 * (c.hp / c.maxHp), 4);
    ctx.restore();
  }
  for (var b = 0; b < phantomState.beams.length; b++) {
    var bm = phantomState.beams[b], a = 1 - bm.t / bm.life;
    var cols = ['80,190,255', '120,240,255', '255,120,220', '255,215,100'];
    var cc = cols[Math.max(0, Math.min(3, (bm.level || 1) - 1))];
    var bw = bm.w + Math.sin(time * 30) * 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var lg = ctx.createLinearGradient(bm.x - bw, 0, bm.x + bw, 0);
    lg.addColorStop(0, 'rgba(' + cc + ',0)');
    lg.addColorStop(0.35, 'rgba(' + cc + ',' + (0.55 * a) + ')');
    lg.addColorStop(0.5, 'rgba(255,255,255,' + (0.95 * a) + ')');
    lg.addColorStop(0.65, 'rgba(' + cc + ',' + (0.55 * a) + ')');
    lg.addColorStop(1, 'rgba(' + cc + ',0)');
    var by = bm.endY > 0 ? bm.endY : 0;
    ctx.fillStyle = lg; ctx.fillRect(bm.x - bw, by, bw * 2, bm.y - by);
    ctx.globalAlpha = 0.9 * a; ctx.fillStyle = '#fff'; ctx.fillRect(bm.x - 2, by, 4, bm.y - by);
    if (bm.endY > 0) {
      var gr = 14 + 7 * Math.sin(time * 40);
      var hg = ctx.createRadialGradient(bm.x, bm.endY, 0, bm.x, bm.endY, gr);
      hg.addColorStop(0, 'rgba(255,255,240,0.95)');
      hg.addColorStop(0.4, 'rgba(' + cc + ',0.85)');
      hg.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.globalAlpha = a; ctx.fillStyle = hg; ctx.beginPath();
      ctx.arc(bm.x, bm.endY, gr, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  for (var q = 0; q < phantomState.bursts.length; q++) {
    var b = phantomState.bursts[q], u = b.t / b.life, a = 1 - u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = b.kind === 'vanish' ? '#d8b4ff' : '#ffffff';
    ctx.lineWidth = 1.5 + 3 * a;
    ctx.beginPath(); ctx.arc(b.x, b.y, 10 + 42 * u, 0, TAU); ctx.stroke();
    ctx.globalAlpha = a * (b.kind === 'spawn' ? 0.38 : 0.22); ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, 7 + 26 * u, 0, TAU); ctx.fill();
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

try { window.__phantomSelect=function(id){ setSelectedShip('phantom', false); setSelectedSkin('phantom', id||'quantum', false); phantomReset(); }; window.__phantom=function(){return {ship:player.ship,bombs:player.bombs,cloakT:phantomState.cloakT,clones:phantomState.clones.map(function(c){return {x:c.x,y:c.y,hp:c.hp,invulnT:c.invulnT,weapon:c.weapon,power:c.power};}),cap:phantomState.cap,cloneHp:phantomState.cloneHp,odClones:phantomState.odClones.length,odActive:phantomState.odActive,odData:phantomState.odClones.map(function(c){return {weapon:c.weapon,power:c.power,y:Math.round(c.y)};}),odAnchorY:Math.round(phantomState.odAnchorY),wCount:phantomState.wCount,cloakDamage:phantomDamageMult()};}; window.__phantomW=function(){phantomCollectW();return window.__phantom();}; } catch(e) {}
