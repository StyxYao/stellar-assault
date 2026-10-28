// Web video adapter: hidden DOM host, element creation, first-gesture priming.
var phase2LoopVideo=document.createElement('video');phase2LoopVideo.src='assets/video/phase2-loop.mp4';phase2LoopVideo.loop=true;phase2LoopVideo.muted=true;phase2LoopVideo.playsInline=true;phase2LoopVideo.preload='none';
var phase3LoopVideo=document.createElement('video');phase3LoopVideo.src='assets/video/phase3-loop.mp4';phase3LoopVideo.loop=true;phase3LoopVideo.muted=true;phase3LoopVideo.playsInline=true;phase3LoopVideo.preload='none';
var fusionVideo=document.createElement('video');fusionVideo.src='assets/video/fusion.mp4';fusionVideo.loop=true;fusionVideo.autoplay=false;fusionVideo.muted=true;fusionVideo.playsInline=true;fusionVideo.preload='none';
var bgLoopVideo=document.createElement('video');bgLoopVideo.src='assets/video/kaleido-bg.mp4';bgLoopVideo.loop=true;bgLoopVideo.muted=true;bgLoopVideo.playsInline=true;bgLoopVideo.preload='none';
var hedronLoopVideo=document.createElement('video');hedronLoopVideo.src='assets/video/hedron-loop.mp4';hedronLoopVideo.loop=true;hedronLoopVideo.muted=true;hedronLoopVideo.playsInline=true;hedronLoopVideo.preload='none';
// Windows desktop uses the procedural/static path: 60fps video decode was
// causing frame hitches and loop-boundary black frames even after keying was removed.
var videoFxEnabled = !(window.desktopBridge && /Windows/i.test(navigator.userAgent || ''));
try { if(/[?&]videofx=1/.test(location.search||'')) videoFxEnabled=true; } catch(e) {}
var VIDEO_HOST=document.createElement('div');
VIDEO_HOST.style.cssText='position:fixed;left:-2px;top:-2px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
document.body.appendChild(VIDEO_HOST);
[phase2LoopVideo,phase3LoopVideo,fusionVideo,bgLoopVideo,hedronLoopVideo].forEach(function(v){
  v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.style.cssText='width:2px;height:2px;opacity:0;';VIDEO_HOST.appendChild(v);
});
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

