// Player weapon firing, missiles and wing laser. Uses legacy projectile hooks.
function weaponName(){ return ({normal:'NORMAL',none:'NONE',spread:'SPREAD',laser:'LASER',missile:'MISSILE'})[player.weapon]||'NORMAL'; }
function cycleWeapon(){
  var order=['normal','spread','laser','missile'];
  var idx=order.indexOf(player.weapon);
  player.weapon=order[(idx+1)%order.length];
  pickupT=1.1;pickupMsg='WEAPON · '+weaponName();
  sfx('pickup_real',0.28);
}
function powerDamageFactor(){ return (([1,0.96,0.94,0.60][Math.max(0,Math.min(3,player.specialPower-1))]||1)*1.10)*(player.odT>0?1.20:1); }
function addShot(x,y,vx,vy,dmg,wing,laser,special,max,range){ var f=powerDamageFactor(); shots.push({x:x,y:y,vx:vx,vy:vy,dmg:dmg*f*(wing?0.6615:1),wing:!!wing,laser:!!laser,special:!!special,max:!!max,travel:0,range:range||1200}); }
function fireNormal(){
  var lv=player.specialPower;
  if(player.odT>0){
    for(var row=0;row<3;row++){
      for(var i=-2;i<=2;i++) addShot(player.x+i*13,player.y-24-row*9,0,-940,2.4,false,false,true,true);
    }
    addShot(player.x-27,player.y-16,-110,-860,4.0,false,false,false,true);
    addShot(player.x+27,player.y-16,110,-860,4.0,false,false,false,true);
    return;
  }
  if(lv<=1){ addShot(player.x-10,player.y-22,0,-900,3); addShot(player.x+10,player.y-22,0,-900,3); }
  else if(lv===2){ addShot(player.x-12,player.y-22,0,-900,3); addShot(player.x,player.y-26,0,-900,3); addShot(player.x+12,player.y-22,0,-900,3); }
  else if(lv===3){ addShot(player.x-20,player.y-18,-90,-880,2.6); addShot(player.x-7,player.y-24,0,-920,2.6); addShot(player.x+7,player.y-24,0,-920,2.6); addShot(player.x+20,player.y-18,90,-880,2.6); }
  else {
    for(var i=-2;i<=2;i++) addShot(player.x+i*13,player.y-22,0,-930,3.2,false,false,false,true);
    addShot(player.x-24,player.y-16,-110,-860,4.5,false,false,false,true);
    addShot(player.x+24,player.y-16,110,-860,4.5,false,false,false,true);
  }
}
function fireSpread(){
  if(player.odT>0){
    var n=18,sp=760;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+time*0.6;
      addShot(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,1.55,false,false,true,true);
    }
    return;
  }
  var n=3+(player.specialPower-1)*2,spread=0.13,sp=860;
  for(var i=0;i<n;i++){
    var a=(i-(n-1)/2)*spread;
    addShot(player.x,player.y-20,Math.sin(a)*sp,-Math.cos(a)*sp,player.specialPower>=4?2.6:1.8,false,false,true,player.specialPower>=4);
  }
}
function spawnMissile(x,y,wing,dmg,max,vx0,vy0,range){
  dmg=(dmg||6)*powerDamageFactor();
  if(wing) dmg*=0.6615;
  missiles.push({x:x,y:y,vx:vx0||0,vy:vy0!==undefined?vy0:52,t:0,ignite:0.2,life:2.8,dmg:dmg||6,wing:!!wing,max:!!max,ignited:false,travel:0,range:range||1000});
}
function launchMissiles(){
  if(player.odT>0){
    var dirs=[[0,-300],[-300,0],[300,0],[0,300]];
    for(var g=0;g<4;g++){
      for(var j=-1;j<=1;j++){
        var d=dirs[g],ox=d[0]!==0?j*18:j*10,oy=d[1]!==0?j*10:j*18;
        spawnMissile(player.x+ox,player.y+oy,false,5,true,d[0],d[1]);
      }
    }
    playMissileLaunch();return;
  }
  var n=player.specialPower+1;
  for(var i=0;i<n;i++){
    var x=player.x+(i-(n-1)/2)*14;
    spawnMissile(x,player.y-16,false,player.specialPower>=4?8:6,player.specialPower>=4);
  }
  playMissileLaunch();
}
function fireWingLaser(p,wp,max){
  var w=4+wp*1.5,dmg=(1.0+wp*0.4)*(max?1.5:1)*0.6615*powerDamageFactor();
  var target=null,tIdx=-1,tY=0,isBoss=false;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-p.x)<w/2+enemyW(e)*0.3&&e.y<p.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-p.x)<w/2+boss.def.w*0.22*1.15&&boss.y<p.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  if(target){
    if(isBoss){boss.hp-=dmg*0.5;boss.hitFlash=0.1;boss.hitX=p.x;boss.hitY=boss.y+16;}
    else{target.hp-=dmg;target.flash=0.1;if(target.hp<=0){score+=ET[target.type].score;enemyDeath(target);maybeDrop(target);removeEnemy(tIdx);}}
  }
  wingBeams.push({x:p.x,y:p.y-8,endY:target?tY:0,t:0,life:0.16,w:w,max:!!max});
  sfx('p_laser',0.10);
}

