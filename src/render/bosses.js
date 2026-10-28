// Boss visuals: Chronos forms, phase videos, overlays and Boss sprite layers.
function drawChronosFractal(w,h,phase){
  var n=10+phase*6,rr=Math.min(w,h)*(0.42+0.05*Math.sin(time*1.2));
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var i=0;i<n;i++){
    var a=time*(0.84+phase*0.28)+i/n*TAU;
    var r=rr+Math.sin(time*2.1+i*0.8)*10;
    var x=Math.cos(a)*r,y=Math.sin(a)*r*0.62;
    ctx.save();ctx.translate(x,y);ctx.rotate(a+time*0.4);
    ctx.globalAlpha=0.16+0.07*Math.sin(time*3+i);
    ctx.strokeStyle=cols[i%4];ctx.lineWidth=1.2;
    ctx.beginPath();
    for(var k=0;k<3;k++){var ta=k*TAU/3,tr=13+4*Math.sin(time*2+i);var tx=Math.cos(ta)*tr,ty=Math.sin(ta)*tr;if(k===0)ctx.moveTo(tx,ty);else ctx.lineTo(tx,ty);}
    ctx.closePath();ctx.stroke();
    ctx.restore();
  }
  // breathing shard halo
  for(var r2=0;r2<3;r2++){
    ctx.globalAlpha=0.10-r2*0.02;ctx.strokeStyle=cols[(phase+r2)%4];ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(boss.x,boss.y,rr+r2*18+Math.sin(time*1.4+r2)*5,(rr+r2*18)*.64,time*.05,0,TAU);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBossCrossOrb(){
  if(!boss||!boss.crossOrb) return;
  var o=boss.crossOrb;
  var p=Math.max(0,Math.min(1,(o.t-o.travel)/o.charge)),pulse=0.55+0.45*Math.sin(time*24);
  var rr=26+p*38+pulse*8;
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,rr*2.4);
  g.addColorStop(0,'rgba(255,255,245,0.95)');g.addColorStop(0.22,'rgba(255,230,150,0.75)');g.addColorStop(0.6,'rgba(255,150,60,'+(0.30+p*0.15)+')');g.addColorStop(1,'rgba(255,80,20,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,rr*2.4,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,235,170,'+(0.55+0.35*pulse)+')';ctx.lineWidth=2;
  for(var k=0;k<3;k++){var a=time*(1.2+k*0.4)+k*2;ctx.beginPath();ctx.arc(o.x,o.y,rr*1.4+k*7,a,a+1.5);ctx.stroke();}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,o.y,7+p*5,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
}
var GLOW_CACHE={};
function bossGlowLayer(key,img,rgb){
  if(GLOW_CACHE[key]) return GLOW_CACHE[key];
  try{
    var size=420,pad=54,cv=document.createElement('canvas');cv.width=size;cv.height=size;
    var g=cv.getContext('2d');
    if('filter' in g) g.filter='blur(16px)';
    g.drawImage(img,pad,pad,size-pad*2,size-pad*2);
    g.filter='none';
    g.globalCompositeOperation='source-in';
    g.fillStyle='rgb('+rgb+')';g.fillRect(0,0,size,size);
    GLOW_CACHE[key]=cv;return cv;
  }catch(e){return null;}
}
function drawSpectralAura(w,h){
  if(!boss) return;
  var cols=['#66d8ff','#ff78c8','#ffd36b','#9d8cff'];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var k=0;k<6;k++){
    var a0=time*(.14+k*.02)+k*1.05;
    ctx.globalAlpha=.30-k*.03;ctx.strokeStyle=cols[k%4];ctx.lineWidth=1.8;
    ctx.beginPath();ctx.arc(boss.x,boss.y,w*(.46+k*.028),a0,a0+1.15);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
}

function drawFeatherAnnulus(cx,cy,inner,outer,alpha){
  var g=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);
  g.addColorStop(0,'rgba(255,255,255,0)');
  g.addColorStop(.22,'rgba(255,255,255,'+(0.55*alpha)+')');
  g.addColorStop(.55,'rgba(255,235,190,'+(0.72*alpha)+')');
  g.addColorStop(.82,'rgba(255,255,255,'+(0.28*alpha)+')');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,outer,0,TAU);ctx.fill();
}
function drawKeyedBossVideo(video,cx,cy,size,hole,rot){
  var vw=video.videoWidth||720,vh=video.videoHeight||1200,crop=Math.min(vw,vh);
  var firstKey=video.currentSrc||video.src;
  if(!PHASE_FIRST_CVS[firstKey]){
    var fc=document.createElement('canvas');fc.width=fc.height=384;
    fc.getContext('2d').drawImage(video,(vw-crop)/2,(vh-crop)/2,crop,crop,0,0,384,384);
    PHASE_FIRST_CVS[firstKey]=fc;PHASE_GLITCH_CVS[firstKey]=phaseGlitchFrames(fc,384);
  }
  var fcv=PHASE_FIRST_CVS[firstKey];
  var vt=video.currentTime||0,vd=video.duration||1,seam=.18,fa=0;
  if(vt<seam)fa=1-vt/seam; else if(vt>vd-seam)fa=(vt-(vd-seam))/seam;
  ctx.save();
  ctx.translate(cx,cy);ctx.rotate(rot||0);
  ctx.beginPath();ctx.arc(0,0,size*.5,0,TAU);ctx.clip();
  // Screen blend makes the video's black background transparent without a
  // per-frame getImageData() pass (the old path stuttered on Windows).
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=.96;
  ctx.drawImage(video,(vw-crop)/2,(vh-crop)/2,crop,crop,-size/2,-size/2,size,size);
  if(fa>0&&fcv){
    ctx.globalAlpha=Math.min(1,fa)*.55;
    ctx.drawImage(fcv,-size/2,-size/2,size,size);
  }
  ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}

function drawPhaseGlitchTransition(cx,cy,size){
  if(bossPhaseGlitchT<=0) return;
  var a=PHASE_FIRST_CVS[phase2LoopVideo.currentSrc||phase2LoopVideo.src];
  var b=PHASE_FIRST_CVS[phase3LoopVideo.currentSrc||phase3LoopVideo.src];
  if(!a&&!b) return;
  var tick=Math.floor(time*18),S=384,strips=10;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(var i=0;i<strips;i++){
    var sy=Math.floor(i*S/strips),sh=Math.ceil(S/strips);
    var src=(i%3===0?b:a)||a||b;
    var dx=((i%2?1:-1)*(8+(tick+i*3)%18));
    var dy=((tick+i*7)%5)-2;
    var alpha=.55+.3*Math.sin(tick+i);
    ctx.globalAlpha=Math.max(.18,Math.min(.95,alpha));
    ctx.drawImage(src,0,sy,S,sh,cx-size/2+dx,cy-size/2+sy/S*size+dy,size,sh/S*size);
  }
  // large split fragments
  ctx.globalAlpha=.28;
  ctx.drawImage((b||a),cx-size*.56,cy-size*.44,size*.18,size*.7);
  ctx.drawImage((a||b),cx+size*.40,cy-size*.36,size*.18,size*.64);
  ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawHedronVideoOrImage(cx,cy,size,img,alpha){
  if(hedronLoopVideo&&hedronLoopVideo.readyState>=2&&hedronLoopVideo.videoWidth>0&&!hedronLoopVideo.paused){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;
    ctx.drawImage(hedronLoopVideo,cx-size/2,cy-size/2,size,size);ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';return true;
  }
  if(img&&img.complete){
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx,cy);ctx.rotate(time*.08);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();ctx.globalAlpha=1;return true;
  }
  return false;
}
function drawHedronRecursiveForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y,t=time;
  var A=GIMG.hrA,B=GIMG.hrB,C=GIMG.hrC;
  var base=boss.def.w*1.26;
  ctx.save();
  // soft dark backing separates the recursive shell from the bright crystal field
  ctx.save();var bg0=ctx.createRadialGradient(cx,cy,base*.22,cx,cy,base*.62);bg0.addColorStop(0,'rgba(2,4,14,.42)');bg0.addColorStop(.7,'rgba(2,4,14,.18)');bg0.addColorStop(1,'rgba(2,4,14,0)');ctx.fillStyle=bg0;ctx.beginPath();ctx.arc(cx,cy,base*.62,0,TAU);ctx.fill();ctx.restore();
  var useVid=videoFxEnabled&&hedronLoopVideo&&hedronLoopVideo.readyState>=2&&hedronLoopVideo.videoWidth>0&&!hedronLoopVideo.paused;
  if(useVid){
    var bs=base*(1+.035*Math.sin(t*1.15));
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.98;
    ctx.translate(cx,cy);ctx.drawImage(hedronLoopVideo,-bs/2,-bs/2,bs,bs);ctx.restore();
  }else if(A&&A.complete){
    var bs=base*(1+.085*Math.sin(t*1.15));
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.97;
    ctx.translate(cx,cy);ctx.rotate(t*.11);ctx.drawImage(A,-bs/2,-bs/2,bs,bs);ctx.restore();
  }else if(GIMG.np1&&GIMG.np1.complete){
    ctx.save();ctx.translate(cx,cy);ctx.drawImage(GIMG.np1,-base/2,-base/2,base,base);ctx.restore();
  }
  // nested copies of the same shell; color and motion make the recursion legible
  if(!useVid&&A&&A.complete){
    for(var ai=0;ai<2;ai++){
      var aq=(t*.33+ai*.5)%1;
      var asz=base*(.72-.34*ai)*(1-.10*aq);
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.56*(1-.18*ai);
      ctx.translate(cx+Math.cos(t*.7+ai*2.1)*base*.012,cy+Math.sin(t*.6+ai*1.7)*base*.012);
      ctx.rotate((ai%2?-1:1)*t*(.20+ai*.06)+ai*1.1);
      ctx.drawImage(A,-asz/2,-asz/2,asz,asz);ctx.restore();
    }
  }
  // a slow, infinite zoom of the inner self-similar shell
  if(!useVid&&B&&B.complete){
    for(var i=0;i<3;i++){
      var q=(t*.46+i/3)%1;
      var s=base*(.14+.78*q);
      var al=.78*(1-q*.38);
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=al;
      ctx.translate(cx,cy);ctx.rotate((i%2?-1:1)*t*.34+i*.8);
      ctx.drawImage(B,-s/2,-s/2,s,s);ctx.restore();
    }
  }
  if(!useVid&&C&&C.complete){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.17;
    ctx.translate(cx,cy);ctx.rotate(-t*.11);var cs=base*(.82+.035*Math.sin(t*.9));
    ctx.drawImage(C,-cs/2,-cs/2,cs,cs);ctx.restore();
  }
  // when the uploaded loop is playing, let the video supply the core and orbit
  if(!useVid){
    ctx.save();ctx.globalCompositeOperation='lighter';
    var R=base*.10+Math.sin(t*2.1)*2.2;
    var g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    g.addColorStop(0,'rgba(255,255,255,.97)');g.addColorStop(.45,'rgba(255,248,220,.70)');
    g.addColorStop(.74,'rgba(255,220,160,.24)');g.addColorStop(1,'rgba(255,220,160,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
    for(var oa=0;oa<3;oa++){
      var ar=base*(.54+oa*.045),ang=t*(.18+oa*.05)+oa*2.1;
      ctx.globalAlpha=.28-oa*.05;ctx.strokeStyle=oa===1?'#ffe6a0':'#d8f1ff';ctx.lineWidth=1.8;
      ctx.beginPath();ctx.arc(cx,cy,ar,ang,ang+1.45);ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(.5,boss.hitFlash*4.5);
    drawFeatherAnnulus(cx,cy,base*.18,base*.55,Math.min(.55,boss.hitFlash*4.0));ctx.restore();ctx.globalAlpha=1;
  }
  ctx.restore();
}
function drawPhase3CollapseForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  var p3v=videoFxEnabled&&phase3LoopVideo&&phase3LoopVideo.readyState>=2&&phase3LoopVideo.videoWidth>0&&!phase3LoopVideo.paused;
  if(p3v){
    var sz=phaseBossSize();
    drawKeyedBossVideo(phase3LoopVideo,cx,cy,sz,true,time*.04);
    drawPhaseGlitchTransition(cx,cy,sz);
    if(boss.hitFlash>0){ctx.save();ctx.globalCompositeOperation='lighter';drawFeatherAnnulus(cx,cy,66,240,Math.min(.28,boss.hitFlash*2.0));drawFeatherAnnulus(cx,cy,115,205,Math.min(.16,boss.hitFlash*1.4));ctx.restore();ctx.globalAlpha=1;}
    return;
  }

  var imgs=[GIMG.q1,GIMG.q2,GIMG.q3,GIMG.q4];
  var ringR=[190*scale,164*scale,138*scale,112*scale],ringS=[88*scale,74*scale,60*scale,48*scale];
  // bottom layer: old phase-3 art as a light-only aura; black areas contribute nothing
  var old=GIMG.b5_3;
  if(old&&old.complete){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.34;
    if('filter' in ctx) ctx.filter='blur(4px)';
    ctx.translate(cx,cy);ctx.rotate(time*.025);
    ctx.drawImage(old,-410,-410,820,820);
    ctx.filter='none';ctx.restore();ctx.globalAlpha=1;
    // a wider, softer halo that deliberately spills past the rings
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.18;
    if('filter' in ctx) ctx.filter='blur(14px)';
    ctx.translate(cx,cy);ctx.rotate(-time*.018);
    ctx.drawImage(old,-480,-480,960,960);
    ctx.filter='none';ctx.restore();ctx.globalAlpha=1;
  }
  // white-hot halo around the hole, with feathered outer 30%
  ctx.save();ctx.globalCompositeOperation='lighter';
  var hr=82+5*Math.sin(time*2.1);
  var hg=ctx.createRadialGradient(cx,cy,0,cx,cy,hr);
  hg.addColorStop(0,'rgba(255,255,255,0.78)');
  hg.addColorStop(.50,'rgba(255,255,250,0.56)');
  hg.addColorStop(.70,'rgba(255,246,220,0.30)');
  hg.addColorStop(.85,'rgba(180,220,255,0.14)');
  hg.addColorStop(1,'rgba(180,220,255,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy,hr,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
  drawHedronVideoOrImage(cx,cy,300,GIMG.np1,.78);
  // four rings, alternating spin, centered on the single hole
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*ringR[i],py=cy+Math.sin(a)*ringR[i];
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ringS[i]/2,-ringS[i]/2,ringS[i],ringS[i]);ctx.restore();
    }
  }
  // final single black hole on top
  var R=54;
  ctx.save();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.95;ctx.strokeStyle='#ffeec0';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(cx,cy,R+1.5,0,TAU);ctx.stroke();
  ctx.globalAlpha=.40;ctx.strokeStyle='#b58bff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,R+5,0,TAU);ctx.stroke();
  ctx.restore();ctx.globalAlpha=1;
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';
    drawFeatherAnnulus(cx,cy,60,238,Math.min(.82,boss.hitFlash*4.8));
    drawFeatherAnnulus(cx,cy,108,196,Math.min(.52,boss.hitFlash*3.2));
    ctx.restore();ctx.globalAlpha=1;
  }
}

function drawPhase2FusionForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  var p2v=videoFxEnabled&&phase2LoopVideo&&phase2LoopVideo.readyState>=2&&phase2LoopVideo.videoWidth>0&&!phase2LoopVideo.paused;
  if(p2v){
    var sz2=phaseBossSize();
    // opaque circular mask instead of screen blending; keeps the video colors solid
    drawKeyedBossVideo(phase2LoopVideo,cx+10,cy,sz2,false,time*.05);
    if(boss.hitFlash>0){ctx.save();ctx.globalCompositeOperation='lighter';drawFeatherAnnulus(cx,cy,64,232,Math.min(.30,boss.hitFlash*2.2));drawFeatherAnnulus(cx,cy,110,200,Math.min(.18,boss.hitFlash*1.5));ctx.restore();ctx.globalAlpha=1;}
    return;
  }

  var imgs=[GIMG.r1,GIMG.r2,GIMG.r3,GIMG.r4];
  var ringR=[152,132,112,92],ringS=[80,68,56,44];
  // core Hedron
  var hedVideo=drawHedronVideoOrImage(cx,cy,235,GIMG.np1,.88);
  // four 24-way rings locked around the core
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var rr=ringR[i],ss=ringS[i];
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ss/2,-ss/2,ss,ss);ctx.restore();
    }
  }
  // the uploaded video already contains the white-hot core
  if(!hedVideo){
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  var R=64+5*Math.sin(time*2.2);
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0,'rgba(255,255,255,0.98)');
  g.addColorStop(.55,'rgba(255,255,250,0.94)');
  g.addColorStop(.70,'rgba(255,246,220,0.72)');
  g.addColorStop(.85,'rgba(220,235,255,0.24)');
  g.addColorStop(1,'rgba(220,240,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;
  var fg=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.52);
  fg.addColorStop(0,'rgba(255,255,255,1)');fg.addColorStop(.4,'rgba(255,240,190,.6)');fg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fg;ctx.beginPath();ctx.arc(cx,cy,R*.52,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
  }
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';
    drawFeatherAnnulus(cx,cy,58,208,Math.min(.85,boss.hitFlash*5));
    drawFeatherAnnulus(cx,cy,96,178,Math.min(.55,boss.hitFlash*3.4));
    ctx.restore();ctx.globalAlpha=1;
  }
}
function phaseBossSize(){ return Math.min(W*1.15,H*.52); }
function drawPhase3Rings(w,h,scale){
  scale=scale||1;
  if(!boss) return;
  var imgs=[GIMG.r1,GIMG.r2,GIMG.r3,GIMG.r4];
  var ringR=[175,152,129,106],ringS=[92,78,64,52];
  // measured phase-3 art hole offset: 3.5px left, 1px down (logical)
  var cx=boss.x-3.5, cy=boss.y+1.0;
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*ringR[i],py=cy+Math.sin(a)*ringR[i];
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ringS[i]/2,-ringS[i]/2,ringS[i],ringS[i]);ctx.restore();
    }
  }
}
function drawPhase2BossHalo(w,h){
  if(!boss) return;
  var imgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  ctx.save();
  for(var k=0;k<24;k++){
    var im=imgs[k%4];if(!im||!im.complete) continue;
    var a=k*TAU/24+time*.055;
    var rr=w*.46;
    var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr;
    var ss=w*.11;
    ctx.save();ctx.globalAlpha=1;
    ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06);if(k%2)ctx.scale(-1,1);
    ctx.drawImage(im,-ss/2,-ss/2,ss,ss);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawChronosEntityHalo(w,h){
  if(!boss) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var ring=0;ring<8;ring++){
    var rr=w*.22+ring*w*.043;
    var n=18+ring*5;
    var rot=time*(ring%2?-.10:.075)+ring*.29;
    for(var j=0;j<n;j++){
      var a=j/n*TAU+rot;
      var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr*.74;
      ctx.globalAlpha=.18+.14*Math.sin(time*2.2+j*.7+ring);
      ctx.fillStyle=(ring%4===0)?'#fff6d8':(ring%4===1?'#7fe6ff':(ring%4===2?'#ff86cf':'#b6a2ff'));
      ctx.beginPath();ctx.arc(px,py,1.1+(ring%2)*.5,0,TAU);ctx.fill();
    }
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBossFusionOverlay(w,h){
  if(!bossFusionOn||!boss) return;
  var q=Math.max(0,Math.min(1,bossFusionT/2.6));
  var imgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
  ctx.save();
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    for(var k=0;k<8;k++){
      var a=k*TAU/8+i*.38+time*.55;
      var rr=(215*(1-q*.55))+i*8;
      var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr*.72;
      var ss=108*(1-q*.30);
      ctx.save();ctx.globalAlpha=.55*(1-q);
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.25);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ss/2,-ss/2,ss,ss);
      ctx.restore();
    }
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBoss(){
  if(!boss) return;
  var phase=boss.phase;
  if(stage===4&&phase===0){drawHedronRecursiveForm();return;}
  if(stage===4&&phase===1){drawPhase2FusionForm();return;}
  if(stage===4&&phase===2){drawPhase3CollapseForm();return;}
  var img=GIMG[boss.def.key+(phase+1)]||GIMG[boss.def.key+'1'];
  if(stage===4&&phase===0){img=GIMG.np1||img;}
  if(!img||!img.complete) return;
  var phaseScale=[1,1.06,1.12][phase]||1;
  // Stage 3 phase 3 art has long outer claws; fit it below the HUD instead of clipping at the top edge.
  if(stage===2&&phase>=2) phaseScale*=.82;
  if(stage===4) phaseScale=(phase===0?1.00:(phase===1?0.99:1.10));
  var w=boss.def.w*phaseScale*1.15,h=w*img.height/img.width;
  var cols=boss.def.glow||['90,200,255','255,120,220','255,170,80'],col=cols[phase]||cols[0];
  ctx.save();ctx.globalCompositeOperation='lighter';
  var ar=h*0.72+Math.sin(time*4)*8;
  var g=ctx.createRadialGradient(boss.x,boss.y,h*0.15,boss.x,boss.y,ar);
  g.addColorStop(0,'rgba('+col+',0.20)');
  g.addColorStop(0.55,'rgba('+col+',0.10)');
  g.addColorStop(1,'rgba('+col+',0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(boss.x,boss.y,ar,0,TAU);ctx.fill();
  ctx.restore();
  // Layered living glow for Boss 2 / Boss 4: blurred body glow + breathing frames + electric arcs + afterimage
  if(stage===1||stage===3||(stage===4&&phase>0)){
    var aura=stage===4?'200,160,255':(stage===3?'255,228,150':'190,125,255');
    var phaseBoost=(stage===1&&phase===2)?1.35:1.0;
    var fr=Math.floor(time*11)%4;
    var breath=0.5+0.5*Math.sin(time*1.9);
    var glow=bossGlowLayer('g'+(stage+1)+'_'+phase,img,aura);
    var gsc=w*1.34+fr*4,hgsc=h*1.34+fr*4;
    ctx.save();ctx.globalCompositeOperation='lighter';
    // afterimage / motion trail of the glow layer
    if(glow&&boss.prevX!==undefined){
      var ga=0.10+breath*0.08;
      ctx.globalAlpha=ga;ctx.drawImage(glow,boss.prevX-gsc*0.5,boss.prevY-hgsc*0.5,gsc,hgsc);
    }
    if(glow){
      ctx.globalAlpha=(0.34+breath*0.20+(fr===3?0.08:0))*phaseBoost;
      ctx.drawImage(glow,boss.x-gsc*0.5,boss.y-hgsc*0.5,gsc,hgsc);
      ctx.globalAlpha=0.14+fr*0.025;
      ctx.drawImage(glow,boss.x-gsc*0.42,boss.y-hgsc*0.42,gsc*0.84,hgsc*0.84);
    }
    // breathing concentric halo
    for(var ak=0;ak<4;ak++){
      var rr=Math.min(w,h)*(0.40+ak*0.030)+fr*2.5+Math.sin(time*5+ak*1.3)*3;
      ctx.globalAlpha=[0.10,0.18,0.14,0.22][fr]*(1-ak*0.16);
      ctx.strokeStyle=ak===0?'#ffffff':'rgba('+aura+',1)';ctx.lineWidth=ak===0?2.4:1.3;
      ctx.beginPath();ctx.arc(boss.x,boss.y,rr,0,TAU);ctx.stroke();
    }
    // rotating rays
    for(var ar2=0;ar2<10;ar2++){
      var aa=ar2/10*TAU+time*0.28, r0=Math.min(w,h)*0.28, r1=Math.min(w,h)*0.54;
      ctx.globalAlpha=0.045+0.035*breath;
      ctx.strokeStyle='rgba('+aura+',1)';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(boss.x+Math.cos(aa)*r0,boss.y+Math.sin(aa)*r0);ctx.lineTo(boss.x+Math.cos(aa)*r1,boss.y+Math.sin(aa)*r1);ctx.stroke();
    }
    // electric arcs, changing every glow frame
    for(var ea=0;ea<3;ea++){
      var baseA=time*0.75+ea*TAU/3, rr0=Math.min(w,h)*0.33;
      ctx.globalAlpha=0.16+0.10*breath;
      ctx.strokeStyle=ea===0?'#ffffff':'rgba('+aura+',1)';ctx.lineWidth=1.2;
      ctx.beginPath();
      for(var seg=0;seg<=7;seg++){
        var sa=baseA+(seg/7-0.5)*0.62;
        var sr=rr0+Math.sin(time*18+seg*2.1+ea*4)*7+fr*1.5;
        var px=boss.x+Math.cos(sa)*sr, py=boss.y+Math.sin(sa)*sr*0.62;
        if(seg===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=1;
  }

  if(stage===4&&phase===0){drawSpectralAura(w,h);drawChronosEntityHalo(w,h);}
  if(stage===4) drawChronosFractal(w,h,phase);
  ctx.save();
  if(stage===4){
    var bsc=1+Math.sin(time*1.35+phase)*.035;
    ctx.translate(boss.x,boss.y);ctx.rotate(time*(0.20+phase*0.050)+Math.sin(time*.45+phase)*.04);ctx.scale(bsc,bsc);
    // kaleidoscopic ghost copies of the composite body
    ctx.globalCompositeOperation='lighter';
    if(phase>0){for(var kg=0;kg<4;kg++){
      ctx.save();ctx.rotate(kg*Math.PI/2+time*.14);ctx.globalAlpha=.045+.02*Math.sin(time*2+kg);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
    }}
    // prismatic time-split echo
    ctx.globalAlpha=phase===0?.05:.14;
    ctx.drawImage(img,-w/2-5,-h/2,w,h);
    ctx.drawImage(img,-w/2+5,-h/2,w,h);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.drawImage(img,-w/2,-h/2,w,h);
    if(phase===0){
      var pcols=['#7fe6ff','#ff86cf','#ffd36b','#b6a2ff'];
      for(var sg=0;sg<3;sg++){
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.42;
        ctx.strokeStyle=pcols[sg];ctx.lineWidth=2.0;
        var aa=time*(.18+sg*.07)+sg*2.0;
        ctx.beginPath();ctx.arc(0,0,w*(.40+sg*.035),aa,aa+1.05);ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
  }else ctx.drawImage(img,boss.x-w/2,boss.y-h/2,w,h);
  if(stage===4){
    var echoImgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
    var echoCols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var ei=0;ei<4;ei++){
      var eimg=echoImgs[ei];if(!eimg||!eimg.complete) continue;
      var ea=time*.35+ei*Math.PI/2, ex=boss.x+Math.cos(ea)*118,ey=boss.y+Math.sin(ea)*76;
      ctx.globalAlpha=.18+.08*Math.sin(time*5+ei);ctx.drawImage(eimg,ex-24,ey-24,48,48);
      ctx.globalAlpha=.35;ctx.fillStyle=echoCols[ei];ctx.beginPath();ctx.arc(ex,ey,5,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(stage===4){ctx.restore();ctx.save();}
  if(boss.hitFlash>0){
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=Math.min(0.9,boss.hitFlash*6);
    ctx.drawImage(img,boss.x-w/2,boss.y-h/2,w,h);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    var hr=8+18*Math.max(0,1-boss.hitFlash*6);
    ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(boss.hitX,boss.hitY,hr,0,TAU);ctx.stroke();
  }
  if(boss.invuln>0){
    ctx.globalAlpha=0.32;ctx.strokeStyle=['#7fe7ff','#ff9ad5','#ffc36b','#ffe7a0'][stage]||'#ffe7a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(boss.x,boss.y,Math.min(h*0.55,w*0.36)+Math.sin(time*8)*4,0,TAU);ctx.stroke();ctx.globalAlpha=1;
  }
  // foreground energy layer for Boss2/4: visible arcs and wingtip pulses over the body
  if(stage===1||stage===3){
    var fAura=stage===3?'255,228,150':'190,125,255';
    var fFr=Math.floor(time*14)%3;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var fe=0;fe<3;fe++){
      var fa=time*1.4+fe*TAU/3, fr0=Math.min(w,h)*0.24;
      ctx.globalAlpha=0.22+0.12*Math.sin(time*7+fe);
      ctx.strokeStyle=fe===0?'#fff':'rgba('+fAura+',1)';ctx.lineWidth=1.5;
      ctx.beginPath();
      for(var fs=0;fs<=6;fs++){
        var fsa=fa+(fs/6-0.5)*0.5;
        var fsr=fr0+Math.sin(time*25+fs*2.4+fe*4)*9+fFr*3;
        var fpx=boss.x+Math.cos(fsa)*fsr,fpy=boss.y+Math.sin(fsa)*fsr*0.70;
        if(fs===0)ctx.moveTo(fpx,fpy);else ctx.lineTo(fpx,fpy);
      }
      ctx.stroke();
    }
    for(var wp=0;wp<4;wp++){
      var wpx=boss.x+(wp<2?-1:1)*w*0.33, wpy=boss.y+(wp%2?-1:1)*h*0.12;
      var wpulse=0.5+0.5*Math.sin(time*8+wp*1.7);
      var wg=ctx.createRadialGradient(wpx,wpy,0,wpx,wpy,14);
      wg.addColorStop(0,'rgba(255,255,245,'+(0.35*wpulse)+')');wg.addColorStop(1,'rgba('+fAura+',0)');
      ctx.fillStyle=wg;ctx.beginPath();ctx.arc(wpx,wpy,14,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(stage===4&&boss.phase===1) drawPhase2BossHalo(phaseBossSize(),phaseBossSize());
  if(stage===4&&boss.phase===2) drawPhase3Rings(phaseBossSize(),phaseBossSize(),phaseBossSize()/430);
  ctx.restore();
}
function bulletImg(){ return GIMG['u'+(stage===0?'1':(stage===1?'2':'5'))]; }

