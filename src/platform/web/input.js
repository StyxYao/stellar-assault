// Web pointer input adapter. UI/game functions remain in the closure during migration.
var dragging=false,dragLift=0,dragMaxY=H-70,lastTapAt=0,lastTapX=0,lastTapY=0;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault();primeVideos(); initAudio(); loadSfxExtras();
  try{hedronLoopVideo.play().catch(function(){});}catch(err){}
  try{phase3LoopVideo.play().catch(function(){});}catch(err){}
  try{phase2LoopVideo.play().catch(function(){});}catch(err){}
  try{bgLoopVideo.play().catch(function(){});}catch(err){}
  try{if(AC&&AC.state==='suspended')AC.resume();}catch(err){}
  if(state==='menu'&&bgmPending){var pk=bgmPending;bgmPending='';playBgm(pk);}
  var p=pt(e);
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m'); }
    var sbs=stageSelectButtons();
    for(var si=0;si<sbs.length;si++){
      var sb=sbs[si];
      if(p.x>=sb.x&&p.x<=sb.x+sb.w&&p.y>=sb.y&&p.y<=sb.y+sb.h){ selectedStage=si; return; }
    }
    var stb=menuStartButton();
    if(p.x>=stb.x&&p.x<=stb.x+stb.w&&p.y>=stb.y&&p.y<=stb.y+stb.h){ startAtStage(selectedStage); return; }
    return;
  }
  if(state==='bossOmen'){ bossOmenT=6.5; return; }
  if(state==='bossFusion'){
    var fsx=W-104,fsy=64,fsw=92,fsh=30;
    if(p.x>=fsx&&p.x<=fsx+fsw&&p.y>=fsy&&p.y<=fsy+fsh){fusionHoldActive=true;fusionHoldT=0;return;}
    fusionHoldActive=false;return;
  }
  if(state==='fusion'){ fusionT=3.6; return; }
  if(state==='cast'){ state='menu'; playBgm('m'); return; }
  if(state==='win'||state==='over'){ startGame(); return; }
  var bx=W-64,by=H-78;
  if((p.x-bx)*(p.x-bx)+(p.y-by)*(p.y-by)<54*54){ bomb(); return; }
  var now=performance.now();
  if((state==='play'||state==='boss')&&now-lastTapAt<320&&Math.hypot(p.x-lastTapX,p.y-lastTapY)<70){ lastTapAt=0; bomb(); dragging=false; return; }
  lastTapAt=now; lastTapX=p.x; lastTapY=p.y;
  dragging=true; dragLift=(e.pointerType==='touch')?86:0; dragMaxY=(e.pointerType==='touch')?H-140:H-70;
  target.x=Math.max(22,Math.min(W-22,p.x));
  target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onMove(e){
  if(!dragging) return;
  e.preventDefault();
  var p=pt(e);target.x=Math.max(22,Math.min(W-22,p.x));target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onUp(){dragging=false;if(state==='bossFusion'){fusionHoldActive=false;fusionHoldT=0;}}
cvs.addEventListener('pointerdown',onDown,{passive:false});
cvs.addEventListener('pointermove',onMove,{passive:false});
cvs.addEventListener('pointerup',onUp);
cvs.addEventListener('pointercancel',onUp);
