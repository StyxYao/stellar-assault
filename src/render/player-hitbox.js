// Player hitbox indicator.
// Exact collision circle: player.r (6 logical px). The outer glow is visual only.
function drawPlayerHitbox(px, py, r, t){
  if(state !== 'play' && state !== 'boss') return;
  if(player.respawnT > 0) return;

  var pulse = 0.5 + 0.5 * Math.sin(t * 5.2);
  var ring = r;                 // exact collision radius
  var halo = r + 7 + pulse * 2; // purely visual

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // soft focus halo
  var g = ctx.createRadialGradient(px, py, 0, px, py, halo);
  g.addColorStop(0, 'rgba(210,250,255,0)');
  g.addColorStop(0.46, 'rgba(120,225,255,0.10)');
  g.addColorStop(0.72, 'rgba(90,205,255,' + (0.16 + pulse * 0.08) + ')');
  g.addColorStop(1, 'rgba(80,190,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, halo, 0, TAU);
  ctx.fill();

  // exact hitbox ring
  ctx.globalAlpha = 0.82 + pulse * 0.18;
  ctx.strokeStyle = '#dffaff';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(px, py, ring, 0, TAU);
  ctx.stroke();

  // second, thinner ring makes the tiny 6px radius readable on phone screens
  ctx.globalAlpha = 0.36 + pulse * 0.14;
  ctx.strokeStyle = '#8fe8ff';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(px, py, ring + 2.2, 0, TAU);
  ctx.stroke();

  // center point
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py, 1.15, 0, TAU);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
