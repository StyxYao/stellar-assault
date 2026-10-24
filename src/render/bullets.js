// Bullet sprites and enemy/boss bullet rendering.
var EB_CACHE={};
function ebSprite(pi,type){
 var key=pi+'_'+type;
 if(EB_CACHE[key]) return EB_CACHE[key];
 var p=BOSS_PALETTES[pi]||BOSS_PALETTES[0];
 var cv=document.createElement('canvas'),x=cv.getContext('2d');
 if(type===2){
  cv.width=cv.height=64; x.translate(32,32);
  x.shadowColor=p.glow; x.shadowBlur=16;
  x.fillStyle=p.main; x.beginPath(); x.arc(0,0,16,0,TAU); x.fill();
  x.shadowBlur=0;
  x.strokeStyle=p.dark; x.lineWidth=3; x.beginPath(); x.arc(0,0,16,0,TAU); x.stroke();
  x.strokeStyle=p.edge; x.lineWidth=2; x.beginPath(); x.arc(0,0,11,0,TAU); x.stroke();
  x.fillStyle=p.core; x.beginPath(); x.arc(0,0,6,0,TAU); x.fill();
  x.fillStyle='rgba(255,255,255,0.95)'; x.beginPath(); x.arc(-3,-4,2.4,0,TAU); x.fill();
 }else{
  cv.width=48; cv.height=96; x.translate(24,48);
  x.shadowColor=p.glow; x.shadowBlur=14;
  x.fillStyle=p.dark; x.beginPath(); x.moveTo(0,-40);x.lineTo(10,-2);x.lineTo(0,40);x.lineTo(-10,-2);x.closePath();x.fill();
  x.shadowBlur=8;
  x.fillStyle=p.main; x.beginPath(); x.moveTo(0,-34);x.lineTo(7,-4);x.lineTo(0,32);x.lineTo(-7,-4);x.closePath();x.fill();
  x.shadowBlur=0;
  x.fillStyle=p.light; x.beginPath(); x.moveTo(0,-28);x.lineTo(3,-5);x.lineTo(0,22);x.lineTo(-3,-5);x.closePath();x.fill();
  x.fillStyle=p.core; x.beginPath(); x.moveTo(0,-22);x.lineTo(1.5,-4);x.lineTo(0,14);x.lineTo(-1.5,-4);x.closePath();x.fill();
  x.fillStyle=p.edge; x.beginPath(); x.moveTo(-10,-2);x.lineTo(-18,4);x.lineTo(-8,8);x.closePath();x.fill();
  x.beginPath(); x.moveTo(10,-2);x.lineTo(18,4);x.lineTo(8,8);x.closePath();x.fill();
 }
 EB_CACHE[key]=cv; return cv;
}



var S5_BULLET_KEYS=[['s5b2','s5b5'],['s5b1','s5b6'],['s5b3','s5b4'],['s5b4','s5b5'],['s5b6','s5b1'],['s5b1','s5b3']];
var S5_ENEMY_BULLET=['s5b4','s5b5','s5b2','s5b6','s5b1','s5b3'];
function drawCrystalEB(e,p,pi){
  var R=e.rad*(e.type===2?1.85:2.25);
  var n=e.rad>=6?12:(e.type===2?8:4);
  var cols=[p.main,p.light,p.edge,p.core];
  var key=S5_BULLET_KEYS[pi]&&S5_BULLET_KEYS[pi][e.type===2?1:0];
  var art=key?GIMG[key]:null;
  if(art&&art.complete&&art.naturalWidth){
    var target=e.rad*(e.type===2?3.6:3.25);
    var aw=target,ah=target*art.height/art.width;
    if(ah<target){ah=target;aw=target*art.width/art.height;}
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=.55;ctx.fillStyle=p.glow;ctx.beginPath();ctx.arc(0,0,target*.48,0,TAU);ctx.fill();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';if('filter'in ctx)ctx.filter='brightness(1.55) saturate(1.35) contrast(1.12)';ctx.drawImage(art,-aw/2,-ah/2,aw,ah);ctx.filter='none';
    ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,1.6,0,TAU);ctx.fill();ctx.strokeStyle=p.edge;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,target*.30,0,TAU);ctx.stroke();
    if(pi===5){var rb0=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];for(var k0=0;k0<3;k0++){ctx.globalAlpha=.20;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rb0[k0];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,target*.55,time*1.4+k0*2,time*1.4+k0*2+2.1);ctx.stroke();}}
    ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';return;
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  var gl=ctx.createRadialGradient(0,0,0,0,0,R*2.0);
  gl.addColorStop(0,p.glow||'rgba(200,160,255,.5)');gl.addColorStop(.55,p.glow||'rgba(200,160,255,.2)');gl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*2.0,0,TAU);ctx.fill();
  // faceted prism body
  ctx.globalCompositeOperation='source-over';
  for(var i=0;i<n;i++){
    var a0=i/n*TAU-Math.PI/2,a1=(i+1)/n*TAU-Math.PI/2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a0)*R,Math.sin(a0)*R);ctx.lineTo(Math.cos(a1)*R,Math.sin(a1)*R);ctx.closePath();
    ctx.fillStyle=i%3===0?p.dark:(i%3===1?p.main:p.light);ctx.globalAlpha=.92;ctx.fill();
    ctx.strokeStyle=p.edge;ctx.globalAlpha=.55;ctx.lineWidth=.8;ctx.stroke();
  }
  // bright outer rim
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.95;
  ctx.strokeStyle=p.edge;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
  // white-hot core
  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,Math.max(1.7,R*.22),0,TAU);ctx.fill();
  // prismatic refraction
  var rb=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];
  for(var k=0;k<3;k++){
    ctx.globalAlpha=.22;ctx.strokeStyle=rb[(k+pi)%5];ctx.lineWidth=1.1;
    ctx.beginPath();ctx.arc(0,0,R*(1.18+k*.14),time*1.1+k*2,time*1.1+k*2+2.3);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawEB(e){
  var pi=(e.bossPal!=null?e.bossPal:((stage===4&&boss&&boss.phase===0)?5:(stage|0)));
  pi=Math.max(0,Math.min(5,pi));var p=BOSS_PALETTES[pi],spr=ebSprite(pi,e.type);
  if(e.bomb&&e.tx!=null&&e.blastR){
    var bp0=0.5+0.5*Math.sin(time*10);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=.20+bp0*.16;ctx.fillStyle='rgba(255,110,70,1)';ctx.beginPath();ctx.arc(e.tx,e.ty,e.blastR,0,TAU);ctx.fill();
    ctx.globalAlpha=.62+bp0*.25;ctx.strokeStyle='#ffb36b';ctx.lineWidth=2;ctx.setLineDash([6,5]);
    ctx.beginPath();ctx.arc(e.tx,e.ty,e.blastR,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.32;ctx.strokeStyle='#fff0c0';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(e.tx,e.ty,e.blastR*.34,0,TAU);ctx.stroke();ctx.restore();ctx.globalAlpha=1;
  }
  var a=Math.atan2(e.vy,e.vx)+Math.PI/2;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);
  if(e.bomb){
    var bp=0.65+0.35*Math.sin(time*18);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(80,240,255,'+(0.18*bp)+')';ctx.beginPath();ctx.arc(0,0,e.rad*2.2,0,TAU);ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#081420';ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.fill();
    ctx.strokeStyle='#8ff8ff';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(255,225,120,'+bp+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,e.rad+4,0,TAU);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,e.rad*0.28,0,TAU);ctx.fill();
    ctx.restore();return;
  }
  if(e.bossPal!=null&&e.bossPal<4){
    var bp=e.bossPal,bpPal=BOSS_PALETTES[bp],bspr=ebSprite(bp,e.type);
    if(bspr){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.32;
      ctx.fillStyle=bpPal.glow;ctx.beginPath();ctx.arc(0,0,e.rad*1.7,0,TAU);ctx.fill();
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      if(e.type===2){var bw=e.rad*2.9;ctx.drawImage(bspr,-bw/2,-bw/2,bw,bw);}
      else{var bw=e.rad*2.35,bh=e.rad*4.9;ctx.drawImage(bspr,-bw/2,-bh/2,bw,bh);}
      ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,Math.max(1.5,e.rad*.22),0,TAU);ctx.fill();
      ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.restore();return;
    }
  }
  if(e.s5art){
    var art=GIMG[e.s5art];
    if(art&&art.complete&&art.naturalWidth){
      var target=e.rad*2.35,aw=target,ah=target*art.height/art.width;
      if(ah<target){ah=target;aw=target*art.width/art.height;}
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;
      ctx.fillStyle=p.glow;ctx.beginPath();ctx.arc(0,0,e.rad*1.7,0,TAU);ctx.fill();
      ctx.globalAlpha=.98;ctx.globalCompositeOperation='source-over';
      ctx.drawImage(art,-aw/2,-ah/2,aw,ah);
      ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,1.5,0,TAU);ctx.fill();
      ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      ctx.restore();return;
    }
  }
  if(stage===4){
    drawCrystalEB(e,p,pi);ctx.restore();return;
  }
  if(spr){
    if(e.type===2){var w=e.rad*2.8;ctx.drawImage(spr,-w/2,-w/2,w,w);}
    else{var w=e.rad*2.2,h=e.rad*4.6;ctx.drawImage(spr,-w/2,-h/2,w,h);}
  }else{
    ctx.fillStyle=p.main;ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.fill();
    ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(0,0,e.rad*0.42,0,TAU);ctx.fill();
  }
  if(pi===5){
    var rb=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];
    ctx.globalCompositeOperation='lighter';
    for(var rk=0;rk<5;rk++){
      ctx.globalAlpha=.10;ctx.strokeStyle=rb[rk];ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(0,0,e.rad*(1.25+rk*.18),time*1.1+rk*.8,time*1.1+rk*.8+2.2);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  // white-hot core; colored edge is kept from the sprite
  ctx.globalCompositeOperation='lighter';
  if(e.type===2){
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(0,0,e.rad*0.20,0,TAU);ctx.fill();
  }else{
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(0,0,1.6,0,TAU);ctx.fill();
    ctx.fillRect(-0.8,-e.rad*0.75,1.6,e.rad*1.5);
  }
  ctx.restore();ctx.globalCompositeOperation='source-over';
}

