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
  var cx=cv.getContext('2d',{alpha:false});
  video.__frameCache={cv:cv,cx:cx,ready:false,lastMediaTime:-1};
  var onFrame=function(now,meta){
    try{
      var t=meta&&meta.mediaTime!=null?meta.mediaTime:video.currentTime;
      var loopBlack=t<0.05&&video.__frameCache.lastMediaTime>(video.duration-0.18);
      if(!loopBlack&&video.videoWidth&&video.videoHeight){
        if(cv.width!==video.videoWidth||cv.height!==video.videoHeight){cv.width=video.videoWidth;cv.height=video.videoHeight;}
        cx.drawImage(video,0,0,cv.width,cv.height);
        video.__frameCache.ready=true;
      }
      video.__frameCache.lastMediaTime=t;
    }catch(e){}
    video.requestVideoFrameCallback(onFrame);
  };
  video.requestVideoFrameCallback(onFrame);
}
function videoFrameSource(video){
  var f=video&&video.__frameCache;
  return f&&f.ready&&f.cv.width>1?f.cv:video;
}

var videosPrimed=false;
function primeVideos(){
  videosPrimed=true;
  // Stage 5 videos are loaded on stage entry; do not fetch them on the menu.
}
function loadStageVideos(){
  if(!videoFxEnabled) return;
  [fusionVideo,bgLoopVideo,phase2LoopVideo,phase3LoopVideo,hedronLoopVideo].forEach(function(v){
    try{ v.preload='auto'; v.load(); }catch(e){}
  });
}

