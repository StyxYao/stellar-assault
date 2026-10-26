// Web pointer input adapter. UI/game functions remain in the closure during migration.
var dragging=false,movePointerId=null,dragLift=0,dragMaxY=H-70,lastTapAt=0,lastTapX=0,lastTapY=0;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault();
  if(e.pointerType==='mouse'&&e.button===2){
    // contextmenu handles the single bomb call; do not fire twice here
    return;
  }
  if(typeof desktopPaused!=='undefined'&&desktopPaused){desktopSetPaused(false);return;}primeVideos(); initAudio(); loadSfxExtras();
  try{hedronLoopVideo.play().catch(function(){});}catch(err){}
  try{phase3LoopVideo.play().catch(function(){});}catch(err){}
  try{phase2LoopVideo.play().catch(function(){});}catch(err){}
  try{bgLoopVideo.play().catch(function(){});}catch(err){}
  try{if(AC&&AC.state==='suspended')AC.resume();}catch(err){}
  if(state==='menu'&&bgmPending){var pk=bgmPending;bgmPending='';playBgm(pk);}
  var p=pt(e);
  if(player&&player.ship==='aegis'&&(state==='play'||state==='boss')&&typeof aegisButtonAt==='function'){
    var ab=aegisButtonAt(p);
    if(ab==='charge'){aegisTapCharge();return;}
    if(ab==='force'){aegisTapForce();return;}
  }
  if(e.pointerType==='mouse'&&(state==='play'||state==='boss')&&typeof desktopPrimaryFire==='function') desktopPrimaryFire();
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m'); }
    if(typeof startConfirmOpen!=='undefined'&&startConfirmOpen){
      var sch=startConfirmAt(p);
      if(sch==='start'){closeStartConfirm();startAtStage(selectedStage);}
      else if(sch==='change'){closeStartConfirm();openShipSelect();}
      else if(sch==='cancel'||sch==='outside') closeStartConfirm();
      return;
    }
    if(typeof skinSelectOpen!=='undefined'&&skinSelectOpen){
      var skhit=skinSelectAt(p);
      if(typeof skhit==='number'){ skinSelectIndex=skhit; skinSelectChoose(skhit); return; }
      if(skhit==='close'||skhit==='outside') closeSkinSelect();
      return;
    }
    if(typeof shipSelectOpen!=='undefined'&&shipSelectOpen){
      var hit=shipSelectAt(p);
      if(typeof hit==='number'){ shipSelectIndex=hit; if(hit<2) shipSelectChoose(hit); return; }
      if(hit==='close'||hit==='outside') closeShipSelect();
      return;
    }
    var shb=menuShipButton();
    if(p.x>=shb.x&&p.x<=shb.x+shb.w&&p.y>=shb.y&&p.y<=shb.y+shb.h){openShipSelect();return;}
    var skb=menuSkinButton();
    if(p.x>=skb.x&&p.x<=skb.x+skb.w&&p.y>=skb.y&&p.y<=skb.y+skb.h){openSkinSelect();return;}
    var sbs=stageSelectButtons();
    for(var si=0;si<sbs.length;si++){
      var sb=sbs[si];
      if(p.x>=sb.x&&p.x<=sb.x+sb.w&&p.y>=sb.y&&p.y<=sb.y+sb.h){ selectedStage=si; return; }
    }
    var stb=menuStartButton();
    if(p.x>=stb.x&&p.x<=stb.x+stb.w&&p.y>=stb.y&&p.y<=stb.y+stb.h){ openStartConfirm(); return; }
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
  if(movePointerId!==null) return;
  var aegisActive=player&&player.ship==='aegis'&&(state==='play'||state==='boss');
  var bx=W-64,by=H-78;
  if(!aegisActive&&(p.x-bx)*(p.x-bx)+(p.y-by)*(p.y-by)<54*54){ bomb(); return; }
  var now=performance.now();
  if((state==='play'||state==='boss')&&now-lastTapAt<320&&Math.hypot(p.x-lastTapX,p.y-lastTapY)<70){ lastTapAt=0; bomb(); dragging=false; return; }
  lastTapAt=now; lastTapX=p.x; lastTapY=p.y;
  movePointerId=e.pointerId;
  dragging=true; dragLift=(e.pointerType==='touch')?86:0; dragMaxY=(e.pointerType==='touch')?H-140:H-70;
  target.x=Math.max(22,Math.min(W-22,p.x));
  target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onMove(e){
  if(movePointerId!==null&&e.pointerId!==movePointerId&&e.pointerType!=='mouse') return;
  if(e.pointerType==='mouse'&&(state==='play'||state==='boss')&&!(typeof desktopPaused!=='undefined'&&desktopPaused)){
    e.preventDefault();
    var mp=pt(e);target.x=Math.max(22,Math.min(W-22,mp.x));target.y=Math.max(70,Math.min(H-70,mp.y));
    return;
  }
  if(!dragging) return;
  e.preventDefault();
  var p=pt(e);target.x=Math.max(22,Math.min(W-22,p.x));target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onUp(e){if(movePointerId===null||(e&&e.pointerId===movePointerId)){movePointerId=null;dragging=false;}if(state==='bossFusion'){fusionHoldActive=false;fusionHoldT=0;}}
cvs.addEventListener('pointerdown',onDown,{passive:false});
cvs.addEventListener('pointermove',onMove,{passive:false});
cvs.addEventListener('pointerup',onUp);
cvs.addEventListener('pointercancel',onUp);
cvs.addEventListener('contextmenu',function(e){e.preventDefault();if((typeof desktopPaused==='undefined'||!desktopPaused)&&(state==='play'||state==='boss')&&typeof bomb==='function')bomb();});
