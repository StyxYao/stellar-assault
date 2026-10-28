// Web video adapter: hidden DOM host, element creation, first-gesture priming.
var phase2LoopVideo=document.createElement('video');phase2LoopVideo.src='assets/video/phase2-loop.mp4';phase2LoopVideo.loop=true;phase2LoopVideo.muted=true;phase2LoopVideo.playsInline=true;phase2LoopVideo.preload='none';
var phase3LoopVideo=document.createElement('video');phase3LoopVideo.src='assets/video/phase3-loop.mp4';phase3LoopVideo.loop=true;phase3LoopVideo.muted=true;phase3LoopVideo.playsInline=true;phase3LoopVideo.preload='none';
var fusionVideo=document.createElement('video');fusionVideo.src='assets/video/fusion.mp4';fusionVideo.loop=true;fusionVideo.autoplay=false;fusionVideo.muted=true;fusionVideo.playsInline=true;fusionVideo.preload='none';
var bgLoopVideo=document.createElement('video');bgLoopVideo.src='assets/video/kaleido-bg.mp4';bgLoopVideo.loop=true;bgLoopVideo.muted=true;bgLoopVideo.playsInline=true;bgLoopVideo.preload='none';
var hedronLoopVideo=document.createElement('video');hedronLoopVideo.src='assets/video/hedron-loop.mp4';hedronLoopVideo.loop=true;hedronLoopVideo.muted=true;hedronLoopVideo.playsInline=true;hedronLoopVideo.preload='none';
// Video FX stay enabled on every platform. Windows performance must be solved
// in the video pipeline, not by removing the animation.
var videoFxEnabled = true;
var VIDEO_HOST=document.createElement('div');
VIDEO_HOST.style.cssText='position:fixed;left:-2px;top:-2px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
document.body.appendChild(VIDEO_HOST);
[phase2LoopVideo,phase3LoopVideo,fusionVideo,bgLoopVideo,hedronLoopVideo].forEach(function(v){
  videoFrameCache(v);
  v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.style.cssText='width:2px;height:2px;opacity:0;';VIDEO_HOST.appendChild(v);
});
// Cache the decoded video frame in a canvas only when the browser reports a
// new frame (requestVideoFrameCallback). The game then draws the cached canvas,
// avoiding a video->canvas conversion on every 60Hz game render.
function videoFrameCache(video){
  if(!video||video.__frameCache) return;
  if(typeof video.requestVideoFrameCallback!=='function') return;
  var cv=document.createElement('canvas');cv.width=1;cv.height=1;
  var cx=cv.getContext('2d',{alpha:video===phase3LoopVideo});
  video.__frameCache={cv:cv,cx:cx,ready:false,lastMediaTime:-1};
  var onFrame=function(now,meta){
    try{
      var t=meta&&meta.mediaTime!=null?meta.mediaTime:video.currentTime;
      var loopBlack=t<0.05&&video.__frameCache.lastMediaTime>(video.duration-0.18);
      if(!loopBlack&&video.videoWidth&&video.videoHeight){
        if(cv.width!==video.videoWidth||cv.height!==video.videoHeight){cv.width=video.videoWidth;cv.height=video.videoHeight;}
        cx.clearRect(0,0,cv.width,cv.height);
        cx.drawImage(video,0,0,cv.width,cv.height);
        if(video===phase3LoopVideo&&typeof phase3AlphaMask==='function'){
          var mask=phase3AlphaMask(video);
          if(mask){
            cx.save();
            cx.globalCompositeOperation='destination-in';
            cx.drawImage(mask,0,0,cv.width,cv.height);
            cx.restore();
          }
        }
        video.__frameCache.ready=true;
      }
      video.__frameCache.lastMediaTime=t;
    }catch(e){ if(typeof reportError==='function')reportError(e,'video.frameCache'); }
    video.requestVideoFrameCallback(onFrame);
  };
  video.requestVideoFrameCallback(onFrame);
}
function videoFrameSource(video){
  var f=video&&video.__frameCache;
  return f&&f.ready&&f.cv.width>1?f.cv:video;
}

function phase3AlphaMask(video){
  if(!video) return null;
  if(video.__phase3Mask) return video.__phase3Mask;
  if(!video.videoWidth||!video.videoHeight) return null;
  try{
    var w=video.videoWidth,h=video.videoHeight;
    var raw=document.createElement('canvas');raw.width=w;raw.height=h;
    var rc=raw.getContext('2d',{alpha:false});rc.drawImage(video,0,0,w,h);
    var src=rc.getImageData(0,0,w,h),d=src.data;
    var out=document.createElement('canvas');out.width=w;out.height=h;
    var oc=out.getContext('2d',{alpha:true});var od=oc.createImageData(w,h),o=od.data;
    // The central black hole must stay opaque black; only the outside black
    // background and the outer silhouette get alpha=0/feather.
    var hx=w*0.49,hy=h*0.52,hr=w*0.12;
    for(var yy=0;yy<h;yy++){
      for(var xx=0;xx<w;xx++){
        var i=(yy*w+xx)*4;
        var luma=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
        var inHole=((xx-hx)*(xx-hx)+(yy-hy)*(yy-hy))<hr*hr;
        var a=inHole?1:Math.max(0,Math.min(1,(luma-8)/32));
        o[i]=255;o[i+1]=255;o[i+2]=255;o[i+3]=Math.round(a*255);
      }
    }
    oc.putImageData(od,0,0);
    var soft=document.createElement('canvas');soft.width=w;soft.height=h;
    var sc=soft.getContext('2d',{alpha:true});sc.filter='blur(1.2px)';sc.drawImage(out,0,0);sc.filter='none';
    video.__phase3Mask=soft;
    return soft;
  }catch(e){
    if(typeof reportError==='function')reportError(e,'video.phase3Mask');
    return null;
  }
}

var videosPrimed=false;
function primeVideos(){
  videosPrimed=true;
  // Stage 5 videos are loaded on stage entry; do not fetch them on the menu.
}
function loadStageVideos(){
  if(!videoFxEnabled) return;
  [fusionVideo,bgLoopVideo,phase2LoopVideo,phase3LoopVideo,hedronLoopVideo].forEach(function(v){
    try{
      v.preload='auto';
      if(v.readyState===0) v.load();
    }catch(e){}
  });
}

function videoPlaySafe(v){
  if(!v) return;
  try{
    var p=v.play();
    if(p&&p.catch)p.catch(function(){});
  }catch(e){ if(typeof reportError==='function')reportError(e,'video.play'); }
}

// Stage 5 videos are loaded only when the stage starts. Menu/pointer input must
// not start every 60fps video in the background.
function prepareStage5Videos(){
  if(!videoFxEnabled) return;
  loadStageVideos();
  videoPlaySafe(bgLoopVideo);
  setStage5Phase(0);
}

function setStage5Phase(phase){
  if(!videoFxEnabled||typeof stage==='undefined'||stage!==4) return;
  videoPlaySafe(bgLoopVideo);
  if(phase===0){
    videoPlaySafe(hedronLoopVideo);
    try{ phase2LoopVideo.pause(); }catch(e){}
    try{ phase3LoopVideo.pause(); }catch(e){}
  }else if(phase===1){
    videoPlaySafe(phase2LoopVideo);
    try{ hedronLoopVideo.pause(); }catch(e){}
    try{ phase3LoopVideo.pause(); }catch(e){}
  }else if(phase===2){
    videoPlaySafe(phase3LoopVideo);
    try{ hedronLoopVideo.pause(); }catch(e){}
    try{ phase2LoopVideo.pause(); }catch(e){}
  }
}

function stopStage5Videos(){
  [hedronLoopVideo,phase2LoopVideo,phase3LoopVideo,fusionVideo].forEach(function(v){
    try{ if(v) v.pause(); }catch(e){}
  });
}

