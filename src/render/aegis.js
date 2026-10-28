// AEGIS Force, charge ring and touch controls.
function aegisWeaponColor() {
  if (player.weapon === 'spread') return '#ffb36b';
  if (player.weapon === 'laser') return '#ff7ad5';
  if (player.weapon === 'missile') return '#ffd36b';
  return '#9fe8ff';
}

function aegisSkinAccent() {
  var def = (typeof currentSkinDef === 'function') ? currentSkinDef() : null;
  var id = def ? def.id : 'orbital';
  if (id === 'void_echo') return '#c98bff';
  if (id === 'temporal') return '#ffe08a';
  return '#ffb347';
}
function drawForceField(x, y, size, alpha, spin, color) {
  var lvl = Math.max(1, Math.min(4, aegisState.forceLevel || 1));
  var img = (typeof GIMG !== 'undefined') ? (GIMG['aegis_field' + lvl] || GIMG.aegis_field) : null;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(spin || 0);
  ctx.globalCompositeOperation = 'lighter';
  if (img && img.complete) {
    ctx.globalAlpha = alpha * 0.64;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffcf6b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.42, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, size * 0.30, 0, TAU); ctx.stroke();
  }
  if (color) { ctx.globalAlpha = Math.min(1, alpha + 0.15) * 0.64; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, size * 0.42, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

function drawAegisForceUnderlay() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var attached = aegisState.force === 'attached';
  var fx0 = (attached && typeof aegisCoreX === 'function') ? aegisCoreX() : aegisState.forceX;
  var fy0 = attached ? player.y : aegisState.forceY;
  var shieldRatio = aegisShieldRatio();
  ctx.save();

  if (aegisState.force === 'broken') {
    fx0 = player.x; fy0 = player.y;
    ctx.globalCompositeOperation = 'lighter';
    var brk = 0.45 + 0.3 * Math.sin(time * 18);
    ctx.globalAlpha = brk;
    ctx.strokeStyle = '#ff5f4d'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(fx0, fy0, 38 + 6 * Math.sin(time * 9), 0.2, 2.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx0, fy0, 52 + 8 * Math.sin(time * 7 + 1), 3.1, 5.7); ctx.stroke();
    ctx.fillStyle = '#ff7a4d';
    for (var bi = 0; bi < 6; bi++) {
      var ba = time * 1.8 + bi * TAU / 6;
      ctx.beginPath(); ctx.arc(fx0 + Math.cos(ba) * (40 + bi * 3), fy0 + Math.sin(ba) * (40 + bi * 3), 2.2, 0, TAU); ctx.fill();
    }
  } else if (aegisState.force === 'attached') {
    drawForceField(fx0, fy0, aegisShieldRadius(), 0.42 + shieldRatio * 0.34, 0, aegisForceColor());
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.52;
    var core = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, 22);
    core.addColorStop(0, 'rgba(255,255,245,0.82)');
    core.addColorStop(0.35, 'rgba(255,196,78,0.42)');
    core.addColorStop(1, 'rgba(255,130,20,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(fx0, fy0, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = aegisForceColor(); ctx.globalAlpha = 0.58; ctx.beginPath(); ctx.arc(fx0, fy0, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff5cf'; ctx.globalAlpha = 0.72; ctx.beginPath(); ctx.arc(fx0, fy0, 3, 0, TAU); ctx.fill();
  } else if (aegisState.force === 'detached' || aegisState.force === 'returning') {
    if (aegisState.force === 'detached') {
      var tg = ctx.createLinearGradient(fx0, fy0, fx0, fy0 + 110);
      tg.addColorStop(0, 'rgba(255,211,107,0.26)');
      tg.addColorStop(1, 'rgba(255,150,30,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.78; ctx.fillStyle = tg;
      ctx.fillRect(fx0 - 8, fy0, 16, 110);
    }
    drawForceField(fx0, fy0, aegisForceRadius() * 1.25 + 16, aegisState.force === 'detached' ? 0.9 : 0.6, 0, aegisForceColor());
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(fx0, fy0, 6, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawAegisShipFx() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var fx0 = (aegisState.force === 'attached' && typeof aegisVisualX === 'function') ? aegisVisualX() : (aegisState.force === 'broken' ? player.x : aegisState.forceX), fy0 = (aegisState.force === 'broken' ? player.y : aegisState.forceY);
  var shipX = (typeof aegisVisualX === 'function') ? aegisVisualX() : player.x;
  var col = aegisWeaponColor();
  var shieldRatio = Math.max(0, Math.min(1, aegisState.shield / aegisShieldMax()));
  ctx.save();

  // Distinct charge release shapes: lance / fan / beam / swarm / Force lane.
  if (aegisState.castT > 0) {
    var ca = aegisState.castT / 0.55;
    var cr = Math.min(player.y, aegisState.castRange || 500);
    var topY = Math.max(0, player.y - cr);
    var cc = aegisState.castColor || col;
    ctx.globalCompositeOperation = 'lighter';
    if (aegisState.castKind === 'fan') {
      var half = 0.34, spreadW = Math.tan(half) * cr;
      var fg = ctx.createLinearGradient(shipX, player.y, shipX, topY);
      fg.addColorStop(0, 'rgba(255,190,90,' + (0.34 * ca) + ')');
      fg.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = fg; ctx.beginPath();
      ctx.moveTo(shipX, player.y); ctx.lineTo(shipX - spreadW, topY);
      ctx.lineTo(shipX + spreadW, topY); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.7 * ca; ctx.strokeStyle = cc; ctx.lineWidth = 2;
      for (var fi = 0; fi < 7; fi++) {
        var fa = (fi - 3) * 0.095;
        ctx.beginPath(); ctx.moveTo(shipX, player.y - 10);
        ctx.lineTo(shipX + Math.sin(fa) * cr, topY); ctx.stroke();
      }
    } else if (aegisState.castKind === 'beam') {
      var bw = aegisState.castWidth || 34;
      var bg = ctx.createLinearGradient(shipX - bw, 0, shipX + bw, 0);
      bg.addColorStop(0, 'rgba(255,90,200,0)');
      bg.addColorStop(0.35, 'rgba(255,110,220,' + (0.55 * ca) + ')');
      bg.addColorStop(0.5, 'rgba(255,255,240,' + (0.95 * ca) + ')');
      bg.addColorStop(0.65, 'rgba(255,110,220,' + (0.55 * ca) + ')');
      bg.addColorStop(1, 'rgba(255,90,200,0)');
      ctx.fillStyle = bg; ctx.fillRect(shipX - bw, topY, bw * 2, cr);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * ca) + ')';
      ctx.fillRect(shipX - 2.5, topY, 5, cr);
    } else if (aegisState.castKind === 'force') {
      var lane = AEGIS_FORCE_LANE_HALF;
      var lg = ctx.createLinearGradient(shipX - lane, 0, shipX + lane, 0);
      lg.addColorStop(0, 'rgba(255,180,60,0)');
      lg.addColorStop(0.5, 'rgba(255,245,210,' + (0.55 * ca) + ')');
      lg.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = lg; ctx.fillRect(shipX - lane, 0, lane * 2, player.y);
      ctx.fillStyle = 'rgba(255,255,230,' + (0.9 * ca) + ')';
      ctx.fillRect(shipX - 4, 0, 8, player.y);
    } else {
      // N: short lance muzzle flash; the actual projectiles are already fired.
      var mz = ctx.createLinearGradient(shipX, player.y - 90, shipX, player.y);
      mz.addColorStop(0, 'rgba(120,240,255,0)');
      mz.addColorStop(0.55, 'rgba(160,250,255,' + (0.34 * ca) + ')');
      mz.addColorStop(1, 'rgba(255,255,255,' + (0.62 * ca) + ')');
      ctx.fillStyle = mz; ctx.fillRect(shipX - 9, Math.max(0, player.y - 90), 18, 90);
    }
  }

  // Charging: a large, bright convergence ring around the ship.
  if (aegisState.charge === 'charging') {
    var ratio = Math.min(1, aegisState.chargeT / aegisChargeMax());
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.52 + 0.22 * Math.sin(time * 14);
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(shipX, player.y - 4, 42 + ratio * 18, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.25 + ratio * 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(shipX, player.y - 4, 32 + ratio * 10, 0, TAU); ctx.stroke();
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + i * TAU / 6 + time * 0.5;
      var rr = 48 + ratio * 10;
      ctx.globalAlpha = 0.35 + ratio * 0.55;
      ctx.fillStyle = i < Math.ceil(ratio * 6) ? col : '#6b7b8c';
      ctx.beginPath(); ctx.arc(shipX + Math.cos(a) * rr, player.y - 4 + Math.sin(a) * rr, 2.8, 0, TAU); ctx.fill();
    }
    var cg = ctx.createRadialGradient(shipX, player.y - 4, 0, shipX, player.y - 4, 46);
    cg.addColorStop(0, 'rgba(255,246,210,' + (0.18 + ratio * 0.28) + ')');
    cg.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(shipX, player.y - 4, 46, 0, TAU); ctx.fill();
  }

  // Release flash.
  if (aegisState.flashT > 0) {
    var fa = aegisState.flashT / 0.55;
    ctx.globalCompositeOperation = 'lighter';
    var fg = ctx.createRadialGradient(shipX, player.y - 12, 0, shipX, player.y - 12, 92);
    fg.addColorStop(0, 'rgba(255,255,240,' + (0.5 * fa) + ')');
    fg.addColorStop(0.4, 'rgba(255,200,80,' + (0.28 * fa) + ')');
    fg.addColorStop(1, 'rgba(255,120,20,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(shipX, player.y - 12, 92, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.8 * fa; ctx.strokeStyle = '#fff2c4'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(shipX, player.y - 12, 35 + (1 - fa) * 55, 0, TAU); ctx.stroke();
  }

  if (aegisState.breakFlashT > 0) {
    var ba = aegisState.breakFlashT / 0.55;
    ctx.globalCompositeOperation = 'lighter';
    var bfg = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, 90);
    bfg.addColorStop(0, 'rgba(255,255,230,' + (0.5 * ba) + ')');
    bfg.addColorStop(0.35, 'rgba(255,140,50,' + (0.35 * ba) + ')');
    bfg.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = bfg;
    ctx.beginPath(); ctx.arc(fx0, fy0, 90, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9 * ba; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(fx0, fy0, 28 + (1 - ba) * 58, 0, TAU); ctx.stroke();
  }
  drawAegisShieldMeter();
  if (player.hitFlashT > 0) {
    var hf = Math.min(1, player.hitFlashT / 0.22);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = hf;
    ctx.strokeStyle = '#ff7a66'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(shipX, player.y, 34 + (1 - hf) * 12, 0, TAU); ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawAegisShieldMeter() {
  var ratio = aegisShieldRatio();
  var broken = aegisState.force === 'broken';
  var low = !broken && (ratio <= 0.12 || aegisState.lowWarnT > 0);
  var w = 48, h = 5;
  var x = aegisVisualX() - w / 2, y = player.y + 43;
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(2,10,18,0.86)'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = 'rgba(80,105,125,0.48)'; ctx.fillRect(x, y, w, h);
  if (broken) {
    ctx.fillStyle = Math.floor(time * 8) % 2 ? '#ff5f4d' : '#7d211c';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffb0a0'; ctx.font = '700 7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('FORCE BROKEN · ' + Math.max(0, Math.ceil(aegisState.breakT)) + 's', x + w / 2, y - 6);
  } else {
    var col = ratio > 0.35 ? '#8fe9ff' : (ratio > 0.10 ? '#ffd36b' : '#ff6a5a');
    ctx.fillStyle = col; ctx.fillRect(x, y, w * ratio, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x + w * 0.10 - 1, y - 2, 1, h + 4);
    if (low) {
      var lf = 0.55 + 0.45 * Math.sin(time * 14);
      ctx.fillStyle = 'rgba(255,70,60,' + lf + ')';
      ctx.font = '700 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('LOW SHIELD · ' + Math.round(ratio * 100) + '%', x + w / 2, y - 6);
    }
  }
  ctx.restore(); ctx.textAlign = 'left';
}

function drawAegisControls() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var b = aegisButtons();
  var col = aegisWeaponColor();
  // CHARGE
  var c = b.charge;
  var ratio = Math.min(1, aegisState.chargeT / aegisChargeMax());
  var ready = aegisState.charge !== 'idle' || aegisState.chargeBonus > 0;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = ready ? 'rgba(8,30,44,0.92)' : 'rgba(6,14,24,0.82)';
  ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = aegisState.charge === 'charging' ? 3 : 1.8;
  ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.stroke();
  if (aegisState.charge === 'charging') {
    ctx.globalAlpha = 0.95; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r - 5, -Math.PI / 2, -Math.PI / 2 + TAU * ratio); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.font = '700 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('CHG', c.x, c.y + 2);
  ctx.font = '7px monospace'; ctx.fillStyle = '#cfe8f5';
  ctx.fillText(aegisState.charge === 'charging' ? ('LV' + aegisChargeLevel()) : 'TAP', c.x, c.y + 14);
  // FORCE = shield / bomb
  var f = b.force;
  var forceReady = aegisState.force === 'attached' && player.bombs > 0;
  ctx.fillStyle = aegisState.force === 'broken' ? 'rgba(30,10,10,0.9)' : 'rgba(8,30,44,0.9)';
  ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = aegisState.force === 'broken' ? '#ff6a5a' : (forceReady ? '#ffd36b' : '#9fe8ff');
  ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#eaf8ff'; ctx.font = '700 9px monospace'; ctx.textAlign = 'center';
  var forceLabel = aegisState.force === 'attached' ? (forceReady ? 'FORCE' : 'EMPTY') : (aegisState.force === 'detached' ? 'RECALL' : (aegisState.force === 'returning' ? 'RETURN' : (player.bombs > 0 ? 'RESTORE' : 'BROKEN')));
  ctx.fillText(forceLabel, f.x, f.y - 3);
  ctx.fillStyle = '#ffd36b'; ctx.font = '700 9px monospace';
  ctx.fillText('x' + player.bombs, f.x, f.y + 9);
  ctx.fillStyle = '#9fe8ff'; ctx.font = '7px monospace';
  ctx.fillText(Math.round(aegisState.shield / aegisShieldMax() * 100) + '% · R' + (aegisState.forceLevel || 1), f.x, f.y + 20);
  ctx.textAlign = 'left'; ctx.restore(); ctx.globalAlpha = 1;
  if (typeof aegisTutorialT !== 'undefined' && aegisTutorialT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, aegisTutorialT / 1.2);
    ctx.fillStyle = 'rgba(2,10,20,0.68)';
    ctx.fillRect(30, H - 260, W - 60, 66);
    ctx.strokeStyle = 'rgba(159,232,255,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(30, H - 260, W - 60, 66);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px Orbitron, Arial, sans-serif';
    ctx.fillText('AEGIS · TAP CHG TO CHARGE', W / 2, H - 238);
    ctx.fillStyle = '#9fe8ff'; ctx.font = '12px Rajdhani, Arial, sans-serif';
    ctx.fillText('TAP FORCE · LAUNCH / RECALL', W / 2, H - 218);
    ctx.textAlign = 'left'; ctx.restore(); ctx.globalAlpha = 1;
  }
}
