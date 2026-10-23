// Player hitbox indicator. The filled core and inner ring show the exact r=6 collision radius.
// The rotating outer ticks are visual only.
function drawPlayerHitbox(px, py, r, t){
  if(state !== 'play' && state !== 'boss') return;
  if(player.respawnT > 0) return;

  var pulse = 0.5 + 0.5 * Math.sin(t * 9.0);
  var halo = r + 6 + pulse * 3;
  var flash = Math.floor(t * 12) % 2 === 0;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // hot core halo
  var g = ctx.createRadialGradient(px, py, 0, px, py, halo);
  g.addColorStop(0, 'rgba(255,255,255,0.72)');
  g.addColorStop(0.22, 'rgba(120,255,255,' + (0.34 + pulse * 0.18) + ')');
  g.addColorStop(0.54, 'rgba(255,120,80,' + (0.18 + pulse * 0.10) + ')');
  g.addColorStop(0.58, 'rgba(255,70,220,' + (0.20 + pulse * 0.14) + ')');
  g.addColorStop(1, 'rgba(255,70,220,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px, py, halo, 0, TAU); ctx.fill();

  // exact hitbox: solid energy core + ring
  ctx.globalAlpha = 0.65 + pulse * 0.35;
  ctx.fillStyle = flash ? 'rgba(255,255,255,0.66)' : 'rgba(160,255,255,0.52)';
  ctx.beginPath(); ctx.arc(px, py, Math.max(2.2, r * 0.72), 0, TAU); ctx.fill();

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = flash ? '#ff66dd' : '#b6ffff';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke();

  // restrained orange rim separates the core from the blue/white hull
  ctx.globalAlpha = .48 + pulse * .12;
  ctx.strokeStyle = 'rgba(255,150,55,1)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(px, py, r + 2.4, 0, TAU); ctx.stroke();

  // four rotating energy ticks make the 6px ring readable without obscuring the ship
  ctx.globalAlpha = 0.55 + pulse * 0.35;
  ctx.strokeStyle = '#ff9cf0';
  ctx.lineWidth = 1;
  for (var i = 0; i < 4; i++) {
    var a = t * 2.4 + i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(a) * (r + 1), py + Math.sin(a) * (r + 1));
    ctx.lineTo(px + Math.cos(a) * (r + 5), py + Math.sin(a) * (r + 5));
    ctx.stroke();
  }

  // white-hot centre
  ctx.globalAlpha = .78;
  ctx.fillStyle = '#f4ffff';
  ctx.beginPath(); ctx.arc(px, py, 1.1, 0, TAU); ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
