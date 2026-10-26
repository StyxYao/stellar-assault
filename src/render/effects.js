// Explosion, phase, item, OD and pickup visual effects.
function hitSpark(x,y,spread,big){
  if(fx.length>140) return;
  fx.push({x:x,y:y,t:0,life:big?0.24:0.17,kind:'hitspark',sc:big?1.55:1,color:spread?'#ffb36b':'#9fe8ff'});
}
function drawExplosion(f){
  if(f.kind==='hitspark'){
    var hp=Math.max(0,Math.min(1,f.t/(f.life||0.17))),hr=(5+20*hp)*f.sc,ha=1-hp;
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=.9*ha;ctx.strokeStyle=f.color;ctx.lineWidth=2*f.sc;ctx.beginPath();ctx.arc(f.x,f.y,hr,0,TAU);ctx.stroke();
    ctx.globalAlpha=.55*ha;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(f.x,f.y,hr*.55,0,TAU);ctx.stroke();
    for(var q=0;q<4;q++){var qa=q*Math.PI/2;ctx.globalAlpha=.75*ha;ctx.beginPath();ctx.moveTo(f.x+Math.cos(qa)*hr*.55,f.y+Math.sin(qa)*hr*.55);ctx.lineTo(f.x+Math.cos(qa)*(hr+5),f.y+Math.sin(qa)*(hr+5));ctx.stroke();}
    ctx.globalAlpha=.8*ha;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(f.x,f.y,2.2*f.sc,0,TAU);ctx.fill();ctx.restore();ctx.globalAlpha=1;return;
  }
  var life=f.life||0.6;
  var p=Math.max(0,Math.min(1,f.t/life)),r=(12+64*p)*f.sc,a=Math.max(0,1-p);
  if(f.t<0) return;
  var elite=(f.kind==='elite'||f.kind==='player'||f.kind==='enemybomb'),boss=f.kind==='boss';
  ctx.save();ctx.globalCompositeOperation='lighter';
  // 50% brighter core: extra white-hot layer
  var core=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r*(boss?0.85:0.7));
  core.addColorStop(0,'rgba(255,255,255,'+(0.75*a)+')');
  core.addColorStop(0.35,(f.kind==='enemybomb')?'rgba(120,255,240,'+(0.6*a)+')':(elite?'rgba(200,250,255,'+(0.55*a)+')':'rgba(255,250,220,'+(0.55*a)+')'));
  core.addColorStop(1,'rgba(255,180,70,0)');
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(f.x,f.y,r*0.7,0,TAU);ctx.fill();
  var g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
  g.addColorStop(0,'rgba(255,255,240,'+(0.98*a)+')');
  g.addColorStop(0.25,boss?'rgba(255,245,180,'+(0.95*a)+')':(elite?'rgba(190,245,255,'+(0.92*a)+')':'rgba(255,220,130,'+(0.95*a)+')'));
  g.addColorStop(0.55,boss?'rgba(255,170,50,'+(0.7*a)+')':(elite?'rgba(80,170,255,'+(0.6*a)+')':'rgba(255,110,40,'+(0.65*a)+')'));
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.fill();
  // Large shock rings only for boss / player bomb events. Normal and elite
  // kills used to leave a stray white circle that looked like a drifting ring.
  if (boss || f.kind === 'player') {
    ctx.globalAlpha=0.8*a;ctx.strokeStyle=boss?'#ffe6a0':'#c8f4ff';ctx.lineWidth=boss?5:3;
    ctx.beginPath();ctx.arc(f.x,f.y,r*0.92,0,TAU);ctx.stroke();
  }
  for(var i=0;i<(boss?12:7);i++){
    var ang=f.seed+i*0.9,rr=r*(0.45+0.5*((i*37)%10)/10);
    ctx.globalAlpha=(boss?0.95:0.8)*a;ctx.fillStyle=i%2?'#fff4cf':(elite?'#9fe8ff':'#ffb066');
    ctx.fillRect(f.x+Math.cos(ang)*rr-2,f.y+Math.sin(ang)*rr-2,boss?5:4,boss?5:4);
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawPhaseFx(){
  for(var i=0;i<phaseFx.length;i++){
    var f=phaseFx[i],q=f.t/f.life,a=Math.max(0,1-q);
    ctx.save();ctx.globalCompositeOperation='lighter';
    // short white flash over the screen at the start
    if(q<0.22){
      var fl=1-q/0.22;ctx.fillStyle='rgba(255,255,255,'+(0.48*fl)+')';ctx.fillRect(0,0,W,H);
    }
    for(var k=0;k<3;k++){
      var rr=(20+260*q)+k*28,al=Math.max(0,0.55*(1-q)-k*0.06);
      ctx.globalAlpha=al;ctx.strokeStyle=k===0?'#ffffff':(stage===3?'#ffe7a0':(stage===2?'#ffc36b':(stage===1?'#d9a0ff':'#8ff0ff')));
      ctx.lineWidth=3-k*0.7;ctx.beginPath();ctx.arc(f.x,f.y,rr,0,TAU);ctx.stroke();
    }
    for(var j=0;j<12;j++){
      var ang=j/12*TAU+q*1.2,rr=f.life*70*(0.4+q*1.5);
      ctx.globalAlpha=0.5*a;ctx.fillStyle=j%2?'#fff':'#bff4ff';
      ctx.fillRect(f.x+Math.cos(ang)*rr-2,f.y+Math.sin(ang)*rr-2,3,3);
    }
    ctx.restore();ctx.globalAlpha=1;
  }
}
function drawItem(it){
  var cols={N:'#ffe6a0',P:'#7fe7ff',S:'#8dff9e',L:'#ff7ad5',M:'#ffb36b',W:'#c9a0ff',B:'#ffd36b'};
  if(it.type==='A'){
    var at=ammoType(it),ac=cols[at]||'#7fe7ff';
    ctx.save();ctx.translate(it.x,it.y);
    ctx.globalAlpha=0.25;ctx.fillStyle=ac;ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();
    ctx.globalAlpha=1;ctx.rotate(it.t*1.4);
    ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(11,0);ctx.lineTo(0,13);ctx.lineTo(-11,0);ctx.closePath();
    ctx.fillStyle='rgba(8,16,28,0.94)';ctx.fill();ctx.strokeStyle=ac;ctx.lineWidth=2.2;ctx.stroke();
    ctx.rotate(-it.t*1.4);ctx.fillStyle=ac;ctx.font='bold 11px "Arial Black", Arial, sans-serif';ctx.textAlign='center';ctx.fillText(at,0,4);
    ctx.textAlign='left';ctx.restore();return;
  }
  if(it.type==='1UP'){
    ctx.save();ctx.translate(it.x,it.y);
    ctx.globalAlpha=0.25;ctx.fillStyle='#8dff9e';ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle='#8dff9e';
    ctx.fillRect(-3,-12,6,24);ctx.fillRect(-12,-3,24,6);
    ctx.strokeStyle='#dfffe8';ctx.lineWidth=1.5;ctx.strokeRect(-3,-12,6,24);ctx.strokeRect(-12,-3,24,6);
    ctx.fillStyle='#04140a';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText('1UP',0,3);
    ctx.textAlign='left';ctx.restore();return;
  }
  var col=cols[it.type]||'#ffd36b';
  ctx.save();ctx.translate(it.x,it.y);
  ctx.globalAlpha=0.2;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();
  ctx.globalAlpha=1;
  ctx.beginPath();
  if(it.type==='P'){
    for(var k=0;k<6;k++){var a=-Math.PI/2+k*Math.PI/3,x=Math.cos(a)*12,y=Math.sin(a)*12;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    ctx.closePath();
  }else if(it.type==='S'){
    ctx.moveTo(0,-13);ctx.lineTo(12,9);ctx.lineTo(-12,9);ctx.closePath();
  }else if(it.type==='L'){
    ctx.moveTo(0,-13);ctx.lineTo(10,0);ctx.lineTo(0,13);ctx.lineTo(-10,0);ctx.closePath();
  }else if(it.type==='M'){
    ctx.moveTo(0,-13);ctx.lineTo(12,-2);ctx.lineTo(5,-2);ctx.lineTo(5,11);ctx.lineTo(-5,11);ctx.lineTo(-5,-2);ctx.lineTo(-12,-2);ctx.closePath();
  }else if(it.type==='W'){
    ctx.moveTo(-14,6);ctx.lineTo(-4,-6);ctx.lineTo(-2,-1);ctx.lineTo(0,-10);ctx.lineTo(2,-1);ctx.lineTo(4,-6);ctx.lineTo(14,6);ctx.lineTo(0,12);ctx.closePath();
  }else{
    ctx.arc(0,0,12,0,TAU);
  }
  ctx.fillStyle='rgba(8,16,28,0.92)';ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.stroke();
  ctx.fillStyle=col;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(it.type,0,4);
  ctx.textAlign='left';ctx.restore();
}

function drawODAura(drawY){
  if(player.odT<=0) return;
  var imgs=[GIMG.od1,GIMG.od2,GIMG.od3,GIMG.od4];
  var frame=Math.floor(time*12)%4,img=imgs[frame];
  if(!img||!img.complete||!img.naturalWidth) return;
  var breath=0.5+0.5*Math.sin(time*7);
  var size=105+breath*6;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // one soft outer pass and one crisp animated aura pass
  ctx.globalAlpha=0.30+0.10*breath;
  ctx.drawImage(img,player.x-size*0.60,drawY-size*0.60,size*1.20,size*1.20);
  ctx.globalAlpha=0.86;
  ctx.drawImage(img,player.x-size*0.5,drawY-size*0.5,size,size);
  ctx.restore();ctx.globalAlpha=1;
}

function drawBombFx(){
  if(bombT<=0) return;
  var p=1-bombT/1.1,r=30+620*p,core=Math.max(0,24+170*p);
  ctx.save();ctx.globalCompositeOperation='lighter';
  // full-screen flash
  ctx.fillStyle='rgba(255,245,220,'+((1-p)*0.34)+')';ctx.fillRect(0,0,W,H);
  // hot core
  var cg=ctx.createRadialGradient(bombX,bombY,0,bombX,bombY,core);
  cg.addColorStop(0,'rgba(255,255,245,'+((1-p)*0.95)+')');
  cg.addColorStop(0.18,'rgba(255,235,150,'+((1-p)*0.9)+')');
  cg.addColorStop(0.55,'rgba(255,135,50,'+((1-p)*0.55)+')');
  cg.addColorStop(1,'rgba(255,80,20,0)');
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(bombX,bombY,core,0,TAU);ctx.fill();
  // triple shockwaves
  for(var s=0;s<3;s++){
    var rr=r*(1-s*0.18);
    ctx.globalAlpha=(1-p)*(0.9-s*0.2);ctx.strokeStyle=s===0?'#fff8d8':(s===1?'#bff4ff':'#ffd28a');
    ctx.lineWidth=(s===0?16:8)*(1-p)+2;
    ctx.beginPath();ctx.arc(bombX,bombY,rr,0,TAU);ctx.stroke();
  }
  // radial rays
  for(var i=0;i<28;i++){
    var a=i/28*TAU,rr=r*(0.45+0.55*((i*7)%10)/10);
    ctx.globalAlpha=(1-p)*0.55;ctx.strokeStyle=i%3===0?'#fff8d8':(i%2?'#bff4ff':'#ffd28a');ctx.lineWidth=i%3===0?4:2;
    ctx.beginPath();ctx.moveTo(bombX+Math.cos(a)*r*0.12,bombY+Math.sin(a)*r*0.12);ctx.lineTo(bombX+Math.cos(a)*rr,bombY+Math.sin(a)*rr);ctx.stroke();
  }
  // edge pulse
  ctx.globalAlpha=(1-p)*0.55;ctx.strokeStyle='#ffd28a';ctx.lineWidth=6;
  ctx.strokeRect(3,3,W-6,H-6);
  ctx.restore();ctx.globalAlpha=1;
}
function drawPickupMsg(){
  if(pickupT<=0||!pickupMsg) return;
  ctx.globalAlpha=Math.min(1,pickupT*1.8);ctx.textAlign='center';
  ctx.fillStyle='#9fe8ff';ctx.font='14px monospace';ctx.fillText(pickupMsg,W/2,H*0.62);
  ctx.globalAlpha=1;ctx.textAlign='left';
}

