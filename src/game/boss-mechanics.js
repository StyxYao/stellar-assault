// R6 boss mechanics: one core interaction per boss.
var bossMech={stage:-1,phase:'idle',t:0,next:8,warnT:0,activeT:0,data:null,msg:'',msgT:0};
var BOSS_MECH_NAMES=['CORE LOCK','DEVOUR','SIEGE CHARGE','RADIANT CAGE','ECHO LOCK'];
function bossMechReset(i){
  bossMech.stage=i;bossMech.phase='idle';bossMech.t=0;bossMech.next=8;
  bossMech.warnT=0;bossMech.activeT=0;bossMech.data=null;bossMech.msg='';bossMech.msgT=0;
}
function bossMechBegin(){
  if(!boss||state!=='boss') return;
  bossMech.phase='warn';bossMech.warnT=1.45;bossMech.msg=BOSS_MECH_NAMES[bossMech.stage]||'BOSS CORE';bossMech.msgT=1.7;
  try{sfx('siren',0.36);}catch(e){}
  if(bossMech.stage===0){bossMech.data={kind:'core'};}
  else if(bossMech.stage===1){bossMech.data={kind:'devour'};}
  else if(bossMech.stage===2){bossMech.data={kind:'charge',baseY:boss.y,t:0};}
  else if(bossMech.stage===3){bossMech.data={kind:'cage',gapX:W/2};}
  else{bossMech.data={kind:'echo',x:player.x,y:player.y};}
}
function bossMechStart(){
  bossMech.phase='active';
  if(!bossMech.data) return;
  if(bossMech.data.kind==='core') bossMech.activeT=2.8;
  else if(bossMech.data.kind==='devour') bossMech.activeT=2.4;
  else if(bossMech.data.kind==='charge') bossMech.activeT=0.9;
  else if(bossMech.data.kind==='cage') bossMech.activeT=2.4;
  else bossMech.activeT=1.6;
  if(bossMech.data.kind==='core') try{sfx('alarm',0.35);}catch(e){}
  if(bossMech.data.kind==='echo') try{sfx('b_charge',0.3);}catch(e){}
}
function bossMechHitP1(){if(player.invuln<=0&&typeof hitPlayer==='function')hitPlayer();}
function bossMechHitP2(){if(typeof coopEnabled!=='undefined'&&coopEnabled&&typeof coopHitP2==='function')coopHitP2();}
function updateBossMech(dt){
  if(state!=='boss'||!boss||boss.hp<=0){return;}
  if(bossMech.stage<0||bossMech.stage>4) return;
  if(bossMech.msgT>0) bossMech.msgT=Math.max(0,bossMech.msgT-dt);
  if(bossMech.phase==='idle'){
    bossMech.t+=dt;
    if(bossMech.t>=bossMech.next) bossMechBegin();
    return;
  }
  var d=bossMech.data;
  if(bossMech.phase==='warn'){
    bossMech.warnT-=dt;
    // Suppress normal patterns while the interaction is telegraphed.
    if(boss.invuln<=0) boss.invuln=0.06;
    if(bossMech.warnT<=0) bossMechStart();
    return;
  }
  if(bossMech.phase!=='active'||!d) return;
  bossMech.activeT-=dt;
  if(d.kind==='core'){
    boss.invuln=0;
  }else if(d.kind==='devour'){
    boss.invuln=0;
    var pull=.44*dt;
    target.x+=(boss.x-target.x)*pull;
    target.y+=(boss.y+90-target.y)*pull*.55;
    if(typeof coopEnabled!=='undefined'&&coopEnabled&&typeof target2!=='undefined'){
      target2.x+=(boss.x-target2.x)*pull*.8;
      target2.y+=(boss.y+90-target2.y)*pull*.45;
    }
    if(vrng()<dt*18&&typeof part==='function'){part(boss.x+vrand(-90,90),boss.y+80,'#b58bff',1,120);}
  }else if(d.kind==='charge'){
    d.t+=dt;
    var q=Math.min(1,d.t/0.55),ease=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
    boss.y=d.baseY+(H*.54-d.baseY)*ease;
    boss.invuln=0.06;
    if(d.t>0.68) boss.y=d.baseY+(H*.54-d.baseY)*(1-Math.min(1,(d.t-.68)/.22));
  }else if(d.kind==='cage'){
    d.gapX=W/2+Math.sin(time*1.15)*W*.14;
    boss.invuln=0;
    var outside=Math.abs(player.x-d.gapX)>W*.22;
    if(outside) bossMechHitP1();
    if(typeof coopEnabled!=='undefined'&&coopEnabled&&player2&&Math.abs(player2.x-d.gapX)>W*.22) bossMechHitP2();
  }else if(d.kind==='echo'){
    boss.invuln=0;
    if(!d.hit&&Math.hypot(player.x-d.x,player.y-d.y)<46){d.hit=true;bossMechHitP1();}
    if(!d.hit2&&typeof coopEnabled!=='undefined'&&coopEnabled&&player2&&Math.hypot(player2.x-d.x,player2.y-d.y)<46){d.hit2=true;bossMechHitP2();}
  }
  if(bossMech.activeT<=0){
    if(bossMech.data&&bossMech.data.kind==='echo'){
      var ed=bossMech.data;
      try{for(var ei=0;ei<26;ei++){var ea=ei/26*TAU;part(ed.x+Math.cos(ea)*20,ed.y+Math.sin(ea)*20,ei%2?'#9fe8ff':'#ffd27a',2,220);}}catch(e){}
      try{boom(ed.x,ed.y,1.0);shake=Math.max(shake,14);sfx('bomb_big',0.58);}catch(e){}
    }
    bossMech.phase='idle';bossMech.t=0;bossMech.next=bossMech.stage===0?12:(bossMech.stage===1?13:(bossMech.stage===2?11:(bossMech.stage===3?12:10)));
    bossMech.data=null;
  }
}
function drawBossMech(){
  if(state!=='boss'||!boss||bossMech.stage<0) return;
  var d=bossMech.data;
  if(bossMech.msgT>0){
    var a=Math.min(1,bossMech.msgT*2);
    ctx.save();ctx.textAlign='center';ctx.globalAlpha=a;ctx.fillStyle='#ffd27a';ctx.font='700 10px monospace';
    ctx.fillText(bossMech.phase==='active'&&d&&d.kind==='core'?'CORE EXPOSED':'!  '+bossMech.msg+'  !',W/2,H*.145);
    ctx.restore();ctx.textAlign='left';
  }
  if(!d) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(d.kind==='core'&&bossMech.phase==='active'){
    var pulse=.35+.35*Math.sin(time*14);
    ctx.globalAlpha=.35+.25*pulse;ctx.strokeStyle='#ff9ab0';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(boss.x,boss.y+10,52+pulse*8,0,TAU);ctx.stroke();
    ctx.globalAlpha=.8;ctx.fillStyle='#fff4f7';ctx.beginPath();ctx.arc(boss.x,boss.y+10,10,0,TAU);ctx.fill();
  }else if(d.kind==='devour'&&(bossMech.phase==='warn'||bossMech.phase==='active')){
    var rr=70+Math.sin(time*5)*10;
    ctx.globalAlpha=bossMech.phase==='active'?.5:.25;ctx.strokeStyle='#b58bff';ctx.lineWidth=2;
    for(var i=0;i<3;i++){ctx.beginPath();ctx.arc(boss.x,boss.y+40,rr+i*30,time*.6+i,time*.6+i+TAU*.75);ctx.stroke();}
  }else if(d.kind==='charge'){
    if(bossMech.phase==='warn'){
      ctx.globalAlpha=.18+.1*Math.sin(time*25);ctx.fillStyle='#ff9a6a';ctx.fillRect(boss.x-42,boss.y,84,H*.62-boss.y);
      ctx.globalAlpha=.75;ctx.strokeStyle='#ffd0a0';ctx.setLineDash([8,8]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(boss.x,boss.y);ctx.lineTo(boss.x,H*.62);ctx.stroke();ctx.setLineDash([]);
    }else{
      ctx.globalAlpha=.55;ctx.fillStyle='#ff9a6a';ctx.fillRect(boss.x-30,boss.y-20,60,40);
    }
  }else if(d.kind==='cage'&&(bossMech.phase==='warn'||bossMech.phase==='active')){
    var gx=d.gapX,band=W*.22;
    var cageSafe=Math.max(0,gx-band),cageRight=Math.min(W,gx+band);
    // Make the moving safe corridor explicit; outside is the damage zone.
    ctx.globalAlpha=bossMech.phase==='active'?.16:.08;
    ctx.fillStyle='#dff8ff';ctx.fillRect(cageSafe,60,cageRight-cageSafe,H-120);
    ctx.globalAlpha=bossMech.phase==='active'?.42:.22;
    ctx.strokeStyle='#e8fbff';ctx.lineWidth=1;ctx.setLineDash([6,8]);
    ctx.beginPath();ctx.moveTo(cageSafe,60);ctx.lineTo(cageSafe,H-60);ctx.moveTo(cageRight,60);ctx.lineTo(cageRight,H-60);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.82;ctx.fillStyle='rgba(2,12,20,0.78)';ctx.fillRect(W/2-92,H*.285,184,20);
    ctx.strokeStyle='rgba(232,251,255,0.65)';ctx.lineWidth=1;ctx.strokeRect(W/2-92,H*.285,184,20);
    ctx.fillStyle='#eafaff';ctx.font='700 10px monospace';ctx.textAlign='center';
    ctx.fillText('SAFE LIGHT · STAY INSIDE',W/2,H*.285+14);
    ctx.textAlign='left';
    if(bossMech.phase==='warn'){
      ctx.globalAlpha=.2;ctx.fillStyle='#d6b4ff';ctx.fillRect(0,60,cageSafe-60,H-120);ctx.fillRect(cageRight,60,W-cageRight,H-120);
    }else{
      var lg=ctx.createLinearGradient(gx-band-30,0,gx-band,0);lg.addColorStop(0,'rgba(200,160,255,0)');lg.addColorStop(1,'rgba(255,255,255,.7)');
      ctx.globalAlpha=.75;ctx.fillStyle=lg;ctx.fillRect(gx-band-30,0,30,H);
      var rg=ctx.createLinearGradient(gx+band,0,gx+band+30,0);rg.addColorStop(0,'rgba(255,255,255,.7)');rg.addColorStop(1,'rgba(200,160,255,0)');
      ctx.fillStyle=rg;ctx.fillRect(gx+band,0,30,H);
    }
  }else if(d.kind==='echo'&&(bossMech.phase==='warn'||bossMech.phase==='active')){
    var ex=d.x,ey=d.y;
    var active=bossMech.phase==='active';
    var q=active?Math.max(0,Math.min(1,1-bossMech.activeT/1.6)):0;
    var rr=active?32+q*24:34+Math.sin(time*7)*5;
    ctx.globalAlpha=active?.92:.42;ctx.strokeStyle=active?'#ffcf7a':'#9fe8ff';ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(ex,ey,rr,0,TAU);ctx.stroke();
    ctx.globalAlpha=active?.38:.20;ctx.strokeStyle='#ffffff';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(ex,ey,rr+8,0,TAU);ctx.stroke();
    ctx.globalAlpha=active?.22:.10;ctx.fillStyle=active?'#ff9a3a':'#9fe8ff';
    ctx.beginPath();ctx.arc(ex,ey,46,0,TAU);ctx.fill();
    ctx.globalAlpha=.9;ctx.fillStyle='#fff4d6';ctx.font='700 9px monospace';ctx.textAlign='center';
    ctx.fillText(active?'ECHO COLLAPSE':'ECHO LOCK',ex,ey-56);
    if(active) ctx.fillText(Math.max(0,bossMech.activeT).toFixed(1)+'s',ex,ey+62);
    // lock line back to the boss core
    ctx.globalAlpha=active?.30:.14;ctx.strokeStyle='#ffcf7a';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(boss.x,boss.y);ctx.stroke();
    ctx.textAlign='left';
  }
  ctx.restore();ctx.globalAlpha=1;ctx.textAlign='left';
}
