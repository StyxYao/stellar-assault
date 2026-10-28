// Ship definitions and the AEGIS prototype state.
// R1 scope: sandbox mechanics only; no campaign rework.
var SHIP_DEFS = {
  vector: { id: 'vector', label: 'VECTOR', subtitle: 'BALANCED · WINGMAN', trait: 'FIREPOWER WINGMEN · FULL-SCREEN BOMB', stats: 'HP 3 · WINGMEN MAX 4 · BOMB DMG 200' },
  aegis: { id: 'aegis', label: 'AEGIS', subtitle: 'FORCE · CHARGE', trait: 'FORCE SHIELD · CHARGE CANNON', stats: 'SHIELD 60 · FORCE DMG 400 · CHARGE CANNON' },
  phantom: { id: 'phantom', label: 'PHANTOM', subtitle: 'CLOAK · CLONE', trait: 'STEALTH · DECOY CLONES', stats: 'CLOAK +50% · CLONE DMG 70% · HP 3→6 · CAP 2' }
};
var selectedShip = 'vector';
var SHIP_SKINS = {
  vector: [
    { id: 'void_lance', label: 'VOID LANCE', image: 'sk_vector_void_lance', ox: 3.5, oy: 2, maxHp: 3, extraBullets: 0, damageMult: 1, laserRate: [1, 1, 1, 1], trait: 'HP 3 · BASE · STANDARD FIRE' },
    { id: 'starfall', label: 'STARFALL WING', image: 'sk_vector_starfall', ox: 0.5, oy: 1, maxHp: 2, extraBullets: 1, damageMult: 1.2, laserRate: [1.5, 1.3333, 1.25, 1.2], trait: 'HP 2 · +1 SHOT · +20% DAMAGE' },
    { id: 'abyss', label: 'ABYSS BLADE', image: 'sk_vector_abyss', ox: 0.5, oy: 1, maxHp: 1, extraBullets: 2, damageMult: 1.4, laserRate: [2, 1.6667, 1.5, 1.4], trait: 'HP 1 · +2 SHOTS · +40% DAMAGE' }
  ],
  aegis: [
    { id: 'orbital', label: 'ORBITAL GUARDIAN', image: 'sk_aegis_orbital', ox: 3.5, oy: 2.5, shieldMult: 1, radiusMult: 1, chargeTimeMult: 1, chargeDamageMult: 1, trait: 'SHIELD 60 · STANDARD CHARGE' },
    { id: 'void_echo', label: 'VOID ECHO', image: 'sk_aegis_void_echo', ox: 1, oy: 0.5, shieldMult: 0.6, radiusMult: 0.6, chargeTimeMult: 1.2, chargeDamageMult: 1.6, trait: 'SHIELD -40% · CHARGE +20% · DMG +60%' },
    { id: 'temporal', label: 'TEMPORAL WANDERER', image: 'sk_aegis_temporal', ox: 0.5, oy: 1, shieldMult: 1.15, radiusMult: 1.15, chargeTimeMult: 0.7, chargeDamageMult: 0.8, postOdBuff: 0.3, trait: 'SHD +15% · CHG -30% · DMG -20% · OD-END +30%' }
  ],
  phantom: [
    { id: 'quantum', label: 'QUANTUM HUNTER', image: 'sk_phantom_quantum', maxHp: 3, cloakBuff: 0.5, cloneHp: 3, trait: 'CLOAK +50% · CLONE DMG 70% · HP 3→6 · CAP 2' },
    { id: 'raven', label: 'PHANTOM RAVEN', image: 'sk_phantom_raven', maxHp: 3, cloakBuff: 1.5, cloneHp: 3, trait: '4s CLOAK +150% · CLONE HP 3→6 · CAP 1' },
    { id: 'butterfly', label: 'PHANTOM BUTTERFLY', image: 'sk_phantom_butterfly', maxHp: 3, cloakBuff: 0.5, cloneHp: 3, trait: 'CLOAK +50% · CLONE HP 3→6 · CAP 4' }
  ]
};
var selectedSkins = { vector: 'void_lance', aegis: 'orbital', phantom: 'quantum' };
var aegisTutorialT = 0;

var AEGIS_CHARGE_MAX = 1.30;
var AEGIS_CHARGE_BASE_TIME = 0.5625;
var AEGIS_CHARGE_BASE_DAMAGE = 0.5625;
var AEGIS_AUTO_RELEASE = 0.35;
var AEGIS_CHARGE_COOLDOWN = 0.20;
var AEGIS_FORCE_RADIUS = 38;
var AEGIS_SHIELD_MAX = 60;
var AEGIS_SHIELD_HIT_RADIUS = 12;
var AEGIS_SHIELD_COST = 8;
var AEGIS_SHIELD_REGEN = 14;
var AEGIS_SHIELD_DELAY = 1.2;
var AEGIS_BREAK_TIME = 7.5;
var AEGIS_FORCE_DAMAGE = 400;
var AEGIS_FORCE_LANE_HALF = 38;

var AEGIS_CHARGE_PROFILES = {
  normal:  { kind: 'lance', count: 1, color: '#9fe8ff', range: 560 },
  spread:  { kind: 'fan', count: 5, color: '#ffb36b', range: 1200 },
  laser:   { kind: 'beam', count: 1, color: '#ff7ad5', range: 900 },
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
  castColor: '',
  castWidth: 0,
  nBurstLeft: 0,
  nBurstT: 0,
  nBurstDamage: 0,
  nBurstCount: 0,
  normalLockT: 0,
  forceLevel: 1,
  odActive: false,
  odShotT: 0,
  postOdT: 0,
  breakFlashT: 0,
  lowWarnT: 0,
  lowAlarmT: 0,
  forceHits: [],
  forceBossHit: false
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
function vectorLaserRate() {
  var d = currentSkinDef();
  if (!d || !d.laserRate) return 1;
  return d.laserRate[Math.max(0, Math.min(3, (player.specialPower || 1) - 1))] || 1;
}
function applyShipVariant() {
  var d = (typeof currentSkinDef === 'function') ? currentSkinDef() : null;
  player.maxHp = (d && d.maxHp) ? d.maxHp : 3;
  player.hp = player.maxHp;
  player.extraBullets = (d && d.extraBullets) ? d.extraBullets : 0;
  player.damageMult = (d && d.damageMult) ? d.damageMult : 1;
  player.normalBuff = 1;
}

function aegisVariant() { return (typeof currentSkinDef === 'function') ? currentSkinDef() : null; }
function aegisShieldMax() {
  var d = aegisVariant();
  return Math.round(AEGIS_SHIELD_MAX * (d && d.shieldMult ? d.shieldMult : 1));
}
function aegisShieldRatio() {
  return Math.max(0, Math.min(1, aegisState.shield / Math.max(1, aegisShieldMax())));
}
function aegisShieldRadius() {
  // 30% smaller than the 1.0 RC shield; the visual ring and collision use the same value.
  return Math.max(18, (18 + aegisForceRadius() * 0.55) * 0.70);
}
function aegisBlockBossBlast(x, y, blastR) {
  if (player.ship !== 'aegis' || aegisState.force === 'broken' || aegisState.shield <= 0) return false;
  var pr = aegisShieldRadius() + (blastR || 0) * 0.12;
  var nearPlayer = Math.hypot(player.x - x, player.y - y) < pr;
  var nearForce = aegisState.force !== 'attached' && Math.hypot(aegisState.forceX - x, aegisState.forceY - y) < aegisForceRadius() + (blastR || 0) * 0.12;
  if (!nearPlayer && !nearForce) return false;
  aegisState.shield = Math.max(0, aegisState.shield - AEGIS_SHIELD_COST);
  aegisState.lastBlockAt = time;
  aegisState.forceHitT = 0.18;
  try { if (typeof part === 'function') part(x, y, '#9fe8ff', 7, 130); } catch (e) {}
  try { sfx('b_hit', 0.20); } catch (e) {}
  if (aegisState.shield <= 0) {
    aegisState.shield = 0;
    aegisState.force = 'broken';
    aegisState.breakT = AEGIS_BREAK_TIME;
    aegisShieldBreak();
  }
  return true;
}

function aegisAbsorbHit() {
  if (player.ship !== 'aegis' || aegisState.force !== 'attached' || aegisState.shield <= 0) return false;
  aegisState.shield = Math.max(0, aegisState.shield - AEGIS_SHIELD_COST);
  aegisState.lastBlockAt = time;
  aegisState.forceHitT = 0.18;
  // Short grace prevents a single beam/body from draining the shield every frame.
  if (typeof player !== 'undefined') player.invuln = Math.max(player.invuln || 0, 0.18);
  try { if (typeof part === 'function') part(aegisState.forceX, aegisState.forceY, '#9fe8ff', 5, 110); } catch (e) {}
  try { sfx('b_hit', 0.18); } catch (e) {}
  if (aegisState.shield <= 0) {
    aegisState.shield = 0;
    aegisState.force = 'broken';
    aegisState.breakT = AEGIS_BREAK_TIME;
    aegisShieldBreak();
  }
  return true;
}

function aegisChargeMax() {
  var d = aegisVariant();
  return AEGIS_CHARGE_MAX * AEGIS_CHARGE_BASE_TIME * (d && d.chargeTimeMult ? d.chargeTimeMult : 1);
}
function aegisChargeDamageMult() {
  var d = aegisVariant();
  return d && d.chargeDamageMult ? d.chargeDamageMult : 1;
}
function aegisForceRadius() {
  var lv = Math.max(1, Math.min(4, aegisState.forceLevel || 1));
  // L1 is 40% smaller than before; L4 keeps the original max.
  var l1 = 38 * 0.60, l4 = 80;
  var base = l1 + (l4 - l1) * ((lv - 1) / 3);
  var d = aegisVariant();
  return base * (d && d.radiusMult ? d.radiusMult : 1);
}
function aegisForceColor() {
  return ['#9fe8ff', '#ffd36b', '#c98bff', '#ff8a66'][Math.max(0, Math.min(3, (aegisState.forceLevel || 1) - 1))];
}
function aegisForcePickup() {
  var maxShield = aegisShieldMax();
  aegisState.shield = Math.min(maxShield, aegisState.shield + 20);
  if (aegisState.forceLevel < 4) {
    aegisState.forceLevel++;
    score += 100;
    pickupMsg = 'FORCE RADIUS ' + aegisState.forceLevel + ' · SHIELD +20';
  } else {
    score += 150;
    gainOD(20);
    pickupMsg = 'FORCE OVERFLOW +150 / OD+20';
  }
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
  for (var pass = 0; pass < list.length; pass++) {
    idx = (idx + (delta || 1) + list.length) % list.length;
    if (typeof coopEnabled !== 'undefined' && coopEnabled && selectedShip === coopShip2 && list[idx].id === coopSkin2) continue;
    break;
  }
  setSelectedSkin(selectedShip, list[idx].id);
}
function initSelectedSkins() {
  try {
    var d = SaveStore.data.ships;
    if (d.vector && d.vector.skin) setSelectedSkin('vector', d.vector.skin, false);
    if (d.aegis && d.aegis.skin) setSelectedSkin('aegis', d.aegis.skin, false);
    if (d.phantom && d.phantom.skin) setSelectedSkin('phantom', d.phantom.skin, false);
  } catch (e) {}
}
function setSelectedShip(id, persist) {
  id = (id === 'aegis' || id === 'phantom') ? id : 'vector';
  selectedShip = id;
  // Ship choice is intentionally session-only. Each launch starts at VECTOR;
  // per-ship skins and best scores still persist.
  void persist;
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
  aegisState.shield = aegisShieldMax();
  aegisState.lastBlockAt = -999;
  aegisState.breakT = 0;
  aegisState.forceFireT = 0;
  aegisState.forceHitT = 0;
  aegisState.flashT = 0;
  aegisState.laneT = 0;
  aegisState.castT = 0;
  aegisState.castKind = '';
  aegisState.castWidth = 0;
  aegisState.nBurstLeft = 0;
  aegisState.nBurstT = 0;
  aegisState.normalLockT = 0;
  aegisState.odActive = false;
  aegisState.odShotT = 0;
  aegisState.postOdT = 0;
  aegisState.breakFlashT = 0;
  aegisState.lowWarnT = 0;
  aegisState.lowAlarmT = 0;
  aegisState.forceHits = [];
  aegisState.forceBossHit = false;
  if (typeof player !== 'undefined') {
    aegisState.forceX = aegisVisualX();
    aegisState.forceY = player.y;
  }
}

function aegisOnDeath() {
  aegisReset();
}

function aegisChargeLevel() {
  if (aegisState.chargeT < 0.35) return 0;
  return Math.max(1, Math.min(4, player.specialPower || 1));
}

function aegisProfile() {
  var base = AEGIS_CHARGE_PROFILES[player.weapon] || AEGIS_CHARGE_PROFILES.normal;
  var power = Math.max(1, Math.min(4, player.specialPower || 1));
  return {
    kind: base.kind,
    count: base.kind === 'fan' ? (3 + power * 2) * 2 : (base.kind === 'swarm' ? 10 : base.count),
    color: base.color,
    range: base.range,
    power: power
  };
}

function aegisGainCharge(percent) {
  var add = Math.max(0, Math.min(100, percent)) / 100 * aegisChargeMax();
  if (aegisState.charge === 'charging') aegisState.chargeT = Math.min(aegisChargeMax(), aegisState.chargeT + add);
  else aegisState.chargeBonus = Math.min(aegisChargeMax(), aegisState.chargeBonus + add);
}

function aegisTapCharge() {
  if (state !== 'play' && state !== 'boss') return;
  if (player.odT > 0) return;
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

function aegisBeamCharge(px, rawDamage, halfWidth) {
  var dmg = rawDamage * powerDamageFactor();
  if (typeof enemies !== 'undefined' && enemies) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.y > player.y + 16) continue;
      if (Math.abs(e.x - px) > halfWidth + enemyW(e) * 0.30) continue;
      e.hp -= dmg; e.flash = 0.16;
      if (typeof hitSpark === 'function') hitSpark(e.x, e.y, false, false);
      if (e.hp <= 0) {
        score += ET[e.type].score;
        enemyDeath(e); maybeDrop(e); removeEnemy(i);
      }
    }
  }
  if (boss && state === 'boss' && boss.y < player.y + 16 && Math.abs(boss.x - px) < halfWidth + boss.def.w * 0.20) {
    boss.hp -= dmg;
    boss.hitFlash = 0.24; boss.hitX = px; boss.hitY = Math.max(40, boss.y);
    if (typeof hitSpark === 'function') hitSpark(boss.x, boss.y, false, true);
  }
}

function aegisReleaseCharge() {
  var level = aegisChargeLevel();
  if (level <= 0) return;
  var prof = aegisProfile();
  // Damage the stopped normal weapon would have dealt over this charge,
  // then apply the requested 1.35x charge bonus.
  var chargeTime = Math.max(0.35, aegisState.chargeT);
  var totalDamage = aegisNormalDps() * chargeTime * 1.35 * AEGIS_CHARGE_BASE_DAMAGE * aegisChargeDamageMult() / (player.normalBuff || 1);
  var px = aegisVisualX(), py = player.y - 26;
  if (prof.kind === 'fan') {
    var perFan = totalDamage / prof.count;
    for (var i = 0; i < prof.count; i++) {
      var a = (i - (prof.count - 1) / 2) * 0.0475;
      addShot(px, py, Math.sin(a) * 900, -Math.cos(a) * 900, perFan, false, false, true, prof.power >= 4, prof.range);
      var sf = shots[shots.length - 1]; if (sf) { sf.lenScale = 1.5; sf.widScale = 1.2; sf.chargeLevel = player.specialPower; }
    }
  } else if (prof.kind === 'beam') {
    var beamHalf = 28 + (Math.max(1, player.specialPower) - 1) * 4;
    aegisState.castWidth = beamHalf;
    aegisBeamCharge(px, totalDamage, beamHalf);
  } else if (prof.kind === 'swarm') {
    var perMissile = totalDamage / 10;
    for (var m = 0; m < 10; m++) {
      var mx = 40 + (W - 80) * (m / 9);
      spawnMissile(mx, player.y - 18, false, perMissile, true, 0, -190, prof.range);
      var mm = missiles[missiles.length - 1]; if (mm) { mm.lenScale = 1.5; mm.widScale = 1.0; mm.noWiden = true; mm.chargeLevel = player.specialPower; }
    }
  } else {
    // N: three sequential volleys; total charge damage is split across all bursts.
    var lvN = Math.max(1, Math.min(4, player.specialPower || 1));
    var baseN = lvN <= 1 ? 2 : (lvN === 2 ? 3 : (lvN === 3 ? 4 : 5));
    aegisState.nBurstLeft = 3;
    aegisState.nBurstT = 0;
    aegisState.nBurstDamage = totalDamage / 3;
    aegisState.nBurstCount = baseN * 2;
  }
  if (typeof fx !== 'undefined' && fx) fx.push({ x: px, y: py, t: 0, life: 0.32, kind: 'hitspark', sc: 3.4, color: prof.color });
  aegisState.flashT = Math.max(aegisState.flashT, 0.50);
  aegisState.laneT = 0;
  if (aegisState.nBurstLeft > 0) {
    aegisState.castT = 0.12;
    aegisState.castKind = '';
    aegisState.castWidth = 0;
  } else {
    aegisState.castT = 0.55;
    aegisState.castKind = prof.kind;
  }
  aegisState.castRange = prof.range || 500;
  aegisState.castColor = prof.color;
  try { shake = Math.max(shake, 9); } catch (e) {}
  aegisState.charge = 'idle';
  aegisState.chargeT = 0;
  aegisState.autoT = 0;
  aegisState.cooldown = AEGIS_CHARGE_COOLDOWN;
  if (aegisState.nBurstLeft <= 0) try { sfx('aegis_cannon', 0.62); } catch (e) {}
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
  if (typeof orbBullets !== 'undefined' && orbBullets) {
    for (var bo = orbBullets.length - 1; bo >= 0; bo--) {
      var ob = orbBullets[bo];
      var ox = ob.owner ? ob.owner.x + Math.cos(ob.ang) * ob.r : 0;
      var oy = ob.owner ? ob.owner.y + Math.sin(ob.ang) * ob.r : 0;
      if (oy < player.y + 14 && oy > -30 && Math.abs(ox - px) < lane + 7) {
        if (typeof part === 'function') part(ox, oy, '#ffd36b', 1, 130);
        orbBullets.splice(bo, 1);
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
    if (typeof part === 'function') part(px + (vrng() - 0.5) * lane * 1.7, player.y - vrng() * (player.y - 40), '#ffd36b', 1, 240);
  }
}

function aegisRestoreForce() {
  if (aegisState.force !== 'broken' || player.bombs <= 0) return false;
  player.bombs--;
  aegisState.force = 'attached';
  aegisState.shield = aegisShieldMax();
  aegisState.breakT = 0;
  aegisState.breakFlashT = 0;
  aegisState.lowWarnT = 0;
  if (typeof player !== 'undefined') { player.invuln = Math.max(player.invuln || 0, 1.5); player.noBlink = false; }
  aegisState.forceX = aegisVisualX();
  aegisState.forceY = player.y;
  try { sfx('aegis_force', 0.65); } catch (e) {}
  try { sfx('b_charge', 0.35); } catch (e) {}
  try { if (typeof part === 'function') for (var i = 0; i < 18; i++) part(aegisState.forceX, aegisState.forceY, i % 2 ? '#ffd36b' : '#9fe8ff', 1, 180); } catch (e) {}
  return true;
}

function aegisLaunchForce() {
  if (state !== 'play' && state !== 'boss') return false;
  if (aegisState.force !== 'attached' || player.bombs <= 0) return false;
  player.bombs--;
  if (aegisState.charge === 'charging') { aegisState.charge = 'idle'; aegisState.chargeT = 0; }
  aegisState.force = 'detached';
  aegisState.forceX = aegisVisualX();
  aegisState.forceY = player.y;
  aegisState.flashT = 0.55;
  aegisState.laneT = 0;
  aegisState.castT = 0;
  aegisState.castKind = '';
  aegisState.forceHits = [];
  aegisState.forceBossHit = false;
  aegisLaneHit();
  try { shake = Math.max(shake, 12); } catch (e) {}
  try { sfx('aegis_force', 0.72); } catch (e) {}
  return true;
}

function aegisTapForce() {
  if (state !== 'play' && state !== 'boss') return;
  if (aegisState.force === 'broken') { aegisRestoreForce(); return; }
  if (aegisState.force === 'attached') {
    aegisLaunchForce();
  } else if (aegisState.force === 'detached') {
    aegisState.force = 'returning';
    try { sfx('e_charge', 0.18); } catch (e) {}
  }
}

function aegisAutoChargedAttack() {
  var lv = Math.max(1, Math.min(4, player.specialPower || 1));
  var baseT = lv <= 1 ? 0.35 : (lv === 2 ? 0.80 : 1.30);
  var scale = aegisChargeMax() / AEGIS_CHARGE_MAX;
  aegisState.chargeT = Math.max(0.36, baseT * scale);
  aegisReleaseCharge();
  aegisState.cooldown = 0;
}

function aegisShieldBreak() {
  aegisState.breakFlashT = 0.55;
  aegisState.lowWarnT = 0;
  if (typeof player !== 'undefined') { player.invuln = Math.max(player.invuln || 0, 1.2); player.noBlink = false; }
  try { shake = Math.max(shake, 18); } catch (e) {}
  try { if (typeof playAegisBreak === 'function') playAegisBreak(); else sfx('bomb_big', 0.58); } catch (e) {}
  try { if (typeof part === 'function') for (var i = 0; i < 26; i++) part(aegisState.forceX, aegisState.forceY, i % 2 ? '#ffd36b' : '#ff7a4d', 1, 240); } catch (e) {}
  try { if (typeof boom === 'function') boom(aegisState.forceX, aegisState.forceY, 0.75); } catch (e) {}
}

function aegisForceCollide(dt) {
  if (aegisState.force !== 'detached') return;
  var fx = aegisState.forceX, fy = aegisState.forceY, rad = aegisForceRadius() + 30;
  // The Force clears bullets it physically passes through.
  if (typeof ebullets !== 'undefined' && ebullets) {
    for (var bi = ebullets.length - 1; bi >= 0; bi--) {
      var b = ebullets[bi];
      if (Math.hypot(b.x - fx, b.y - fy) < rad + 5) {
        if (typeof part === 'function') part(b.x, b.y, aegisForceColor(), 1, 130);
        ebullets.splice(bi, 1);
      }
    }
  }
  if (typeof orbBullets !== 'undefined' && orbBullets) {
    for (var oi = orbBullets.length - 1; oi >= 0; oi--) {
      var ob = orbBullets[oi];
      var ox = ob.owner ? ob.owner.x + Math.cos(ob.ang) * ob.r : 0;
      var oy = ob.owner ? ob.owner.y + Math.sin(ob.ang) * ob.r : 0;
      if (Math.hypot(ox - fx, oy - fy) < rad + (ob.rad || 6)) {
        if (typeof part === 'function') part(ox, oy, aegisForceColor(), 4, 150);
        orbBullets.splice(oi, 1);
      }
    }
  }
  var hitAny = false;
  if (typeof enemies !== 'undefined' && enemies) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (aegisState.forceHits.indexOf(e) >= 0) continue;
      if (Math.hypot(e.x - fx, e.y - fy) > rad + enemyW(e) * 0.35) continue;
      aegisState.forceHits.push(e);
      e.hp -= AEGIS_FORCE_DAMAGE; e.flash = 0.18;
      hitAny = true;
      if (typeof hitSpark === 'function') hitSpark(e.x, e.y, false, false);
      if (typeof part === 'function') part(e.x, e.y, aegisForceColor(), 8, 180);
      try { sfx('b_hit', 0.25); } catch (err) {}
      if (e.hp <= 0) {
        score += ET[e.type].score;
        enemyDeath(e); maybeDrop(e); removeEnemy(i); i--;
      }
    }
  }
  if (!aegisState.forceBossHit && boss && state === 'boss' && Math.hypot(boss.x - fx, boss.y - fy) < rad + boss.def.w * 0.28) {
    aegisState.forceBossHit = true;
    boss.hp -= AEGIS_FORCE_DAMAGE; boss.hitFlash = 0.22; boss.hitX = fx; boss.hitY = fy;
    hitAny = true;
    try { sfx('b_hit', 0.35); } catch (err) {}
    if (typeof hitSpark === 'function') hitSpark(boss.x, boss.y, false, true);
  }
  if (hitAny) {
    try { shake = Math.max(shake, 8); } catch (err) {}
    try { if (typeof boom === 'function') boom(fx, fy, 0.55); } catch (err) {}
  }
}

function aegisFireNBurst() {
  var px = aegisVisualX(), py = player.y - 26;
  var count = Math.max(2, aegisState.nBurstCount || 4);
  var dmg = (aegisState.nBurstDamage || 0) / count;
  for (var n = 0; n < count; n++) {
    addShot(px + (n - (count - 1) / 2) * 10, py, 0, -1150, dmg, false, false, true, true, 760);
    var sn = shots[shots.length - 1];
    if (sn) { sn.lenScale = 1.5; sn.widScale = 1.2; sn.chargeLevel = player.specialPower; sn.aegisBlue = true; }
  }
  try { sfx('aegis_cannon', 0.62); } catch (e) {}
}

function updateAegis(dt) {
  if (player.ship !== 'aegis') return;
  if (state !== 'play' && state !== 'boss') return;
  if (aegisTutorialT > 0) aegisTutorialT = Math.max(0, aegisTutorialT - dt);
  if (aegisState.cooldown > 0) aegisState.cooldown = Math.max(0, aegisState.cooldown - dt);
  if (aegisState.forceHitT > 0) aegisState.forceHitT = Math.max(0, aegisState.forceHitT - dt);
  if (aegisState.normalLockT > 0) aegisState.normalLockT = Math.max(0, aegisState.normalLockT - dt);
  if (aegisState.flashT > 0) aegisState.flashT = Math.max(0, aegisState.flashT - dt);
  if (aegisState.laneT > 0) aegisState.laneT = Math.max(0, aegisState.laneT - dt);
  if (aegisState.castT > 0) aegisState.castT = Math.max(0, aegisState.castT - dt);
  // OD: auto-fire charged attacks at the current weapon level, 0.5s cadence.
  if (player.odT > 0) {
    if (!aegisState.odActive) { aegisState.odActive = true; aegisState.odShotT = 0; }
    aegisState.odShotT -= dt;
    if (aegisState.odShotT <= 0) {
      aegisState.odShotT = 0.5;
      aegisAutoChargedAttack();
    }
  } else if (aegisState.odActive) {
    aegisState.odActive = false;
    var av = aegisVariant();
    if (av && av.postOdBuff) aegisState.postOdT = 2.0;
  }
  if (aegisState.breakFlashT > 0) aegisState.breakFlashT = Math.max(0, aegisState.breakFlashT - dt);
  if (aegisState.lowWarnT > 0) aegisState.lowWarnT = Math.max(0, aegisState.lowWarnT - dt);
  if (aegisState.postOdT > 0) {
    aegisState.postOdT = Math.max(0, aegisState.postOdT - dt);
    var av2 = aegisVariant();
    player.normalBuff = 1 + ((av2 && av2.postOdBuff) ? av2.postOdBuff : 0);
  } else {
    player.normalBuff = 1;
  }

  if (aegisState.charge === 'charging') {
    aegisState.chargeT = Math.min(aegisChargeMax(), aegisState.chargeT + dt);
    aegisState.autoT = aegisState.chargeT >= aegisChargeMax() ? aegisState.autoT + dt : 0;
    if (aegisState.autoT >= AEGIS_AUTO_RELEASE) aegisReleaseCharge();
  }
  if (aegisState.nBurstLeft > 0) {
    aegisState.nBurstT -= dt;
    if (aegisState.nBurstT <= 0) {
      aegisState.nBurstLeft--;
      aegisState.nBurstT = 0.03;
      if (aegisState.nBurstLeft === 0) aegisState.normalLockT = 0.2;
      aegisFireNBurst();
    }
  }

  if (aegisState.force === 'broken') {
    aegisState.breakT -= dt;
    if (aegisState.breakT <= 0) {
      aegisState.force = 'attached';
      aegisState.shield = Math.max(20, Math.round(aegisShieldMax() * 0.5));
      aegisState.lowWarnT = 0;
      if (typeof player !== 'undefined') { player.invuln = Math.max(player.invuln || 0, 1.2); player.noBlink = false; }
    }
  } else if (aegisState.force === 'attached') {
    aegisState.forceX = aegisVisualX();
    aegisState.forceY = player.y;
    if (aegisState.shield < aegisShieldMax() && time - aegisState.lastBlockAt > AEGIS_SHIELD_DELAY) aegisState.shield = Math.min(aegisShieldMax(), aegisState.shield + AEGIS_SHIELD_REGEN * dt);
    if (aegisShieldRatio() <= 0.12) {
      if (aegisState.lowWarnT <= 0) { aegisState.lowWarnT = 3.0; try { if (typeof playAegisWarning === 'function') playAegisWarning(0.55); else sfx('alarm', 0.42); } catch (e) {} }
    } else if (aegisShieldRatio() > 0.22) {
      aegisState.lowWarnT = 0;
    }
    if (ebullets) {
      for (var i = ebullets.length - 1; i >= 0; i--) {
        var b = ebullets[i];
        if (Math.hypot(b.x - aegisState.forceX, b.y - aegisState.forceY) < aegisShieldRadius()) {
          ebullets.splice(i, 1);
          aegisState.shield -= AEGIS_SHIELD_COST;
          aegisState.lastBlockAt = time;
          if (typeof part === 'function') part(aegisState.forceX, aegisState.forceY, '#9fe8ff', 2, 80);
          if (aegisState.shield <= 0) { aegisState.shield = 0; aegisState.force = 'broken'; aegisState.breakT = AEGIS_BREAK_TIME; aegisShieldBreak(); break; }
        }
      }
    }
    if (typeof orbBullets !== 'undefined' && orbBullets) {
      for (var oi = orbBullets.length - 1; oi >= 0; oi--) {
        var ob = orbBullets[oi];
        var ox = ob.owner ? ob.owner.x + Math.cos(ob.ang) * ob.r : 0;
        var oy = ob.owner ? ob.owner.y + Math.sin(ob.ang) * ob.r : 0;
        if (Math.hypot(ox - aegisState.forceX, oy - aegisState.forceY) < aegisShieldRadius()) {
          orbBullets.splice(oi, 1);
          aegisState.shield = Math.max(0, aegisState.shield - AEGIS_SHIELD_COST);
          aegisState.lastBlockAt = time;
          if (typeof part === 'function') part(ox, oy, '#9fe8ff', 2, 80);
          if (aegisState.shield <= 0) { aegisState.shield = 0; aegisState.force = 'broken'; aegisState.breakT = AEGIS_BREAK_TIME; aegisShieldBreak(); break; }
        }
      }
    }
  } else if (aegisState.force === 'detached') {
    aegisState.forceY -= 420 * dt;
    aegisForceCollide(dt);
    if (aegisState.forceY < -40) aegisState.force = 'returning';
  } else if (aegisState.force === 'returning') {
    var tx = aegisVisualX(), ty = player.y;
    var rdx = tx - aegisState.forceX, rdy = ty - aegisState.forceY;
    var rd = Math.hypot(rdx, rdy);
    if (rd > 0.01) {
      var rstep = Math.min(rd, 420 * dt);
      aegisState.forceX += rdx / rd * rstep;
      aegisState.forceY += rdy / rd * rstep;
    }
    if (rd < 8) aegisState.force = 'attached';
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
