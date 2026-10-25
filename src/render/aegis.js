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
function drawForceField(x, y, size, alpha, spin) {
  var img = (typeof GIMG !== 'undefined') ? GIMG.aegis_field : null;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (img && img.complete) {
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(spin || 0);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffcf6b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, size * 0.42, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, size * 0.30, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function drawAegisShipFx() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var fx0 = aegisState.forceX, fy0 = aegisState.forceY;
  var col = aegisWeaponColor();
  var shieldRatio = Math.max(0, Math.min(1, aegisState.shield / AEGIS_SHIELD_MAX));
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
      var fg = ctx.createLinearGradient(fx0, player.y, fx0, topY);
      fg.addColorStop(0, 'rgba(255,190,90,' + (0.34 * ca) + ')');
      fg.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = fg; ctx.beginPath();
      ctx.moveTo(fx0, player.y); ctx.lineTo(fx0 - spreadW, topY);
      ctx.lineTo(fx0 + spreadW, topY); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.7 * ca; ctx.strokeStyle = cc; ctx.lineWidth = 2;
      for (var fi = 0; fi < 7; fi++) {
        var fa = (fi - 3) * 0.095;
        ctx.beginPath(); ctx.moveTo(fx0, player.y - 10);
        ctx.lineTo(fx0 + Math.sin(fa) * cr, topY); ctx.stroke();
      }
    } else if (aegisState.castKind === 'beam') {
      var bw = 18;
      var bg = ctx.createLinearGradient(fx0 - bw, 0, fx0 + bw, 0);
      bg.addColorStop(0, 'rgba(255,90,200,0)');
      bg.addColorStop(0.35, 'rgba(255,110,220,' + (0.55 * ca) + ')');
      bg.addColorStop(0.5, 'rgba(255,255,240,' + (0.95 * ca) + ')');
      bg.addColorStop(0.65, 'rgba(255,110,220,' + (0.55 * ca) + ')');
      bg.addColorStop(1, 'rgba(255,90,200,0)');
      ctx.fillStyle = bg; ctx.fillRect(fx0 - bw, topY, bw * 2, cr);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * ca) + ')';
      ctx.fillRect(fx0 - 2.5, topY, 5, cr);
    } else if (aegisState.castKind === 'swarm') {
      for (var mi = 0; mi < 6; mi++) {
        var phase = time * 7 + mi * 1.7;
        var mx = fx0 + Math.sin(phase) * (24 + mi * 4);
        var my = player.y - 28 - (cr * ((mi + 1) / 7));
        ctx.globalAlpha = 0.7 * ca; ctx.fillStyle = mi % 2 ? '#ffe08a' : '#ffb347';
        ctx.beginPath(); ctx.arc(mx, my, 4.5, 0, TAU); ctx.fill();
        ctx.strokeStyle = cc; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.35 * ca;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - Math.sin(phase) * 18, my + 24); ctx.stroke();
      }
    } else if (aegisState.castKind === 'force') {
      var lane = AEGIS_FORCE_LANE_HALF;
      var lg = ctx.createLinearGradient(fx0 - lane, 0, fx0 + lane, 0);
      lg.addColorStop(0, 'rgba(255,180,60,0)');
      lg.addColorStop(0.5, 'rgba(255,245,210,' + (0.55 * ca) + ')');
      lg.addColorStop(1, 'rgba(255,180,60,0)');
      ctx.fillStyle = lg; ctx.fillRect(fx0 - lane, 0, lane * 2, player.y);
      ctx.fillStyle = 'rgba(255,255,230,' + (0.9 * ca) + ')';
      ctx.fillRect(fx0 - 4, 0, 8, player.y);
    } else {
      var lw = 11;
      var lineG = ctx.createLinearGradient(fx0 - lw, 0, fx0 + lw, 0);
      lineG.addColorStop(0, 'rgba(120,240,255,0)');
      lineG.addColorStop(0.45, 'rgba(160,250,255,' + (0.72 * ca) + ')');
      lineG.addColorStop(0.5, 'rgba(255,255,255,' + (0.98 * ca) + ')');
      lineG.addColorStop(0.55, 'rgba(160,250,255,' + (0.72 * ca) + ')');
      lineG.addColorStop(1, 'rgba(120,240,255,0)');
      ctx.fillStyle = lineG; ctx.fillRect(fx0 - lw, topY, lw * 2, cr);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * ca) + ')';
      ctx.fillRect(fx0 - 1.8, topY, 3.6, cr);
    }
  }

  // Charging: a large, bright convergence ring around the ship.
  if (aegisState.charge === 'charging') {
    var ratio = Math.min(1, aegisState.chargeT / AEGIS_CHARGE_MAX);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.52 + 0.22 * Math.sin(time * 14);
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fx0, player.y - 4, 42 + ratio * 18, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.25 + ratio * 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx0, player.y - 4, 32 + ratio * 10, 0, TAU); ctx.stroke();
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + i * TAU / 6 + time * 0.5;
      var rr = 48 + ratio * 10;
      ctx.globalAlpha = 0.35 + ratio * 0.55;
      ctx.fillStyle = i < Math.ceil(ratio * 6) ? col : '#6b7b8c';
      ctx.beginPath(); ctx.arc(fx0 + Math.cos(a) * rr, player.y - 4 + Math.sin(a) * rr, 2.8, 0, TAU); ctx.fill();
    }
    var cg = ctx.createRadialGradient(fx0, player.y - 4, 0, fx0, player.y - 4, 46);
    cg.addColorStop(0, 'rgba(255,246,210,' + (0.18 + ratio * 0.28) + ')');
    cg.addColorStop(1, 'rgba(255,170,40,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(fx0, player.y - 4, 46, 0, TAU); ctx.fill();
  }

  // Release flash.
  if (aegisState.flashT > 0) {
    var fa = aegisState.flashT / 0.55;
    ctx.globalCompositeOperation = 'lighter';
    var fg = ctx.createRadialGradient(fx0, player.y - 12, 0, fx0, player.y - 12, 92);
    fg.addColorStop(0, 'rgba(255,255,240,' + (0.5 * fa) + ')');
    fg.addColorStop(0.4, 'rgba(255,200,80,' + (0.28 * fa) + ')');
    fg.addColorStop(1, 'rgba(255,120,20,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(fx0, player.y - 12, 92, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.8 * fa; ctx.strokeStyle = '#fff2c4'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fx0, player.y - 12, 35 + (1 - fa) * 55, 0, TAU); ctx.stroke();
  }

  // Attached Force: a real field, not a small orb.
  if (aegisState.force === 'attached') {
    drawForceField(fx0, fy0, 124, 0.34 + shieldRatio * 0.38, time * 0.25);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85;
    var core = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, 26);
    core.addColorStop(0, 'rgba(255,255,245,0.95)');
    core.addColorStop(0.35, 'rgba(255,196,78,0.55)');
    core.addColorStop(1, 'rgba(255,130,20,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(fx0, fy0, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff5cf'; ctx.beginPath(); ctx.arc(fx0, fy0, 4, 0, TAU); ctx.fill();
  } else if (aegisState.force === 'detached' || aegisState.force === 'returning') {
    drawForceField(fx0, fy0, 78, aegisState.force === 'detached' ? 0.9 : 0.55, time * 0.8);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(fx0, fy0, 7, 0, TAU); ctx.fill();
  } else {
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx0, fy0, 28, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ff8a66'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('REBUILD', fx0, fy0 + 3); ctx.textAlign = 'left';
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawAegisControls() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var b = aegisButtons();
  var col = aegisWeaponColor();
  // CHARGE
  var c = b.charge;
  var ratio = Math.min(1, aegisState.chargeT / AEGIS_CHARGE_MAX);
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
  var forceLabel = aegisState.force === 'attached' ? (forceReady ? 'FORCE' : 'EMPTY') : (aegisState.force === 'detached' ? 'RECALL' : (aegisState.force === 'returning' ? 'RETURN' : 'BROKEN'));
  ctx.fillText(forceLabel, f.x, f.y - 3);
  ctx.fillStyle = '#ffd36b'; ctx.font = '700 9px monospace';
  ctx.fillText('x' + player.bombs, f.x, f.y + 9);
  ctx.fillStyle = '#9fe8ff'; ctx.font = '7px monospace';
  ctx.fillText(Math.round(aegisState.shield) + '%', f.x, f.y + 20);
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
