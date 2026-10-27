// R5 stage mechanics: one readable hazard per campaign stage (1-4).
var stageMech={stage:-1,t:0,phase:'idle',warnT:0,activeT:0,next:8,data:null,msg:'',msgT:0,wind:0};
var STAGE_MECH_NAMES=['ION STORM','RAIL CANNON','DUST FRONT','LIGHT GATE'];
function stageMechReset(i){
  stageMech.stage=i;stageMech.t=0;stageMech.phase='idle';stageMech.warnT=0;stageMech.activeT=0;
  stageMech.data=null;stageMech.msg='';stageMech.msgT=0;stageMech.wind=0;
  stageMech.next=i===0?7:(i===1?9:(i===2?8:8));
}
function stageMechWarning(){
  if(state!=='play') return;
  var i=stageMech.stage;
  if(i<0||i>3) return;
  stageMech.phase='warn';
  stageMech.warnT=i===2?1.35:1.55;
  stageMech.msg=STAGE_MECH_NAMES[i];stageMech.msgT=1.8;
  try{sfx('siren',0.30);}catch(e){}
  if(i===0){
    var lanes=[38,126,214,302,350];
    var pick=[];for(var k=0;k<5;k++)pick.push(k);
    // 3 lanes, always at least two usable gaps
    pick.sort(function(){return vrng()-.5;});
    stageMech.data={kind:'lanes',xs:[lanes[pick[0]],lanes[pick[1]],lanes[pick[2]]],w:52};
  }else if(i===1){
    stageMech.data={kind:'rail',y:240+rng()*(H-390),h:10};
  }else if(i===2){
    stageMech.data={kind:'wind',dir:vrng()<.5?-1:1,power:80};
  }else{
    stageMech.data={kind:'gate',gap:86,side:vrng()<.5?-1:1};
  }
}
function stageMechActivate(){
  stageMech.phase='active';
  stageMech.activeT=stageMech.stage===2?3.2:(stageMech.stage===1?0.55:0.68);
  try{sfx('laser_fire',0.35);}catch(e){}
  if(stageMech.stage===2&&stageMech.data) stageMech.wind=stageMech.data.power*stageMech.data.dir;
}
function stageMechHitP1(){
  if(player.invuln>0) return;
  if(typeof hitPlayer==='function') hitPlayer();
}
function stageMechHitP2(){
  if(typeof coopEnabled==='undefined'||!coopEnabled) return;
  if(typeof coopHitP2==='function') coopHitP2();
}
function stageMechPlayerHit(x,y,w,h){
  if(player.invuln>0) return false;
  return player.x>x-w/2&&player.x<x+w/2&&player.y>y-h/2&&player.y<y+h/2;
}
function stageMechP2Hit(x,y,w,h){
  if(typeof coopEnabled==='undefined'||!coopEnabled||!player2||player2.invuln>0) return false;
  return player2.x>x-w/2&&player2.x<x+w/2&&player2.y>y-h/2&&player2.y<y+h/2;
}
function updateStageMechanic(dt){
  if(state!=='play') { stageMech.wind=0; return; }
  if(stageMech.stage<0||stageMech.stage>3) return;
  stageMech.t+=dt;
  if(stageMech.msgT>0) stageMech.msgT=Math.max(0,stageMech.msgT-dt);
  if(stageMech.phase==='idle'){
    if(stageMech.t>=stageMech.next){stageMechWarning();}
    return;
  }
  if(stageMech.phase==='warn'){
    stageMech.warnT-=dt;
    if(stageMech.warnT<=0) stageMechActivate();
    return;
  }
  if(stageMech.phase==='active'){
    stageMech.activeT-=dt;
    var d=stageMech.data;
    if(d&&d.kind==='wind'){
      var wind=d.power*d.dir;
      target.x=Math.max(24,Math.min(W-24,target.x+wind*dt));
      if(typeof target2!=='undefined'&&coopEnabled){target2.x=Math.max(24,Math.min(W-24,target2.x+wind*0.65*dt));}
      if(vrng()<dt*22&&typeof part==='function'){part(vrng()*W,H*.6+vrng()*H*.3,'#ffd9a0',1,120);}
    }else if(d&&d.kind==='lanes'){
      for(var i=0;i<d.xs.length;i++){
        if(stageMechPlayerHit(d.xs[i],H/2,d.w,H)){stageMechHitP1();break;}
        if(stageMechP2Hit(d.xs[i],H/2,d.w,H)){stageMechHitP2();break;}
      }
    }else if(d&&d.kind==='rail'){
      if(stageMechPlayerHit(W/2,d.y,W,32)) stageMechHitP1();
      if(stageMechP2Hit(W/2,d.y,W,32)) stageMechHitP2();
    }else if(d&&d.kind==='gate'){
      var cx=W/2+d.side*d.gap;
      if(stageMechPlayerHit(cx,H/2,46,H)) stageMechHitP1();
      if(stageMechP2Hit(cx,H/2,46,H)) stageMechHitP2();
    }
    if(stageMech.activeT<=0){
      stageMech.phase='idle';stageMech.t=0;stageMech.wind=0;
      stageMech.next=stageMech.stage===0?11:(stageMech.stage===1?12:(stageMech.stage===2?13:10));
    }
  }
}
function drawStageMechanic(){
  if(state!=='play'||stageMech.stage<0||stageMech.stage>3) return;
  var d=stageMech.data;
  if(stageMech.msgT>0){
    var a=Math.min(1,stageMech.msgT*2.2);
    ctx.save();ctx.textAlign='center';ctx.globalAlpha=a;
    ctx.fillStyle=stageMech.stage===2?'#ffd9a0':'#ff8a9a';ctx.font='700 10px monospace';
    ctx.fillText('!  '+stageMech.msg+'  !',W/2,H*.145);
    ctx.restore();ctx.textAlign='left';
  }
  if(!d) return;
  var warn=stageMech.phase==='warn',active=stageMech.phase==='active',flash=.5+.5*Math.sin(time*28);
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(d.kind==='lanes'){
    for(var i=0;i<d.xs.length;i++){
      var x=d.xs[i];
      if(warn){
        ctx.globalAlpha=.20+.12*flash;ctx.fillStyle='#ff7a8a';ctx.fillRect(x-d.w/2,80,d.w,H-160);
        ctx.globalAlpha=.75;ctx.strokeStyle='#ffb0b8';ctx.setLineDash([7,7]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,80);ctx.lineTo(x,H-80);ctx.stroke();ctx.setLineDash([]);
      }else if(active){
        var g=ctx.createLinearGradient(x-d.w/2,0,x+d.w/2,0);
        g.addColorStop(0,'rgba(120,220,255,0)');g.addColorStop(.25,'rgba(160,245,255,'+(.38*flash)+')');g.addColorStop(.5,'rgba(255,255,255,'+(.85*flash)+')');g.addColorStop(.75,'rgba(160,245,255,'+(.38*flash)+')');g.addColorStop(1,'rgba(120,220,255,0)');
        ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(x-d.w/2,0,d.w,H);
        ctx.globalAlpha=.85;ctx.fillStyle='#eaffff';ctx.fillRect(x-2,0,4,H);
      }
    }
  }else if(d.kind==='rail'){
    if(warn){
      ctx.globalAlpha=.18+.12*flash;ctx.fillStyle='#ff9a6a';ctx.fillRect(0,d.y-14,W,28);
      ctx.globalAlpha=.8;ctx.strokeStyle='#ffd0a0';ctx.setLineDash([12,8]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,d.y);ctx.lineTo(W,d.y);ctx.stroke();ctx.setLineDash([]);
    }else if(active){
      var rg=ctx.createLinearGradient(0,d.y-10,0,d.y+10);
      rg.addColorStop(0,'rgba(255,120,60,0)');rg.addColorStop(.35,'rgba(255,190,120,'+(.5*flash)+')');rg.addColorStop(.5,'rgba(255,255,240,'+(.95*flash)+')');rg.addColorStop(.65,'rgba(255,190,120,'+(.5*flash)+')');rg.addColorStop(1,'rgba(255,120,60,0)');
      ctx.globalAlpha=1;ctx.fillStyle=rg;ctx.fillRect(0,d.y-10,W,20);
      ctx.globalAlpha=.9;ctx.fillStyle='#fff';ctx.fillRect(0,d.y-1.5,W,3);
    }
  }else if(d.kind==='wind'){
    if(warn||active){
      var dir=d.dir,wAlpha=active?.55:.25;
      ctx.globalAlpha=wAlpha;ctx.strokeStyle='#ffd9a0';ctx.lineWidth=1.4;
      for(var w=0;w<10;w++){
        var wy=160+w*62+Math.sin(time*2+w)*8;
        var wx=active?((time*260*dir+w*97)%W+W)%W:W/2;
        ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx+38*dir,wy+8);ctx.stroke();
      }
      ctx.globalAlpha=.8;ctx.fillStyle='#ffd9a0';ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillText(dir<0?'◀ WIND':'WIND ▶',W/2,H*.19);ctx.textAlign='left';
    }
  }else if(d.kind==='gate'){
    var gx=W/2+d.side*d.gap;
    if(warn){
      ctx.globalAlpha=.16+.1*flash;ctx.fillStyle='#d6b4ff';ctx.fillRect(gx-23,70,46,H-140);
      ctx.globalAlpha=.8;ctx.strokeStyle='#e8d4ff';ctx.setLineDash([6,8]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx,70);ctx.lineTo(gx,H-70);ctx.stroke();ctx.setLineDash([]);
    }else if(active){
      var gg=ctx.createLinearGradient(gx-23,0,gx+23,0);
      gg.addColorStop(0,'rgba(200,160,255,0)');gg.addColorStop(.35,'rgba(230,200,255,'+(.5*flash)+')');gg.addColorStop(.5,'rgba(255,255,255,'+(.9*flash)+')');gg.addColorStop(.65,'rgba(230,200,255,'+(.5*flash)+')');gg.addColorStop(1,'rgba(200,160,255,0)');
      ctx.globalAlpha=1;ctx.fillStyle=gg;ctx.fillRect(gx-23,0,46,H);
    }
  }
  ctx.restore();ctx.globalAlpha=1;ctx.textAlign='left';
}
