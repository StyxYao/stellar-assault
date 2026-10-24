// Main fixed-step gameplay update. Uses the legacy closure state during migration.
function step(dt){
  if(typeof updateDesktopInput==='function'&&!desktopPaused) updateDesktopInput(dt);
  time+=dt;
  if(typeof updateAegis==='function') updateAegis(dt);
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
  if(state==='finale'){finaleT+=dt;if(finaleT>=8.35)startCast();return;}
  if(state==='cast'){castT+=dt;castScroll=Math.min(CAST_TOTAL,castScroll+32*dt);if(castScroll>=CAST_TOTAL)castHoldT+=dt;return;}
  if(state==='menu'||state==='win'||state==='over') return;

  if(state==='warpOut'){
    warpT-=dt; warpSpeed+=1100*dt; player.y-=warpSpeed*dt; player.x=W/2;
    if(warpT<=0){
      if(stage<STAGES.length-1) startStage(stage+1);
      else { state='win'; if(typeof recordRunEnd==='function') recordRunEnd(true); }
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
      if(time-lastShot>(player.odT>0?0.033:0.10)){ lastShot=time; fireNormal(); blasterShot(); }
    }
  }
  if(bannerT>0) bannerT-=dt;
  if(state==='intro'){
    if(bannerT<=0){ state='play'; stageT=0; }
  }else if(state==='play'){
    stageT+=dt;
    var waves=STAGES[stage].waves;
    if(enemies.some(function(e){return e.mini;})){
      // hold the next waves while a mini boss is alive
      for(var wi=waveIndex;wi<waves.length;wi++) waves[wi].t+=dt;
    }else{
      while(waveIndex<waves.length&&waves[waveIndex].t<=stageT){
        if(stage===4&&enemies.length>=6&&!waves[waveIndex].miniPair) break;
        spawnWave(waves[waveIndex]); waveIndex++;
      }
    }
    if(stageT>nextTransport&&!enemies.some(function(e){return e.transport;} )){ if(Math.random()<0.55) spawnTransport(); nextTransport=stageT+22+Math.random()*10; }
    if(waveIndex>=waves.length&&(enemies.length===0||stageT>waves[waves.length-1].t+8)) startBossWarn();
  }else if(state==='bossWarn'){
    if(bannerT<=0) spawnBoss();
  }else if(state==='clear'){
    if(bannerT<=0){
      if(stage<STAGES.length-1){ state='warpOut'; warpT=1.1; warpSpeed=320; playWarpJet(0.9); }
      else { if(stage===4){ if(typeof recordRunEnd==='function') recordRunEnd(true); startCast(); } else {state='win'; if(typeof recordRunEnd==='function') recordRunEnd(true); playBgm('m5');} }
    }
  }

  for(var i=shots.length-1;i>=0;i--){
    var s=shots[i]; s.x+=(s.vx||0)*dt; s.y+=s.vy*dt;
    if(s.y<-20){shots.splice(i,1);continue;}
    var hit=false;
    for(var j=enemies.length-1;j>=0;j--){
      var e=enemies[j],et=ET[e.type];
      if(Math.abs(s.x-e.x)<enemyW(e)*(e.mini?0.30:0.45)&&Math.abs(s.y-e.y)<enemyW(e)*(e.mini?0.32:0.5)){
        e.hp-=s.dmg; e.flash=0.1; hit=true; weaponHitFx(0.20); hitSpark(e.x,e.y,player.weapon==='spread',false);
        if(e.hp<=0){ score+=et.score; part(e.x,e.y,'#ffb066',9,160); enemyDeath(e); maybeDrop(e); removeEnemy(j); }
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0){
      if(Math.abs(s.x-boss.x)<boss.def.w*0.30*1.15&&Math.abs(s.y-boss.y)<boss.def.h*0.34*1.15){
        boss.hp-=s.dmg; boss.flash=0.1; boss.hitFlash=0.14; boss.hitX=s.x; boss.hitY=s.y; score+=5; hit=true; sfx('b_hit',0.30); hitSpark(boss.x,boss.y,false,true);
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
    }else if(e.mode==='turret'&&e.mini){
      if(e.type===11){e.x=e.baseX+Math.sin(e.t*1.2)*88;e.y=e.ty+Math.sin(e.t*.7)*10;}
      else if(e.type===12){e.x=e.baseX+Math.cos(e.t*.95)*50;e.y=e.ty+Math.sin(e.t*1.5)*32;}
      else if(e.type===13){e.x=e.baseX+Math.cos(e.t*.7)*64;e.y=e.ty+Math.sin(e.t*.7)*20;}
      else if(e.type===14){e.x=e.baseX+Math.sin(e.t*.9+Math.PI)*62;e.y=e.ty+Math.cos(e.t*1.2)*18;}
      else if(e.type===10){e.x=e.baseX+Math.sin(e.t*.8)*38;e.y=e.ty+Math.cos(e.t*1.1)*24;}
      else {e.x=e.baseX+Math.sin(e.t*1.4)*42;e.y=e.ty+Math.sin(e.t*.9)*14;}
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
    if(e.miniSkillT>0)e.miniSkillT=Math.max(0,e.miniSkillT-dt);
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
    if(bossPhaseGlitchT>0) bossPhaseGlitchT=Math.max(0,bossPhaseGlitchT-dt);
    if(boss.dropT==null)boss.dropT=25.0;
    boss.dropT-=dt;
    if(boss.dropT<=0){
      boss.dropT=25.0;
      var dropTypes=['P','A','W','B'];
      for(var di=0;di<2;di++){
        var dx=Math.max(36,Math.min(W-36,player.x+rand(-110,110)));
        items.push({x:dx,y:-20,vy:65+di*12,type:dropTypes[(Math.floor(time*3)+di)%dropTypes.length],t:0});
      }
    }
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
      if(boss.phase===0&&boss.hp<boss.max*0.60&&stage!==4) bossPhase(1);
      else if(boss.phase===1&&boss.hp<boss.max*(stage===4?0.50:0.30)) bossPhase(2);
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
      }else{setBanner('STAGE CLEAR',STAGES[stage].name,3.0);state='clear';if(typeof recordStageClear==='function') recordStageClear();}
      boss=null; runner=null;
    }
    if(boss){boss.prevX=boss.x;boss.prevY=boss.y;}
    var bdx2=boss?boss.x-player.x:0,bdy2=boss?boss.y-player.y:0;
    if(boss&&bdx2*bdx2+bdy2*bdy2<(boss.def.w*0.28*1.15)*(boss.def.w*0.28*1.15)) hitPlayer();
  }

  if(state==='play'&&enemies.some(function(e){return e.mini;})){
    miniDropT-=dt;
    if(miniDropT<=0){
      miniDropT=25;
      var mdrop=['P','A','W','B'];
      for(var md=0;md<2;md++){
        items.push({x:Math.max(36,Math.min(W-36,player.x+rand(-90,90))),y:-20,vy:65+md*10,type:mdrop[(Math.floor(time*3)+md)%4],t:0});
      }
    }
  }else if(!enemies.some(function(e){return e.mini;})) miniDropT=25;
  for(var i=ebullets.length-1;i>=0;i--){
    var e=ebullets[i]; e.x+=e.vx*dt; e.y+=e.vy*dt;
    if(e.bomb){
      e.fuse-=dt;
      if(e.tx!=null){
        var bdx=e.tx-e.x,bdy=e.ty-e.y,bd=Math.hypot(bdx,bdy);
        var bstep=Math.min(bd,(e.bombSpeed||220)*dt);
        if(bd>2){e.x+=bdx/bd*bstep;e.y+=bdy/bd*bstep;}
        if(bd<=6||e.fuse<=0){
          e.x=e.tx;e.y=e.ty;enemyBombExplode(e);ebullets.splice(i,1);continue;
        }
      }else if(e.fuse<=0){
        enemyBombExplode(e);ebullets.splice(i,1);continue;
      }
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


