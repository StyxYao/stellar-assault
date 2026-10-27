// Menu feedback: move = F+C, confirm = H+C.
function menuMoveSfx(){
  try{ if(typeof sfx==='function') sfx('ui_move',0.15); }catch(e){}
  try{ if(typeof sfx==='function') sfx('ui_metal',0.10); }catch(e){}
}
function menuConfirmSfx(){
  try{ if(typeof sfx==='function') sfx('ui_holo',0.13); }catch(e){}
  try{ if(typeof sfx==='function') sfx('ui_metal',0.20); }catch(e){}
}
// HUD, menu, banners, cutscenes, finale and cast screens.
function drawHUD(){
  if(state==='menu') return;
  ctx.fillStyle='rgba(3,6,14,0.55)';ctx.fillRect(0,0,W,64);
  ctx.textAlign='left';
  ctx.fillStyle='#9fb6cf';ctx.font='10px monospace';ctx.fillText('STAGE '+(stage+1)+'/'+STAGES.length+' · '+STAGES[stage].name,16,16);
  ctx.fillStyle='#f2f7ff';ctx.font='24px monospace';ctx.fillText(String(score).padStart(7,'0'),16,42);
  ctx.textAlign='right';ctx.fillStyle='#9fb6cf';ctx.font='11px monospace';
  var tag=state==='boss'&&boss?boss.def.name:(state==='clear'?'CLEAR':(state==='win'?'COMPLETE':(state==='over'?'GAME OVER':(state==='bossWarn'?'WARNING':'INCOMING'))));
  ctx.fillText(tag,W-16,18);
  ctx.textAlign='left';
  if(boss&&(state==='boss')){
    var hp=Math.max(0,boss.hp/boss.max);
    ctx.fillStyle='#1a2638';ctx.fillRect(40,52,W-80,7);
    ctx.fillStyle='#ff7a4d';ctx.fillRect(40,52,(W-80)*hp,7);
    ctx.fillStyle='#9fb6cf';ctx.font='9px monospace';ctx.fillText('BOSS',16,59);
  }
  ctx.fillStyle='#cfe0f0';ctx.font='11px monospace';
  var maxLv=player.specialPower>=4;ctx.fillStyle=maxLv?'#ffd76a':'#cfe0f0';ctx.fillText(weaponName()+'  LV'+player.specialPower+(maxLv?' MAX':' '+player.powerXp+'/2'),16,H-96);ctx.fillStyle='#cfe0f0';
  ctx.fillStyle='#1a2638';ctx.fillRect(16,H-112,112,6);
  if(player.odT>0){ctx.fillStyle='#ffd76a';ctx.fillRect(16,H-112,112,6);ctx.fillStyle='#ffe9a8';ctx.font='9px monospace';ctx.fillText('OVERDRIVE '+player.odT.toFixed(1),134,H-107);}
  else{ctx.fillStyle='#62e8ff';ctx.fillRect(16,H-112,112*player.od/100,6);ctx.fillStyle='#8fb8ca';ctx.font='8px monospace';ctx.fillText('OD '+Math.floor(player.od)+'%',134,H-107);}
  ctx.fillStyle='#cfe0f0';ctx.font='11px monospace';
  var hpx='HP ';for(var hi=0;hi<player.maxHp;hi++)hpx+=(hi<player.hp?'●':'○');
  ctx.fillStyle='#8dff9e';ctx.fillText(hpx,16,H-78);ctx.fillStyle='#cfe0f0';
  if(player.ship==='aegis'){ctx.fillStyle='#9fe8ff';ctx.fillText('FORCE · SHIELD '+Math.round(aegisState.shield/aegisShieldMax()*100)+'%',16,H-60);ctx.fillStyle='#cfe0f0';}
  else if(player.ship==='phantom'){ctx.fillStyle='#c9a0ff';ctx.fillText('CLONES '+phantomState.clones.length+'/'+phantomState.cap+' · CLOAK '+phantomState.cloakT.toFixed(1),16,H-60);ctx.fillStyle='#cfe0f0';}
  else ctx.fillText('WING '+player.options+'·P'+player.wingPower,16,H-60);
  ctx.fillText('SHIPS '+player.lives,16,H-42);ctx.fillText((player.ship==='aegis'?'FORCE ':(player.ship==='phantom'?'PHASE ':'BOMB '))+player.bombs,16,H-24);
  if(player.ship!=='aegis'&&player.ship!=='phantom') drawBombBtn();
  if(typeof drawAegisControls==='function') drawAegisControls();
  if(typeof drawPhantomControls==='function') drawPhantomControls();
  if(typeof coopDrawHUD==='function') coopDrawHUD();
}
function drawBanner(){
  if(bannerT<=0||!banner) return;
  var a=Math.min(1,bannerT*1.4);
  ctx.globalAlpha=a;ctx.textAlign='center';
  ctx.fillStyle=state==='bossWarn'?'#ff8a66':'#eaf4ff';ctx.font='28px monospace';
  ctx.fillText(banner,W/2,H*0.33);
  if(bannerSub){ctx.fillStyle='#9fb6cf';ctx.font='12px monospace';ctx.fillText(bannerSub,W/2,H*0.33+26);}
  ctx.globalAlpha=1;ctx.textAlign='left';
}
function stageSelectButtons(){
  var bw=46,bh=38,gap=9,total=5*bw+4*gap,sx=W/2-total/2,sy=H*.468;
  var out=[];
  for(var i=0;i<5;i++)out.push({i:i,x:sx+i*(bw+gap),y:sy,w:bw,h:bh});
  return out;
}
var menuModeIndex = 0;
function menuModeButtons(){
  var gap=7, w=(W-52-2*gap)/3, y=H*.515, x=26;
  return [
    {id:'solo', label:'LOCAL SOLO', sub:'1 PLAYER', x:x, y:y, w:w, h:44},
    {id:'coop', label:'LOCAL CO-OP', sub:'2 PLAYERS', x:x+w+gap, y:y, w:w, h:44},
    {id:'lan', label:'LAN CO-OP', sub:'HOST / JOIN', x:x+(w+gap)*2, y:y, w:w, h:44}
  ];
}
function menuStartButton(){return menuModeButtons()[0];}
function menuShipButton(){return {x:W/2-118,y:H*.395,w:112,h:38};}

var tutorialOpen = false, tutorialShip = 'vector', tutorialPage = 0;
function tutorialPanel(){ return {x:26,y:H*.17,w:W-52,h:H*.60}; }
function tutorialButton(){ var p=tutorialPanel(); return {x:p.x+p.w-118,y:p.y+p.h-72,w:96,h:26}; }
function shipTutorialButton(){ var p=shipSelectPanel(); return {x:p.x+20,y:p.y+p.h-52,w:156,h:26}; }
function tutorialPages(ship){
  if(ship==='aegis') return [
    {t:'AEGIS · 01 / CHARGE', lines:['MOVE with drag / arrows / left stick.','AUTO-FIRE is always on.','Tap C or the CHG button to charge.','Release to fire a wider, stronger beam.','Higher charge = larger cannon.']},
    {t:'AEGIS · 02 / FORCE', lines:['Tap F or the FORCE button.','Attached: Force blocks bullets.','Detached: Force adds firepower.','Tap again to recall the Force.','E restores charge. D expands Force radius.']}
  ];
  if(ship==='phantom') return [
    {t:'PHANTOM · 01 / CLOAK', lines:['Tap Z or the PHASE button.','3 seconds of invincibility.','Raven: 4 seconds.','Cloak damage: +30% / Raven +100%.','No wingmen and no bomb.']},
    {t:'PHANTOM · 02 / CLONES', lines:['A 3 HP clone is left behind.','It copies your weapon and level.','Clone damage is 50% of base.','After a hit it is invulnerable for 1s.','E restores charge. D raises clone cap.']}
  ];
  return [
    {t:'VECTOR · 01 / FIRE', lines:['MOVE with drag / arrows / left stick.','AUTO-FIRE is always on.','Tap Z or Space for a screen bomb.','The bomb clears bullets around you.']},
    {t:'VECTOR · 02 / WINGMEN', lines:['D adds a wingman (maximum 4).','Wingmen add firepower, not shields.','E restores one bomb charge.','Death drops one wingman level.','Collect P for power, 1UP for life.']}
  ];
}
function openTutorial(ship){ tutorialShip=ship||'vector'; tutorialPage=0; tutorialOpen=true; }
function closeTutorial(){ tutorialOpen=false; }
function tutorialNext(){ var pages=tutorialPages(tutorialShip); if(tutorialPage>=pages.length-1) closeTutorial(); else tutorialPage++; }
function tutorialPrev(){ if(tutorialPage>0) tutorialPage--; }
function tutorialAt(p){ var b=tutorialButton(); if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h) return 'close'; var pp=tutorialPanel(); if(p.x<pp.x||p.x>pp.x+pp.w||p.y<pp.y||p.y>pp.y+pp.h) return 'outside'; return 'next'; }
function drawTutorialOverlay(){
  if(!tutorialOpen) return;
  var p=tutorialPanel(), pages=tutorialPages(tutorialShip), pg=pages[Math.max(0,Math.min(pages.length-1,tutorialPage))];
  ctx.save(); ctx.fillStyle='rgba(1,4,10,0.86)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(5,15,26,0.98)'; ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='#5d8fa8'; ctx.lineWidth=1.5; ctx.strokeRect(p.x,p.y,p.w,p.h);
  ctx.textAlign='left'; ctx.fillStyle='#eaf8ff'; ctx.font='900 17px "Arial Black", Arial, sans-serif';
  ctx.fillText(pg.t,p.x+20,p.y+38);
  ctx.fillStyle='#7f9bb0'; ctx.font='9px monospace';
  ctx.fillText('SHIP TUTORIAL · '+(tutorialPage+1)+'/'+pages.length,p.x+20,p.y+56);
  ctx.fillStyle='#b8d8e8'; ctx.font='12px Rajdhani, Arial, sans-serif';
  for(var i=0;i<pg.lines.length;i++) ctx.fillText(pg.lines[i],p.x+26,p.y+100+i*27);
  var b=tutorialButton(); ctx.fillStyle='rgba(8,24,38,0.9)'; ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.strokeStyle='#9fe8ff'; ctx.lineWidth=1.2; ctx.strokeRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle='#eaf8ff'; ctx.font='700 10px monospace'; ctx.textAlign='center';
  ctx.fillText(tutorialPage>=pages.length-1?'CLOSE':'NEXT',b.x+b.w/2,b.y+17);
  ctx.fillStyle='#6d879b'; ctx.font='8px monospace'; ctx.textAlign='center';
  ctx.fillText('ENTER NEXT · ESC CLOSE',W/2,p.y+p.h-14);
  ctx.restore(); ctx.textAlign='left';
}
var shipSelectOpen = false;
var selectFor = 'p1', setupReturn = false;
function selectShipId(){ return selectFor === 'p2' ? coopShip2 : selectedShip; }
function selectSkinId(){ return selectFor === 'p2' ? coopSkin2 : selectedSkins[selectedShip]; }
function finishSetupSelection(){
  shipSelectOpen=false; skinSelectOpen=false;
  if(setupReturn){ setupReturn=false; startConfirmOpen=true; }
}
function backToShipSelect(){
  skinSelectOpen=false; shipSelectOpen=true;
  var cur=selectShipId();
  shipSelectIndex=cur==='aegis'?1:(cur==='phantom'?2:0);
}

var shipSelectIndex = 0;
function shipSelectPanel(){ return {x:24,y:H*.14,w:W-48,h:H*.57}; }
function shipSelectCloseButton(){ var p=shipSelectPanel(); return {x:p.x+p.w-36,y:p.y+12,w:24,h:24}; }
function shipSelectRows(){
  var p=shipSelectPanel(), rows=[], start=p.y+96, h=98, gap=10;
  var defs=[
    {id:'vector',name:'VECTOR',role:'BALANCED · WINGMAN',trait:'FIREPOWER WINGMEN · FULL-SCREEN BOMB',stats:'HP 3 · WINGMEN MAX 4 · BOMB 200',status:'AVAILABLE',color:'#9fe8ff',image:'sk_vector_void_lance'},
    {id:'aegis',name:'AEGIS',role:'FORCE · CHARGE',trait:'FORCE SHIELD · CHARGE CANNON',stats:'SHIELD 60 · FORCE 400 · CHARGE CANNON',status:'AVAILABLE',color:'#ffd36b',image:'sk_aegis_orbital'},
    {id:'phantom',name:'PHANTOM',role:'CLOAK · CLONE',trait:'STEALTH · DECOY CLONES',stats:'CLOAK 3s · CLONE DMG 50% · CAP 1→2',status:'AVAILABLE',color:'#c98bff',image:'sk_phantom_quantum'}
  ];
  for(var i=0;i<defs.length;i++) rows.push({i:i,x:p.x+14,y:start+i*(h+gap),w:p.w-28,h:h,def:defs[i]});
  return rows;
}
function openShipSelect(forPlayer){
  setupReturn = setupReturn || startConfirmOpen;
  selectFor = forPlayer || selectFor || 'p1';
  startConfirmOpen=false; skinSelectOpen=false; shipSelectOpen=true;
  var cur=selectShipId();
  shipSelectIndex=cur==='aegis'?1:(cur==='phantom'?2:0);
}
function closeShipSelect(){
  shipSelectOpen=false;
  if(setupReturn) finishSetupSelection();
}
function shipSelectChoose(i){
  if(i<0||i>2) return false;
  var ship=i===0?'vector':(i===1?'aegis':'phantom');
  if(selectFor==='p2'){
    coopShip2=ship;
    var l2=skinList(ship);
    coopSkin2=coopPickSkin2(ship,'');
    if(selectedShip===ship&&selectedSkins[ship]===coopSkin2){
      for(var k=0;k<l2.length;k++) if(l2[k].id!==selectedSkins[ship]){coopSkin2=l2[k].id;break;}
    }
  } else {
    setSelectedShip(ship);
    var l1=skinList(ship);
    if(l1.length) setSelectedSkin(ship,l1[0].id);
    if(typeof coopEnsureDistinct==='function') coopEnsureDistinct();
  }
  shipSelectOpen=false;
  openSkinSelect(selectFor);
  return true;
}
function shipSelectAt(p){
  var tb=shipTutorialButton();
  if(p.x>=tb.x&&p.x<=tb.x+tb.w&&p.y>=tb.y&&p.y<=tb.y+tb.h) return 'tutorial';
  var cb=shipSelectCloseButton();
  if(p.x>=cb.x&&p.x<=cb.x+cb.w&&p.y>=cb.y&&p.y<=cb.y+cb.h) return 'close';
  var rows=shipSelectRows();
  for(var i=0;i<rows.length;i++){var r=rows[i];if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)return i;}
  var panel=shipSelectPanel();
  if(p.x<panel.x||p.x>panel.x+panel.w||p.y<panel.y||p.y>panel.y+panel.h) return 'outside';
  return 'panel';
}
function drawShipPreview(key,x,y,size,color){
  var gi=key&&GIMG[key];
  if(gi&&gi.complete){ctx.drawImage(gi,x-size/2,y-size/2,size,size);return;}
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=.8;
  ctx.beginPath();ctx.moveTo(x,y-size*.4);ctx.lineTo(x+size*.34,y);ctx.lineTo(x,y+size*.4);ctx.lineTo(x-size*.34,y);ctx.closePath();ctx.stroke();
  ctx.fillStyle=color;ctx.font='700 12px monospace';ctx.textAlign='center';ctx.fillText('?',x,y+4);ctx.restore();
}

var startConfirmOpen = false;
function startConfirmPanel(){
  if(typeof coopEnabled!=='undefined'&&coopEnabled) return {x:18,y:H*.045,w:W-36,h:H*.90};
  return {x:26,y:H*.085,w:W-52,h:H*.82};
}
function setupSplitPanels(){
  var p=startConfirmPanel(), gap=8, h=230;
  return {
    p1:{x:p.x+10,y:p.y+44,w:p.w-20,h:h},
    p2:{x:p.x+10,y:p.y+44+h+gap,w:p.w-20,h:h}
  };
}
function setupStageButtons(){
  var p=startConfirmPanel(), gap=6, bw=(p.w-40-4*gap)/5;
  var y=(typeof coopEnabled!=='undefined'&&coopEnabled)?p.y+p.h-232:p.y+296;
  var out=[];
  for(var i=0;i<5;i++) out.push({i:i,x:p.x+20+i*(bw+gap),y:y,w:bw,h:34});
  return out;
}
function startConfirmButtons(){
  var p=startConfirmPanel();
  if(typeof coopEnabled!=='undefined'&&coopEnabled){
    var sp=setupSplitPanels(), a=sp.p1, b=sp.p2;
    function row(q,prefix){return {
      ship:{x:q.x+12,y:q.y+150,w:96,h:24,id:prefix+'ship'},
      skin:{x:q.x+116,y:q.y+150,w:96,h:24,id:prefix+'skin'},
      ctrl:{x:q.x+220,y:q.y+150,w:q.w-232,h:24,id:prefix+'ctrl'}
    };}
    var r1=row(a,'p1'),r2=row(b,'p2');
    return {
      p1ship:r1.ship,p1skin:r1.skin,p1ctrl:r1.ctrl,
      p2ship:r2.ship,p2skin:r2.skin,p2ctrl:r2.ctrl,
      start:{x:p.x+22,y:p.y+p.h-138,w:p.w-44,h:44},
      back:{x:p.x+22,y:p.y+p.h-38,w:p.w-44,h:28}
    };
  }
  return {
    p1ship:{x:p.x+22,y:p.y+244,w:145,h:28},
    p1skin:{x:p.x+p.w-167,y:p.y+244,w:145,h:28},
    p2ship:{x:p.x+22,y:p.y+346,w:145,h:26},
    p2skin:{x:p.x+p.w-167,y:p.y+346,w:145,h:26},
    p1ctrl:{x:p.x+22,y:p.y+382,w:p.w-44,h:26},
    p2ctrl:{x:p.x+22,y:p.y+414,w:p.w-44,h:26},
    start:{x:p.x+22,y:p.y+p.h-88,w:p.w-44,h:44},
    back:{x:p.x+22,y:p.y+p.h-36,w:p.w-44,h:28}
  };
}
function activateMainMode(mode) {
  if (mode === 'lan') {
    if (typeof coopSetMode === 'function') coopSetMode('solo');
    startConfirmOpen = false; shipSelectOpen = false; skinSelectOpen = false; tutorialOpen = false;
    if (window.__openLanHost) window.__openLanHost();
    return;
  }
  openStartConfirm(mode === 'coop' ? 'coop' : 'solo');
}

function openStartConfirm(mode){
  if(mode==='solo'||mode==='coop'){
    if(typeof coopSetMode==='function') coopSetMode(mode);
  }
  if(typeof coopEnabled!=='undefined'&&coopEnabled&&typeof coopEnsureDistinct==='function') coopEnsureDistinct();
  startConfirmOpen=true; shipSelectOpen=false; skinSelectOpen=false;
}
function closeStartConfirm(){ startConfirmOpen=false; }
function cycleP1Ship(){
  var ships=['vector','aegis','phantom'];
  var i=ships.indexOf(selectedShip); i=(i+1)%ships.length;
  setSelectedShip(ships[i]);
  var list=(typeof skinList==='function')?skinList(ships[i]):[];
  if(list.length) setSelectedSkin(ships[i],list[0].id);
  if(typeof coopEnsureDistinct==='function') coopEnsureDistinct();
}
function cycleP1Skin(){ if(typeof cycleSkin==='function') cycleSkin(1); }
function startConfirmAt(p){
  var b=startConfirmButtons();
  if(p.x>=b.p1ship.x&&p.x<=b.p1ship.x+b.p1ship.w&&p.y>=b.p1ship.y&&p.y<=b.p1ship.y+b.p1ship.h) return 'p1ship';
  if(p.x>=b.p1skin.x&&p.x<=b.p1skin.x+b.p1skin.w&&p.y>=b.p1skin.y&&p.y<=b.p1skin.y+b.p1skin.h) return 'p1skin';
  var sb=setupStageButtons();
  for(var i=0;i<sb.length;i++){var q=sb[i];if(p.x>=q.x&&p.x<=q.x+q.w&&p.y>=q.y&&p.y<=q.y+q.h)return 'stage'+i;}
  if(p.x>=b.p2ship.x&&p.x<=b.p2ship.x+b.p2ship.w&&p.y>=b.p2ship.y&&p.y<=b.p2ship.y+b.p2ship.h) return 'p2ship';
  if(p.x>=b.p2skin.x&&p.x<=b.p2skin.x+b.p2skin.w&&p.y>=b.p2skin.y&&p.y<=b.p2skin.y+b.p2skin.h) return 'p2skin';
  if(p.x>=b.p1ctrl.x&&p.x<=b.p1ctrl.x+b.p1ctrl.w&&p.y>=b.p1ctrl.y&&p.y<=b.p1ctrl.y+b.p1ctrl.h) return 'p1ctrl';
  if(typeof coopEnabled!=='undefined'&&coopEnabled&&p.x>=b.p2ctrl.x&&p.x<=b.p2ctrl.x+b.p2ctrl.w&&p.y>=b.p2ctrl.y&&p.y<=b.p2ctrl.y+b.p2ctrl.h) return 'p2ctrl';
  if(p.x>=b.start.x&&p.x<=b.start.x+b.start.w&&p.y>=b.start.y&&p.y<=b.start.y+b.start.h) return 'start';
  if(p.x>=b.back.x&&p.x<=b.back.x+b.back.w&&p.y>=b.back.y&&p.y<=b.back.y+b.back.h) return 'back';
  var panel=startConfirmPanel();
  if(p.x<panel.x||p.x>panel.x+panel.w||p.y<panel.y||p.y>panel.y+panel.h) return 'outside';
  return 'panel';
}
function drawSetupPlayerPanel(q, label, ship, skin, controlMode, buttons, color){
  ctx.fillStyle='rgba(6,18,30,0.94)';ctx.fillRect(q.x,q.y,q.w,q.h);
  ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.strokeRect(q.x,q.y,q.w,q.h);
  ctx.textAlign='left';ctx.fillStyle=color;ctx.font='900 11px "Arial Black", Arial, sans-serif';
  ctx.fillText(label+' LOADOUT',q.x+14,q.y+22);
  var sd=SHIP_DEFS[ship]||{};
  var def=coopSkinDef(ship,skin);
  var img=def&&GIMG[def.image];
  if(img&&img.complete) ctx.drawImage(img,q.x+14,q.y+34,82,82);
  else drawShipPreview(def&&def.image,q.x+55,q.y+75,74,color);
  ctx.textAlign='left';ctx.fillStyle='#eaf8ff';ctx.font='900 16px "Arial Black", Arial, sans-serif';
  ctx.fillText(sd.label||String(ship).toUpperCase(),q.x+110,q.y+58);
  ctx.fillStyle='#ffd36b';ctx.font='700 9px monospace';
  ctx.fillText(def?def.label:'DEFAULT',q.x+110,q.y+78);
  ctx.fillStyle='#9fc8dc';ctx.font='6px monospace';
  ctx.fillText(def&&def.trait?def.trait:'NO SPECIAL TRAITS',q.x+110,q.y+94);
  function btn(b,txt,c){
    ctx.fillStyle='rgba(6,18,30,0.96)';ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.strokeStyle=c;ctx.lineWidth=1;ctx.strokeRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='#dff8ff';ctx.font='700 7px monospace';ctx.textAlign='center';
    ctx.fillText(txt,b.x+b.w/2,b.y+16);
  }
  btn(buttons.p1ship||buttons.p2ship,'SHIP ›',color);
  btn(buttons.p1skin||buttons.p2skin,'VAR ›',color);
  btn(buttons.p1ctrl||buttons.p2ctrl,'CTRL · '+String(controlMode||'auto').toUpperCase(),color);
}
function drawSetupSplit(){
  var p=startConfirmPanel();
  ctx.fillStyle='rgba(1,4,10,0.86)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(5,15,26,0.985)';ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='#ffd36b';ctx.lineWidth=1.6;ctx.strokeRect(p.x,p.y,p.w,p.h);
  ctx.textAlign='center';ctx.fillStyle='#ffe7b0';ctx.font='900 15px "Arial Black", Arial, sans-serif';
  ctx.fillText('MISSION SETUP · LOCAL CO-OP',W/2,p.y+28);
  ctx.fillStyle='#9fc8dc';ctx.font='7px monospace';
  ctx.fillText('P1 TOP · P2 BOTTOM · SHARED STAGE',W/2,p.y+44);
  var b=startConfirmButtons(), sp=setupSplitPanels();
  drawSetupPlayerPanel(sp.p1,'P1',selectedShip,selectedSkins[selectedShip],controlModeP1,{p1ship:b.p1ship,p1skin:b.p1skin,p1ctrl:b.p1ctrl},'#9fe8ff');
  drawSetupPlayerPanel(sp.p2,'P2',coopShip2,coopSkin2,controlModeP2,{p2ship:b.p2ship,p2skin:b.p2skin,p2ctrl:b.p2ctrl},'#8dffb0');
  // shared stage
  ctx.textAlign='left';ctx.fillStyle='#8fb8ca';ctx.font='8px monospace';
  ctx.fillText('STAGE · SHARED',p.x+22,p.y+p.h-244);
  var sb=setupStageButtons();
  for(var i=0;i<sb.length;i++){
    var q=sb[i],sel=q.i===selectedStage;
    ctx.fillStyle=sel?'rgba(85,60,18,0.95)':'rgba(6,18,30,0.92)';
    ctx.fillRect(q.x,q.y,q.w,q.h);
    ctx.strokeStyle=sel?'#ffe08a':'#31536a';ctx.lineWidth=sel?2:1;ctx.strokeRect(q.x,q.y,q.w,q.h);
    ctx.textAlign='center';ctx.fillStyle=sel?'#fff2c4':'#dff4ff';ctx.font='900 11px "Arial Black", Arial, sans-serif';
    ctx.fillText(String(q.i+1),q.x+q.w/2,q.y+14);
    ctx.fillStyle=sel?'#ffe7b0':'#7893a8';ctx.font='6px monospace';
    ctx.fillText((STAGES[q.i]&&STAGES[q.i].name?STAGES[q.i].name:'').slice(0,8),q.x+q.w/2,q.y+26);
  }
  if(typeof pickupT!=='undefined'&&pickupT>0&&pickupMsg&&/CONFLICT|CONTROL/.test(pickupMsg)){
    ctx.fillStyle='#ffd36b';ctx.font='7px monospace';ctx.textAlign='center';
    ctx.fillText(pickupMsg,W/2,sb[0].y+52);
  }
  ctx.fillStyle='rgba(50,32,10,0.96)';ctx.fillRect(b.start.x,b.start.y,b.start.w,b.start.h);
  ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;ctx.strokeRect(b.start.x,b.start.y,b.start.w,b.start.h);
  ctx.fillStyle='#ffe7b0';ctx.font='900 15px "Arial Black", Arial, sans-serif';ctx.textAlign='center';
  ctx.fillText('START  ·  STAGE '+(selectedStage+1),b.start.x+b.start.w/2,b.start.y+28);
  ctx.fillStyle='rgba(6,18,30,0.92)';ctx.fillRect(b.back.x,b.back.y,b.back.w,b.back.h);
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(b.back.x,b.back.y,b.back.w,b.back.h);
  ctx.fillStyle='#9fb6cf';ctx.font='700 9px monospace';
  ctx.fillText('‹ BACK TO MODES',b.back.x+b.back.w/2,b.back.y+18);
}

function drawStartConfirmOverlay(){
  if(!startConfirmOpen) return;
  ctx.save();
  if(typeof coopEnabled!=='undefined'&&coopEnabled){ drawSetupSplit(); ctx.restore(); return; }
  ctx.fillStyle='rgba(1,4,10,0.84)';ctx.fillRect(0,0,W,H);
  var p=startConfirmPanel();
  ctx.fillStyle='rgba(5,15,26,0.985)';ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='#ffd36b';ctx.lineWidth=1.6;ctx.strokeRect(p.x,p.y,p.w,p.h);
  ctx.textAlign='center';
  ctx.fillStyle='#ffe7b0';ctx.font='900 15px "Arial Black", Arial, sans-serif';
  ctx.fillText('MISSION SETUP',W/2,p.y+30);
  ctx.fillStyle='#9fc8dc';ctx.font='8px monospace';
  ctx.fillText((typeof coopEnabled!=='undefined'&&coopEnabled?'LOCAL CO-OP · P1 + P2':'LOCAL SOLO · 1 PLAYER')+'  ·  STAGE '+(selectedStage+1),W/2,p.y+48);
  var imgKey=(typeof currentSkinImage==='function')?currentSkinImage():null;
  var img=imgKey&&GIMG[imgKey];
  if(img&&img.complete) ctx.drawImage(img,W/2-50,p.y+62,100,100);
  else drawShipPreview(imgKey,W/2,p.y+112,88,'#9fe8ff');
  var sd=SHIP_DEFS[selectedShip]||{};
  var vd=(typeof currentSkinDef==='function')?currentSkinDef():null;
  ctx.fillStyle='#eaf8ff';ctx.font='900 19px "Arial Black", Arial, sans-serif';
  ctx.fillText(sd.label||String(selectedShip).toUpperCase(),W/2,p.y+188);
  ctx.fillStyle='#ffd36b';ctx.font='700 11px monospace';
  ctx.fillText(vd?vd.label:'DEFAULT',W/2,p.y+208);
  ctx.fillStyle='#9fc8dc';ctx.font='7px monospace';
  ctx.fillText(vd&&vd.trait?vd.trait:'NO SPECIAL TRAITS',W/2,p.y+224);
  var b=startConfirmButtons();
  function btn(x,y,w,h,label,col){
    ctx.fillStyle='rgba(6,18,30,0.94)';ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=col||'#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
    ctx.fillStyle='#c8eaff';ctx.font='700 8px monospace';ctx.textAlign='center';
    ctx.fillText(label,x+w/2,y+h/2+3);
  }
  btn(b.p1ship.x,b.p1ship.y,b.p1ship.w,b.p1ship.h,'P1 SHIP · '+(sd.label||'VECTOR')+'  ›','#9fe8ff');
  btn(b.p1skin.x,b.p1skin.y,b.p1skin.w,b.p1skin.h,'P1 VAR · '+(vd?vd.label:'DEFAULT')+'  ›','#9fe8ff');
  ctx.fillStyle='#8fb8ca';ctx.font='8px monospace';ctx.textAlign='left';
  ctx.fillText('STAGE',p.x+22,p.y+286);
  var sb=setupStageButtons();
  for(var i=0;i<sb.length;i++){
    var q=sb[i],sel=q.i===selectedStage;
    ctx.fillStyle=sel?'rgba(85,60,18,0.95)':'rgba(6,18,30,0.9)';
    ctx.fillRect(q.x,q.y,q.w,q.h);
    ctx.strokeStyle=sel?'#ffe08a':'#31536a';ctx.lineWidth=sel?2:1;ctx.strokeRect(q.x,q.y,q.w,q.h);
    ctx.fillStyle=sel?'#fff2c4':'#dff4ff';ctx.font='900 12px "Arial Black", Arial, sans-serif';ctx.textAlign='center';
    ctx.fillText(String(q.i+1),q.x+q.w/2,q.y+14);
    ctx.fillStyle=sel?'#ffe7b0':'#7893a8';ctx.font='6px monospace';
    ctx.fillText((STAGES[q.i]&&STAGES[q.i].name?STAGES[q.i].name:'').slice(0,8),q.x+q.w/2,q.y+26);
  }
  if(typeof coopEnabled!=='undefined'&&coopEnabled){
    ctx.fillStyle='#8fb8ca';ctx.font='8px monospace';ctx.textAlign='left';
    ctx.fillText('P2 LOADOUT',p.x+22,p.y+336);
    btn(b.p2ship.x,b.p2ship.y,b.p2ship.w,b.p2ship.h,'P2 SHIP · '+(typeof coopShipLabel2==='function'?coopShipLabel2():'VECTOR')+'  ›','#8dffb0');
    btn(b.p2skin.x,b.p2skin.y,b.p2skin.w,b.p2skin.h,'P2 VAR · '+(typeof coopSkinLabel2==='function'?coopSkinLabel2():'DEFAULT')+'  ›','#8dffb0');
  } else {
    ctx.fillStyle='#7893a8';ctx.font='8px monospace';ctx.textAlign='left';
    ctx.fillText('LOCAL SOLO · P2 CONTROLS HIDDEN',p.x+22,p.y+356);
  }
  var p1cl=(typeof controlModeLabel==='function')?controlModeLabel(controlModeP1):'AUTO';
  var p2cl=(typeof controlModeLabel==='function')?controlModeLabel(controlModeP2):'KEYBOARD';
  btn(b.p1ctrl.x,b.p1ctrl.y,b.p1ctrl.w,b.p1ctrl.h,'P1 CONTROL · '+p1cl+'  ›','#9fe8ff');
  if(typeof coopEnabled!=='undefined'&&coopEnabled){
    btn(b.p2ctrl.x,b.p2ctrl.y,b.p2ctrl.w,b.p2ctrl.h,'P2 CONTROL · '+p2cl+'  ›','#8dffb0');
  }
  if(typeof pickupT!=='undefined'&&pickupT>0&&pickupMsg&&/CONFLICT|CONTROL/.test(pickupMsg)){
    ctx.fillStyle='#ffd36b';ctx.font='7px monospace';ctx.textAlign='center';
    ctx.fillText(pickupMsg,W/2,p.y+464);
  }
  ctx.fillStyle='rgba(50,32,10,0.96)';ctx.fillRect(b.start.x,b.start.y,b.start.w,b.start.h);
  ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;ctx.strokeRect(b.start.x,b.start.y,b.start.w,b.start.h);
  ctx.fillStyle='#ffe7b0';ctx.font='900 15px "Arial Black", Arial, sans-serif';ctx.textAlign='center';
  ctx.fillText('START  ·  STAGE '+(selectedStage+1),b.start.x+b.start.w/2,b.start.y+28);
  ctx.fillStyle='rgba(6,18,30,0.9)';ctx.fillRect(b.back.x,b.back.y,b.back.w,b.back.h);
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(b.back.x,b.back.y,b.back.w,b.back.h);
  ctx.fillStyle='#9fb6cf';ctx.font='700 9px monospace';ctx.textAlign='center';
  ctx.fillText('‹ BACK TO MODES',b.back.x+b.back.w/2,b.back.y+18);
  ctx.textAlign='left';ctx.restore();
}

var skinSelectOpen = false;
var skinSelectIndex = 0;
function skinSelectPanel(){ return {x:24,y:H*.14,w:W-48,h:H*.57}; }
function skinSelectCloseButton(){ var p=skinSelectPanel(); return {x:p.x+p.w-36,y:p.y+12,w:24,h:24}; }
function skinSelectBackButton(){ var p=skinSelectPanel(); return {x:p.x+14,y:p.y+12,w:78,h:24}; }
function skinTutorialButton(){ var p=skinSelectPanel(); return {x:p.x+20,y:p.y+p.h-52,w:150,h:26}; }
function skinSelectRows(){
  var p=skinSelectPanel(), list=(typeof skinList==='function'?skinList(selectShipId()):[]), rows=[];
  var start=p.y+96, h=98, gap=10;
  for(var i=0;i<list.length;i++) rows.push({i:i,x:p.x+14,y:start+i*(h+gap),w:p.w-28,h:h,def:list[i]});
  return rows;
}
function openSkinSelect(forPlayer){
  setupReturn = setupReturn || startConfirmOpen;
  if(forPlayer) selectFor=forPlayer;
  startConfirmOpen=false; shipSelectOpen=false; skinSelectOpen=true;
  var ship=selectShipId();
  var list=(typeof skinList==='function'?skinList(ship):[]);
  skinSelectIndex=0;
  for(var i=0;i<list.length;i++) if(list[i].id===selectSkinId()) skinSelectIndex=i;
}
function closeSkinSelect(){
  skinSelectOpen=false;
  if(setupReturn) finishSetupSelection();
}
function skinSelectChoose(i){
  var ship=selectShipId();
  var list=(typeof skinList==='function'?skinList(ship):[]);
  if(i<0||i>=list.length) return false;
  if(selectFor==='p2'){
    if(typeof coopEnabled!=='undefined'&&coopEnabled&&selectedShip===ship&&selectedSkins[selectedShip]===list[i].id){pickupMsg='P1 IS USING THIS VARIANT';pickupT=1.6;return false;}
    coopSkin2=list[i].id;
  } else {
    if(typeof coopEnabled!=='undefined'&&coopEnabled&&ship===coopShip2&&list[i].id===coopSkin2){pickupMsg='P2 IS USING THIS VARIANT';pickupT=1.6;return false;}
    setSelectedSkin(ship,list[i].id);
    if(typeof coopEnsureDistinct==='function') coopEnsureDistinct();
  }
  finishSetupSelection();
  return true;
}
function skinSelectAt(p){
  var bb=skinSelectBackButton();
  if(p.x>=bb.x&&p.x<=bb.x+bb.w&&p.y>=bb.y&&p.y<=bb.y+bb.h) return 'back';
  var tb=skinTutorialButton();
  if(p.x>=tb.x&&p.x<=tb.x+tb.w&&p.y>=tb.y&&p.y<=tb.y+tb.h) return 'tutorial';
  var cb=skinSelectCloseButton();
  if(p.x>=cb.x&&p.x<=cb.x+cb.w&&p.y>=cb.y&&p.y<=cb.y+cb.h) return 'close';
  var rows=skinSelectRows();
  for(var i=0;i<rows.length;i++){var r=rows[i];if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)return i;}
  var panel=skinSelectPanel();
  if(p.x<panel.x||p.x>panel.x+panel.w||p.y<panel.y||p.y>panel.y+panel.h) return 'outside';
  return 'panel';
}
function drawSkinSelectOverlay(){
  if(!skinSelectOpen) return;
  ctx.save();
  ctx.fillStyle='rgba(1,4,10,0.78)';ctx.fillRect(0,0,W,H);
  var p=skinSelectPanel();
  ctx.fillStyle='rgba(5,15,26,0.97)';ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1.5;ctx.strokeRect(p.x,p.y,p.w,p.h);
  ctx.textAlign='left';
  ctx.fillStyle='#eaf8ff';ctx.font='900 18px "Arial Black", Arial, sans-serif';
  ctx.fillText(selectFor==='p2'?'SELECT P2 VARIANT':'SELECT VARIANT',p.x+104,p.y+36);
  ctx.fillStyle='#7f9bb0';ctx.font='9px monospace';
  ctx.fillText((SHIP_DEFS[selectShipId()]?SHIP_DEFS[selectShipId()].label:selectShipId().toUpperCase())+' · CHOOSE LOADOUT',p.x+104,p.y+54);
  var bb=skinSelectBackButton();
  ctx.fillStyle='rgba(8,24,38,0.9)';ctx.fillRect(bb.x,bb.y,bb.w,bb.h);
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(bb.x,bb.y,bb.w,bb.h);
  ctx.fillStyle='#b8d9e8';ctx.font='700 9px monospace';ctx.textAlign='center';ctx.fillText('‹ SHIPS',bb.x+bb.w/2,bb.y+16);
  var cb=skinSelectCloseButton();
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle='#9fb6cf';ctx.font='700 14px Arial, sans-serif';ctx.textAlign='center';ctx.fillText('×',cb.x+cb.w/2,cb.y+17);
  var rows=skinSelectRows();
  for(var i=0;i<rows.length;i++){
    var r=rows[i],d=r.def,cur=selectSkinId()===d.id,sel=skinSelectIndex===i;
    ctx.fillStyle='rgba(7,22,36,0.86)';ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle=cur?'#ffd36b':(sel?'#9fe8ff':'#31536a');ctx.lineWidth=cur?2.4:1.2;ctx.strokeRect(r.x,r.y,r.w,r.h);
    ctx.globalAlpha=1;
    drawShipPreview(d.image,r.x+50,r.y+r.h/2,64,'#9fe8ff');
    ctx.textAlign='left';ctx.fillStyle='#eaf8ff';ctx.font='900 14px "Arial Black", Arial, sans-serif';
    ctx.fillText(d.label,r.x+92,r.y+32);
    ctx.fillStyle='#9fc8dc';ctx.font='7px monospace';
    ctx.fillText(d.trait||'NO SPECIAL TRAITS',r.x+92,r.y+50);
    ctx.fillStyle=cur?'#ffd36b':'#7893a8';ctx.font='8px monospace';
    ctx.fillText(cur?'EQUIPPED':'TAP TO EQUIP',r.x+92,r.y+66);
    ctx.textAlign='right';ctx.fillStyle='#6d879b';ctx.font='10px monospace';
    ctx.fillText('0'+(i+1),r.x+r.w-14,r.y+38);
  }
  ctx.textAlign='center';ctx.fillStyle='#6d879b';ctx.font='8px monospace';
  var tb=skinTutorialButton();
  ctx.fillStyle='rgba(8,24,38,0.9)';ctx.fillRect(tb.x,tb.y,tb.w,tb.h);
  ctx.strokeStyle='#9fe8ff';ctx.lineWidth=1;ctx.strokeRect(tb.x,tb.y,tb.w,tb.h);
  ctx.fillStyle='#dff5ff';ctx.font='700 9px monospace';ctx.textAlign='center';ctx.fillText('TUTORIAL · '+(SHIP_DEFS[selectShipId()]?SHIP_DEFS[selectShipId()].label:'SHIP'),tb.x+tb.w/2,tb.y+17);
  ctx.textAlign='center';ctx.fillStyle='#6d879b';ctx.font='8px monospace';
  ctx.fillText('↑ ↓ SELECT · ENTER EQUIP · ESC MENU',W/2,p.y+p.h-16);
  ctx.restore();ctx.textAlign='left';
}
function drawShipSelectOverlay(){
  if(!shipSelectOpen) return;
  ctx.save();
  ctx.fillStyle='rgba(1,4,10,0.78)';ctx.fillRect(0,0,W,H);
  var p=shipSelectPanel();
  ctx.fillStyle='rgba(5,15,26,0.97)';ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1.5;ctx.strokeRect(p.x,p.y,p.w,p.h);
  ctx.textAlign='left';
  ctx.fillStyle='#eaf8ff';ctx.font='900 20px "Arial Black", Arial, sans-serif';
  ctx.fillText(selectFor==='p2'?'SELECT P2 SHIP':'SELECT SHIP',p.x+20,p.y+36);
  ctx.fillStyle='#7f9bb0';ctx.font='9px monospace';
  ctx.fillText('CHOOSE YOUR FRAME · THEN ITS VARIANT',p.x+20,p.y+54);
  var cb=shipSelectCloseButton();
  ctx.strokeStyle='#5d8fa8';ctx.lineWidth=1;ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle='#9fb6cf';ctx.font='700 14px Arial, sans-serif';ctx.textAlign='center';ctx.fillText('×',cb.x+cb.w/2,cb.y+17);
  var rows=shipSelectRows();
  for(var i=0;i<rows.length;i++){
    var r=rows[i],d=r.def,disabled=false,sel=shipSelectIndex===i;
    ctx.fillStyle=disabled?'rgba(14,10,24,0.82)':'rgba(7,22,36,0.86)';ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle=disabled?'rgba(120,90,150,0.55)':(sel?'#ffd36b':(selectShipId()===d.id?'#9fe8ff':'#31536a'));
    ctx.lineWidth=sel?2.4:1.2;ctx.strokeRect(r.x,r.y,r.w,r.h);
    var ix=r.x+46,iy=r.y+r.h/2;
    ctx.globalAlpha=disabled?0.82:1;
    drawShipPreview(d.image,ix,iy,54,disabled?'#7a5a93':d.color);
    ctx.globalAlpha=1;
    ctx.textAlign='left';
    ctx.fillStyle=disabled?'#9a8aa8':'#eaf8ff';ctx.font='900 17px "Arial Black", Arial, sans-serif';
    ctx.fillText(d.name,r.x+82,r.y+35);
    ctx.fillStyle=disabled?'#6f5c7e':d.color;ctx.font='9px monospace';
    ctx.fillText(d.role,r.x+82,r.y+53);
    ctx.fillStyle=disabled?'#6f5c7e':'#9fc8dc';ctx.font='7px monospace';
    ctx.fillText(d.trait||'',r.x+82,r.y+70);
    ctx.fillStyle=disabled?'#6f5c7e':'#7fb0c6';ctx.font='6px monospace';
    ctx.fillText(d.stats||'',r.x+82,r.y+84);
    var statusColor=disabled?'#a879c9':'#8dffb0';
    ctx.fillStyle=statusColor;ctx.font='700 9px monospace';ctx.textAlign='right';
    ctx.fillText(d.status,r.x+r.w-14,r.y+35);
    if(!disabled){
      var n=(typeof skinList==='function'?skinList(d.id).length:3);
      ctx.fillStyle='#7893a8';ctx.font='8px monospace';ctx.textAlign='right';
      ctx.fillText(n+' VARIANTS',r.x+r.w-14,r.y+54);
    }
  }
  var tb=shipTutorialButton();
  ctx.fillStyle='rgba(8,24,38,0.9)';ctx.fillRect(tb.x,tb.y,tb.w,tb.h);
  ctx.strokeStyle='#9fe8ff';ctx.lineWidth=1;ctx.strokeRect(tb.x,tb.y,tb.w,tb.h);
  ctx.fillStyle='#dff5ff';ctx.font='700 9px monospace';ctx.textAlign='center';
  ctx.fillText('TUTORIAL · '+(rows[shipSelectIndex]?rows[shipSelectIndex].def.name:'SHIP'),tb.x+tb.w/2,tb.y+17);
  ctx.textAlign='center';ctx.fillStyle='#6d879b';ctx.font='8px monospace';
  ctx.fillText('↑ ↓ SELECT · ENTER CONFIRM · ESC CLOSE',W/2,p.y+p.h-16);
  ctx.restore();ctx.textAlign='left';
}
function menuSkinButton(){return {x:W/2+6,y:H*.395,w:112,h:38};}
function drawMenuBrand(){
  var title=(typeof GIMG!=='undefined'&&GIMG.brand_title)?GIMG.brand_title:null;
  var emblem=(typeof GIMG!=='undefined'&&GIMG.brand_emblem)?GIMG.brand_emblem:null;
  if(title&&title.complete){
    var tw=Math.min(W*0.92,380), th=tw*title.height/title.width;
    ctx.save();
    ctx.globalAlpha=0.98;
    ctx.shadowColor='rgba(90,215,255,0.38)';ctx.shadowBlur=16;
    ctx.drawImage(title,(W-tw)/2,H*0.044,tw,th);
    ctx.restore();
  }
  if(emblem&&emblem.complete){
    var ew=Math.min(W*0.56,225), eh=ew*emblem.height/emblem.width;
    ctx.save();
    ctx.globalAlpha=0.96;
    ctx.shadowColor='rgba(255,210,120,0.22)';ctx.shadowBlur=14;
    ctx.drawImage(emblem,(W-ew)/2,H*0.745,ew,eh);
    ctx.restore();
  }
}

function drawMenu(){
  paintBg(BGMENU,1)||paintBg(BG1,1);
  ctx.fillStyle='rgba(2,4,12,0.06)';ctx.fillRect(0,0,W,H);
  var menuInfoBottom=true;
  try { if(/menuinfo=top|#top/.test((location.search||'')+' '+(location.hash||''))) menuInfoBottom=false; } catch(e) {}
  // top title shade
  var topShade=ctx.createLinearGradient(0,0,0,H*.16);
  topShade.addColorStop(0,'rgba(1,3,9,0.78)');topShade.addColorStop(1,'rgba(1,3,9,0)');
  ctx.fillStyle=topShade;ctx.fillRect(0,0,W,H*.16);
  // bottom logo shade
  var lowShade=ctx.createLinearGradient(0,H*.63,0,H);
  lowShade.addColorStop(0,'rgba(1,3,9,0)');lowShade.addColorStop(0.65,'rgba(1,3,9,0.30)');lowShade.addColorStop(1,'rgba(1,3,9,0.82)');
  ctx.fillStyle=lowShade;ctx.fillRect(0,H*.63,W,H*.37);
  // central UI support
  var midShade=ctx.createLinearGradient(0,H*.34,0,H*.62);
  midShade.addColorStop(0,'rgba(2,4,12,0)');midShade.addColorStop(.42,'rgba(2,4,12,0.46)');midShade.addColorStop(1,'rgba(2,4,12,0)');
  ctx.fillStyle=midShade;ctx.fillRect(0,H*.34,W,H*.28);
  drawMenuBrand();
  ctx.textAlign='center';
  ctx.fillStyle='#b8e8ff';ctx.font='900 10px "Arial Black", Arial, sans-serif';ctx.shadowColor='rgba(60,160,230,0.7)';ctx.shadowBlur=6;
  ctx.fillText('SELECT MODE',W/2,H*.455);
  ctx.shadowBlur=0;
  var modes=menuModeButtons();
  for(var mi=0;mi<modes.length;mi++){
    var mb=modes[mi], mc=mb.id==='coop'?'#8dffb0':(mb.id==='lan'?'#ffd36b':'#9fe8ff');
    ctx.fillStyle=mi===menuModeIndex?'rgba(24,48,58,0.94)':'rgba(6,18,30,0.86)';
    ctx.fillRect(mb.x,mb.y,mb.w,mb.h);
    ctx.strokeStyle=mc;ctx.lineWidth=mi===menuModeIndex?2:1.2;ctx.strokeRect(mb.x,mb.y,mb.w,mb.h);
    ctx.fillStyle=mc;ctx.font='900 10px "Arial Black", Arial, sans-serif';ctx.textAlign='center';
    ctx.fillText(mb.label,mb.x+mb.w/2,mb.y+18);
    ctx.fillStyle='#9fb6cf';ctx.font='7px monospace';
    ctx.fillText(mb.sub,mb.x+mb.w/2,mb.y+32);
  }
  ctx.textAlign='center';ctx.fillStyle='#8fb8ca';ctx.font='9px monospace';
  try {
    var best=typeof aegisBestScore==='function'?aegisBestScore():(SaveStore&&SaveStore.data?SaveStore.data.campaign.bestScore:0);
    ctx.fillText('BEST  '+String(best).padStart(7,'0'),W/2,H*.635);
  } catch(e) {}
  var infoY1=menuInfoBottom?H*.944:H*.031, infoY2=menuInfoBottom?H*.962:H*.049;
  ctx.font='700 9px monospace';ctx.fillStyle='#d8efff';ctx.shadowColor='rgba(70,190,255,0.8)';ctx.shadowBlur=5;
  ctx.fillText('5 STAGES  ·  5 BOSSES',W/2,infoY1);
  ctx.font='7px monospace';ctx.fillStyle='#9fc3d8';ctx.shadowBlur=3;
  ctx.fillText('DRAG · SHIP FOLLOWS ABOVE FINGER · AUTO-FIRE',W/2,infoY2);
  ctx.shadowBlur=0;
  if(!menuInfoBottom){
    ctx.fillStyle='#7f93a8';ctx.font='9px monospace';
    ctx.fillText('PATTERNS © KENTA CHO · BSD-3   |   ART: USER',W/2,H*0.965);
    ctx.fillText('SFX: KENNEY SCI-FI SOUNDS (CC0)',W/2,H*0.985);
  }
  ctx.textAlign='left';
  drawShipSelectOverlay();
  drawSkinSelectOverlay();
  drawStartConfirmOverlay();
  drawTutorialOverlay();
}
function drawBossOmen(){
  var t=bossOmenT;
  var a1=Math.max(0,Math.min(1,(t-.25)/.70))*Math.max(0,Math.min(1,(2.55-t)/.55));
  var a2=Math.max(0,Math.min(1,(t-2.90)/.75))*Math.max(0,Math.min(1,(6.25-t)/.55));
  var line1='YOU THINK YOU HAVE WON...';
  var line2='BUT THAT WAS ONLY AN ECHO OF ONE TIMELINE.';
  var fs=24, spacing=1.0, wid=0;
  function trackedWidth(txt){ctx.font='600 '+fs+'px Rajdhani, Arial, sans-serif';var w=0;for(var i=0;i<txt.length;i++)w+=ctx.measureText(txt[i]).width+spacing;return w;}
  while(fs>9){wid=trackedWidth(line2);if(wid<=W-32)break;fs-=.5;}
  function drawTracked(txt,y,alpha){
    if(alpha<=0)return;
    ctx.font='600 '+fs+'px Rajdhani, Arial, sans-serif';ctx.textAlign='left';
    var w=trackedWidth(txt),x=W/2-w/2;
    ctx.fillStyle='rgba(245,245,255,'+alpha+')';
    ctx.shadowColor='rgba(185,220,255,.55)';ctx.shadowBlur=10;
    for(var i=0;i<txt.length;i++){var ch=txt[i];ctx.fillText(ch,x,y);x+=ctx.measureText(ch).width+spacing;}
  }
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(W/2,H*.42,0,W/2,H*.42,H*.30);
  g.addColorStop(0,'rgba(255,245,225,'+(0.055*Math.max(a1,a2))+')');
  g.addColorStop(.55,'rgba(130,170,255,'+(0.030*Math.max(a1,a2))+')');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(W/2,H*.42,H*.30,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='source-over';
  drawTracked(line1,H*.435,a1);
  drawTracked(line2,H*.435,a2);
  ctx.shadowBlur=0;ctx.restore();ctx.globalAlpha=1;ctx.textAlign='left';
}

function drawEntityArrivalScene(){
  var t=fusionT,q=Math.max(0,Math.min(1,t/3.3));
  var ease=1-Math.pow(1-q,3),cx=W/2,cy=H*.44;
  var size=34+356*ease;
  var frames=[GIMG.hrA||GIMG.np1];
  var clock=t*0.85,fi=0,frac=0;
  ctx.save();
  // distant resonance ring
  ctx.globalCompositeOperation='lighter';
  for(var r=0;r<6;r++){
    var rr=size*(.55+r*.09)+Math.sin(time*1.3+r)*4;
    ctx.globalAlpha=.10*(1-r/7)*ease;
    ctx.strokeStyle=r%2?'#c9e9ff':'#ffe7a0';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,rr,time*.12+r,time*.12+r+TAU*.78);ctx.stroke();
  }
  // the uploaded loop is the single Hedron appearance; no second layer
  ctx.globalCompositeOperation='screen';
  var entranceVid=(hedronLoopVideo&&hedronLoopVideo.readyState>=2&&hedronLoopVideo.videoWidth>0);
  if(entranceVid){
    ctx.save();ctx.globalAlpha=ease;// direct loop, no extra rotation
    ctx.drawImage(hedronLoopVideo,cx-size/2,cy-size/2,size,size);ctx.restore();
  }else{
    for(var i=0;i<1;i++){
      var im=frames[i];if(!im||!im.complete) continue;
      var w=1;
      ctx.save();ctx.globalAlpha=ease*(.55+w*.45);
      ctx.translate(cx,cy);ctx.rotate(time*(.12+i*.035));ctx.scale(1+i*.025,1+i*.025);
      ctx.drawImage(im,-size/2,-size/2,size,size);ctx.restore();
    }
  }
  if(!entranceVid&&GIMG.hrB&&GIMG.hrB.complete){
    for(var z=0;z<2;z++){
      var zq=((t*.5+z*.5)%1);
      var zs=size*(.12+.64*zq);
      ctx.globalAlpha=ease*.38*(1-zq*.5);ctx.globalCompositeOperation='screen';
      ctx.save();ctx.translate(cx,cy);ctx.rotate((z%2?-1:1)*t*.25);ctx.drawImage(GIMG.hrB,-zs/2,-zs/2,zs,zs);ctx.restore();
    }
  }
  // radial sparks while approaching
  for(var j=0;j<24;j++){
    var a=j/24*TAU+time*.08,rad=size*.52+Math.sin(time*2+j)*6;
    ctx.globalAlpha=.30*ease;
    ctx.fillStyle=j%2?'#fff4cf':'#c9e9ff';
    ctx.beginPath();ctx.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.74,1.4,0,TAU);ctx.fill();
  }
  ctx.restore();ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.font='900 18px "Arial Black", Arial, sans-serif';ctx.fillStyle='#ffe6a0';
  ctx.globalAlpha=.85;
  ctx.fillText(q<.82?'RESONANCE':'CHRONOS ECHO',W/2,H*.16);
  ctx.globalAlpha=.55;ctx.fillStyle='#9fe8ff';ctx.font='9px monospace';ctx.fillText("TIME'S END",W/2,H*.19);
  ctx.globalAlpha=1;ctx.textAlign='left';
  if(q>.94){ctx.fillStyle='rgba(255,255,245,'+((q-.94)/.06*.22)+')';ctx.fillRect(0,0,W,H);}
}
function drawFusionHotCore(t,cx,cy){
  var a=1-Math.max(0,Math.min(1,(t-8.9)/1.0));
  if(a<=0) return;
  var R=64+5*Math.sin(time*2.2);
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0,'rgba(255,255,255,'+(0.96*a)+')');
  g.addColorStop(.50,'rgba(255,255,250,'+(0.92*a)+')');
  g.addColorStop(.68,'rgba(255,246,220,'+(0.78*a)+')');
  g.addColorStop(.83,'rgba(220,235,255,'+(0.30*a)+')');
  g.addColorStop(1,'rgba(220,240,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*a;
  var fg=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.55);
  fg.addColorStop(0,'rgba(255,255,255,1)');fg.addColorStop(.35,'rgba(255,240,190,.65)');fg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fg;ctx.beginPath();ctx.arc(cx,cy,R*.55,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
}
function drawFusionScene(tArg){
  var t=(typeof tArg==='number')?tArg:fusionT,cx=W/2,cy=H*.44;
  var imgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
  var rimgs=[GIMG.r1,GIMG.r2,GIMG.r3,GIMG.r4];
  var names=['VOID SOVEREIGN','ABYSS DEVOURER','STAR BEHEMOTH','SERAPHIC WINGS'];
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  function cl(v){return Math.max(0,Math.min(1,v));}
  ctx.save();
  // the defeated phase-1 Hedron remains at the center, translucent, and overlaps the incoming bosses
  var hed=GIMG.np1;
  if(hed&&hed.complete){
    var hAlpha=.62*(1-cl((t-8.9)/1.1))+.10;
    var hSize=290+10*Math.sin(time*1.1);
    ctx.save();ctx.globalAlpha=hAlpha;ctx.translate(cx,cy);ctx.rotate(time*.10);
    ctx.drawImage(hed,-hSize/2,-hSize/2,hSize,hSize);ctx.restore();
    ctx.save();ctx.globalCompositeOperation='lighter';
    var hcols=['#7fe6ff','#ff86cf','#ffd36b'];
    for(var hk=0;hk<3;hk++){
      var ha=time*(.18+hk*.04)+hk*2.1;
      ctx.globalAlpha=.38*(1-cl((t-9.1)/1.0));ctx.strokeStyle=hcols[hk];ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,132+hk*7,ha,ha+1.05);ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  // the four bosses enter one by one, dragging afterimages toward the distortion core
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var startT=.15+i*2.35,span=2.35;
    var p=(t-startT)/span,q=cl(p);
    if(p<-.05) continue;
    var dir=1,ringDir=(i%2===0)?1:-1;
    var qe=q*q*(3-2*q);
    var startAng=-3*Math.PI/4+i*Math.PI/2, spin=-2.2*TAU;
    function spiralPos(qq){
      var aa=startAng+qq*spin, rr=Math.max(W,H)*.92*(1-qq)+18;
      return {x:cx+Math.cos(aa)*rr,y:cy+Math.sin(aa)*rr*.72};
    }
    var bp0=spiralPos(qe),x=bp0.x,y=bp0.y;
    var sz=196*(1-.22*qe);
    var fade=cl((0.95-q)/.30);
    if(p<1.15){
      ctx.save();ctx.globalAlpha=fade*.95;ctx.translate(x,y);ctx.rotate(-dir*(.1+qe*.35));ctx.drawImage(im,-sz/2,-sz/2,sz,sz);ctx.restore();ctx.globalAlpha=1;
      if(q<.7){ctx.save();ctx.globalAlpha=fade*.6;ctx.textAlign='center';ctx.fillStyle=cols[i];ctx.font='8px monospace';ctx.fillText(names[i],W/2,H*.255);ctx.restore();ctx.globalAlpha=1;}
    }
    // exactly 24 opaque copies per boss, locked to a perfect circular ring
    if(q>.94){
      var ringA=cl((q-.94)/.06);
      var baseR=152-i*20;
      for(var k2=0;k2<24;k2++){
        var a=k2*TAU/24+i*.35+time*.055*ringDir;
        var px=cx+Math.cos(a)*baseR, py=cy+Math.sin(a)*baseR;
        var ss=80-i*12;
        ctx.save();ctx.globalAlpha=ringA;
        ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.08*ringDir);if((k2+i)%2)ctx.scale(-1,1);
        ctx.drawImage(rimgs[i],-ss/2,-ss/2,ss,ss);ctx.restore();
      }
    }
    // 10 extra copies along the spiral from ring edge to the core; the innermost dissolves into Hedron
    if(q>.30){
      for(var tj=1;tj<=10;tj++){
        var tq=cl(qe-(tj/10)*.24);
        var tpos=spiralPos(tq);
        var ta=.90;
        var tss=60-tj*.8;
        ctx.save();ctx.globalAlpha=ta;
        ctx.translate(tpos.x,tpos.y);ctx.rotate(tq*2.2*dir+i*.4);
        ctx.drawImage(rimgs[i],-tss/2,-tss/2,tss,tss);ctx.restore();
      }
    }
  }
  // keep a translucent front layer of the Hedron so it visibly overlaps the boss copies
  if(hed&&hed.complete&&t<10.0){
    var hf=.20*(1-cl((t-9.0)/1.0));
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=hf;ctx.translate(cx,cy);ctx.rotate(-time*.06);
    ctx.drawImage(hed,-155,-155,310,310);ctx.restore();ctx.globalAlpha=1;
  }
  // AI distortion entity growing at the eye, then absorbing the four rings
  function fuDraw(img,alpha,size,rot){
    if(!img||!img.complete||alpha<=0) return;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(cx,cy);ctx.rotate(rot);ctx.globalAlpha=Math.min(1,alpha);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
  }
  var a1=cl((t-.7)/1.1)*(1-cl((t-6.8)/1.2));
  var a2=cl((t-6.4)/1.1)*(1-cl((t-9.1)/1.1));
  var a3=cl((t-8.6)/1.0)*(1-cl((t-10.95)/1.1));
  fuDraw(GIMG.fu1,a1*.36,190+20*Math.sin(time*1.2),time*.08);
  fuDraw(GIMG.fu2,a2*.46,235+18*Math.sin(time*1.5),-time*.09);
  fuDraw(GIMG.fu3,a3*.54,265+16*Math.sin(time*1.7),time*.07);
  // final composite
  var bp=cl((t-9.15)/1.0),bimg=GIMG.b5_2;
  if(bimg&&bimg.complete&&bp>0){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(cx,cy);ctx.rotate(time*.20);ctx.scale(.55+bp*.45,.55+bp*.45);
    ctx.globalAlpha=bp;ctx.drawImage(bimg,-170,-170,340,340);ctx.restore();ctx.globalAlpha=1;
  }
  if(t>9.25&&t<10.1){var fa=1-Math.abs((t-9.65)/.45);ctx.fillStyle='rgba(255,255,245,'+(0.28*fa)+')';ctx.fillRect(0,0,W,H);}
  drawFusionHotCore(t,cx,cy);
  ctx.textAlign='center';ctx.font='900 17px "Arial Black", Arial, sans-serif';ctx.fillStyle='#ffe6a0';
  ctx.globalAlpha=.85+0.15*Math.sin(time*8);
  var label=t<4.8?'FOUR ECHOES':(t<7.1?'CONVERGENCE':(t<9.2?'SINGULARITY':'CHRONOS ECHO'));
  ctx.fillText(label,W/2,H*.18);
  ctx.globalAlpha=.55;ctx.fillStyle='#9fe8ff';ctx.font='9px monospace';ctx.fillText("TIME'S END",W/2,H*.21);
  ctx.globalAlpha=1;ctx.textAlign='left';ctx.restore();
}

function drawFinaleScene(){
  var t=finaleT,cx=W/2,cy=H*.44;
  function cl(v){return Math.max(0,Math.min(1,v));}
  ctx.save();
  ctx.fillStyle='rgba(2,3,9,'+(0.15+cl(t/2)*0.10)+')';ctx.fillRect(0,0,W,H);
  // whiteout flash
  if(t<.55){ctx.fillStyle='rgba(255,255,250,'+(0.85*(1-t/.55))+')';ctx.fillRect(0,0,W,H);}
  ctx.globalCompositeOperation='lighter';
  var core=45+t*230, g=ctx.createRadialGradient(cx,cy,0,cx,cy,core);
  g.addColorStop(0,'rgba(255,255,255,'+(0.95*(1-cl((t-2.8)/2)))+')');
  g.addColorStop(.18,'rgba(255,238,190,0.55)');
  g.addColorStop(.5,'rgba(255,100,170,0.24)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,core,0,TAU);ctx.fill();
  // expanding shockwave rings
  for(var sw=0;sw<4;sw++){
    var srr=40+t*(210+sw*55);
    ctx.globalAlpha=(0.34-sw*.055)*(1-cl((t-3.6)/1.0));
    ctx.strokeStyle=['#ffffff','#ffe7a0','#ff86cf','#7fe6ff'][sw];ctx.lineWidth=3-sw*.5;
    ctx.beginPath();ctx.arc(cx,cy,srr,0,TAU);ctx.stroke();
  }
  // radial beams
  for(var rb=0;rb<14;rb++){
    var ra=rb/14*TAU+t*.22;
    var rg=ctx.createLinearGradient(cx,cy,cx+Math.cos(ra)*W*.9,cy+Math.sin(ra)*W*.9);
    rg.addColorStop(0,'rgba(255,250,235,0.30)');
    rg.addColorStop(.35,'rgba(255,190,120,0.10)');
    rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=.55*(1-cl((t-3.2)/1.2));ctx.strokeStyle=rg;ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ra)*W*.9,cy+Math.sin(ra)*W*.9);ctx.stroke();
  }
  // fractal wireframe burst
  var cols=['#ffe7a0','#ff86cf','#7fe6ff','#b6a2ff'];
  function tri(x1,y1,x2,y2,x3,y3,d,col,alpha){
    if(d<=0){ctx.strokeStyle=col+alpha+')';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();ctx.stroke();return;}
    var ax=(x1+x2)/2,ay=(y1+y2)/2,bx=(x2+x3)/2,by=(y2+y3)/2,cx2=(x3+x1)/2,cy2=(y3+y1)/2;
    tri(x1,y1,ax,ay,cx2,cy2,d-1,col,alpha);tri(ax,ay,x2,y2,bx,by,d-1,col,alpha);tri(cx2,cy2,bx,by,x3,y3,d-1,col,alpha);
  }
  for(var lay=0;lay<3;lay++){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(t*(.12+lay*.06)+lay*2.1);
    var R=90+t*215+lay*34;
    tri(0,-R,-R*.866,R*.5,R*.866,R*.5,4,cols[lay],(0.55-cl(t/6)*.20));
    ctx.restore();
  }
  // radial shards
  for(var i=0;i<150;i++){
    var a=i*2.399+t*(.35+(i%5)*.04);
    var dist=t*(68+(i%13)*32);
    var sz=(5+(i%7)*4.6)*(1-cl(t/4.5)*.45);
    if(dist>H*1.1) continue;
    ctx.save();ctx.translate(cx+Math.cos(a)*dist,cy+Math.sin(a)*dist*.75);ctx.rotate(a+t*.5);
    ctx.globalAlpha=.62*(1-cl(t/4.5));ctx.fillStyle=cols[i%4];
    ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz*.8,sz*.6);ctx.lineTo(-sz*.7,sz*.55);ctx.closePath();ctx.fill();ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
  // fade to black, then closing line
  var dark=cl((t-3.1)/1.15)*0.86;
  if(dark>0){ctx.fillStyle='rgba(1,2,7,'+dark+')';ctx.fillRect(0,0,W,H);}
  var a=cl((t-4.0)/.7)*cl((7.4-t)/.7);
  if(a>0){
    ctx.save();ctx.textAlign='center';ctx.shadowColor='rgba(200,220,255,.65)';ctx.shadowBlur=12;
    ctx.fillStyle='rgba(245,245,255,'+a+')';ctx.font='600 19px Orbitron, Arial, sans-serif';
    ctx.fillText('TIME IS SAVED...',W/2,H*.325);
    ctx.fillStyle='rgba(255,225,175,'+a+')';ctx.font='600 16px Rajdhani, Arial, sans-serif';
    ctx.fillText('FOR NOW...',W/2,H*.395);
    ctx.shadowBlur=0;ctx.restore();
  }
}
var CAST_LINES=[
 ['CAST',''],
 ['VOID SOVEREIGN','red echo'],
 ['ABYSS DEVOURER','violet echo'],
 ['STAR BEHEMOTH','orange echo'],
 ['SERAPHIC WINGS','gold echo'],
 ['CHRONOS ECHO','the composite'],
 ['',''],
 ['CREATED BY','思齐Styx'],
 ['GAME DESIGN / CODE','思齐Styx  ·  DeepSeek'],
 ['ART & BACKGROUNDS','思齐Styx'],
 ['AI IMAGE GENERATION','QWEN IMAGE  ·  GPT IMAGE'],
 ['ALGORITHMIC VISUALS','思齐Styx'],
 ['PATTERNS','KENTA CHO  ·  BSD-3'],
 ['MUSIC / COMPOSED BY','思齐Styx'],
 ['TRACKS','奇点 / KALEIDOSCOPE / 引力弹弓 / 维度破碎 / 暗物质 / 虚实之间'],
 ['SFX','KENNEY SCI-FI SOUNDS'],
 ['MISSILE SFX','MIKE KOENIG · CC BY 3.0'],
 ['IMPACT SFX','GRANT EVANS · SAMPLING PLUS'],
 ['EXPLOSION SFX','MIKE KOENIG · MARK DIANGELO'],
 ['AEGIS SFX','MIKE KOENIG · UNFA'],
 ['ENEMY ECHOES',''],
 ['SMALL FIGHTER · MEDIUM FIGHTER','scout wing'],
 ['SCOUT · BOMBER','raider wing'],
 ['MECH · INTERCEPTOR','aegis warden'],
 ['RAIL LANCER · MINE SEEDER','fractal shard'],
 ['KALEIDO PRISM · ECHO WARDEN','void echoes'],
 ['SPECIAL THANKS','EVERY PILOT WHO REACHED THE END'],
 ['','']
];
var CAST_LINE_H=84,CAST_TOTAL=CAST_LINES.length*CAST_LINE_H+H*0.9+100;
function wrapCastText(text,maxW,font){
  ctx.font=font;
  var out=[],line='';
  for(var i=0;i<text.length;i++){
    var ch=text.charAt(i),test=line+ch;
    if(line&&ctx.measureText(test).width>maxW){out.push(line);line=ch;}
    else line=test;
  }
  if(line)out.push(line);
  return out;
}
function drawCast(){
  ctx.textAlign='center';
  var headA=Math.max(0,1-castT/3.2);
  if(headA>0){
    ctx.globalAlpha=.9*headA;ctx.fillStyle='#eaf7ff';ctx.font='600 23px Orbitron, Arial, sans-serif';ctx.fillText('TIME RECLAIMED',W/2,H*0.13);
    ctx.globalAlpha=.65*headA;ctx.fillStyle='#9fe8ff';ctx.font='12px monospace';ctx.fillText('FINAL CHAPTER  ·  TIME\'S END',W/2,H*0.18);
  }
  ctx.globalAlpha=1;
  var castDone=castScroll>=CAST_TOTAL;
  if(!castDone){
    var startY=H*0.90-castScroll;
    for(var i=0;i<CAST_LINES.length;i++){
      var y=startY+i*CAST_LINE_H;if(y<-80||y>H+80) continue;
      var isTitle=i===0;
      var titleFont=(isTitle?'600 32px':'600 20px')+' Orbitron, Arial, sans-serif';
      ctx.fillStyle=isTitle?'#ffffff':'#eaf4ff';ctx.font=titleFont;
      var tlines=wrapCastText(CAST_LINES[i][0],W-48,titleFont);
      for(var tl=0;tl<tlines.length;tl++)ctx.fillText(tlines[tl],W/2,y+tl*20);
      if(CAST_LINES[i][1]){
        var subFont='20px Rajdhani, Arial, sans-serif';ctx.fillStyle=isTitle?'#9fe8ff':'#8fb8ca';ctx.font=subFont;
        var slines=wrapCastText(CAST_LINES[i][1],W-48,subFont);
        for(var sl=0;sl<slines.length;sl++)ctx.fillText(slines[sl],W/2,y+26+tl*21+sl*19);
      }
    }
  }
  if(castDone){
    var fa=Math.min(1,castHoldT/1.4);
    ctx.fillStyle='rgba(2,4,14,'+(0.62*fa)+')';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=fa;
    ctx.fillStyle='#ffffff';ctx.shadowColor='rgba(160,225,255,0.9)';ctx.shadowBlur=22;
    ctx.font='600 38px Orbitron, Arial, sans-serif';ctx.fillText('THANK YOU',W/2,H*0.39);
    ctx.font='600 38px Orbitron, Arial, sans-serif';ctx.fillText('FOR PLAYING',W/2,H*0.46);
    ctx.shadowBlur=0;ctx.fillStyle='#f2fbff';ctx.font='600 22px Orbitron, Arial, sans-serif';
    ctx.fillText('思齐Styx',W/2,H*0.55);
    ctx.fillStyle='#8fb8ca';ctx.font='14px monospace';ctx.fillText('with DeepSeek',W/2,H*0.60);
    ctx.fillStyle='#7f93a8';ctx.font='11px monospace';ctx.fillText('THE END',W/2,H*0.67);
    ctx.globalAlpha=1;
    if(castHoldT>3){ctx.globalAlpha=0.45+0.2*Math.sin(time*2.2);ctx.fillStyle='#9fe8ff';ctx.font='10px monospace';ctx.fillText('TAP TO RETURN',W/2,H-30);ctx.globalAlpha=1;}
  }
  ctx.textAlign='left';
}

function drawEnd(){
  if(state!=='win'&&state!=='over') return;
  ctx.fillStyle='rgba(2,4,10,0.68)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.fillStyle=state==='win'?'#9fe8ff':'#ff8a66';ctx.font='28px monospace';
  ctx.fillText(state==='win'?(stage===4?'TIME RECLAIMED':'MISSION COMPLETE'):'GAME OVER',W/2,H/2-20);
  ctx.fillStyle='#e8f2ff';ctx.font='16px monospace';ctx.fillText('SCORE '+score,W/2,H/2+18);
  ctx.fillStyle='#9db3c8';ctx.font='11px monospace';ctx.fillText('TAP TO RETRY',W/2,H/2+52);
  ctx.textAlign='left';
}
function resetCanvasState(){
  try{
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.setLineDash([]);
  }catch(e){}
}
function hardResetCanvas(){
  try{ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.setLineDash([]);}catch(e){}
}

