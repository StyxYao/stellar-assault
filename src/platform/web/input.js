// Web pointer input adapter. UI/game functions remain in the closure during migration.
var dragging=false,movePointerId=null,dragLift=0,dragMaxY=H-70,lastTapAt=0,lastTapX=0,lastTapY=0;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault();
  if(e.pointerType==='mouse'&&e.button===2){
    if(typeof coopEnabled!=='undefined'&&coopEnabled&&coopInputMode==='mouse'&&(state==='play'||state==='boss')&&typeof coopSpecial==='function'){
      e.preventDefault(); coopSpecial('secondary'); return;
    }
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
  if(typeof coopEnabled!=='undefined'&&coopEnabled&&(state==='play'||state==='boss')){
    if(coopInputMode==='mouse'){
      target2.x=Math.max(26,Math.min(W-26,p.x));
      target2.y=Math.max(110,Math.min(H-70,p.y));
      if(e.pointerType==='mouse'&&e.button===0&&typeof coopSpecial==='function') coopSpecial('primary');
      return;
    }
    if(coopInputMode==='kb') return;
  }
  if(player&&player.ship==='aegis'&&(state==='play'||state==='boss')&&typeof aegisButtonAt==='function'){
    var ab=aegisButtonAt(p);
    if(ab==='charge'){aegisTapCharge();return;}
    if(ab==='force'){aegisTapForce();return;}
  }
  if(player&&player.ship==='phantom'&&(state==='play'||state==='boss')&&typeof phantomButtonAt==='function'&&phantomButtonAt(p)){phantomSkill();return;}
  if(e.pointerType==='mouse'&&(state==='play'||state==='boss')&&typeof desktopPrimaryFire==='function') desktopPrimaryFire();
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m'); }
    if(typeof tutorialOpen!=='undefined'&&tutorialOpen){
      var th=tutorialAt(p);
      if(th==='next'){ if(typeof menuConfirmSfx==='function')menuConfirmSfx(); tutorialNext(); }
      else if(th==='close'||th==='outside'){ if(typeof menuMoveSfx==='function')menuMoveSfx(); closeTutorial(); }
      return;
    }
    if(typeof startConfirmOpen!=='undefined'&&startConfirmOpen){
      var sch=startConfirmAt(p);
      if(sch==='start'){if(typeof menuConfirmSfx==='function')menuConfirmSfx();closeStartConfirm();startAtStage(selectedStage);}
      else if(sch==='coop'){if(typeof menuMoveSfx==='function')menuMoveSfx();if(typeof coopToggle==='function')coopToggle();}
      else if(sch==='p2ship'){if(typeof menuMoveSfx==='function')menuMoveSfx();coopCycleShip2();}
      else if(sch==='p2skin'){if(typeof menuMoveSfx==='function')menuMoveSfx();coopCycleSkin2();}
      else if(sch==='change'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeStartConfirm();openShipSelect();}
      else if(sch==='cancel'||sch==='outside'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeStartConfirm();}
      return;
    }
    if(typeof skinSelectOpen!=='undefined'&&skinSelectOpen){
      var skhit=skinSelectAt(p);
      if(typeof skhit==='number'){ skinSelectIndex=skhit; if(typeof menuConfirmSfx==='function')menuConfirmSfx(); skinSelectChoose(skhit); return; }
      if(skhit==='tutorial'){if(typeof menuMoveSfx==='function')menuMoveSfx();openTutorial(selectedShip);return;}
      if(skhit==='back'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeSkinSelect();openShipSelect();return;}
      if(skhit==='close'||skhit==='outside'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeSkinSelect();}
      return;
    }
    if(typeof shipSelectOpen!=='undefined'&&shipSelectOpen){
      var hit=shipSelectAt(p);
      if(typeof hit==='number'){ shipSelectIndex=hit; if(typeof menuMoveSfx==='function')menuMoveSfx(); if(hit<3) shipSelectChoose(hit); return; }
      if(hit==='tutorial'){ if(typeof menuMoveSfx==='function')menuMoveSfx(); var trows=shipSelectRows(); openTutorial(trows[shipSelectIndex]?trows[shipSelectIndex].def.id:selectedShip); return; }
      if(hit==='close'||hit==='outside'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeShipSelect();}
      return;
    }
    var shb=menuShipButton();
    if(p.x>=shb.x&&p.x<=shb.x+shb.w&&p.y>=shb.y&&p.y<=shb.y+shb.h){if(typeof menuMoveSfx==='function')menuMoveSfx();openShipSelect();return;}
    var skb=menuSkinButton();
    if(p.x>=skb.x&&p.x<=skb.x+skb.w&&p.y>=skb.y&&p.y<=skb.y+skb.h){if(typeof menuMoveSfx==='function')menuMoveSfx();openSkinSelect();return;}
    var sbs=stageSelectButtons();
    for(var si=0;si<sbs.length;si++){
      var sb=sbs[si];
      if(p.x>=sb.x&&p.x<=sb.x+sb.w&&p.y>=sb.y&&p.y<=sb.y+sb.h){ selectedStage=si; if(typeof menuMoveSfx==='function')menuMoveSfx(); return; }
    }
    var modes=menuModeButtons();
    for(var mi=0;mi<modes.length;mi++){
      var mb=modes[mi];
      if(p.x>=mb.x&&p.x<=mb.x+mb.w&&p.y>=mb.y&&p.y<=mb.y+mb.h){
        menuModeIndex=mi;
        if(typeof menuMoveSfx==='function')menuMoveSfx();
        activateMainMode(mb.id); return;
      }
    }
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
  if(typeof coopEnabled!=='undefined'&&coopEnabled&&coopInputMode==='mouse'&&(state==='play'||state==='boss')){
    var cp=pt(e); target2.x=Math.max(26,Math.min(W-26,cp.x)); target2.y=Math.max(110,Math.min(H-70,cp.y)); return;
  }
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
function onUp(e){if(typeof coopEnabled!=='undefined'&&coopEnabled&&coopInputMode==='mouse'&&(state==='play'||state==='boss')) return;if(movePointerId===null||(e&&e.pointerId===movePointerId)){movePointerId=null;dragging=false;}if(state==='bossFusion'){fusionHoldActive=false;fusionHoldT=0;}}
cvs.addEventListener('pointerdown',onDown,{passive:false});
cvs.addEventListener('pointermove',onMove,{passive:false});
cvs.addEventListener('pointerup',onUp);
cvs.addEventListener('pointercancel',onUp);
cvs.addEventListener('contextmenu',function(e){e.preventDefault();if((typeof desktopPaused==='undefined'||!desktopPaused)&&(state==='play'||state==='boss')&&typeof bomb==='function')bomb();});
