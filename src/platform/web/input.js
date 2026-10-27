// Web pointer input adapter. UI/game functions remain in the closure during migration.
var dragging=false,movePointerId=null,dragLift=0,dragMaxY=H-70,lastTapAt=0,lastTapX=0,lastTapY=0;
var p2Dragging=false,p2PointerId=null,p2DragLift=86,p2DragMaxY=H-70;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault();
  if(e.pointerType==='mouse'&&e.button===2){
    // contextmenu routes P2 Force or P1 bomb exactly once.
    return;
  }
  var paused=(typeof desktopPaused!=='undefined'&&desktopPaused);
  if(paused){
    var pp=pt(e);
    if(typeof settingsOpen!=='undefined'&&settingsOpen){ if(typeof settingsTap==='function') settingsTap(pp); return; }
    if(typeof pauseMenuAt==='function'){ var ph=pauseMenuAt(pp); if(ph==='resume'){desktopSetPaused(false);return;} if(ph==='settings'){if(typeof openSettings==='function')openSettings();return;} if(ph==='quit'){if(typeof pauseQuitToMenu==='function')pauseQuitToMenu();return;} }
    return;
  }
  primeVideos(); initAudio(); loadSfxExtras();
  try{hedronLoopVideo.play().catch(function(){});}catch(err){}
  try{phase3LoopVideo.play().catch(function(){});}catch(err){}
  try{phase2LoopVideo.play().catch(function(){});}catch(err){}
  try{bgLoopVideo.play().catch(function(){});}catch(err){}
  try{if(AC&&AC.state==='suspended')AC.resume();}catch(err){}
  if(state==='menu'&&bgmPending){var pk=bgmPending;bgmPending='';playBgm(pk);}
  var p=pt(e);
  var inPlay=(state==='play'||state==='boss');
  if(inPlay&&typeof pauseButton==='function'){var pb=pauseButton();if(p.x>=pb.x&&p.x<=pb.x+pb.w&&p.y>=pb.y&&p.y<=pb.y+pb.h){desktopSetPaused(true);return;}}
  var p1Pointer = (typeof controlModeAllows!=='function'||controlModeAllows(1,'pointer',e.pointerType));
  var p2Pointer = !!(typeof coopEnabled!=='undefined'&&coopEnabled&&typeof controlModeAllows==='function'&&controlModeAllows(2,'pointer',e.pointerType));
  if(inPlay&&p2Pointer&&!p1Pointer){
    var p2btn=(typeof coopButtonAt==='function')?coopButtonAt(p):null;
    if(p2btn){ if(typeof coopSpecial==='function') coopSpecial(p2btn); return; }
    p2Dragging=true;p2PointerId=e.pointerId;p2DragLift=(e.pointerType==='touch')?86:0;p2DragMaxY=(e.pointerType==='touch')?H-140:H-70;
    target2.x=Math.max(26,Math.min(W-26,p.x));
    target2.y=Math.max(110,Math.min(p2DragMaxY,p.y-p2DragLift));
    if(e.pointerType==='mouse'&&e.button===0&&typeof coopSpecial==='function') coopSpecial('primary');
    return;
  }
  if(inPlay&&!p1Pointer&&!p2Pointer) return;
  if(player&&player.ship==='aegis'&&(state==='play'||state==='boss')&&typeof aegisButtonAt==='function'){
    var ab=aegisButtonAt(p);
    if(ab==='charge'){aegisTapCharge();return;}
    if(ab==='force'){aegisTapForce();return;}
  }
  if(player&&player.ship==='phantom'&&(state==='play'||state==='boss')&&typeof phantomButtonAt==='function'&&phantomButtonAt(p)){phantomSkill();return;}
  if(e.pointerType==='mouse'&&(state==='play'||state==='boss')&&p1Pointer&&typeof desktopPrimaryFire==='function') desktopPrimaryFire();
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m'); }
    if(typeof tutorialOpen!=='undefined'&&tutorialOpen){
      var th=tutorialAt(p);
      if(th==='next'){ if(typeof menuConfirmSfx==='function')menuConfirmSfx(); tutorialNext(); }
      else if(th==='close'||th==='outside'){ if(typeof menuMoveSfx==='function')menuMoveSfx(); closeTutorial(); }
      return;
    }
    if(typeof controlSelectOpen!=='undefined'&&controlSelectOpen){
      var ctrlHit=controlSelectAt(p);
      if(typeof ctrlHit==='number'){ controlSelectIndex=ctrlHit; if(typeof menuConfirmSfx==='function')menuConfirmSfx(); controlSelectChoose(ctrlHit); return; }
      if(ctrlHit==='close'||ctrlHit==='outside'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeControlSelect();}
      return;
    }
    if(typeof startConfirmOpen!=='undefined'&&startConfirmOpen){
      var sch=startConfirmAt(p);
      if(sch==='start'){if(typeof menuConfirmSfx==='function')menuConfirmSfx();closeStartConfirm();startAtStage(selectedStage);}
      else if(sch==='back'||sch==='outside'){if(typeof menuMoveSfx==='function')menuMoveSfx();closeStartConfirm();}
      else if(sch==='p1ctrl'){if(typeof menuMoveSfx==='function')menuMoveSfx();openControlSelect(1);}
      else if(sch==='p2ctrl'){if(typeof menuMoveSfx==='function')menuMoveSfx();openControlSelect(2);}
      else if(sch==='p1ship'){if(typeof menuMoveSfx==='function')menuMoveSfx();openShipSelect('p1');}
      else if(sch==='p1skin'){if(typeof menuMoveSfx==='function')menuMoveSfx();openSkinSelect('p1');}
      else if(sch==='p2ship'){if(typeof menuMoveSfx==='function')menuMoveSfx();openShipSelect('p2');}
      else if(sch==='p2skin'){if(typeof menuMoveSfx==='function')menuMoveSfx();openSkinSelect('p2');}
      else if(sch&&sch.indexOf('stage')===0){selectedStage=parseInt(sch.slice(5),10)||0;if(typeof menuMoveSfx==='function')menuMoveSfx();}
      return;
    }
    if(typeof skinSelectOpen!=='undefined'&&skinSelectOpen){
      var skhit=skinSelectAt(p);
      if(typeof skhit==='number'){ skinSelectIndex=skhit; if(typeof menuConfirmSfx==='function')menuConfirmSfx(); skinSelectChoose(skhit); return; }
      if(skhit==='tutorial'){if(typeof menuMoveSfx==='function')menuMoveSfx();openTutorial(selectShipId());return;}
      if(skhit==='back'){if(typeof menuMoveSfx==='function')menuMoveSfx();backToShipSelect();return;}
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
  if(p2Dragging&&e.pointerId===p2PointerId){
    e.preventDefault(); var cp=pt(e);
    target2.x=Math.max(26,Math.min(W-26,cp.x));
    target2.y=Math.max(110,Math.min(p2DragMaxY,cp.y-p2DragLift));
    return;
  }
  if(movePointerId!==null&&e.pointerId!==movePointerId&&e.pointerType!=='mouse') return;
  if(e.pointerType==='mouse'&&(state==='play'||state==='boss')&&!(typeof desktopPaused!=='undefined'&&desktopPaused)&&(typeof controlModeAllows!=='function'||controlModeAllows(1,'pointer','mouse'))){
    e.preventDefault();
    var mp=pt(e);target.x=Math.max(22,Math.min(W-22,mp.x));target.y=Math.max(70,Math.min(H-70,mp.y));
    return;
  }
  if(!dragging) return;
  e.preventDefault();
  var p=pt(e);target.x=Math.max(22,Math.min(W-22,p.x));target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onUp(e){if(p2Dragging&&(!e||e.pointerId===p2PointerId)){p2Dragging=false;p2PointerId=null;}if(movePointerId===null||!e||(e.pointerId===movePointerId)){movePointerId=null;dragging=false;}if(state==='bossFusion'){fusionHoldActive=false;fusionHoldT=0;}}
cvs.addEventListener('pointerdown',onDown,{passive:false});
cvs.addEventListener('pointermove',onMove,{passive:false});
cvs.addEventListener('pointerup',onUp);
cvs.addEventListener('pointercancel',onUp);
cvs.addEventListener('contextmenu',function(e){e.preventDefault();if((typeof desktopPaused==='undefined'||!desktopPaused)&&(state==='play'||state==='boss')){var p=pt(e);var p2=(typeof coopEnabled!=='undefined'&&coopEnabled&&typeof controlModeAllows==='function'&&controlModeAllows(2,'pointer','mouse'));if(p2&&typeof coopSpecial==='function'){coopSpecial('secondary');return;}if(typeof bomb==='function')bomb();}});
