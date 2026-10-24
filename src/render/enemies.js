// Stage-5 echo and regular enemy rendering.
function drawStage5Echo(e){
  var key='n'+(e.type+1),img=GIMG[key];
  var art=GIMG[S5_ENEMY_KEYS[Math.max(0,Math.min(5,e.type-9))]];
  if(art&&art.complete&&art.naturalWidth) img=art;
  var w=enemyW(e);
  if(img&&img.complete){
    var cw=w*1.18,h=cw*img.height/img.width;
    ctx.save();ctx.globalCompositeOperation='source-over';if('filter'in ctx)ctx.filter=e.mini?'hue-rotate(155deg) saturate(1.42) brightness(1.05)':'brightness(1.22) saturate(1.12)';
    ctx.drawImage(img,e.x-cw/2,e.y-h/2,cw,h);ctx.filter='none';ctx.restore();
    if(e.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;ctx.drawImage(img,e.x-cw/2,e.y-h/2,cw,h);ctx.restore();}
  }
  if(e.mini||e.elite||e.max>18&&e.hp<e.max){
    var bw=e.mini?w*1.15:w*.8,bh=e.mini?6:3,bx=e.x-bw/2,by=e.mini?e.y-w*.72:e.y-w*.62;
    ctx.fillStyle='rgba(8,14,24,0.75)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=(e.hp/e.max>0.5)?'#8dff9e':'#ffb36b';ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.max),bh);
    if(e.mini){ctx.fillStyle='#ffd27a';ctx.font='8px monospace';ctx.textAlign='center';var mn=(typeof MINI_NAMES!=='undefined'&&MINI_NAMES[e.type])||'ECHO';ctx.fillText('MINI · '+mn,e.x,by-4);if(e.miniSkillName&&e.miniSkillT>0){ctx.globalAlpha=.55+.35*Math.min(1,e.miniSkillT);ctx.fillStyle='#9fe8ff';ctx.font='7px monospace';ctx.fillText(e.miniSkillName,e.x,by-14);ctx.globalAlpha=1;}ctx.textAlign='left';}
  }
}

function drawEnemy(e){
  if(e.type>=9){drawStage5Echo(e);return;}
  var et=ET[e.type],key='n'+(e.type+1)+(e.elite?'b':''),img=GIMG[key]||GIMG['n'+(e.type+1)];
  if(!img||!img.complete) return;
  var w=enemyW(e),h=w*img.height/img.width;
  ctx.drawImage(img,e.x-w/2,e.y-h/2,w,h);
  if(e.flash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.65;
    ctx.drawImage(img,e.x-w/2,e.y-h/2,w,h);
    ctx.restore();
  }
  if(e.transport||e.elite||(e.max>18&&e.hp<e.max)){
    var bw=w*0.8,bh=e.elite?4:3,bx=e.x-bw/2,by=e.y-h/2-7;
    ctx.fillStyle='rgba(8,14,24,0.75)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=(e.hp/e.max>0.5)?'#8dff9e':'#ffb36b';
    ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.max),bh);
  }
  if(e.transport){ctx.fillStyle='#ffd27a';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('SUPPLY',e.x,e.y-h/2-11);ctx.textAlign='left';}
}

