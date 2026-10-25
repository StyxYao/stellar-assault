// Ship definitions and the AEGIS prototype state.
// R1 scope: sandbox mechanics only; no campaign rework.
var SHIP_DEFS = {
  vector: { id: 'vector', label: 'VECTOR', subtitle: 'BALANCED · WINGMAN' },
  aegis: { id: 'aegis', label: 'AEGIS', subtitle: 'FORCE · CHARGE' }
};
var selectedShip = 'vector';
var SHIP_SKINS = {
  vector: [
    { id: 'void_lance', label: 'VOID LANCE', image: 'sk_vector_void_lance', ox: 3.5, oy: 2 },
    { id: 'starfall', label: 'STARFALL WING', image: 'sk_vector_starfall', ox: 0.5, oy: 1 },
    { id: 'abyss', label: 'ABYSS BLADE', image: 'sk_vector_abyss', ox: 0.5, oy: 1 }
  ],
  aegis: [
    { id: 'orbital', label: 'ORBITAL GUARDIAN', image: 'sk_aegis_orbital', ox: 3.5, oy: 2.5 },
    { id: 'void_echo', label: 'VOID ECHO', image: 'sk_aegis_void_echo', ox: 1, oy: 0.5 },
    { id: 'temporal', label: 'TEMPORAL WANDERER', image: 'sk_aegis_temporal', ox: 0.5, oy: 1 }
  ],
  phantom: [
    { id: 'quantum', label: 'QUANTUM HUNTER', image: 'sk_phantom_quantum' },
    { id: 'raven', label: 'PHANTOM RAVEN', image: 'sk_phantom_raven' },
    { id: 'butterfly', label: 'PHANTOM BUTTERFLY' }
  ]
};
var selectedSkins = { vector: 'void_lance', aegis: 'orbital', phantom: 'quantum' };
var aegisTutorialT = 0;

var AEGIS_CHARGE_MAX = 1.30;
var AEGIS_AUTO_RELEASE = 0.35;
var AEGIS_CHARGE_COOLDOWN = 0.20;
var AEGIS_FORCE_RADIUS = 38;
var AEGIS_SHIELD_MAX = 60;
var AEGIS_SHIELD_COST = 8;
var AEGIS_SHIELD_REGEN = 14;
var AEGIS_SHIELD_DELAY = 1.2;
var AEGIS_BREAK_TIME = 10.0;
var AEGIS_FORCE_DAMAGE = 240;
var AEGIS_FORCE_LANE_HALF = 38;

var AEGIS_CHARGE_PROFILES = {
  normal:  { kind: 'lance', count: 1, color: '#9fe8ff', range: 560 },
  spread:  { kind: 'fan', count: 5, color: '#ffb36b', range: 320 },
  laser:   { kind: 'beam', count: 1, color: '#ff7ad5', range: 760 },
  missile: { kind: 'swarm', count: 2, color: '#ffd36b', range: 620 }
};

var aegisState = {
  charge: 'idle',
  chargeT: 0,
  chargeBonus: 0,
  autoT: 0,
  cooldown: 0,
  force: 'attached',
  forceX: 0,
  forceY: 0,
  shield: AEGIS_SHIELD_MAX,
  lastBlockAt: -999,
  breakT: 0,
  forceFireT: 0,
  forceHitT: 0,
  flashT: 0,
  laneT: 0,
  castT: 0,
  castKind: '',
  castRange: 0,
  castColor: ''
};

function skinList(ship) { return SHIP_SKINS[ship] || SHIP_SKINS.vector; }
function selectedSkinDef(ship, id) {
  var list = skinList(ship);
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return list[0];
}
function currentSkinDef() { return selectedSkinDef(selectedShip, selectedSkins[selectedShip]); }
function currentSkinImage() { return currentSkinDef().image || null; }
function aegisVisualX() {
  var def = (typeof currentSkinDef === 'function') ? currentSkinDef() : null;
  return player.x + (def && def.ox ? def.ox : 0);
}
function skinNumber() { var list = skinList(selectedShip); for (var i = 0; i < list.length; i++) if (list[i].id === selectedSkins[selectedShip]) return i + 1; return 1; }
function setSelectedSkin(ship, id, persist) {
  var def = selectedSkinDef(ship, id);
  selectedSkins[ship] = def.id;
  if (persist !== false && typeof SaveStore !== 'undefined' && SaveStore.data && SaveStore.data.ships[ship]) {
    SaveStore.data.ships[ship].skin = def.id;
    if (typeof persistSave === 'function') persistSave();
  }
}
function cycleSkin(delta) {
  var list = skinList(selectedShip);
  var idx = 0;
  for (var i = 0; i < list.length; i++) if (list[i].id === selectedSkins[selectedShip]) idx = i;
  idx = (idx + (delta || 1) + list.length) % list.length;
  setSelectedSkin(selectedShip, list[idx].id);
}
function initSelectedSkins() {
  try {
    var d = SaveStore.data.ships;
    if (d.vector && d.vector.skin) setSelectedSkin('vector', d.vector.skin, false);
    if (d.aegis && d.aegis.skin) setSelectedSkin('aegis', d.aegis.skin, false);
  } catch (e) {}
}
function setSelectedShip(id, persist) {
  id = id === 'aegis' ? 'aegis' : 'vector';
  selectedShip = id;
  if (persist !== false && typeof SaveStore !== 'undefined' && SaveStore.data) {
    SaveStore.data.ships.selected = id;
    if (typeof persistSave === 'function') persistSave();
  }
}

function toggleSelectedShip() {
  setSelectedShip(selectedShip === 'vector' ? 'aegis' : 'vector');
}

function startAegisTutorial() {
  try {
    if (!SaveStore.data.settings.aegisTutorialSeen) {
      SaveStore.data.settings.aegisTutorialSeen = true;
      aegisTutorialT = 6.0;
      if (typeof persistSave === 'function') persistSave();
    }
  } catch (e) {}
}
function aegisReset() {
  aegisState.charge = 'idle';
  aegisState.chargeT = 0;
  aegisState.chargeBonus = 0;
  aegisState.autoT = 0;
  aegisState.cooldown = 0;
  aegisState.force = 'attached';
  aegisState.shield = AEGIS_SHIELD_MAX;
  aegisState.lastBlockAt = -999;
  aegisState.breakT = 0;
  aegisState.forceFireT = 0;
  aegisState.forceHitT = 0;
  aegisState.flashT = 0;
  aegisState.laneT = 0;
  aegisState.castT = 0;
  aegisState.castKind = '';
  if (typeof player !== 'undefined') {
    aegisState.forceX = aegisVisualX();
    aegisState.forceY = player.y - 42;
  }
}

function aegisOnDeath() {
  aegisReset();
}

function aegisChargeLevel() {
  if (aegisState.chargeT >= 1.30) return 3;
  if (aegisState.chargeT >= 0.80) return 2;
  if (aegisState.chargeT >= 0.35) return 1;
  return 0;
}

function aegisProfile() {
  var base = AEGIS_CHARGE_PROFILES[player.weapon] || AEGIS_CHARGE_PROFILES.normal;
  var power = Math.max(1, Math.min(4, player.specialPower || 1));
  return {
    kind: base.kind,
    count: base.kind === 'fan' ? 3 + power * 2 : (base.kind === 'swarm' ? power : base.count),
    color: base.color,
    range: base.range,
    power: power
  };
}

function aegisGainCharge(percent) {
  var add = Math.max(0, Math.min(100, percent)) / 100 * AEGIS_CHARGE_MAX;
  if (aegisState.charge === 'charging') aegisState.chargeT = Math.min(AEGIS_CHARGE_MAX, aegisState.chargeT + add);
  else aegisState.chargeBonus = Math.min(AEGIS_CHARGE_MAX, aegisState.chargeBonus + add);
}

function aegisTapCharge() {
  if (state !== 'play' && state !== 'boss') return;
  if (aegisState.cooldown > 0) return;
  if (aegisState.charge === 'charging') {
    if (aegisChargeLevel() > 0) aegisReleaseCharge();
    else { aegisState.charge = 'idle'; aegisState.chargeT = 0; }
    return;
  }
  if (aegisState.charge === 'idle') {
    aegisState.charge = 'charging';
    aegisState.chargeT = aegisState.chargeBonus;
    aegisState.chargeBonus = 0;
    aegisState.autoT = 0;
    try { laserHitY = 0; laserHitT = 0; } catch (e) {}
    try { sfx('e_charge', 0.18); } catch (e) {}
  }
}

function aegisNormalDps() {
  var lv = Math.max(1, Math.min(4, player.specialPower || 1));
  if (player.weapon === 'spread') {
    var n = 3 + (lv - 1) * 2, d = lv >= 4 ? 2.6 : 1.8;
    return n * d / 0.16;
  }
  if (player.weapon === 'laser') return (2 + lv * 2) / 0.08;
  if (player.weapon === 'missile') return (lv + 1) * (lv >= 4 ? 8 : 6) / 0.46;
  var per = lv <= 1 ? 6 : (lv === 2 ? 9 : (lv === 3 ? 10.4 : 25));
  return per / 0.10;
}

function aegisReleaseCharge() {
  var level = aegisChargeLevel();
  if (level <= 0) return;
  var prof = aegisProfile();
  // Damage the stopped normal weapon would have dealt over this charge,
  // then apply the requested 1.35x charge bonus.
  var chargeTime = Math.max(0.35, aegisState.chargeT);
  var totalDamage = aegisNormalDps() * chargeTime * 1.35;
  var px = aegisVisualX(), py = player.y - 26;
  if (prof.kind === 'fan') {
    var perFan = totalDamage / prof.count;
    for (var i = 0; i < prof.count; i++) {
      var a = (i - (prof.count - 1) / 2) * 0.095;
      addShot(px, py, Math.sin(a) * 900, -Math.cos(a) * 900, perFan, false, false, true, prof.power >= 4, prof.range);
    }
  } else if (prof.kind === 'beam') {
    addShot(px, py, 0, -1250, totalDamage * 0.50, false, true, true, true, prof.range);
    addShot(px - 12, py, 0, -1250, totalDamage * 0.25, false, true, true, true, prof.range);
    addShot(px + 12, py, 0, -1250, totalDamage * 0.25, false, true, true, true, prof.range);
  } else if (prof.kind === 'swarm') {
    var perMissile = totalDamage / prof.count;
    for (var m = 0; m < prof.count; m++) {
      spawnMissile(px + (m - (prof.count - 1) / 2) * 16, py, false, perMissile, prof.power >= 4, 0, -170, prof.range);
    }
  } else {
    addShot(px, py, 0, -1150, totalDamage, false, false, true, prof.power >= 4, prof.range);
  }
  if (typeof fx !== 'undefined' && fx) fx.push({ x: px, y: py, t: 0, life: 0.32, kind: 'hitspark', sc: 3.4, color: prof.color });
  aegisState.flashT = Math.max(aegisState.flashT, 0.50);
  aegisState.laneT = 0;
  aegisState.castT = 0.55;
  aegisState.castKind = prof.kind;
  aegisState.castRange = prof.range || 500;
  aegisState.castColor = prof.color;
  try { shake = Math.max(shake, 9); } catch (e) {}
  try { if (typeof part === 'function') for (var pp = 0; pp < 18; pp++) part(px, py, prof.color, 1, 180); } catch (e) {}
  aegisState.charge = 'idle';
  aegisState.chargeT = 0;
  aegisState.autoT = 0;
  aegisState.cooldown = AEGIS_CHARGE_COOLDOWN;
  try { sfx('aegis_cannon', 0.62); } catch (e) {}
}

function aegisLaneHit() {
  var lane = AEGIS_FORCE_LANE_HALF;
  var px = aegisState.forceX;
  // Clear enemy bullets in the forward lane.
  if (typeof ebullets !== 'undefined' && ebullets) {
    for (var bi = ebullets.length - 1; bi >= 0; bi--) {
      var b = ebullets[bi];
      if (b.y < player.y + 14 && b.y > -30 && Math.abs(b.x - px) < lane + 7) {
        if (typeof part === 'function') part(b.x, b.y, '#ffd36b', 1, 130);
        ebullets.splice(bi, 1);
      }
    }
  }
  // Damage enemies in the lane. 240 = 2x the old bomb's 120 boss damage.
  if (typeof enemies !== 'undefined' && enemies) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.y > player.y + 20) continue;
      if (Math.abs(e.x - px) > lane + enemyW(e) * 0.45) continue;
      e.hp -= AEGIS_FORCE_DAMAGE;
      e.flash = 0.18;
      if (typeof hitSpark === 'function') hitSpark(e.x, e.y, false, false);
      if (e.hp <= 0) {
        score += ET[e.type].score;
        enemyDeath(e); maybeDrop(e); removeEnemy(i);
      }
    }
  }
  if (boss && state === 'boss' && boss.y < player.y + 20 && Math.abs(boss.x - px) < lane + boss.def.w * 0.30) {
    boss.hp -= AEGIS_FORCE_DAMAGE;
    boss.hitFlash = 0.24; boss.hitX = px; boss.hitY = Math.max(40, boss.y);
    if (typeof hitSpark === 'function') hitSpark(boss.x, boss.y, false, true);
  }
  for (var k = 0; k < 14; k++) {
    if (typeof part === 'function') part(px + (Math.random() - 0.5) * lane * 1.7, player.y - Math.random() * (player.y - 40), '#ffd36b', 1, 240);
  }
}

function aegisLaunchForce() {
  if (state !== 'play' && state !== 'boss') return false;
  if (aegisState.force !== 'attached' || player.bombs <= 0) return false;
  player.bombs--;
  if (aegisState.charge === 'charging') { aegisState.charge = 'idle'; aegisState.chargeT = 0; }
  aegisState.force = 'detached';
  aegisState.forceX = aegisVisualX();
  aegisState.forceY = player.y - 42;
  aegisState.flashT = 0.55;
  aegisState.laneT = 0.55;
  aegisState.castT = 0.55;
  aegisState.castKind = 'force';
  aegisState.castRange = player.y;
  aegisState.castColor = '#ffd36b';
  aegisLaneHit();
  try { shake = Math.max(shake, 12); } catch (e) {}
  try { sfx('aegis_force', 0.72); } catch (e) {}
  return true;
}

function aegisTapForce() {
  if (state !== 'play' && state !== 'boss') return;
  if (aegisState.force === 'attached') {
    aegisLaunchForce();
  } else if (aegisState.force === 'detached') {
    aegisState.force = 'returning';
    try { sfx('e_charge', 0.18); } catch (e) {}
  }
}

function updateAegis(dt) {
  if (player.ship !== 'aegis') return;
  if (state !== 'play' && state !== 'boss') return;
  if (aegisTutorialT > 0) aegisTutorialT = Math.max(0, aegisTutorialT - dt);
  if (aegisState.cooldown > 0) aegisState.cooldown = Math.max(0, aegisState.cooldown - dt);
  if (aegisState.forceHitT > 0) aegisState.forceHitT = Math.max(0, aegisState.forceHitT - dt);
  if (aegisState.flashT > 0) aegisState.flashT = Math.max(0, aegisState.flashT - dt);
  if (aegisState.laneT > 0) aegisState.laneT = Math.max(0, aegisState.laneT - dt);
  if (aegisState.castT > 0) aegisState.castT = Math.max(0, aegisState.castT - dt);

  if (aegisState.charge === 'charging') {
    aegisState.chargeT = Math.min(AEGIS_CHARGE_MAX, aegisState.chargeT + dt);
    aegisState.autoT = aegisState.chargeT >= AEGIS_CHARGE_MAX ? aegisState.autoT + dt : 0;
    if (aegisState.autoT >= AEGIS_AUTO_RELEASE) aegisReleaseCharge();
  }

  if (aegisState.force === 'broken') {
    aegisState.breakT -= dt;
    if (aegisState.breakT <= 0) { aegisState.force = 'attached'; aegisState.shield = 20; }
  } else if (aegisState.force === 'attached') {
    aegisState.forceX = aegisVisualX();
    aegisState.forceY = player.y - 42;
    if (aegisState.shield < AEGIS_SHIELD_MAX && time - aegisState.lastBlockAt > AEGIS_SHIELD_DELAY) aegisState.shield = Math.min(AEGIS_SHIELD_MAX, aegisState.shield + AEGIS_SHIELD_REGEN * dt);
    if (ebullets) {
      for (var i = ebullets.length - 1; i >= 0; i--) {
        var b = ebullets[i];
        if (b.bomb) continue;
        if (Math.hypot(b.x - aegisState.forceX, b.y - aegisState.forceY) < AEGIS_FORCE_RADIUS) {
          ebullets.splice(i, 1);
          aegisState.shield -= AEGIS_SHIELD_COST;
          aegisState.lastBlockAt = time;
          if (typeof part === 'function') part(aegisState.forceX, aegisState.forceY, '#9fe8ff', 2, 80);
          if (aegisState.shield <= 0) { aegisState.shield = 0; aegisState.force = 'broken'; aegisState.breakT = AEGIS_BREAK_TIME; break; }
        }
      }
    }
  } else if (aegisState.force === 'detached') {
    aegisState.forceY -= 420 * dt;
    if (aegisState.forceY < -40) aegisState.force = 'returning';
  } else if (aegisState.force === 'returning') {
    var tx = aegisVisualX(), ty = player.y - 42;
    aegisState.forceX += (tx - aegisState.forceX) * Math.min(1, dt * 12);
    aegisState.forceY += (ty - aegisState.forceY) * Math.min(1, dt * 12);
    if (Math.hypot(tx - aegisState.forceX, ty - aegisState.forceY) < 8) aegisState.force = 'attached';
  }
}

function aegisButtons() {
  return {
    charge: { x: W - 138, y: H - 78, r: 32 },
    force: { x: W - 64, y: H - 78, r: 38 }
  };
}

function aegisButtonAt(p) {
  var b = aegisButtons();
  var list = ['charge', 'force'];
  for (var i = 0; i < list.length; i++) {
    var q = b[list[i]];
    if (Math.hypot(p.x - q.x, p.y - q.y) <= q.r) return list[i];
  }
  return null;
}

function aegisBestScore() {
  try { return SaveStore.data.ships[selectedShip].bestScore || 0; } catch (e) { return 0; }
}

window.__aegis = function() {
  return {
    selectedShip: selectedShip,
    playerShip: player ? player.ship : null,
    shipState: aegisState,
    chargeLevel: typeof aegisChargeLevel === 'function' ? aegisChargeLevel() : 0,
    buttons: typeof aegisButtons === 'function' ? aegisButtons() : null
  };
};
