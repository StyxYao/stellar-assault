// Web video adapter: hidden DOM host, element creation, first-gesture priming.
var phase2LoopVideo=document.createElement('video');phase2LoopVideo.src='assets/video/phase2-loop.mp4';phase2LoopVideo.loop=true;phase2LoopVideo.muted=true;phase2LoopVideo.playsInline=true;phase2LoopVideo.preload='auto';
var phase3LoopVideo=document.createElement('video');phase3LoopVideo.src='assets/video/phase3-loop.mp4';phase3LoopVideo.loop=true;phase3LoopVideo.muted=true;phase3LoopVideo.playsInline=true;phase3LoopVideo.preload='auto';
var fusionVideo=document.createElement('video');fusionVideo.src='assets/video/fusion.mp4';fusionVideo.loop=true;fusionVideo.muted=true;fusionVideo.playsInline=true;fusionVideo.preload='auto';
var bgLoopVideo=document.createElement('video');bgLoopVideo.src='assets/video/kaleido-bg.mp4';bgLoopVideo.loop=true;bgLoopVideo.muted=true;bgLoopVideo.playsInline=true;bgLoopVideo.preload='auto';
var hedronLoopVideo=document.createElement('video');hedronLoopVideo.src='assets/video/hedron-loop.mp4';hedronLoopVideo.loop=true;hedronLoopVideo.muted=true;hedronLoopVideo.playsInline=true;hedronLoopVideo.preload='auto';
var VIDEO_HOST=document.createElement('div');
VIDEO_HOST.style.cssText='position:fixed;left:-2px;top:-2px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
document.body.appendChild(VIDEO_HOST);
[phase2LoopVideo,phase3LoopVideo,fusionVideo,bgLoopVideo,hedronLoopVideo].forEach(function(v){
  v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.style.cssText='width:2px;height:2px;opacity:0;';VIDEO_HOST.appendChild(v);
});
var videosPrimed=false;
function primeVideos(){
  if(videosPrimed)return;videosPrimed=true;
  // Keep the hidden fusion video running silently after the first gesture.
  // This grants playback permission before the cutscene, so no click-to-play is needed later.
  try{fusionVideo.muted=true;fusionVideo.loop=true;fusionVideo.play().catch(function(){});}catch(e){}
}

