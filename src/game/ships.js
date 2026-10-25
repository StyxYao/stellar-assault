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
    { id: 'quantum', label: 'QUANTUM HUNTER' },
    { id: 'raven', label: 'PHANTOM RAVEN', image: 'sk_phantom_raven' },
    { id: 'butterfly', label: 'PHANTOM BUTTERFLY' }
  ]
};
var selectedSkins = { vector: 'void_lance', aegis: 'orbital', phantom: 'raven' };
var aegisTutorialT = 0;

var AEGIS_CHARGE_MAX = 1.30;
var AEGIS_AUTO_RELEASE = 0.35;
var AEGIS_CHARGE_COOLDOWN = 0.20;
var AEGIS_FORCE_RADIUS = 27;
var AEGIS_SHIELD_MAX = 100;
var AEGIS_SHIELD_COST = 8;
var AEGIS_SHIELD_REGEN = 14;
var AEGIS_SHIELD_DELAY = 1.2;
var AEGIS_BREAK_TIME = 2.5;

var AEGIS_CHARGE_PROFILES = {
  normal:  { kind: 'lance', count: 1, color: '#9fe8ff' },
  spread:  { kind: 'fan', count: 5, color: '#ffb36b' },
  laser:   { kind: 'beam', count: 1, color: '#ff7ad5' },
  missile: { kind: 'swarm', count: 2, color: '#ffd36b' }
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
  forceHitT: 0
};

function skinList(ship) { return SHIP_SKINS[ship] || SHIP_SKINS.vector; }
function selectedSkinDef(ship, id) {
  var list = skinList(ship);
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return list[0];
}
function currentSkinDef() { return selectedSkinDef(selectedShip, selectedSkins[selectedShip]); }
function currentSkinImage() { return currentSkinDef().image || null; }
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
  if (typeof player !== 'undefined') {
    aegisState.forceX = player.x;
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
    try { sfx('e_charge', 0.18); } catch (e) {}
  }
}

function aegisReleaseCharge() {
  var level = aegisChargeLevel();
  if (level <= 0) return;
  var prof = aegisProfile();
  var intensity = Math.max(0.55, Math.min(1, aegisState.chargeT / AEGIS_CHARGE_MAX));
  var dmg = (1.8 + prof.power * 1.15) * intensity * powerDamageFactor() * (aegisState.force === 'attached' ? 1.10 : 1);
  var px = player.x, py = player.y - 26;
  if (prof.kind === 'fan') {
    for (var i = 0; i < prof.count; i++) {
      var a = (i - (prof.count - 1) / 2) * 0.095;
      addShot(px, py, Math.sin(a) * 900, -Math.cos(a) * 900, dmg * 0.62, false, false, true, prof.power >= 4);
    }
  } else if (prof.kind === 'beam') {
    addShot(px, py, 0, -1250, dmg * 1.25, false, true, true, true);
    addShot(px - 12, py, 0, -1250, dmg * 0.65, false, true, true, true);
    addShot(px + 12, py, 0, -1250, dmg * 0.65, false, true, true, true);
  } else if (prof.kind === 'swarm') {
    for (var m = 0; m < prof.count; m++) {
      spawnMissile(px + (m - (prof.count - 1) / 2) * 16, py, false, prof.power >= 4 ? 8 : 6, prof.power >= 4, 0, -170);
    }
  } else {
    addShot(px, py, 0, -1150, dmg * 1.6, false, false, true, prof.power >= 4);
    if (prof.power >= 3) addShot(px - 12, py, 0, -1050, dmg * 0.75, false, false, true, true);
    if (prof.power >= 3) addShot(px + 12, py, 0, -1050, dmg * 0.75, false, false, true, true);
  }
  if (typeof fx !== 'undefined' && fx) fx.push({ x: px, y: py, t: 0, life: 0.22, kind: 'hitspark', sc: 2.1, color: prof.color });
  aegisState.charge = 'idle';
  aegisState.chargeT = 0;
  aegisState.autoT = 0;
  aegisState.cooldown = AEGIS_CHARGE_COOLDOWN;
  try { sfx('aegis_cannon', 0.62); } catch (e) {}
}

function aegisTapForce() {
  if (state !== 'play' && state !== 'boss') return;
  if (aegisState.force === 'attached') {
    aegisState.force = 'detached';
    aegisState.forceX = player.x;
    aegisState.forceY = player.y - 42;
    try { sfx('aegis_force', 0.62); } catch (e) {}
  } else if (aegisState.force === 'detached') {
    aegisState.force = 'returning';
  }
}

function aegisForceDamage(dt) {
  if (aegisState.force === 'attached' || aegisState.force === 'broken') return;
  if (aegisState.forceHitT > 0) return;
  var hit = null;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (Math.hypot(e.x - aegisState.forceX, e.y - aegisState.forceY) < AEGIS_FORCE_RADIUS + enemyW(e) * 0.45) { hit = e; break; }
  }
  if (!hit && boss && state === 'boss' && Math.hypot(boss.x - aegisState.forceX, boss.y - aegisState.forceY) < AEGIS_FORCE_RADIUS + boss.def.w * 0.25) hit = boss;
  if (!hit) return;
  aegisState.forceHitT = 0.12;
  var dmg = 3.0 * powerDamageFactor() * (aegisState.force === 'detached' ? 1.25 : 0.8);
  if (hit === boss) { boss.hp -= dmg; boss.hitFlash = 0.1; boss.hitX = aegisState.forceX; boss.hitY = aegisState.forceY; }
  else {
    hit.hp -= dmg; hit.flash = 0.1;
    if (hit.hp <= 0) { score += ET[hit.type].score; enemyDeath(hit); maybeDrop(hit); removeEnemy(enemies.indexOf(hit)); }
  }
  if (typeof hitSpark === 'function') hitSpark(aegisState.forceX, aegisState.forceY, false, false);
}

function updateAegis(dt) {
  if (player.ship !== 'aegis') return;
  if (state !== 'play' && state !== 'boss') return;
  if (aegisTutorialT > 0) aegisTutorialT = Math.max(0, aegisTutorialT - dt);
  if (aegisState.cooldown > 0) aegisState.cooldown = Math.max(0, aegisState.cooldown - dt);
  if (aegisState.forceHitT > 0) aegisState.forceHitT = Math.max(0, aegisState.forceHitT - dt);

  if (aegisState.charge === 'charging') {
    aegisState.chargeT = Math.min(AEGIS_CHARGE_MAX, aegisState.chargeT + dt);
    aegisState.autoT = aegisState.chargeT >= AEGIS_CHARGE_MAX ? aegisState.autoT + dt : 0;
    if (aegisState.autoT >= AEGIS_AUTO_RELEASE) aegisReleaseCharge();
  }

  if (aegisState.force === 'broken') {
    aegisState.breakT -= dt;
    if (aegisState.breakT <= 0) { aegisState.force = 'attached'; aegisState.shield = 40; }
  } else if (aegisState.force === 'attached') {
    aegisState.forceX = player.x;
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
    aegisState.forceFireT -= dt;
    if (aegisState.forceFireT <= 0) {
      aegisState.forceFireT = 0.18;
      try { addShot(aegisState.forceX, aegisState.forceY - 8, 0, -930, 0.8 * powerDamageFactor(), false, false, false, false); } catch (e) {}
    }
  } else if (aegisState.force === 'detached') {
    aegisState.forceY -= 420 * dt;
    aegisForceDamage(dt);
    if (aegisState.forceY < -40) aegisState.force = 'returning';
  } else if (aegisState.force === 'returning') {
    var tx = player.x, ty = player.y - 42;
    aegisState.forceX += (tx - aegisState.forceX) * Math.min(1, dt * 12);
    aegisState.forceY += (ty - aegisState.forceY) * Math.min(1, dt * 12);
    aegisForceDamage(dt);
    if (Math.hypot(tx - aegisState.forceX, ty - aegisState.forceY) < 8) aegisState.force = 'attached';
  }
}

function aegisButtons() {
  return {
    charge: { x: W - 138, y: H - 78, r: 32 },
    bomb: { x: W - 64, y: H - 78, r: 38 },
    force: { x: W - 64, y: H - 170, r: 30 }
  };
}

function aegisButtonAt(p) {
  var b = aegisButtons();
  var list = ['charge', 'bomb', 'force'];
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
