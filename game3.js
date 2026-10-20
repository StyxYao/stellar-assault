var player={x:W/2,y:H-130,r:7,lives:3,hp:3,maxHp:3,bombs:2,invuln:0,bank:0,noBlink:false,power:1,weapon:'normal',specialPower:1,options:0,wingPower:1,trail:[],wingEntry:[]};
var target={x:W/2,y:H-130};
var stage=0,state='menu',score=0,time=0,lastShot=0,lastHitSfx=0,shake=0;
var enemies=[],bullets=[],shots=[],parts=[],stars=[],fx=[],ebullets=[],items=[],missiles=[],wingBeams=[],beams=[],orbBullets=[];
var lastMissile=0,lastSpecial=0,optionT=0,laserTick=0,laserHitY=0,laserHitT=0,pickupMsg='',pickupT=0;
var audioReady=false;
var boss=null,runner=null;
var stageT=0,waveIndex=0,nextTransport=0,banner='',bannerSub='',bannerT=0;
var bgCurrent=BG1,bgPrev=null,bgFade=0,stageFlash=0,stageWarp=0,warpT=0,warpSpeed=0,glowWarp=0,bombT=0,bombX=0,bombY=0;
var bgScroll=0,bgEdgeScroll=0,bgDust=[];var BG_MAIN=[],BG_EDGE=[];
var bgmName='';
var sampleSfx=sfx,sfxLast={},laserOsc=null,laserGain=null,audioBoosted=false,sfxExtraLoaded=false;
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
function playSample(n,v){
  if(!AC||!master||!SFXBUF[n]||sfxActive>56) return;
  sfxActive++;
  var s=AC.createBufferSource();s.buffer=SFXBUF[n];
  var rate={p_normal:1.0,p_spread:1.08,pickup_real:1.06,jetfly:2.0,bomb_big:1.0,p_laser:1.0,p_missile:1.08,e_shot:0.9,e_hit:1.22,b_hit:0.86,boom:0.82,laser_fire:0.95,pickup:1.1,hurt:0.8,e_charge:1.0,b_charge:1.0}[n]||1;
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
  if(n==='p_normal'){noiseBurst(0.025,v*0.5,3500);tone(180,90,0.04,v*0.35,'square');}
  if(n==='p_spread'){noiseBurst(0.03,v*0.4,3000);}
  if(n==='e_hit') tone(210,90,0.045,v*0.45,'square');
  if(n==='b_hit') tone(110,55,0.09,v*0.7,'sine');
  if(n==='boom') tone(85,40,0.32,v*0.55,'sine');
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
  sfx('p_missile',0.34);
  if(!AC||muted) return;
  noiseBurst(0.07,0.14,2200);
}
function synthSfx(n,v){
  if(!AC||!master||muted) return;
  v=v||0.2;
  if(n==='p_normal') tone(1100,720,0.05,v,'square');
  else if(n==='p_spread'){tone(900,1200,0.04,v*0.8,'triangle');tone(700,1000,0.05,v*0.7,'triangle',0.02);tone(500,800,0.06,v*0.6,'triangle',0.04);}
  else if(n==='p_missile'){noiseBurst(0.22,v*0.7,1200);tone(220,80,0.25,v*0.5,'sawtooth');}
  else if(n==='e_shot') tone(240,160,0.08,v,'square');
  else if(n==='e_hit') tone(1600,900,0.035,v,'square');
  else if(n==='b_hit'){tone(320,160,0.07,v,'square');noiseBurst(0.05,v*0.5,2000);}
  else if(n==='e_charge') tone(250,900,0.9,v,'sawtooth');
  else if(n==='b_charge'){tone(140,800,1.2,v,'sawtooth');tone(70,120,1.2,v*0.5,'sine');}
  else if(n==='laser_fire'){noiseBurst(0.28,v,1600);tone(600,90,0.3,v*0.6,'sawtooth');}
  else if(n==='pickup'){tone(700,1100,0.08,v,'sine');tone(1000,1500,0.1,v*0.8,'sine',0.06);}
  else if(n==='boom'){noiseBurst(0.45,v,700);tone(120,50,0.4,v*0.8,'sine');}
  else if(n==='hurt') tone(300,80,0.3,v,'sawtooth');
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

var STAGES=[
 {name:'NEBULA',bg:BG1,bgm:'m',waves:[
   {t:0.6,type:0,n:5,form:'v',spd:105},
   {t:3.4,type:1,n:3,form:'line',spd:72},
   {t:6.4,type:2,n:4,form:'pincer',spd:82},
   {t:9.6,type:0,n:6,form:'snake',spd:92},
   {t:12.8,type:3,n:2,form:'turret',spd:58},
   {t:16.0,type:5,n:4,form:'dive',spd:150},
   {t:19.4,type:1,n:4,form:'line',spd:78},
   {t:22.6,type:4,n:2,form:'turret',spd:62},
   {t:25.8,type:2,n:6,form:'pincer',spd:86},
   {t:28.6,type:4,n:1,form:'mid',spd:55},
   {t:32.0,type:5,n:5,form:'v',spd:150},
   {t:35.4,type:2,n:6,form:'snake',spd:96},
   {t:38.8,type:3,n:3,form:'turret',spd:62},
   {t:42.2,type:1,n:6,form:'pincer',spd:88},
   {t:45.6,type:5,n:6,form:'dive',spd:158},
   {t:49.0,type:4,n:3,form:'line',spd:66},
   {t:52.4,type:0,n:5,form:'v',spd:108},
   {t:55.8,type:4,n:3,form:'line',spd:68},
   {t:59.2,type:2,n:6,form:'pincer',spd:88}
 ]},
 {name:'STATION',bg:BG2,bgm:'a',waves:[
   {t:0.6,type:1,n:4,form:'line',spd:76},
   {t:3.2,type:2,n:4,form:'pincer',spd:88},
   {t:6.2,type:4,n:2,form:'turret',spd:60},
   {t:9.4,type:0,n:6,form:'snake',spd:96},
   {t:12.6,type:5,n:5,form:'dive',spd:155},
   {t:15.8,type:3,n:2,form:'v',spd:62},
   {t:19.2,type:0,n:6,form:'snake',spd:100},
   {t:22.4,type:4,n:3,form:'turret',spd:64},
   {t:25.6,type:1,n:4,form:'line',spd:82},
   {t:28.6,type:3,n:1,form:'mid',spd:50},
   {t:32.0,type:5,n:6,form:'v',spd:155},
   {t:35.4,type:2,n:6,form:'pincer',spd:92},
   {t:38.8,type:4,n:3,form:'turret',spd:66},
   {t:42.2,type:1,n:6,form:'line',spd:84},
   {t:45.6,type:5,n:6,form:'dive',spd:162},
   {t:49.0,type:0,n:6,form:'snake',spd:104},
   {t:52.4,type:4,n:2,form:'turret',spd:68},
   {t:55.8,type:3,n:3,form:'v',spd:64},
   {t:59.2,type:5,n:6,form:'dive',spd:160}
 ]},
 {name:'COMET FIELD',bg:BG3,bgm:'b',waves:[
   {t:0.6,type:5,n:5,form:'v',spd:120},
   {t:3.2,type:2,n:6,form:'snake',spd:100},
   {t:6.2,type:4,n:3,form:'turret',spd:64},
   {t:9.4,type:3,n:3,form:'line',spd:66},
   {t:12.6,type:5,n:6,form:'dive',spd:165},
   {t:15.8,type:1,n:4,form:'pincer',spd:92},
   {t:19.2,type:4,n:3,form:'turret',spd:66},
   {t:22.4,type:0,n:6,form:'snake',spd:104},
   {t:25.6,type:3,n:3,form:'v',spd:68},
   {t:28.6,type:4,n:1,form:'mid',spd:55},
   {t:32.0,type:5,n:6,form:'v',spd:160},
   {t:35.4,type:2,n:6,form:'pincer',spd:96},
   {t:38.8,type:4,n:3,form:'turret',spd:68},
   {t:42.2,type:1,n:6,form:'line',spd:88},
   {t:45.6,type:5,n:6,form:'dive',spd:168},
   {t:49.0,type:0,n:6,form:'snake',spd:108},
   {t:52.4,type:3,n:3,form:'turret',spd:70},
   {t:55.8,type:1,n:5,form:'line',spd:86},
   {t:59.2,type:2,n:6,form:'pincer',spd:94}
 ]}
];
var WARMUP=[
 {t:0.8,type:0,n:3,form:'v',spd:88,noFire:true},
 {t:4.5,type:0,n:3,form:'line',spd:82,noFire:true},
 {t:8.0,type:0,n:4,form:'v',spd:94,noFire:false},
 {t:11.0,type:1,n:2,form:'line',spd:68,noFire:false}
];
var BRIDGE=[
 {t:12.5,type:0,n:4,form:'v',spd:100,aggr:0.7},
 {t:16.0,type:1,n:3,form:'line',spd:74,aggr:0.7},
 {t:19.5,type:2,n:3,form:'pincer',spd:80,aggr:0.7},
 {t:23.0,type:0,n:4,form:'snake',spd:90,aggr:0.7}
];
STAGES.forEach(function(st){
  st.waves=WARMUP.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};}).concat(
    BRIDGE.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:false,aggr:w.aggr};})
  ).concat(
    st.waves.map(function(w){return {t:w.t+26,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};})
  );
  var alts=['arc','cross','strafe','feint','orbit'];
  st.waves.forEach(function(w,i){
    if(i>7&&i%5===0) w.form=alts[Math.floor(i/5)%alts.length];
    if(i>9&&i%7===0) w.role='sniper';
    if(i>11&&i%9===0) w.role='suppressor';
  });
  if(st.waves[10]){st.waves[10].form='ring';st.waves[10].n=5;st.waves[10].type=2;st.waves[10].spd=78;}
  if(st.waves[16]){st.waves[16].form='escort';st.waves[16].n=5;st.waves[16].type=4;st.waves[16].spd=62;}
  st.waves.push({t:78.5,type:6,n:2,form:'cross',spd:86,noFire:false,aggr:1,role:'suppressor'});
  st.waves.sort(function(a,b){return a.t-b.t;});
});
var BOSSES=[
 {key:'b1_',name:'VOID SOVEREIGN',hp:1500,w:235,h:200,style:'octopus',move:'sine',patterns:[0,1],aim:3,ring:0,aimRate:1.8,ringRate:5.0,laserRate:7.5,laserN:1,ultRate:12.0,glow:['255,70,90','255,85,170','255,190,100']},
 {key:'b2_',name:'ABYSS DEVOURER',hp:1900,w:245,h:210,style:'dread',move:'wide',patterns:[1,0],aim:5,ring:16,aimRate:1.7,ringRate:5.4,laserRate:6.5,laserN:2,ultRate:11.0,glow:['150,105,255','190,90,255','255,120,235']},
 {key:'b3_',name:'HIVE',hp:2300,w:220,h:120,style:'hive',move:'dash',patterns:[0,1],aim:7,ring:20,aimRate:1.9,ringRate:4.6,laserRate:5.5,laserN:3,ultRate:10.0,glow:['255,160,70','255,120,60','255,215,120']}
];
var BOSS_PALETTES=[
 {main:'#ff3d63',light:'#ff9ab0',core:'#fff4f7',dark:'#3a0712',edge:'#8fe8ff',glow:'rgba(255,50,95,0.55)',beam:'#ff5f7a'},
 {main:'#a85cff',light:'#e0b4ff',core:'#fff4ff',dark:'#1e0838',edge:'#ff9ae6',glow:'rgba(168,80,255,0.55)',beam:'#c06aff'},
 {main:'#ff9a2e',light:'#ffd27a',core:'#fff8e0',dark:'#3a1604',edge:'#7fe7ff',glow:'rgba(255,150,40,0.50)',beam:'#7fe7ff'},
 {main:'#ffe6a0',light:'#fffdf0',core:'#ffffff',dark:'#5a3d12',edge:'#fffdf0',glow:'rgba(255,220,120,0.50)',beam:'#ffe7a0'}
];
function bossPalette(){
 var i=Math.max(0,Math.min(3,stage|0));
 return BOSS_PALETTES[i]||BOSS_PALETTES[0];
}
function bossBeamColor(){ return bossPalette().beam; }
var EB_CACHE={};
function ebSprite(pi,type){
 var key=pi+'_'+type;
 if(EB_CACHE[key]) return EB_CACHE[key];
 var p=BOSS_PALETTES[pi]||BOSS_PALETTES[0];
 var cv=document.createElement('canvas'),x=cv.getContext('2d');
 if(type===2){
  cv.width=cv.height=64; x.translate(32,32);
  x.shadowColor=p.glow; x.shadowBlur=16;
  x.fillStyle=p.main; x.beginPath(); x.arc(0,0,16,0,TAU); x.fill();
  x.shadowBlur=0;
  x.strokeStyle=p.dark; x.lineWidth=3; x.beginPath(); x.arc(0,0,16,0,TAU); x.stroke();
  x.strokeStyle=p.edge; x.lineWidth=2; x.beginPath(); x.arc(0,0,11,0,TAU); x.stroke();
  x.fillStyle=p.core; x.beginPath(); x.arc(0,0,6,0,TAU); x.fill();
  x.fillStyle='rgba(255,255,255,0.95)'; x.beginPath(); x.arc(-3,-4,2.4,0,TAU); x.fill();
 }else{
  cv.width=48; cv.height=96; x.translate(24,48);
  x.shadowColor=p.glow; x.shadowBlur=14;
  x.fillStyle=p.dark; x.beginPath(); x.moveTo(0,-40);x.lineTo(10,-2);x.lineTo(0,40);x.lineTo(-10,-2);x.closePath();x.fill();
  x.shadowBlur=8;
  x.fillStyle=p.main; x.beginPath(); x.moveTo(0,-34);x.lineTo(7,-4);x.lineTo(0,32);x.lineTo(-7,-4);x.closePath();x.fill();
  x.shadowBlur=0;
  x.fillStyle=p.light; x.beginPath(); x.moveTo(0,-28);x.lineTo(3,-5);x.lineTo(0,22);x.lineTo(-3,-5);x.closePath();x.fill();
  x.fillStyle=p.core; x.beginPath(); x.moveTo(0,-22);x.lineTo(1.5,-4);x.lineTo(0,14);x.lineTo(-1.5,-4);x.closePath();x.fill();
  x.fillStyle=p.edge; x.beginPath(); x.moveTo(-10,-2);x.lineTo(-18,4);x.lineTo(-8,8);x.closePath();x.fill();
  x.beginPath(); x.moveTo(10,-2);x.lineTo(18,4);x.lineTo(8,8);x.closePath();x.fill();
 }
 EB_CACHE[key]=cv; return cv;
}
var ET=[
 {hp:12,r:14,w:34,score:60,fire:2.2,kind:1,n:1},
 {hp:26,r:16,w:42,score:120,fire:2.0,kind:3,n:3},
 {hp:18,r:15,w:36,score:100,fire:2.6,kind:2,n:8},
 {hp:55,r:20,w:50,score:260,fire:2.4,kind:3,n:5},
 {hp:40,r:18,w:44,score:220,fire:1.8,kind:1,n:2},
 {hp:14,r:14,w:38,score:150,fire:2.8,kind:1,n:1},
 {hp:34,r:16,w:44,score:200,fire:2.2,kind:1,n:2}
];

for(var i=0;i<64;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:0.3+Math.random()*0.9});
for(var bi=1;bi<=3;bi++){
  var mi=new Image(); mi.src='assets/bg/stage'+bi+'-main.webp'; BG_MAIN[bi-1]=mi;
  var ei=new Image(); ei.src='assets/bg/stage'+bi+'-edge.webp'; BG_EDGE[bi-1]=ei;
}
for(var di=0;di<90;di++) bgDust.push({x:Math.random()*W,y:Math.random()*H,sp:220+Math.random()*190,len:1.5+Math.random()*4,a:0.18+Math.random()*0.45,c:Math.random()<0.55?'#cfefff':'#e7d8ff'});

function setStageBg(img){
  if(!img) return;
  bgPrev=null; bgCurrent=img; bgFade=0;
}
function stopBgm(){ if(bgmAudio){try{bgmAudio.pause();}catch(e){}} bgmName=''; }
function playBgm(k){
  if(muted||!BGMURL[k]) return;
  if(bgmName===k&&bgmAudio&&!bgmAudio.paused) return;
  if(!bgmAudio){ bgmAudio=new Audio(); bgmAudio.loop=true; bgmAudio.preload='auto'; }
  try{
    if(bgmAudio.__k!==k){ bgmAudio.pause(); bgmAudio.src=BGMURL[k]; bgmAudio.__k=k; }
    bgmAudio.volume=0.605;
    var pr=bgmAudio.play();
    if(pr&&pr.catch) pr.catch(function(){
      bgmPending=k;
      try{ if(bgmAudio.__k===k&&bgmAudio.src.indexOf('blob:')===0){ bgmAudio.src='data:audio/mpeg;base64,'+BGMSRC[k]; var p2=bgmAudio.play(); if(p2&&p2.catch)p2.catch(function(){}); } }catch(e){}
    });
  }catch(e){ bgmPending=k; }
  bgmName=k;
}
function rand(a,b){return a+Math.random()*(b-a);}
var lastBoomSfx=0;
function boom(x,y,sc){ fx.push({x:x,y:y,t:0,sc:sc||1,seed:Math.random()*TAU}); if(time-lastBoomSfx>0.045){lastBoomSfx=time;sfx('boom',Math.min(1.0,0.45+0.35*(sc||1)));} }
function part(x,y,col,n,sp){
  n=n||6; sp=sp||90;
  for(var i=0;i<n;i++){
    var a=Math.random()*TAU,v=sp*(0.3+Math.random());
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.35+Math.random()*0.45,col:col});
  }
}
function setBanner(txt,sub,t){ banner=txt; bannerSub=sub||''; bannerT=t; }

function startGame(){
  score=0; player.lives=3; player.hp=3; player.bombs=2; player.noBlink=false; player.power=1; player.weapon='normal'; player.specialPower=1; player.options=0; player.wingPower=1; player.trail=[]; player.wingEntry=[]; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0;
  stage=0; startStage(0);
}
function startStage(i){
  stage=i; stageT=0; waveIndex=0; nextTransport=24+Math.random()*10;
  enemies.length=0; bullets.length=0; ebullets.length=0; shots.length=0; fx.length=0; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0; player.trail=[];
  boss=null; runner=null;
  setStageBg(STAGES[i].bg);bgScroll=0;bgEdgeScroll=0;
  state='warpIn'; warpT=0.95; glowWarp=1.5; bombT=0; pickupT=0; pickupMsg='';
  player.x=target.x=W/2; player.y=H+90; target.y=H-130; player.invuln=2.0; player.bank=0;
  playBgm(STAGES[i].bgm);
  playWarpJet(0.8);
}
function startBossWarn(){
  stopBgm(); playAirRaid(0.55);
  state='bossWarn'; setBanner('WARNING',BOSSES[stage].name,2.8); player.invuln=0;
  ebullets.length=0; bullets.length=0; orbBullets.length=0;
  for(var i=0;i<enemies.length;i++){part(enemies[i].x,enemies[i].y,'#ffb066',6,120);boom(enemies[i].x,enemies[i].y,0.6);}
  enemies.length=0;
}
function spawnBoss(){
  var def=BOSSES[stage];
  boss={def:def,x:W/2,y:-130,hp:def.hp,max:def.hp,phase:0,invuln:1.2,entering:true,t:0,flash:0,patternIdx:0,patternT:0,aimT:0,ringT:0,laserT:0,hitFlash:0,hitX:W/2,hitY:180,ultT:def.ultRate-2.2,ultCharge:0,spiralT:0,spiralAng:0,broadT:0,blinkT:0};
  if(stage===2) repairAudio();
  state='boss'; playBgm('c'); setBossPattern(0);
}
function setBossPattern(idx){
  if(!boss||!specs) return;
  var list=boss.def.patterns, xi=list[idx%list.length];
  boss.patternIdx=idx%list.length; boss.patternT=0;
  runner=specs[xi].createRunner({
    rank:0.72+stage*0.04,target:player,speedRate:1.42+stage*0.08,
    createNewBullet:function(r){
      if(bullets.length>230) return;
      var b={r:r,x:r.x,y:r.y,rad:4.2,dead:false};
      r.onVanish=function(){b.dead=true;};
      bullets.push(b);
    }
  });
  runner.x=boss.x; runner.y=boss.y;
}
function bossPhase(p){
  for(var ub=beams.length-1;ub>=0;ub--) if(beams[ub].ult) beams.splice(ub,1);
  boss.phase=p; boss.invuln=1.6; boss.hitFlash=0; boss.ultT=boss.def.ultRate-2.2; boss.ultCharge=0; boss.spiralT=0; boss.broadT=0; boss.blinkT=0;
  boom(boss.x,boss.y,1.5); shake=Math.max(shake,10);
  setBanner('PHASE '+(p+1),boss.def.name,1.6);
  setBossPattern(0);
}
function bossAimed(n){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>260) return;
  var a=Math.atan2(player.y-boss.y,player.x-boss.x),sp=185+stage*8,spread=0.22;
  for(var i=0;i<n;i++){
    var ang=a+(i-(n-1)/2)*spread;
    ebullets.push({x:boss.x,y:boss.y+18,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,rad:6,type:1});
  }
  sfx('e_shot',0.20);
}
function bossRing(n){
  if(!boss||boss.invuln>0||n<=0) return;
  sfx('e_shot',0.17);
  if(bullets.length+ebullets.length>280) return;
  var sp=100+stage*8,gap=Math.random()*TAU;
  for(var i=0;i<n;i++){
    var a=i/n*TAU+time*0.25;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.55) continue;
    ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5.5,type:2});
  }
}
function bossSpiral(arms,dir,speed){
  if(!boss||boss.invuln>0) return;
  boss.spiralAng+=0.24*dir;
  for(var a=0;a<arms;a++){
    var ang=boss.spiralAng+a*TAU/arms;
    ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,rad:5,type:2});
  }
  sfx('e_shot',0.09);
}
function bossWall(){
  if(!boss||boss.invuln>0) return;
  var n=16,gap=2+Math.floor(Math.random()*(n-4));
  for(var i=0;i<n;i++){
    if(Math.abs(i-gap)<1) continue;
    ebullets.push({x:W*0.08+i*(W*0.84/(n-1)),y:boss.y+30,vx:0,vy:95+stage*6,rad:5.5,type:1});
  }
  sfx('e_shot',0.2);
}
function bossBroadside(){
  if(!boss||boss.invuln>0) return;
  spawnBeam(boss.x-78,boss.y+24,Math.PI/2,1600,20,1.2,0.42,1,bossBeamColor(),true,boss);
  spawnBeam(boss.x+78,boss.y+24,Math.PI/2,1600,20,1.2,0.42,1,bossBeamColor(),true,boss);
  shake=Math.max(shake,5);
}
function bossSwarm(){
  if(!boss||boss.invuln>0) return;
  for(var s=-1;s<=1;s++){
    var base=Math.atan2(player.y-boss.y,player.x-boss.x)+s*0.22;
    for(var k=0;k<3;k++){
      var a=base+(k-1.5)*0.10;
      ebullets.push({x:boss.x+s*62,y:boss.y+22,vx:Math.cos(a)*(150+stage*6),vy:Math.sin(a)*(150+stage*6),rad:5,type:1});
    }
  }
  sfx('e_shot',0.16);
}
function bossBlink(){
  if(!boss||boss.invuln>0) return;
  for(var k=0;k<12;k++) part(boss.x+rand(-50,50),boss.y+rand(-30,30),'#c58bff',2,180);
  boss.x=rand(80,W-80);boss.y=210+rand(-20,20);boss.invuln=0.45;
  for(var k=0;k<12;k++) part(boss.x+rand(-50,50),boss.y+rand(-30,30),'#c58bff',2,180);
  sfx('e_charge',0.3);
}
function bomb(){
  if((state!=='play'&&state!=='boss')||player.bombs<=0) return;
  player.bombs--; shake=24; bombT=1.1; bombX=player.x; bombY=player.y; player.invuln=Math.max(player.invuln,0.8); sfx('b_charge',0.55); sfx('bomb_big',0.95);
  for(var bp=0;bp<42;bp++) part(bombX,bombY,bp%2?'#bff4ff':'#ffd28a',1,320);
  for(var i=0;i<bullets.length;i++) part(bullets[i].x,bullets[i].y,'#9fe8ff',1,150);
  for(var i=0;i<ebullets.length;i++) part(ebullets[i].x,ebullets[i].y,'#9fe8ff',1,110);
  bullets.length=0; ebullets.length=0; beams.length=0; orbBullets.length=0;
  for(var i=enemies.length-1;i>=0;i--){
    enemies[i].hp-=999;
    if(enemies[i].hp<=0){ part(enemies[i].x,enemies[i].y,'#ffb066',10,180); boom(enemies[i].x,enemies[i].y,0.8); score+=ET[enemies[i].type].score; maybeDrop(enemies[i]); removeEnemy(i); }
  }
  if(boss){ boss.hp-=120; boss.flash=0.2; }
}
function hitPlayer(){
  if(player.invuln>0||state!=='play'&&state!=='boss') return;
  player.hp--;
  player.invuln=1.0; shake=10; sfx('hurt',0.5);
  for(var i=bullets.length-1;i>=0;i--){
    var dx=bullets[i].x-player.x,dy=bullets[i].y-player.y;
    if(dx*dx+dy*dy<110*110) bullets.splice(i,1);
  }
  for(var i=ebullets.length-1;i>=0;i--){
    var dx=ebullets[i].x-player.x,dy=ebullets[i].y-player.y;
    if(dx*dx+dy*dy<110*110) ebullets.splice(i,1);
  }
  part(player.x,player.y,'#ffba6a',10,160);
  if(player.hp<=0){
    player.lives--; player.hp=3; player.invuln=2.2; shake=18;
    player.specialPower=Math.max(1,player.specialPower-1); player.power=player.specialPower; player.bombs=2; player.options=0; player.wingEntry=[];
    rebuildSfxBus();
    boom(player.x,player.y,1.2);
    if(player.lives<=0){ state='over'; playBgm('m'); }
  }
}
function removeEnemy(idx){
  var e=enemies[idx];if(!e) return;
  for(var b=beams.length-1;b>=0;b--) if(beams[b].owner===e) beams.splice(b,1);
  for(var o=orbBullets.length-1;o>=0;o--) if(orbBullets[o].owner===e) orbBullets.splice(o,1);
  enemies.splice(idx,1);
}
function maybeDrop(e){
  if(e.transport){
    items.push({x:e.x-24,y:e.y,vy:45,type:'P',t:0});
    items.push({x:e.x,y:e.y,vy:45,type:'A',t:0});
    items.push({x:e.x+24,y:e.y,vy:45,type:'W',t:0});
    items.push({x:e.x,y:e.y+16,vy:45,type:'B',t:0});
    if(Math.random()<0.28) items.push({x:e.x+12,y:e.y+24,vy:40,type:'1UP',t:0});
    return;
  }
  if(e.transport) return;
  if(e.elite){
    items.push({x:e.x-20,y:e.y,vy:50,type:'W',t:0});
    items.push({x:e.x+20,y:e.y,vy:50,type:'A',t:0});
    if(Math.random()<0.22) items.push({x:e.x,y:e.y+20,vy:45,type:'1UP',t:0});
    return;
  }
  var chance=[0.10,0.14,0.16,0.35,0.28,0.14][e.type]||0.10;
  if(!e.first && Math.random()>=chance) return;
  var r=Math.random(),type;
  if(r<0.38) type='P';
  else if(r<0.72) type='A';
  else if(r<0.86) type='W';
  else if(r<0.97) type='B';
  else type='1UP';
  if(e.first && type==='B') type='A';
  items.push({x:e.x,y:e.y,vy:55,type:type,t:0});
}
function ammoType(it){ return ['N','S','L','M'][Math.floor(it.t/1.2)%4]; }
function applySpecial(t){
  player.weapon=t==='N'?'normal':(t==='S'?'spread':(t==='L'?'laser':(t==='M'?'missile':t)));
}
function collectItem(it){
  var t=it.type;
  if(t==='P'){ player.specialPower=Math.min(4,player.specialPower+1); player.power=player.specialPower; score+=50; }
  else if(t==='A'){ applySpecial(ammoType(it)); score+=70; }
  else if(t==='S'||t==='L'||t==='M'){ applySpecial(t); score+=80; }
  else if(t==='W'){ addWingman(); score+=40; }
  else if(t==='1UP'){ player.lives=Math.min(5,player.lives+1); score+=250; }
  else { player.bombs=Math.min(3,player.bombs+1); score+=30; }
  part(it.x,it.y,'#9fe8ff',10,120);
  sfx('pickup_real',0.48); if(t==='1UP') sfx('1up',0.3);
  pickupT=1.3;
  if(t==='P') pickupMsg='POWER LV'+player.specialPower+(player.specialPower>=4?' MAX':'');
  else if(t==='A') pickupMsg=weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':'');
  else if(t==='S'||t==='L'||t==='M') pickupMsg=weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':'');
  else if(t==='W') pickupMsg='WING '+player.options+' P'+player.wingPower;
  else if(t==='1UP') pickupMsg='1UP  LIFE +1';
  else pickupMsg='BOMB +1';
}
function weaponName(){ return ({normal:'NORMAL',none:'NONE',spread:'SPREAD',laser:'LASER',missile:'MISSILE'})[player.weapon]||'NORMAL'; }
function addShot(x,y,vx,vy,dmg,wing,laser,special,max){ shots.push({x:x,y:y,vx:vx,vy:vy,dmg:dmg,wing:!!wing,laser:!!laser,special:!!special,max:!!max}); }
function fireNormal(){
  var lv=player.specialPower;
  if(lv<=1){ addShot(player.x-10,player.y-22,0,-900,3); addShot(player.x+10,player.y-22,0,-900,3); }
  else if(lv===2){ addShot(player.x-12,player.y-22,0,-900,3); addShot(player.x,player.y-26,0,-900,3); addShot(player.x+12,player.y-22,0,-900,3); }
  else if(lv===3){ addShot(player.x-20,player.y-18,-90,-880,2.6); addShot(player.x-7,player.y-24,0,-920,2.6); addShot(player.x+7,player.y-24,0,-920,2.6); addShot(player.x+20,player.y-18,90,-880,2.6); }
  else {
    for(var i=-2;i<=2;i++) addShot(player.x+i*13,player.y-22,0,-930,3.2,false,false,false,true);
    addShot(player.x-24,player.y-16,-110,-860,4.5,false,false,false,true);
    addShot(player.x+24,player.y-16,110,-860,4.5,false,false,false,true);
  }
}
function fireSpread(){
  var n=3+(player.specialPower-1)*2,spread=0.13,sp=860;
  for(var i=0;i<n;i++){
    var a=(i-(n-1)/2)*spread;
    addShot(player.x,player.y-20,Math.sin(a)*sp,-Math.cos(a)*sp,player.specialPower>=4?2.6:1.8,false,false,true,player.specialPower>=4);
  }
}
function spawnMissile(x,y,wing,dmg,max){
  missiles.push({x:x,y:y,vx:wing?0:0,vy:52,t:0,ignite:0.2,life:2.8,dmg:dmg||6,wing:!!wing,max:!!max,ignited:false});
}
function launchMissiles(){
  var n=player.specialPower;
  for(var i=0;i<n;i++){
    var x=player.x+(i-(n-1)/2)*14;
    spawnMissile(x,player.y-16,false,player.specialPower>=4?8:6,player.specialPower>=4);
  }
  playMissileLaunch();
}
function fireWingLaser(p,wp,max){
  var w=4+wp*1.5,dmg=(1.0+wp*0.4)*(max?1.5:1);
  var target=null,tIdx=-1,tY=0,isBoss=false;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-p.x)<w/2+enemyW(e)*0.3&&e.y<p.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-p.x)<w/2+boss.def.w*0.22&&boss.y<p.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  if(target){
    if(isBoss){boss.hp-=dmg*0.5;boss.hitFlash=0.1;boss.hitX=p.x;boss.hitY=boss.y+16;}
    else{target.hp-=dmg;target.flash=0.1;if(target.hp<=0){score+=ET[target.type].score;boom(target.x,target.y,0.6);maybeDrop(target);removeEnemy(tIdx);}}
  }
  wingBeams.push({x:p.x,y:p.y-8,endY:target?tY:0,t:0,life:0.16,w:w,max:!!max});
  sfx('p_laser',0.10);
}
function updateWingBeams(dt){
  for(var i=wingBeams.length-1;i>=0;i--){wingBeams[i].t+=dt;if(wingBeams[i].t>=wingBeams[i].life)wingBeams.splice(i,1);}
}
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
function spawnBeam(x,y,ang,len,w,charge,fire,dmg,color,big,owner,ult){
  if(beams.length>8) return;
  if(owner&&owner!==boss&&(owner.hp<=0||enemies.indexOf(owner)<0)) return;
  if(owner===boss&&(!boss||boss.hp<=0)) return;
  beams.push({x:x,y:y,ang:ang,len:len,w:w,t:0,charge:charge,fire:fire,dmg:dmg,color:color||bossBeamColor(),fired:false,fade:0.15,owner:owner||null,ult:!!ult,offX:owner?(x-owner.x):0,offY:owner?(y-owner.y):0});
  sfx(big?'b_charge':'e_charge',big?0.38:0.22);
}
function bossLaser(){
  if(!boss||boss.invuln>0) return;
  var n=boss.def.laserN||1,a=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<n;i++) spawnBeam(boss.x,boss.y+10,a+(i-(n-1)/2)*0.18,1500,22,1.3,0.45,1,bossBeamColor(),true,boss);
  sfx('laser',0.06);
}
function laserDamage(dt){
  laserTick-=dt; if(laserTick>0) return; laserTick=0.08;
  var w=8+Math.min(player.specialPower,3)*5,dmg=2+player.specialPower*2;
  var target=null,tIdx=-1,tY=0;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-player.x)<w/2+enemyW(e)*0.32&&e.y<player.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  var isBoss=false;
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-player.x)<w/2+boss.def.w*0.24&&boss.y<player.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  laserHitY=target?tY:0;laserHitT=target?0.12:0;
  if(!target) return;
  if(isBoss){
    boss.hp-=dmg*0.7;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+20;sfx('b_hit',0.22);
    if(time-lastHitSfx>0.12){lastHitSfx=time;sfx('b_hit',0.1);}
  }else{
    var et=ET[target.type];target.hp-=dmg;target.flash=0.1;sfx('e_hit',0.12);
    if(target.hp<=0){score+=et.score;part(target.x,target.y,'#ffb066',9,160);boom(target.x,target.y,0.75);maybeDrop(target);removeEnemy(tIdx);}
  }
}
function optionBasePos(i){
  var idx=20+i*22,p=player.trail[Math.min(idx,player.trail.length-1)];
  if(!p||Math.hypot(p.x-player.x,p.y-player.y)<16) p={x:player.x+(i===0?-30:30),y:player.y-8};
  return p;
}
function optionPos(i){
  var e=player.wingEntry[i];
  if(e&&e.t<e.dur) return {x:e.x,y:e.y};
  return optionBasePos(i);
}
function addWingman(){
  if(player.options<2){
    var i=player.options,side=i%2===0?-1:1;
    player.wingEntry[i]={x:side<0?-50:W+50,y:rand(180,H*0.65),t:0,dur:0.8};
    player.options++;
  }else player.wingPower=Math.min(3,player.wingPower+1);
}
function updateWingEntries(dt){
  for(var i=0;i<player.options;i++){
    var e=player.wingEntry[i];if(!e||e.t>=e.dur) continue;
    e.t+=dt;var p=optionBasePos(i),k=Math.min(1,dt*8);
    e.x+=(p.x-e.x)*k;e.y+=(p.y-e.y)*k;
  }
}
function wingmanBlock(x,y,rad){
  if(player.options<=0) return false;
  for(var i=0;i<player.options;i++){
    var p=optionPos(i);
    if(Math.hypot(x-p.x,y-p.y)<18+(rad||5)){
      player.options--;player.wingEntry.splice(i,1);part(p.x,p.y,'#7fe7ff',14,170);boom(p.x,p.y,0.45);sfx('e_hit',0.3);
      pickupT=0.9;pickupMsg='WINGMAN LOST';return true;
    }
  }
  return false;
}
function updateOptions(dt){
  if(player.options<=0) return;
  if(state!=='play'&&state!=='boss') return;
  optionT-=dt;
  if(optionT<=0){
    optionT=player.weapon==='laser'?0.22:0.24;
    for(var i=0;i<player.options;i++){
      var we=player.wingEntry[i];if(we&&we.t<we.dur) continue;
      var p=optionPos(i),wp=player.wingPower,max=player.specialPower>=4;
      if(player.weapon==='spread'){
        var n=2+wp;
        for(var j=0;j<n;j++){
          var a=(j-(n-1)/2)*0.16;
          addShot(p.x,p.y-8,Math.sin(a)*820,-Math.cos(a)*820,max?1.7:1.2,true,false,false,max);
        }
      }else if(player.weapon==='laser'){
        fireWingLaser(p,wp,player.specialPower>=4);
      }else if(player.weapon==='missile'){
        spawnMissile(p.x,p.y-6,true,max?4:3,max);
      }else{
        var n2=1+wp;
        for(var j=0;j<n2;j++) addShot(p.x+(j-(n2-1)/2)*6,p.y-8,0,-900,max?1.7:1.2,true,false,false,max);
      }
    }
  }
}
function updateMissiles(dt){
  for(var i=missiles.length-1;i>=0;i--){
    var m=missiles[i];m.t+=dt;m.life-=dt;
    if(m.t<m.ignite){
      m.vy+=260*dt;m.vx*=0.96;m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(m.life<=0||m.y>H+30) missiles.splice(i,1);
      continue;
    }
    if(!m.ignited){m.ignited=true;m.vy=-180;m.vx*=0.5;part(m.x,m.y,'#ffd28a',4,90);}
    var tx=null,ty=null,best=1e9;
    for(var j=0;j<enemies.length;j++){
      var dx=enemies[j].x-m.x,dy=enemies[j].y-m.y,d2=dx*dx+dy*dy;
      if(d2<best){best=d2;tx=enemies[j].x;ty=enemies[j].y;}
    }
    if(boss&&state==='boss'){
      var bx=boss.x-m.x,by=boss.y-m.y,b2=bx*bx+by*by;
      if(b2<best){best=b2;tx=boss.x;ty=boss.y;}
    }
    if(tx!==null){
      var des=Math.atan2(ty-m.y,tx-m.x),cur=Math.atan2(m.vy,m.vx),diff=Math.atan2(Math.sin(des-cur),Math.cos(des-cur));
      cur+=Math.max(-4.5*dt,Math.min(4.5*dt,diff));
      m.vx=Math.cos(cur)*380;m.vy=Math.sin(cur)*380;
    }else{m.vy=Math.min(m.vy, -300);}
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    var hit=false;
    for(var j=enemies.length-1;j>=0;j--){
      var e=enemies[j],et=ET[e.type];
      if(Math.abs(m.x-e.x)<enemyW(e)*0.45&&Math.abs(m.y-e.y)<enemyW(e)*0.5){
        e.hp-=m.dmg;e.flash=0.1;hit=true;sfx('e_hit',0.20);boom(m.x,m.y,0.5);
        if(e.hp<=0){score+=et.score;part(e.x,e.y,'#ffb066',9,160);boom(e.x,e.y,0.75);maybeDrop(e);removeEnemy(j);}
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0&&Math.abs(m.x-boss.x)<boss.def.w*0.32&&Math.abs(m.y-boss.y)<boss.def.h*0.36){
      boss.hp-=m.dmg;boss.hitFlash=0.14;boss.hitX=m.x;boss.hitY=m.y;hit=true;score+=5;sfx('b_hit',0.30);boom(m.x,m.y,0.6);
      part(m.x,m.y,'#ffd28a',3,80);
    }
    if(hit||m.life<=0||m.x<-30||m.x>W+30||m.y<-40||m.y>H+40) missiles.splice(i,1);
  }
}
function updateBeams(dt){
  for(var i=beams.length-1;i>=0;i--){
    var b=beams[i];b.t+=dt;
    if(b.owner){var alive=(b.owner===boss)?!!(boss&&boss.hp>0):(enemies.indexOf(b.owner)>=0&&b.owner.hp>0);if(!alive){beams.splice(i,1);continue;}
      if(b.t<b.charge+b.fire){var oo=b.owner;b.x=oo.x+b.offX;b.y=oo.y+b.offY;}
    }
    if(!b.fired&&b.t>=b.charge){b.fired=true;sfx('laser_fire',b.w>16?0.50:0.38);}
    if(b.t>b.charge&&b.t<=b.charge+b.fire){
      var dx=player.x-b.x,dy=player.y-b.y;
      var proj=dx*Math.cos(b.ang)+dy*Math.sin(b.ang);
      var perp=Math.abs(-dx*Math.sin(b.ang)+dy*Math.cos(b.ang));
      if(proj>0&&proj<b.len&&perp<b.w/2+player.r) hitPlayer();
    }
    if(b.t>b.charge+b.fire+(b.fade||0.15)) beams.splice(i,1);
  }
}


function spawnTransport(){
  var side=Math.random()<0.5?-1:1;
  enemies.push({type:3,x:side<0?-70:W+70,y:135,baseX:W/2,mode:'transport',vx:side*95,hp:180+stage*40,max:180+stage*40,t:0,phase:0,spd:0,fireT:999,flash:0,transport:true,first:false});
}
function spawnWave(w){
  if(w.form==='mid'){
    var mhp=320+stage*80;
    enemies.push({type:w.type,x:W/2,y:-60,baseX:W/2,tx:W/2,ty:250,mode:'turret',entering:true,t:0,phase:0,spd:80,hp:mhp,max:mhp,fireT:1.0,flash:0,elite:true,visT:0,first:true});
    return;
  }
  if(w.form==='escort'){
    var lead={type:w.type||4,x:W/2,y:-70,baseX:W/2,tx:W/2,ty:230,mode:'escortLead',entering:false,t:0,phase:0,spd:w.spd||65,hp:Math.round(ET[w.type||4].hp*2.2),max:Math.round(ET[w.type||4].hp*2.2),fireT:1.2,flash:0,noFire:false,aggr:1,role:'',visT:0,elite:true,first:true};
    enemies.push(lead);
    for(var k=0;k<4;k++){
      var ch={type:k%2?5:0,x:lead.x,y:lead.y,baseX:lead.x,tx:lead.x,ty:lead.y,mode:'escortOrbit',leader:lead,entering:false,t:0,phase:k/4*TAU,spd:90,hp:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),max:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),fireT:1.0+k*0.2,flash:0,noFire:false,aggr:0.8,role:'',visT:0,first:false};
      enemies.push(ch);
    }
    return;
  }
  var n=w.n;
  for(var i=0;i<n;i++){
    var x,y,baseX,tx,ty,mode='down',vx=0,vy=0;
    if(w.form==='v'){ x=W/2+(i-(n-1)/2)*32; y=-50-i*16; baseX=x; }
    else if(w.form==='line'){ x=W*0.15+i*(W*0.7/Math.max(1,n-1)); y=-50-i*12; baseX=x; }
    else if(w.form==='snake'){ x=W/2; y=-50-i*28; baseX=W/2; mode='snake'; }
    else if(w.form==='pincer'){
      var side=i%2?-1:1; x=side<0?-30:W+30; y=110+Math.floor(i/2)*34;
      tx=W/2+side*60; ty=220+Math.floor(i/2)*18; baseX=tx; mode='pincer';
    }
    else if(w.form==='turret'){ x=W*0.2+i*(W*0.6/Math.max(1,n-1)); y=-50; tx=x; ty=230+i*12; baseX=x; mode='turret'; }
    else if(w.form==='arc'){ var sd=i%2?-1:1; x=sd<0?-30:W+30; y=60+i*22; tx=W/2+sd*42; ty=200+i*18; baseX=tx; mode='arc'; }
    else if(w.form==='cross'){ var cr=i%4; x=(cr%2?W+30:-30); y=(cr<2?-30:110); tx=W/2; ty=H*0.5; baseX=x; mode='cross'; }
    else if(w.form==='strafe'){ var ss=i%2?-1:1; x=ss<0?-30:W+30; y=145+i*24; baseX=x; mode='strafe'; vx=ss*(95+stage*8); }
    else if(w.form==='feint'){ x=W*0.2+i*(W*0.6/Math.max(1,n-1)); y=-50; baseX=x; mode='feint'; }
    else if(w.form==='orbit'){ var oa=i/n*TAU,ox=W/2+Math.cos(oa)*150,oy=280+Math.sin(oa)*80,sd=Math.cos(oa)<0?-1:1; x=sd<0?-45:W+45; y=oy; tx=ox; ty=oy; baseX=W/2; mode='orbitEnter'; }
    else if(w.form==='ring'){ var ra=i/n*TAU; x=W/2+(i-(n-1)/2)*26; y=-55-i*14; tx=W/2+Math.cos(ra)*110; ty=H*0.33+Math.sin(ra)*85; baseX=W/2; mode='ringEnter'; }
    else { x=W/2+(i-(n-1)/2)*40; y=-50; baseX=x; mode='dive'; }
    var ehp=Math.round(ET[w.type].hp*(1+stage*0.18));
    var e={type:w.type,x:x,y:y,baseX:baseX,tx:tx,ty:ty,mode:mode,entering:(mode==='pincer'||mode==='turret'||mode==='orbitEnter'||mode==='ringEnter'),t:0,phase:i*0.7,spd:w.spd,hp:ehp,max:ehp,fireT:0.8+Math.random()*0.8,flash:0,noFire:!!w.noFire,aggr:w.aggr||1,role:w.role||'',visT:0,first:(i===0&&waveIndex%2===0)};
    if(mode==='dive'){
      var a=Math.atan2(player.y-y,player.x-x);
      e.vx=Math.cos(a)*w.spd; e.vy=Math.sin(a)*w.spd;
    }
    if(mode==='cross'){
      var ca=Math.atan2(H*0.55-y,W/2-x);e.vx=Math.cos(ca)*w.spd;e.vy=Math.sin(ca)*w.spd;
    }
    enemies.push(e);
    if(e.type===6){for(var ok=0;ok<8;ok++) orbBullets.push({owner:e,ang:ok/8*TAU,r:50,spin:1.15,rad:4,type:2});}
  }
}
function enemyW(e){ return ET[e.type].w*(MIRROR_TYPES[e.type]?1.5:1)*(e.transport?1.45:(e.elite?1.58:1)); }
function fireEnemy(e){
  if(e.transport) return;
  if(e.visT!==undefined&&e.visT<0.22) return;
  if(bullets.length+ebullets.length>240) return;
  var ra=Math.atan2(player.y-e.y,player.x-e.x);
  if(e.type===6){
    if(beams.length<4){
      spawnBeam(e.x-15,e.y+4,ra,1500,9,0.75,0.35,1,bossBeamColor(),false,e);
      spawnBeam(e.x+15,e.y+4,ra,1500,9,0.75,0.35,1,bossBeamColor(),false,e);
    }
    sfx('e_charge',0.22);return;
  }
  if(e.role==='sniper'){
    ebullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*245,vy:Math.sin(ra)*245,rad:5,type:1});
    sfx('e_shot',0.2);return;
  }
  if(e.role==='suppressor'){
    for(var ri=-1;ri<=1;ri++){var rA=ra+ri*0.13;ebullets.push({x:e.x,y:e.y,vx:Math.cos(rA)*175,vy:Math.sin(rA)*175,rad:5,type:1});}
    sfx('e_shot',0.2);return;
  }
  var et=ET[e.type],a=Math.atan2(player.y-e.y,player.x-e.x),sp=(140+stage*10)*(e.aggr||1);
  if(e.elite){
    if(beams.length<4&&Math.random()<0.28) spawnBeam(e.x,e.y,a,1500,18,1.0,0.4,1,bossBeamColor(),false,e);
    for(var i=0;i<10;i++){var ang=i/10*TAU+time*0.2;ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*95,vy:Math.sin(ang)*95,rad:5.5,type:2});}
    for(var i=0;i<3;i++){var ang=a+(i-1)*0.18;ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*180,vy:Math.sin(ang)*180,rad:6,type:1});}
    sfx('e_shot',0.16);
    return;
  }
  if((e.type===3||e.type===4)&&beams.length<5&&Math.random()<0.38){
    spawnBeam(e.x,e.y,a,1500,15,1.0,0.38,1,bossBeamColor(),false,e);
    return;
  }
  if(et.kind===2){
    var rn=Math.max(1,Math.round(et.n*(e.aggr||1)));
    for(var i=0;i<rn;i++){
      var ang=i/rn*TAU+time*0.2;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp*0.8,vy:Math.sin(ang)*sp*0.8,rad:5,type:2});
    }
  }else{
    sfx('e_shot',0.17);
    var spread=(et.kind===3)?0.28:0.16;
    var bn=Math.max(1,Math.round(et.n*(e.aggr||1)));
    for(var i=0;i<bn;i++){
      var ang=a+(i-(bn-1)/2)*spread;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,rad:5,type:1});
    }
  }
}

function primeDreadUltimate(){
  if(!boss) return;
  var bx1=Math.max(70,boss.x-88),bx2=Math.min(W-70,boss.x+88);
  spawnBeam(bx1,boss.y+20,Math.PI/2,1700,24,1.3,0.55,1,bossBeamColor(),true,boss,true);
  spawnBeam(bx2,boss.y+20,Math.PI/2,1700,24,1.3,0.55,1,bossBeamColor(),true,boss,true);
}
function beginBossUltimate(){
  if(!boss) return;
  boss.ultT=0;boss.ultCharge=1.3;
  setBanner(ultimateName(boss.def),boss.def.name,1.5);
  sfx('b_charge',0.46);
  if(boss.def.style==='dread') primeDreadUltimate();
}
function ultimateName(def){
  return def.style==='octopus'?'TENTACLE CAGE':(def.style==='dread'?'LASER CURTAIN':'SWARM SINGULARITY');
}
function ultOctopus(){
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var r=0;r<5;r++){
    var n=24+r*3,sp=88+r*20,gw=0.56,gapR=gap+r*0.28;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+r*0.24,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
      if(Math.abs(da)<gw/2) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5.5,type:2});
    }
  }
  for(var i=0;i<4;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-1.5)*0.13;
    ebullets.push({x:boss.x,y:boss.y+12,vx:Math.cos(aa)*205,vy:Math.sin(aa)*205,rad:6,type:1});
  }
}
function ultDread(){
  shake=Math.max(shake,12);
  for(var w=0;w<2;w++){
    var y=H*(0.30+w*0.22),n=18,sp=62+w*16;
    for(var i=0;i<n;i++){
      var x=W*0.06+i*(W*0.88/(n-1));
      if(Math.abs(x-W/2)<58) continue;
      ebullets.push({x:x,y:y,vx:0,vy:sp,rad:5.5,type:1});
    }
  }
  for(var i=0;i<7;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-3)*0.10;
    ebullets.push({x:boss.x,y:boss.y+16,vx:Math.cos(aa)*185,vy:Math.sin(aa)*185,rad:6,type:1});
  }
}
function ultHive(){
  var origins=[{x:boss.x-70,y:boss.y+18},{x:boss.x+70,y:boss.y+18},{x:boss.x,y:boss.y+8}];
  for(var o=0;o<origins.length;o++){
    var ox=origins[o].x,oy=origins[o].y,base=Math.atan2(player.y-oy,player.x-ox);
    for(var r=0;r<2;r++){
      var n=16,sp=92+r*34,gw=0.62,gapR=base+r*0.18;
      for(var i=0;i<n;i++){
        var a=i/n*TAU+r*0.2,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
        if(Math.abs(da)<gw/2) continue;
        ebullets.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:2});
      }
    }
  }
  for(var i=0;i<3;i++){
    var aa=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-1)*0.16;
    ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(aa)*230,vy:Math.sin(aa)*230,rad:6,type:1});
  }
}
function bossUltimate(){
  if(!boss) return;
  if(boss.def.style==='octopus') ultOctopus();
  else if(boss.def.style==='dread') ultDread();
  else ultHive();
  shake=16;sfx('laser_fire',0.50);
}
function step(dt){
  time+=dt;
  setLaserSound(player.weapon==='laser'&&(state==='play'||state==='boss'));
  for(var i=0;i<parts.length;i++){var p=parts[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.98;p.vy*=0.98;}
  for(var i=parts.length-1;i>=0;i--) if(parts[i].life<=0) parts.splice(i,1);
  for(var i=0;i<fx.length;i++) fx[i].t+=dt;
  for(var i=fx.length-1;i>=0;i--) if(fx[i].t>0.6) fx.splice(i,1);
  for(var i=0;i<stars.length;i++){stars[i].y+=(18+stars[i].z*40)*dt;if(stars[i].y>H+4){stars[i].y=-4;stars[i].x=Math.random()*W;}}
  if(state!=='menu'){
    bgScroll+=82*dt; bgEdgeScroll+=165*dt;
    for(var di=0;di<bgDust.length;di++){var dp=bgDust[di];dp.y+=dp.sp*dt;if(dp.y>H+6){dp.y=-6;dp.x=Math.random()*W;}}
  }
  if(shake>0) shake=Math.max(0,shake-dt*40);
  if(bgFade>0) bgFade=Math.max(0,bgFade-dt/1.4);
  if(bombT>0) bombT=Math.max(0,bombT-dt);
  if(pickupT>0) pickupT=Math.max(0,pickupT-dt);
  if(laserHitT>0) laserHitT=Math.max(0,laserHitT-dt);
  if(stageFlash>0) stageFlash=Math.max(0,stageFlash-dt/0.6);
  if(stageWarp>0) stageWarp=Math.max(0,stageWarp-dt/1.5);
  if(state==='menu'||state==='win'||state==='over') return;

  if(state==='warpOut'){
    warpT-=dt; warpSpeed+=1100*dt; player.y-=warpSpeed*dt; player.x=W/2;
    if(warpT<=0){
      if(stage<STAGES.length-1) startStage(stage+1);
      else state='win';
    }
    return;
  }
  if(state==='warpIn'){
    warpT-=dt; var wp=Math.min(1,1-warpT/0.95);
    player.x=W/2; player.y=H+90-(H+90-(H-130))*wp; target.x=player.x; target.y=player.y;
    if(warpT<=0){
      state='intro'; setBanner('STAGE '+(stage+1),STAGES[stage].name,1.4); bannerT=1.4; player.y=H-130;
    }
    return;
  }
  var sp=340,dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);
  if(d>0.5){var mv=Math.min(d,sp*dt);player.x+=dx/d*mv;player.y+=dy/d*mv;}
  player.x=Math.max(16,Math.min(W-16,player.x)); player.y=Math.max(110,Math.min(H-56,player.y));
  player.bank+=((dx*0.004)-player.bank)*Math.min(1,dt*8);
  if(player.invuln>0) player.invuln-=dt;
  player.trail.unshift({x:player.x,y:player.y}); if(player.trail.length>140) player.trail.pop();

  if(state==='play'||state==='boss'){
    if(player.weapon==='spread'){
      if(time-lastSpecial>0.16){ lastSpecial=time; fireSpread(); sfx('p_spread',0.36); }
    }else if(player.weapon==='laser'){
      laserDamage(dt);
    }else if(player.weapon==='missile'){
      if(time-lastMissile>0.46){ lastMissile=time; launchMissiles(); }
    }else{
      if(time-lastShot>0.10){ lastShot=time; fireNormal(); if(Math.random()<0.7) sfx('p_normal',0.34); }
    }
  }
  if(bannerT>0) bannerT-=dt;
  if(state==='intro'){
    if(bannerT<=0){ state='play'; stageT=0; }
  }else if(state==='play'){
    stageT+=dt;
    var waves=STAGES[stage].waves;
    while(waveIndex<waves.length&&waves[waveIndex].t<=stageT){ spawnWave(waves[waveIndex]); waveIndex++; }
    if(stageT>nextTransport&&!enemies.some(function(e){return e.transport;} )){ if(Math.random()<0.55) spawnTransport(); nextTransport=stageT+22+Math.random()*10; }
    if(waveIndex>=waves.length&&(enemies.length===0||stageT>waves[waves.length-1].t+8)) startBossWarn();
  }else if(state==='bossWarn'){
    if(bannerT<=0) spawnBoss();
  }else if(state==='clear'){
    if(bannerT<=0){
      if(stage<STAGES.length-1){ state='warpOut'; warpT=1.1; warpSpeed=320; playWarpJet(0.9); }
      else { state='win'; playBgm('m'); }
    }
  }

  for(var i=shots.length-1;i>=0;i--){
    var s=shots[i]; s.x+=(s.vx||0)*dt; s.y+=s.vy*dt;
    if(s.y<-20){shots.splice(i,1);continue;}
    var hit=false;
    for(var j=enemies.length-1;j>=0;j--){
      var e=enemies[j],et=ET[e.type];
      if(Math.abs(s.x-e.x)<enemyW(e)*0.45&&Math.abs(s.y-e.y)<enemyW(e)*0.5){
        e.hp-=s.dmg; e.flash=0.1; hit=true; sfx('e_hit',0.20);
        if(e.hp<=0){ score+=et.score; part(e.x,e.y,'#ffb066',9,160); boom(e.x,e.y,0.75); maybeDrop(e); removeEnemy(j); }
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0){
      if(Math.abs(s.x-boss.x)<boss.def.w*0.30&&Math.abs(s.y-boss.y)<boss.def.h*0.34){
        boss.hp-=s.dmg; boss.flash=0.1; boss.hitFlash=0.14; boss.hitX=s.x; boss.hitY=s.y; score+=5; hit=true; sfx('b_hit',0.30);
        part(s.x,s.y,'#ffd28a',2,70);
        if(time-lastHitSfx>0.06){lastHitSfx=time;sfx('b_hit',0.22);}
      }
    }
    if(hit||s.y<-20) shots.splice(i,1);
  }

  for(var i=enemies.length-1;i>=0;i--){
    var e=enemies[i]; e.t+=dt; if(e.flash>0) e.flash-=dt;
    if(e.mode==='escortLead'){
      e.y+=e.spd*dt;
      var ep=Math.max(0,Math.min(1,e.y/e.ty));
      e.x=W/2+Math.sin(e.t*0.7)*90*ep;
      if(e.y>=e.ty) e.y=e.ty;
      if(e.t>14){e.mode='down';e.baseX=e.x;}
    }
    else if(e.mode==='escortOrbit'){
      if(!e.leader||e.leader.hp<=0||enemies.indexOf(e.leader)<0){e.mode='down';e.baseX=e.x;}
      else{e.x=e.leader.x+Math.cos(e.phase+e.t*1.25)*58;e.y=e.leader.y+Math.sin(e.phase+e.t*1.25)*34;}
    }
    else if(e.mode==='transport'){ e.x+=e.vx*dt; e.y=135+Math.sin(e.t*1.5)*8; }
    else if(e.mode==='arc'&&e.entering){
      var ax=e.tx-e.x,ay=e.ty-e.y,ad=Math.hypot(ax,ay);
      if(ad<6){e.entering=false;e.mode='down';e.y=e.ty;e.baseX=e.x;}
      else{e.x+=ax/ad*e.spd*2*dt;e.y+=ay/ad*e.spd*2*dt;}
    }else if(e.mode==='cross'){ e.x+=e.vx*dt; e.y+=e.vy*dt; }
    else if(e.mode==='strafe'){ e.x+=e.vx*dt; e.y+=Math.sin(e.t*2)*18*dt; }
    else if(e.mode==='feint'){
      e.y+=e.spd*dt;
      if(e.t>1.8){e.mode='retreat';e.vy=-e.spd*1.4;}
    }else if(e.mode==='retreat'){ e.y+=e.vy*dt; e.x+=Math.sin(e.t*4)*30*dt; }
    else if(e.mode==='ringEnter'){
      var rx=e.tx-e.x,ry=e.ty-e.y,rd=Math.hypot(rx,ry);
      if(rd<6){e.x=e.tx;e.y=e.ty;e.mode='ring';e.entering=false;e.t=0;e.phase=Math.atan2(e.y-H*0.33,e.x-W/2);}
      else{e.x+=rx/rd*e.spd*2.2*dt;e.y+=ry/rd*e.spd*2.2*dt;}
    }else if(e.mode==='ring'){
      var rA=e.phase+e.t*0.62;e.x=W/2+Math.cos(rA)*110;e.y=H*0.33+Math.sin(rA)*85;
      if(e.t>11){e.mode='down';e.baseX=e.x;}
    }else if(e.mode==='orbitEnter'){
      var ox=e.tx-e.x,oy=e.ty-e.y,od=Math.hypot(ox,oy);
      if(od<6){e.x=e.tx;e.y=e.ty;e.mode='orbit';e.entering=false;e.t=0;}
      else{e.x+=ox/od*e.spd*2.4*dt;e.y+=oy/od*e.spd*2.4*dt;}
    }else if(e.mode==='orbit'){
      if(e.t>7){e.mode='down';e.baseX=e.x;}
      else{var oa2=e.phase+e.t*0.8;e.x=W/2+Math.cos(oa2)*150;e.y=280+Math.sin(oa2)*80;}
    }
    else if(e.mode==='pincer'&&e.entering){
      var ex=e.tx-e.x,ey=e.ty-e.y,ed=Math.hypot(ex,ey);
      if(ed<6){e.entering=false;e.mode='down';e.baseX=e.x;e.y=e.ty;}
      else {e.x+=ex/ed*e.spd*1.8*dt;e.y+=ey/ed*e.spd*1.8*dt;}
    }else if(e.mode==='turret'&&e.entering){
      e.y+=e.spd*1.5*dt;
      if(e.y>=e.ty){e.y=e.ty;e.entering=false;e.baseX=e.x;}
    }else if(e.mode==='turret'){
      e.x=e.baseX+Math.sin(e.t*1.5)*24;
      if(e.t>10&&!e.elite){e.mode='down';e.spd=75;}
    }else if(e.mode==='snake'){
      e.y+=e.spd*dt; e.x=e.baseX+Math.sin(e.t*2.4+e.phase)*30;
    }else if(e.mode==='dive'){
      e.x+=e.vx*dt; e.y+=e.vy*dt;
    }else{
      e.y+=e.spd*dt;
    }
    if(e.px!==undefined && e.t>0.1 && Math.hypot(e.x-e.px,e.y-e.py)>50){
      e.x=e.px;e.y=e.py;
    }
    e.px=e.x;e.py=e.y;
    var vis=(e.x>14&&e.x<W-14&&e.y>14&&e.y<H-60);
    e.visT=vis?((e.visT||0)+dt):0;
    if(!e.transport&&!e.noFire&&!e.entering&&e.visT>0.22){
      e.fireT-=dt;
      if(e.fireT<=0){ fireEnemy(e); e.fireT=ET[e.type].fire/e.aggr+rand(-0.2,0.2); }
    }
    var edx=e.x-player.x,edy=e.y-player.y;
    var er=e.elite?ET[e.type].r*1.45:ET[e.type].r;
    if(edx*edx+edy*edy<(er+player.r)*(er+player.r)) hitPlayer();
    if(e.y>H+70||e.x<-90||e.x>W+90) removeEnemy(i);
  }

  for(var i=items.length-1;i>=0;i--){
    var it=items[i];it.t+=dt;it.y+=it.vy*dt;
    var idx=player.x-it.x,idy=player.y-it.y,id=Math.hypot(idx,idy);
    if(id<185&&id>1){it.x+=idx/id*180*dt;it.y+=idy/id*160*dt;}
    if(id<20){collectItem(it);items.splice(i,1);continue;}
    if(it.y>H+30)items.splice(i,1);
  }
  for(var oi=orbBullets.length-1;oi>=0;oi--){
    var ob=orbBullets[oi];if(!ob.owner||ob.owner.hp<=0||enemies.indexOf(ob.owner)<0){orbBullets.splice(oi,1);continue;}
    ob.ang+=ob.spin*dt;ob.x=ob.owner.x+Math.cos(ob.ang)*ob.r;ob.y=ob.owner.y+Math.sin(ob.ang)*ob.r;
    var odx=ob.x-player.x,ody=ob.y-player.y;if(odx*odx+ody*ody<(ob.rad+player.r)*(ob.rad+player.r)) hitPlayer();
  }
  updateWingEntries(dt);
  updateOptions(dt);
  updateWingBeams(dt);
  updateMissiles(dt);
  updateBeams(dt);
  if(boss&&state==='boss'){
    var def=boss.def; boss.t+=dt;
    if(boss.hitFlash>0) boss.hitFlash-=dt;
    if(boss.flash>0) boss.flash-=dt;
    if(boss.invuln>0) boss.invuln=Math.max(0,boss.invuln-dt);
    var ty=(def.move==='dash')?215:205;
    if(boss.entering){
      boss.y+=140*dt;
      if(boss.y>=ty){boss.y=ty;boss.entering=false;boss.invuln=1.0;boss.t=0;}
    }else{
      if(def.move==='sine') boss.x=W/2+Math.sin(boss.t*0.6)*82;
      else if(def.move==='wide') boss.x=W/2+Math.sin(boss.t*0.45)*112;
      else boss.x=W/2+Math.sin(boss.t*1.05)*120;
      boss.y=ty+Math.sin(boss.t*0.8)*8;
      if(def.move==='dash') boss.y=ty+Math.sin(boss.t*0.55)*16;
      var hw=def.w/2+6; boss.x=Math.max(hw,Math.min(W-hw,boss.x));
      if(boss.ultCharge<=0){
        if(boss.phase===0&&boss.hp<boss.max*0.60) bossPhase(1);
        else if(boss.phase===1&&boss.hp<boss.max*0.30) bossPhase(2);
      }
      if(boss.ultCharge>0){
        boss.ultCharge-=dt;
        if(boss.ultCharge<=0) bossUltimate();
      }else{
        boss.ultT+=dt;
        if(boss.ultT>def.ultRate){
          beginBossUltimate();
        }else{
          boss.patternT+=dt; if(boss.patternT>8) setBossPattern(boss.patternIdx+1);
          boss.aimT+=dt; boss.ringT+=dt; boss.laserT+=dt; boss.spiralT+=dt; boss.broadT+=dt; boss.blinkT+=dt;
          if(def.style==='octopus'){
            if(boss.spiralT>0.17){boss.spiralT=0;bossSpiral(3,1,105+stage*8);}
            if(boss.aimT>2.2){boss.aimT=0;bossAimed(3);}
            if(boss.ringT>6.0){boss.ringT=0;bossRing(10);}
            if(boss.phase>=1&&boss.laserT>8.5){boss.laserT=0;bossLaser();}
          }else if(def.style==='dread'){
            if(boss.broadT>5.5){boss.broadT=0;bossBroadside();}
            if(boss.aimT>2.6){boss.aimT=0;bossWall();}
            if(boss.ringT>5.8){boss.ringT=0;bossRing(16);}
            if(boss.laserT>7.0){boss.laserT=0;bossAimed(5);}
          }else{
            if(boss.blinkT>5.0){boss.blinkT=0;bossBlink();}
            if(boss.spiralT>0.52){boss.spiralT=0;bossSwarm();}
            if(boss.aimT>1.9){boss.aimT=0;bossAimed(5);}
            if(boss.ringT>6.4){boss.ringT=0;bossRing(14);}
            if(boss.laserT>7.4){boss.laserT=0;bossLaser();}
          }
          if(runner){ runner.x=boss.x; runner.y=boss.y; runner.update(); }
        }
      }
    }
    for(var i=bullets.length-1;i>=0;i--){
      var b=bullets[i]; b.r.update(); b.x=b.r.x; b.y=b.r.y;
      if(b.dead||b.x<-40||b.x>W+40||b.y<-40||b.y>H+40){bullets.splice(i,1);continue;}
      if(wingmanBlock(b.x,b.y,b.rad)){bullets.splice(i,1);continue;}
      var bdx=b.x-player.x,bdy=b.y-player.y;
      if(bdx*bdx+bdy*bdy<(b.rad+player.r)*(b.rad+player.r)) hitPlayer();
    }
    if(boss.hp<=0){
      boss.hp=0;
      for(var k=0;k<30;k++) part(boss.x+rand(-70,70),boss.y+rand(-40,40),'#ffb066',2,220);
      boom(boss.x,boss.y,2.2); shake=22;
      bullets.length=0; ebullets.length=0; beams.length=0; boss=null; runner=null;
      score+=1000; player.bombs=Math.min(3,player.bombs+1);
      state='clear'; setBanner('STAGE CLEAR',STAGES[stage].name,3.0);
    }
    var bdx2=boss?boss.x-player.x:0,bdy2=boss?boss.y-player.y:0;
    if(boss&&bdx2*bdx2+bdy2*bdy2<(boss.def.w*0.28)*(boss.def.w*0.28)) hitPlayer();
  }

  for(var i=ebullets.length-1;i>=0;i--){
    var e=ebullets[i]; e.x+=e.vx*dt; e.y+=e.vy*dt;
    if(e.x<-30||e.x>W+30||e.y<-30||e.y>H+30){ebullets.splice(i,1);continue;}
    if(wingmanBlock(e.x,e.y,e.rad)){ebullets.splice(i,1);continue;}
    var ex=e.x-player.x,ey=e.y-player.y;
    if(ex*ex+ey*ey<(e.rad+player.r)*(e.rad+player.r)) hitPlayer();
  }
}

function drawLoopLayer(img,scroll,alpha,fitWidth){
  if(!img||!img.complete||!img.naturalWidth) return false;
  var sc=fitWidth?W/img.width:Math.max(W/img.width,H/img.height);
  var bw=img.width*sc,bh=img.height*sc,x=(W-bw)/2,baseY=(H-bh)/2;
  var loopH=bh*2,off=((scroll%loopH)+loopH)%loopH;
  ctx.globalAlpha=alpha;
  for(var n=-2;n<=2;n++){
    var top=baseY+off+n*bh;
    if(top>H||top+bh<0) continue;
    var even=((n%2)+2)%2===0;
    if(even) ctx.drawImage(img,x,top,bw,bh);
    else{ctx.save();ctx.translate(x,top+bh);ctx.scale(1,-1);ctx.drawImage(img,0,0,bw,bh);ctx.restore();}
  }
  ctx.globalAlpha=1; return true;
}
function paintStageBg(main,edge,offsetY){
  drawLoopLayer(main,bgScroll+(offsetY||0),1,false);
  if(edge) drawLoopLayer(edge,bgEdgeScroll+(offsetY||0)*1.35,0.92,true);
}
function drawBgDust(){
  ctx.save();
  for(var i=0;i<bgDust.length;i++){
    var p=bgDust[i];ctx.globalAlpha=p.a;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,1,p.len);
  }
  ctx.restore();
}
function paintBg(img,alpha,offsetY){
  if(!img||!img.complete||!img.naturalWidth) return false;
  var sc=Math.max(W/img.width,H/img.height),bw=img.width*sc,bh=img.height*sc;
  ctx.globalAlpha=alpha;
  ctx.drawImage(img,(W-bw)/2,(H-bh)/2+Math.sin(time*0.12)*10+(offsetY||0),bw,bh);
  ctx.globalAlpha=1;
  return true;
}
var MIRROR_TYPES={1:1,4:1},MIRROR_CACHE={};
function enemyMirrorImg(type,img){
  var c=MIRROR_CACHE[type];
  if(c&&c.src===img) return c.canvas;
  var cv=document.createElement('canvas');cv.width=Math.round(img.width*1.5);cv.height=img.height;
  var x=cv.getContext('2d'),off=Math.round(img.width*0.5);
  x.save();x.translate(img.width,0);x.scale(-1,1);x.drawImage(img,0,0);x.restore();
  x.drawImage(img,off,0);
  MIRROR_CACHE[type]={src:img,canvas:cv};return cv;
}
function drawSentry(e){
  var t=e.t||0,ang=Math.sin(t*1.6)*0.12,sc=1;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(ang);
  ctx.globalAlpha=0.18;ctx.fillStyle='#ff8a5a';ctx.beginPath();ctx.arc(0,0,30,0,TAU);ctx.fill();ctx.globalAlpha=1;
  var g=ctx.createLinearGradient(-24,0,24,0);g.addColorStop(0,'#3b4048');g.addColorStop(0.4,'#d7dde5');g.addColorStop(0.7,'#6d747e');g.addColorStop(1,'#2c3138');
  ctx.fillStyle=g;ctx.beginPath();
  for(var k=0;k<6;k++){var a=-Math.PI/2+k*Math.PI/3,x=Math.cos(a)*22,y=Math.sin(a)*26;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.closePath();ctx.fill();ctx.strokeStyle='#1b2027';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='rgba(255,160,100,0.85)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,15,t*1.8,t*1.8+2.1);ctx.stroke();
  ctx.fillStyle='#ff5a3a';ctx.beginPath();ctx.arc(0,0,6+Math.sin(t*6)*1.2,0,TAU);ctx.fill();
  ctx.fillStyle='#2e343c';ctx.fillRect(-27,-6,8,12);ctx.fillRect(19,-6,8,12);
  ctx.fillStyle='#ffb36b';ctx.fillRect(-26,3,6,2);ctx.fillRect(20,3,6,2);
  ctx.restore();
  if(e.flash>0||e.hp<e.max){
    var bw=36,bh=3,bx=e.x-bw/2,by=e.y-34;
    ctx.fillStyle='rgba(8,14,24,0.8)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=e.hp/e.max>0.5?'#8dff9e':'#ffb36b';ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.max),bh);
  }
}
function drawEnemy(e){
  if(e.type===6){drawSentry(e);return;}
  var et=ET[e.type],key='n'+(e.type+1),img=GIMG[key];
  if(!img||!img.complete) return;
  var mir=!!MIRROR_TYPES[e.type];if(mir) img=enemyMirrorImg(e.type,img);
  var w=et.w*(mir?1.5:1)*(e.transport?1.45:(e.elite?1.58:1)),h=w*img.height/img.width;
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
function drawBoss(){
  if(!boss) return;
  var phase=boss.phase;
  var img=GIMG[boss.def.key+(phase+1)]||GIMG[boss.def.key+'1'];
  if(!img||!img.complete) return;
  var phaseScale=[1,1.06,1.12][phase]||1;
  var w=boss.def.w*phaseScale,h=w*img.height/img.width;
  var cols=boss.def.glow||['90,200,255','255,120,220','255,170,80'],col=cols[phase]||cols[0];
  ctx.save();ctx.globalCompositeOperation='lighter';
  var ar=h*0.72+Math.sin(time*4)*8;
  var g=ctx.createRadialGradient(boss.x,boss.y,h*0.15,boss.x,boss.y,ar);
  g.addColorStop(0,'rgba('+col+',0.20)');
  g.addColorStop(0.55,'rgba('+col+',0.10)');
  g.addColorStop(1,'rgba('+col+',0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(boss.x,boss.y,ar,0,TAU);ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.drawImage(img,boss.x-w/2,boss.y-h/2,w,h);
  if(boss.hitFlash>0){
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=Math.min(0.9,boss.hitFlash*6);
    ctx.drawImage(img,boss.x-w/2,boss.y-h/2,w,h);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    var hr=8+18*Math.max(0,1-boss.hitFlash*6);
    ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(boss.hitX,boss.hitY,hr,0,TAU);ctx.stroke();
  }
  if(boss.invuln>0){
    ctx.globalAlpha=0.32;ctx.strokeStyle=['#7fe7ff','#ff9ad5','#ffc36b'][stage];ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(boss.x,boss.y,Math.min(h*0.55,w*0.36)+Math.sin(time*8)*4,0,TAU);ctx.stroke();ctx.globalAlpha=1;
  }
  ctx.restore();
}
function bulletImg(){ return GIMG['u'+(stage===0?'1':(stage===1?'2':'4'))]; }
function drawBullet(b){
  var img=bulletImg(),a=Math.atan2(b.r.direction||0,1)+Math.PI/2;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);
  if(img&&img.complete)ctx.drawImage(img,-6,-12,12,24);
  else{ctx.fillStyle='#8fe8ff';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
  ctx.restore();
}
function drawEB(e){
  var pi=Math.max(0,Math.min(3,stage|0)),p=BOSS_PALETTES[pi],spr=ebSprite(pi,e.type);
  var a=Math.atan2(e.vy,e.vx)+Math.PI/2;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);
  if(spr){
    if(e.type===2){var w=e.rad*2.8;ctx.drawImage(spr,-w/2,-w/2,w,w);}
    else{var w=e.rad*2.2,h=e.rad*4.6;ctx.drawImage(spr,-w/2,-h/2,w,h);}
  }else{
    ctx.fillStyle=p.main;ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.fill();
    ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(0,0,e.rad*0.42,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function drawBombBtn(){
  var bx=W-70,by=H-88,rad=44,pulse=1+Math.sin(time*4)*0.035;
  ctx.save();
  var bg=ctx.createRadialGradient(bx,by,8,bx,by,rad*1.8);
  bg.addColorStop(0,'rgba(255,170,90,0.30)');bg.addColorStop(0.55,'rgba(255,90,60,0.15)');bg.addColorStop(1,'rgba(255,80,40,0)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(bx,by,rad*1.8,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(bx,by,rad*pulse,0,TAU);
  ctx.fillStyle='rgba(38,20,20,0.92)';ctx.fill();
  ctx.strokeStyle='rgba(255,170,100,0.95)';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(bx,by,rad-7,0,TAU);ctx.strokeStyle='rgba(255,220,140,'+(0.35+0.15*Math.sin(time*6))+')';ctx.lineWidth=1.5;ctx.stroke();
  // bomb icon
  ctx.fillStyle='#ffcf7a';ctx.beginPath();ctx.arc(bx,by-14,8,0,TAU);ctx.fill();
  ctx.fillStyle='#8a5a32';ctx.fillRect(bx-2,by-25,4,8);
  ctx.strokeStyle='#ffcf7a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx+2,by-24);ctx.quadraticCurveTo(bx+12,by-30,bx+10,by-19);ctx.stroke();
  ctx.fillStyle='#fff2d8';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('BOMB',bx,by+12);
  ctx.fillStyle='#ffcf7a';ctx.font='11px monospace';ctx.fillText('x'+player.bombs,bx,by+28);
  ctx.textAlign='left';ctx.restore();
}
function drawShots(){
  for(var i=0;i<shots.length;i++){
    var s=shots[i],ang=Math.atan2(s.vx||0,-s.vy);
    var col=s.wing?'#7fe7ff':(s.special?'#8dff9e':'#ffe6a0');
    var glow=s.wing?'rgba(80,210,255,0.4)':(s.special?'rgba(80,255,140,0.35)':'rgba(255,170,60,0.35)');
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);
    var bh=s.laser?32:22,bw=2.4;
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
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(ang);
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
    ctx.fillStyle=m.max?'#ffe08a':(m.wing?'#bfefff':mg);
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
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(player.bank*0.5);
    ctx.globalAlpha=0.18;ctx.fillStyle='#7fe7ff';ctx.beginPath();ctx.arc(0,3,16,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle='#3b8fc4';
    ctx.beginPath();ctx.moveTo(-13,5);ctx.lineTo(-3,-2);ctx.lineTo(-3,7);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(13,5);ctx.lineTo(3,-2);ctx.lineTo(3,7);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e6f7ff';
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(5,5);ctx.lineTo(0,9);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();
    ctx.fillStyle='#7fe7ff';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(2,1);ctx.lineTo(-2,1);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(160,235,255,0.9)';ctx.beginPath();ctx.moveTo(-2,8);ctx.lineTo(0,15);ctx.lineTo(2,8);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(180,240,255,0.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(5,5);ctx.lineTo(0,9);ctx.lineTo(-5,5);ctx.closePath();ctx.stroke();
    ctx.restore();
  }
}
function drawPlayerLaser(){
  if(player.weapon!=='laser'||(state!=='play'&&state!=='boss')) return;
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
function drawExplosion(f){
  var p=Math.min(1,f.t/0.6),r=(12+58*p)*f.sc,a=1-p;
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
  g.addColorStop(0,'rgba(255,255,230,'+(0.95*a)+')');
  g.addColorStop(0.25,'rgba(255,210,110,'+(0.9*a)+')');
  g.addColorStop(0.55,'rgba(255,110,40,'+(0.55*a)+')');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.fill();
  for(var i=0;i<7;i++){
    var ang=f.seed+i*0.9,rr=r*(0.45+0.5*((i*37)%10)/10);
    ctx.globalAlpha=0.8*a;ctx.fillStyle=i%2?'#ffd28a':'#ff7a4d';
    ctx.fillRect(f.x+Math.cos(ang)*rr-2,f.y+Math.sin(ang)*rr-2,4,4);
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawItem(it){
  var cols={N:'#ffe6a0',P:'#7fe7ff',S:'#8dff9e',L:'#ff7ad5',M:'#ffb36b',W:'#c9a0ff',B:'#ffd36b'};
  if(it.type==='A'){
    var at=ammoType(it),ac=cols[at]||'#7fe7ff';
    ctx.save();ctx.translate(it.x,it.y);
    ctx.globalAlpha=0.2;ctx.fillStyle=ac;ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();
    ctx.globalAlpha=1;ctx.rotate(it.t*1.4);
    ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(11,0);ctx.lineTo(0,13);ctx.lineTo(-11,0);ctx.closePath();
    ctx.fillStyle='rgba(8,16,28,0.92)';ctx.fill();ctx.strokeStyle=ac;ctx.lineWidth=2.2;ctx.stroke();
    ctx.rotate(-it.t*1.4);ctx.fillStyle=ac;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(at,0,4);
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
function drawHUD(){
  if(state==='menu') return;
  ctx.fillStyle='rgba(3,6,14,0.55)';ctx.fillRect(0,0,W,64);
  ctx.textAlign='left';
  ctx.fillStyle='#9fb6cf';ctx.font='10px monospace';ctx.fillText('STAGE '+(stage+1)+'/3 · '+STAGES[stage].name,16,16);
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
  var maxLv=player.specialPower>=4;ctx.fillStyle=maxLv?'#ffd76a':'#cfe0f0';ctx.fillText(weaponName()+'  LV'+player.specialPower+(maxLv?' MAX':''),16,H-96);ctx.fillStyle='#cfe0f0';
  var hpx='HP ';for(var hi=0;hi<player.maxHp;hi++)hpx+=(hi<player.hp?'●':'○');
  ctx.fillStyle='#8dff9e';ctx.fillText(hpx,16,H-78);ctx.fillStyle='#cfe0f0';
  ctx.fillText('WING '+player.options+'·P'+player.wingPower,16,H-60);
  ctx.fillText('SHIPS '+player.lives,16,H-42);ctx.fillText('BOMB '+player.bombs,16,H-24);
  drawBombBtn();
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
function drawMenu(){
  paintBg(BGMENU,1)||paintBg(BG1,1);
  ctx.fillStyle='rgba(3,6,14,0.06)';ctx.fillRect(0,0,W,H);
  var tg=ctx.createLinearGradient(0,H*0.30,0,H*0.72);
  tg.addColorStop(0,'rgba(0,0,0,0)');tg.addColorStop(0.12,'rgba(0,0,0,0.55)');
  tg.addColorStop(0.78,'rgba(0,0,0,0.55)');tg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=tg;ctx.fillRect(0,H*0.30,W,H*0.42);
  ctx.textAlign='center';
  ctx.fillStyle='#f2f7ff';ctx.font='30px monospace';ctx.fillText('STELLAR ASSAULT',W/2,H*0.42);
  ctx.fillStyle='#9fd8ff';ctx.font='12px monospace';ctx.fillText('3 STAGES · 3 BOSSES',W/2,H*0.42+28);
  ctx.fillStyle='#ffd27a';ctx.font='14px monospace';ctx.fillText(audioReady?'TAP TO START':'TAP TO ENABLE AUDIO',W/2,H*0.52);
  ctx.fillStyle='#b8c9da';ctx.font='11px monospace';
  ctx.fillText('drag · ship follows above finger · auto-fire',W/2,H*0.57);
  ctx.fillStyle='#7f93a8';ctx.font='10px monospace';
  ctx.fillText('patterns © Kenta Cho · BSD-3',W/2,H*0.63);
  ctx.fillText('art & backgrounds: user',W/2,H*0.66);
  ctx.fillText('SFX: Kenney Sci-Fi Sounds (CC0)',W/2,H*0.69);
  ctx.textAlign='left';
}
function drawEnd(){
  if(state!=='win'&&state!=='over') return;
  ctx.fillStyle='rgba(2,4,10,0.68)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.fillStyle=state==='win'?'#9fe8ff':'#ff8a66';ctx.font='28px monospace';
  ctx.fillText(state==='win'?'MISSION COMPLETE':'GAME OVER',W/2,H/2-20);
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
function draw(){
  resetCanvasState();
  try{drawScene();}
  catch(e){console.error('draw error',e);hardResetCanvas();}
}
function drawScene(){
  ctx.clearRect(0,0,W,H);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  var sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  ctx.save();ctx.translate(sx,sy);
  if(state==='menu'){ drawMenu(); ctx.restore(); return; }
  var bgOff=0;
  if(state==='warpIn'){var wpg=Math.min(1,1-warpT/0.95);bgOff=H*(1-wpg);}
  if(bgOff>0){ctx.fillStyle='#03060e';ctx.fillRect(0,0,W,H);}
  var mainBg=BG_MAIN[stage],edgeBg=BG_EDGE[stage];
  if(!mainBg||!mainBg.complete||!mainBg.naturalWidth) mainBg=bgCurrent;
  paintStageBg(mainBg,edgeBg,bgOff);
  ctx.fillStyle='rgba(3,6,14,'+(stage===2?0.32:0.20)+')';ctx.fillRect(0,0,W,H);
  for(var i=0;i<stars.length;i++){var st=stars[i];ctx.globalAlpha=0.25+st.z*0.5;ctx.fillStyle='#cfe6ff';ctx.fillRect(st.x,st.y,st.z*1.4,st.z*1.4);}
  ctx.globalAlpha=1;drawBgDust();
  if(state==='warpIn'||state==='warpOut'){
    ctx.save();ctx.globalCompositeOperation='lighter';
    var wi2=state==='warpOut'?1.0:Math.min(1,1-warpT/0.95);
    for(var wi=0;wi<24;wi++){
      var wx=(wi*53+time*420)%W,wh=60+((wi*37)%120);
      ctx.globalAlpha=0.16*wi2;ctx.fillStyle='#9fe8ff';
      ctx.fillRect(wx,0,1.5,wh);ctx.fillRect(wx,H-wh,1.5,wh);
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(boss&&boss.ultCharge>0){
    ctx.save();ctx.strokeStyle='rgba(255,70,70,'+(0.3+0.25*Math.sin(time*18))+')';ctx.lineWidth=7;ctx.strokeRect(3,3,W-6,H-6);ctx.restore();
  }
  var charging=false;
  for(var i=0;i<beams.length;i++) if(beams[i].t<beams[i].charge) charging=true;
  if(charging){ctx.save();ctx.fillStyle='rgba(255,40,40,0.05)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,70,70,'+(0.25+0.15*Math.sin(time*20))+')';ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);ctx.restore();}

  for(var i=0;i<enemies.length;i++) drawEnemy(enemies[i]);
  drawShots();
  drawMissiles();
  for(var i=0;i<bullets.length;i++) drawBullet(bullets[i]);
  for(var i=0;i<ebullets.length;i++) drawEB(ebullets[i]);
  for(var i=0;i<orbBullets.length;i++){
    var ob=orbBullets[i];ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#b58bff';ctx.beginPath();ctx.arc(ob.x,ob.y,ob.rad+3,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ob.x,ob.y,2.2,0,TAU);ctx.fill();ctx.restore();
  }
  drawBoss();
  drawBeams();
  for(var i=0;i<items.length;i++) drawItem(items[i]);
  for(var i=0;i<fx.length;i++) drawExplosion(fx[i]);

  drawPlayerLaser();
  drawOptions();
  drawWingBeams();
  for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.max(0,p.life/0.8);ctx.fillStyle=p.col;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}
  ctx.globalAlpha=1;

  drawBombFx();
  var gi=player.bank>0.06?GIMG.p3:(player.bank<-0.06?GIMG.p4:GIMG.p2);
  if(gi&&gi.complete){
    ctx.globalAlpha=(state==='bossWarn'||state==='clear')?1:((player.invuln>0&&!player.noBlink&&Math.floor(player.invuln*14)%2===0)?0.25:1);
    var psc=1;
    if(state==='warpOut') psc=Math.max(0.18,1-(1-warpT/1.1)*0.82);
    if(state==='warpIn') psc=0.42+0.58*Math.min(1,1-warpT/0.95);
    if(player.specialPower>=4){ctx.save();ctx.globalCompositeOperation='lighter';var ag=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,52);ag.addColorStop(0,'rgba(255,215,100,0.28)');ag.addColorStop(1,'rgba(255,180,40,0)');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(player.x,player.y,52,0,TAU);ctx.fill();ctx.restore();}
    ctx.drawImage(gi,player.x-47*psc,player.y-47*psc,94*psc,94*psc);ctx.globalAlpha=1;
  }
  drawPickupMsg();
  drawHUD();
  drawBanner();
  drawEnd();
  ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
}

var dragging=false,dragLift=0,dragMaxY=H-70;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault(); initAudio(); loadSfxExtras();
  try{if(AC&&AC.state==='suspended')AC.resume();}catch(err){}
  if(bgmPending){var pk=bgmPending;bgmPending='';playBgm(pk);}
  var p=pt(e);
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m'); return; }
    startGame(); return;
  }
  if(state==='win'||state==='over'){ startGame(); return; }
  var bx=W-70,by=H-88;
  if((p.x-bx)*(p.x-bx)+(p.y-by)*(p.y-by)<54*54){ bomb(); return; }
  dragging=true; dragLift=(e.pointerType==='touch')?86:0; dragMaxY=(e.pointerType==='touch')?H-140:H-70;
  target.x=Math.max(22,Math.min(W-22,p.x));
  target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onMove(e){
  if(!dragging) return;
  e.preventDefault();
  var p=pt(e);target.x=Math.max(22,Math.min(W-22,p.x));target.y=Math.max(70,Math.min(dragMaxY,p.y-dragLift));
}
function onUp(){dragging=false;}
cvs.addEventListener('pointerdown',onDown,{passive:false});
cvs.addEventListener('pointermove',onMove,{passive:false});
cvs.addEventListener('pointerup',onUp);
cvs.addEventListener('pointercancel',onUp);

window.__g=function(){return {state:state,stage:stage,score:score,enemies:enemies.length,bullets:bullets.length,ebullets:ebullets.length,hp:boss?Math.round(boss.hp):0,phase:boss?boss.phase:-1,bx:boss?Math.round(boss.x):0,power:player.specialPower,items:items.length,shots:shots.length,weapon:player.weapon,options:player.options,lives:player.lives,php:player.hp,bombs:player.bombs};};
window.__god=function(){player.invuln=99999;player.noBlink=true;};
window.__stage=function(n){startStage(n);};
window.__boss=function(){if(!boss)spawnBoss();};
window.__form=function(f){spawnWave({t:0,type:f==='escort'?4:2,n:5,form:f,spd:70,noFire:false,aggr:1});};
window.__enemy=function(t){spawnWave({t:0,type:t==null?4:t,n:1,form:'line',spd:0,noFire:true,aggr:1});var e=enemies[enemies.length-1];if(e){e.y=280;e.entering=false;}};
window.__warn=function(){startBossWarn();};
window.__beamTest=function(){
  var e={type:4,x:W/2,y:260,baseX:W/2,tx:W/2,ty:260,mode:'turret',entering:false,t:0,phase:0,spd:0,hp:40,max:40,fireT:99,flash:0,elite:false,role:'',first:false};
  enemies.push(e);spawnBeam(e.x,e.y,Math.PI/2,1500,20,1.0,0.4,1,bossBeamColor(),false,e);
  e.hp=0;removeEnemy(enemies.indexOf(e));return beams.length;
};
window.__beams=function(){return beams.map(function(b){return {t:Math.round(b.t*100)/100,owner:b.owner?b.owner.hp:null};});};
window.__killBoss=function(){if(boss)boss.hp=0;};
window.__bossHp=function(f){if(boss)boss.hp=boss.max*f;};
window.__drop=function(t){items.push({x:player.x,y:player.y-80,vy:20,type:t||'P',t:0});};
window.__boom=function(){boom(W/2,H*0.45,1.4);};
window.__beam=function(){spawnBeam(W/2,180,Math.PI/2,1500,16,0.8,0.45,1,'#ff6a5a');};
window.__bossLaser=function(){if(boss)bossLaser();};
window.__ebTest=function(){if(boss){bossAimed(12);bossRing(18);bossSpiral(4,1,120);}};
window.__hit=function(){player.invuln=0;hitPlayer();};
window.__ult=function(){beginBossUltimate();};
window.__bomb=function(){bomb();};
window.__bgmInfo=function(){return {name:bgmName,paused:bgmAudio?bgmAudio.paused:null,time:bgmAudio?bgmAudio.currentTime:0};};
window.__sfxTest=function(){sfx('p_normal',0.4);return window.__audio();};
window.__audio=function(){return {state:AC?AC.state:'none',boosted:audioBoosted,active:sfxActive,samples:Object.keys(SFXBUF),master:master?master.gain.value:0};};
window.__enemies=function(){return enemies.map(function(e){return {t:e.type,hp:Math.round(e.hp),max:Math.round(e.max)};});};
window.__damage=function(d){for(var i=0;i<enemies.length;i++) enemies[i].hp=Math.max(1,enemies[i].hp-(d||8));};
window.__item=function(t,x,y){items.push({x:x,y:y,vy:0,type:t,t:0});};
window.__max=function(){player.specialPower=4;player.power=4;};
window.__itemT=function(t,tm,x,y){items.push({x:x||player.x,y:y||player.y-90,vy:0,type:t,t:tm||0});};
var last=performance.now(),acc=0;
function frame(now){
  var dt=Math.min(0.05,(now-last)/1000);last=now;acc+=dt;
  try{
    var guard=0;
    while(acc>=1/60&&guard<4){step(1/60);acc-=1/60;guard++;}
    draw();
  }catch(e){ console.error('frame error',e); }
  document.addEventListener('visibilitychange',function(){try{if(!document.hidden&&AC&&AC.state==='suspended')AC.resume();}catch(e){}});
requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
