// Enemy wave spawning, scaling and firing. Uses legacy world/projectile hooks.
function spawnWave(w){
  if(w.form==='mid'&&w.miniPair){
    for(var mp=0;mp<w.miniPair.length;mp++){
      spawnWave({form:'mid',type:w.miniPair[mp].type,x:w.miniPair[mp].x,mini:true,spd:64});
    }
    return;
  }
  if(w.form==='mid'){
    var mhp=Math.round(w.mini?bossTotalHp(stage)*(stage===4?0.22:0.75):((320+stage*80)*0.85));
    var mx=w.x||W/2;
    enemies.push({type:w.type,x:mx,y:-60,baseX:mx,tx:mx,ty:250,mode:'turret',entering:true,t:0,phase:0,spd:80,hp:mhp,max:mhp,fireT:1.0,flash:0,elite:true,mini:!!w.mini,aggr:(w.mini&&stage>=2?1.45:1.0),visT:0,first:true});
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
    var hpScale=(stage===4?1.0:(1+stage*0.18));
    var ehp=Math.round(ET[w.type].hp*hpScale*((w.elite&&(n<=2||i===0))?0.85:1));
    var e={type:w.type,x:x,y:y,baseX:baseX,tx:tx,ty:ty,mode:mode,entering:(mode==='pincer'||mode==='turret'||mode==='orbitEnter'||mode==='ringEnter'||mode==='arc'),t:0,phase:i*0.7,spd:w.spd,hp:ehp,max:ehp,fireT:w.fodder?6.0+Math.random()*3.0:0.8+Math.random()*0.8,flash:0,noFire:!!w.noFire,aggr:w.aggr||1,role:w.role||'',visT:0,elite:!!w.elite&&(n<=2||i===0),first:(i===0&&waveIndex%2===0)};
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
function enemyScale(e){ return e.mini?2.9:(e.transport?1.45:(e.elite?1.6:1.5)); }
function enemyW(e){ return e.mini?((BOSSES[stage]&&BOSSES[stage].w)||250)*0.55:ET[e.type].w*enemyScale(e); }
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
var MINI_NAMES={9:'COORDINATE',10:'TOPOLOGY TURRET',11:'MOBIUS HUNTER',12:'AXIS CORE',13:'RECURSIVE',14:'MIRROR DEFLECTION'};
var MINI_SKILLS={9:'LATTICE',10:'FAN + LANCE',11:'RING BARRAGE',12:'BOMB ARRAY',13:'TWIN SPIRAL',14:'MIRROR FAN'};
function miniBossFire(e,ra){
  if(!e.miniAtk) e.miniAtk=0;
  e.miniAtk++;e.miniSkillName=MINI_SKILLS[e.type]||'ECHO ATTACK';e.miniSkillT=1.0;
  // retain the original stage-5 enemy attack
  s5FireEnemy(e,ra);
  var rage=(e.hp<e.max*0.5)?1:0;
  var beat=rage?2:3;
  if(e.type===9){                       // COORDINATE: orthogonal lattice
    if(e.miniAtk%beat===0){
      for(var i=-1;i<=1;i++){
        s5Shot(e,e.x+e.y*0+ i*20,e.y+10,Math.cos(ra+i*.12)*170,Math.sin(ra+i*.12)*170,4.2,1);
      }
      for(var j=-1;j<=1;j+=2){
        s5Shot(e,e.x+j*26,e.y+6,Math.cos(ra)*125,Math.sin(ra)*125,4.0,2);
      }
    }
  }else if(e.type===10){                // TOPOLOGY: fan + lance
    if(e.miniAtk%beat===0){
      for(var f=-2;f<=2;f++)s5Shot(e,e.x,e.y+8,Math.cos(ra+f*.14)*145,Math.sin(ra+f*.14)*145,4.8,2);
    }
    if(e.miniAtk%(beat*2)===0&&beams.length<3)spawnBeam(e.x,e.y+8,ra,900,8,.8,.28,1,'#ff9a3a',false,e);
  }else if(e.type===11){                // MOBIUS: ring barrage with fast arcs
    if(e.miniAtk%beat===0){
      var gap=Math.atan2(player.y-e.y,player.x-e.x);
      for(var k=0;k<12;k++){
        var a2=k/12*TAU+time*.2,da=Math.atan2(Math.sin(a2-gap),Math.cos(a2-gap));
        if(Math.abs(da)<.78)continue;
        s5Shot(e,e.x,e.y,Math.cos(a2)*110,Math.sin(a2)*110,4.7,2);
      }
      for(var side=-1;side<=1;side+=2){
        var a4=ra+side*.18;
        s5Shot(e,e.x+side*10,e.y,Math.cos(a4)*240,Math.sin(a4)*240,4.0,1);
      }
    }
  }else if(e.type===12){                // AXIS: bomb array
    if(e.miniAtk%beat===0){
      for(var bi=-1;bi<=1;bi++){
        var btx=Math.max(30,Math.min(W-30,player.x+bi*55+rand(-14,14)));
        var bty=Math.max(90,Math.min(H-60,player.y+rand(-35,35)));
        var bd2=Math.hypot(btx-e.x,bty-e.y),bs=92;
        ebullets.push({x:e.x,y:e.y+8,vx:0,vy:bs,bomb:true,tx:btx,ty:bty,blastR:48,bombSpeed:bs,fuse:Math.max(.4,bd2/bs),rad:9,type:2});
      }
      s5Shot(e,e.x,e.y+6,Math.cos(ra)*210,Math.sin(ra)*210,5.0,1);
    }
  }else if(e.type===13){                // RECURSIVE: two-arm spiral
    if(e.miniAtk%beat===0){
      e.miniAng=(e.miniAng||0)+.52;
      for(var arm=0;arm<2;arm++){
        for(var s2=0;s2<2;s2++){
          var a3=e.miniAng+arm*Math.PI+s2*.18;
          s5Shot(e,e.x,e.y,Math.cos(a3)*(105+s2*28),Math.sin(a3)*(105+s2*28),4.4,2);
        }
      }
    }
  }else{                                // MIRROR: reflected fans + beam
    if(e.miniAtk%beat===0){
      for(var m=0;m<3;m++){
        s5Shot(e,e.x-12,e.y,Math.cos(ra-.30+m*.16)*165,Math.sin(ra-.30+m*.16)*165,4.3,1);
        s5Shot(e,e.x+12,e.y,Math.cos(ra+.30-m*.16)*165,Math.sin(ra+.30-m*.16)*165,4.3,1);
      }
    }
    if(e.miniAtk%(beat*2)===0&&beams.length<3)spawnBeam(e.x,e.y+8,ra,900,7,.8,.26,1,'#ff9ae6',false,e);
  }
}
function fireEnemy(e){
  if(e.transport) return;
  if(e.visT!==undefined&&e.visT<0.22) return;
  if(bullets.length+ebullets.length>240) return;
  var ra=Math.atan2(player.y-e.y,player.x-e.x);
  if(e.mini){miniBossFire(e,ra);return;}
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
    var btx=Math.max(30,Math.min(W-30,player.x+rand(-110,110)));
    var bty=Math.max(70,Math.min(H-50,player.y+rand(-80,80)));
    var bd=Math.hypot(btx-e.x,bty-e.y),bspd=90;
    ebullets.push({x:e.x,y:e.y+10,vx:Math.cos(ra)*bspd,vy:Math.sin(ra)*bspd,rad:9,type:2,bomb:true,tx:btx,ty:bty,blastR:48,bombSpeed:bspd,fuse:Math.max(0.35,bd/bspd)});
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


