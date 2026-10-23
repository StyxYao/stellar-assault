// Background layers: scrolling, kaleidoscope, recursive and stage backgrounds.
function drawLoopLayer(img,scroll,alpha,fitWidth,mirror,blend){
  if(!img||!img.complete||!img.naturalWidth) return false;
  var sc=fitWidth?W/img.width:Math.max(W/img.width,H/img.height);
  var bw=img.width*sc,bh=img.height*sc,x=(W-bw)/2,baseY=(H-bh)/2;
  var loopH=bh*2,off=((scroll%loopH)+loopH)%loopH;
  ctx.globalAlpha=alpha;
  ctx.globalCompositeOperation=blend||'source-over';
  for(var n=-2;n<=2;n++){
    var top=baseY+off+n*bh;
    if(top>H||top+bh<0) continue;
    var even=((n%2)+2)%2===0;
    if(!mirror||even) ctx.drawImage(img,x,top,bw,bh);
    else{ctx.save();ctx.translate(x,top+bh);ctx.scale(1,-1);ctx.drawImage(img,0,0,bw,bh);ctx.restore();}
  }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; return true;
}
function paintJuliaKaleido(cx,cy){
  if(!JULIA_CANVAS){
    JULIA_CANVAS=document.createElement('canvas');JULIA_CANVAS.width=JULIA_W;JULIA_CANVAS.height=JULIA_H;
    JULIA_CTX=JULIA_CANVAS.getContext('2d');JULIA_DATA=JULIA_CTX.createImageData(JULIA_W,JULIA_H);
  }
  if(JULIA_TICK++%3===0){
    var d=JULIA_DATA.data,theta=.35+time*.045,cr=.7885*Math.cos(theta),ci=.7885*Math.sin(theta);
    for(var y=0;y<JULIA_H;y++){
      for(var x=0;x<JULIA_W;x++){
        var nx=(x/JULIA_W-.5)*2.2,ny=(y/JULIA_H-.5)*2.2;
        var r=Math.sqrt(nx*nx+ny*ny),a=Math.atan2(ny,nx);
        // 6-fold mirrored kaleidoscope fold
        var sec=TAU/6;
        a=Math.abs(((a%sec)+sec)%sec-sec/2);
        var zx=Math.cos(a)*r*1.25,zy=Math.sin(a)*r*1.25,it=0,max=32;
        for(;it<max;it++){var xx=zx*zx-zy*zy+cr;zy=2*zx*zy+ci;zx=xx;if(zx*zx+zy*zy>16)break;}
        var idx=(y*JULIA_W+x)*4;
        if(it>=max){d[idx+3]=0;continue;}
        var t=it/max;
        d[idx]=Math.floor(80+165*t);d[idx+1]=Math.floor(175+75*t);d[idx+2]=Math.floor(220+35*t);
        d[idx+3]=Math.floor(22+170*t*t);
      }
    }
    JULIA_CTX.putImageData(JULIA_DATA,0,0);
  }
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.72;
  ctx.drawImage(JULIA_CANVAS,0,0,W,H);ctx.restore();ctx.globalAlpha=1;
}
function drawSierpinskiField(cx,cy){
  var R=Math.min(W,H)*.56;
  var cols=['rgba(255,226,150,','rgba(150,220,255,','rgba(200,150,255,'];
  function tri(x1,y1,x2,y2,x3,y3,d,col,alpha){
    if(d<=0){
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();
      ctx.strokeStyle=col+alpha+')';ctx.lineWidth=.95;ctx.stroke();return;
    }
    var ax=(x1+x2)/2,ay=(y1+y2)/2,bx=(x2+x3)/2,by=(y2+y3)/2,cx2=(x3+x1)/2,cy2=(y3+y1)/2;
    tri(x1,y1,ax,ay,cx2,cy2,d-1,col,alpha);
    tri(ax,ay,x2,y2,bx,by,d-1,col,alpha);
    tri(cx2,cy2,bx,by,x3,y3,d-1,col,alpha);
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var layer=0;layer<3;layer++){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(time*(.025+layer*.012)+layer*2.094);
    var br=1+Math.sin(time*.35+layer)*.045;ctx.scale(br,br);
    tri(0,-R,-R*.866,R*.5,R*.866,R*.5,4,cols[layer],(.30-layer*.055));
    ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}
var FRACTAL_LAYERS=[];
function fractalZone(idx,img,rot,scale,r0,r1,feather,alpha){
  if(!FRACTAL_LAYERS[idx]){
    var cv=document.createElement('canvas');cv.width=W;cv.height=H;FRACTAL_LAYERS[idx]=cv;
  }
  var c=FRACTAL_LAYERS[idx],g=c.getContext('2d');
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  var base=Math.max(W/img.width,H/img.height)*1.52*scale;
  var bw=img.width*base,bh=img.height*base;
  g.save();g.translate(W/2,H*.44);g.rotate(rot);g.drawImage(img,-bw/2,-bh/2,bw,bh);g.restore();
  // feather the zone edges so the counter-rotating rings overlap instead of cutting
  var R=Math.max(W,H)*.92;
  var grd=g.createRadialGradient(W/2,H*.44,0,W/2,H*.44,R);
  if(r0<=0){
    grd.addColorStop(0,'rgba(0,0,0,1)');
    grd.addColorStop(Math.max(0,(r1-feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.min(1,(r1+feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
  }else if(r1>=R*.98){
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(Math.max(0,(r0-feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(Math.min(1,(r0+feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(1,'rgba(0,0,0,1)');
  }else{
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(Math.max(0,(r0-feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(Math.min(1,(r0+feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.max(0,(r1-feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.min(1,(r1+feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
  }
  g.globalCompositeOperation='destination-in';g.fillStyle=grd;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(c,0,0,W,H);ctx.restore();
}
function drawBlackHole(){
  var cx=W/2,cy=H*.44,hr=Math.max(24,Math.min(W,H)*.078);
  // soft outer light, no accretion disk
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(cx,cy,hr*.8,cx,cy,hr*3.0);
  g.addColorStop(0,'rgba(190,150,255,0.18)');
  g.addColorStop(.45,'rgba(120,90,210,0.08)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,hr*3.0,0,TAU);ctx.fill();
  // the hole itself
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,hr,0,TAU);ctx.fill();
  // thin photon ring
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.9;ctx.strokeStyle='rgba(255,238,190,0.95)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(cx,cy,hr+1.2,0,TAU);ctx.stroke();
  ctx.globalAlpha=.35;ctx.strokeStyle='rgba(170,130,255,0.9)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(cx,cy,hr+4,0,TAU);ctx.stroke();
  ctx.restore();ctx.globalAlpha=1;
}
function drawKaleidoLayer(img,cx,cy,n,rot,scale,alpha,mirror,ox,oy,filter,comp,beadA){
  if(!img||!img.complete||!img.naturalWidth) return;
  var step=TAU/n,R=Math.max(W,H)*1.06;
  var sc=Math.max(W/img.width,H/img.height)*scale;
  var bw=img.width*sc,bh=img.height*sc;
  ctx.save();ctx.globalAlpha=1;
  if(comp) ctx.globalCompositeOperation=comp;
  for(var k=0;k<n;k++){
    ctx.save();
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,k*step+rot-.008,(k+1)*step+rot+.008);ctx.closePath();ctx.clip();
    ctx.translate(cx,cy);
    var base=k*step+rot+step/2;
    ctx.rotate(base);
    if(mirror&&(k%2))ctx.scale(-1,1);
    ctx.globalAlpha=alpha;
    if(filter&&('filter' in ctx))ctx.filter=filter;
    ctx.drawImage(img,-bw/2+ox*bw,-bh/2+oy*bh,bw,bh);
    if(beadA) drawWedgeBeads(R,beadA,k*1.7);
    ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';
}
var KALEIDO_CACHE=null,KALEIDO_SRC=null;
function buildKaleidoCache(img){
  if(!img||!img.complete||!img.naturalWidth) return null;
  var sz=640,cv=document.createElement('canvas');cv.width=cv.height=sz;
  var x=cv.getContext('2d'),c=sz/2,R=sz*.74;
  var sc=Math.max(sz*1.25/img.width,sz*1.25/img.height);
  var bw=img.width*sc,bh=img.height*sc;
  for(var k=0;k<16;k++){
    var a0=k*TAU/16-.008,a1=(k+1)*TAU/16+.008;
    x.save();x.beginPath();x.moveTo(c,c);x.arc(c,c,R,a0,a1);x.closePath();x.clip();
    x.translate(c,c);x.rotate(k*TAU/16+TAU/32);if(k%2)x.scale(-1,1);
    x.globalAlpha=.97;x.drawImage(img,-bw/2,-bh/2,bw,bh);
    x.globalCompositeOperation='lighter';
    for(var bi=0;bi<BG_BEADS.length;bi++){
      var b=BG_BEADS[bi];var ang=b.ba,rr=b.br*R;
      var bs=b.s*(.7+rr/R*.9);
      x.globalAlpha=.55;x.drawImage(beadSprite(b.c),Math.cos(ang)*rr-bs,Math.sin(ang)*rr-bs,bs*2,bs*2);
    }
    x.restore();
  }
  KALEIDO_CACHE=cv;KALEIDO_SRC=img;return cv;
}
function drawKaleidoCache(cv,rot,scale,alpha,filter,comp,ox,oy){
  var s=Math.max(W,H)*1.15*scale;
  ctx.save();if(comp)ctx.globalCompositeOperation=comp;
  ctx.globalAlpha=alpha;if(filter&&('filter'in ctx))ctx.filter=filter;
  ctx.translate(W/2,H*.44);ctx.rotate(rot);
  ctx.drawImage(cv,-s/2+(ox||0)*s,-s/2+(oy||0)*s,s,s);
  ctx.restore();ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';
}
function drawRecursiveBg(img,rot,scale,alpha,comp){
  if(!img||!img.complete||!img.naturalWidth) return;
  var sw=Math.max(W,H)*1.18*scale,sh=sw*img.height/img.width;
  ctx.save();ctx.globalCompositeOperation=comp||'screen';ctx.globalAlpha=alpha;
  ctx.translate(W/2,H*.44);ctx.rotate(rot);
  ctx.drawImage(img,-sw/2,-sh/2,sw,sh);ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function paintFractalBg(main,edge,offsetY){
  ctx.fillStyle='#03020a';ctx.fillRect(0,0,W,H);
  var cx=W/2,cy=H*.44,N=16;
  var bgVidReady=bgLoopVideo&&bgLoopVideo.readyState>=2&&bgLoopVideo.videoWidth>0;
  if(bgVidReady){
    var sh=Math.max(H*1.16,W*1280/720),sw=sh*720/1280;
    if(BG_FIRST_CV){ctx.save();ctx.globalAlpha=.95;ctx.drawImage(BG_FIRST_CV,cx-sw/2,cy-sh/2,sw,sh);ctx.restore();}
    ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.94;if('filter' in ctx)ctx.filter='contrast(1.08) saturate(1.12) brightness(.94)';
    ctx.drawImage(bgLoopVideo,cx-sw/2,cy-sh/2,sw,sh);ctx.filter='none';ctx.restore();ctx.globalAlpha=1;
    // cache the first frame once, then cross-fade it across the loop seam
    if(!BG_FIRST_CV&&bgLoopVideo.videoWidth){
      BG_FIRST_CV=document.createElement('canvas');BG_FIRST_CV.width=360;BG_FIRST_CV.height=640;
      BG_FIRST_CV.getContext('2d').drawImage(bgLoopVideo,0,0,360,640);
    }
    if(BG_FIRST_CV){
      var vt=bgLoopVideo.currentTime,vd=bgLoopVideo.duration||15,seam=.24,fa=0;
      if(vt<seam)fa=1-vt/seam; else if(vt>vd-seam)fa=(vt-(vd-seam))/seam;
      if(fa>0){ctx.save();ctx.globalAlpha=Math.min(1,fa)*.92;ctx.drawImage(BG_FIRST_CV,cx-sw/2,cy-sh/2,sw,sh);ctx.restore();}
    }
    ctx.fillStyle='rgba(2,4,14,0.30)';ctx.fillRect(0,0,W,H);
  }else{
    // video not ready yet: keep it black, never show the old procedural background
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  }
  // dark vortex fade so the crystal pours into one static eye
  // no background black hole; the kaleidoscope center is the focal point

}

function paintStageBg(main,edge,offsetY){
  if(stage===4){ paintFractalBg(main,edge,offsetY); return; }

  if(stage===0&&BG1_NEBULA&&BG1_NEBULA.complete&&BG1_NEBULA.naturalWidth){
    drawLoopLayer(BG1_NEBULA,bgScroll*0.30,0.96,false,false);
  }
  if(stage===0&&BG1_EARLIEST&&BG1_EARLIEST.complete&&BG1_EARLIEST.naturalWidth){
    drawLoopLayer(BG1_EARLIEST,bgScroll*0.62,0.55,false,false);
  }
  drawLoopLayer(main,bgScroll+(offsetY||0),stage===0?0.46:1,false,false);
  if(stage===0&&BG1_EARLIEST&&BG1_EARLIEST.complete&&BG1_EARLIEST.naturalWidth){
    ctx.save();ctx.globalAlpha=.10;ctx.globalCompositeOperation='screen';drawLoopLayer(BG1_EARLIEST,bgScroll*0.62,1,false,false);ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  if(stage===0&&BG1_BH&&BG1_BH.complete&&BG1_BH.naturalWidth){
    ctx.save();if('filter'in ctx)ctx.filter='brightness(1.72) saturate(1.15)';drawLoopLayer(BG1_BH,0,1,false,false);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.40;if('filter'in ctx)ctx.filter='brightness(1.55) saturate(1.2)';drawLoopLayer(BG1_BH,0,1,false,false);
    ctx.filter='none';ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.restore();
  }
  if(edge) drawLoopLayer(edge,bgEdgeScroll+(offsetY||0)*1.35,([0.90,0.82,0.72,0.50][stage]||0.8),true,true,['screen','soft-light','overlay','soft-light'][stage]||'source-over');
}
function drawBgDust(){
  ctx.save();
  for(var i=0;i<bgDust.length;i++){
    var p=bgDust[i];ctx.globalAlpha=p.a;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,1,p.len);
  }
  ctx.restore();
}
function paintBg(img,alpha,offsetY){
  if(!img||!img.complete||!img.naturalWidth) return false;
  var sc=Math.max(W/img.width,H/img.height),bw=img.width*sc,bh=img.height*sc;
  ctx.globalAlpha=alpha;
  ctx.drawImage(img,(W-bw)/2,(H-bh)/2+Math.sin(time*0.12)*10+(offsetY||0),bw,bh);
  ctx.globalAlpha=1;
  return true;
}
var MIRROR_TYPES={},MIRROR_CACHE={};
function enemyMirrorImg(type,img){
  var c=MIRROR_CACHE[type];
  if(c&&c.src===img) return c.canvas;
  var cv=document.createElement('canvas');cv.width=Math.round(img.width*1.5);cv.height=img.height;
  var x=cv.getContext('2d'),off=Math.round(img.width*0.5);
  x.save();x.translate(img.width,0);x.scale(-1,1);x.drawImage(img,0,0);x.restore();
  x.drawImage(img,off,0);
  MIRROR_CACHE[type]={src:img,canvas:cv};return cv;
}

