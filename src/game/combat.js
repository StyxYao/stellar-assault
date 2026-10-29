// Combat updates: beams, lasers, wingmen, missiles, options and transports.
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
  laserTick-=dt; if(laserTick>0) return; laserTick=0.08/(player.laserRate||vectorLaserRate());
  if(typeof playerOdPatternActive==='function'?playerOdPatternActive():player.odT>0){ laserDamageOD(); return; }
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
    boss.hp-=dmg*0.7;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+20;sfx('b_hit',0.22);hitSpark(boss.x,boss.y+20,false,true);
    if(time-lastHitSfx>0.12){lastHitSfx=time;sfx('b_hit',0.1);}
  }else{
    var et=ET[target.type];target.hp-=dmg;target.flash=0.1;weaponHitFx(0.12);hitSpark(target.x,target.y,player.weapon==='spread',false);
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
    m.travel=(m.travel||0)+Math.hypot(m.vx||0,m.vy||0)*dt;
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
    if(hit||m.life<=0||(m.range&&m.travel>m.range)||m.x<-30||m.x>W+30||m.y<-40||m.y>H+40) missiles.splice(i,1);
  }
}
function aegisBlockedBeamLen(b) {
  if (typeof player === 'undefined' || player.ship !== 'aegis') return null;
  if (typeof aegisState === 'undefined' || aegisState.force === 'broken') return null;
  var attached = aegisState.force === 'attached';
  var fx = attached ? aegisCoreX() : aegisState.forceX;
  var fy = attached ? player.y : aegisState.forceY;
  var br = (typeof aegisShieldRadius==='function'?aegisShieldRadius():30);
  var dx = fx - b.x, dy = fy - b.y;
  var proj = dx * Math.cos(b.ang) + dy * Math.sin(b.ang);
  var perp = Math.abs(-dx * Math.sin(b.ang) + dy * Math.cos(b.ang));
  if (proj > 0 && proj < b.len && perp < br + b.w * 0.5) {
    return Math.max(0, proj - br);
  }
  return null;
}

function updateBeams(dt){
  for(var i=beams.length-1;i>=0;i--){
    var b=beams[i];b.t+=dt;b.blockedLen=aegisBlockedBeamLen(b);
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
      var beamLen=(b.blockedLen!=null?b.blockedLen:b.len);
      if(proj>0&&proj<beamLen&&perp<b.w/2+player.r) hitPlayer();
      if(typeof coopEnabled!=='undefined'&&coopEnabled&&player2){
        var p2dx=player2.x-b.x,p2dy=player2.y-b.y;
        var p2proj=p2dx*Math.cos(b.ang)+p2dy*Math.sin(b.ang);
        var p2perp=Math.abs(-p2dx*Math.sin(b.ang)+p2dy*Math.cos(b.ang));
        if(p2proj>0&&p2proj<beamLen&&p2perp<b.w/2+player2.r) coopHitP2();
      }
    }
    if(b.t>b.charge+b.fire+(b.fade||0.15)) beams.splice(i,1);
  }
}


function spawnTransport(){
  var side=rng()<0.5?-1:1;
  enemies.push({type:3,x:side<0?-70:W+70,y:135,baseX:W/2,mode:'transport',vx:side*95,hp:180+stage*40,max:180+stage*40,t:0,phase:0,spd:0,fireT:999,flash:0,transport:true,first:false});
}

