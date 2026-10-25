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
function drawAegisShipFx() {
  if (player.ship !== 'aegis' || (state !== 'play' && state !== 'boss')) return;
  var fx0 = aegisState.forceX, fy0 = aegisState.forceY;
  var col = aegisWeaponColor();
  ctx.save();
  // charge ring around the ship
  if (aegisState.charge === 'charging') {
    var ratio = Math.min(1, aegisState.chargeT / AEGIS_CHARGE_MAX);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + 0.20 * Math.sin(time * 12);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y - 4, 38 + ratio * 10, 0, TAU * ratio); ctx.stroke();
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + i * TAU / 3;
      ctx.globalAlpha = ratio >= ((i + 1) / 3) ? 0.9 : 0.25;
      ctx.fillStyle = i < aegisChargeLevel() ? col : '#6b7b8c';
      ctx.beginPath(); ctx.arc(player.x + Math.cos(a) * 52, player.y - 4 + Math.sin(a) * 52, 3, 0, TAU); ctx.fill();
    }
  }
  // Shield overlay: one dynamic layer on top of the full ship image.
  if (aegisState.force !== 'broken') {
    var sa = Math.max(0, Math.min(1, aegisState.shield / AEGIS_SHIELD_MAX));
    var accent = aegisSkinAccent();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22 + sa * 0.25;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (var si = 0; si < 4; si++) {
      var a0 = time * 0.55 + si * Math.PI / 2;
      ctx.beginPath(); ctx.arc(player.x, player.y - 4, 44 + (1 - sa) * 3, a0, a0 + 0.42); ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = sa > 0.35 ? accent : '#ff6a5a';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(player.x, player.y - 4, 48, -Math.PI / 2, -Math.PI / 2 + TAU * sa); ctx.stroke();
  }
  // Force body
  if (aegisState.force !== 'broken') {
    var shieldRatio = Math.max(0, Math.min(1, aegisState.shield / AEGIS_SHIELD_MAX));
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(fx0, fy0, 0, fx0, fy0, 34);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(125,245,255,' + (0.40 + shieldRatio * 0.25) + ')');
    g.addColorStop(1, 'rgba(70,110,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx0, fy0, 34, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#071420'; ctx.beginPath(); ctx.arc(fx0, fy0, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = aegisState.force === 'attached' ? '#9fe8ff' : '#ffd36b';
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx0, fy0, 18, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = shieldRatio > 0.35 ? '#9fe8ff' : '#ff6a5a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx0, fy0, 25, -Math.PI / 2, -Math.PI / 2 + TAU * shieldRatio); ctx.stroke();
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(fx0, fy0, 3, 0, TAU); ctx.fill();
  } else {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx0, fy0, 20, 0, TAU); ctx.stroke();
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
  // FORCE
  var f = b.force;
  ctx.fillStyle = aegisState.force === 'broken' ? 'rgba(30,10,10,0.85)' : 'rgba(8,30,44,0.88)';
  ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = aegisState.force === 'broken' ? '#ff6a5a' : (aegisState.force === 'attached' ? '#9fe8ff' : '#ffd36b');
  ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#eaf8ff'; ctx.font = '700 8px monospace'; ctx.textAlign = 'center';
  ctx.fillText(aegisState.force === 'attached' ? 'FORCE' : (aegisState.force === 'detached' ? 'RECALL' : (aegisState.force === 'returning' ? 'RETURN' : 'BROKEN')), f.x, f.y + 2);
  ctx.fillStyle = '#9fe8ff'; ctx.font = '7px monospace';
  ctx.fillText(Math.round(aegisState.shield) + '%', f.x, f.y + 12);
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
    ctx.fillText('TAP FORCE · DETACH / RECALL', W / 2, H - 218);
    ctx.textAlign = 'left'; ctx.restore(); ctx.globalAlpha = 1;
  }
}
