// Player weapon and wing rendering.
function drawWingBeams(){
  for(var i=0;i<wingBeams.length;i++){
    var b=wingBeams[i],a=Math.max(0,1-b.t/b.life),h=Math.max(0,b.y-b.endY);
    if(h<=0) continue;
    ctx.save();ctx.globalCompositeOperation='lighter';
    var g=ctx.createLinearGradient(b.x-b.w,0,b.x+b.w,0);
    var cc=b.max?'255,215,100':'80,220,255';
    g.addColorStop(0,'rgba('+cc+',0)');g.addColorStop(0.4,'rgba('+cc+','+(0.55*a)+')');g.addColorStop(0.5,'rgba(255,255,255,'+(0.9*a)+')');g.addColorStop(0.6,'rgba('+cc+','+(0.55*a)+')');g.addColorStop(1,'rgba('+cc+',0)');
    ctx.fillStyle=g;ctx.fillRect(b.x-b.w,b.endY,b.w*2,h);
    ctx.fillStyle='rgba(255,255,255,'+(0.8*a)+')';ctx.fillRect(b.x-1,b.endY,2,h);
    if(b.endY>0){ctx.globalAlpha=a;ctx.fillStyle=b.max?'#ffd76a':'#bff4ff';ctx.beginPath();ctx.arc(b.x,b.endY,7,0,TAU);ctx.fill();}
    ctx.restore();ctx.globalAlpha=1;
  }
}

function drawShots(){
  for(var i=0;i<shots.length;i++){
    var s=shots[i],ang=Math.atan2(s.vx||0,-s.vy);
    var chargeCols=['#9fe8ff','#ffd36b','#c98bff','#ff8a66'];
    var lvl=s.chargeLevel?Math.max(0,Math.min(3,s.chargeLevel-1)):0;
    var col=s.chargeLevel?chargeCols[lvl]:(s.wing?'#7fe7ff':(s.special?'#8dff9e':'#ffe6a0'));
    var glow=s.chargeLevel?'rgba(255,220,120,0.45)':(s.wing?'rgba(80,210,255,0.4)':(s.special?'rgba(80,255,140,0.35)':'rgba(255,170,60,0.35)'));
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);
    var bh=(s.laser?32:22)*(s.lenScale||1)*(1+0.08*lvl),bw=2.4*(s.widScale||1)*(1+0.06*lvl);
    if(s.max){ctx.fillStyle='rgba(255,215,100,0.16)';ctx.fillRect(-bw/2-1.1,-bh/2-1.1,bw+2.2,bh+2.2);}
    ctx.fillStyle=glow;ctx.fillRect(-(bw+2),-bh/2-2,(bw+2)*2,bh+4);
    ctx.fillStyle=col;ctx.fillRect(-bw/2,-bh/2,bw,bh);
    if(s.max){ctx.strokeStyle='rgba(255,215,100,0.9)';ctx.lineWidth=0.7;ctx.strokeRect(-bw/2,-bh/2,bw,bh);}
    ctx.restore();
  }
}
function drawMissiles(){
  for(var i=0;i<missiles.length;i++){
    var m=missiles[i],ang=Math.atan2(m.vy,m.vx)+Math.PI/2;
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(ang);ctx.scale((m.widScale||1)*(1+0.05*((m.chargeLevel||1)-1)),(m.lenScale||1)*(1+0.04*((m.chargeLevel||1)-1)));
    if(m.max) ctx.scale(1,1.12);
    if(m.wing) ctx.scale(0.62,0.78);
    // smoke trail
    for(var k=1;k<=3;k++){
      ctx.globalAlpha=0.18/k;
      ctx.fillStyle='#ffb36b';
      ctx.beginPath();ctx.arc(0,10+k*7,3+k,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
    // fins
    ctx.fillStyle=m.max?'#d8a13a':(m.wing?'#3d93b0':'#6b7078');
    var fw=m.max?7:5;
    ctx.beginPath();ctx.moveTo(-fw,8);ctx.lineTo(-2,3);ctx.lineTo(-2,10);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(fw,8);ctx.lineTo(2,3);ctx.lineTo(2,10);ctx.closePath();ctx.fill();
    if(m.max){
      ctx.fillStyle='#d8a13a';ctx.beginPath();ctx.moveTo(-2,-2);ctx.lineTo(-6,1);ctx.lineTo(-2,4);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(2,-2);ctx.lineTo(6,1);ctx.lineTo(2,4);ctx.closePath();ctx.fill();
    }
    // metallic body
    var mg=ctx.createLinearGradient(-3,0,3,0);
    mg.addColorStop(0,'#4e555e');mg.addColorStop(0.35,'#e9eef4');mg.addColorStop(0.6,'#9aa3ad');mg.addColorStop(1,'#3e444c');
    ctx.fillStyle=m.chargeLevel?(['#9fe8ff','#ffd36b','#c98bff','#ff8a66'][Math.max(0,Math.min(3,m.chargeLevel-1))]):(m.max?'#ffe08a':(m.wing?'#bfefff':mg));
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(3,-3);ctx.lineTo(3,9);ctx.lineTo(-3,9);ctx.lineTo(-3,-3);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#232930';ctx.lineWidth=0.8;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillRect(-1.2,-9,1.2,13);
    // nose
    ctx.fillStyle='#b4332a';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(2.6,-6);ctx.lineTo(-2.6,-6);ctx.closePath();ctx.fill();
    // flame only after ignition
    if(m.t>=m.ignite){ctx.fillStyle=m.max?'rgba(255,235,150,0.95)':'rgba(255,210,120,0.9)';ctx.beginPath();ctx.moveTo(-2,9);ctx.lineTo(0,(m.max?23:15)+3*Math.sin(time*40+i));ctx.lineTo(2,9);ctx.closePath();ctx.fill();if(m.max){ctx.fillStyle='rgba(255,255,220,0.9)';ctx.beginPath();ctx.moveTo(-0.8,9);ctx.lineTo(0,17);ctx.lineTo(0.8,9);ctx.closePath();ctx.fill();}}
    else {ctx.fillStyle='rgba(180,190,200,0.35)';ctx.beginPath();ctx.arc(0,10,2,0,TAU);ctx.fill();}
    ctx.restore();
  }
}
function drawBeams(){
  for(var i=0;i<beams.length;i++){
    var b=beams[i],ex=b.x+Math.cos(b.ang)*b.len,ey=b.y+Math.sin(b.ang)*b.len;
    if(b.t<b.charge){
      var p=Math.min(1,b.t/b.charge);
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.12+0.10*Math.sin(time*24);
      ctx.strokeStyle=b.color;ctx.lineWidth=b.w*1.1;
      ctx.setLineDash([16,10]);ctx.lineDashOffset=-time*90;
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha=0.58+0.25*Math.sin(time*18);
      ctx.strokeStyle=b.color;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(ex,ey);ctx.stroke();
      var gr=8+26*p;
      var g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,gr);
      g.addColorStop(0,'rgba(255,255,255,0.95)');
      g.addColorStop(0.4,b.color);
      g.addColorStop(1,'rgba(255,50,50,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,gr,0,TAU);ctx.fill();
      var tx=b.x+Math.cos(b.ang)*b.len*0.72,ty=b.y+Math.sin(b.ang)*b.len*0.72;
      ctx.globalAlpha=0.7;ctx.strokeStyle='rgba(255,100,100,0.9)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(tx,ty,10+4*Math.sin(time*14),0,TAU);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tx-16,ty);ctx.lineTo(tx+16,ty);ctx.moveTo(tx,ty-16);ctx.lineTo(tx,ty+16);ctx.stroke();
      ctx.restore();ctx.globalAlpha=1;
    }else if(b.t<=b.charge+b.fire+(b.fade||0.15)){
      var fa=b.t<=b.charge+b.fire?1:Math.max(0,1-(b.t-(b.charge+b.fire))/(b.fade||0.15));
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=0.55*fa;ctx.strokeStyle=b.color;ctx.lineWidth=b.w*(0.6+0.4*fa);
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.globalAlpha=0.95*fa;ctx.strokeStyle='#fff';ctx.lineWidth=b.w*0.28*(0.6+0.4*fa);
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.restore();ctx.globalAlpha=1;
    }
  }
}
function drawOptions(){
  for(var i=0;i<player.options;i++){
    var p=optionPos(i);
    ctx.save();ctx.translate(p.x,p.y+Math.sin(time*4+i)*1.4);ctx.rotate(player.bank*0.32);
    ctx.globalAlpha=0.22;ctx.fillStyle='#7fe7ff';ctx.beginPath();ctx.arc(0,4,17,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
    var wimg=GIMG.w1;
    if(wimg&&wimg.complete&&wimg.naturalWidth){
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.35;ctx.fillStyle='#61e8ff';ctx.beginPath();ctx.arc(0,13,8,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.drawImage(wimg,-17,-17,34,34);
    }else{
      ctx.fillStyle='#3b8fc4';ctx.beginPath();ctx.moveTo(-13,5);ctx.lineTo(-3,-2);ctx.lineTo(-3,7);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(13,5);ctx.lineTo(3,-2);ctx.lineTo(3,7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#e6f7ff';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(5,5);ctx.lineTo(0,9);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#7fe7ff';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(2,1);ctx.lineTo(-2,1);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}
function drawPlayerLaser(){
  if(player.weapon!=='laser'||(state!=='play'&&state!=='boss')) return;
  if(player.ship==='aegis'&&typeof aegisState!=='undefined'&&(aegisState.charge==='charging'||player.odT>0)) return;
  if(player.odT>0){
    var w=26+Math.min(player.specialPower,3)*5;
    ctx.save();ctx.globalCompositeOperation='lighter';
    var h=Math.max(0,player.y-12);
    var g=ctx.createLinearGradient(player.x-w,0,player.x+w,0);
    g.addColorStop(0,'rgba(80,210,255,0)');g.addColorStop(0.28,'rgba(90,235,255,0.55)');
    g.addColorStop(0.48,'rgba(255,255,240,0.95)');g.addColorStop(0.52,'rgba(255,248,190,0.98)');
    g.addColorStop(0.72,'rgba(90,235,255,0.55)');g.addColorStop(1,'rgba(80,210,255,0)');
    ctx.fillStyle=g;ctx.fillRect(player.x-w,0,w*2,h);
    ctx.fillStyle='rgba(255,255,255,0.98)';ctx.fillRect(player.x-4,0,8,h);
    // smooth energy filaments instead of jagged lightning
    for(var side=-1;side<=1;side+=2){
      for(var fl=0;fl<2;fl++){
        ctx.beginPath();
        ctx.globalAlpha=fl===0?0.42:0.24;
        ctx.strokeStyle=fl===0?'#9ff8ff':'#ffe28a';ctx.lineWidth=fl===0?1.8:1.2;
        for(var yy=0;yy<h;yy+=7){
          var xx=player.x+side*(w*(fl===0?0.52:0.66))+Math.sin(yy*0.025+time*11+fl*2.2+side)*4.0;
          if(yy===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
    var cg=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,62);
    cg.addColorStop(0,'rgba(255,255,255,0.95)');cg.addColorStop(0.3,'rgba(120,240,255,0.45)');cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(player.x,player.y,62,0,TAU);ctx.fill();
    ctx.restore();ctx.globalAlpha=1;
    return;
  }
  var lv=player.specialPower,w=8+Math.min(lv,3)*5+Math.sin(time*30)*2;
  var cols=['80,190,255','120,240,255','255,120,220','255,215,100'],c=cols[lv-1]||cols[0];
  var endY=laserHitY>0?laserHitY:0, h=Math.max(0,player.y-18-endY);
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createLinearGradient(player.x-w,0,player.x+w,0);
  g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(0.35,'rgba('+c+',0.55)');
  g.addColorStop(0.5,'rgba(255,255,255,0.95)');g.addColorStop(0.65,'rgba('+c+',0.55)');g.addColorStop(1,'rgba('+c+',0)');
  ctx.fillStyle=g;ctx.fillRect(player.x-w,endY,w*2,h);
  ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(player.x-2,endY,4,h);
  if(laserHitY>0){
    var gr=16+8*Math.sin(time*40);
    var hg=ctx.createRadialGradient(player.x,laserHitY,0,player.x,laserHitY,gr);
    hg.addColorStop(0,'rgba(255,255,240,0.95)');hg.addColorStop(0.35,lv>=4?'rgba(255,215,100,0.95)':'rgba(255,230,120,0.85)');hg.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(player.x,laserHitY,gr,0,TAU);ctx.fill();
    for(var k=0;k<5;k++){var a=k/5*TAU+time*8;ctx.globalAlpha=0.7;ctx.fillStyle='#fff2b0';ctx.fillRect(player.x+Math.cos(a)*gr*0.7-1.5,laserHitY+Math.sin(a)*gr*0.7-1.5,3,3);}
  }
  ctx.restore();ctx.globalAlpha=1;
}

