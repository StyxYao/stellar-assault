// Player ship rendering. Uses legacy globals (player/GIMG/ctx/state/time).
function drawPlayerEntity(){
  var gi=player.bank>0.06?GIMG.p3:(player.bank<-0.06?GIMG.p4:GIMG.p2);
  var drawY=player.y;
  if(player.respawnT>0) drawY=player.y+(H+70-player.y)*(player.respawnT/1.3);
  if(gi&&gi.complete){
    ctx.globalAlpha=(state==='bossWarn'||state==='clear')?1:((player.invuln>0&&!player.noBlink&&Math.floor(player.invuln*14)%2===0)?0.25:1);
    var psc=1;
    if(state==='warpOut') psc=Math.max(0.18,1-(1-warpT/1.1)*0.82);
    if(state==='warpIn') psc=0.42+0.58*Math.min(1,1-warpT/0.95);
    if(player.specialPower>=4){ctx.save();ctx.globalCompositeOperation='lighter';var ag=ctx.createRadialGradient(player.x,drawY,0,player.x,drawY,52);ag.addColorStop(0,'rgba(255,215,100,0.28)');ag.addColorStop(1,'rgba(255,180,40,0)');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(player.x,drawY,52,0,TAU);ctx.fill();ctx.restore();}
    drawODAura(drawY);
    ctx.drawImage(gi,player.x-40*psc,drawY-40*psc,80*psc,80*psc);ctx.globalAlpha=1;
    drawPlayerHitbox(player.x,drawY,player.r,time);
  }
}
