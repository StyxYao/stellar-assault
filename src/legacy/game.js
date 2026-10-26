(function(){
  try{
    var st=document.createElement('style');
    st.textContent="@font-face{font-family:'Orbitron';src:url('assets/fonts/orbitron-600.ttf') format('truetype');font-weight:600;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-500.ttf') format('truetype');font-weight:500;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-600.ttf') format('truetype');font-weight:600;font-display:swap}";
    document.head.appendChild(st);
    if(document.fonts&&document.fonts.load){document.fonts.load('600 20px Orbitron');document.fonts.load('600 20px Rajdhani');}
  }catch(e){}
})();
var player={x:W/2,y:H-130,r:6,lives:3,hp:3,maxHp:3,bombs:2,od:0,odT:0,powerXp:0,respawnT:0,respawnGift:false,invuln:0,bank:0,noBlink:false,power:1,weapon:'normal',specialPower:1,options:0,wingPower:1,ship:'vector',skin:'void_lance',trail:[],wingEntry:[]};
var target={x:W/2,y:H-130};
var stage=0,state='menu',score=0,time=0,lastShot=0,lastHitSfx=0,shake=0;
var enemies=[],bullets=[],shots=[],parts=[],stars=[],fx=[],ebullets=[],items=[],missiles=[],wingBeams=[],beams=[],orbBullets=[],phaseFx=[],blastZones=[],odLaserFx=[];
var lastMissile=0,lastSpecial=0,optionT=0,laserTick=0,laserHitY=0,laserHitT=0,pickupMsg='',pickupT=0;
var audioReady=false;
var boss=null,runner=null,bossFusionT=0,bossFusionOn=false,bossOmenT=0,selectedStage=0,bossDeath1T=0,bossAwakenT=0,SIG_BOSS=-1;
var miniDropT=25,bossPhaseGlitchT=0,fusionHoldT=0,fusionHoldActive=false,fusionFadeT=0,stageT=0,waveIndex=0,nextTransport=0,banner='',bannerSub='',bannerT=0,castT=0,castScroll=0,castHoldT=0,fusionT=0,finaleT=0;
var bgCurrent=BG1,bgPrev=null,bgFade=0,stageFlash=0,stageWarp=0,warpT=0,warpSpeed=0,glowWarp=0,bombT=0,bombX=0,bombY=0;
var bgScroll=0,bgEdgeScroll=0,bgDust=[];var BG_MAIN=[],BG_EDGE=[];
var BG4=new Image();BG4.src='assets/bg/stage4-main.webp';
var phaseMaskCv=null,phaseMaskCtx=null,BG_FIRST_CV=null,PHASE_FIRST_CVS={},PHASE_GLITCH_CVS={};
// web video elements/host/priming live in src/platform/web/video.js
var BG5=new Image();BG5.src='assets/bg/stage5-main.webp';
var BG1_BH=new Image();BG1_BH.src='assets/bg/stage1-bh.webp';
var BG1_EARLIEST=new Image();BG1_EARLIEST.src='assets/bg/stage1-earliest.webp';
var BG1_NEBULA=new Image();BG1_NEBULA.src='assets/bg/stage1-nebula.webp';
var JULIA_CANVAS=null,JULIA_CTX=null,JULIA_DATA=null,JULIA_TICK=0,JULIA_W=200,JULIA_H=430;
var IFS_POINTS=(function(){var v=[{x:0,y:0},{x:1,y:0},{x:.5,y:.866}],p={x:.5,y:.35},out=[];for(var i=0;i<2600;i++){var q=v[(i*7)%3];p={x:(p.x+q.x)/2,y:(p.y+q.y)/2};if(i>60&&i%23===0)out.push(p);}return out;})();
// web audio engine lives in src/platform/web/audio.js
var STAGES=[
 {name:'NEBULA',bg:BG1,bgm:'m',waves:STAGE_WAVES[0]},
 {name:'STATION',bg:BG2,bgm:'a',waves:STAGE_WAVES[1]},
 {name:'SURFACE',bg:BG3,bgm:'b',waves:STAGE_WAVES[2]},
 {name:'SANCTUM',bg:BG4,bgm:'s4',waves:STAGE_WAVES[3]},
 {name:"TIME'S END",bg:BG5,bgm:'s5',waves:STAGE5_WAVES}
];
var WARMUP=[
 {t:0.8,type:0,n:3,form:'v',spd:88,noFire:true},
 {t:4.5,type:0,n:3,form:'line',spd:82,noFire:true},
 {t:8.0,type:0,n:4,form:'v',spd:94,noFire:false},
 {t:11.0,type:1,n:2,form:'line',spd:68,noFire:false}
];
var BRIDGE=[
 {t:12.5,type:0,n:4,form:'v',spd:100,aggr:0.7},
 {t:16.0,type:1,n:3,form:'line',spd:74,aggr:0.7},
 {t:19.5,type:2,n:3,form:'pincer',spd:80,aggr:0.7},
 {t:23.0,type:0,n:4,form:'snake',spd:90,aggr:0.7}
];
STAGES.forEach(function(st,si){
  var pre=(si===4)?[]:WARMUP.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};}).concat(
    BRIDGE.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:false,aggr:w.aggr};})
  );
  st.waves=pre.concat(
    st.waves.map(function(w){return {t:w.t+(si===4?0:26),type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};})
  );
  if(si!==4){
    var alts=['arc','cross','strafe','feint','orbit'];
    st.waves.forEach(function(w,i){
      if(i>7&&i%5===0) w.form=alts[Math.floor(i/5)%alts.length];
      if(i>9&&i%7===0) w.role='sniper';
      if(i>11&&i%9===0) w.role='suppressor';
    });
    if(st.waves[10]){st.waves[10].form='ring';st.waves[10].n=5;st.waves[10].type=2;st.waves[10].spd=78;}
    if(st.waves[16]){st.waves[16].form='escort';st.waves[16].n=5;st.waves[16].type=4;st.waves[16].spd=62;}
    st.waves.push({t:78.5,type:6,n:2,form:'cross',spd:86,noFire:false,aggr:1,role:'suppressor'});
  }
  if(st===STAGES[0]) st.waves.push({t:34.5,type:6,n:2,form:'turret',spd:55,noFire:false,aggr:1});
  if(st===STAGES[1]){st.waves.push({t:34.5,type:7,n:2,form:'turret',spd:52,noFire:false,aggr:1});st.waves.push({t:69.0,type:8,n:2,form:'line',spd:55,noFire:false,aggr:1});}
  if(st===STAGES[2]){st.waves.push({t:33.0,type:8,n:2,form:'line',spd:55,noFire:false,aggr:1});st.waves.push({t:69.0,type:7,n:2,form:'turret',spd:52,noFire:false,aggr:1});}
  st.waves.sort(function(a,b){return a.t-b.t;});
  if(si>0){
    st.waves.forEach(function(w,i){
      if(i<8||w.form==='mid'||w.form==='escort') return;
      var mark=false;
      if(si===1&&i%5===0) mark=true;
      if(si===2&&i%3===0) mark=true;
      if(si===3&&(i%5===0||i%5===2)) mark=true;
      if(si===4&&i%7===0) mark=true;
      if(mark) w.elite=true;
    });
  }
});

function bossPalette(){
 var i=Math.max(0,Math.min(4,stage|0));
 return BOSS_PALETTES[i]||BOSS_PALETTES[0];
}
function bossBeamColor(){
 if(SIG_BOSS>=0&&BOSS_PALETTES[SIG_BOSS]) return BOSS_PALETTES[SIG_BOSS].beam;
 if(stage===4&&boss&&boss.phase===0) return '#fff2c0';
 return bossPalette().beam;
}
for(var i=0;i<64;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:0.3+Math.random()*0.9});
for(var bi=1;bi<=5;bi++){
  var mi=new Image(); mi.src='assets/bg/stage'+bi+'-main.webp'; BG_MAIN[bi-1]=mi;
  var ei=new Image(); ei.src='assets/bg/stage'+bi+'-edge.webp'; BG_EDGE[bi-1]=ei;
}
for(var di=0;di<90;di++) bgDust.push({x:Math.random()*W,y:Math.random()*H,sp:220+Math.random()*190,len:1.5+Math.random()*4,a:0.18+Math.random()*0.45,c:Math.random()<0.55?'#cfefff':'#e7d8ff'});
var BEAD_COLS=['#7dffd8','#7fe6ff','#ffd27a','#c9a6ff'];
var BG_BEADS=[];
for(var bgi=0;bgi<18;bgi++) BG_BEADS.push({ba:rand(-0.16,0.16),br:rand(.16,.96),s:rand(2.2,6.4),c:bgi%4,ph:rand(0,TAU)});
var BEAD_SPR={};
function beadSprite(ci){
  if(BEAD_SPR[ci]) return BEAD_SPR[ci];
  var cv=document.createElement('canvas');cv.width=cv.height=64;var g=cv.getContext('2d');
  var col=BEAD_COLS[ci];
  var rg=g.createRadialGradient(32,32,0,32,32,30);
  rg.addColorStop(0,'rgba(255,255,255,1)');
  rg.addColorStop(.18,'rgba(255,255,255,.92)');
  rg.addColorStop(.36,col);
  rg.addColorStop(.68,col.replace(')',',0.28)').replace('rgb','rgba'));
  rg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg;g.beginPath();g.arc(32,32,30,0,TAU);g.fill();
  BEAD_SPR[ci]=cv;return cv;
}
function drawWedgeBeads(R,alpha,layerSeed){
  if(alpha<=0) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var bi=0;bi<BG_BEADS.length;bi++){
    var b=BG_BEADS[bi];
    var ang=b.ba+Math.sin(time*.35+b.ph+layerSeed)*.035;
    var rr=b.br*R;
    var x=Math.cos(ang)*rr,y=Math.sin(ang)*rr;
    var s=b.s*(0.7+rr/R*.9)*(1+0.12*Math.sin(time*1.3+b.ph));
    ctx.globalAlpha=alpha*(.30+.55*(.5+.5*Math.sin(time*.9+b.ph*1.7+layerSeed)));
    ctx.drawImage(beadSprite(b.c),x-s,y-s,s*2,s*2);
  }
  ctx.restore();ctx.globalAlpha=1;
}


function setStageBg(img){
  if(!img) return;
  bgPrev=null; bgCurrent=img; bgFade=0;
}
var lastBoomSfx=0;
function boom(x,y,sc,kind){
  var life=kind==='boss'?1.6:((kind==='elite'||kind==='player')?0.95:0.6);
  fx.push({x:x,y:y,t:0,sc:sc||1,seed:Math.random()*TAU,kind:kind||'normal',life:life});
  if(kind==='player'){
    sfx('bomb_big',0.55); shake=Math.max(shake,14);
  }else if(kind==='elite'){
    for(var i=0;i<3;i++) fx.push({x:x+rand(-24,24),y:y+rand(-18,18),t:-i*0.05,sc:(sc||1)*0.55,seed:Math.random()*TAU,kind:'elite',life:0.95});
    sfx('bomb_big',0.42); shake=Math.max(shake,7);
  }else if(kind==='boss'){
    sfx('bomb_big',1.0); shake=Math.max(shake,26);
  }else if(time-lastBoomSfx>0.045){
    lastBoomSfx=time;sfx('boom',Math.min(1.0,0.45+0.35*(sc||1)));
    if(AC&&!muted){noiseBurst(0.055,0.24,2600);tone(180,55,0.12,0.30,'sawtooth');}
  }
}
function enemyDeath(e){
  if(!e) return;
  if(e.elite){ boom(e.x,e.y,1.35,'elite'); }
  else boom(e.x,e.y,0.75,'normal');
}
function enemyBombExplode(e){
  var bossBomb=!!e.bossBomb,rad=e.blastR||(bossBomb?118:72);
  blastZones.push({x:e.x,y:e.y,t:0,life:bossBomb?0.60:0.42,r:rad,hit:false,boss:bossBomb});
  fx.push({x:e.x,y:e.y,t:0,sc:bossBomb?2.4:1.15,seed:Math.random()*TAU,kind:'enemybomb',life:bossBomb?1.15:0.9});
  if(AC&&!muted){
    if(bossBomb){noiseBurst(0.28,0.42,750);tone(62,22,0.42,0.55,'sine');sfx('bomb_big',0.42);}
    else{noiseBurst(0.20,0.32,900);tone(75,28,0.32,0.50,'sine');tone(180,60,0.16,0.22,'sawtooth');}
  }
  shake=Math.max(shake,bossBomb?16:4);
}
function bossDeathBoom(b,noShake){
  for(var i=0;i<11;i++){
    var a=i/11*TAU,rr=rand(20,95);
    fx.push({x:b.x+Math.cos(a)*rr,y:b.y+Math.sin(a)*rr,t:-i*0.035,sc:rand(0.7,1.9),seed:Math.random()*TAU,kind:i%3?'boss':'elite',life:rand(1.2,1.8)});
  }
  phaseFx.push({x:b.x,y:b.y,t:0,life:1.8,kind:'death'});
  sfx('bomb_big',1.0); if(!noShake)shake=30;
}
function part(x,y,col,n,sp){
  n=n||6; sp=sp||90;
  for(var i=0;i<n;i++){
    var a=Math.random()*TAU,v=sp*(0.3+Math.random());
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.35+Math.random()*0.45,col:col});
  }
}
function updateODLaserFx(dt){
  for(var i=odLaserFx.length-1;i>=0;i--){odLaserFx[i].t+=dt;if(odLaserFx[i].t>odLaserFx[i].life)odLaserFx.splice(i,1);}
}
function drawODLaserFx(){
  for(var i=0;i<odLaserFx.length;i++){
    var f=odLaserFx[i],a=Math.max(0,1-f.t/f.life);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=(f.level===1?0.85:0.65)*a;
    ctx.strokeStyle=f.level===1?'#8ff6ff':'#ffe08a';ctx.lineWidth=f.level===1?4:2.2;
    ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
    ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=f.level===1?1.4:0.9;
    ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
    ctx.restore();ctx.globalAlpha=1;
  }
}
function updateBlastZones(dt){
  for(var i=blastZones.length-1;i>=0;i--){
    var z=blastZones[i];z.t+=dt;
    if(!z.hit){
      var dx=player.x-z.x,dy=player.y-z.y;
      if(dx*dx+dy*dy<z.r*z.r){z.hit=true;hitPlayer();}
    }
    if(z.t>=z.life) blastZones.splice(i,1);
  }
}
function drawBlastZones(){
  for(var i=0;i<blastZones.length;i++){
    var z=blastZones[i],p=Math.min(1,z.t/z.life),a=1-p;
    var rr=z.r*(0.35+0.65*Math.min(1,p*1.8));
    ctx.save();ctx.globalCompositeOperation='lighter';
    var g=ctx.createRadialGradient(z.x,z.y,0,z.x,z.y,rr);
    if(z.boss){g.addColorStop(0,'rgba(255,235,150,'+(0.65*a)+')');g.addColorStop(0.45,'rgba(255,120,50,'+(0.38*a)+')');g.addColorStop(1,'rgba(255,60,20,0)');}
    else{g.addColorStop(0,'rgba(190,255,255,'+(0.55*a)+')');g.addColorStop(0.45,'rgba(60,180,255,'+(0.30*a)+')');g.addColorStop(1,'rgba(30,80,255,0)');}
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,rr,0,TAU);ctx.fill();
    ctx.globalAlpha=0.85*a;ctx.strokeStyle=z.boss?'#ffe6a0':'#9fefff';ctx.lineWidth=z.boss?5:3;
    ctx.beginPath();ctx.arc(z.x,z.y,rr,0,TAU);ctx.stroke();
    ctx.restore();ctx.globalAlpha=1;
  }
}
function drawSentry(e){
  var t=e.t||0,ang=Math.sin(t*1.6)*0.12,sc=1;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(ang);
  ctx.globalAlpha=0.18;ctx.fillStyle='#ff8a5a';ctx.beginPath();ctx.arc(0,0,30,0,TAU);ctx.fill();ctx.globalAlpha=1;
  var g=ctx.createLinearGradient(-24,0,24,0);g.addColorStop(0,'#3b4048');g.addColorStop(0.4,'#d7dde5');g.addColorStop(0.7,'#6d747e');g.addColorStop(1,'#2c3138');
  ctx.fillStyle=g;ctx.beginPath();
  for(var k=0;k<6;k++){var a=-Math.PI/2+k*Math.PI/3,x=Math.cos(a)*22,y=Math.sin(a)*26;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.closePath();ctx.fill();ctx.strokeStyle='#1b2027';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='rgba(255,160,100,0.85)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,15,t*1.8,t*1.8+2.1);ctx.stroke();
  ctx.fillStyle='#ff5a3a';ctx.beginPath();ctx.arc(0,0,6+Math.sin(t*6)*1.2,0,TAU);ctx.fill();
  ctx.fillStyle='#2e343c';ctx.fillRect(-27,-6,8,12);ctx.fillRect(19,-6,8,12);
  ctx.fillStyle='#ffb36b';ctx.fillRect(-26,3,6,2);ctx.fillRect(20,3,6,2);
  ctx.restore();
  if(e.flash>0||e.hp<e.max){
    var bw=36,bh=3,bx=e.x-bw/2,by=e.y-34;
    ctx.fillStyle='rgba(8,14,24,0.8)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=e.hp/e.max>0.5?'#8dff9e':'#ffb36b';ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.max),bh);
  }
}
var S5_ENEMY_KEYS=['s5e1','s5e2','s5e3','s5e4','s5e5','s5e6'];
function drawBullet(b){
  var img=bulletImg(),a=Math.atan2(b.r.direction||0,1)+Math.PI/2;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);
  if(img&&img.complete)ctx.drawImage(img,-6,-12,12,24);
  else{ctx.fillStyle='#8fe8ff';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(255,255,255,0.95)';ctx.beginPath();ctx.arc(0,0,1.35,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fillRect(-0.7,-4,1.4,8);
  ctx.restore();ctx.globalCompositeOperation='source-over';
}
function drawBombBtn(){
  var bx=W-64,by=H-78,rad=33,pulse=1+Math.sin(time*4)*0.025;
  var ready=player.bombs>0;
  ctx.save();
  // outer glow
  var glow=ctx.createRadialGradient(bx,by,4,bx,by,60);
  glow.addColorStop(0,ready?'rgba(70,220,255,0.24)':'rgba(90,95,110,0.05)');
  glow.addColorStop(0.55,ready?'rgba(60,120,255,0.10)':'rgba(0,0,0,0)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(bx,by,60,0,TAU);ctx.fill();
  ctx.translate(bx,by);ctx.rotate(-Math.PI/2);
  // beveled octagon filled panel
  ctx.beginPath();
  for(var i=0;i<8;i++){var a=i*TAU/8,rr=rad*pulse,x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.closePath();
  var fill=ctx.createLinearGradient(-rad,-rad,rad,rad);
  if(ready){fill.addColorStop(0,'#0b2940');fill.addColorStop(0.45,'#061725');fill.addColorStop(1,'#04101c');}
  else{fill.addColorStop(0,'#181b22');fill.addColorStop(1,'#0c0e14');}
  ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=ready?'rgba(100,235,255,0.95)':'rgba(100,108,122,0.45)';ctx.lineWidth=2.4;ctx.stroke();
  // outer tick marks
  for(var t=0;t<8;t++){var ta=t*TAU/8,ca=Math.cos(ta),sa=Math.sin(ta);ctx.strokeStyle=ready?'rgba(255,215,120,0.75)':'rgba(100,108,122,0.25)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ca*(rad+5),sa*(rad+5));ctx.lineTo(ca*(rad+10),sa*(rad+10));ctx.stroke();}
  // inner ring
  ctx.strokeStyle=ready?'rgba(255,210,110,0.55)':'rgba(100,108,122,0.25)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,rad-8,0,TAU);ctx.stroke();
  // starburst detonation glyph
  ctx.rotate(Math.PI/2);
  var c=ready?'#9ff6ff':'#727886', cy=-5;
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,cy,3.8,0,TAU);ctx.fill();
  for(var k=0;k<8;k++){
    var aa=k*TAU/8, r0=6.5, r1=(k%2?14:18);
    var ox=Math.cos(aa),oy=Math.sin(aa);
    ctx.beginPath();
    ctx.moveTo(ox*r0-oy*2.2,cy+oy*r0+ox*2.2);
    ctx.lineTo(ox*r1,cy+oy*r1);
    ctx.lineTo(ox*r0+oy*2.2,cy+oy*r0-ox*2.2);
    ctx.closePath();ctx.fill();
  }
  ctx.fillStyle=ready?'#eafcff':'#7b808b';ctx.font='bold 9px "Arial Black", Arial, sans-serif';ctx.textAlign='center';ctx.fillText('BOMB',0,22);
  ctx.fillStyle=ready?'#ffd47a':'#7b808b';ctx.font='bold 9px monospace';ctx.fillText('x'+player.bombs,0,32);
  ctx.textAlign='left';ctx.restore();
}
function draw(){
  resetCanvasState();
  try{drawScene();}
  catch(e){console.error('draw error',e);hardResetCanvas();}
}
function drawScene(){
  ctx.clearRect(0,0,W,H);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  var sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  ctx.save();ctx.translate(sx,sy);
  if(state==='menu'){ drawMenu(); ctx.restore(); return; }
  if(state==='finale'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); drawFinaleScene(); ctx.restore(); return; }
  if(state==='cast'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(2,4,14,0.45)';ctx.fillRect(0,0,W,H); drawCast(); ctx.restore(); return; }
  if(state==='bossDeath1'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); drawPhase1DeathScene(); ctx.restore(); return; }
  if(state==='bossOmen'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(0,0,0,0.84)';ctx.fillRect(0,0,W,H); drawBossOmen(); ctx.restore(); return; }
  if(state==='bossFusion'){
    var fvOK=fusionVideo&&fusionVideo.readyState>=2&&fusionVideo.videoWidth>0;
    if(fvOK&&fusionVideo.paused){try{fusionVideo.play().catch(function(){});}catch(e){}}
    if(fvOK){
      var sh=Math.max(H,W*1280/720),sw=sh*720/1280;
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.drawImage(fusionVideo,(W-sw)/2,(H-sh)/2,sw,sh);ctx.restore();
      ctx.fillStyle='rgba(2,2,12,0.12)';ctx.fillRect(0,0,W,H);
    }else{
      paintFractalBg(BG_MAIN[4],BG_EDGE[4],0);ctx.fillStyle='rgba(2,2,12,0.28)';ctx.fillRect(0,0,W,H);drawFusionScene(bossFusionT);
    }
    if(fusionFadeT>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,fusionFadeT/1.15)+')';ctx.fillRect(0,0,W,H);}
    var fbx=W-104,fby=64,fbw=92,fbh=30;
    ctx.save();ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='rgba(6,10,22,0.58)';ctx.fillRect(fbx,fby,fbw,fbh);
    ctx.strokeStyle='rgba(160,220,255,0.55)';ctx.lineWidth=1;ctx.strokeRect(fbx,fby,fbw,fbh);
    ctx.fillStyle='rgba(160,220,255,0.22)';ctx.fillRect(fbx,fby,fbw*(fusionHoldT/1.1),fbh);
    ctx.fillStyle='#cfeaff';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('HOLD SKIP',fbx+fbw/2,fby+19);
    ctx.textAlign='left';ctx.restore();
    ctx.restore();return;
  }
  if(state==='fusion'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(2,2,12,0.22)';ctx.fillRect(0,0,W,H); drawEntityArrivalScene(); ctx.restore(); return; }
  var bgOff=0;
  if(state==='warpIn'){var wpg=Math.min(1,1-warpT/0.95);bgOff=H*(1-wpg);}
  if(bgOff>0){ctx.fillStyle='#03060e';ctx.fillRect(0,0,W,H);}
  var mainBg=(BG_MAIN[stage]&&BG_MAIN[stage].complete)?BG_MAIN[stage]:bgCurrent,edgeBg=BG_EDGE[stage];
  if(!mainBg||!mainBg.complete||!mainBg.naturalWidth) mainBg=bgCurrent;
  paintStageBg(mainBg,edgeBg,bgOff);
  ctx.fillStyle='rgba(4,6,18,'+(stage===3?0.28:(stage===2?0.10:(stage===0?0.08:0.06)))+')';ctx.fillRect(0,0,W,H);
  for(var i=0;i<stars.length;i++){var st=stars[i];ctx.globalAlpha=0.25+st.z*0.5;ctx.fillStyle='#cfe6ff';ctx.fillRect(st.x,st.y,st.z*1.4,st.z*1.4);}
  ctx.globalAlpha=1;drawBgDust();
  if(state==='warpIn'||state==='warpOut'){
    ctx.save();ctx.globalCompositeOperation='lighter';
    var wi2=state==='warpOut'?1.0:Math.min(1,1-warpT/0.95);
    for(var wi=0;wi<24;wi++){
      var wx=(wi*53+time*420)%W,wh=60+((wi*37)%120);
      ctx.globalAlpha=0.16*wi2;ctx.fillStyle='#9fe8ff';
      ctx.fillRect(wx,0,1.5,wh);ctx.fillRect(wx,H-wh,1.5,wh);
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(boss&&boss.ultCharge>0){
    ctx.save();ctx.strokeStyle='rgba(255,70,70,'+(0.3+0.25*Math.sin(time*18))+')';ctx.lineWidth=7;ctx.strokeRect(3,3,W-6,H-6);ctx.restore();
  }
  var charging=false;
  for(var i=0;i<beams.length;i++) if(beams[i].t<beams[i].charge) charging=true;
  if(charging){ctx.save();ctx.fillStyle='rgba(255,40,40,0.05)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,70,70,'+(0.25+0.15*Math.sin(time*20))+')';ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);ctx.restore();}

  for(var i=0;i<enemies.length;i++) drawEnemy(enemies[i]);
  drawShots();
  drawMissiles();
  for(var i=0;i<bullets.length;i++) drawBullet(bullets[i]);
  for(var i=0;i<ebullets.length;i++) drawEB(ebullets[i]);
  for(var i=0;i<orbBullets.length;i++){
    var ob=orbBullets[i];ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#b58bff';ctx.beginPath();ctx.arc(ob.x,ob.y,ob.rad+3,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ob.x,ob.y,2.2,0,TAU);ctx.fill();ctx.restore();
  }
  drawBoss();
  if(state==='bossAwaken') drawBossAwakenFx();
  drawBossCrossOrb();
  drawPhaseFx();
  drawBeams();
  for(var i=0;i<items.length;i++) drawItem(items[i]);
  for(var i=0;i<fx.length;i++) drawExplosion(fx[i]);
  drawBlastZones();

  drawPlayerLaser();
  drawODLaserFx();
  drawOptions();
  drawWingBeams();
  for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.max(0,p.life/0.8);ctx.fillStyle=p.col;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}
  ctx.globalAlpha=1;

  drawBombFx();
  drawPlayerEntity();
  if(typeof coopDrawP2==='function') coopDrawP2();
  drawPickupMsg();
  drawHUD();
  drawBanner();
  drawEnd();
  ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
}

// pointer input lives in src/platform/web/input.js


window.__beams=function(){return beams.map(function(b){return {ang:+(b.ang*180/Math.PI).toFixed(0),t:+b.t.toFixed(2),charge:b.charge,fire:b.fire,owner:!!b.owner,sweep:b.sweepSpeed||0};});};
window.__orb=function(){return boss&&boss.crossOrb?{x:Math.round(boss.crossOrb.x),y:Math.round(boss.crossOrb.y),t:+boss.crossOrb.t.toFixed(2)}:null;};
window.__g=function(){return {stageT:+stageT.toFixed(1),waveIndex:waveIndex,waveLen:STAGES[stage]?STAGES[stage].waves.length:0,mini:enemies.some(function(e){return !!e.mini;}),state:state,stage:stage,score:score,enemies:enemies.length,bullets:bullets.length,ebullets:ebullets.length,hp:boss?Math.round(boss.hp):0,inv:boss?+(boss.invuln||0).toFixed(2):0,phase:boss?boss.phase:-1,bx:boss?Math.round(boss.x):0,lt:boss?+(boss.laserT.toFixed(1)):0,ut:boss?+(boss.ultT.toFixed(1)):0,uc:boss?+(boss.ultCharge.toFixed(1)):0,style:boss?boss.def.style:'',power:player.specialPower,items:items.length,shots:shots.length,weapon:player.weapon,options:player.options,lives:player.lives,php:player.hp,bombs:player.bombs};};
window.__god=function(){player.invuln=99999;player.noBlink=true;};
window.__stage=function(n){startStage(n);};
  window.__runStage=function(n){startAtStage(n);};
  window.__coop=function(){return {enabled:coopEnabled,mode:coopInputMode,p2:player2?{ship:player2.ship,x:+player2.x.toFixed(0),y:+player2.y.toFixed(0),hp:player2.hp,lives:player2.lives,invuln:+player2.invuln.toFixed(1),bombs:player2.bombs,cloak:phantomState2?+phantomState2.cloakT.toFixed(1):null,charge:aegisState2?aegisState2.charge:null,force:aegisState2?aegisState2.force:null}:null};};
  window.__selectShip=function(id){setSelectedShip(id,false);var sl=skinList(id);setSelectedSkin(id,sl[0].id,false);};
  window.__power=function(n){player.specialPower=Math.max(1,Math.min(4,n|0));player.power=player.specialPower;};
  window.__enemyHp=function(){return enemies.length?enemies[0].hp:null;};
  window.__enemies=function(){return enemies.map(function(e){return {x:e.x,y:e.y,hp:e.hp,type:e.type};});};
  window.__setPlayer=function(x,y){player.x=target.x=x;player.y=target.y=y;};
  window.__dummy=function(hp){enemies.length=0;ebullets.length=0;spawnWave({t:0,type:0,n:1,form:'line',spd:0,noFire:true,aggr:1});var e=enemies[enemies.length-1];if(e){e.x=W/2;e.y=300;e.entering=false;e.vx=0;e.vy=0;e.mode='hold';e.noFire=true;e.hp=hp||999999;e.max=e.hp;}player.x=target.x=W/2;player.y=target.y=H-130;};
window.__boss=function(){if(!boss)spawnBoss();};
window.__form=function(f){spawnWave({t:0,type:f==='escort'?4:2,n:5,form:f,spd:70,noFire:false,aggr:1});};
window.__enemy=function(t){spawnWave({t:0,type:t==null?4:t,n:1,form:'line',spd:0,noFire:false,aggr:1});var e=enemies[enemies.length-1];if(e){e.y=280;e.entering=false;}};
window.__warn=function(){startBossWarn();};
window.__beamTest=function(){
  var e={type:4,x:W/2,y:260,baseX:W/2,tx:W/2,ty:260,mode:'turret',entering:false,t:0,phase:0,spd:0,hp:40,max:40,fireT:99,flash:0,elite:false,role:'',first:false};
  enemies.push(e);spawnBeam(e.x,e.y,Math.PI/2,1500,20,1.0,0.4,1,bossBeamColor(),false,e);
  e.hp=0;removeEnemy(enemies.indexOf(e));return beams.length;
};
window.__beams=function(){return beams.map(function(b){return {t:Math.round(b.t*100)/100,owner:b.owner?b.owner.hp:null};});};
window.__forceBoss=function(){if(state==='play')startBossWarn();};
  window.__clearEnemies=function(){enemies.length=0;};
  window.__killBoss=function(){if(boss)boss.hp=0;};
window.__bossHp=function(f){if(boss)boss.hp=boss.max*f;};
window.__drop=function(t){items.push({x:player.x,y:player.y-80,vy:20,type:t||'P',t:0});};
window.__weapon=function(w){var list=['normal','spread','laser','missile'];player.weapon=list.indexOf(w)>=0?w:'normal';};
window.__od=function(){player.od=0;player.odT=5;};
window.__boom=function(){boom(W/2,H*0.45,1.4);};
window.__beam=function(){spawnBeam(W/2,180,Math.PI/2,1500,16,0.8,0.45,1,'#ff6a5a');};
window.__bossLaser=function(){if(boss)bossLaser();};
window.__bgInfo=function(){return {neb:{c:BG1_NEBULA.complete,w:BG1_NEBULA.naturalWidth,src:BG1_NEBULA.src},early:{c:BG1_EARLIEST.complete,w:BG1_EARLIEST.naturalWidth},main:{c:BG_MAIN[0]?BG_MAIN[0].complete:false,w:BG_MAIN[0]?BG_MAIN[0].naturalWidth:0}};};
window.__bgv=function(){return {ready:bgLoopVideo.readyState,paused:bgLoopVideo.paused,w:bgLoopVideo.videoWidth,t:bgLoopVideo.currentTime,src:bgLoopVideo.currentSrc.slice(-24)};};
window.__cast=function(){startCast();};
window.__castEnd=function(){castScroll=CAST_TOTAL;castHoldT=2;};
window.__p3=function(){if(boss)bossPhase(2);};
window.__fi=function(){return {state:state,fusionT:fusionT,time:time,boss:!!boss};};
window.__ebTest=function(){if(boss){bossAimed(12);bossRing(18);bossSpiral(4,1,120);}};
window.__hit=function(){player.invuln=0;hitPlayer();};
window.__ult=function(){beginBossUltimate();};
window.__bomb=function(){bomb();};
window.__bgmInfo=function(){return {name:bgmName,paused:bgmAudio?bgmAudio.paused:null,time:bgmAudio?bgmAudio.currentTime:0};};
window.__sfxTest=function(){sfx('p_normal',0.4);return window.__audio();};
window.__audio=function(){return {state:AC?AC.state:'none',boosted:audioBoosted,active:sfxActive,samples:Object.keys(SFXBUF),master:master?master.gain.value:0};};
window.__enemies=function(){return enemies.map(function(e){return {t:e.type,x:Math.round(e.x),y:Math.round(e.y),hp:Math.round(e.hp),max:Math.round(e.max),mini:!!e.mini,transport:!!e.transport};});};
window.__damage=function(d){for(var i=0;i<enemies.length;i++) enemies[i].hp=Math.max(1,enemies[i].hp-(d||8));};
window.__item=function(t,x,y){items.push({x:x,y:y,vy:0,type:t,t:0});};
window.__max=function(){player.specialPower=4;player.power=4;};
window.__itemT=function(t,tm,x,y){items.push({x:x||player.x,y:y||player.y-90,vy:0,type:t,t:tm||0});};
if(typeof initSaveStore==='function') initSaveStore();
var last=performance.now(),fixedStep=new FixedStep(1/60,4);
function frame(now){
  var dt=Math.min(0.05,(now-last)/1000);last=now;
  try{
    if(typeof desktopPoll==='function') desktopPoll();
    if(!desktopPaused) fixedStep.advance(dt,function(fixedDt){step(fixedDt);});
    draw();
    if(typeof drawDesktopPause==='function') drawDesktopPause();
  }catch(e){ console.error('frame error',e); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
