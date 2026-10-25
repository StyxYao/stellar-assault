// Run/stage/Boss flow transitions.
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
function prepareStageContent(s){
  var st=STAGES[s];if(st.__prepared)return;
  var list=st.waves;
  if(s<4){for(var wi=0;wi<list.length;wi++)list[wi].t*=2.16;} // +25%, +20%, +20%, +20%
  var lastT=list[list.length-1].t;
  var forms=['v','line','pincer','arc','orbit','fractal','ring','line','v','orbit'];
  // small early mowing segment
  var smStart=lastT*.07,smEnd=lastT*.17,mfi=0;
  for(var mt=smStart;mt<smEnd;mt+=2.8){
    list.push({t:mt,type:(mfi%2?5:0),n:Math.round(8*.8),form:forms[mfi%forms.length],spd:110+(mfi%4)*8,aggr:0.06,fodder:true});
    mfi++;
  }
  // large second-half mowing segment (25%+ of the stage)
  var bgStart=lastT*.52,bgEnd=lastT*.77,gfi=0;
  for(var gt=bgStart;gt<bgEnd;gt+=3.2){
    list.push({t:gt,type:(gfi%2?5:0),n:Math.round((12+(gfi%3)*2)*.8),form:forms[gfi%forms.length],spd:118+(gfi%4)*8,aggr:0.06,fodder:true});
    gfi++;
  }
  // non-mowing filler, diluted and low-aggression
  var fi=0;
  for(var ft=3;ft<lastT-3;ft+=8.5){
    if((ft>=smStart&&ft<=smEnd)||(ft>=bgStart&&ft<=bgEnd)) continue;
    list.push({t:ft,type:(fi%3===0?0:5),n:6+(fi%3)*2,form:forms[fi%forms.length],spd:90+(fi%4)*8,aggr:0.12,fodder:true});
    fi++;
  }
  // sparse gap fillers outside the two mowing windows
  var gi=0;
  for(var gapT=2;gapT<lastT-2;gapT+=4.2){
    if((gapT>=smStart&&gapT<=smEnd)||(gapT>=bgStart&&gapT<=bgEnd)) continue;
    list.push({t:gapT,type:(gi%2?0:5),n:2+(gi%2),form:forms[gi%forms.length],spd:85+(gi%3)*7,aggr:0.08,fodder:true});
    gi++;
  }
  if(s<4){list.push({t:lastT*0.5,type:9+s,n:1,form:'mid',spd:70,mini:true});}
  else{
    var pairs=[[9,10,.55],[11,12,.70],[13,14,.85]];
    for(var pi=0;pi<pairs.length;pi++){
      var pp=pairs[pi];
      list.push({t:lastT*pp[2],form:'mid',miniPair:[{type:pp[0],x:W*.28},{type:pp[1],x:W*.72}]});
    }
  }
  list.sort(function(a,b){return a.t-b.t;});
  st.__prepared=true;
}
function startStage(i){
  prepareStageContent(i);
  stage=i; stageT=0; waveIndex=0; miniDropT=25; nextTransport=24+Math.random()*10;
  player.ship=selectedShip;
  player.skin=selectedSkins[player.ship]||(player.ship==='aegis'?'orbital':'void_lance');
  if(player.ship==='aegis'){
    if(typeof aegisReset==='function') aegisReset();
    if(typeof startAegisTutorial==='function') startAegisTutorial();
  }
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
  if(player.respawnT>0){player.respawnT=0;player.x=W/2;player.y=H-130;target.x=W/2;target.y=H-130;player.invuln=1.4;}
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
function bossTotalHp(s){
  var def=BOSSES[s];
  var hpMul=s===0?1.10:(s===1?1.10:(s===2?0.90:1.0));
  var finalMul=s===4?1.5:1;
  return Math.round(def.hp*1.4*hpMul*finalMul*1.5);
}
function spawnBossNow(){
  var def=BOSSES[stage];
  var bhp=bossTotalHp(stage);
  boss={def:def,x:W/2,y:-130,hp:bhp,max:bhp,phase:0,invuln:1.2,entering:true,t:0,flash:0,patternIdx:0,patternT:0,aimT:0,ringT:0,laserT:0,hitFlash:0,hitX:W/2,hitY:180,ultT:def.ultRate-2.2,ultCharge:0,spiralT:0,spiralAng:0,broadT:0,blinkT:0,bossSigT:0,dropT:5.0};
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
  if(boss){
    for(var i=0;i<64;i++){
      var a=rand(0,TAU),v=rand(100,620);
      part(boss.x+Math.cos(a)*rand(0,110),boss.y+Math.sin(a)*rand(0,80),
        ['#fff6d8','#ffe7a0','#ff9a3a','#c9a6ff'][i%4],rand(2.5,6),v);
    }
    for(var bb=0;bb<5;bb++) fx.push({x:boss.x+rand(-80,80),y:boss.y+rand(-60,60),t:-bb*.06,sc:2.4+bb*.28,seed:Math.random()*TAU,kind:'boss',life:2.3});
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
  try{fusionVideo.loop=false;fusionVideo.currentTime=0;fusionVideo.play().catch(function(){});}catch(e){}
  fusionFadeT=1.15;fusionHoldT=0;fusionHoldActive=false;
  setBanner('FUSION','FOUR ECHOES',9.0);
  sfx('b_charge',0.65);
}
function finishBossFusionPhase(){
  state='boss';bossFusionT=0;
  spawnBossNow();
  boss.phase=1;boss.max=Math.round((boss.totalHp||10080)*.64);boss.hp=boss.max;
  boss.y=H*.44;boss.entering=false;boss.invuln=2.2;
  state='bossAwaken';bossAwakenT=2.6;boss.bossSigT=0;
  bullets.length=0;ebullets.length=0;beams.length=0;orbBullets.length=0;
  player.invuln=2.8;
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
  if(stage===4&&p===2&&boss){
    bossPhaseGlitchT=0.72;
    bossDeathBoom(boss,true);
    for(var pe=0;pe<7;pe++) fx.push({x:boss.x+rand(-90,90),y:boss.y+rand(-60,60),t:-pe*.035,sc:2.0+pe*.22,seed:Math.random()*TAU,kind:'boss',life:2.0});
  }
  boss.phase=p; boss.invuln=1.6; boss.hitFlash=0; boss.ultT=boss.def.ultRate-2.2; boss.ultCharge=0; boss.spiralT=0; boss.broadT=0; boss.blinkT=0; boss.aimT=0; boss.ringT=0; boss.laserT=0;
  boom(boss.x,boss.y,1.5); shake=Math.max(shake,14);
  phaseFx.push({x:boss.x,y:boss.y,t:0,life:1.35,kind:'phase',phase:p});
  setBanner('PHASE '+(p+1),boss.def.name,1.6);
  setBossPattern(0);
}

