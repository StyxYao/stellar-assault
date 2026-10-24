// Web Audio engine: BGM, SFX samples, synthesis, buses and laser loop.
var bgmName='';var BGM_START={s5:0,s5boss:0,s5ending:0};
if(typeof BGMSRC!=='undefined'){
  BGMSRC.s4='assets/audio/bgm-stage4.mp3';
  BGMSRC.s2boss='assets/audio/bgm-boss2.mp3';
  BGMSRC.s3boss='assets/audio/bgm-boss3.mp3';
  BGMSRC.s4boss='assets/audio/bgm-boss4.mp3';
  BGMSRC.m5='assets/audio/bgm-menu-singularity.mp3';
  BGMSRC.s5='assets/audio/bgm-stage5.mp3';
  BGMSRC.s5boss='assets/audio/bgm-boss5.mp3';
  BGMSRC.s5ending='assets/audio/bgm-ending-kaleidoscope.mp3';
  if(typeof BGMURL!=='undefined'){ BGMURL.s4=BGMSRC.s4; BGMURL.s2boss=BGMSRC.s2boss; BGMURL.s3boss=BGMSRC.s3boss; BGMURL.s4boss=BGMSRC.s4boss;BGMURL.m5=BGMSRC.m5;BGMURL.s5=BGMSRC.s5;BGMURL.s5boss=BGMSRC.s5boss;BGMURL.s5ending=BGMSRC.s5ending; }
}
var sampleSfx=sfx,sfxLast={},laserOsc=null,laserGain=null,missileSrc=null,missileGain=null,audioBoosted=false,sfxExtraLoaded=false;
function loadSfxExtras(){
  if(sfxExtraLoaded||!AC||typeof SFX_EXTRA==='undefined') return;
  sfxExtraLoaded=true;
  Object.keys(SFX_EXTRA).forEach(function(k){
    try{
      var bin=atob(SFX_EXTRA[k]),n=bin.length,u=new Uint8Array(n);
      for(var i=0;i<n;i++) u[i]=bin.charCodeAt(i);
      AC.decodeAudioData(u.buffer,function(d){SFXBUF[k]=d;},function(){});
    }catch(e){}
  });
}
function tone(f0,f1,dur,vol,type,when){
  if(!AC||!master) return;
  var t=AC.currentTime+(when||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.001,vol),t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(master);o.onended=function(){try{o.disconnect();g.disconnect();}catch(e){}};o.start(t);o.stop(t+dur+0.03);
}
function noiseBurst(dur,vol,freq,when){
  if(!AC||!master) return;
  var t=AC.currentTime+(when||0),len=Math.max(1,Math.floor(AC.sampleRate*dur));
  var b=AC.createBuffer(1,len,AC.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
  var s=AC.createBufferSource();s.buffer=b;
  var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;
  var g=AC.createGain();g.gain.setValueAtTime(Math.max(0.001,vol),t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(master);s.onended=function(){try{s.disconnect();f.disconnect();g.disconnect();}catch(e){}};s.start(t);s.stop(t+dur+0.02);
}
var distCurve=null,sfxActive=0;
function makeDistCurve(){
  if(distCurve) return distCurve;
  var n=1024;distCurve=new Float32Array(n);
  for(var i=0;i<n;i++){var x=i*2/n-1;distCurve[i]=Math.tanh(x*3.2);}
  return distCurve;
}
function blasterShot(){
  if(!AC||muted||!master) return;
  if(SFXBUF&&SFXBUF['p_normal']){playSample('p_normal',0.78,true);return;}
  var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type='square';o.frequency.setValueAtTime(1150,t);o.frequency.exponentialRampToValueAtTime(110,t+.19);
  g.gain.setValueAtTime(.52,t);g.gain.exponentialRampToValueAtTime(.001,t+.21);
  var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(700,t+.18);
  o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+.22);
  tone(105,46,.18,.46,'sine');
  noiseBurst(.03,.30,3400);
}
function blasterHit(v){
  if(!AC||muted||!master) return;
  var t=AC.currentTime;
  var o=AC.createOscillator(),g=AC.createGain();
  o.type='triangle';o.frequency.setValueAtTime(2400,t);o.frequency.exponentialRampToValueAtTime(520,t+.075);
  g.gain.setValueAtTime(Math.max(.02,v*.65),t);g.gain.exponentialRampToValueAtTime(.001,t+.09);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+.10);
  noiseBurst(.018,Math.max(.02,v*.35),6800);
}
function spreadHit(v){
  if(!AC||muted||!master) return;
  var t=AC.currentTime;
  var o=AC.createOscillator(),g=AC.createGain();
  o.type='square';o.frequency.setValueAtTime(820,t);o.frequency.exponentialRampToValueAtTime(180,t+.075);
  g.gain.setValueAtTime(Math.max(.015,v*.58),t);g.gain.exponentialRampToValueAtTime(.001,t+.085);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+.09);
  noiseBurst(.026,Math.max(.02,v*.62),4200);
  tone(1900,620,.035,Math.max(.02,v*.30),'sawtooth');
}
function weaponHitFx(v){ if(player&&player.weapon==='spread') spreadHit(v); else sfx('e_hit',v); }
function metalHit(v){
  if(!AC||muted) return;
  var t=AC.currentTime;
  var fs=[1650,2410,3180,4720,6300];
  for(var i=0;i<fs.length;i++){
    var o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';o.frequency.setValueAtTime(fs[i]*(.92+Math.random()*.16),t);
    o.frequency.exponentialRampToValueAtTime(fs[i]*.86,t+.055);
    g.gain.setValueAtTime(Math.max(.008,v*(.15/(i*.55+1))),t);
    g.gain.exponentialRampToValueAtTime(.0001,t+.055+i*.012);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+.09+i*.012);
  }
  noiseBurst(.012,Math.max(.02,v*.28),8200);
}
function playSample(n,v,raw){
  if(!AC||!master||!SFXBUF[n]||sfxActive>56) return;
  sfxActive++;
  var s=AC.createBufferSource();s.buffer=SFXBUF[n];
  var rate={p_normal:1.0,p_spread:1.08,pickup_real:1.06,jetfly:2.0,bomb_big:1.0,p_laser:1.0,p_missile:1.90,e_shot:0.9,e_hit:1.22,b_hit:0.86,boom:0.82,laser_fire:0.95,pickup:1.1,hurt:0.8,e_charge:1.0,b_charge:1.0}[n]||1;
  s.playbackRate.value=rate;
  var g=AC.createGain();g.gain.value=v;
  var soft=(n==='e_charge'||n==='b_charge'||n==='pickup'||n==='pickup_real'||n==='siren'||n==='jetfly'||n==='bomb_big');
  if(soft){s.connect(g);}
  else{
    var sh=AC.createWaveShaper();sh.curve=makeDistCurve();sh.oversample='2x';
    s.connect(sh);sh.connect(g);
  }
  g.connect(master);
  s.onended=function(){sfxActive=Math.max(0,sfxActive-1);try{s.disconnect();g.disconnect();if(typeof sh!=='undefined'&&sh)sh.disconnect();}catch(e){}};
  s.start();
  if(n==='p_normal'&&!raw){noiseBurst(0.018,v*0.95,8500);tone(170,78,0.03,v*0.50,'square');tone(1250,650,0.018,v*0.24,'triangle');}
  if(n==='p_spread'){noiseBurst(0.022,v*0.85,7600);tone(155,65,0.032,v*0.45,'square');}
  if(n==='e_hit'){metalHit(v);blasterHit(v);noiseBurst(0.014,v*0.5,9500);tone(2300,1900,0.07,v*0.18,'triangle');tone(3700,3100,0.05,v*0.10,'sine',0.004);tone(1200,800,0.10,v*0.07,'square');}
  if(n==='b_hit'){metalHit(v*.8);tone(110,55,0.09,v*0.7,'sine');}
  if(n==='boom'){tone(85,40,0.32,v*0.55,'sine');noiseBurst(0.05,v*0.35,2600);}
  if(n==='hurt'){tone(260,90,0.18,v*0.9,'sawtooth');noiseBurst(0.055,v*0.2,1800);}
}
function playWarpJet(vol){
  if(!AC||muted) return;
  if(AC.state==='suspended') AC.resume();
  if(SFXBUF['jetfly']){playSample('jetfly',Math.min(1,vol*1.15));return;}
  var t0=AC.currentTime,dur=0.85,len=Math.floor(AC.sampleRate*dur),buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<len;i++){var e=1-i/len;d[i]=(Math.random()*2-1)*e*e;}
  var src=AC.createBufferSource();src.buffer=buf;
  var bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.1;
  bp.frequency.setValueAtTime(180,t0);bp.frequency.exponentialRampToValueAtTime(1900,t0+0.24);bp.frequency.exponentialRampToValueAtTime(220,t0+dur);
  var g=AC.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.05);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  src.connect(bp);
  var pan=AC.createStereoPanner?AC.createStereoPanner():null;
  if(pan){pan.pan.setValueAtTime(-0.9,t0);pan.pan.linearRampToValueAtTime(0.9,t0+dur);bp.connect(pan);pan.connect(g);}
  else bp.connect(g);
  g.connect(master);src.start(t0);src.stop(t0+dur);
  tone(95,38,dur,vol*0.5,'sawtooth');
}
function playAirRaid(vol){
  if(!AC||muted) return;
  if(SFXBUF['siren']){playSample('siren',vol);return;}
  var t0=AC.currentTime,dur=2.8;
  var osc=AC.createOscillator(),lfo=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain(),lp=AC.createBiquadFilter();
  osc.type='sawtooth';osc.frequency.value=520;
  lfo.type='sine';lfo.frequency.value=0.55;lg.gain.value=210;
  lfo.connect(lg);lg.connect(osc.frequency);
  lp.type='lowpass';lp.frequency.value=1500;
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.25);
  g.gain.setValueAtTime(vol,t0+dur-0.45);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  osc.connect(lp);lp.connect(g);g.connect(master);
  osc.start(t0);lfo.start(t0);osc.stop(t0+dur);lfo.stop(t0+dur);
}
function playMissileLaunch(){
  if(!AC||!master||muted) return;
  // cancel the previous missile immediately; only one launch sample may sound
  if(missileSrc){
    try{missileSrc.stop();}catch(e){}
    try{missileSrc.disconnect();}catch(e){}
    try{if(missileGain)missileGain.disconnect();}catch(e){}
    missileSrc=null;missileGain=null;
  }
  var buf=SFXBUF['p_missile'];
  if(!buf){noiseBurst(0.06,0.12,8000);tone(1600,600,0.07,0.10,'triangle');return;}
  var t=AC.currentTime,s=AC.createBufferSource();
  s.buffer=buf;
  s.playbackRate.value=1;
  var g=AC.createGain();g.gain.value=0.9;
  s.connect(g);g.connect(master);
  missileSrc=s;missileGain=g;
  s.onended=function(){if(missileSrc===s){missileSrc=null;missileGain=null;}try{s.disconnect();g.disconnect();}catch(e){}};
  s.start(t);
}
function synthSfx(n,v){
  if(!AC||!master||muted) return;
  v=v||0.2;
  if(n==='p_normal') tone(1100,720,0.05,v,'square');
  else if(n==='p_spread'){tone(900,1200,0.04,v*0.8,'triangle');tone(700,1000,0.05,v*0.7,'triangle',0.02);tone(500,800,0.06,v*0.6,'triangle',0.04);}
  else if(n==='p_missile'){noiseBurst(0.085,v*0.45,7000);tone(1800,520,0.095,v*0.40,'triangle');}
  else if(n==='e_shot') tone(240,160,0.08,v,'square');
  else if(n==='e_hit'){metalHit(v);blasterHit(v);tone(2300,1800,0.06,v*0.55,'triangle');tone(3700,3000,0.045,v*0.22,'sine');noiseBurst(0.014,v*0.4,9000);}
  else if(n==='b_hit'){tone(320,160,0.07,v,'square');noiseBurst(0.05,v*0.5,2000);}
  else if(n==='e_charge') tone(250,900,0.9,v,'sawtooth');
  else if(n==='b_charge'){tone(140,800,1.2,v,'sawtooth');tone(70,120,1.2,v*0.5,'sine');}
  else if(n==='laser_fire'){noiseBurst(0.28,v,1600);tone(600,90,0.3,v*0.6,'sawtooth');}
  else if(n==='pickup'){tone(700,1100,0.08,v,'sine');tone(1000,1500,0.1,v*0.8,'sine',0.06);}
  else if(n==='boom'){noiseBurst(0.45,v,700);tone(120,50,0.4,v*0.8,'sine');}
  else if(n==='hurt'){tone(260,110,0.24,v*1.15,'sawtooth');tone(520,180,0.18,v*0.55,'square');noiseBurst(0.07,v*0.25,1800);}
  else if(n==='reload'||n==='pickup_real'){noiseBurst(0.03,v,5000);tone(800,260,0.03,v*0.7,'square');noiseBurst(0.045,v*0.8,2200,0.06);tone(150,70,0.09,v*0.6,'sine',0.02);}
  else if(n==='1up'){tone(700,900,0.08,v,'square');tone(1000,1400,0.12,v*0.8,'square',0.07);}
  else if(n==='bomb_big'){noiseBurst(0.65,v*0.9,650);tone(85,30,0.85,v*0.7,'sine');}
  else if(n==='alarm'){for(var ai=0;ai<5;ai++){tone(620,950,0.20,v*0.65,'square',ai*0.48);tone(950,620,0.20,v*0.65,'square',ai*0.48+0.24);}}
  else if(n==='warp'){noiseBurst(0.85,v*0.75,1400);tone(80,520,0.85,v*0.55,'sawtooth');}
  else tone(600,400,0.05,v,'square');
}
function repairAudio(){
  try{
    if(!AC){initAudio();loadSfxExtras();return;}
    if(AC.state==='closed'){AC=null;master=null;audioBoosted=false;initAudio();loadSfxExtras();return;}
    if(AC.state==='suspended') AC.resume();
    if(!master){master=AC.createGain();master.connect(AC.destination);audioBoosted=false;}
    if(!audioBoosted){boostAudio();return;}
    master.gain.value=0.61965;
  }catch(e){}
}
function rebuildSfxBus(){
  if(!AC) return;
  try{if(AC.state==='suspended') AC.resume();}catch(e){}
  try{
    if(laserOsc){try{laserOsc.stop();}catch(e){}laserOsc=null;laserGain=null;}
    master=AC.createGain();master.gain.value=0.61965;
    var comp=AC.createDynamicsCompressor();
    comp.threshold.value=-16;comp.knee.value=20;comp.ratio.value=5;comp.attack.value=0.003;comp.release.value=0.25;
    master.connect(comp);comp.connect(AC.destination);
    audioBoosted=true;
  }catch(e){}
}
sfx=function(n,v){
  try{
    if(!AC||!master||muted) return;
    if(AC.state==='suspended') AC.resume();
    boostAudio();loadSfxExtras();
    var now=performance.now(),gap=(n==='b_charge'?120:(n==='e_hit'?35:(n==='b_hit'?45:(n==='e_shot'?45:(n==='boom'?55:(n==='e_charge'?90:0))))));
    if(gap&&sfxLast[n]&&now-sfxLast[n]<gap) return;
    sfxLast[n]=now;
    if(SFXBUF[n]){ playSample(n,v); return; }
    synthSfx(n,v);
  }catch(e){}
};
function boostAudio(){
  if(!AC||!master||audioBoosted) return;
  try{
    var comp=AC.createDynamicsCompressor();
    comp.threshold.value=-16;comp.knee.value=20;comp.ratio.value=5;comp.attack.value=0.003;comp.release.value=0.25;
    master.disconnect();master.connect(comp);comp.connect(AC.destination);
    master.gain.value=0.61965;audioBoosted=true;
  }catch(e){}
}
function setLaserSound(on){
  try{
  if(AC&&AC.state==='suspended') AC.resume();
  if(AC&&master) boostAudio();
  if(!AC||!master||muted){
    if(laserOsc){try{laserOsc.stop();}catch(e){}laserOsc=null;laserGain=null;}
    return;
  }
  if(on&&!laserOsc){
    laserOsc=AC.createOscillator();laserGain=AC.createGain();
    laserOsc.type='sawtooth';laserOsc.frequency.value=160;
    var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1200;
    laserGain.gain.value=0.0001;
    laserOsc.connect(f);f.connect(laserGain);laserGain.connect(master);
    laserOsc.start();
    laserGain.gain.linearRampToValueAtTime(0.12,AC.currentTime+0.05);
    laserOsc.frequency.linearRampToValueAtTime(250,AC.currentTime+0.1);
    sfx('p_laser',0.28);
  }else if(!on&&laserOsc){
    try{laserGain.gain.linearRampToValueAtTime(0.0001,AC.currentTime+0.06);laserOsc.stop(AC.currentTime+0.1);}catch(e){}
    laserOsc=null;laserGain=null;
  }
  }catch(e){}
}


function stopBgm(){ if(bgmAudio){try{bgmAudio.pause();}catch(e){}} bgmName=''; }
function playBgm(k){
  if(muted||!BGMURL[k]) return;
  if(bgmName===k&&bgmAudio&&!bgmAudio.paused) return;
  var start=BGM_START[k]||0;
  if(!bgmAudio){
    bgmAudio=new Audio();bgmAudio.loop=false;bgmAudio.preload='auto';
    bgmAudio.addEventListener('timeupdate',function(){
      if(bgmAudio.__seekDone||!bgmAudio.__start||bgmAudio.__start<=0) return;
      if(bgmAudio.readyState>=1&&bgmAudio.currentTime<bgmAudio.__start-0.25){
        try{bgmAudio.currentTime=bgmAudio.__start;bgmAudio.__seekDone=true;}catch(e){}
      }
    });
    bgmAudio.onended=function(){
      if(!bgmName||muted) return;
      try{bgmAudio.currentTime=BGM_START[bgmName]||0;bgmAudio.__seekDone=true;var p=bgmAudio.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
    };
  }
  try{
    if(bgmAudio.__k!==k){
      bgmAudio.pause();
      bgmAudio.src=BGMURL[k]+(start>0?'#t='+start:'');
      bgmAudio.__k=k;bgmAudio.__start=start;bgmAudio.__seekDone=false;
      var seek=function(){try{if(bgmAudio.__k===k&&bgmAudio.__start===start&&bgmAudio.currentTime<start-0.5){bgmAudio.currentTime=start;bgmAudio.__seekDone=true;}}catch(e){}};
      if(bgmAudio.readyState>=1) seek();else bgmAudio.addEventListener('loadedmetadata',seek,{once:true});
      bgmAudio.addEventListener('canplay',seek,{once:true});
      setTimeout(seek,80);setTimeout(seek,320);
    }
    bgmAudio.volume=0.765325;
    var pr=bgmAudio.play();
    if(pr&&pr.catch) pr.catch(function(){
      bgmPending=k;
      try{ if(bgmAudio.__k===k&&bgmAudio.src.indexOf('blob:')===0){ bgmAudio.src='data:audio/mpeg;base64,'+BGMSRC[k]; var p2=bgmAudio.play(); if(p2&&p2.catch)p2.catch(function(){}); } }catch(e){}
    });
  }catch(e){ bgmPending=k; }
  bgmName=k;
}

