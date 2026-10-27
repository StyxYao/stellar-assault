// Player damage, bombs, drops, weapon pickups and item collection.
function bomb(){
  if((state!=='play'&&state!=='boss')||player.bombs<=0) return;
  if(player.ship==='aegis'){
    if(typeof aegisRestoreForce==='function' && aegisState.force==='broken') aegisRestoreForce();
    else if(typeof aegisLaunchForce==='function') aegisLaunchForce();
    return;
  }
  if(player.ship==='phantom'){ if(typeof phantomSkill==='function') phantomSkill(); return; }
  player.bombs--; shake=24; bombT=1.1; bombX=player.x; bombY=player.y; player.invuln=Math.max(player.invuln,0.8); sfx('b_charge',0.55); sfx('bomb_big',0.95); sfx('heavy_missile',0.42);
  for(var bp=0;bp<42;bp++) part(bombX,bombY,bp%2?'#bff4ff':'#ffd28a',1,320);
  for(var i=0;i<bullets.length;i++) part(bullets[i].x,bullets[i].y,'#9fe8ff',1,150);
  for(var i=0;i<ebullets.length;i++) part(ebullets[i].x,ebullets[i].y,'#9fe8ff',1,110);
  bullets.length=0; ebullets.length=0; beams.length=0; orbBullets.length=0;
  for(var i=enemies.length-1;i>=0;i--){
    var eb=enemies[i];
    eb.hp-=200;
    if(eb.hp<=0){ part(eb.x,eb.y,'#ffb066',10,180); enemyDeath(eb); score+=ET[eb.type].score; maybeDrop(eb); removeEnemy(i); }
  }
  if(boss){ boss.hp-=200; boss.flash=0.2; }
}
function hitPlayer(){
  if(player.odT>0) return;
  if(player.invuln>0||state!=='play'&&state!=='boss') return;
  // AEGIS shield absorbs any direct hit while attached and charged.
  if(player.ship==='aegis'&&typeof aegisAbsorbHit==='function'&&aegisAbsorbHit()){
    // Remove the contacting projectile so it cannot drain the shield again next frame.
    for(var si=ebullets.length-1;si>=0;si--){var sb=ebullets[si];var sdx=sb.x-player.x,sdy=sb.y-player.y;if(sdx*sdx+sdy*sdy<110*110) ebullets.splice(si,1);}
    for(var so=orbBullets.length-1;so>=0;so--){var ob=orbBullets[so];var odx=ob.x-player.x,ody=ob.y-player.y;if(odx*odx+ody*ody<110*110) orbBullets.splice(so,1);}
    return;
  }
  // VECTOR wingmen are now pure firepower; they no longer absorb hits.
  player.noBlink=false;
  player.hitFlashT=0.22;
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
    player.lives--; player.hp=player.maxHp||3; player.invuln=2.2; shake=18;
    player.specialPower=Math.max(1,player.specialPower-1); player.power=player.specialPower; player.powerXp=0; player.od=0; player.odT=0; player.bombs=3; player.options=Math.max(0,player.options-1); player.wingEntry=player.wingEntry.slice(0,player.options);
    rebuildSfxBus();
    if(player.ship==='phantom'&&typeof phantomOnDeath==='function') phantomOnDeath();
    player.respawnT=1.3; player.respawnGift=atMin;
    player.x=W/2; player.y=H-130; target.x=player.x; target.y=player.y;
    boom(dX,dY,1.5,'player');
    if(player.lives<=0){ player.respawnT=0; state='over'; if(player.ship==='aegis'&&typeof aegisOnDeath==='function') aegisOnDeath(); if(player.ship==='phantom'&&typeof phantomOnDeath==='function') phantomOnDeath(); if(typeof recordRunEnd==='function') recordRunEnd(false); playBgm('m5'); }
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
    items.push({x:e.x+24,y:e.y,vy:45,type:'D',t:0});
    items.push({x:e.x,y:e.y+16,vy:45,type:'E',t:0});
    if(rng()<0.21) items.push({x:e.x+12,y:e.y+24,vy:40,type:'1UP',t:0});
    return;
  }
  if(e.transport) return;
  if(e.elite){
    items.push({x:e.x-20,y:e.y,vy:50,type:'D',t:0});
    items.push({x:e.x+20,y:e.y,vy:50,type:'P',t:0});
    if(rng()<0.165) items.push({x:e.x,y:e.y+20,vy:45,type:'1UP',t:0});
    return;
  }
  var chance=([0.10,0.14,0.16,0.35,0.28,0.14][e.type]||0.10)*0.75;
  if(!e.first && rng()>=chance) return;
  var r=rng(),type;
  if(r<0.40) type='P';
  else if(r<0.52) type='D';
  else if(r<0.66) type='E';
  else if(r<0.96) type='A';
  else type='1UP';
  if(e.first && type==='E') type='P';
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
  if(t==='W') t='D';
  if(t==='B') t='E';
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
  else if(t==='D'){
    if(player.ship==='phantom'){ if(typeof phantomCollectW==='function') phantomCollectW(); }
    else if(player.ship==='aegis'){
      if(typeof aegisForcePickup==='function') aegisForcePickup();
    }else if(player.options<4||player.wingPower<3){addWingman();pickupMsg='DRONE '+player.options+' P'+player.wingPower;}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'DRONE MAX +15 OD';}
    score+=40;
  }else if(t==='1UP'){
    if(player.lives<7){player.lives++;pickupMsg='1UP  LIFE +1';}
    else{pickupMsg=gainOD(25)?'OVERDRIVE!':'LIFE MAX +25 OD';}
    score+=250;
  }else{
    if(player.ship==='phantom'){ if(typeof phantomCollectB==='function') phantomCollectB(); }
    else if(player.bombs<(player.ship==='aegis'?9:5)){player.bombs++;pickupMsg=player.ship==='aegis'?'FORCE CHARGE +1':'ENERGY +1';}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'ENERGY MAX +15 OD';}
    if(player.ship!=='phantom') score+=30;
  }
  part(it.x,it.y,'#9fe8ff',10,120);
  sfx('pickup_real',0.48); if(t==='1UP') playOneUp();
  pickupT=1.4;
}

