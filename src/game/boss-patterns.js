// Boss attack patterns. Simulation helpers; still use the legacy closure hooks.
function bossAimed(n){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>260) return;
  if(stage===2) n=Math.max(2,Math.round(n*0.7));
  var a=bossGapAngle(),sp=185+stage*8,spread=0.22;
  for(var i=0;i<n;i++){
    if(n>=5&&Math.abs(i-(n-1)/2)<1.01) continue;
    var ang=a+(i-(n-1)/2)*spread;
    ebullets.push({x:boss.x,y:boss.y+18,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,rad:6,type:1});
  }
  sfx('e_shot',0.20);
}
function bossGapAngle(){ return Math.PI/2 + Math.sin(time*0.42)*0.9; }
function bossRing(n){
  if(!boss||boss.invuln>0||n<=0) return;
  sfx('e_shot',0.17);
  if(bullets.length+ebullets.length>280) return;
  n=Math.min(n,14);var sp=92+stage*7,gap=bossGapAngle();
  for(var i=0;i<n;i++){
    var a=i/n*TAU+time*0.25;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.68) continue;
    ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5.5,type:2});
  }
}
function bossSpiral(arms,dir,speed){
  if(!boss||boss.invuln>0) return;
  boss.spiralAng+=0.24*dir;
  for(var a=0;a<arms;a++){
    var ang=boss.spiralAng+a*TAU/arms;
    ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,rad:5,type:2});
  }
  sfx('e_shot',0.09);
}
function bossWall(){
  if(!boss||boss.invuln>0) return;
  var n=12,gap=2+Math.floor(((Math.sin(time*.55)+1)/2)*(n-4));
  for(var i=0;i<n;i++){
    if(Math.abs(i-gap)<1.5) continue;
    ebullets.push({x:W*0.08+i*(W*0.84/(n-1)),y:boss.y+30,vx:0,vy:95+stage*6,rad:5.5,type:1});
  }
  sfx('e_shot',0.2);
}
function bossBroadside(){
  if(!boss||boss.invuln>0) return;
  var ba=Math.atan2(player.y-(boss.y+24),player.x-boss.x);
  spawnBeam(boss.x-78,boss.y+24,ba,1600,20,1.2,0.42,1,bossBeamColor(),true,boss);
  spawnBeam(boss.x+78,boss.y+24,ba,1600,20,1.2,0.42,1,bossBeamColor(),true,boss);
  shake=Math.max(shake,5);
}
function bossSeraphFan(){
  if(!boss||boss.invuln>0) return;
  var n=12,sp=112+stage*5,a0=Math.PI/2;
  for(var i=0;i<n;i++){
    if(Math.abs(i-(n-1)/2)<1.01) continue;
    var a=a0+(i-(n-1)/2)*0.078;
    ebullets.push({x:boss.x,y:boss.y+24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:1});
  }
  for(var j=0;j<6;j++){
    var side=j<3?-1:1, off=(j%3)*0.12;
    var ba=a0+side*(0.42+off);
    ebullets.push({x:boss.x+side*80,y:boss.y+8,vx:Math.cos(ba)*(90+stage*5),vy:Math.sin(ba)*(90+stage*5),rad:6,type:2});
  }
  sfx('e_shot',0.22);
}
function bossVortex(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>270) return;
  var arms=2,per=10,sp=88+stage*7,gap=bossGapAngle();
  for(var arm=0;arm<arms;arm++){
    for(var i=0;i<per;i++){
      var a=arm/arms*TAU+i/per*TAU+time*0.45;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.78) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:2});
    }
  }
  sfx('e_shot',0.16);
}
function bossCrossfire(){
  if(!boss||boss.invuln>0) return;
  var a=bossGapAngle();
  if(beams.length<5){
    spawnBeam(boss.x-82,boss.y+18,a,1400,13,0.8,0.32,1,bossBeamColor(),false,boss);
    spawnBeam(boss.x+82,boss.y+18,a,1400,13,0.8,0.32,1,bossBeamColor(),false,boss);
  }
  for(var side=-1;side<=1;side+=2){
    for(var i=0;i<3;i++){
      var ba=a+side*(0.30+i*0.10);
      ebullets.push({x:boss.x+side*78,y:boss.y+18,vx:Math.cos(ba)*(125+stage*6),vy:Math.sin(ba)*(125+stage*6),rad:5,type:1});
    }
  }
  sfx('e_charge',0.16);
}
function bossHiveBurst(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>270) return;
  var gap=bossGapAngle(),per=stage===2?7:10;
  for(var r=0;r<2;r++){
    for(var i=0;i<per;i++){
      var a=i/12*TAU+r*0.26+time*0.18;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.64) continue;
      ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(a)*(75+r*28),vy:Math.sin(a)*(75+r*28),rad:4.5,type:2});
    }
  }
  sfx('e_shot',0.18);
}
function bossHalo(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>280) return;
  var n=18,sp=98+stage*6,a0=time*0.38;
  var gap=bossGapAngle();
  for(var i=0;i<n;i++){
    var a=a0+i/n*TAU;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.70) continue;
    ebullets.push({x:boss.x,y:boss.y+6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:1});
  }
  for(var s=-1;s<=1;s+=2){
    var ba=Math.PI/2+s*0.55;
    for(var k=0;k<3;k++) ebullets.push({x:boss.x+s*70,y:boss.y+12,vx:Math.cos(ba+k*0.09*s)*(85+stage*5),vy:Math.sin(ba+k*0.09*s)*(85+stage*5),rad:5,type:2});
  }
  sfx('e_shot',0.18);
}
function bossGatling(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>275) return;
  var a=bossGapAngle(),sp=245+stage*8;
  for(var i=0;i<6;i++){
    var aa=a+(i-2.5)*0.045;
    ebullets.push({x:boss.x,y:boss.y+14,vx:Math.cos(aa)*sp,vy:Math.sin(aa)*sp,rad:3.8,type:1});
  }
  sfx('e_shot',0.14);
}
function bossBombBarrage(){
  if(!boss||boss.invuln>0) return;
  if(ebullets.length>250) return;
  for(var i=0;i<5;i++){
    var tx=player.x+(i-2)*46;
    ebullets.push({x:boss.x+(i-2)*54,y:boss.y+24,vx:(tx-boss.x)*0.28,vy:95,bomb:true,bossBomb:true,fuse:1.35,rad:12,type:2});
  }
  sfx('e_charge',0.22);
}
function bossRotatingLaser(){
  if(!boss||boss.invuln>0) return;
  if(beams.length>4) return;
  var ey=boss.y+18;
  var base=Math.atan2(player.y-ey,player.x-boss.x);
  // two side cannons converge toward the target, then reverse into a widening fan.
  var sides=[boss.x-78,boss.x+78];
  for(var k=0;k<2;k++){
    var b=spawnBeam(sides[k],ey,base+(k===0?-1:1)*0.06,1300,11,0.90,2.7,1,'#ff9a3a',false,boss);
    if(b){
      b.fan={base:base,side:k===0?1:-1,min:0.055,max:0.52,turn:0.08,rate:1.35,phase:0};
      b.ang=base+b.fan.side*b.fan.min;
    }
  }
  boss.spiralAng+=0.35;
  sfx('e_charge',0.18);
}
function bossCrossLaser(){
  if(!boss||boss.invuln>0||boss.crossOrb) return;
  boss.crossOrb={x:boss.x,y:boss.y,tx:W/2,ty:H*0.48,t:0,travel:0.55,charge:2.05,armed:false,pal:(SIG_BOSS>=0?SIG_BOSS:4)};
  sfx('e_charge',0.30);
}
function bossCrossArms(){
  var cx=W/2,cy=H*0.48,len=Math.max(W,H)*0.9;
  var pal=(boss.crossOrb&&boss.crossOrb.pal!=null)?boss.crossOrb.pal:(SIG_BOSS>=0?SIG_BOSS:4);
  var col=(BOSS_PALETTES[pal]||BOSS_PALETTES[4]).beam;
  var aim=Math.atan2(player.y-cy,player.x-cx);
  for(var k=0;k<4;k++){
    spawnBeam(cx,cy,aim+k*Math.PI/2,len,12,0.28,0.82,1,col,false,null);
  }
  sfx('laser_fire',0.45);
}
function bossChronosBloom(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>300) return;
  var gap=bossGapAngle();
  for(var r=0;r<3;r++){
    for(var i=0;i<12;i++){
      var a=i/12*TAU+r*.24+time*.12;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.62-r*0.05) continue;
      ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(a)*(78+r*30),vy:Math.sin(a)*(78+r*30),rad:5,type:r===2?1:2});
    }
  }
  sfx('e_shot',0.20);
}
function bossEchoCross(){
  if(!boss||boss.invuln>0) return;
  if(beams.length>7) return;
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  for(var i=0;i<4;i++){
    var a=time*.35+i*Math.PI/2;
    var ex=boss.x+Math.cos(a)*110,ey=boss.y+Math.sin(a)*72;
    var ta=Math.atan2(player.y-ey,player.x-ex)+(i-1.5)*0.035;
    spawnBeam(ex,ey,ta,1200,8,0.72,0.28,1,cols[i],false,null);
  }
  sfx('e_charge',0.22);
}
function bossCollapse(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>320) return;
  var gap=bossGapAngle();
  for(var i=0;i<22;i++){
    var a=i/22*TAU+time*.25;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.58) continue;
    ebullets.push({x:boss.x,y:boss.y+12,vx:Math.cos(a)*(70+stage*6),vy:Math.sin(a)*(70+stage*6),rad:5,type:2});
  }
  sfx('e_shot',0.20);
}
function bossSwarm(){
  if(!boss||boss.invuln>0) return;
  for(var s=-1;s<=1;s+=2){
    var base=bossGapAngle()+s*0.24;
    for(var k=0;k<2;k++){
      if(stage===2&&s>0&&k===1) continue;
      var a=base+(k-1.5)*0.10;
      ebullets.push({x:boss.x+s*62,y:boss.y+22,vx:Math.cos(a)*(150+stage*6),vy:Math.sin(a)*(150+stage*6),rad:5,type:1});
    }
  }
  sfx('e_shot',0.16);
}
function bossBlink(){
  if(!boss||boss.invuln>0) return;
  for(var k=0;k<12;k++) part(boss.x+rand(-50,50),boss.y+rand(-30,30),'#c58bff',2,180);
  boss.x=rand(80,W-80);boss.y=210+rand(-20,20);boss.invuln=Math.min(boss.invuln||0,0.12);
  for(var k=0;k<12;k++) part(boss.x+rand(-50,50),boss.y+rand(-30,30),'#c58bff',2,180);
  sfx('e_charge',0.3);
}

