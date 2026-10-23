// Boss ultimates, fused-boss signatures and ultimate dispatch.
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

