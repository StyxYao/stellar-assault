(function(){
  try{
    var st=document.createElement('style');
    st.textContent="@font-face{font-family:'Orbitron';src:url('assets/fonts/orbitron-600.ttf') format('truetype');font-weight:600;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-500.ttf') format('truetype');font-weight:500;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-600.ttf') format('truetype');font-weight:600;font-display:swap}";
    document.head.appendChild(st);
    if(document.fonts&&document.fonts.load){document.fonts.load('600 20px Orbitron');document.fonts.load('600 20px Rajdhani');}
  }catch(e){}
})();
var player={x:W/2,y:H-130,r:6,lives:3,hp:3,maxHp:3,bombs:2,od:0,odT:0,powerXp:0,respawnT:0,respawnGift:false,invuln:0,bank:0,noBlink:false,power:1,weapon:'normal',specialPower:1,options:0,wingPower:1,trail:[],wingEntry:[]};
var target={x:W/2,y:H-130};
var stage=0,state='menu',score=0,time=0,lastShot=0,lastHitSfx=0,shake=0;
var enemies=[],bullets=[],shots=[],parts=[],stars=[],fx=[],ebullets=[],items=[],missiles=[],wingBeams=[],beams=[],orbBullets=[],phaseFx=[],blastZones=[],odLaserFx=[];
var lastMissile=0,lastSpecial=0,optionT=0,laserTick=0,laserHitY=0,laserHitT=0,pickupMsg='',pickupT=0;
var audioReady=false;
var boss=null,runner=null,bossFusionT=0,bossFusionOn=false,bossOmenT=0,selectedStage=0,bossDeath1T=0,bossAwakenT=0,SIG_BOSS=-1;
var fusionHoldT=0,fusionHoldActive=false,fusionFadeT=0,stageT=0,waveIndex=0,nextTransport=0,banner='',bannerSub='',bannerT=0,castT=0,castScroll=0,castHoldT=0,fusionT=0,finaleT=0;
var bgCurrent=BG1,bgPrev=null,bgFade=0,stageFlash=0,stageWarp=0,warpT=0,warpSpeed=0,glowWarp=0,bombT=0,bombX=0,bombY=0;
var bgScroll=0,bgEdgeScroll=0,bgDust=[];var BG_MAIN=[],BG_EDGE=[];
var BG4=new Image();BG4.src='assets/bg/stage4-main.webp';
var phaseMaskCv=null,phaseMaskCtx=null,BG_FIRST_CV=null,PHASE_FIRST_CVS={};
// web video elements/host/priming live in src/platform/web/video.js
var BG5=new Image();BG5.src='assets/bg/stage5-main.webp';
var BG1_BH=new Image();BG1_BH.src='assets/bg/stage1-bh.webp';
var BG1_EARLIEST=new Image();BG1_EARLIEST.src='assets/bg/stage1-earliest.webp';
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
  var bossBomb=!!e.bossBomb,rad=bossBomb?118:72;
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
function startCast(){
  state='cast';castT=0;castScroll=0;castHoldT=0;
  playBgm('s5ending');
}
function setBanner(txt,sub,t){ banner=txt; bannerSub=sub||''; bannerT=t; }

function resetRun(){
  score=0; player.lives=3; player.hp=3; player.bombs=2; player.od=0; player.odT=0; player.powerXp=0; player.respawnT=0; player.respawnGift=false; player.noBlink=false; player.power=1; player.weapon='normal'; player.specialPower=1; player.options=0; player.wingPower=1; player.trail=[]; player.wingEntry=[]; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0;
}
function startGame(){
  resetRun();
  startStage(0);
}
function startAtStage(i){
  i=Math.max(0,Math.min(STAGES.length-1,i|0));
  resetRun();
  // stage-select loadout: enough power to actually play the final stage
  player.power=Math.min(4,1+i*0.8);
  player.specialPower=Math.min(4,1+i);
  player.wingPower=Math.min(4,1+i);
  player.options=Math.min(3,i);
  player.bombs=i>=4?3:2;
  startStage(i);
}
function startStage(i){
  stage=i; stageT=0; waveIndex=0; nextTransport=24+Math.random()*10;
  enemies.length=0; bullets.length=0; ebullets.length=0; shots.length=0; fx.length=0; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0; phaseFx.length=0; blastZones.length=0; odLaserFx.length=0; player.trail=[];
  boss=null; runner=null; phaseFx.length=0;
  setStageBg(STAGES[i].bg);bgScroll=0;bgEdgeScroll=0;
  state='warpIn'; warpT=0.95; glowWarp=1.5; bombT=0; pickupT=0; pickupMsg='';
  player.x=target.x=W/2; player.y=H+90; target.y=H-130; player.invuln=2.0; player.bank=0;
  stopBgm();bgmPending='';playBgm(STAGES[i].bgm);
  playWarpJet(0.8);
}
function startBossWarn(){
  stopBgm(); playAirRaid(0.55);
  state='bossWarn'; setBanner('WARNING',BOSSES[stage].name,2.8); player.invuln=0;
  ebullets.length=0; bullets.length=0; orbBullets.length=0;
  for(var i=0;i<enemies.length;i++){part(enemies[i].x,enemies[i].y,'#ffb066',6,120);enemyDeath(enemies[i]);}
  enemies.length=0;
}
function spawnBoss(){
  if(state==='fusion') return;
  if(stage===4){ startBossFusion(); return; }
  spawnBossNow();
}
function startBossFusion(){
  state='fusion';fusionT=0;boss=null;runner=null;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;
  player.invuln=Math.max(player.invuln,1.2);
  playBgm('s5boss');
  sfx('b_charge',0.50);
}
function spawnBossNow(){
  var def=BOSSES[stage];
  var hpMul=stage===0?1.10:(stage===1?1.10:(stage===2?0.90:1.0));
  var finalMul=stage===4?1.5:1;
  var bhp=Math.round(def.hp*1.4*hpMul*finalMul);
  boss={def:def,x:W/2,y:-130,hp:bhp,max:bhp,phase:0,invuln:1.2,entering:true,t:0,flash:0,patternIdx:0,patternT:0,aimT:0,ringT:0,laserT:0,hitFlash:0,hitX:W/2,hitY:180,ultT:def.ultRate-2.2,ultCharge:0,spiralT:0,spiralAng:0,broadT:0,blinkT:0,bossSigT:0};
  if(stage===4){boss.y=H*.44;boss.entering=false;boss.invuln=1.6;boss.totalHp=bhp;boss.max=Math.round(bhp*.36);boss.hp=boss.max;}
  if(stage===2) repairAudio();
  state='boss'; playBgm(['c','s2boss','s3boss','s4boss','s5boss'][stage]||'c'); setBossPattern(0);
}
function startBossOmen(){
  state='bossOmen';bossOmenT=0;boss=null;runner=null;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;enemies.length=0;
  phaseFx.length=0;
}
function startBossPhase1Death(){
  state='bossDeath1';bossDeath1T=0;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;enemies.length=0;
  player.invuln=99;if(boss)bossDeathBoom(boss,true);
  if(boss) for(var i=0;i<34;i++){
    var a=rand(0,TAU),v=rand(80,460);
    part(boss.x+Math.cos(a)*rand(0,60),boss.y+Math.sin(a)*rand(0,45),
      ['#fff6d8','#ffe7a0','#ff9a3a','#c9a6ff'][i%4],rand(2,5),v);
  }
  sfx('bomb_big',1.0);
}
function drawPhase1DeathScene(){
  var t=bossDeath1T,cx=W/2,cy=H*.26;
  var q=Math.min(1,t/2.7);
  ctx.save();
  // the crystal field starts to dim only after the first flash
  ctx.fillStyle='rgba(2,1,8,'+(0.05+0.72*Math.max(0,(q-.28)/.72))+')';
  ctx.fillRect(0,0,W,H);
  var flash=Math.max(0,1-t/.55);
  if(flash>0){
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=flash*.90;
    var fg=ctx.createRadialGradient(cx,cy,0,cx,cy,H*.55);
    fg.addColorStop(0,'rgba(255,255,255,1)');fg.addColorStop(.22,'rgba(255,244,210,.75)');
    fg.addColorStop(.55,'rgba(190,140,255,.28)');fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,'+(flash*.34)+')';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  // expanding shock rings and broken Hedron
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var k=0;k<7;k++){
    var rr=(t*260+k*28)%(H*.7),al=Math.max(0,1-rr/(H*.7))*.28;
    ctx.globalAlpha=al;ctx.strokeStyle=k%2?'#ffe7a0':'#b58bff';ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
  var hed=GIMG.hrA||GIMG.np1;
  if(hed&&hed.complete&&t<1.7){
    var alpha=Math.max(0,1-t/1.55),sz=260+(t*70);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*.92;
    ctx.translate(cx,cy);ctx.rotate(time*.5);ctx.drawImage(hed,-sz/2,-sz/2,sz,sz);
    ctx.restore();ctx.globalAlpha=1;
  }
  // shard burst
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var i=0;i<22;i++){
    var a=i/22*TAU+Math.sin(i*3.1)*.2,rr=18+t*(150+((i*47)%160));
    var s=2.8+((i*13)%4);
    ctx.globalAlpha=Math.max(0,.8-t/2.4);ctx.fillStyle=i%3?'#fff0c0':(i%3===1?'#ff7e8e':'#c9a6ff');
    ctx.save();ctx.translate(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);ctx.rotate(a*2+t);ctx.fillRect(-s/2,-s*1.8,s,s*3.6);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
  for(var i=0;i<fx.length;i++) drawExplosion(fx[i]);
  for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.col;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}
  ctx.globalAlpha=1;
  ctx.restore();
}
function startBossFusionCinematic(){
  state='bossFusion';bossFusionT=0;
  try{fusionVideo.currentTime=0;fusionVideo.play().catch(function(){});}catch(e){}
  fusionFadeT=1.15;fusionHoldT=0;fusionHoldActive=false;
  setBanner('FUSION','FOUR ECHOES',9.0);
  sfx('b_charge',0.65);
}
function finishBossFusionPhase(){
  state='boss';bossFusionT=0;
  spawnBossNow();
  boss.phase=1;boss.max=Math.round(10080*.64);boss.hp=boss.max;
  boss.y=H*.44;boss.entering=false;boss.invuln=2.2;
  state='bossAwaken';bossAwakenT=2.6;boss.bossSigT=0;
  bullets.length=0;ebullets.length=0;beams.length=0;orbBullets.length=0;
  player.invuln=Math.max(player.invuln,2.8);
  setBanner('CHRONOS ECHO','FUSED FORM',2.4);
}
function drawBossAwakenFx(){
  var q=Math.max(0,Math.min(1,1-bossAwakenT/2.6));
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // white impact at the instant the ring locks
  var flash=Math.max(0,1-q/.34);
  if(flash>0){ctx.globalAlpha=flash*.55;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);}
  for(var k=0;k<5;k++){
    var rr=80+q*(140+k*32);
    ctx.globalAlpha=(1-q)*.32*(1-k*.12);
    ctx.strokeStyle=k%2?'#ffe7b0':'#b58bff';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
  }
  // inward shards
  ctx.globalAlpha=(1-q)*.7;
  for(var i=0;i<18;i++){
    var a=i/18*TAU+time*.2,rr=40+(i%5)*14+q*90;
    ctx.fillStyle=i%2?'#fff2c8':'#d8b8ff';
    ctx.save();ctx.translate(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);ctx.rotate(a*2.2+q*4);ctx.fillRect(-1.2,-5,2.4,10);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}

function setBossPattern(idx){
  if(!boss||!specs) return;
  var list=boss.def.patterns, xi=list[idx%list.length];
  boss.patternIdx=idx%list.length; boss.patternT=0;
  runner=specs[xi].createRunner({
    rank:0.72+stage*0.04,target:player,speedRate:1.42+stage*0.08,
    createNewBullet:function(r){
      if(bullets.length>230) return;
      var b={r:r,x:r.x,y:r.y,rad:4.2,dead:false};
      r.onVanish=function(){b.dead=true;};
      bullets.push(b);
    }
  });
  runner.x=boss.x; runner.y=boss.y;
}
function bossPhase(p){
  for(var ub=beams.length-1;ub>=0;ub--) if(beams[ub].ult) beams.splice(ub,1);
  boss.phase=p; boss.invuln=1.6; boss.hitFlash=0; boss.ultT=boss.def.ultRate-2.2; boss.ultCharge=0; boss.spiralT=0; boss.broadT=0; boss.blinkT=0; boss.aimT=0; boss.ringT=0; boss.laserT=0;
  boom(boss.x,boss.y,1.5); shake=Math.max(shake,14);
  phaseFx.push({x:boss.x,y:boss.y,t:0,life:1.35,kind:'phase',phase:p});
  setBanner('PHASE '+(p+1),boss.def.name,1.6);
  setBossPattern(0);
}
function bomb(){
  if((state!=='play'&&state!=='boss')||player.bombs<=0) return;
  player.bombs--; shake=24; bombT=1.1; bombX=player.x; bombY=player.y; player.invuln=Math.max(player.invuln,0.8); sfx('b_charge',0.55); sfx('bomb_big',0.95);
  for(var bp=0;bp<42;bp++) part(bombX,bombY,bp%2?'#bff4ff':'#ffd28a',1,320);
  for(var i=0;i<bullets.length;i++) part(bullets[i].x,bullets[i].y,'#9fe8ff',1,150);
  for(var i=0;i<ebullets.length;i++) part(ebullets[i].x,ebullets[i].y,'#9fe8ff',1,110);
  bullets.length=0; ebullets.length=0; beams.length=0; orbBullets.length=0;
  for(var i=enemies.length-1;i>=0;i--){
    enemies[i].hp-=999;
    if(enemies[i].hp<=0){ part(enemies[i].x,enemies[i].y,'#ffb066',10,180); enemyDeath(enemies[i]); score+=ET[enemies[i].type].score; maybeDrop(enemies[i]); removeEnemy(i); }
  }
  if(boss){ boss.hp-=120; boss.flash=0.2; }
}
function hitPlayer(){
  if(player.invuln>0||state!=='play'&&state!=='boss') return;
  if(player.options>0){
    var wi=0,bestY=1e9;
    for(var oi=0;oi<player.options;oi++){
      var op=optionPos(oi);
      if(op.y<bestY){bestY=op.y;wi=oi;}
    }
    var wp=optionPos(wi);
    player.options--; player.wingEntry.splice(wi,1);
    player.invuln=1.0; shake=8; sfx('hurt',0.55);
    part(wp.x,wp.y,'#7fe7ff',14,170); boom(wp.x,wp.y,0.45);
    pickupT=0.9; pickupMsg='WINGMAN SHIELD';
    for(var i=bullets.length-1;i>=0;i--){var dx=bullets[i].x-player.x,dy=bullets[i].y-player.y;if(dx*dx+dy*dy<110*110) bullets.splice(i,1);}
    for(var i=ebullets.length-1;i>=0;i--){var dx=ebullets[i].x-player.x,dy=ebullets[i].y-player.y;if(dx*dx+dy*dy<110*110) ebullets.splice(i,1);}
    return;
  }
  player.hp--;
  player.invuln=1.0; shake=10; sfx('hurt',0.75);
  for(var i=bullets.length-1;i>=0;i--){
    var dx=bullets[i].x-player.x,dy=bullets[i].y-player.y;
    if(dx*dx+dy*dy<110*110) bullets.splice(i,1);
  }
  for(var i=ebullets.length-1;i>=0;i--){
    var dx=ebullets[i].x-player.x,dy=ebullets[i].y-player.y;
    if(dx*dx+dy*dy<110*110) ebullets.splice(i,1);
  }
  part(player.x,player.y,'#ffba6a',10,160);
  if(player.hp<=0){
    var atMin=player.specialPower<=1;
    var dX=player.x,dY=player.y;
    player.lives--; player.hp=3; player.invuln=2.2; shake=18;
    player.specialPower=Math.max(1,player.specialPower-1); player.power=player.specialPower; player.powerXp=0; player.od=0; player.odT=0; player.bombs=2; player.options=0; player.wingEntry=[];
    rebuildSfxBus();
    player.respawnT=1.3; player.respawnGift=atMin;
    player.x=W/2; player.y=H-130; target.x=player.x; target.y=player.y;
    boom(dX,dY,1.5,'player');
    if(player.lives<=0){ player.respawnT=0; state='over'; playBgm('m5'); }
  }
}
function removeEnemy(idx){
  var e=enemies[idx];if(!e) return;
  for(var b=beams.length-1;b>=0;b--) if(beams[b].owner===e) beams.splice(b,1);
  for(var o=orbBullets.length-1;o>=0;o--) if(orbBullets[o].owner===e) orbBullets.splice(o,1);
  enemies.splice(idx,1);
}
function maybeDrop(e){
  if(e.transport){
    items.push({x:e.x-24,y:e.y,vy:45,type:'P',t:0});
    items.push({x:e.x,y:e.y,vy:45,type:'P',t:0});
    items.push({x:e.x+24,y:e.y,vy:45,type:'W',t:0});
    items.push({x:e.x,y:e.y+16,vy:45,type:'B',t:0});
    if(Math.random()<0.21) items.push({x:e.x+12,y:e.y+24,vy:40,type:'1UP',t:0});
    return;
  }
  if(e.transport) return;
  if(e.elite){
    items.push({x:e.x-20,y:e.y,vy:50,type:'W',t:0});
    items.push({x:e.x+20,y:e.y,vy:50,type:'P',t:0});
    if(Math.random()<0.165) items.push({x:e.x,y:e.y+20,vy:45,type:'1UP',t:0});
    return;
  }
  var chance=([0.10,0.14,0.16,0.35,0.28,0.14][e.type]||0.10)*0.75;
  if(!e.first && Math.random()>=chance) return;
  var r=Math.random(),type;
  if(r<0.40) type='P';
  else if(r<0.52) type='W';
  else if(r<0.66) type='B';
  else if(r<0.96) type='A';
  else type='1UP';
  if(e.first && type==='B') type='P';
  items.push({x:e.x,y:e.y,vy:55,type:type,t:0});
}
function playOneUp(){
  if(!AC||muted) return;
  // bright piano-like arpeggio with soft attack and bell harmonics
  var notes=[1046.5,1318.5,1568.0,2093.0];
  for(var i=0;i<notes.length;i++){
    var f=notes[i],at=i*0.065;
    tone(f,f,0.30,0.16,'triangle',at);
    tone(f*2,f*2,0.18,0.045,'sine',at);
    tone(f*0.5,f*0.5,0.22,0.035,'sine',at);
  }
  noiseBurst(0.025,0.045,5000,0.01);
}
function ammoType(it){ return ['N','S','L','M'][Math.floor(it.t/1.2)%4]; }
function nextAmmoLetter(){var order=['normal','spread','laser','missile'],i=order.indexOf(player.weapon);return ['N','S','L','M'][(i+1)%4];}
function applySpecial(t){
  player.weapon=t==='N'?'normal':(t==='S'?'spread':(t==='L'?'laser':(t==='M'?'missile':t)));
}
function gainOD(n){
  if(player.odT>0){player.odT=Math.min(5.0,player.odT+n*0.02);return false;}
  player.od=Math.min(100,player.od+n);
  if(player.od>=100){player.od=0;player.odT=5.0;sfx('b_charge',0.34);return true;}
  return false;
}
function collectItem(it){
  var t=it.type;
  if(t==='P'){
    if(player.specialPower<4){
      player.powerXp++;
      if(player.powerXp>=2){player.specialPower++;player.powerXp=0;player.power=player.specialPower;pickupMsg='POWER LV'+player.specialPower+(player.specialPower>=4?' MAX':'');}
      else pickupMsg='POWER CHARGE '+player.powerXp+'/2';
    }else{pickupMsg=gainOD(25)?'OVERDRIVE!':'OD +25%';}
    score+=50;
  }else if(t==='A'){
    var at=ammoType(it);applySpecial(at);score+=70;pickupMsg='WEAPON · '+weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':'');
  }else if(t==='S'||t==='L'||t==='M'){ applySpecial(t); score+=80; pickupMsg=weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':''); }
  else if(t==='W'){
    if(player.options<4||player.wingPower<3){addWingman();pickupMsg='WING '+player.options+' P'+player.wingPower;}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'WING MAX +15 OD';}
    score+=40;
  }else if(t==='1UP'){
    if(player.lives<7){player.lives++;pickupMsg='1UP  LIFE +1';}
    else{pickupMsg=gainOD(25)?'OVERDRIVE!':'LIFE MAX +25 OD';}
    score+=250;
  }else{
    if(player.bombs<5){player.bombs++;pickupMsg='BOMB +1';}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'BOMB MAX +15 OD';}
    score+=30;
  }
  part(it.x,it.y,'#9fe8ff',10,120);
  sfx('pickup_real',0.48); if(t==='1UP') playOneUp();
  pickupT=1.4;
}
function updateWingBeams(dt){
  for(var i=wingBeams.length-1;i>=0;i--){wingBeams[i].t+=dt;if(wingBeams[i].t>=wingBeams[i].life)wingBeams.splice(i,1);}
}
function spawnBeam(x,y,ang,len,w,charge,fire,dmg,color,big,owner,ult){
  if(beams.length>8) return;
  if(owner&&owner!==boss&&(owner.hp<=0||enemies.indexOf(owner)<0)) return;
  if(owner===boss&&(!boss||boss.hp<=0)) return;
  var b={x:x,y:y,ang:ang,len:len,w:w,t:0,charge:charge,fire:fire,dmg:dmg,color:color||bossBeamColor(),fired:false,fade:0.15,owner:owner||null,ult:!!ult,offX:owner?(x-owner.x):0,offY:owner?(y-owner.y):0};
  beams.push(b);
  sfx(big?'b_charge':'e_charge',big?0.38:0.22);
  return b;
}
function bossLaser(){
  if(!boss||boss.invuln>0) return;
  var n=boss.def.laserN||1,a=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<n;i++) spawnBeam(boss.x,boss.y+10,a+(i-(n-1)/2)*0.18,1500,22,1.3,0.45,1,bossBeamColor(),true,boss);
  sfx('laser',0.06);
}
function laserDamageOD(){
  var w=28+Math.min(player.specialPower,3)*5;
  var base=(2+player.specialPower*2)*powerDamageFactor();
  var mainDmg=base*2.0,firstDmg=base*0.50*2.0,secondDmg=base*0.25*2.0;
  var mainHits=[],firstHits=[],hitSet=[],topY=player.y;
  function damageEnemy(e,d){e.hp-=d;e.flash=0.1;if(e.hp<=0)e._odDead=true;}
  // main column
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(e._odDead) continue;
    if(Math.abs(e.x-player.x)<w/2+enemyW(e)*0.34&&e.y<player.y){
      if(e.y<topY)topY=e.y;
      mainHits.push({x:e.x,y:e.y});
      hitSet.push(e);damageEnemy(e,mainDmg);
    }
  }
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-player.x)<w/2+boss.def.w*0.18*1.15&&boss.y<player.y){
    boss.hp-=mainDmg*0.72;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+18;
    mainHits.push({x:boss.x,y:boss.y});
    if(boss.y<topY)topY=boss.y;
  }
  // first refraction: from each main hit to nearby enemies
  for(var m=0;m<mainHits.length&&m<4;m++){
    var src=mainHits[m],picked=[];
    for(var j=0;j<enemies.length;j++){
      var q=enemies[j];if(q._odDead||hitSet.indexOf(q)>=0) continue;
      if(Math.hypot(q.x-src.x,q.y-src.y)<245) picked.push(q);
    }
    picked.sort(function(a,b){return Math.hypot(a.x-src.x,a.y-src.y)-Math.hypot(b.x-src.x,b.y-src.y);});
    for(var j=0;j<picked.length&&j<3;j++){
      var q=picked[j];hitSet.push(q);damageEnemy(q,firstDmg);
      firstHits.push({x:q.x,y:q.y});
      odLaserFx.push({x1:src.x,y1:src.y,x2:q.x,y2:q.y,t:0,life:0.20,level:1});
    }
  }
  // second refraction
  for(var m=0;m<firstHits.length&&m<8;m++){
    var src2=firstHits[m],picked2=[];
    for(var j=0;j<enemies.length;j++){
      var q=enemies[j];if(q._odDead||hitSet.indexOf(q)>=0) continue;
      if(Math.hypot(q.x-src2.x,q.y-src2.y)<235) picked2.push(q);
    }
    picked2.sort(function(a,b){return Math.hypot(a.x-src2.x,a.y-src2.y)-Math.hypot(b.x-src2.x,b.y-src2.y);});
    for(var j=0;j<picked2.length&&j<2;j++){
      var q=picked2[j];hitSet.push(q);damageEnemy(q,secondDmg);
      odLaserFx.push({x1:src2.x,y1:src2.y,x2:q.x,y2:q.y,t:0,life:0.24,level:2});
    }
  }
  // cleanup dead after all chained damage
  for(var i=enemies.length-1;i>=0;i--){
    var e=enemies[i];if(e._odDead){var et=ET[e.type];score+=et.score;part(e.x,e.y,'#ffb066',10,170);enemyDeath(e);maybeDrop(e);removeEnemy(i);}
  }
  laserHitY=topY;laserHitT=0.10;
  if(time-lastHitSfx>0.08){lastHitSfx=time;weaponHitFx(0.12);}
}

function laserDamage(dt){
  laserTick-=dt; if(laserTick>0) return; laserTick=0.08;
  if(player.odT>0){ laserDamageOD(); return; }
  var w=8+Math.min(player.specialPower,3)*5,dmg=(2+player.specialPower*2)*powerDamageFactor();
  var target=null,tIdx=-1,tY=0;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-player.x)<w/2+enemyW(e)*0.32&&e.y<player.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  var isBoss=false;
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-player.x)<w/2+boss.def.w*0.24*1.15&&boss.y<player.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  laserHitY=target?tY:0;laserHitT=target?0.12:0;
  if(!target) return;
  if(isBoss){
    boss.hp-=dmg*0.7;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+20;sfx('b_hit',0.22);
    if(time-lastHitSfx>0.12){lastHitSfx=time;sfx('b_hit',0.1);}
  }else{
    var et=ET[target.type];target.hp-=dmg;target.flash=0.1;weaponHitFx(0.12);
    if(target.hp<=0){score+=et.score;part(target.x,target.y,'#ffb066',9,160);enemyDeath(target);maybeDrop(target);removeEnemy(tIdx);}
  }
}
function optionBasePos(i){
  var offs=[{x:-36,y:-30},{x:36,y:-30},{x:-52,y:22},{x:52,y:22}];
  var o=offs[i]||{x:0,y:-8};
  return {x:player.x+o.x,y:player.y+o.y};
}
function optionPos(i){
  var e=player.wingEntry[i];
  if(e&&e.t<e.dur) return {x:e.x,y:e.y};
  return optionBasePos(i);
}
function addWingman(){
  if(player.options<4){
    var i=player.options,side=i%2===0?-1:1;
    player.wingEntry[i]={x:side<0?-50:W+50,y:rand(180,H*0.65),t:0,dur:0.8};
    player.options++;
  }else player.wingPower=Math.min(3,player.wingPower+1);
}
function updateWingEntries(dt){
  for(var i=0;i<player.options;i++){
    var e=player.wingEntry[i];if(!e||e.t>=e.dur) continue;
    e.t+=dt;var p=optionBasePos(i),k=Math.min(1,dt*8);
    e.x+=(p.x-e.x)*k;e.y+=(p.y-e.y)*k;
  }
}
function wingmanBlock(x,y,rad){
  // Wingmen are immune to bullets; they only absorb a hit on the main ship.
  return false;
}
function updateOptions(dt){
  if(player.options<=0) return;
  if(state!=='play'&&state!=='boss') return;
  optionT-=dt;
  if(optionT<=0){
    optionT=(player.weapon==='laser'?0.22:0.24)/(player.odT>0?1.25:1);
    for(var i=0;i<player.options;i++){
      var we=player.wingEntry[i];if(we&&we.t<we.dur) continue;
      var p=optionPos(i),wp=player.wingPower,max=player.specialPower>=4;
      if(player.weapon==='spread'){
        var n=2+wp;
        for(var j=0;j<n;j++){
          var a=(j-(n-1)/2)*0.16;
          addShot(p.x,p.y-8,Math.sin(a)*820,-Math.cos(a)*820,max?1.7:1.2,true,false,false,max);
        }
      }else if(player.weapon==='laser'){
        fireWingLaser(p,wp,player.specialPower>=4);
      }else if(player.weapon==='missile'){
        spawnMissile(p.x,p.y-6,true,max?4:3,max);
      }else{
        var n2=1+wp;
        for(var j=0;j<n2;j++) addShot(p.x+(j-(n2-1)/2)*6,p.y-8,0,-900,max?1.7:1.2,true,false,false,max);
      }
    }
  }
}
function updateMissiles(dt){
  for(var i=missiles.length-1;i>=0;i--){
    var m=missiles[i];m.t+=dt;m.life-=dt;
    if(m.t<m.ignite){
      m.vy+=260*dt;m.vx*=0.96;m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(m.life<=0||m.y>H+30) missiles.splice(i,1);
      continue;
    }
    if(!m.ignited){m.ignited=true;m.vy=-180;m.vx*=0.5;part(m.x,m.y,'#ffd28a',4,90);}
    var tx=null,ty=null,best=1e9;
    for(var j=0;j<enemies.length;j++){
      var dx=enemies[j].x-m.x,dy=enemies[j].y-m.y,d2=dx*dx+dy*dy;
      if(d2<best){best=d2;tx=enemies[j].x;ty=enemies[j].y;}
    }
    if(boss&&state==='boss'){
      var bx=boss.x-m.x,by=boss.y-m.y,b2=bx*bx+by*by;
      if(b2<best){best=b2;tx=boss.x;ty=boss.y;}
    }
    if(tx!==null){
      var des=Math.atan2(ty-m.y,tx-m.x),cur=Math.atan2(m.vy,m.vx),diff=Math.atan2(Math.sin(des-cur),Math.cos(des-cur));
      cur+=Math.max(-4.5*dt,Math.min(4.5*dt,diff));
      m.vx=Math.cos(cur)*380;m.vy=Math.sin(cur)*380;
    }else{m.vy=Math.min(m.vy, -300);}
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    var hit=false;
    for(var j=enemies.length-1;j>=0;j--){
      var e=enemies[j],et=ET[e.type];
      if(Math.abs(m.x-e.x)<enemyW(e)*0.45&&Math.abs(m.y-e.y)<enemyW(e)*0.5){
        e.hp-=m.dmg;e.flash=0.1;hit=true;weaponHitFx(0.20);boom(m.x,m.y,0.5);
        if(e.hp<=0){score+=et.score;part(e.x,e.y,'#ffb066',9,160);enemyDeath(e);maybeDrop(e);removeEnemy(j);}
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0&&Math.abs(m.x-boss.x)<boss.def.w*0.32*1.15&&Math.abs(m.y-boss.y)<boss.def.h*0.36*1.15){
      boss.hp-=m.dmg;boss.hitFlash=0.14;boss.hitX=m.x;boss.hitY=m.y;hit=true;score+=5;sfx('b_hit',0.30);boom(m.x,m.y,0.6);
      part(m.x,m.y,'#ffd28a',3,80);
    }
    if(hit||m.life<=0||m.x<-30||m.x>W+30||m.y<-40||m.y>H+40) missiles.splice(i,1);
  }
}
function updateBeams(dt){
  for(var i=beams.length-1;i>=0;i--){
    var b=beams[i];b.t+=dt;
    if(b.owner){var alive=(b.owner===boss)?!!(boss&&boss.hp>0):(enemies.indexOf(b.owner)>=0&&b.owner.hp>0);if(!alive){beams.splice(i,1);continue;}
      if(b.t<b.charge+b.fire){var oo=b.owner;b.x=oo.x+b.offX;b.y=oo.y+b.offY;}
    }
    if(b.fan){
      b.fan.base+=b.fan.turn*dt;
      var fOpen=b.fan.min+(b.fan.max-b.fan.min)*(0.5+0.5*Math.sin(b.t*b.fan.rate+b.fan.phase));
      b.ang=b.fan.base+b.fan.side*fOpen;
    }
    if(b.sweepSpeed){b.ang+=b.sweepSpeed*dt;}
    if(!b.fired&&b.t>=b.charge){b.fired=true;sfx('laser_fire',b.w>16?0.50:0.38);}
    if(b.t>b.charge&&b.t<=b.charge+b.fire){
      var dx=player.x-b.x,dy=player.y-b.y;
      var proj=dx*Math.cos(b.ang)+dy*Math.sin(b.ang);
      var perp=Math.abs(-dx*Math.sin(b.ang)+dy*Math.cos(b.ang));
      if(proj>0&&proj<b.len&&perp<b.w/2+player.r) hitPlayer();
    }
    if(b.t>b.charge+b.fire+(b.fade||0.15)) beams.splice(i,1);
  }
}


function spawnTransport(){
  var side=Math.random()<0.5?-1:1;
  enemies.push({type:3,x:side<0?-70:W+70,y:135,baseX:W/2,mode:'transport',vx:side*95,hp:180+stage*40,max:180+stage*40,t:0,phase:0,spd:0,fireT:999,flash:0,transport:true,first:false});
}
function spawnWave(w){
  if(w.form==='mid'){
    var mhp=Math.round((320+stage*80)*0.85);
    enemies.push({type:w.type,x:W/2,y:-60,baseX:W/2,tx:W/2,ty:250,mode:'turret',entering:true,t:0,phase:0,spd:80,hp:mhp,max:mhp,fireT:1.0,flash:0,elite:true,visT:0,first:true});
    return;
  }
  if(w.form==='escort'){
    var lead={type:w.type||4,x:W/2,y:-70,baseX:W/2,tx:W/2,ty:230,mode:'escortLead',entering:false,t:0,phase:0,spd:w.spd||65,hp:Math.round(ET[w.type||4].hp*2.2*0.85),max:Math.round(ET[w.type||4].hp*2.2*0.85),fireT:1.2,flash:0,noFire:false,aggr:1,role:'',visT:0,elite:true,first:true};
    enemies.push(lead);
    for(var k=0;k<4;k++){
      var oa0=k/4*TAU,chx=lead.x+Math.cos(oa0)*58,chy=lead.y+Math.sin(oa0)*34;var ch={type:k%2?5:0,x:chx,y:chy,baseX:lead.x,tx:lead.x,ty:lead.y,mode:'escortOrbit',leader:lead,entering:false,t:0,phase:oa0,spd:90,hp:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),max:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),fireT:1.0+k*0.2,flash:0,noFire:false,aggr:0.8,role:'',visT:0,first:false};
      enemies.push(ch);
    }
    return;
  }
  var n=w.n;
  for(var i=0;i<n;i++){
    var x,y,baseX,tx,ty,mode='down',vx=0,vy=0;
    if(w.form==='v'){ x=W/2+(i-(n-1)/2)*32; y=-50-i*16; baseX=x; }
    else if(w.form==='line'){ x=W*0.15+i*(W*0.7/Math.max(1,n-1)); y=-50-i*12; baseX=x; }
    else if(w.form==='snake'){ x=W/2; y=-50-i*28; baseX=W/2; mode='snake'; }
    else if(w.form==='pincer'){
      var side=i%2?-1:1; x=side<0?-30:W+30; y=110+Math.floor(i/2)*34;
      tx=W/2+side*60; ty=220+Math.floor(i/2)*18; baseX=tx; mode='pincer';
    }
    else if(w.form==='turret'){ x=W*0.2+i*(W*0.6/Math.max(1,n-1)); y=-50; tx=x; ty=230+i*12; baseX=x; mode='turret'; }
    else if(w.form==='arc'){ var sd=i%2?-1:1; x=sd<0?-30:W+30; y=60+i*22; tx=W/2+sd*42; ty=200+i*18; baseX=tx; mode='arc'; }
    else if(w.form==='cross'){ var cr=i%4; x=(cr%2?W+30:-30); y=(cr<2?-30:110); tx=W/2; ty=H*0.5; baseX=x; mode='cross'; }
    else if(w.form==='strafe'){ var ss=i%2?-1:1; x=ss<0?-30:W+30; y=145+i*24; baseX=x; mode='strafe'; vx=ss*(95+stage*8); }
    else if(w.form==='feint'){ x=W*0.2+i*(W*0.6/Math.max(1,n-1)); y=-50; baseX=x; mode='feint'; }
    else if(w.form==='orbit'){ var oa=i/n*TAU,ox=W/2+Math.cos(oa)*150,oy=280+Math.sin(oa)*80,sd=Math.cos(oa)<0?-1:1; x=sd<0?-45:W+45; y=oy; tx=ox; ty=oy; baseX=W/2; mode='orbitEnter'; }
    else if(w.form==='ring'){ var ra=i/n*TAU; x=W/2+(i-(n-1)/2)*26; y=-55-i*14; tx=W/2+Math.cos(ra)*110; ty=H*0.33+Math.sin(ra)*85; baseX=W/2; mode='ringEnter'; }
    else if(w.form==='mandala'){ var ma=i/n*TAU; x=W/2+Math.cos(ma)*W*.42; y=-45+Math.sin(ma)*28; tx=W/2+Math.cos(ma)*102; ty=245+Math.sin(ma)*70; baseX=W/2; mode='ringEnter'; }
    else if(w.form==='fractal'){ var fa=i/n*TAU*1.5; x=W/2+Math.cos(fa)*W*.44; y=-45+Math.sin(fa)*24; tx=W/2+Math.cos(fa)*78; ty=255+Math.sin(fa)*58; baseX=W/2; mode='ringEnter'; }
    else if(w.form==='spiral'){ var sa=i/n*TAU*1.7; x=W/2+Math.cos(sa)*W*.40; y=-55+Math.sin(sa)*22; tx=W/2+Math.cos(sa)*108; ty=265+Math.sin(sa)*76; baseX=W/2; mode='ringEnter'; }
    else { x=W/2+(i-(n-1)/2)*40; y=-50; baseX=x; mode='dive'; }
    var hpScale=(stage===4?1.18:(1+stage*0.18));
    var ehp=Math.round(ET[w.type].hp*hpScale*((w.elite&&(n<=2||i===0))?0.85:1));
    var e={type:w.type,x:x,y:y,baseX:baseX,tx:tx,ty:ty,mode:mode,entering:(mode==='pincer'||mode==='turret'||mode==='orbitEnter'||mode==='ringEnter'||mode==='arc'),t:0,phase:i*0.7,spd:w.spd,hp:ehp,max:ehp,fireT:0.8+Math.random()*0.8,flash:0,noFire:!!w.noFire,aggr:w.aggr||1,role:w.role||'',visT:0,elite:!!w.elite&&(n<=2||i===0),first:(i===0&&waveIndex%2===0)};
    if(mode==='dive'){
      var a=Math.atan2(player.y-y,player.x-x);
      e.vx=Math.cos(a)*w.spd; e.vy=Math.sin(a)*w.spd;
    }
    if(mode==='cross'){
      var ca=Math.atan2(H*0.55-y,W/2-x);e.vx=Math.cos(ca)*w.spd;e.vy=Math.sin(ca)*w.spd;
    }
    enemies.push(e);
    if(e.type===6){for(var ok=0;ok<8;ok++) orbBullets.push({owner:e,ang:ok/8*TAU,r:50,spin:1.15,rad:4,type:2});}
  }
}
function enemyScale(e){ return e.transport?1.45:(e.elite?1.6:1.5); }
function enemyW(e){ return ET[e.type].w*enemyScale(e); }
function s5Shot(e,x,y,vx,vy,rad,type,extra){
  if(ebullets.length>260) return null;
  var b={x:x,y:y,vx:vx,vy:vy,rad:rad,type:type||1,s5art:S5_ENEMY_BULLET[Math.max(0,Math.min(5,e.type-9))]};
  if(extra)for(var k in extra)b[k]=extra[k];
  ebullets.push(b);return b;
}
function s5FireEnemy(e,ra){
  var pi=Math.max(0,Math.min(5,e.type-9));
  var sp=205+stage*5;
  if(pi===0){ // COORDINATE / coordinate lattice
    for(var i=-1;i<=1;i++)s5Shot(e,e.x,e.y+9,Math.cos(ra+i*.10)*sp,Math.sin(ra+i*.10)*sp,4.4,1);
    s5Shot(e,e.x-14,e.y+4,Math.cos(ra)*sp*.78,Math.sin(ra)*sp*.78,4.0,1);
    s5Shot(e,e.x+14,e.y+4,Math.cos(ra)*sp*.78,Math.sin(ra)*sp*.78,4.0,1);
  }else if(pi===1){ // TOPOLOGY TURRET / heavy fan + lance
    for(var j=-2;j<=2;j++)s5Shot(e,e.x,e.y+8,Math.cos(ra+j*.13)*150,Math.sin(ra+j*.13)*150,5.0,2);
    if(beams.length<3)spawnBeam(e.x,e.y+5,ra,1200,9,.9,.4,1,'#7fe6ff',false,e);
  }else if(pi===2){ // MOBIUS HUNTER / fast strafe
    s5Shot(e,e.x-8,e.y+4,Math.cos(ra-.08)*(sp+70),Math.sin(ra-.08)*(sp+70),4.1,1);
    s5Shot(e,e.x+8,e.y+4,Math.cos(ra+.08)*(sp+70),Math.sin(ra+.08)*(sp+70),4.1,1);
  }else if(pi===3){ // AXIS CORE / radial ring with aimed gap
    for(var q=0;q<12;q++){
      var a=q/12*TAU+time*.22;
      if(Math.abs(Math.atan2(Math.sin(a-ra),Math.cos(a-ra)))<.48)continue;
      s5Shot(e,e.x,e.y,Math.cos(a)*118,Math.sin(a)*118,4.8,2);
    }
    s5Shot(e,e.x,e.y+6,Math.cos(ra)*230,Math.sin(ra)*230,5.2,1);
  }else if(pi===4){ // RECURSIVE / double spiral
    e.s5ang=(e.s5ang||0)+.34;
    for(var arm=0;arm<2;arm++){
      for(var k=0;k<2;k++){
        var aa=e.s5ang+arm*Math.PI+k*.16;
        s5Shot(e,e.x,e.y,Math.cos(aa)*(96+k*26),Math.sin(aa)*(96+k*26),4.5,2);
      }
    }
  }else{ // MIRROR DEFLECTION / paired cross fans
    var base=Math.PI/2;
    for(var m=0;m<3;m++){
      s5Shot(e,e.x-12,e.y,Math.cos(base-.28+m*.16)*160,Math.sin(base-.28+m*.16)*160,4.3,1);
      s5Shot(e,e.x+12,e.y,Math.cos(base+.28-m*.16)*160,Math.sin(base+.28-m*.16)*160,4.3,1);
    }
    if(beams.length<2)spawnBeam(e.x,e.y+4,ra,1000,7,.8,.26,1,'#ff9ae6',false,e);
  }
  sfx('e_shot',.16);
}
function fireEnemy(e){
  if(e.transport) return;
  if(e.visT!==undefined&&e.visT<0.22) return;
  if(bullets.length+ebullets.length>240) return;
  var ra=Math.atan2(player.y-e.y,player.x-e.x);
  if(e.type>=9){s5FireEnemy(e,ra);return;}
  if(e.type===9){
    ebullets.push({x:e.x,y:e.y+8,vx:Math.cos(ra)*(235+stage*5),vy:Math.sin(ra)*(235+stage*5),rad:4,type:1});
    sfx('e_shot',0.12);return;
  }
  if(e.type===10){
    var gap10=Math.random()*TAU;
    for(var q10=0;q10<10;q10++){
      var a10=q10/10*TAU+time*0.18;
      var d10=Math.atan2(Math.sin(a10-gap10),Math.cos(a10-gap10));
      if(Math.abs(d10)<0.55) continue;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(a10)*115,vy:Math.sin(a10)*115,rad:4.5,type:2});
    }
    sfx('e_shot',0.14);return;
  }
  if(e.type===11){
    for(var q11=-2;q11<=2;q11++){
      var a11=ra+q11*0.16;
      ebullets.push({x:e.x,y:e.y+8,vx:Math.cos(a11)*185,vy:Math.sin(a11)*185,rad:5,type:1});
    }
    if(beams.length<5) spawnBeam(e.x,e.y+6,ra,1100,8,0.8,0.28,1,'#c7a6ff',false,e);
    sfx('e_charge',0.18);return;
  }
  if(e.type===7){
    if(beams.length<4) spawnBeam(e.x,e.y+4,ra,1500,8,1.05,0.22,1,'#ff5a5a',false,e);
    sfx('e_charge',0.24);return;
  }
  if(e.type===8){
    for(var mi=0;mi<5;mi++){
      var ma=ra+(mi-2)*0.24;
      ebullets.push({x:e.x+(mi-2)*8,y:e.y+10,vx:Math.cos(ma)*38,vy:Math.sin(ma)*38,rad:7,type:2,fuse:1.35,burst:8});
    }
    sfx('e_shot',0.16);return;
  }
  if(e.type===4&&Math.random()<0.42){
    ebullets.push({x:e.x,y:e.y+10,vx:Math.cos(ra)*55,vy:Math.sin(ra)*55,rad:9,type:2,bomb:true,fuse:1.25});
    sfx('e_charge',0.20);return;
  }
  if(e.type===6){
    if(beams.length<4){
      spawnBeam(e.x-15,e.y+4,ra,1500,9,0.75,0.35,1,bossBeamColor(),false,e);
      spawnBeam(e.x+15,e.y+4,ra,1500,9,0.75,0.35,1,bossBeamColor(),false,e);
    }
    sfx('e_charge',0.22);return;
  }
  if(e.role==='sniper'){
    ebullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*245,vy:Math.sin(ra)*245,rad:5,type:1});
    sfx('e_shot',0.2);return;
  }
  if(e.role==='suppressor'){
    for(var ri=-1;ri<=1;ri++){var rA=ra+ri*0.13;ebullets.push({x:e.x,y:e.y,vx:Math.cos(rA)*175,vy:Math.sin(rA)*175,rad:5,type:1});}
    sfx('e_shot',0.2);return;
  }
  var et=ET[e.type],a=Math.atan2(player.y-e.y,player.x-e.x),sp=(140+stage*10)*(e.aggr||1);
  if(e.elite){
    if(beams.length<4&&Math.random()<0.28) spawnBeam(e.x,e.y,a,1500,18,1.0,0.4,1,bossBeamColor(),false,e);
    for(var i=0;i<10;i++){var ang=i/10*TAU+time*0.2;ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*95,vy:Math.sin(ang)*95,rad:5.5,type:2});}
    for(var i=0;i<3;i++){var ang=a+(i-1)*0.18;ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*180,vy:Math.sin(ang)*180,rad:6,type:1});}
    sfx('e_shot',0.16);
    return;
  }
  if((e.type===3||e.type===4)&&beams.length<5&&Math.random()<0.38){
    spawnBeam(e.x,e.y,a,1500,15,1.0,0.38,1,bossBeamColor(),false,e);
    return;
  }
  if(et.kind===2){
    var rn=Math.max(1,Math.round(et.n*(e.aggr||1)));
    for(var i=0;i<rn;i++){
      var ang=i/rn*TAU+time*0.2;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp*0.8,vy:Math.sin(ang)*sp*0.8,rad:5,type:2});
    }
  }else{
    sfx('e_shot',0.17);
    var spread=(et.kind===3)?0.28:0.16;
    var bn=Math.max(1,Math.round(et.n*(e.aggr||1)));
    for(var i=0;i<bn;i++){
      var ang=a+(i-(bn-1)/2)*spread;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,rad:5,type:1});
    }
  }
}

function primeDreadUltimate(){
  if(!boss) return;
  var bx1=Math.max(70,boss.x-88),bx2=Math.min(W-70,boss.x+88);
  spawnBeam(bx1,boss.y+20,Math.PI/2,1700,24,1.3,0.55,1,bossBeamColor(),true,boss,true);
  spawnBeam(bx2,boss.y+20,Math.PI/2,1700,24,1.3,0.55,1,bossBeamColor(),true,boss,true);
}
function beginBossUltimate(){
  if(!boss) return;
  boss.ultT=0;boss.ultCharge=1.3;
  if(stage===4&&boss.phase>=1){
    boss.ultPick=Math.floor(Math.random()*4);
    var un=['TENTACLE CAGE','LASER CURTAIN','SWARM SINGULARITY','SERAPHIC CHOIR'];
    var on=['VOID SOVEREIGN','ABYSS DEVOURER','STAR BEHEMOTH','SERAPHIC WINGS'];
    setBanner('FUSED MEMORY / '+un[boss.ultPick],on[boss.ultPick],1.5);
  }else{
    setBanner(ultimateName(boss.def),boss.def.name,1.5);
  }
  sfx('b_charge',0.46);
  if(boss.def.style==='dread') primeDreadUltimate();
}
function ultimateName(def){
  return def.style==='octopus'?'TENTACLE CAGE':(def.style==='dread'?'LASER CURTAIN':(def.style==='chronos'?'CHRONOS COLLAPSE':'SWARM SINGULARITY'));
}
function ultOctopus(){
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var r=0;r<5;r++){
    var n=24+r*3,sp=88+r*20,gw=0.56,gapR=gap+r*0.28;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+r*0.24,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
      if(Math.abs(da)<gw/2) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5.5,type:2});
    }
  }
  for(var i=0;i<4;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-1.5)*0.13;
    ebullets.push({x:boss.x,y:boss.y+12,vx:Math.cos(aa)*205,vy:Math.sin(aa)*205,rad:6,type:1});
  }
}
function ultDread(){
  shake=Math.max(shake,12);
  for(var w=0;w<2;w++){
    var y=H*(0.30+w*0.22),n=18,sp=62+w*16;
    for(var i=0;i<n;i++){
      var x=W*0.06+i*(W*0.88/(n-1));
      if(Math.abs(x-W/2)<58) continue;
      ebullets.push({x:x,y:y,vx:0,vy:sp,rad:5.5,type:1});
    }
  }
  for(var i=0;i<7;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-3)*0.10;
    ebullets.push({x:boss.x,y:boss.y+16,vx:Math.cos(aa)*185,vy:Math.sin(aa)*185,rad:6,type:1});
  }
}
function ultHive(){
  var origins=[{x:boss.x-70,y:boss.y+18},{x:boss.x+70,y:boss.y+18},{x:boss.x,y:boss.y+8}];
  for(var o=0;o<origins.length;o++){
    var ox=origins[o].x,oy=origins[o].y,base=Math.atan2(player.y-oy,player.x-ox);
    for(var r=0;r<2;r++){
      var n=16,sp=92+r*34,gw=0.62,gapR=base+r*0.18;
      for(var i=0;i<n;i++){
        var a=i/n*TAU+r*0.2,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
        if(Math.abs(da)<gw/2) continue;
        ebullets.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:2});
      }
    }
  }
  for(var i=0;i<3;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-1)*0.16;
    ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(aa)*230,vy:Math.sin(aa)*230,rad:6,type:1});
  }
}
function ultSeraph(){
  var base=Math.atan2(player.y-boss.y,player.x-boss.x);
  var boost=(stage===4&&boss.phase===2)?1.28:1;
  for(var r=0;r<4;r++){
    var n=18+r*4,sp=(72+r*18)*boost,gap=0.50,gapR=base+r*.22;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+r*.15,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
      if(Math.abs(da)<gap/2) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:4.8,type:2});
    }
  }
  for(var i=0;i<9;i++){
    var aa=base+(i-4)*.11;
    ebullets.push({x:boss.x,y:boss.y+14,vx:Math.cos(aa)*225*boost,vy:Math.sin(aa)*225*boost,rad:6,type:1});
  }
}
function sigOcto(){bossSpiral(3,1,120);bossVortex();bossAimed(5);}
function sigDread(){bossWall();bossCrossfire();bossBroadside();}
function sigHive(){bossHiveBurst();bossSwarm();bossBlink();}
function sigSeraph(){bossSeraphFan();bossHalo();}
var SIG_FNS=[[sigOcto,bossVortex],[sigDread,bossCrossfire,bossBombBarrage],[sigHive,bossSwarm,bossRotatingLaser],[sigSeraph,bossCrossLaser,bossGatling]];
function runSignature(pi,fn){
  if(!boss||!fn) return;
  var old=SIG_BOSS;SIG_BOSS=pi;var start=ebullets.length,bstart=beams.length;
  try{fn();}catch(e){}
  for(var i=start;i<ebullets.length;i++) if(ebullets[i].bossPal==null) ebullets[i].bossPal=pi;
  SIG_BOSS=old;
}
function bossUltimate(){
  if(!boss) return;
  if(stage===4&&boss.phase>=1){
    var pick=(boss.ultPick==null)?Math.floor(Math.random()*4):boss.ultPick;
    var fns=[ultOctopus,ultDread,ultHive,ultSeraph];
    runSignature(pick,fns[pick]);
    if(boss.phase===2){
      var p2=(pick+1+Math.floor(Math.random()*3))%4;
      runSignature(p2,fns[p2]);
    }
  }else if(boss.def.style==='octopus') ultOctopus();
  else if(boss.def.style==='dread') ultDread();
  else ultHive();
  shake=16;sfx('laser_fire',0.50);
}
function step(dt){
  time+=dt;
  setLaserSound(player.weapon==='laser'&&(state==='play'||state==='boss'));
  for(var i=0;i<parts.length;i++){var p=parts[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.98;p.vy*=0.98;}
  for(var i=parts.length-1;i>=0;i--) if(parts[i].life<=0) parts.splice(i,1);
  for(var i=0;i<fx.length;i++) fx[i].t+=dt;
  for(var i=fx.length-1;i>=0;i--) if(fx[i].t>(fx[i].life||0.6)) fx.splice(i,1);
  for(var pi=phaseFx.length-1;pi>=0;pi--){phaseFx[pi].t+=dt;if(phaseFx[pi].t>phaseFx[pi].life) phaseFx.splice(pi,1);}
  for(var i=0;i<stars.length;i++){stars[i].y+=(18+stars[i].z*40)*dt;if(stars[i].y>H+4){stars[i].y=-4;stars[i].x=Math.random()*W;}}
  if(state!=='menu'){
    bgScroll+=82*dt; bgEdgeScroll+=165*dt;
    for(var di=0;di<bgDust.length;di++){var dp=bgDust[di];dp.y+=dp.sp*dt;if(dp.y>H+6){dp.y=-6;dp.x=Math.random()*W;}}
  }
  if(shake>0) shake=Math.max(0,shake-dt*40);
  if(bgFade>0) bgFade=Math.max(0,bgFade-dt/1.4);
  if(bombT>0) bombT=Math.max(0,bombT-dt);
  if(pickupT>0) pickupT=Math.max(0,pickupT-dt);
  if(laserHitT>0) laserHitT=Math.max(0,laserHitT-dt);
  if(stageFlash>0) stageFlash=Math.max(0,stageFlash-dt/0.6);
  if(stageWarp>0) stageWarp=Math.max(0,stageWarp-dt/1.5);
  if(state==='bossDeath1'){bossDeath1T+=dt;if(bossDeath1T>=2.7)startBossOmen();return;}
  if(state==='bossOmen'){bossOmenT+=dt;if(bossOmenT>=6.5)startBossFusionCinematic();return;}
  if(state==='bossFusion'){
    if(fusionFadeT>0)fusionFadeT=Math.max(0,fusionFadeT-dt);
    if(fusionHoldActive){fusionHoldT+=dt;if(fusionHoldT>=1.1){try{fusionVideo.currentTime=fusionVideo.duration;}catch(e){}finishBossFusionPhase();return;}}
    if(fusionVideo&&fusionVideo.readyState>=2&&fusionVideo.videoWidth>0){
      if(fusionVideo.paused&&!fusionHoldActive){try{fusionVideo.play().catch(function(){});}catch(e){}}
      if(!fusionVideo.paused){
        bossFusionT=fusionVideo.currentTime;
        if(fusionVideo.ended||fusionVideo.currentTime>=fusionVideo.duration-0.04){finishBossFusionPhase();return;}
      }
    }
    return;
  }
  if(state==='fusion'){fusionT+=dt;if(fusionT>=3.6)spawnBossNow();return;}
  if(state==='bossAwaken'){bossAwakenT-=dt;if(bossAwakenT<=0){state='boss';if(boss)boss.invuln=1.4;setBossPattern(0);} }
  if(state==='finale'){finaleT+=dt;if(finaleT>=7.7)startCast();return;}
  if(state==='cast'){castT+=dt;castScroll=Math.min(CAST_TOTAL,castScroll+18*dt);if(castScroll>=CAST_TOTAL)castHoldT+=dt;return;}
  if(state==='menu'||state==='win'||state==='over') return;

  if(state==='warpOut'){
    warpT-=dt; warpSpeed+=1100*dt; player.y-=warpSpeed*dt; player.x=W/2;
    if(warpT<=0){
      if(stage<STAGES.length-1) startStage(stage+1);
      else state='win';
    }
    return;
  }
  if(state==='warpIn'){
    warpT-=dt; var wp=Math.min(1,1-warpT/0.95);
    player.x=W/2; player.y=H+90-(H+90-(H-130))*wp; target.x=player.x; target.y=player.y;
    if(warpT<=0){
      state='intro'; setBanner('STAGE '+(stage+1),STAGES[stage].name,1.4); bannerT=1.4; player.y=H-130;
    }
    return;
  }
  var sp=340,dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);
  if(d>0.5){var mv=Math.min(d,sp*dt);player.x+=dx/d*mv;player.y+=dy/d*mv;}
  player.x=Math.max(16,Math.min(W-16,player.x)); player.y=Math.max(110,Math.min(H-56,player.y));
  player.bank+=((dx*0.004)-player.bank)*Math.min(1,dt*8);
  if(player.invuln>0) player.invuln-=dt;
  if(player.odT>0) player.odT=Math.max(0,player.odT-dt);
  if(player.respawnT>0){
    player.respawnT-=dt;
    if(player.respawnT<=0){
      player.respawnT=0;
      if(player.respawnGift){
        player.respawnGift=false;
        items.push({x:W/2-22,y:H-175,vy:0,type:'P',t:0});
        items.push({x:W/2+22,y:H-175,vy:0,type:'A',t:0});
        pickupT=1.4; pickupMsg='RECOVERY SUPPLY';
      }
    }
  }
  player.trail.unshift({x:player.x,y:player.y}); if(player.trail.length>140) player.trail.pop();

  if((state==='play'||state==='boss')&&player.respawnT<=0){
    if(player.weapon==='spread'){
      if(time-lastSpecial>(player.odT>0?0.080:0.16)){ lastSpecial=time; fireSpread(); sfx('p_spread',0.36); }
    }else if(player.weapon==='laser'){
      laserDamage(dt);
    }else if(player.weapon==='missile'){
      if(time-lastMissile>0.46){ lastMissile=time; launchMissiles(); }
    }else{
      if(time-lastShot>(player.odT>0?0.033:0.10)){ lastShot=time; fireNormal(); if(Math.random()<0.8) blasterShot(); }
    }
  }
  if(bannerT>0) bannerT-=dt;
  if(state==='intro'){
    if(bannerT<=0){ state='play'; stageT=0; }
  }else if(state==='play'){
    stageT+=dt;
    var waves=STAGES[stage].waves;
    while(waveIndex<waves.length&&waves[waveIndex].t<=stageT){
      if(stage===4&&enemies.length>=6) break;
      spawnWave(waves[waveIndex]); waveIndex++;
    }
    if(stageT>nextTransport&&!enemies.some(function(e){return e.transport;} )){ if(Math.random()<0.55) spawnTransport(); nextTransport=stageT+22+Math.random()*10; }
    if(waveIndex>=waves.length&&(enemies.length===0||stageT>waves[waves.length-1].t+8)) startBossWarn();
  }else if(state==='bossWarn'){
    if(bannerT<=0) spawnBoss();
  }else if(state==='clear'){
    if(bannerT<=0){
      if(stage<STAGES.length-1){ state='warpOut'; warpT=1.1; warpSpeed=320; playWarpJet(0.9); }
      else { if(stage===4) startCast(); else {state='win';playBgm('m5');} }
    }
  }

  for(var i=shots.length-1;i>=0;i--){
    var s=shots[i]; s.x+=(s.vx||0)*dt; s.y+=s.vy*dt;
    if(s.y<-20){shots.splice(i,1);continue;}
    var hit=false;
    for(var j=enemies.length-1;j>=0;j--){
      var e=enemies[j],et=ET[e.type];
      if(Math.abs(s.x-e.x)<enemyW(e)*0.45&&Math.abs(s.y-e.y)<enemyW(e)*0.5){
        e.hp-=s.dmg; e.flash=0.1; hit=true; weaponHitFx(0.20);
        if(e.hp<=0){ score+=et.score; part(e.x,e.y,'#ffb066',9,160); enemyDeath(e); maybeDrop(e); removeEnemy(j); }
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0){
      if(Math.abs(s.x-boss.x)<boss.def.w*0.30*1.15&&Math.abs(s.y-boss.y)<boss.def.h*0.34*1.15){
        boss.hp-=s.dmg; boss.flash=0.1; boss.hitFlash=0.14; boss.hitX=s.x; boss.hitY=s.y; score+=5; hit=true; sfx('b_hit',0.30);
        part(s.x,s.y,'#ffd28a',2,70);
        if(time-lastHitSfx>0.06){lastHitSfx=time;sfx('b_hit',0.22);}
      }
    }
    if(hit||s.y<-20) shots.splice(i,1);
  }

  for(var i=enemies.length-1;i>=0;i--){
    var e=enemies[i]; e.t+=dt; if(e.flash>0) e.flash-=dt;
    if(e.mode==='escortLead'){
      e.y+=e.spd*dt;
      var ep=Math.max(0,Math.min(1,e.y/e.ty));
      e.x=W/2+Math.sin(e.t*0.7)*90*ep;
      if(e.y>=e.ty) e.y=e.ty;
      if(e.t>14){e.mode='down';e.baseX=e.x;}
    }
    else if(e.mode==='escortOrbit'){
      if(!e.leader||e.leader.hp<=0||enemies.indexOf(e.leader)<0){e.mode='down';e.baseX=e.x;}
      else{e.x=e.leader.x+Math.cos(e.phase+e.t*1.25)*58;e.y=e.leader.y+Math.sin(e.phase+e.t*1.25)*34;}
    }
    else if(e.mode==='transport'){ e.x+=e.vx*dt; e.y=135+Math.sin(e.t*1.5)*8; }
    else if(e.mode==='arc'&&e.entering){
      var ax=e.tx-e.x,ay=e.ty-e.y,ad=Math.hypot(ax,ay);
      if(ad<6){e.entering=false;e.mode='down';e.baseX=e.x;}
      else{e.x+=ax/ad*e.spd*2*dt;e.y+=ay/ad*e.spd*2*dt;}
    }else if(e.mode==='cross'){ e.x+=e.vx*dt; e.y+=e.vy*dt; }
    else if(e.mode==='strafe'){ e.x+=e.vx*dt; e.y+=Math.sin(e.t*2)*18*dt; }
    else if(e.mode==='feint'){
      e.y+=e.spd*dt;
      if(e.t>1.8){e.mode='retreat';e.vy=-e.spd*1.4;}
    }else if(e.mode==='retreat'){ e.y+=e.vy*dt; e.x+=Math.sin(e.t*4)*30*dt; }
    else if(e.mode==='ringEnter'){
      var rx=e.tx-e.x,ry=e.ty-e.y,rd=Math.hypot(rx,ry);
      if(rd<6){e.mode='ringEase';e.entering=false;e.t=0;e.ex=e.x;e.ey=e.y;e.phase=Math.atan2(e.y-H*0.33,e.x-W/2);}
      else{e.x+=rx/rd*e.spd*2.2*dt;e.y+=ry/rd*e.spd*2.2*dt;}
    }else if(e.mode==='ringEase'){
      var rk=Math.min(1,e.t*4),rA0=e.phase+e.t*0.62,rwx=W/2+Math.cos(rA0)*110,rwy=H*0.33+Math.sin(rA0)*85;
      e.x=e.ex+(rwx-e.ex)*rk;e.y=e.ey+(rwy-e.ey)*rk;
      if(rk>=1){e.mode='ring';e.t=0;}
    }else if(e.mode==='ring'){
      var rA=e.phase+e.t*0.62;e.x=W/2+Math.cos(rA)*110;e.y=H*0.33+Math.sin(rA)*85;
      if(e.t>11){e.mode='down';e.baseX=e.x;}
    }else if(e.mode==='orbitEnter'){
      var ox=e.tx-e.x,oy=e.ty-e.y,od=Math.hypot(ox,oy);
      if(od<6){e.mode='orbitEase';e.entering=false;e.t=0;e.ex=e.x;e.ey=e.y;e.phase=Math.atan2(e.y-280,e.x-W/2);}
      else{e.x+=ox/od*e.spd*2.4*dt;e.y+=oy/od*e.spd*2.4*dt;}
    }else if(e.mode==='orbitEase'){
      var ok=Math.min(1,e.t*4),oa3=e.phase+e.t*0.8,owx=W/2+Math.cos(oa3)*150,owy=280+Math.sin(oa3)*80;
      e.x=e.ex+(owx-e.ex)*ok;e.y=e.ey+(owy-e.ey)*ok;
      if(ok>=1){e.mode='orbit';e.t=0;}
    }else if(e.mode==='orbit'){
      if(e.t>7){e.mode='down';e.baseX=e.x;}
      else{var oa2=e.phase+e.t*0.8;e.x=W/2+Math.cos(oa2)*150;e.y=280+Math.sin(oa2)*80;}
    }
    else if(e.mode==='pincer'&&e.entering){
      var ex=e.tx-e.x,ey=e.ty-e.y,ed=Math.hypot(ex,ey);
      if(ed<6){e.entering=false;e.mode='down';e.baseX=e.x;}
      else {var step=Math.min(ed,e.spd*1.8*dt);e.x+=ex/ed*step;e.y+=ey/ed*step;}
    }else if(e.mode==='turret'&&e.entering){
      e.y+=e.spd*1.5*dt;
      if(e.y>=e.ty){e.y=e.ty;e.entering=false;e.baseX=e.x;}
    }else if(e.mode==='turret'){
      e.x=e.baseX+Math.sin(e.t*1.5)*24;
      if(e.t>10&&!e.elite){e.mode='down';e.spd=75;}
    }else if(e.mode==='snake'){
      e.y+=e.spd*dt; e.x=e.baseX+Math.sin(e.t*2.4+e.phase)*30;
    }else if(e.mode==='dive'){
      e.x+=e.vx*dt; e.y+=e.vy*dt;
    }else{
      e.y+=e.spd*dt;
    }
    if(e.px!==undefined&&e.t>0.08){
      var jx=e.x-e.px,jy=e.y-e.py,jd=Math.hypot(jx,jy);
      if(jd>12){e.x=e.px+jx/jd*12;e.y=e.py+jy/jd*12;}
    }
    e.px=e.x;e.py=e.y;
    var vis=(e.x>14&&e.x<W-14&&e.y>14&&e.y<H-60);
    e.visT=vis?((e.visT||0)+dt):0;
    if(!e.transport&&!e.noFire&&!e.entering&&e.visT>0.22){
      e.fireT-=dt;
      if(e.fireT<=0){ fireEnemy(e); e.fireT=ET[e.type].fire/e.aggr+rand(-0.2,0.2); }
    }
    var edx=e.x-player.x,edy=e.y-player.y;
    var er=ET[e.type].r*(e.transport?1.45:(e.elite?1.6:1.5));
    if(circleOverlap(e.x,e.y,er,player.x,player.y,player.r)) hitPlayer();
    if(e.y>H+70||e.x<-90||e.x>W+90) removeEnemy(i);
  }

  for(var i=items.length-1;i>=0;i--){
    var it=items[i];it.t+=dt;it.y+=it.vy*dt;
    var idx=player.x-it.x,idy=player.y-it.y,id=Math.hypot(idx,idy);
    if(id<185&&id>1){it.x+=idx/id*180*dt;it.y+=idy/id*160*dt;}
    if(id<20){collectItem(it);items.splice(i,1);continue;}
    if(it.y>H+30)items.splice(i,1);
  }
  for(var oi=orbBullets.length-1;oi>=0;oi--){
    var ob=orbBullets[oi];if(!ob.owner||ob.owner.hp<=0||enemies.indexOf(ob.owner)<0){orbBullets.splice(oi,1);continue;}
    ob.ang+=ob.spin*dt;ob.x=ob.owner.x+Math.cos(ob.ang)*ob.r;ob.y=ob.owner.y+Math.sin(ob.ang)*ob.r;
    if(circleOverlap(ob.x,ob.y,ob.rad,player.x,player.y,player.r)) hitPlayer();
  }
  updateBlastZones(dt);
  updateODLaserFx(dt);
  updateWingEntries(dt);
  updateOptions(dt);
  updateWingBeams(dt);
  updateMissiles(dt);
  updateBeams(dt);
  if(boss&&state==='boss'){
    var def=boss.def; boss.t+=dt;
    if(boss.hitFlash>0) boss.hitFlash-=dt;
    if(boss.flash>0) boss.flash-=dt;
    if(boss.invuln>0) boss.invuln=Math.max(0,boss.invuln-dt);
    if(boss.crossOrb){
      var co=boss.crossOrb;co.t+=dt;
      if(co.t<=co.travel){var ck=Math.min(1,co.t/co.travel);co.x=boss.x+(co.tx-boss.x)*ck;co.y=boss.y+(co.ty-boss.y)*ck;}
      else if(!co.armed&&co.t>=co.travel+co.charge){co.armed=true;bossCrossArms();boss.crossOrb=null;}
    }
    var ty=(stage===4?H*.26:((def.move==='dash')?215:205));
    if(boss.entering){
      boss.y+=140*dt;
      if(boss.y>=ty){boss.y=ty;boss.entering=false;boss.invuln=1.0;boss.t=0;}
    }else{
      if(def.move==='sine') boss.x=W/2+Math.sin(boss.t*0.6)*82;
      else if(def.move==='wide') boss.x=W/2+Math.sin(boss.t*0.45)*112;
      else boss.x=W/2+Math.sin(boss.t*1.05)*120;
      if(stage===4) boss.y+=(ty-boss.y)*Math.min(1,dt*1.8);
      else boss.y=ty+Math.sin(boss.t*0.8)*8;
      if(def.move==='dash'&&stage!==4) boss.y=ty+Math.sin(boss.t*0.55)*16;
      var hw=def.w/2+6; boss.x=Math.max(hw,Math.min(W-hw,boss.x));
      if(boss.ultCharge<=0){
        if(boss.phase===0&&boss.hp<boss.max*0.60&&stage!==4) bossPhase(1);
        else if(boss.phase===1&&boss.hp<boss.max*(stage===4?0.50:0.30)) bossPhase(2);
      }
      if(boss.ultCharge>0){
        boss.ultCharge-=dt;
        if(boss.ultCharge<=0) bossUltimate();
      }else{
        boss.ultT+=dt;
        if(boss.ultT>def.ultRate){
          beginBossUltimate();
        }else{
          if(stage===4&&boss.phase>=1){
            boss.bossSigT=(boss.bossSigT||0)+dt;
            var sigGap=boss.phase===2?2.4:3.2;
            if(boss.bossSigT>sigGap){
              boss.bossSigT=0;
              var spi=Math.floor(Math.random()*4);
              var arr=SIG_FNS[spi];
              runSignature(spi,arr[Math.floor(Math.random()*arr.length)]);
            }
          }
          boss.patternT+=dt; if(boss.patternT>8) setBossPattern(boss.patternIdx+1);
          boss.aimT+=dt; boss.ringT+=dt; boss.laserT+=dt; boss.spiralT+=dt; boss.broadT+=dt; boss.blinkT+=dt;
          var rage=boss.phase===2?0.72:1;
          if(def.style==='octopus'){
            if(boss.phase===0){
              if(boss.spiralT>0.17){boss.spiralT=0;bossSpiral(3,1,105+stage*8);}
              if(boss.aimT>2.2){boss.aimT=0;bossAimed(3);}
              if(boss.ringT>6.0){boss.ringT=0;bossRing(10);}
            }else if(boss.phase===1){
              if(boss.spiralT>0.20){boss.spiralT=0;bossSpiral(4,-1,95+stage*8);}
              if(boss.ringT>3.6){boss.ringT=0;bossVortex();}
              if(boss.aimT>2.0){boss.aimT=0;bossAimed(5);}
              if(boss.laserT>8.0){boss.laserT=0;bossGatling();}
            }else{
              if(boss.spiralT>0.12){boss.spiralT=0;bossSpiral(4,1,125+stage*8);}
              if(boss.ringT>2.8){boss.ringT=0;bossVortex();}
              if(boss.aimT>1.7){boss.aimT=0;bossAimed(7);}
              if(boss.laserT>6.2){boss.laserT=0;bossGatling();}
            }
          }else if(def.style==='dread'){
            if(boss.phase===0){
              if(boss.broadT>5.5){boss.broadT=0;bossBroadside();}
              if(boss.aimT>2.6){boss.aimT=0;bossWall();}
              if(boss.ringT>5.8){boss.ringT=0;bossRing(16);}
            }else if(boss.phase===1){
              if(boss.broadT>4.2){boss.broadT=0;bossCrossfire();}
              if(boss.aimT>2.0){boss.aimT=0;bossWall();}
              if(boss.ringT>4.6){boss.ringT=0;bossRing(18);}
              if(boss.laserT>7.0){boss.laserT=0;bossBombBarrage();}
            }else{
              if(boss.broadT>3.0){boss.broadT=0;bossBroadside();bossCrossfire();}
              if(boss.aimT>1.5){boss.aimT=0;bossWall();}
              if(boss.ringT>3.2){boss.ringT=0;bossRing(20);}
              if(boss.laserT>5.5){boss.laserT=0;bossBombBarrage();}
            }
          }else if(def.style==='seraph'){
            if(boss.phase===0){
              if(boss.spiralT>0.55){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(7);}
            }else if(boss.phase===1){
              if(boss.ringT>3.4){boss.ringT=0;bossHalo();}
              if(boss.spiralT>0.48){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.7){boss.aimT=0;bossAimed(7);}
              if(boss.laserT>7.2){boss.laserT=0;bossCrossLaser();}
            }else{
              if(boss.ringT>2.6){boss.ringT=0;bossHalo();}
              if(boss.spiralT>0.32){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.35){boss.aimT=0;bossAimed(9);}
              if(boss.laserT>5.8){boss.laserT=0;bossCrossLaser();}
            }
          }else if(def.style==='chronos'&&boss.phase===0){
            if(boss.phase===0){
              if(boss.ringT>2.8){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(6);}
              if(boss.laserT>4.8){boss.laserT=0;bossEchoCross();}
            }else if(boss.phase===1){
              if(boss.ringT>2.8){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.5){boss.aimT=0;bossAimed(8);}
              if(boss.laserT>4.2){boss.laserT=0;bossEchoCross();}
              if(boss.broadT>4.0){boss.broadT=0;bossCollapse();}
            }else{
              if(boss.ringT>2.0){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.15){boss.aimT=0;bossAimed(9);}
              if(boss.laserT>3.2){boss.laserT=0;bossEchoCross();}
              if(boss.broadT>3.0){boss.broadT=0;bossCollapse();}
            }
          }else{
            if(boss.phase===0){
              if(boss.spiralT>0.52){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.9){boss.aimT=0;bossAimed(5);}
              if(boss.blinkT>5.0){boss.blinkT=0;bossBlink();}
            }else if(boss.phase===1){
              if(boss.ringT>3.2){boss.ringT=0;bossHiveBurst();}
              if(boss.spiralT>0.44){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(6);}
              if(boss.blinkT>4.2){boss.blinkT=0;bossBlink();}
              if(boss.laserT>7.4){boss.laserT=0;bossRotatingLaser();}
            }else{
              if(boss.ringT>2.4){boss.ringT=0;bossHiveBurst();}
              if(boss.spiralT>0.30){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.4){boss.aimT=0;bossAimed(8);}
              if(boss.blinkT>3.2){boss.blinkT=0;bossBlink();}
              if(boss.laserT>5.6){boss.laserT=0;bossRotatingLaser();}
            }
          }
          if(runner){ runner.x=boss.x; runner.y=boss.y; runner.update(); }
        }
      }
    }
    for(var i=bullets.length-1;i>=0;i--){
      var b=bullets[i]; b.r.update(); b.x=b.r.x; b.y=b.r.y;
      if(b.dead||b.x<-40||b.x>W+40||b.y<-40||b.y>H+40){bullets.splice(i,1);continue;}
      if(wingmanBlock(b.x,b.y,b.rad)){bullets.splice(i,1);continue;}
      var bdx=b.x-player.x,bdy=b.y-player.y;
      if(circleOverlap(b.x,b.y,b.rad,player.x,player.y,player.r)) hitPlayer();
    }
    if(stage===4&&boss&&boss.phase===0&&boss.hp<=0){ boss.hp=0; startBossPhase1Death(); }
    else if(boss.hp<=0){
      boss.hp=0;
      for(var k=0;k<30;k++) part(boss.x+rand(-70,70),boss.y+rand(-40,40),'#ffb066',2,220);
      bossDeathBoom(boss);
      bullets.length=0; ebullets.length=0; beams.length=0;
      score+=1000; player.bombs=Math.min(5,player.bombs+1);
      if(stage===4){
        finaleT=0;state='finale';shake=48;
        for(var fk=0;fk<18;fk++) phaseFx.push({x:W/2+rand(-120,120),y:H*.44+rand(-100,100),t:-fk*.035,life:3.8,kind:'death'});
        for(var pk=0;pk<110;pk++){
          var pa=rand(0,TAU),pv=rand(80,520);
          part(W/2+Math.cos(pa)*rand(0,70),H*.44+Math.sin(pa)*rand(0,50),['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0','#7fe6ff'][pk%5],rand(2,5),pv);
        }
      }else{setBanner('STAGE CLEAR',STAGES[stage].name,3.0);state='clear';}
      boss=null; runner=null;
    }
    if(boss){boss.prevX=boss.x;boss.prevY=boss.y;}
    var bdx2=boss?boss.x-player.x:0,bdy2=boss?boss.y-player.y:0;
    if(boss&&bdx2*bdx2+bdy2*bdy2<(boss.def.w*0.28*1.15)*(boss.def.w*0.28*1.15)) hitPlayer();
  }

  for(var i=ebullets.length-1;i>=0;i--){
    var e=ebullets[i]; e.x+=e.vx*dt; e.y+=e.vy*dt;
    if(e.bomb){
      e.fuse-=dt;
      if(e.fuse<=0){ enemyBombExplode(e); ebullets.splice(i,1); continue; }
      if(e.x<-40||e.x>W+40||e.y>H+40){ ebullets.splice(i,1); }
      continue;
    }
    if(e.fuse!==undefined){
      e.fuse-=dt;
      if(e.fuse<=0){
        for(var q=0;q<(e.burst||8);q++){var qa=q/(e.burst||8)*TAU;ebullets.push({x:e.x,y:e.y,vx:Math.cos(qa)*115,vy:Math.sin(qa)*115,rad:5,type:2});}
        ebullets.splice(i,1);continue;
      }
    }
    if(e.x<-30||e.x>W+30||e.y<-30||e.y>H+30){ebullets.splice(i,1);continue;}
    if(wingmanBlock(e.x,e.y,e.rad)){ebullets.splice(i,1);continue;}
    var ex=e.x-player.x,ey=e.y-player.y;
    if(circleOverlap(e.x,e.y,e.rad,player.x,player.y,player.r)) hitPlayer();
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
    if(fusionVideo.paused){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='12px monospace';ctx.fillText('TAP TO PLAY FUSION',W/2,H-120);}
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
window.__g=function(){return {state:state,stage:stage,score:score,enemies:enemies.length,bullets:bullets.length,ebullets:ebullets.length,hp:boss?Math.round(boss.hp):0,phase:boss?boss.phase:-1,bx:boss?Math.round(boss.x):0,lt:boss?+(boss.laserT.toFixed(1)):0,ut:boss?+(boss.ultT.toFixed(1)):0,uc:boss?+(boss.ultCharge.toFixed(1)):0,style:boss?boss.def.style:'',power:player.specialPower,items:items.length,shots:shots.length,weapon:player.weapon,options:player.options,lives:player.lives,php:player.hp,bombs:player.bombs};};
window.__god=function(){player.invuln=99999;player.noBlink=true;};
window.__stage=function(n){startStage(n);};
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
window.__killBoss=function(){if(boss)boss.hp=0;};
window.__bossHp=function(f){if(boss)boss.hp=boss.max*f;};
window.__drop=function(t){items.push({x:player.x,y:player.y-80,vy:20,type:t||'P',t:0});};
window.__boom=function(){boom(W/2,H*0.45,1.4);};
window.__beam=function(){spawnBeam(W/2,180,Math.PI/2,1500,16,0.8,0.45,1,'#ff6a5a');};
window.__bossLaser=function(){if(boss)bossLaser();};
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
window.__enemies=function(){return enemies.map(function(e){return {t:e.type,hp:Math.round(e.hp),max:Math.round(e.max)};});};
window.__damage=function(d){for(var i=0;i<enemies.length;i++) enemies[i].hp=Math.max(1,enemies[i].hp-(d||8));};
window.__item=function(t,x,y){items.push({x:x,y:y,vy:0,type:t,t:0});};
window.__max=function(){player.specialPower=4;player.power=4;};
window.__itemT=function(t,tm,x,y){items.push({x:x||player.x,y:y||player.y-90,vy:0,type:t,t:tm||0});};
var last=performance.now(),fixedStep=new FixedStep(1/60,4);
function frame(now){
  var dt=Math.min(0.05,(now-last)/1000);last=now;
  try{
    fixedStep.advance(dt,function(fixedDt){step(fixedDt);});
    draw();
  }catch(e){ console.error('frame error',e); }
  document.addEventListener('visibilitychange',function(){try{if(!document.hidden&&AC&&AC.state==='suspended')AC.resume();}catch(e){}});
requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
