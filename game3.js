(function(){
  try{
    var st=document.createElement('style');
    st.textContent="@font-face{font-family:'Orbitron';src:url('assets/fonts/orbitron-600.ttf') format('truetype');font-weight:600;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-500.ttf') format('truetype');font-weight:500;font-display:swap}@font-face{font-family:'Rajdhani';src:url('assets/fonts/rajdhani-600.ttf') format('truetype');font-weight:600;font-display:swap}";
    document.head.appendChild(st);
    if(document.fonts&&document.fonts.load){document.fonts.load('600 20px Orbitron');document.fonts.load('600 20px Rajdhani');}
  }catch(e){}
})();
var player={x:W/2,y:H-130,r:6,lives:3,hp:3,maxHp:3,bombs:2,od:0,odT:0,powerXp:0,respawnT:0,respawnGift:false,invuln:0,bank:0,noBlink:false,power:1,weapon:'normal',specialPower:1,options:0,wingPower:1,trail:[],wingEntry:[]};
var target={x:W/2,y:H-130};
var stage=0,state='menu',score=0,time=0,lastShot=0,lastHitSfx=0,shake=0;
var enemies=[],bullets=[],shots=[],parts=[],stars=[],fx=[],ebullets=[],items=[],missiles=[],wingBeams=[],beams=[],orbBullets=[],phaseFx=[],blastZones=[],odLaserFx=[];
var lastMissile=0,lastSpecial=0,optionT=0,laserTick=0,laserHitY=0,laserHitT=0,pickupMsg='',pickupT=0;
var audioReady=false;
var boss=null,runner=null,bossFusionT=0,bossFusionOn=false,bossOmenT=0,selectedStage=0,bossDeath1T=0,bossAwakenT=0,SIG_BOSS=-1;
var stageT=0,waveIndex=0,nextTransport=0,banner='',bannerSub='',bannerT=0,castT=0,castScroll=0,castHoldT=0,fusionT=0,finaleT=0;
var bgCurrent=BG1,bgPrev=null,bgFade=0,stageFlash=0,stageWarp=0,warpT=0,warpSpeed=0,glowWarp=0,bombT=0,bombX=0,bombY=0;
var bgScroll=0,bgEdgeScroll=0,bgDust=[];var BG_MAIN=[],BG_EDGE=[];
var BG4=new Image();BG4.src='assets/bg/stage4-main.webp';
var BG5=new Image();BG5.src='assets/bg/stage5-main.webp';
var BG1_BH=new Image();BG1_BH.src='assets/bg/stage1-bh.webp';
var JULIA_CANVAS=null,JULIA_CTX=null,JULIA_DATA=null,JULIA_TICK=0,JULIA_W=200,JULIA_H=430;
var IFS_POINTS=(function(){var v=[{x:0,y:0},{x:1,y:0},{x:.5,y:.866}],p={x:.5,y:.35},out=[];for(var i=0;i<2600;i++){var q=v[(i*7)%3];p={x:(p.x+q.x)/2,y:(p.y+q.y)/2};if(i>60&&i%23===0)out.push(p);}return out;})();
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
  if(n==='p_normal'){noiseBurst(0.018,v*0.95,8500);tone(170,78,0.03,v*0.50,'square');tone(1250,650,0.018,v*0.24,'triangle');}
  if(n==='p_spread'){noiseBurst(0.022,v*0.85,7600);tone(155,65,0.032,v*0.45,'square');}
  if(n==='e_hit'){noiseBurst(0.014,v*0.5,9500);tone(2300,1900,0.07,v*0.18,'triangle');tone(3700,3100,0.05,v*0.10,'sine',0.004);tone(1200,800,0.10,v*0.07,'square');}
  if(n==='b_hit') tone(110,55,0.09,v*0.7,'sine');
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
  var buf=SFXBUF['jetfly'];
  if(!buf){noiseBurst(0.06,0.12,8000);tone(1600,600,0.07,0.10,'triangle');return;}
  var t=AC.currentTime,s=AC.createBufferSource();
  s.buffer=buf;s.playbackRate.value=2.75;
  var hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=650;
  var g=AC.createGain();
  g.gain.setValueAtTime(0.24,t);
  g.gain.exponentialRampToValueAtTime(0.055,t+0.045);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.135);
  s.connect(hp);hp.connect(g);g.connect(master);
  s.onended=function(){try{s.disconnect();hp.disconnect();g.disconnect();}catch(e){}};
  s.start(t);s.stop(t+0.15);
}
function synthSfx(n,v){
  if(!AC||!master||muted) return;
  v=v||0.2;
  if(n==='p_normal') tone(1100,720,0.05,v,'square');
  else if(n==='p_spread'){tone(900,1200,0.04,v*0.8,'triangle');tone(700,1000,0.05,v*0.7,'triangle',0.02);tone(500,800,0.06,v*0.6,'triangle',0.04);}
  else if(n==='p_missile'){noiseBurst(0.085,v*0.45,7000);tone(1800,520,0.095,v*0.40,'triangle');}
  else if(n==='e_shot') tone(240,160,0.08,v,'square');
  else if(n==='e_hit'){tone(2300,1800,0.06,v*0.55,'triangle');tone(3700,3000,0.045,v*0.22,'sine');noiseBurst(0.014,v*0.4,9000);}
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
 {name:'SURFACE',bg:BG3,bgm:'b',waves:[
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
 ]},
 {name:'SANCTUM',bg:BG4,bgm:'s4',waves:[
   {t:0.6,type:6,n:2,form:'turret',spd:56},
   {t:3.4,type:7,n:2,form:'turret',spd:52},
   {t:6.4,type:8,n:2,form:'line',spd:56},
   {t:9.6,type:5,n:6,form:'dive',spd:165},
   {t:12.8,type:2,n:6,form:'ring',spd:95},
   {t:16.0,type:4,n:3,form:'turret',spd:64},
   {t:19.4,type:1,n:6,form:'pincer',spd:98},
   {t:22.6,type:8,n:3,form:'line',spd:58},
   {t:25.8,type:0,n:6,form:'snake',spd:110},
   {t:28.6,type:6,n:1,form:'mid',spd:55},
   {t:32.0,type:7,n:3,form:'turret',spd:54},
   {t:35.4,type:5,n:8,form:'dive',spd:170},
   {t:38.8,type:8,n:3,form:'line',spd:58},
   {t:42.2,type:1,n:8,form:'pincer',spd:100},
   {t:45.6,type:6,n:2,form:'turret',spd:56},
   {t:49.0,type:7,n:3,form:'turret',spd:55},
   {t:52.4,type:0,n:8,form:'ring',spd:110},
   {t:55.8,type:4,n:4,form:'turret',spd:68},
   {t:59.2,type:8,n:4,form:'line',spd:60}
 ]},
 {name:"TIME'S END",bg:BG5,bgm:'s5',waves:[
   {t:0.3,type:9,n:5,form:'fractal',spd:120},
   {t:5.7,type:10,n:4,form:'mandala',spd:96},
   {t:10.8,type:11,n:2,form:'line',spd:62},
   {t:16.2,type:9,n:6,form:'spiral',spd:132},
   {t:21.6,type:10,n:3,form:'ring',spd:105},
   {t:27.3,type:11,n:1,form:'turret',spd:60},
   {t:33.0,type:9,n:5,form:'fractal',spd:140},
   {t:38.7,type:10,n:4,form:'pincer',spd:105},
   {t:44.4,type:11,n:1,form:'mid',spd:58},
   {t:50.4,type:9,n:6,form:'spiral',spd:150},
   {t:56.1,type:10,n:4,form:'mandala',spd:112},
   {t:61.8,type:11,n:2,form:'line',spd:68},
   {t:67.5,type:9,n:7,form:'fractal',spd:155},
   {t:73.5,type:10,n:4,form:'ring',spd:118},
   {t:79.5,type:11,n:1,form:'turret',spd:62},
   {t:85.5,type:9,n:7,form:'spiral',spd:165},
   {t:91.5,type:10,n:5,form:'pincer',spd:120},
   {t:97.5,type:11,n:2,form:'line',spd:72},
   {t:103.5,type:9,n:9,form:'mandala',spd:168}
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
STAGES.forEach(function(st,si){
  var pre=(si===4)?[]:WARMUP.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};}).concat(
    BRIDGE.map(function(w){return {t:w.t,type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:false,aggr:w.aggr};})
  );
  st.waves=pre.concat(
    st.waves.map(function(w){return {t:w.t+(si===4?0:26),type:w.type,n:w.n,form:w.form,spd:w.spd,noFire:w.noFire,aggr:1};})
  );
  if(si!==4){
    var alts=['arc','cross','strafe','feint','orbit'];
    st.waves.forEach(function(w,i){
      if(i>7&&i%5===0) w.form=alts[Math.floor(i/5)%alts.length];
      if(i>9&&i%7===0) w.role='sniper';
      if(i>11&&i%9===0) w.role='suppressor';
    });
    if(st.waves[10]){st.waves[10].form='ring';st.waves[10].n=5;st.waves[10].type=2;st.waves[10].spd=78;}
    if(st.waves[16]){st.waves[16].form='escort';st.waves[16].n=5;st.waves[16].type=4;st.waves[16].spd=62;}
    st.waves.push({t:78.5,type:6,n:2,form:'cross',spd:86,noFire:false,aggr:1,role:'suppressor'});
  }
  if(st===STAGES[0]) st.waves.push({t:34.5,type:6,n:2,form:'turret',spd:55,noFire:false,aggr:1});
  if(st===STAGES[1]){st.waves.push({t:34.5,type:7,n:2,form:'turret',spd:52,noFire:false,aggr:1});st.waves.push({t:69.0,type:8,n:2,form:'line',spd:55,noFire:false,aggr:1});}
  if(st===STAGES[2]){st.waves.push({t:33.0,type:8,n:2,form:'line',spd:55,noFire:false,aggr:1});st.waves.push({t:69.0,type:7,n:2,form:'turret',spd:52,noFire:false,aggr:1});}
  st.waves.sort(function(a,b){return a.t-b.t;});
  if(si>0){
    st.waves.forEach(function(w,i){
      if(i<8||w.form==='mid'||w.form==='escort') return;
      var mark=false;
      if(si===1&&i%5===0) mark=true;
      if(si===2&&i%3===0) mark=true;
      if(si===3&&(i%5===0||i%5===2)) mark=true;
      if(si===4&&i%7===0) mark=true;
      if(mark) w.elite=true;
    });
  }
});
var BOSSES=[
 {key:'b1_',name:'VOID SOVEREIGN',hp:1500,w:235,h:200,style:'octopus',move:'sine',patterns:[0,1],aim:3,ring:0,aimRate:1.8,ringRate:5.0,laserRate:7.5,laserN:1,ultRate:12.0,glow:['255,70,90','255,85,170','255,190,100']},
 {key:'b2_',name:'ABYSS DEVOURER',hp:1900,w:245,h:210,style:'dread',move:'wide',patterns:[1,0],aim:5,ring:16,aimRate:1.7,ringRate:5.4,laserRate:6.5,laserN:2,ultRate:11.0,glow:['150,105,255','190,90,255','255,120,235']},
 {key:'b3_',name:'STAR BEHEMOTH',hp:2300,w:245,h:210,style:'hive',move:'dash',patterns:[0,1],aim:7,ring:20,aimRate:1.9,ringRate:4.6,laserRate:5.5,laserN:3,ultRate:10.0,glow:['255,160,70','255,120,60','255,215,120']},
 {key:'b4_',name:'SERAPHIC WINGS',hp:3200,w:300,h:250,style:'seraph',move:'wide',patterns:[1,0],aim:7,ring:18,aimRate:1.6,ringRate:4.7,laserRate:6.8,laserN:3,ultRate:9.8,glow:['255,235,170','255,248,225','255,215,120']},
 {key:'b5_',name:'CHRONOS ECHO',hp:4800,w:340,h:285,style:'chronos',move:'wide',patterns:[0,1],aim:9,ring:24,aimRate:1.35,ringRate:4.0,laserRate:5.8,laserN:4,ultRate:10.2,glow:['255,70,90','190,110,255','255,225,150']}
];
var BOSS_PALETTES=[
 {main:'#ff3d63',light:'#ff9ab0',core:'#fff4f7',dark:'#3a0712',edge:'#8fe8ff',glow:'rgba(255,50,95,0.55)',beam:'#ff5f7a'},
 {main:'#a85cff',light:'#e0b4ff',core:'#fff4ff',dark:'#1e0838',edge:'#ff9ae6',glow:'rgba(168,80,255,0.55)',beam:'#c06aff'},
 {main:'#ff9a2e',light:'#ffd27a',core:'#fff8e0',dark:'#3a1604',edge:'#7fe7ff',glow:'rgba(255,150,40,0.50)',beam:'#7fe7ff'},
 {main:'#ffe6a0',light:'#fffdf0',core:'#ffffff',dark:'#5a3d12',edge:'#fffdf0',glow:'rgba(255,220,120,0.50)',beam:'#ffe7a0'},
 {main:'#c7a6ff',light:'#fff4d0',core:'#ffffff',dark:'#160a2a',edge:'#7ff4ff',glow:'rgba(190,140,255,0.55)',beam:'#e8c8ff'},
 {main:'#fff4d6',light:'#ffffff',core:'#ffffff',dark:'#3a2a12',edge:'#ffd27a',glow:'rgba(255,240,190,0.60)',beam:'#fff2c0'}
];
function bossPalette(){
 var i=Math.max(0,Math.min(4,stage|0));
 return BOSS_PALETTES[i]||BOSS_PALETTES[0];
}
function bossBeamColor(){
 if(SIG_BOSS>=0&&BOSS_PALETTES[SIG_BOSS]) return BOSS_PALETTES[SIG_BOSS].beam;
 if(stage===4&&boss&&boss.phase===0) return '#fff2c0';
 return bossPalette().beam;
}
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
 {hp:40,r:18,w:56,score:220,fire:2.2,kind:1,n:2},
 {hp:32,r:16,w:52,score:240,fire:3.0,kind:1,n:1},
 {hp:52,r:20,w:58,score:320,fire:3.2,kind:1,n:1},
 {hp:18,r:13,w:32,score:140,fire:1.8,kind:1,n:1},
 {hp:44,r:17,w:48,score:260,fire:2.1,kind:2,n:1},
 {hp:110,r:24,w:64,score:600,fire:2.4,kind:3,n:1}
];

for(var i=0;i<64;i++) stars.push({x:Math.random()*W,y:Math.random()*H,z:0.3+Math.random()*0.9});
for(var bi=1;bi<=5;bi++){
  var mi=new Image(); mi.src='assets/bg/stage'+bi+'-main.webp'; BG_MAIN[bi-1]=mi;
  var ei=new Image(); ei.src='assets/bg/stage'+bi+'-edge.webp'; BG_EDGE[bi-1]=ei;
}
for(var di=0;di<90;di++) bgDust.push({x:Math.random()*W,y:Math.random()*H,sp:220+Math.random()*190,len:1.5+Math.random()*4,a:0.18+Math.random()*0.45,c:Math.random()<0.55?'#cfefff':'#e7d8ff'});
var BEAD_COLS=['#7dffd8','#7fe6ff','#ffd27a','#c9a6ff'];
var BG_BEADS=[];
for(var bgi=0;bgi<18;bgi++) BG_BEADS.push({ba:rand(-0.16,0.16),br:rand(.16,.96),s:rand(2.2,6.4),c:bgi%4,ph:rand(0,TAU)});
var BEAD_SPR={};
function beadSprite(ci){
  if(BEAD_SPR[ci]) return BEAD_SPR[ci];
  var cv=document.createElement('canvas');cv.width=cv.height=64;var g=cv.getContext('2d');
  var col=BEAD_COLS[ci];
  var rg=g.createRadialGradient(32,32,0,32,32,30);
  rg.addColorStop(0,'rgba(255,255,255,1)');
  rg.addColorStop(.18,'rgba(255,255,255,.92)');
  rg.addColorStop(.36,col);
  rg.addColorStop(.68,col.replace(')',',0.28)').replace('rgb','rgba'));
  rg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg;g.beginPath();g.arc(32,32,30,0,TAU);g.fill();
  BEAD_SPR[ci]=cv;return cv;
}
function drawWedgeBeads(R,alpha,layerSeed){
  if(alpha<=0) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var bi=0;bi<BG_BEADS.length;bi++){
    var b=BG_BEADS[bi];
    var ang=b.ba+Math.sin(time*.35+b.ph+layerSeed)*.035;
    var rr=b.br*R;
    var x=Math.cos(ang)*rr,y=Math.sin(ang)*rr;
    var s=b.s*(0.7+rr/R*.9)*(1+0.12*Math.sin(time*1.3+b.ph));
    ctx.globalAlpha=alpha*(.30+.55*(.5+.5*Math.sin(time*.9+b.ph*1.7+layerSeed)));
    ctx.drawImage(beadSprite(b.c),x-s,y-s,s*2,s*2);
  }
  ctx.restore();ctx.globalAlpha=1;
}


function setStageBg(img){
  if(!img) return;
  bgPrev=null; bgCurrent=img; bgFade=0;
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
function boom(x,y,sc,kind){
  var life=kind==='boss'?1.6:((kind==='elite'||kind==='player')?0.95:0.6);
  fx.push({x:x,y:y,t:0,sc:sc||1,seed:Math.random()*TAU,kind:kind||'normal',life:life});
  if(kind==='player'){
    sfx('bomb_big',0.55); shake=Math.max(shake,14);
  }else if(kind==='elite'){
    for(var i=0;i<3;i++) fx.push({x:x+rand(-24,24),y:y+rand(-18,18),t:-i*0.05,sc:(sc||1)*0.55,seed:Math.random()*TAU,kind:'elite',life:0.95});
    sfx('bomb_big',0.42); shake=Math.max(shake,7);
  }else if(kind==='boss'){
    sfx('bomb_big',1.0); shake=Math.max(shake,26);
  }else if(time-lastBoomSfx>0.045){
    lastBoomSfx=time;sfx('boom',Math.min(1.0,0.45+0.35*(sc||1)));
    if(AC&&!muted){noiseBurst(0.055,0.24,2600);tone(180,55,0.12,0.30,'sawtooth');}
  }
}
function enemyDeath(e){
  if(!e) return;
  if(e.elite){ boom(e.x,e.y,1.35,'elite'); }
  else boom(e.x,e.y,0.75,'normal');
}
function enemyBombExplode(e){
  var bossBomb=!!e.bossBomb,rad=bossBomb?118:72;
  blastZones.push({x:e.x,y:e.y,t:0,life:bossBomb?0.60:0.42,r:rad,hit:false,boss:bossBomb});
  fx.push({x:e.x,y:e.y,t:0,sc:bossBomb?2.4:1.15,seed:Math.random()*TAU,kind:'enemybomb',life:bossBomb?1.15:0.9});
  if(AC&&!muted){
    if(bossBomb){noiseBurst(0.28,0.42,750);tone(62,22,0.42,0.55,'sine');sfx('bomb_big',0.42);}
    else{noiseBurst(0.20,0.32,900);tone(75,28,0.32,0.50,'sine');tone(180,60,0.16,0.22,'sawtooth');}
  }
  shake=Math.max(shake,bossBomb?16:4);
}
function bossDeathBoom(b){
  for(var i=0;i<11;i++){
    var a=i/11*TAU,rr=rand(20,95);
    fx.push({x:b.x+Math.cos(a)*rr,y:b.y+Math.sin(a)*rr,t:-i*0.035,sc:rand(0.7,1.9),seed:Math.random()*TAU,kind:i%3?'boss':'elite',life:rand(1.2,1.8)});
  }
  phaseFx.push({x:b.x,y:b.y,t:0,life:1.8,kind:'death'});
  sfx('bomb_big',1.0); shake=30;
}
function part(x,y,col,n,sp){
  n=n||6; sp=sp||90;
  for(var i=0;i<n;i++){
    var a=Math.random()*TAU,v=sp*(0.3+Math.random());
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.35+Math.random()*0.45,col:col});
  }
}
function startCast(){
  state='cast';castT=0;castScroll=0;castHoldT=0;
  playBgm('s5ending');
}
function setBanner(txt,sub,t){ banner=txt; bannerSub=sub||''; bannerT=t; }

function resetRun(){
  score=0; player.lives=3; player.hp=3; player.bombs=2; player.od=0; player.odT=0; player.powerXp=0; player.respawnT=0; player.respawnGift=false; player.noBlink=false; player.power=1; player.weapon='normal'; player.specialPower=1; player.options=0; player.wingPower=1; player.trail=[]; player.wingEntry=[]; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0;
}
function startGame(){
  resetRun();
  startStage(0);
}
function startAtStage(i){
  i=Math.max(0,Math.min(STAGES.length-1,i|0));
  resetRun();
  // stage-select loadout: enough power to actually play the final stage
  player.power=Math.min(4,1+i*0.8);
  player.specialPower=Math.min(4,1+i);
  player.wingPower=Math.min(4,1+i);
  player.options=Math.min(3,i);
  player.bombs=i>=4?3:2;
  startStage(i);
}
function startStage(i){
  stage=i; stageT=0; waveIndex=0; nextTransport=24+Math.random()*10;
  enemies.length=0; bullets.length=0; ebullets.length=0; shots.length=0; fx.length=0; items.length=0; missiles.length=0; wingBeams.length=0; beams.length=0; orbBullets.length=0; phaseFx.length=0; blastZones.length=0; odLaserFx.length=0; player.trail=[];
  boss=null; runner=null; phaseFx.length=0;
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
  for(var i=0;i<enemies.length;i++){part(enemies[i].x,enemies[i].y,'#ffb066',6,120);enemyDeath(enemies[i]);}
  enemies.length=0;
}
function spawnBoss(){
  if(state==='fusion') return;
  if(stage===4){ startBossFusion(); return; }
  spawnBossNow();
}
function startBossFusion(){
  state='fusion';fusionT=0;boss=null;runner=null;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;
  player.invuln=Math.max(player.invuln,1.2);
  playBgm('s5boss');
  sfx('b_charge',0.50);
}
function spawnBossNow(){
  var def=BOSSES[stage];
  var hpMul=stage===0?1.10:(stage===1?1.10:(stage===2?0.90:1.0));
  var finalMul=stage===4?1.5:1;
  var bhp=Math.round(def.hp*1.4*hpMul*finalMul);
  boss={def:def,x:W/2,y:-130,hp:bhp,max:bhp,phase:0,invuln:1.2,entering:true,t:0,flash:0,patternIdx:0,patternT:0,aimT:0,ringT:0,laserT:0,hitFlash:0,hitX:W/2,hitY:180,ultT:def.ultRate-2.2,ultCharge:0,spiralT:0,spiralAng:0,broadT:0,blinkT:0,bossSigT:0};
  if(stage===4){boss.y=H*.44;boss.entering=false;boss.invuln=1.6;boss.totalHp=bhp;boss.max=Math.round(bhp*.36);boss.hp=boss.max;}
  if(stage===2) repairAudio();
  state='boss'; playBgm(['c','s2boss','s3boss','s4boss','s5boss'][stage]||'c'); setBossPattern(0);
}
function startBossOmen(){
  state='bossOmen';bossOmenT=0;boss=null;runner=null;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;enemies.length=0;
  phaseFx.length=0;shake=Math.max(shake,16);
}
function startBossPhase1Death(){
  state='bossDeath1';bossDeath1T=0;
  bullets.length=0;ebullets.length=0;orbBullets.length=0;beams.length=0;enemies.length=0;
  player.invuln=99;if(boss)bossDeathBoom(boss);
  shake=Math.max(shake,34);
  if(boss) for(var i=0;i<34;i++){
    var a=rand(0,TAU),v=rand(80,460);
    part(boss.x+Math.cos(a)*rand(0,60),boss.y+Math.sin(a)*rand(0,45),
      ['#fff6d8','#ffe7a0','#ff9a3a','#c9a6ff'][i%4],rand(2,5),v);
  }
  sfx('bomb_big',1.0);
}
function drawPhase1DeathScene(){
  var t=bossDeath1T,cx=W/2,cy=H*.26;
  var q=Math.min(1,t/2.7);
  ctx.save();
  // the crystal field starts to dim only after the first flash
  ctx.fillStyle='rgba(2,1,8,'+(0.05+0.72*Math.max(0,(q-.28)/.72))+')';
  ctx.fillRect(0,0,W,H);
  var flash=Math.max(0,1-t/.55);
  if(flash>0){
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=flash*.90;
    var fg=ctx.createRadialGradient(cx,cy,0,cx,cy,H*.55);
    fg.addColorStop(0,'rgba(255,255,255,1)');fg.addColorStop(.22,'rgba(255,244,210,.75)');
    fg.addColorStop(.55,'rgba(190,140,255,.28)');fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,'+(flash*.34)+')';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  // expanding shock rings and broken Hedron
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var k=0;k<7;k++){
    var rr=(t*260+k*28)%(H*.7),al=Math.max(0,1-rr/(H*.7))*.28;
    ctx.globalAlpha=al;ctx.strokeStyle=k%2?'#ffe7a0':'#b58bff';ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
  var hed=GIMG.hrA||GIMG.np1;
  if(hed&&hed.complete&&t<1.7){
    var alpha=Math.max(0,1-t/1.55),sz=260+(t*70);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*.92;
    ctx.translate(cx,cy);ctx.rotate(time*.5);ctx.drawImage(hed,-sz/2,-sz/2,sz,sz);
    ctx.restore();ctx.globalAlpha=1;
  }
  // shard burst
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var i=0;i<22;i++){
    var a=i/22*TAU+Math.sin(i*3.1)*.2,rr=18+t*(150+((i*47)%160));
    var s=2.8+((i*13)%4);
    ctx.globalAlpha=Math.max(0,.8-t/2.4);ctx.fillStyle=i%3?'#fff0c0':(i%3===1?'#ff7e8e':'#c9a6ff');
    ctx.save();ctx.translate(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);ctx.rotate(a*2+t);ctx.fillRect(-s/2,-s*1.8,s,s*3.6);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
  for(var i=0;i<fx.length;i++) drawExplosion(fx[i]);
  for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.col;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}
  ctx.globalAlpha=1;
  ctx.restore();
}
function startBossFusionCinematic(){
  state='bossFusion';bossFusionT=0;
  setBanner('FUSION','FOUR ECHOES',9.0);shake=Math.max(shake,22);
  sfx('b_charge',0.65);
}
function finishBossFusionPhase(){
  state='boss';bossFusionT=0;
  spawnBossNow();
  boss.phase=1;boss.max=Math.round(10080*.64);boss.hp=boss.max;
  boss.y=H*.44;boss.entering=false;boss.invuln=2.2;
  state='bossAwaken';bossAwakenT=2.6;boss.bossSigT=0;
  bullets.length=0;ebullets.length=0;beams.length=0;orbBullets.length=0;
  player.invuln=Math.max(player.invuln,2.8);
  setBanner('CHRONOS ECHO','FUSED FORM',2.4);shake=Math.max(shake,26);
}
function drawBossAwakenFx(){
  var q=Math.max(0,Math.min(1,1-bossAwakenT/2.6));
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // white impact at the instant the ring locks
  var flash=Math.max(0,1-q/.34);
  if(flash>0){ctx.globalAlpha=flash*.55;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);}
  for(var k=0;k<5;k++){
    var rr=80+q*(140+k*32);
    ctx.globalAlpha=(1-q)*.32*(1-k*.12);
    ctx.strokeStyle=k%2?'#ffe7b0':'#b58bff';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();
  }
  // inward shards
  ctx.globalAlpha=(1-q)*.7;
  for(var i=0;i<18;i++){
    var a=i/18*TAU+time*.2,rr=40+(i%5)*14+q*90;
    ctx.fillStyle=i%2?'#fff2c8':'#d8b8ff';
    ctx.save();ctx.translate(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);ctx.rotate(a*2.2+q*4);ctx.fillRect(-1.2,-5,2.4,10);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
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
  boss.phase=p; boss.invuln=1.6; boss.hitFlash=0; boss.ultT=boss.def.ultRate-2.2; boss.ultCharge=0; boss.spiralT=0; boss.broadT=0; boss.blinkT=0; boss.aimT=0; boss.ringT=0; boss.laserT=0;
  boom(boss.x,boss.y,1.5); shake=Math.max(shake,14);
  phaseFx.push({x:boss.x,y:boss.y,t:0,life:1.35,kind:'phase',phase:p});
  setBanner('PHASE '+(p+1),boss.def.name,1.6);
  setBossPattern(0);
}
function bossAimed(n){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>260) return;
  if(stage===2) n=Math.max(2,Math.round(n*0.7));
  var a=Math.atan2(player.y-boss.y,player.x-boss.x),sp=185+stage*8,spread=0.22;
  for(var i=0;i<n;i++){
    if(n>=5&&Math.abs(i-(n-1)/2)<1.01) continue;
    var ang=a+(i-(n-1)/2)*spread;
    ebullets.push({x:boss.x,y:boss.y+18,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,rad:6,type:1});
  }
  sfx('e_shot',0.20);
}
function bossRing(n){
  if(!boss||boss.invuln>0||n<=0) return;
  sfx('e_shot',0.17);
  if(bullets.length+ebullets.length>280) return;
  n=Math.min(n,14);var sp=92+stage*7,gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<n;i++){
    var a=i/n*TAU+time*0.25;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.68) continue;
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
  var n=12,gap=2+Math.floor(Math.random()*(n-4));
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
function bossSeraphFan(){
  if(!boss||boss.invuln>0) return;
  var n=12,sp=112+stage*5,a0=Math.PI/2;
  for(var i=0;i<n;i++){
    if(Math.abs(i-(n-1)/2)<1.01) continue;
    var a=a0+(i-(n-1)/2)*0.078;
    ebullets.push({x:boss.x,y:boss.y+24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:1});
  }
  for(var j=0;j<6;j++){
    var side=j<3?-1:1, off=(j%3)*0.12;
    var ba=a0+side*(0.42+off);
    ebullets.push({x:boss.x+side*80,y:boss.y+8,vx:Math.cos(ba)*(90+stage*5),vy:Math.sin(ba)*(90+stage*5),rad:6,type:2});
  }
  sfx('e_shot',0.22);
}
function bossVortex(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>270) return;
  var arms=2,per=10,sp=88+stage*7,gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var arm=0;arm<arms;arm++){
    for(var i=0;i<per;i++){
      var a=arm/arms*TAU+i/per*TAU+time*0.45;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.78) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:2});
    }
  }
  sfx('e_shot',0.16);
}
function bossCrossfire(){
  if(!boss||boss.invuln>0) return;
  var a=Math.atan2(player.y-boss.y,player.x-boss.x);
  if(beams.length<5){
    spawnBeam(boss.x-82,boss.y+18,a,1400,13,0.8,0.32,1,bossBeamColor(),false,boss);
    spawnBeam(boss.x+82,boss.y+18,a,1400,13,0.8,0.32,1,bossBeamColor(),false,boss);
  }
  for(var side=-1;side<=1;side+=2){
    for(var i=0;i<3;i++){
      var ba=a+side*(0.30+i*0.10);
      ebullets.push({x:boss.x+side*78,y:boss.y+18,vx:Math.cos(ba)*(125+stage*6),vy:Math.sin(ba)*(125+stage*6),rad:5,type:1});
    }
  }
  sfx('e_charge',0.16);
}
function bossHiveBurst(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>270) return;
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x),per=stage===2?7:10;
  for(var r=0;r<2;r++){
    for(var i=0;i<per;i++){
      var a=i/12*TAU+r*0.26+time*0.18;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.64) continue;
      ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(a)*(75+r*28),vy:Math.sin(a)*(75+r*28),rad:4.5,type:2});
    }
  }
  sfx('e_shot',0.18);
}
function bossHalo(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>280) return;
  var n=18,sp=98+stage*6,a0=time*0.38;
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<n;i++){
    var a=a0+i/n*TAU;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.70) continue;
    ebullets.push({x:boss.x,y:boss.y+6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:5,type:1});
  }
  for(var s=-1;s<=1;s+=2){
    var ba=Math.PI/2+s*0.55;
    for(var k=0;k<3;k++) ebullets.push({x:boss.x+s*70,y:boss.y+12,vx:Math.cos(ba+k*0.09*s)*(85+stage*5),vy:Math.sin(ba+k*0.09*s)*(85+stage*5),rad:5,type:2});
  }
  sfx('e_shot',0.18);
}
function bossGatling(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>275) return;
  var a=Math.atan2(player.y-boss.y,player.x-boss.x),sp=245+stage*8;
  for(var i=0;i<6;i++){
    var aa=a+(i-2.5)*0.045;
    ebullets.push({x:boss.x,y:boss.y+14,vx:Math.cos(aa)*sp,vy:Math.sin(aa)*sp,rad:3.8,type:1});
  }
  sfx('e_shot',0.14);
}
function bossBombBarrage(){
  if(!boss||boss.invuln>0) return;
  if(ebullets.length>250) return;
  for(var i=0;i<5;i++){
    var tx=player.x+(i-2)*46;
    ebullets.push({x:boss.x+(i-2)*54,y:boss.y+24,vx:(tx-boss.x)*0.28,vy:95,bomb:true,bossBomb:true,fuse:1.35,rad:12,type:2});
  }
  sfx('e_charge',0.22);
}
function bossRotatingLaser(){
  if(!boss||boss.invuln>0) return;
  if(beams.length>4) return;
  var ey=boss.y+18;
  var base=Math.atan2(player.y-ey,player.x-boss.x);
  // two side cannons converge toward the target, then reverse into a widening fan.
  var sides=[boss.x-78,boss.x+78];
  for(var k=0;k<2;k++){
    var b=spawnBeam(sides[k],ey,base+(k===0?-1:1)*0.06,1300,11,0.90,2.7,1,'#ff9a3a',false,boss);
    if(b){
      b.fan={base:base,side:k===0?1:-1,min:0.055,max:0.52,turn:0.08,rate:1.35,phase:0};
      b.ang=base+b.fan.side*b.fan.min;
    }
  }
  boss.spiralAng+=0.35;
  sfx('e_charge',0.18);
}
function bossCrossLaser(){
  if(!boss||boss.invuln>0||boss.crossOrb) return;
  boss.crossOrb={x:boss.x,y:boss.y,tx:W/2,ty:H*0.48,t:0,travel:0.55,charge:2.05,armed:false,pal:(SIG_BOSS>=0?SIG_BOSS:4)};
  sfx('e_charge',0.30);
}
function bossCrossArms(){
  var cx=W/2,cy=H*0.48,len=Math.max(W,H)*0.9;
  var pal=(boss.crossOrb&&boss.crossOrb.pal!=null)?boss.crossOrb.pal:(SIG_BOSS>=0?SIG_BOSS:4);
  var col=(BOSS_PALETTES[pal]||BOSS_PALETTES[4]).beam;
  for(var k=0;k<4;k++){
    spawnBeam(cx,cy,k*Math.PI/2,len,12,0.28,0.82,1,col,false,null);
  }
  sfx('laser_fire',0.45);
}
function bossChronosBloom(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>300) return;
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var r=0;r<3;r++){
    for(var i=0;i<12;i++){
      var a=i/12*TAU+r*.24+time*.12;
      var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
      if(Math.abs(da)<0.62-r*0.05) continue;
      ebullets.push({x:boss.x,y:boss.y+10,vx:Math.cos(a)*(78+r*30),vy:Math.sin(a)*(78+r*30),rad:5,type:r===2?1:2});
    }
  }
  sfx('e_shot',0.20);
}
function bossEchoCross(){
  if(!boss||boss.invuln>0) return;
  if(beams.length>7) return;
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  var ta=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<4;i++){
    var a=time*.35+i*Math.PI/2;
    var ex=boss.x+Math.cos(a)*110,ey=boss.y+Math.sin(a)*72;
    spawnBeam(ex,ey,ta,1200,8,0.72,0.28,1,cols[i],false,null);
  }
  sfx('e_charge',0.22);
}
function bossCollapse(){
  if(!boss||boss.invuln>0) return;
  if(bullets.length+ebullets.length>320) return;
  var gap=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<22;i++){
    var a=i/22*TAU+time*.25;
    var da=Math.atan2(Math.sin(a-gap),Math.cos(a-gap));
    if(Math.abs(da)<0.58) continue;
    ebullets.push({x:boss.x,y:boss.y+12,vx:Math.cos(a)*(70+stage*6),vy:Math.sin(a)*(70+stage*6),rad:5,type:2});
  }
  sfx('e_shot',0.20);
}
function bossSwarm(){
  if(!boss||boss.invuln>0) return;
  for(var s=-1;s<=1;s+=2){
    var base=Math.atan2(player.y-boss.y,player.x-boss.x)+s*0.24;
    for(var k=0;k<2;k++){
      if(stage===2&&s>0&&k===1) continue;
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
    if(enemies[i].hp<=0){ part(enemies[i].x,enemies[i].y,'#ffb066',10,180); enemyDeath(enemies[i]); score+=ET[enemies[i].type].score; maybeDrop(enemies[i]); removeEnemy(i); }
  }
  if(boss){ boss.hp-=120; boss.flash=0.2; }
}
function hitPlayer(){
  if(player.invuln>0||state!=='play'&&state!=='boss') return;
  if(player.options>0){
    var wi=0,bestY=1e9;
    for(var oi=0;oi<player.options;oi++){
      var op=optionPos(oi);
      if(op.y<bestY){bestY=op.y;wi=oi;}
    }
    var wp=optionPos(wi);
    player.options--; player.wingEntry.splice(wi,1);
    player.invuln=1.0; shake=8; sfx('hurt',0.55);
    part(wp.x,wp.y,'#7fe7ff',14,170); boom(wp.x,wp.y,0.45);
    pickupT=0.9; pickupMsg='WINGMAN SHIELD';
    for(var i=bullets.length-1;i>=0;i--){var dx=bullets[i].x-player.x,dy=bullets[i].y-player.y;if(dx*dx+dy*dy<110*110) bullets.splice(i,1);}
    for(var i=ebullets.length-1;i>=0;i--){var dx=ebullets[i].x-player.x,dy=ebullets[i].y-player.y;if(dx*dx+dy*dy<110*110) ebullets.splice(i,1);}
    return;
  }
  player.hp--;
  player.invuln=1.0; shake=10; sfx('hurt',0.75);
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
    var atMin=player.specialPower<=1;
    var dX=player.x,dY=player.y;
    player.lives--; player.hp=3; player.invuln=2.2; shake=18;
    player.specialPower=Math.max(1,player.specialPower-1); player.power=player.specialPower; player.powerXp=0; player.od=0; player.odT=0; player.bombs=2; player.options=0; player.wingEntry=[];
    rebuildSfxBus();
    player.respawnT=1.3; player.respawnGift=atMin;
    player.x=W/2; player.y=H-130; target.x=player.x; target.y=player.y;
    boom(dX,dY,1.5,'player');
    if(player.lives<=0){ player.respawnT=0; state='over'; playBgm('m5'); }
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
    items.push({x:e.x,y:e.y,vy:45,type:'P',t:0});
    items.push({x:e.x+24,y:e.y,vy:45,type:'W',t:0});
    items.push({x:e.x,y:e.y+16,vy:45,type:'B',t:0});
    if(Math.random()<0.21) items.push({x:e.x+12,y:e.y+24,vy:40,type:'1UP',t:0});
    return;
  }
  if(e.transport) return;
  if(e.elite){
    items.push({x:e.x-20,y:e.y,vy:50,type:'W',t:0});
    items.push({x:e.x+20,y:e.y,vy:50,type:'P',t:0});
    if(Math.random()<0.165) items.push({x:e.x,y:e.y+20,vy:45,type:'1UP',t:0});
    return;
  }
  var chance=([0.10,0.14,0.16,0.35,0.28,0.14][e.type]||0.10)*0.75;
  if(!e.first && Math.random()>=chance) return;
  var r=Math.random(),type;
  if(r<0.40) type='P';
  else if(r<0.52) type='W';
  else if(r<0.66) type='B';
  else if(r<0.96) type='A';
  else type='1UP';
  if(e.first && type==='B') type='P';
  items.push({x:e.x,y:e.y,vy:55,type:type,t:0});
}
function playOneUp(){
  if(!AC||muted) return;
  // bright piano-like arpeggio with soft attack and bell harmonics
  var notes=[1046.5,1318.5,1568.0,2093.0];
  for(var i=0;i<notes.length;i++){
    var f=notes[i],at=i*0.065;
    tone(f,f,0.30,0.16,'triangle',at);
    tone(f*2,f*2,0.18,0.045,'sine',at);
    tone(f*0.5,f*0.5,0.22,0.035,'sine',at);
  }
  noiseBurst(0.025,0.045,5000,0.01);
}
function ammoType(it){ return ['N','S','L','M'][Math.floor(it.t/1.2)%4]; }
function nextAmmoLetter(){var order=['normal','spread','laser','missile'],i=order.indexOf(player.weapon);return ['N','S','L','M'][(i+1)%4];}
function applySpecial(t){
  player.weapon=t==='N'?'normal':(t==='S'?'spread':(t==='L'?'laser':(t==='M'?'missile':t)));
}
function gainOD(n){
  if(player.odT>0){player.odT=Math.min(5.0,player.odT+n*0.02);return false;}
  player.od=Math.min(100,player.od+n);
  if(player.od>=100){player.od=0;player.odT=5.0;sfx('b_charge',0.34);return true;}
  return false;
}
function collectItem(it){
  var t=it.type;
  if(t==='P'){
    if(player.specialPower<4){
      player.powerXp++;
      if(player.powerXp>=2){player.specialPower++;player.powerXp=0;player.power=player.specialPower;pickupMsg='POWER LV'+player.specialPower+(player.specialPower>=4?' MAX':'');}
      else pickupMsg='POWER CHARGE '+player.powerXp+'/2';
    }else{pickupMsg=gainOD(25)?'OVERDRIVE!':'OD +25%';}
    score+=50;
  }else if(t==='A'){
    var at=ammoType(it);applySpecial(at);score+=70;pickupMsg='WEAPON · '+weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':'');
  }else if(t==='S'||t==='L'||t==='M'){ applySpecial(t); score+=80; pickupMsg=weaponName()+' LV'+player.specialPower+(player.specialPower>=4?' MAX':''); }
  else if(t==='W'){
    if(player.options<4||player.wingPower<3){addWingman();pickupMsg='WING '+player.options+' P'+player.wingPower;}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'WING MAX +15 OD';}
    score+=40;
  }else if(t==='1UP'){
    if(player.lives<7){player.lives++;pickupMsg='1UP  LIFE +1';}
    else{pickupMsg=gainOD(25)?'OVERDRIVE!':'LIFE MAX +25 OD';}
    score+=250;
  }else{
    if(player.bombs<5){player.bombs++;pickupMsg='BOMB +1';}
    else{pickupMsg=gainOD(15)?'OVERDRIVE!':'BOMB MAX +15 OD';}
    score+=30;
  }
  part(it.x,it.y,'#9fe8ff',10,120);
  sfx('pickup_real',0.48); if(t==='1UP') playOneUp();
  pickupT=1.4;
}
function weaponName(){ return ({normal:'NORMAL',none:'NONE',spread:'SPREAD',laser:'LASER',missile:'MISSILE'})[player.weapon]||'NORMAL'; }
function cycleWeapon(){
  var order=['normal','spread','laser','missile'];
  var idx=order.indexOf(player.weapon);
  player.weapon=order[(idx+1)%order.length];
  pickupT=1.1;pickupMsg='WEAPON · '+weaponName();
  sfx('pickup_real',0.28);
}
function powerDamageFactor(){ return (([1,0.96,0.94,0.60][Math.max(0,Math.min(3,player.specialPower-1))]||1)*1.10)*(player.odT>0?1.20:1); }
function addShot(x,y,vx,vy,dmg,wing,laser,special,max){ var f=powerDamageFactor(); shots.push({x:x,y:y,vx:vx,vy:vy,dmg:dmg*f*(wing?0.6615:1),wing:!!wing,laser:!!laser,special:!!special,max:!!max}); }
function fireNormal(){
  var lv=player.specialPower;
  if(player.odT>0){
    for(var row=0;row<3;row++){
      for(var i=-2;i<=2;i++) addShot(player.x+i*13,player.y-24-row*9,0,-940,2.4,false,false,true,true);
    }
    addShot(player.x-27,player.y-16,-110,-860,4.0,false,false,false,true);
    addShot(player.x+27,player.y-16,110,-860,4.0,false,false,false,true);
    return;
  }
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
  if(player.odT>0){
    var n=18,sp=760;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+time*0.6;
      addShot(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,1.55,false,false,true,true);
    }
    return;
  }
  var n=3+(player.specialPower-1)*2,spread=0.13,sp=860;
  for(var i=0;i<n;i++){
    var a=(i-(n-1)/2)*spread;
    addShot(player.x,player.y-20,Math.sin(a)*sp,-Math.cos(a)*sp,player.specialPower>=4?2.6:1.8,false,false,true,player.specialPower>=4);
  }
}
function spawnMissile(x,y,wing,dmg,max,vx0,vy0){
  dmg=(dmg||6)*powerDamageFactor();
  if(wing) dmg*=0.6615;
  missiles.push({x:x,y:y,vx:vx0||0,vy:vy0!==undefined?vy0:52,t:0,ignite:0.2,life:2.8,dmg:dmg||6,wing:!!wing,max:!!max,ignited:false});
}
function launchMissiles(){
  if(player.odT>0){
    var dirs=[[0,-300],[-300,0],[300,0],[0,300]];
    for(var g=0;g<4;g++){
      for(var j=-1;j<=1;j++){
        var d=dirs[g],ox=d[0]!==0?j*18:j*10,oy=d[1]!==0?j*10:j*18;
        spawnMissile(player.x+ox,player.y+oy,false,5,true,d[0],d[1]);
      }
    }
    playMissileLaunch();return;
  }
  var n=player.specialPower;
  for(var i=0;i<n;i++){
    var x=player.x+(i-(n-1)/2)*14;
    spawnMissile(x,player.y-16,false,player.specialPower>=4?8:6,player.specialPower>=4);
  }
  playMissileLaunch();
}
function fireWingLaser(p,wp,max){
  var w=4+wp*1.5,dmg=(1.0+wp*0.4)*(max?1.5:1)*0.6615*powerDamageFactor();
  var target=null,tIdx=-1,tY=0,isBoss=false;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-p.x)<w/2+enemyW(e)*0.3&&e.y<p.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-p.x)<w/2+boss.def.w*0.22*1.15&&boss.y<p.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  if(target){
    if(isBoss){boss.hp-=dmg*0.5;boss.hitFlash=0.1;boss.hitX=p.x;boss.hitY=boss.y+16;}
    else{target.hp-=dmg;target.flash=0.1;if(target.hp<=0){score+=ET[target.type].score;enemyDeath(target);maybeDrop(target);removeEnemy(tIdx);}}
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
  var b={x:x,y:y,ang:ang,len:len,w:w,t:0,charge:charge,fire:fire,dmg:dmg,color:color||bossBeamColor(),fired:false,fade:0.15,owner:owner||null,ult:!!ult,offX:owner?(x-owner.x):0,offY:owner?(y-owner.y):0};
  beams.push(b);
  sfx(big?'b_charge':'e_charge',big?0.38:0.22);
  return b;
}
function bossLaser(){
  if(!boss||boss.invuln>0) return;
  var n=boss.def.laserN||1,a=Math.atan2(player.y-boss.y,player.x-boss.x);
  for(var i=0;i<n;i++) spawnBeam(boss.x,boss.y+10,a+(i-(n-1)/2)*0.18,1500,22,1.3,0.45,1,bossBeamColor(),true,boss);
  sfx('laser',0.06);
}
function laserDamageOD(){
  var w=28+Math.min(player.specialPower,3)*5;
  var base=(2+player.specialPower*2)*powerDamageFactor();
  var mainDmg=base*2.0,firstDmg=base*0.50*2.0,secondDmg=base*0.25*2.0;
  var mainHits=[],firstHits=[],hitSet=[],topY=player.y;
  function damageEnemy(e,d){e.hp-=d;e.flash=0.1;if(e.hp<=0)e._odDead=true;}
  // main column
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(e._odDead) continue;
    if(Math.abs(e.x-player.x)<w/2+enemyW(e)*0.34&&e.y<player.y){
      if(e.y<topY)topY=e.y;
      mainHits.push({x:e.x,y:e.y});
      hitSet.push(e);damageEnemy(e,mainDmg);
    }
  }
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-player.x)<w/2+boss.def.w*0.18*1.15&&boss.y<player.y){
    boss.hp-=mainDmg*0.72;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+18;
    mainHits.push({x:boss.x,y:boss.y});
    if(boss.y<topY)topY=boss.y;
  }
  // first refraction: from each main hit to nearby enemies
  for(var m=0;m<mainHits.length&&m<4;m++){
    var src=mainHits[m],picked=[];
    for(var j=0;j<enemies.length;j++){
      var q=enemies[j];if(q._odDead||hitSet.indexOf(q)>=0) continue;
      if(Math.hypot(q.x-src.x,q.y-src.y)<245) picked.push(q);
    }
    picked.sort(function(a,b){return Math.hypot(a.x-src.x,a.y-src.y)-Math.hypot(b.x-src.x,b.y-src.y);});
    for(var j=0;j<picked.length&&j<3;j++){
      var q=picked[j];hitSet.push(q);damageEnemy(q,firstDmg);
      firstHits.push({x:q.x,y:q.y});
      odLaserFx.push({x1:src.x,y1:src.y,x2:q.x,y2:q.y,t:0,life:0.20,level:1});
    }
  }
  // second refraction
  for(var m=0;m<firstHits.length&&m<8;m++){
    var src2=firstHits[m],picked2=[];
    for(var j=0;j<enemies.length;j++){
      var q=enemies[j];if(q._odDead||hitSet.indexOf(q)>=0) continue;
      if(Math.hypot(q.x-src2.x,q.y-src2.y)<235) picked2.push(q);
    }
    picked2.sort(function(a,b){return Math.hypot(a.x-src2.x,a.y-src2.y)-Math.hypot(b.x-src2.x,b.y-src2.y);});
    for(var j=0;j<picked2.length&&j<2;j++){
      var q=picked2[j];hitSet.push(q);damageEnemy(q,secondDmg);
      odLaserFx.push({x1:src2.x,y1:src2.y,x2:q.x,y2:q.y,t:0,life:0.24,level:2});
    }
  }
  // cleanup dead after all chained damage
  for(var i=enemies.length-1;i>=0;i--){
    var e=enemies[i];if(e._odDead){var et=ET[e.type];score+=et.score;part(e.x,e.y,'#ffb066',10,170);enemyDeath(e);maybeDrop(e);removeEnemy(i);}
  }
  laserHitY=topY;laserHitT=0.10;
  if(time-lastHitSfx>0.08){lastHitSfx=time;sfx('e_hit',0.12);}
}

function laserDamage(dt){
  laserTick-=dt; if(laserTick>0) return; laserTick=0.08;
  if(player.odT>0){ laserDamageOD(); return; }
  var w=8+Math.min(player.specialPower,3)*5,dmg=(2+player.specialPower*2)*powerDamageFactor();
  var target=null,tIdx=-1,tY=0;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(Math.abs(e.x-player.x)<w/2+enemyW(e)*0.32&&e.y<player.y&&e.y>tY){target=e;tIdx=i;tY=e.y;}
  }
  var isBoss=false;
  if(boss&&state==='boss'&&boss.invuln<=0&&Math.abs(boss.x-player.x)<w/2+boss.def.w*0.24*1.15&&boss.y<player.y&&boss.y>tY){target=boss;isBoss=true;tY=boss.y;}
  laserHitY=target?tY:0;laserHitT=target?0.12:0;
  if(!target) return;
  if(isBoss){
    boss.hp-=dmg*0.7;boss.hitFlash=0.12;boss.hitX=player.x;boss.hitY=boss.y+20;sfx('b_hit',0.22);
    if(time-lastHitSfx>0.12){lastHitSfx=time;sfx('b_hit',0.1);}
  }else{
    var et=ET[target.type];target.hp-=dmg;target.flash=0.1;sfx('e_hit',0.12);
    if(target.hp<=0){score+=et.score;part(target.x,target.y,'#ffb066',9,160);enemyDeath(target);maybeDrop(target);removeEnemy(tIdx);}
  }
}
function optionBasePos(i){
  var offs=[{x:-36,y:-30},{x:36,y:-30},{x:-52,y:22},{x:52,y:22}];
  var o=offs[i]||{x:0,y:-8};
  return {x:player.x+o.x,y:player.y+o.y};
}
function optionPos(i){
  var e=player.wingEntry[i];
  if(e&&e.t<e.dur) return {x:e.x,y:e.y};
  return optionBasePos(i);
}
function addWingman(){
  if(player.options<4){
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
  // Wingmen are immune to bullets; they only absorb a hit on the main ship.
  return false;
}
function updateOptions(dt){
  if(player.options<=0) return;
  if(state!=='play'&&state!=='boss') return;
  optionT-=dt;
  if(optionT<=0){
    optionT=(player.weapon==='laser'?0.22:0.24)/(player.odT>0?1.25:1);
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
        if(e.hp<=0){score+=et.score;part(e.x,e.y,'#ffb066',9,160);enemyDeath(e);maybeDrop(e);removeEnemy(j);}
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0&&Math.abs(m.x-boss.x)<boss.def.w*0.32*1.15&&Math.abs(m.y-boss.y)<boss.def.h*0.36*1.15){
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
    if(b.fan){
      b.fan.base+=b.fan.turn*dt;
      var fOpen=b.fan.min+(b.fan.max-b.fan.min)*(0.5+0.5*Math.sin(b.t*b.fan.rate+b.fan.phase));
      b.ang=b.fan.base+b.fan.side*fOpen;
    }
    if(b.sweepSpeed){b.ang+=b.sweepSpeed*dt;}
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
    var mhp=Math.round((320+stage*80)*0.85);
    enemies.push({type:w.type,x:W/2,y:-60,baseX:W/2,tx:W/2,ty:250,mode:'turret',entering:true,t:0,phase:0,spd:80,hp:mhp,max:mhp,fireT:1.0,flash:0,elite:true,visT:0,first:true});
    return;
  }
  if(w.form==='escort'){
    var lead={type:w.type||4,x:W/2,y:-70,baseX:W/2,tx:W/2,ty:230,mode:'escortLead',entering:false,t:0,phase:0,spd:w.spd||65,hp:Math.round(ET[w.type||4].hp*2.2*0.85),max:Math.round(ET[w.type||4].hp*2.2*0.85),fireT:1.2,flash:0,noFire:false,aggr:1,role:'',visT:0,elite:true,first:true};
    enemies.push(lead);
    for(var k=0;k<4;k++){
      var oa0=k/4*TAU,chx=lead.x+Math.cos(oa0)*58,chy=lead.y+Math.sin(oa0)*34;var ch={type:k%2?5:0,x:chx,y:chy,baseX:lead.x,tx:lead.x,ty:lead.y,mode:'escortOrbit',leader:lead,entering:false,t:0,phase:oa0,spd:90,hp:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),max:Math.round(ET[k%2?5:0].hp*(1+stage*0.18)),fireT:1.0+k*0.2,flash:0,noFire:false,aggr:0.8,role:'',visT:0,first:false};
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
    else if(w.form==='mandala'){ var ma=i/n*TAU; x=W/2+Math.cos(ma)*W*.42; y=-45+Math.sin(ma)*28; tx=W/2+Math.cos(ma)*102; ty=245+Math.sin(ma)*70; baseX=W/2; mode='ringEnter'; }
    else if(w.form==='fractal'){ var fa=i/n*TAU*1.5; x=W/2+Math.cos(fa)*W*.44; y=-45+Math.sin(fa)*24; tx=W/2+Math.cos(fa)*78; ty=255+Math.sin(fa)*58; baseX=W/2; mode='ringEnter'; }
    else if(w.form==='spiral'){ var sa=i/n*TAU*1.7; x=W/2+Math.cos(sa)*W*.40; y=-55+Math.sin(sa)*22; tx=W/2+Math.cos(sa)*108; ty=265+Math.sin(sa)*76; baseX=W/2; mode='ringEnter'; }
    else { x=W/2+(i-(n-1)/2)*40; y=-50; baseX=x; mode='dive'; }
    var ehp=Math.round(ET[w.type].hp*(1+stage*0.18)*((w.elite&&(n<=2||i===0))?0.85:1));
    var e={type:w.type,x:x,y:y,baseX:baseX,tx:tx,ty:ty,mode:mode,entering:(mode==='pincer'||mode==='turret'||mode==='orbitEnter'||mode==='ringEnter'||mode==='arc'),t:0,phase:i*0.7,spd:w.spd,hp:ehp,max:ehp,fireT:0.8+Math.random()*0.8,flash:0,noFire:!!w.noFire,aggr:w.aggr||1,role:w.role||'',visT:0,elite:!!w.elite&&(n<=2||i===0),first:(i===0&&waveIndex%2===0)};
    if(mode==='dive'){
      var a=Math.atan2(player.y-y,player.x-x);
      e.vx=Math.cos(a)*w.spd; e.vy=Math.sin(a)*w.spd;
    }
    if(mode==='cross'){
      var ca=Math.atan2(H*0.55-y,W/2-x);e.vx=Math.cos(ca)*w.spd;e.vy=Math.sin(ca)*w.spd;
    }
    if(e.type>=9)e.variant=Math.floor(Math.random()*6);
    enemies.push(e);
    if(e.type===6){for(var ok=0;ok<8;ok++) orbBullets.push({owner:e,ang:ok/8*TAU,r:50,spin:1.15,rad:4,type:2});}
  }
}
function enemyScale(e){ return e.transport?1.45:(e.elite?1.6:1.5); }
function enemyW(e){ return ET[e.type].w*enemyScale(e); }
function fireEnemy(e){
  if(e.transport) return;
  if(e.visT!==undefined&&e.visT<0.22) return;
  if(bullets.length+ebullets.length>240) return;
  var ra=Math.atan2(player.y-e.y,player.x-e.x);
  if(e.type===9){
    ebullets.push({x:e.x,y:e.y+8,vx:Math.cos(ra)*(235+stage*5),vy:Math.sin(ra)*(235+stage*5),rad:4,type:1});
    sfx('e_shot',0.12);return;
  }
  if(e.type===10){
    var gap10=Math.random()*TAU;
    for(var q10=0;q10<10;q10++){
      var a10=q10/10*TAU+time*0.18;
      var d10=Math.atan2(Math.sin(a10-gap10),Math.cos(a10-gap10));
      if(Math.abs(d10)<0.55) continue;
      ebullets.push({x:e.x,y:e.y,vx:Math.cos(a10)*115,vy:Math.sin(a10)*115,rad:4.5,type:2});
    }
    sfx('e_shot',0.14);return;
  }
  if(e.type===11){
    for(var q11=-2;q11<=2;q11++){
      var a11=ra+q11*0.16;
      ebullets.push({x:e.x,y:e.y+8,vx:Math.cos(a11)*185,vy:Math.sin(a11)*185,rad:5,type:1});
    }
    if(beams.length<5) spawnBeam(e.x,e.y+6,ra,1100,8,0.8,0.28,1,'#c7a6ff',false,e);
    sfx('e_charge',0.18);return;
  }
  if(e.type===7){
    if(beams.length<4) spawnBeam(e.x,e.y+4,ra,1500,8,1.05,0.22,1,'#ff5a5a',false,e);
    sfx('e_charge',0.24);return;
  }
  if(e.type===8){
    for(var mi=0;mi<5;mi++){
      var ma=ra+(mi-2)*0.24;
      ebullets.push({x:e.x+(mi-2)*8,y:e.y+10,vx:Math.cos(ma)*38,vy:Math.sin(ma)*38,rad:7,type:2,fuse:1.35,burst:8});
    }
    sfx('e_shot',0.16);return;
  }
  if(e.type===4&&Math.random()<0.42){
    ebullets.push({x:e.x,y:e.y+10,vx:Math.cos(ra)*55,vy:Math.sin(ra)*55,rad:9,type:2,bomb:true,fuse:1.25});
    sfx('e_charge',0.20);return;
  }
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
  if(stage===4&&boss.phase>=1){
    boss.ultPick=Math.floor(Math.random()*4);
    var un=['TENTACLE CAGE','LASER CURTAIN','SWARM SINGULARITY','SERAPHIC CHOIR'];
    var on=['VOID SOVEREIGN','ABYSS DEVOURER','STAR BEHEMOTH','SERAPHIC WINGS'];
    setBanner('FUSED MEMORY / '+un[boss.ultPick],on[boss.ultPick],1.5);
  }else{
    setBanner(ultimateName(boss.def),boss.def.name,1.5);
  }
  sfx('b_charge',0.46);
  if(boss.def.style==='dread') primeDreadUltimate();
}
function ultimateName(def){
  return def.style==='octopus'?'TENTACLE CAGE':(def.style==='dread'?'LASER CURTAIN':(def.style==='chronos'?'CHRONOS COLLAPSE':'SWARM SINGULARITY'));
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
function ultSeraph(){
  var base=Math.atan2(player.y-boss.y,player.x-boss.x);
  var boost=(stage===4&&boss.phase===2)?1.28:1;
  for(var r=0;r<4;r++){
    var n=18+r*4,sp=(72+r*18)*boost,gap=0.50,gapR=base+r*.22;
    for(var i=0;i<n;i++){
      var a=i/n*TAU+r*.15,da=Math.atan2(Math.sin(a-gapR),Math.cos(a-gapR));
      if(Math.abs(da)<gap/2) continue;
      ebullets.push({x:boss.x,y:boss.y+8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rad:4.8,type:2});
    }
  }
  for(var i=0;i<9;i++){
    var aa=base+(i-4)*.11;
    ebullets.push({x:boss.x,y:boss.y+14,vx:Math.cos(aa)*225*boost,vy:Math.sin(aa)*225*boost,rad:6,type:1});
  }
}
function sigOcto(){bossSpiral(3,1,120);bossVortex();bossAimed(5);}
function sigDread(){bossWall();bossCrossfire();bossBroadside();}
function sigHive(){bossHiveBurst();bossSwarm();bossBlink();}
function sigSeraph(){bossSeraphFan();bossHalo();}
var SIG_FNS=[[sigOcto,bossVortex],[sigDread,bossCrossfire,bossBombBarrage],[sigHive,bossSwarm,bossRotatingLaser],[sigSeraph,bossCrossLaser,bossGatling]];
function runSignature(pi,fn){
  if(!boss||!fn) return;
  var old=SIG_BOSS;SIG_BOSS=pi;var start=ebullets.length,bstart=beams.length;
  try{fn();}catch(e){}
  for(var i=start;i<ebullets.length;i++) if(ebullets[i].bossPal==null) ebullets[i].bossPal=pi;
  SIG_BOSS=old;
}
function bossUltimate(){
  if(!boss) return;
  if(stage===4&&boss.phase>=1){
    var pick=(boss.ultPick==null)?Math.floor(Math.random()*4):boss.ultPick;
    var fns=[ultOctopus,ultDread,ultHive,ultSeraph];
    runSignature(pick,fns[pick]);
    if(boss.phase===2){
      var p2=(pick+1+Math.floor(Math.random()*3))%4;
      runSignature(p2,fns[p2]);
    }
  }else if(boss.def.style==='octopus') ultOctopus();
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
  for(var i=fx.length-1;i>=0;i--) if(fx[i].t>(fx[i].life||0.6)) fx.splice(i,1);
  for(var pi=phaseFx.length-1;pi>=0;pi--){phaseFx[pi].t+=dt;if(phaseFx[pi].t>phaseFx[pi].life) phaseFx.splice(pi,1);}
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
  if(state==='bossDeath1'){bossDeath1T+=dt;if(bossDeath1T>=2.7)startBossOmen();return;}
  if(state==='bossOmen'){bossOmenT+=dt;if(bossOmenT>=6.5)startBossFusionCinematic();return;}
  if(state==='bossFusion'){bossFusionT+=dt;if(bossFusionT>=9.4)finishBossFusionPhase();return;}
  if(state==='fusion'){fusionT+=dt;if(fusionT>=3.6)spawnBossNow();return;}
  if(state==='bossAwaken'){bossAwakenT-=dt;if(bossAwakenT<=0){state='boss';if(boss)boss.invuln=1.4;setBossPattern(0);} }
  if(state==='finale'){finaleT+=dt;if(finaleT>=7.7)startCast();return;}
  if(state==='cast'){castT+=dt;castScroll=Math.min(CAST_TOTAL,castScroll+18*dt);if(castScroll>=CAST_TOTAL)castHoldT+=dt;return;}
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
  if(player.odT>0) player.odT=Math.max(0,player.odT-dt);
  if(player.respawnT>0){
    player.respawnT-=dt;
    if(player.respawnT<=0){
      player.respawnT=0;
      if(player.respawnGift){
        player.respawnGift=false;
        items.push({x:W/2-22,y:H-175,vy:0,type:'P',t:0});
        items.push({x:W/2+22,y:H-175,vy:0,type:'A',t:0});
        pickupT=1.4; pickupMsg='RECOVERY SUPPLY';
      }
    }
  }
  player.trail.unshift({x:player.x,y:player.y}); if(player.trail.length>140) player.trail.pop();

  if((state==='play'||state==='boss')&&player.respawnT<=0){
    if(player.weapon==='spread'){
      if(time-lastSpecial>(player.odT>0?0.080:0.16)){ lastSpecial=time; fireSpread(); sfx('p_spread',0.36); }
    }else if(player.weapon==='laser'){
      laserDamage(dt);
    }else if(player.weapon==='missile'){
      if(time-lastMissile>0.46){ lastMissile=time; launchMissiles(); }
    }else{
      if(time-lastShot>(player.odT>0?0.033:0.10)){ lastShot=time; fireNormal(); if(Math.random()<0.7) sfx('p_normal',0.34); }
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
      else { if(stage===4) startCast(); else {state='win';playBgm('m5');} }
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
        if(e.hp<=0){ score+=et.score; part(e.x,e.y,'#ffb066',9,160); enemyDeath(e); maybeDrop(e); removeEnemy(j); }
        break;
      }
    }
    if(!hit&&boss&&state==='boss'&&boss.invuln<=0){
      if(Math.abs(s.x-boss.x)<boss.def.w*0.30*1.15&&Math.abs(s.y-boss.y)<boss.def.h*0.34*1.15){
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
      if(ad<6){e.entering=false;e.mode='down';e.baseX=e.x;}
      else{e.x+=ax/ad*e.spd*2*dt;e.y+=ay/ad*e.spd*2*dt;}
    }else if(e.mode==='cross'){ e.x+=e.vx*dt; e.y+=e.vy*dt; }
    else if(e.mode==='strafe'){ e.x+=e.vx*dt; e.y+=Math.sin(e.t*2)*18*dt; }
    else if(e.mode==='feint'){
      e.y+=e.spd*dt;
      if(e.t>1.8){e.mode='retreat';e.vy=-e.spd*1.4;}
    }else if(e.mode==='retreat'){ e.y+=e.vy*dt; e.x+=Math.sin(e.t*4)*30*dt; }
    else if(e.mode==='ringEnter'){
      var rx=e.tx-e.x,ry=e.ty-e.y,rd=Math.hypot(rx,ry);
      if(rd<6){e.mode='ringEase';e.entering=false;e.t=0;e.ex=e.x;e.ey=e.y;e.phase=Math.atan2(e.y-H*0.33,e.x-W/2);}
      else{e.x+=rx/rd*e.spd*2.2*dt;e.y+=ry/rd*e.spd*2.2*dt;}
    }else if(e.mode==='ringEase'){
      var rk=Math.min(1,e.t*4),rA0=e.phase+e.t*0.62,rwx=W/2+Math.cos(rA0)*110,rwy=H*0.33+Math.sin(rA0)*85;
      e.x=e.ex+(rwx-e.ex)*rk;e.y=e.ey+(rwy-e.ey)*rk;
      if(rk>=1){e.mode='ring';e.t=0;}
    }else if(e.mode==='ring'){
      var rA=e.phase+e.t*0.62;e.x=W/2+Math.cos(rA)*110;e.y=H*0.33+Math.sin(rA)*85;
      if(e.t>11){e.mode='down';e.baseX=e.x;}
    }else if(e.mode==='orbitEnter'){
      var ox=e.tx-e.x,oy=e.ty-e.y,od=Math.hypot(ox,oy);
      if(od<6){e.mode='orbitEase';e.entering=false;e.t=0;e.ex=e.x;e.ey=e.y;e.phase=Math.atan2(e.y-280,e.x-W/2);}
      else{e.x+=ox/od*e.spd*2.4*dt;e.y+=oy/od*e.spd*2.4*dt;}
    }else if(e.mode==='orbitEase'){
      var ok=Math.min(1,e.t*4),oa3=e.phase+e.t*0.8,owx=W/2+Math.cos(oa3)*150,owy=280+Math.sin(oa3)*80;
      e.x=e.ex+(owx-e.ex)*ok;e.y=e.ey+(owy-e.ey)*ok;
      if(ok>=1){e.mode='orbit';e.t=0;}
    }else if(e.mode==='orbit'){
      if(e.t>7){e.mode='down';e.baseX=e.x;}
      else{var oa2=e.phase+e.t*0.8;e.x=W/2+Math.cos(oa2)*150;e.y=280+Math.sin(oa2)*80;}
    }
    else if(e.mode==='pincer'&&e.entering){
      var ex=e.tx-e.x,ey=e.ty-e.y,ed=Math.hypot(ex,ey);
      if(ed<6){e.entering=false;e.mode='down';e.baseX=e.x;}
      else {var step=Math.min(ed,e.spd*1.8*dt);e.x+=ex/ed*step;e.y+=ey/ed*step;}
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
    if(e.px!==undefined&&e.t>0.08){
      var jx=e.x-e.px,jy=e.y-e.py,jd=Math.hypot(jx,jy);
      if(jd>12){e.x=e.px+jx/jd*12;e.y=e.py+jy/jd*12;}
    }
    e.px=e.x;e.py=e.y;
    var vis=(e.x>14&&e.x<W-14&&e.y>14&&e.y<H-60);
    e.visT=vis?((e.visT||0)+dt):0;
    if(!e.transport&&!e.noFire&&!e.entering&&e.visT>0.22){
      e.fireT-=dt;
      if(e.fireT<=0){ fireEnemy(e); e.fireT=ET[e.type].fire/e.aggr+rand(-0.2,0.2); }
    }
    var edx=e.x-player.x,edy=e.y-player.y;
    var er=ET[e.type].r*(e.transport?1.45:(e.elite?1.6:1.5));
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
  updateBlastZones(dt);
  updateODLaserFx(dt);
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
    if(boss.crossOrb){
      var co=boss.crossOrb;co.t+=dt;
      if(co.t<=co.travel){var ck=Math.min(1,co.t/co.travel);co.x=boss.x+(co.tx-boss.x)*ck;co.y=boss.y+(co.ty-boss.y)*ck;}
      else if(!co.armed&&co.t>=co.travel+co.charge){co.armed=true;bossCrossArms();boss.crossOrb=null;}
    }
    var ty=(stage===4?H*.26:((def.move==='dash')?215:205));
    if(boss.entering){
      boss.y+=140*dt;
      if(boss.y>=ty){boss.y=ty;boss.entering=false;boss.invuln=1.0;boss.t=0;}
    }else{
      if(def.move==='sine') boss.x=W/2+Math.sin(boss.t*0.6)*82;
      else if(def.move==='wide') boss.x=W/2+Math.sin(boss.t*0.45)*112;
      else boss.x=W/2+Math.sin(boss.t*1.05)*120;
      if(stage===4) boss.y+=(ty-boss.y)*Math.min(1,dt*1.8);
      else boss.y=ty+Math.sin(boss.t*0.8)*8;
      if(def.move==='dash'&&stage!==4) boss.y=ty+Math.sin(boss.t*0.55)*16;
      var hw=def.w/2+6; boss.x=Math.max(hw,Math.min(W-hw,boss.x));
      if(boss.ultCharge<=0){
        if(boss.phase===0&&boss.hp<boss.max*0.60&&stage!==4) bossPhase(1);
        else if(boss.phase===1&&boss.hp<boss.max*(stage===4?0.50:0.30)) bossPhase(2);
      }
      if(boss.ultCharge>0){
        boss.ultCharge-=dt;
        if(boss.ultCharge<=0) bossUltimate();
      }else{
        boss.ultT+=dt;
        if(boss.ultT>def.ultRate){
          beginBossUltimate();
        }else{
          if(stage===4&&boss.phase>=1){
            boss.bossSigT=(boss.bossSigT||0)+dt;
            var sigGap=boss.phase===2?2.4:3.2;
            if(boss.bossSigT>sigGap){
              boss.bossSigT=0;
              var spi=Math.floor(Math.random()*4);
              var arr=SIG_FNS[spi];
              runSignature(spi,arr[Math.floor(Math.random()*arr.length)]);
            }
          }
          boss.patternT+=dt; if(boss.patternT>8) setBossPattern(boss.patternIdx+1);
          boss.aimT+=dt; boss.ringT+=dt; boss.laserT+=dt; boss.spiralT+=dt; boss.broadT+=dt; boss.blinkT+=dt;
          var rage=boss.phase===2?0.72:1;
          if(def.style==='octopus'){
            if(boss.phase===0){
              if(boss.spiralT>0.17){boss.spiralT=0;bossSpiral(3,1,105+stage*8);}
              if(boss.aimT>2.2){boss.aimT=0;bossAimed(3);}
              if(boss.ringT>6.0){boss.ringT=0;bossRing(10);}
            }else if(boss.phase===1){
              if(boss.spiralT>0.20){boss.spiralT=0;bossSpiral(4,-1,95+stage*8);}
              if(boss.ringT>3.6){boss.ringT=0;bossVortex();}
              if(boss.aimT>2.0){boss.aimT=0;bossAimed(5);}
              if(boss.laserT>8.0){boss.laserT=0;bossGatling();}
            }else{
              if(boss.spiralT>0.12){boss.spiralT=0;bossSpiral(4,1,125+stage*8);}
              if(boss.ringT>2.8){boss.ringT=0;bossVortex();}
              if(boss.aimT>1.7){boss.aimT=0;bossAimed(7);}
              if(boss.laserT>6.2){boss.laserT=0;bossGatling();}
            }
          }else if(def.style==='dread'){
            if(boss.phase===0){
              if(boss.broadT>5.5){boss.broadT=0;bossBroadside();}
              if(boss.aimT>2.6){boss.aimT=0;bossWall();}
              if(boss.ringT>5.8){boss.ringT=0;bossRing(16);}
            }else if(boss.phase===1){
              if(boss.broadT>4.2){boss.broadT=0;bossCrossfire();}
              if(boss.aimT>2.0){boss.aimT=0;bossWall();}
              if(boss.ringT>4.6){boss.ringT=0;bossRing(18);}
              if(boss.laserT>7.0){boss.laserT=0;bossBombBarrage();}
            }else{
              if(boss.broadT>3.0){boss.broadT=0;bossBroadside();bossCrossfire();}
              if(boss.aimT>1.5){boss.aimT=0;bossWall();}
              if(boss.ringT>3.2){boss.ringT=0;bossRing(20);}
              if(boss.laserT>5.5){boss.laserT=0;bossBombBarrage();}
            }
          }else if(def.style==='seraph'){
            if(boss.phase===0){
              if(boss.spiralT>0.55){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(7);}
            }else if(boss.phase===1){
              if(boss.ringT>3.4){boss.ringT=0;bossHalo();}
              if(boss.spiralT>0.48){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.7){boss.aimT=0;bossAimed(7);}
              if(boss.laserT>7.2){boss.laserT=0;bossCrossLaser();}
            }else{
              if(boss.ringT>2.6){boss.ringT=0;bossHalo();}
              if(boss.spiralT>0.32){boss.spiralT=0;bossSeraphFan();}
              if(boss.aimT>1.35){boss.aimT=0;bossAimed(9);}
              if(boss.laserT>5.8){boss.laserT=0;bossCrossLaser();}
            }
          }else if(def.style==='chronos'&&boss.phase===0){
            if(boss.phase===0){
              if(boss.ringT>2.8){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(6);}
              if(boss.laserT>4.8){boss.laserT=0;bossEchoCross();}
            }else if(boss.phase===1){
              if(boss.ringT>2.8){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.5){boss.aimT=0;bossAimed(8);}
              if(boss.laserT>4.2){boss.laserT=0;bossEchoCross();}
              if(boss.broadT>4.0){boss.broadT=0;bossCollapse();}
            }else{
              if(boss.ringT>2.0){boss.ringT=0;bossChronosBloom();}
              if(boss.aimT>1.15){boss.aimT=0;bossAimed(9);}
              if(boss.laserT>3.2){boss.laserT=0;bossEchoCross();}
              if(boss.broadT>3.0){boss.broadT=0;bossCollapse();}
            }
          }else{
            if(boss.phase===0){
              if(boss.spiralT>0.52){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.9){boss.aimT=0;bossAimed(5);}
              if(boss.blinkT>5.0){boss.blinkT=0;bossBlink();}
            }else if(boss.phase===1){
              if(boss.ringT>3.2){boss.ringT=0;bossHiveBurst();}
              if(boss.spiralT>0.44){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.8){boss.aimT=0;bossAimed(6);}
              if(boss.blinkT>4.2){boss.blinkT=0;bossBlink();}
              if(boss.laserT>7.4){boss.laserT=0;bossRotatingLaser();}
            }else{
              if(boss.ringT>2.4){boss.ringT=0;bossHiveBurst();}
              if(boss.spiralT>0.30){boss.spiralT=0;bossSwarm();}
              if(boss.aimT>1.4){boss.aimT=0;bossAimed(8);}
              if(boss.blinkT>3.2){boss.blinkT=0;bossBlink();}
              if(boss.laserT>5.6){boss.laserT=0;bossRotatingLaser();}
            }
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
    if(stage===4&&boss&&boss.phase===0&&boss.hp<=0){ boss.hp=0; startBossPhase1Death(); }
    else if(boss.hp<=0){
      boss.hp=0;
      for(var k=0;k<30;k++) part(boss.x+rand(-70,70),boss.y+rand(-40,40),'#ffb066',2,220);
      bossDeathBoom(boss);
      bullets.length=0; ebullets.length=0; beams.length=0;
      score+=1000; player.bombs=Math.min(5,player.bombs+1);
      if(stage===4){
        finaleT=0;state='finale';shake=48;
        for(var fk=0;fk<18;fk++) phaseFx.push({x:W/2+rand(-120,120),y:H*.44+rand(-100,100),t:-fk*.035,life:3.8,kind:'death'});
        for(var pk=0;pk<110;pk++){
          var pa=rand(0,TAU),pv=rand(80,520);
          part(W/2+Math.cos(pa)*rand(0,70),H*.44+Math.sin(pa)*rand(0,50),['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0','#7fe6ff'][pk%5],rand(2,5),pv);
        }
      }else{setBanner('STAGE CLEAR',STAGES[stage].name,3.0);state='clear';}
      boss=null; runner=null;
    }
    if(boss){boss.prevX=boss.x;boss.prevY=boss.y;}
    var bdx2=boss?boss.x-player.x:0,bdy2=boss?boss.y-player.y:0;
    if(boss&&bdx2*bdx2+bdy2*bdy2<(boss.def.w*0.28*1.15)*(boss.def.w*0.28*1.15)) hitPlayer();
  }

  for(var i=ebullets.length-1;i>=0;i--){
    var e=ebullets[i]; e.x+=e.vx*dt; e.y+=e.vy*dt;
    if(e.bomb){
      e.fuse-=dt;
      if(e.fuse<=0){ enemyBombExplode(e); ebullets.splice(i,1); continue; }
      if(e.x<-40||e.x>W+40||e.y>H+40){ ebullets.splice(i,1); }
      continue;
    }
    if(e.fuse!==undefined){
      e.fuse-=dt;
      if(e.fuse<=0){
        for(var q=0;q<(e.burst||8);q++){var qa=q/(e.burst||8)*TAU;ebullets.push({x:e.x,y:e.y,vx:Math.cos(qa)*115,vy:Math.sin(qa)*115,rad:5,type:2});}
        ebullets.splice(i,1);continue;
      }
    }
    if(e.x<-30||e.x>W+30||e.y<-30||e.y>H+30){ebullets.splice(i,1);continue;}
    if(wingmanBlock(e.x,e.y,e.rad)){ebullets.splice(i,1);continue;}
    var ex=e.x-player.x,ey=e.y-player.y;
    if(ex*ex+ey*ey<(e.rad+player.r)*(e.rad+player.r)) hitPlayer();
  }
}

function updateODLaserFx(dt){
  for(var i=odLaserFx.length-1;i>=0;i--){odLaserFx[i].t+=dt;if(odLaserFx[i].t>odLaserFx[i].life)odLaserFx.splice(i,1);}
}
function drawODLaserFx(){
  for(var i=0;i<odLaserFx.length;i++){
    var f=odLaserFx[i],a=Math.max(0,1-f.t/f.life);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=(f.level===1?0.85:0.65)*a;
    ctx.strokeStyle=f.level===1?'#8ff6ff':'#ffe08a';ctx.lineWidth=f.level===1?4:2.2;
    ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
    ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=f.level===1?1.4:0.9;
    ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
    ctx.restore();ctx.globalAlpha=1;
  }
}
function updateBlastZones(dt){
  for(var i=blastZones.length-1;i>=0;i--){
    var z=blastZones[i];z.t+=dt;
    if(!z.hit){
      var dx=player.x-z.x,dy=player.y-z.y;
      if(dx*dx+dy*dy<z.r*z.r){z.hit=true;hitPlayer();}
    }
    if(z.t>=z.life) blastZones.splice(i,1);
  }
}
function drawBlastZones(){
  for(var i=0;i<blastZones.length;i++){
    var z=blastZones[i],p=Math.min(1,z.t/z.life),a=1-p;
    var rr=z.r*(0.35+0.65*Math.min(1,p*1.8));
    ctx.save();ctx.globalCompositeOperation='lighter';
    var g=ctx.createRadialGradient(z.x,z.y,0,z.x,z.y,rr);
    if(z.boss){g.addColorStop(0,'rgba(255,235,150,'+(0.65*a)+')');g.addColorStop(0.45,'rgba(255,120,50,'+(0.38*a)+')');g.addColorStop(1,'rgba(255,60,20,0)');}
    else{g.addColorStop(0,'rgba(190,255,255,'+(0.55*a)+')');g.addColorStop(0.45,'rgba(60,180,255,'+(0.30*a)+')');g.addColorStop(1,'rgba(30,80,255,0)');}
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,rr,0,TAU);ctx.fill();
    ctx.globalAlpha=0.85*a;ctx.strokeStyle=z.boss?'#ffe6a0':'#9fefff';ctx.lineWidth=z.boss?5:3;
    ctx.beginPath();ctx.arc(z.x,z.y,rr,0,TAU);ctx.stroke();
    ctx.restore();ctx.globalAlpha=1;
  }
}
function drawLoopLayer(img,scroll,alpha,fitWidth,mirror,blend){
  if(!img||!img.complete||!img.naturalWidth) return false;
  var sc=fitWidth?W/img.width:Math.max(W/img.width,H/img.height);
  var bw=img.width*sc,bh=img.height*sc,x=(W-bw)/2,baseY=(H-bh)/2;
  var loopH=bh*2,off=((scroll%loopH)+loopH)%loopH;
  ctx.globalAlpha=alpha;
  ctx.globalCompositeOperation=blend||'source-over';
  for(var n=-2;n<=2;n++){
    var top=baseY+off+n*bh;
    if(top>H||top+bh<0) continue;
    var even=((n%2)+2)%2===0;
    if(!mirror||even) ctx.drawImage(img,x,top,bw,bh);
    else{ctx.save();ctx.translate(x,top+bh);ctx.scale(1,-1);ctx.drawImage(img,0,0,bw,bh);ctx.restore();}
  }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; return true;
}
function paintJuliaKaleido(cx,cy){
  if(!JULIA_CANVAS){
    JULIA_CANVAS=document.createElement('canvas');JULIA_CANVAS.width=JULIA_W;JULIA_CANVAS.height=JULIA_H;
    JULIA_CTX=JULIA_CANVAS.getContext('2d');JULIA_DATA=JULIA_CTX.createImageData(JULIA_W,JULIA_H);
  }
  if(JULIA_TICK++%3===0){
    var d=JULIA_DATA.data,theta=.35+time*.045,cr=.7885*Math.cos(theta),ci=.7885*Math.sin(theta);
    for(var y=0;y<JULIA_H;y++){
      for(var x=0;x<JULIA_W;x++){
        var nx=(x/JULIA_W-.5)*2.2,ny=(y/JULIA_H-.5)*2.2;
        var r=Math.sqrt(nx*nx+ny*ny),a=Math.atan2(ny,nx);
        // 6-fold mirrored kaleidoscope fold
        var sec=TAU/6;
        a=Math.abs(((a%sec)+sec)%sec-sec/2);
        var zx=Math.cos(a)*r*1.25,zy=Math.sin(a)*r*1.25,it=0,max=32;
        for(;it<max;it++){var xx=zx*zx-zy*zy+cr;zy=2*zx*zy+ci;zx=xx;if(zx*zx+zy*zy>16)break;}
        var idx=(y*JULIA_W+x)*4;
        if(it>=max){d[idx+3]=0;continue;}
        var t=it/max;
        d[idx]=Math.floor(80+165*t);d[idx+1]=Math.floor(175+75*t);d[idx+2]=Math.floor(220+35*t);
        d[idx+3]=Math.floor(22+170*t*t);
      }
    }
    JULIA_CTX.putImageData(JULIA_DATA,0,0);
  }
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.72;
  ctx.drawImage(JULIA_CANVAS,0,0,W,H);ctx.restore();ctx.globalAlpha=1;
}
function drawSierpinskiField(cx,cy){
  var R=Math.min(W,H)*.56;
  var cols=['rgba(255,226,150,','rgba(150,220,255,','rgba(200,150,255,'];
  function tri(x1,y1,x2,y2,x3,y3,d,col,alpha){
    if(d<=0){
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();
      ctx.strokeStyle=col+alpha+')';ctx.lineWidth=.95;ctx.stroke();return;
    }
    var ax=(x1+x2)/2,ay=(y1+y2)/2,bx=(x2+x3)/2,by=(y2+y3)/2,cx2=(x3+x1)/2,cy2=(y3+y1)/2;
    tri(x1,y1,ax,ay,cx2,cy2,d-1,col,alpha);
    tri(ax,ay,x2,y2,bx,by,d-1,col,alpha);
    tri(cx2,cy2,bx,by,x3,y3,d-1,col,alpha);
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var layer=0;layer<3;layer++){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(time*(.025+layer*.012)+layer*2.094);
    var br=1+Math.sin(time*.35+layer)*.045;ctx.scale(br,br);
    tri(0,-R,-R*.866,R*.5,R*.866,R*.5,4,cols[layer],(.30-layer*.055));
    ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}
var FRACTAL_LAYERS=[];
function fractalZone(idx,img,rot,scale,r0,r1,feather,alpha){
  if(!FRACTAL_LAYERS[idx]){
    var cv=document.createElement('canvas');cv.width=W;cv.height=H;FRACTAL_LAYERS[idx]=cv;
  }
  var c=FRACTAL_LAYERS[idx],g=c.getContext('2d');
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  var base=Math.max(W/img.width,H/img.height)*1.52*scale;
  var bw=img.width*base,bh=img.height*base;
  g.save();g.translate(W/2,H*.44);g.rotate(rot);g.drawImage(img,-bw/2,-bh/2,bw,bh);g.restore();
  // feather the zone edges so the counter-rotating rings overlap instead of cutting
  var R=Math.max(W,H)*.92;
  var grd=g.createRadialGradient(W/2,H*.44,0,W/2,H*.44,R);
  if(r0<=0){
    grd.addColorStop(0,'rgba(0,0,0,1)');
    grd.addColorStop(Math.max(0,(r1-feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.min(1,(r1+feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
  }else if(r1>=R*.98){
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(Math.max(0,(r0-feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(Math.min(1,(r0+feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(1,'rgba(0,0,0,1)');
  }else{
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(Math.max(0,(r0-feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(Math.min(1,(r0+feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.max(0,(r1-feather)/R),'rgba(0,0,0,1)');
    grd.addColorStop(Math.min(1,(r1+feather)/R),'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
  }
  g.globalCompositeOperation='destination-in';g.fillStyle=grd;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(c,0,0,W,H);ctx.restore();
}
function drawBlackHole(){
  var cx=W/2,cy=H*.44,hr=Math.max(24,Math.min(W,H)*.078);
  // soft outer light, no accretion disk
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(cx,cy,hr*.8,cx,cy,hr*3.0);
  g.addColorStop(0,'rgba(190,150,255,0.18)');
  g.addColorStop(.45,'rgba(120,90,210,0.08)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,hr*3.0,0,TAU);ctx.fill();
  // the hole itself
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,hr,0,TAU);ctx.fill();
  // thin photon ring
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.9;ctx.strokeStyle='rgba(255,238,190,0.95)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(cx,cy,hr+1.2,0,TAU);ctx.stroke();
  ctx.globalAlpha=.35;ctx.strokeStyle='rgba(170,130,255,0.9)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(cx,cy,hr+4,0,TAU);ctx.stroke();
  ctx.restore();ctx.globalAlpha=1;
}
function drawKaleidoLayer(img,cx,cy,n,rot,scale,alpha,mirror,ox,oy,filter,comp,beadA){
  if(!img||!img.complete||!img.naturalWidth) return;
  var step=TAU/n,R=Math.max(W,H)*1.06;
  var sc=Math.max(W/img.width,H/img.height)*scale;
  var bw=img.width*sc,bh=img.height*sc;
  ctx.save();ctx.globalAlpha=1;
  if(comp) ctx.globalCompositeOperation=comp;
  for(var k=0;k<n;k++){
    ctx.save();
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,k*step+rot-.008,(k+1)*step+rot+.008);ctx.closePath();ctx.clip();
    ctx.translate(cx,cy);
    var base=k*step+rot+step/2;
    ctx.rotate(base);
    if(mirror&&(k%2))ctx.scale(-1,1);
    ctx.globalAlpha=alpha;
    if(filter&&('filter' in ctx))ctx.filter=filter;
    ctx.drawImage(img,-bw/2+ox*bw,-bh/2+oy*bh,bw,bh);
    if(beadA) drawWedgeBeads(R,beadA,k*1.7);
    ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';
}
var KALEIDO_CACHE=null,KALEIDO_SRC=null;
function buildKaleidoCache(img){
  if(!img||!img.complete||!img.naturalWidth) return null;
  var sz=640,cv=document.createElement('canvas');cv.width=cv.height=sz;
  var x=cv.getContext('2d'),c=sz/2,R=sz*.74;
  var sc=Math.max(sz*1.25/img.width,sz*1.25/img.height);
  var bw=img.width*sc,bh=img.height*sc;
  for(var k=0;k<16;k++){
    var a0=k*TAU/16-.008,a1=(k+1)*TAU/16+.008;
    x.save();x.beginPath();x.moveTo(c,c);x.arc(c,c,R,a0,a1);x.closePath();x.clip();
    x.translate(c,c);x.rotate(k*TAU/16+TAU/32);if(k%2)x.scale(-1,1);
    x.globalAlpha=.97;x.drawImage(img,-bw/2,-bh/2,bw,bh);
    x.globalCompositeOperation='lighter';
    for(var bi=0;bi<BG_BEADS.length;bi++){
      var b=BG_BEADS[bi];var ang=b.ba,rr=b.br*R;
      var bs=b.s*(.7+rr/R*.9);
      x.globalAlpha=.55;x.drawImage(beadSprite(b.c),Math.cos(ang)*rr-bs,Math.sin(ang)*rr-bs,bs*2,bs*2);
    }
    x.restore();
  }
  KALEIDO_CACHE=cv;KALEIDO_SRC=img;return cv;
}
function drawKaleidoCache(cv,rot,scale,alpha,filter,comp,ox,oy){
  var s=Math.max(W,H)*1.15*scale;
  ctx.save();if(comp)ctx.globalCompositeOperation=comp;
  ctx.globalAlpha=alpha;if(filter&&('filter'in ctx))ctx.filter=filter;
  ctx.translate(W/2,H*.44);ctx.rotate(rot);
  ctx.drawImage(cv,-s/2+(ox||0)*s,-s/2+(oy||0)*s,s,s);
  ctx.restore();ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';
}
function drawRecursiveBg(img,rot,scale,alpha,comp){
  if(!img||!img.complete||!img.naturalWidth) return;
  var sw=Math.max(W,H)*1.18*scale,sh=sw*img.height/img.width;
  ctx.save();ctx.globalCompositeOperation=comp||'screen';ctx.globalAlpha=alpha;
  ctx.translate(W/2,H*.44);ctx.rotate(rot);
  ctx.drawImage(img,-sw/2,-sh/2,sw,sh);ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function paintFractalBg(main,edge,offsetY){
  ctx.fillStyle='#03020a';ctx.fillRect(0,0,W,H);
  var cx=W/2,cy=H*.44,N=16;
  // three self-similar crystal shells; inner/outer counter-rotate at different speeds
  var cache=(KALEIDO_SRC===main&&KALEIDO_CACHE)?KALEIDO_CACHE:buildKaleidoCache(main);
  if(cache){
    var breath=1+.035*Math.sin(time*.17);
    drawKaleidoCache(cache,time*.045,1.00*breath,.98,'hue-rotate(-6deg) saturate(1.10)',null,.02,-.01);
    drawKaleidoCache(cache,-time*.064,1.20,.55,'hue-rotate(28deg) saturate(1.22)','screen',-.04,.03);
    drawKaleidoCache(cache,time*.028,1.58,.26,'hue-rotate(8deg) saturate(1.28)','screen',.06,-.05);
  }
  if(edge&&edge.complete) drawKaleidoLayer(edge,cx,cy,N,-time*.014,1.22,.18,0,.04,.02,'hue-rotate(12deg) saturate(1.25)','screen',0);
  drawRecursiveBg(GIMG.kbA,time*.018,1.06+.035*Math.sin(time*.16),.10,'screen');
  drawRecursiveBg(GIMG.kbB,-time*.024,1.30,.07,'screen');
  drawRecursiveBg(GIMG.kbA,-time*.032,.72,.04,'screen');
  // dark vortex fade so the crystal pours into one static eye
  if(state!=='cast'){
    var hg=ctx.createRadialGradient(cx,cy,0,cx,cy,H*.13);
    hg.addColorStop(0,'rgba(2,1,8,0.92)');
    hg.addColorStop(.38,'rgba(3,2,10,0.62)');
    hg.addColorStop(.72,'rgba(4,3,14,0.18)');
    hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy,H*.13,0,TAU);ctx.fill();
    if(!(stage===4&&(state==='boss'||state==='bossFusion'||state==='bossDeath1'))) drawBlackHole();
  }
}

function paintStageBg(main,edge,offsetY){
  if(stage===4){ paintFractalBg(main,edge,offsetY); return; }

  drawLoopLayer(main,bgScroll+(offsetY||0),1,false,false);
  if(stage===0&&BG1_BH&&BG1_BH.complete&&BG1_BH.naturalWidth) drawLoopLayer(BG1_BH,0,1,false,false);
  if(edge) drawLoopLayer(edge,bgEdgeScroll+(offsetY||0)*1.35,([0.90,0.82,0.72,0.50][stage]||0.8),true,true,['screen','soft-light','overlay','soft-light'][stage]||'source-over');
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
var MIRROR_TYPES={},MIRROR_CACHE={};
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
var S5_ENEMY_KEYS=['s5e1','s5e2','s5e3','s5e4','s5e5','s5e6'];
function drawStage5Echo(e){
  var et=ET[e.type],key='n'+(e.type+1),img=GIMG[key];
  var art=GIMG[S5_ENEMY_KEYS[(e.variant==null?e.type:e.variant)%6]];
  if(art&&art.complete&&art.naturalWidth) img=art;
  var w=enemyW(e);
  var pools=[
    [GIMG.n1,GIMG.n2,GIMG.n3],
    [GIMG.n4,GIMG.n5,GIMG.n6],
    [GIMG.n7,GIMG.n8,GIMG.n9]
  ];
  var pool=pools[Math.max(0,Math.min(2,e.type-9))].filter(function(im){return im&&im.complete;});
  var cols=['#7fe6ff','#c9a6ff','#ffd27a'];
  if(!pool.length) pool=[img];
  var n=pool.length===3?(e.type===9?4:(e.type===10?6:8)):4;
  ctx.save();ctx.translate(e.x,e.y);
  ctx.globalCompositeOperation='lighter';
  for(var k=0;k<n;k++){
    var a=k/n*TAU+time*(.22+e.type*.025);
    var rr=w*(.44+.07*Math.sin(time*1.7+k));
    var s=w*(.50+.08*Math.sin(time*.9+k*1.3));
    var im=pool[k%pool.length];
    ctx.save();ctx.globalAlpha=.68;ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+time*.35);if(k%2)ctx.scale(-1,1);
    ctx.drawImage(im,-s/2,-s/2,s,s);ctx.restore();
  }
  // faceted crystal ring
  ctx.globalAlpha=.30;ctx.strokeStyle=cols[(e.type-9)%3];ctx.lineWidth=1.2;
  ctx.beginPath();
  for(var f=0;f<8;f++){var fa=f/8*TAU+time*.2,fr=w*.50;if(f===0)ctx.moveTo(Math.cos(fa)*fr,Math.sin(fa)*fr);else ctx.lineTo(Math.cos(fa)*fr,Math.sin(fa)*fr);}
  ctx.closePath();ctx.stroke();
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  if(img&&img.complete){
    var cw=w*1.18,h=cw*img.height/img.width;
    ctx.save();ctx.globalCompositeOperation='source-over';if('filter'in ctx)ctx.filter='brightness(1.22) saturate(1.12)';ctx.drawImage(img,-cw/2,-h/2,cw,h);ctx.filter='none';ctx.restore();
    if(e.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();}
  }
  ctx.restore();
  if(e.elite||e.max>18&&e.hp<e.max){
    var bw=w*.8,bh=3,bx=e.x-bw/2,by=e.y-w*.62;
    ctx.fillStyle='rgba(8,14,24,0.75)';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=(e.hp/e.max>0.5)?'#8dff9e':'#ffb36b';ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.max),bh);
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
function drawChronosFractal(w,h,phase){
  var n=10+phase*6,rr=Math.min(w,h)*(0.42+0.05*Math.sin(time*1.2));
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var i=0;i<n;i++){
    var a=time*(0.84+phase*0.28)+i/n*TAU;
    var r=rr+Math.sin(time*2.1+i*0.8)*10;
    var x=Math.cos(a)*r,y=Math.sin(a)*r*0.62;
    ctx.save();ctx.translate(x,y);ctx.rotate(a+time*0.4);
    ctx.globalAlpha=0.16+0.07*Math.sin(time*3+i);
    ctx.strokeStyle=cols[i%4];ctx.lineWidth=1.2;
    ctx.beginPath();
    for(var k=0;k<3;k++){var ta=k*TAU/3,tr=13+4*Math.sin(time*2+i);var tx=Math.cos(ta)*tr,ty=Math.sin(ta)*tr;if(k===0)ctx.moveTo(tx,ty);else ctx.lineTo(tx,ty);}
    ctx.closePath();ctx.stroke();
    ctx.restore();
  }
  // breathing shard halo
  for(var r2=0;r2<3;r2++){
    ctx.globalAlpha=0.10-r2*0.02;ctx.strokeStyle=cols[(phase+r2)%4];ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(boss.x,boss.y,rr+r2*18+Math.sin(time*1.4+r2)*5,(rr+r2*18)*.64,time*.05,0,TAU);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBossCrossOrb(){
  if(!boss||!boss.crossOrb) return;
  var o=boss.crossOrb;
  var p=Math.max(0,Math.min(1,(o.t-o.travel)/o.charge)),pulse=0.55+0.45*Math.sin(time*24);
  var rr=26+p*38+pulse*8;
  ctx.save();ctx.globalCompositeOperation='lighter';
  var g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,rr*2.4);
  g.addColorStop(0,'rgba(255,255,245,0.95)');g.addColorStop(0.22,'rgba(255,230,150,0.75)');g.addColorStop(0.6,'rgba(255,150,60,'+(0.30+p*0.15)+')');g.addColorStop(1,'rgba(255,80,20,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,rr*2.4,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,235,170,'+(0.55+0.35*pulse)+')';ctx.lineWidth=2;
  for(var k=0;k<3;k++){var a=time*(1.2+k*0.4)+k*2;ctx.beginPath();ctx.arc(o.x,o.y,rr*1.4+k*7,a,a+1.5);ctx.stroke();}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(o.x,o.y,7+p*5,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
}
var GLOW_CACHE={};
function bossGlowLayer(key,img,rgb){
  if(GLOW_CACHE[key]) return GLOW_CACHE[key];
  try{
    var size=420,pad=54,cv=document.createElement('canvas');cv.width=size;cv.height=size;
    var g=cv.getContext('2d');
    if('filter' in g) g.filter='blur(16px)';
    g.drawImage(img,pad,pad,size-pad*2,size-pad*2);
    g.filter='none';
    g.globalCompositeOperation='source-in';
    g.fillStyle='rgb('+rgb+')';g.fillRect(0,0,size,size);
    GLOW_CACHE[key]=cv;return cv;
  }catch(e){return null;}
}
function drawSpectralAura(w,h){
  if(!boss) return;
  var cols=['#66d8ff','#ff78c8','#ffd36b','#9d8cff'];
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var k=0;k<6;k++){
    var a0=time*(.14+k*.02)+k*1.05;
    ctx.globalAlpha=.30-k*.03;ctx.strokeStyle=cols[k%4];ctx.lineWidth=1.8;
    ctx.beginPath();ctx.arc(boss.x,boss.y,w*(.46+k*.028),a0,a0+1.15);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
}

function drawFeatherAnnulus(cx,cy,inner,outer,alpha){
  var g=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);
  g.addColorStop(0,'rgba(255,255,255,0)');
  g.addColorStop(.22,'rgba(255,255,255,'+(0.55*alpha)+')');
  g.addColorStop(.55,'rgba(255,235,190,'+(0.72*alpha)+')');
  g.addColorStop(.82,'rgba(255,255,255,'+(0.28*alpha)+')');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,outer,0,TAU);ctx.fill();
}
function drawHedronRecursiveForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y,t=time;
  var A=GIMG.hrA,B=GIMG.hrB,C=GIMG.hrC;
  var base=boss.def.w*1.26;
  ctx.save();
  // soft dark backing separates the recursive shell from the bright crystal field
  ctx.save();var bg0=ctx.createRadialGradient(cx,cy,base*.22,cx,cy,base*.62);bg0.addColorStop(0,'rgba(2,4,14,.42)');bg0.addColorStop(.7,'rgba(2,4,14,.18)');bg0.addColorStop(1,'rgba(2,4,14,0)');ctx.fillStyle=bg0;ctx.beginPath();ctx.arc(cx,cy,base*.62,0,TAU);ctx.fill();ctx.restore();
  if(A&&A.complete){
    var bs=base*(1+.025*Math.sin(t*.7));
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.97;
    ctx.translate(cx,cy);ctx.rotate(Math.sin(t*.23)*.045);ctx.drawImage(A,-bs/2,-bs/2,bs,bs);ctx.restore();
  }else if(GIMG.np1&&GIMG.np1.complete){
    ctx.save();ctx.translate(cx,cy);ctx.drawImage(GIMG.np1,-base/2,-base/2,base,base);ctx.restore();
  }
  // a slow, infinite zoom of the inner self-similar shell
  if(B&&B.complete){
    for(var i=0;i<3;i++){
      var q=(t*.13+i/3)%1;
      var s=base*(.20+.64*q);
      var al=.50*(1-q*.58);
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=al;
      ctx.translate(cx,cy);ctx.rotate((i%2?-1:1)*t*.055+i*.8);
      ctx.drawImage(B,-s/2,-s/2,s,s);ctx.restore();
    }
  }
  if(C&&C.complete){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.12;
    ctx.translate(cx,cy);ctx.rotate(-t*.035);var cs=base*.95;
    ctx.drawImage(C,-cs/2,-cs/2,cs,cs);ctx.restore();
  }
  // white-hot heart remains readable on top of the recursive layers
  ctx.save();ctx.globalCompositeOperation='lighter';
  var R=base*.10+Math.sin(t*2.1)*2.2;
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0,'rgba(255,255,255,.97)');g.addColorStop(.45,'rgba(255,248,220,.70)');
  g.addColorStop(.74,'rgba(255,220,160,.24)');g.addColorStop(1,'rgba(255,220,160,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(.5,boss.hitFlash*4.5);
    drawFeatherAnnulus(cx,cy,base*.18,base*.55,Math.min(.55,boss.hitFlash*4.0));ctx.restore();ctx.globalAlpha=1;
  }
  ctx.restore();
}
function drawPhase3CollapseForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  var imgs=[GIMG.q1,GIMG.q2,GIMG.q3,GIMG.q4];
  var ringR=[190,164,138,112],ringS=[88,74,60,48];
  // bottom layer: old phase-3 art as a light-only aura; black areas contribute nothing
  var old=GIMG.b5_3;
  if(old&&old.complete){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.34;
    if('filter' in ctx) ctx.filter='blur(4px)';
    ctx.translate(cx,cy);ctx.rotate(time*.025);
    ctx.drawImage(old,-410,-410,820,820);
    ctx.filter='none';ctx.restore();ctx.globalAlpha=1;
    // a wider, softer halo that deliberately spills past the rings
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.18;
    if('filter' in ctx) ctx.filter='blur(14px)';
    ctx.translate(cx,cy);ctx.rotate(-time*.018);
    ctx.drawImage(old,-480,-480,960,960);
    ctx.filter='none';ctx.restore();ctx.globalAlpha=1;
  }
  // white-hot halo around the hole, with feathered outer 30%
  ctx.save();ctx.globalCompositeOperation='lighter';
  var hr=82+5*Math.sin(time*2.1);
  var hg=ctx.createRadialGradient(cx,cy,0,cx,cy,hr);
  hg.addColorStop(0,'rgba(255,255,255,0.78)');
  hg.addColorStop(.50,'rgba(255,255,250,0.56)');
  hg.addColorStop(.70,'rgba(255,246,220,0.30)');
  hg.addColorStop(.85,'rgba(180,220,255,0.14)');
  hg.addColorStop(1,'rgba(180,220,255,0)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy,hr,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
  var hed=GIMG.np1;
  if(hed&&hed.complete){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.72;
    ctx.translate(cx,cy);ctx.rotate(-time*.055);
    ctx.drawImage(hed,-150,-150,300,300);ctx.restore();ctx.globalAlpha=1;
  }
  // four rings, alternating spin, centered on the single hole
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*ringR[i],py=cy+Math.sin(a)*ringR[i];
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ringS[i]/2,-ringS[i]/2,ringS[i],ringS[i]);ctx.restore();
    }
  }
  // final single black hole on top
  var R=54;
  ctx.save();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.95;ctx.strokeStyle='#ffeec0';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(cx,cy,R+1.5,0,TAU);ctx.stroke();
  ctx.globalAlpha=.40;ctx.strokeStyle='#b58bff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,R+5,0,TAU);ctx.stroke();
  ctx.restore();ctx.globalAlpha=1;
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';
    drawFeatherAnnulus(cx,cy,60,238,Math.min(.82,boss.hitFlash*4.8));
    drawFeatherAnnulus(cx,cy,108,196,Math.min(.52,boss.hitFlash*3.2));
    ctx.restore();ctx.globalAlpha=1;
  }
}

function drawPhase2FusionForm(){
  if(!boss) return;
  var cx=boss.x,cy=boss.y;
  var imgs=[GIMG.r1,GIMG.r2,GIMG.r3,GIMG.r4];
  var ringR=[152,132,112,92],ringS=[80,68,56,44];
  // core Hedron
  var hed=GIMG.np1;
  if(hed&&hed.complete){
    ctx.save();ctx.globalAlpha=.78;ctx.translate(cx,cy);ctx.rotate(time*.10);
    var hs=235;ctx.drawImage(hed,-hs/2,-hs/2,hs,hs);ctx.restore();
  }
  // four 24-way rings locked around the core
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var rr=ringR[i],ss=ringS[i];
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ss/2,-ss/2,ss,ss);ctx.restore();
    }
  }
  // top white-hot core, feathered outer 30%
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  var R=64+5*Math.sin(time*2.2);
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0,'rgba(255,255,255,0.98)');
  g.addColorStop(.55,'rgba(255,255,250,0.94)');
  g.addColorStop(.70,'rgba(255,246,220,0.72)');
  g.addColorStop(.85,'rgba(220,235,255,0.24)');
  g.addColorStop(1,'rgba(220,240,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55;
  var fg=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.52);
  fg.addColorStop(0,'rgba(255,255,255,1)');fg.addColorStop(.4,'rgba(255,240,190,.6)');fg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fg;ctx.beginPath();ctx.arc(cx,cy,R*.52,0,TAU);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
  if(boss.hitFlash>0){
    ctx.save();ctx.globalCompositeOperation='lighter';
    drawFeatherAnnulus(cx,cy,58,208,Math.min(.85,boss.hitFlash*5));
    drawFeatherAnnulus(cx,cy,96,178,Math.min(.55,boss.hitFlash*3.4));
    ctx.restore();ctx.globalAlpha=1;
  }
}
function drawPhase3Rings(w,h){
  if(!boss) return;
  var imgs=[GIMG.r1,GIMG.r2,GIMG.r3,GIMG.r4];
  var ringR=[175,152,129,106],ringS=[92,78,64,52];
  // measured phase-3 art hole offset: 3.5px left, 1px down (logical)
  var cx=boss.x-3.5, cy=boss.y+1.0;
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    var dir=(i%2===0)?1:-1;
    for(var k=0;k<24;k++){
      var a=k*TAU/24+i*.35+time*.055*dir;
      var px=cx+Math.cos(a)*ringR[i],py=cy+Math.sin(a)*ringR[i];
      ctx.save();ctx.globalAlpha=1;
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06*dir);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ringS[i]/2,-ringS[i]/2,ringS[i],ringS[i]);ctx.restore();
    }
  }
}
function drawPhase2BossHalo(w,h){
  if(!boss) return;
  var imgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
  var cols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
  ctx.save();
  for(var k=0;k<24;k++){
    var im=imgs[k%4];if(!im||!im.complete) continue;
    var a=k*TAU/24+time*.055;
    var rr=w*.46;
    var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr;
    var ss=w*.11;
    ctx.save();ctx.globalAlpha=1;
    ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.06);if(k%2)ctx.scale(-1,1);
    ctx.drawImage(im,-ss/2,-ss/2,ss,ss);ctx.restore();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawChronosEntityHalo(w,h){
  if(!boss) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(var ring=0;ring<8;ring++){
    var rr=w*.22+ring*w*.043;
    var n=18+ring*5;
    var rot=time*(ring%2?-.10:.075)+ring*.29;
    for(var j=0;j<n;j++){
      var a=j/n*TAU+rot;
      var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr*.74;
      ctx.globalAlpha=.18+.14*Math.sin(time*2.2+j*.7+ring);
      ctx.fillStyle=(ring%4===0)?'#fff6d8':(ring%4===1?'#7fe6ff':(ring%4===2?'#ff86cf':'#b6a2ff'));
      ctx.beginPath();ctx.arc(px,py,1.1+(ring%2)*.5,0,TAU);ctx.fill();
    }
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBossFusionOverlay(w,h){
  if(!bossFusionOn||!boss) return;
  var q=Math.max(0,Math.min(1,bossFusionT/2.6));
  var imgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
  ctx.save();
  for(var i=0;i<4;i++){
    var im=imgs[i];if(!im||!im.complete) continue;
    for(var k=0;k<8;k++){
      var a=k*TAU/8+i*.38+time*.55;
      var rr=(215*(1-q*.55))+i*8;
      var px=boss.x+Math.cos(a)*rr,py=boss.y+Math.sin(a)*rr*.72;
      var ss=108*(1-q*.30);
      ctx.save();ctx.globalAlpha=.55*(1-q);
      ctx.translate(px,py);ctx.rotate(a+Math.PI/2+time*.25);if((k+i)%2)ctx.scale(-1,1);
      ctx.drawImage(im,-ss/2,-ss/2,ss,ss);
      ctx.restore();
    }
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawBoss(){
  if(!boss) return;
  var phase=boss.phase;
  if(stage===4&&phase===0){drawHedronRecursiveForm();return;}
  if(stage===4&&phase===1){drawPhase2FusionForm();return;}
  if(stage===4&&phase===2){drawPhase3CollapseForm();return;}
  var img=GIMG[boss.def.key+(phase+1)]||GIMG[boss.def.key+'1'];
  if(stage===4&&phase===0){img=GIMG.np1||img;}
  if(!img||!img.complete) return;
  var phaseScale=[1,1.06,1.12][phase]||1;
  if(stage===4) phaseScale=(phase===0?1.00:(phase===1?0.99:1.10));
  var w=boss.def.w*phaseScale*1.15,h=w*img.height/img.width;
  var cols=boss.def.glow||['90,200,255','255,120,220','255,170,80'],col=cols[phase]||cols[0];
  ctx.save();ctx.globalCompositeOperation='lighter';
  var ar=h*0.72+Math.sin(time*4)*8;
  var g=ctx.createRadialGradient(boss.x,boss.y,h*0.15,boss.x,boss.y,ar);
  g.addColorStop(0,'rgba('+col+',0.20)');
  g.addColorStop(0.55,'rgba('+col+',0.10)');
  g.addColorStop(1,'rgba('+col+',0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(boss.x,boss.y,ar,0,TAU);ctx.fill();
  ctx.restore();
  // Layered living glow for Boss 2 / Boss 4: blurred body glow + breathing frames + electric arcs + afterimage
  if(stage===1||stage===3||(stage===4&&phase>0)){
    var aura=stage===4?'200,160,255':(stage===3?'255,228,150':'190,125,255');
    var phaseBoost=(stage===1&&phase===2)?1.35:1.0;
    var fr=Math.floor(time*11)%4;
    var breath=0.5+0.5*Math.sin(time*1.9);
    var glow=bossGlowLayer('g'+(stage+1)+'_'+phase,img,aura);
    var gsc=w*1.34+fr*4,hgsc=h*1.34+fr*4;
    ctx.save();ctx.globalCompositeOperation='lighter';
    // afterimage / motion trail of the glow layer
    if(glow&&boss.prevX!==undefined){
      var ga=0.10+breath*0.08;
      ctx.globalAlpha=ga;ctx.drawImage(glow,boss.prevX-gsc*0.5,boss.prevY-hgsc*0.5,gsc,hgsc);
    }
    if(glow){
      ctx.globalAlpha=(0.34+breath*0.20+(fr===3?0.08:0))*phaseBoost;
      ctx.drawImage(glow,boss.x-gsc*0.5,boss.y-hgsc*0.5,gsc,hgsc);
      ctx.globalAlpha=0.14+fr*0.025;
      ctx.drawImage(glow,boss.x-gsc*0.42,boss.y-hgsc*0.42,gsc*0.84,hgsc*0.84);
    }
    // breathing concentric halo
    for(var ak=0;ak<4;ak++){
      var rr=Math.min(w,h)*(0.40+ak*0.030)+fr*2.5+Math.sin(time*5+ak*1.3)*3;
      ctx.globalAlpha=[0.10,0.18,0.14,0.22][fr]*(1-ak*0.16);
      ctx.strokeStyle=ak===0?'#ffffff':'rgba('+aura+',1)';ctx.lineWidth=ak===0?2.4:1.3;
      ctx.beginPath();ctx.arc(boss.x,boss.y,rr,0,TAU);ctx.stroke();
    }
    // rotating rays
    for(var ar2=0;ar2<10;ar2++){
      var aa=ar2/10*TAU+time*0.28, r0=Math.min(w,h)*0.28, r1=Math.min(w,h)*0.54;
      ctx.globalAlpha=0.045+0.035*breath;
      ctx.strokeStyle='rgba('+aura+',1)';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(boss.x+Math.cos(aa)*r0,boss.y+Math.sin(aa)*r0);ctx.lineTo(boss.x+Math.cos(aa)*r1,boss.y+Math.sin(aa)*r1);ctx.stroke();
    }
    // electric arcs, changing every glow frame
    for(var ea=0;ea<3;ea++){
      var baseA=time*0.75+ea*TAU/3, rr0=Math.min(w,h)*0.33;
      ctx.globalAlpha=0.16+0.10*breath;
      ctx.strokeStyle=ea===0?'#ffffff':'rgba('+aura+',1)';ctx.lineWidth=1.2;
      ctx.beginPath();
      for(var seg=0;seg<=7;seg++){
        var sa=baseA+(seg/7-0.5)*0.62;
        var sr=rr0+Math.sin(time*18+seg*2.1+ea*4)*7+fr*1.5;
        var px=boss.x+Math.cos(sa)*sr, py=boss.y+Math.sin(sa)*sr*0.62;
        if(seg===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=1;
  }

  if(stage===4&&phase===0){drawSpectralAura(w,h);drawChronosEntityHalo(w,h);}
  if(stage===4) drawChronosFractal(w,h,phase);
  ctx.save();
  if(stage===4){
    var bsc=1+Math.sin(time*1.35+phase)*.035;
    ctx.translate(boss.x,boss.y);ctx.rotate(time*(0.20+phase*0.050)+Math.sin(time*.45+phase)*.04);ctx.scale(bsc,bsc);
    // kaleidoscopic ghost copies of the composite body
    ctx.globalCompositeOperation='lighter';
    if(phase>0){for(var kg=0;kg<4;kg++){
      ctx.save();ctx.rotate(kg*Math.PI/2+time*.14);ctx.globalAlpha=.045+.02*Math.sin(time*2+kg);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
    }}
    // prismatic time-split echo
    ctx.globalAlpha=phase===0?.05:.14;
    ctx.drawImage(img,-w/2-5,-h/2,w,h);
    ctx.drawImage(img,-w/2+5,-h/2,w,h);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.drawImage(img,-w/2,-h/2,w,h);
    if(phase===0){
      var pcols=['#7fe6ff','#ff86cf','#ffd36b','#b6a2ff'];
      for(var sg=0;sg<3;sg++){
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.42;
        ctx.strokeStyle=pcols[sg];ctx.lineWidth=2.0;
        var aa=time*(.18+sg*.07)+sg*2.0;
        ctx.beginPath();ctx.arc(0,0,w*(.40+sg*.035),aa,aa+1.05);ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
  }else ctx.drawImage(img,boss.x-w/2,boss.y-h/2,w,h);
  if(stage===4){
    var echoImgs=[GIMG.b1_1,GIMG.b2_1,GIMG.b3_1,GIMG.b4_1];
    var echoCols=['#ff5f7a','#c06aff','#ff9a3a','#ffe7a0'];
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var ei=0;ei<4;ei++){
      var eimg=echoImgs[ei];if(!eimg||!eimg.complete) continue;
      var ea=time*.35+ei*Math.PI/2, ex=boss.x+Math.cos(ea)*118,ey=boss.y+Math.sin(ea)*76;
      ctx.globalAlpha=.18+.08*Math.sin(time*5+ei);ctx.drawImage(eimg,ex-24,ey-24,48,48);
      ctx.globalAlpha=.35;ctx.fillStyle=echoCols[ei];ctx.beginPath();ctx.arc(ex,ey,5,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(stage===4){ctx.restore();ctx.save();}
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
    ctx.globalAlpha=0.32;ctx.strokeStyle=['#7fe7ff','#ff9ad5','#ffc36b','#ffe7a0'][stage]||'#ffe7a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(boss.x,boss.y,Math.min(h*0.55,w*0.36)+Math.sin(time*8)*4,0,TAU);ctx.stroke();ctx.globalAlpha=1;
  }
  // foreground energy layer for Boss2/4: visible arcs and wingtip pulses over the body
  if(stage===1||stage===3){
    var fAura=stage===3?'255,228,150':'190,125,255';
    var fFr=Math.floor(time*14)%3;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var fe=0;fe<3;fe++){
      var fa=time*1.4+fe*TAU/3, fr0=Math.min(w,h)*0.24;
      ctx.globalAlpha=0.22+0.12*Math.sin(time*7+fe);
      ctx.strokeStyle=fe===0?'#fff':'rgba('+fAura+',1)';ctx.lineWidth=1.5;
      ctx.beginPath();
      for(var fs=0;fs<=6;fs++){
        var fsa=fa+(fs/6-0.5)*0.5;
        var fsr=fr0+Math.sin(time*25+fs*2.4+fe*4)*9+fFr*3;
        var fpx=boss.x+Math.cos(fsa)*fsr,fpy=boss.y+Math.sin(fsa)*fsr*0.70;
        if(fs===0)ctx.moveTo(fpx,fpy);else ctx.lineTo(fpx,fpy);
      }
      ctx.stroke();
    }
    for(var wp=0;wp<4;wp++){
      var wpx=boss.x+(wp<2?-1:1)*w*0.33, wpy=boss.y+(wp%2?-1:1)*h*0.12;
      var wpulse=0.5+0.5*Math.sin(time*8+wp*1.7);
      var wg=ctx.createRadialGradient(wpx,wpy,0,wpx,wpy,14);
      wg.addColorStop(0,'rgba(255,255,245,'+(0.35*wpulse)+')');wg.addColorStop(1,'rgba('+fAura+',0)');
      ctx.fillStyle=wg;ctx.beginPath();ctx.arc(wpx,wpy,14,0,TAU);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  if(stage===4&&boss.phase===1) drawPhase2BossHalo(w,h);
  if(stage===4&&boss.phase===2) drawPhase3Rings(w,h);
  ctx.restore();
}
function bulletImg(){ return GIMG['u'+(stage===0?'1':(stage===1?'2':'5'))]; }
function drawBullet(b){
  var img=bulletImg(),a=Math.atan2(b.r.direction||0,1)+Math.PI/2;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);
  if(img&&img.complete)ctx.drawImage(img,-6,-12,12,24);
  else{ctx.fillStyle='#8fe8ff';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(255,255,255,0.95)';ctx.beginPath();ctx.arc(0,0,1.35,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fillRect(-0.7,-4,1.4,8);
  ctx.restore();ctx.globalCompositeOperation='source-over';
}
var S5_BULLET_KEYS=[['s5b2','s5b5'],['s5b1','s5b6'],['s5b3','s5b4'],['s5b4','s5b5'],['s5b6','s5b1'],['s5b1','s5b3']];
function drawCrystalEB(e,p,pi){
  var R=e.rad*(e.type===2?2.55:3.15);
  var n=e.rad>=6?12:(e.type===2?8:4);
  var cols=[p.main,p.light,p.edge,p.core];
  var key=S5_BULLET_KEYS[pi]&&S5_BULLET_KEYS[pi][e.type===2?1:0];
  var art=key?GIMG[key]:null;
  if(art&&art.complete&&art.naturalWidth){
    var target=e.rad*(e.type===2?4.8:4.1);
    var aw=target,ah=target*art.height/art.width;
    if(ah<target){ah=target;aw=target*art.width/art.height;}
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=.55;ctx.fillStyle=p.glow;ctx.beginPath();ctx.arc(0,0,target*.48,0,TAU);ctx.fill();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';if('filter'in ctx)ctx.filter='brightness(1.55) saturate(1.35) contrast(1.12)';ctx.drawImage(art,-aw/2,-ah/2,aw,ah);ctx.filter='none';
    ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,1.6,0,TAU);ctx.fill();ctx.strokeStyle=p.edge;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,target*.30,0,TAU);ctx.stroke();
    if(pi===5){var rb0=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];for(var k0=0;k0<3;k0++){ctx.globalAlpha=.20;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rb0[k0];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,target*.55,time*1.4+k0*2,time*1.4+k0*2+2.1);ctx.stroke();}}
    ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';return;
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  var gl=ctx.createRadialGradient(0,0,0,0,0,R*2.0);
  gl.addColorStop(0,p.glow||'rgba(200,160,255,.5)');gl.addColorStop(.55,p.glow||'rgba(200,160,255,.2)');gl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*2.0,0,TAU);ctx.fill();
  // faceted prism body
  ctx.globalCompositeOperation='source-over';
  for(var i=0;i<n;i++){
    var a0=i/n*TAU-Math.PI/2,a1=(i+1)/n*TAU-Math.PI/2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a0)*R,Math.sin(a0)*R);ctx.lineTo(Math.cos(a1)*R,Math.sin(a1)*R);ctx.closePath();
    ctx.fillStyle=i%3===0?p.dark:(i%3===1?p.main:p.light);ctx.globalAlpha=.92;ctx.fill();
    ctx.strokeStyle=p.edge;ctx.globalAlpha=.55;ctx.lineWidth=.8;ctx.stroke();
  }
  // bright outer rim
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.95;
  ctx.strokeStyle=p.edge;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
  // white-hot core
  ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,Math.max(1.7,R*.22),0,TAU);ctx.fill();
  // prismatic refraction
  var rb=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];
  for(var k=0;k<3;k++){
    ctx.globalAlpha=.22;ctx.strokeStyle=rb[(k+pi)%5];ctx.lineWidth=1.1;
    ctx.beginPath();ctx.arc(0,0,R*(1.18+k*.14),time*1.1+k*2,time*1.1+k*2+2.3);ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawEB(e){
  var pi=(e.bossPal!=null?e.bossPal:((stage===4&&boss&&boss.phase===0)?5:(stage|0)));
  pi=Math.max(0,Math.min(5,pi));var p=BOSS_PALETTES[pi],spr=ebSprite(pi,e.type);
  var a=Math.atan2(e.vy,e.vx)+Math.PI/2;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);
  if(e.bomb){
    var bp=0.65+0.35*Math.sin(time*18);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(80,240,255,'+(0.18*bp)+')';ctx.beginPath();ctx.arc(0,0,e.rad*2.2,0,TAU);ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#081420';ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.fill();
    ctx.strokeStyle='#8ff8ff';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(255,225,120,'+bp+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,e.rad+4,0,TAU);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,e.rad*0.28,0,TAU);ctx.fill();
    ctx.restore();return;
  }
  if(stage===4){
    drawCrystalEB(e,p,pi);ctx.restore();return;
  }
  if(spr){
    if(e.type===2){var w=e.rad*2.8;ctx.drawImage(spr,-w/2,-w/2,w,w);}
    else{var w=e.rad*2.2,h=e.rad*4.6;ctx.drawImage(spr,-w/2,-h/2,w,h);}
  }else{
    ctx.fillStyle=p.main;ctx.beginPath();ctx.arc(0,0,e.rad,0,TAU);ctx.fill();
    ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(0,0,e.rad*0.42,0,TAU);ctx.fill();
  }
  if(pi===5){
    var rb=['#ff8a9e','#ffd27a','#7dffd8','#7fe6ff','#c9a6ff'];
    ctx.globalCompositeOperation='lighter';
    for(var rk=0;rk<5;rk++){
      ctx.globalAlpha=.10;ctx.strokeStyle=rb[rk];ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(0,0,e.rad*(1.25+rk*.18),time*1.1+rk*.8,time*1.1+rk*.8+2.2);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  // white-hot core; colored edge is kept from the sprite
  ctx.globalCompositeOperation='lighter';
  if(e.type===2){
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(0,0,e.rad*0.20,0,TAU);ctx.fill();
  }else{
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.arc(0,0,1.6,0,TAU);ctx.fill();
    ctx.fillRect(-0.8,-e.rad*0.75,1.6,e.rad*1.5);
  }
  ctx.restore();ctx.globalCompositeOperation='source-over';
}
function drawBombBtn(){
  var bx=W-64,by=H-78,rad=33,pulse=1+Math.sin(time*4)*0.025;
  var ready=player.bombs>0;
  ctx.save();
  // outer glow
  var glow=ctx.createRadialGradient(bx,by,4,bx,by,60);
  glow.addColorStop(0,ready?'rgba(70,220,255,0.24)':'rgba(90,95,110,0.05)');
  glow.addColorStop(0.55,ready?'rgba(60,120,255,0.10)':'rgba(0,0,0,0)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(bx,by,60,0,TAU);ctx.fill();
  ctx.translate(bx,by);ctx.rotate(-Math.PI/2);
  // beveled octagon filled panel
  ctx.beginPath();
  for(var i=0;i<8;i++){var a=i*TAU/8,rr=rad*pulse,x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.closePath();
  var fill=ctx.createLinearGradient(-rad,-rad,rad,rad);
  if(ready){fill.addColorStop(0,'#0b2940');fill.addColorStop(0.45,'#061725');fill.addColorStop(1,'#04101c');}
  else{fill.addColorStop(0,'#181b22');fill.addColorStop(1,'#0c0e14');}
  ctx.fillStyle=fill;ctx.fill();
  ctx.strokeStyle=ready?'rgba(100,235,255,0.95)':'rgba(100,108,122,0.45)';ctx.lineWidth=2.4;ctx.stroke();
  // outer tick marks
  for(var t=0;t<8;t++){var ta=t*TAU/8,ca=Math.cos(ta),sa=Math.sin(ta);ctx.strokeStyle=ready?'rgba(255,215,120,0.75)':'rgba(100,108,122,0.25)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ca*(rad+5),sa*(rad+5));ctx.lineTo(ca*(rad+10),sa*(rad+10));ctx.stroke();}
  // inner ring
  ctx.strokeStyle=ready?'rgba(255,210,110,0.55)':'rgba(100,108,122,0.25)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,rad-8,0,TAU);ctx.stroke();
  // starburst detonation glyph
  ctx.rotate(Math.PI/2);
  var c=ready?'#9ff6ff':'#727886', cy=-5;
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,cy,3.8,0,TAU);ctx.fill();
  for(var k=0;k<8;k++){
    var aa=k*TAU/8, r0=6.5, r1=(k%2?14:18);
    var ox=Math.cos(aa),oy=Math.sin(aa);
    ctx.beginPath();
    ctx.moveTo(ox*r0-oy*2.2,cy+oy*r0+ox*2.2);
    ctx.lineTo(ox*r1,cy+oy*r1);
    ctx.lineTo(ox*r0+oy*2.2,cy+oy*r0-ox*2.2);
    ctx.closePath();ctx.fill();
  }
  ctx.fillStyle=ready?'#eafcff':'#7b808b';ctx.font='bold 9px "Arial Black", Arial, sans-serif';ctx.textAlign='center';ctx.fillText('BOMB',0,22);
  ctx.fillStyle=ready?'#ffd47a':'#7b808b';ctx.font='bold 9px monospace';ctx.fillText('x'+player.bombs,0,32);
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
function drawExplosion(f){
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
  // shock ring
  ctx.globalAlpha=0.8*a;ctx.strokeStyle=boss?'#ffe6a0':(elite?'#c8f4ff':'#ffd28a');ctx.lineWidth=boss?5:3;
  ctx.beginPath();ctx.arc(f.x,f.y,r*0.92,0,TAU);ctx.stroke();
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
function stageSelectButtons(){
  var bw=46,bh=38,gap=9,total=5*bw+4*gap,sx=W/2-total/2,sy=H*.625;
  var out=[];
  for(var i=0;i<5;i++)out.push({i:i,x:sx+i*(bw+gap),y:sy,w:bw,h:bh});
  return out;
}
function menuStartButton(){return {x:W/2-108,y:H*.688,w:216,h:42};}
function drawMenu(){
  paintBg(BGMENU,1)||paintBg(BG1,1);
  ctx.fillStyle='rgba(2,4,12,0.05)';ctx.fillRect(0,0,W,H);
  // The poster already contains the STELLAR ASSAULT logo.
  var tg=ctx.createLinearGradient(0,H*0.56,0,H*0.79);
  tg.addColorStop(0,'rgba(0,0,0,0)');tg.addColorStop(0.45,'rgba(2,4,12,0.72)');tg.addColorStop(1,'rgba(2,4,12,0.88)');
  ctx.fillStyle=tg;ctx.fillRect(0,H*0.56,W,H*0.25);
  ctx.textAlign='center';
  var gf='900 15px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  var bf='900 21px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  // key info: bold, technical, glowing
  // stage select
  ctx.font='900 10px "Arial Black", Arial, sans-serif';ctx.fillStyle='#b8e8ff';ctx.shadowColor='rgba(60,160,230,0.7)';ctx.shadowBlur=6;
  ctx.fillText('STAGE SELECT',W/2,H*.592);
  var sbs=stageSelectButtons();
  for(var si=0;si<sbs.length;si++){
    var sb=sbs[si];var sel=si===selectedStage;
    ctx.fillStyle=sel?'rgba(85,60,18,0.86)':'rgba(6,18,30,0.62)';
    ctx.fillRect(sb.x,sb.y,sb.w,sb.h);
    ctx.strokeStyle=sel?'#ffe08a':(si===4?'#c7a063':'#5d8fa8');ctx.lineWidth=sel?2.5:(si===4?1.6:1);ctx.strokeRect(sb.x,sb.y,sb.w,sb.h);
    ctx.fillStyle=sel?'#fff2c4':(si===4?'#ffe2a8':'#dff4ff');ctx.font='900 16px "Arial Black", Arial, sans-serif';
    ctx.textAlign='center';ctx.fillText(String(si+1),sb.x+sb.w/2,sb.y+25);
  }
  var stb=menuStartButton();ctx.fillStyle='rgba(50,32,10,0.88)';ctx.fillRect(stb.x,stb.y,stb.w,stb.h);
  ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;ctx.strokeRect(stb.x,stb.y,stb.w,stb.h);
  ctx.fillStyle='#ffe7b0';ctx.font='900 18px "Arial Black", Arial, sans-serif';ctx.textAlign='center';
  ctx.fillText('START  ·  STAGE '+(selectedStage+1),W/2,stb.y+27);
  ctx.shadowBlur=0;
  ctx.font=gf;ctx.fillStyle='#dff4ff';ctx.shadowColor='rgba(70,190,255,0.95)';ctx.shadowBlur=10;
  ctx.fillText('5 STAGES  ·  5 BOSSES',W/2,H*0.772);
  ctx.shadowBlur=0;
  ctx.font='900 12px "Arial Black", "Helvetica Neue", Arial, sans-serif';ctx.fillStyle='#b8e8ff';ctx.shadowColor='rgba(60,160,230,0.7)';ctx.shadowBlur=6;
  ctx.fillText('DRAG · SHIP FOLLOWS ABOVE FINGER · AUTO-FIRE',W/2,H*0.82);
  ctx.shadowBlur=0;
  // credits: intentionally smaller and quieter
  ctx.fillStyle='#7f93a8';ctx.font='9px monospace';
  ctx.fillText('PATTERNS © KENTA CHO · BSD-3   |   ART: USER',W/2,H*0.86);
  ctx.fillText('SFX: KENNEY SCI-FI SOUNDS (CC0)',W/2,H*0.89);
  ctx.textAlign='left';
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
  var frames=[GIMG.np1];
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
  // crossfading AI frames (source-over to keep the polyhedral detail)
  ctx.globalCompositeOperation='source-over';
  for(var i=0;i<1;i++){
    var im=frames[i];if(!im||!im.complete) continue;
    var w=1;
    ctx.save();ctx.globalAlpha=ease*(.55+w*.45);
    ctx.translate(cx,cy);ctx.rotate(time*(.12+i*.035));ctx.scale(1+i*.025,1+i*.025);
    ctx.drawImage(im,-size/2,-size/2,size,size);ctx.restore();
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
 ['PATTERNS','KENTA CHO  ·  BSD-3'],
 ['MUSIC','奇点 / KALEIDOSCOPE / 引力弹弓 / 维度破碎 / 暗物质 / 虚实之间'],
 ['SFX','KENNEY SCI-FI SOUNDS'],
 ['SPECIAL THANKS','EVERY PILOT WHO REACHED THE END'],
 ['','']
];
var CAST_LINE_H=44,CAST_TOTAL=CAST_LINES.length*CAST_LINE_H+180;
function drawCast(){
  ctx.textAlign='center';
  ctx.globalAlpha=.9;ctx.fillStyle='#ffe6a0';ctx.font='900 22px "Arial Black", Arial, sans-serif';ctx.fillText('TIME RECLAIMED',W/2,H*0.13);
  ctx.globalAlpha=.65;ctx.fillStyle='#9fe8ff';ctx.font='12px monospace';ctx.fillText('FINAL CHAPTER  ·  TIME\'S END',W/2,H*0.18);
  ctx.globalAlpha=1;
  var castDone=castScroll>=CAST_TOTAL;
  if(!castDone){
    var startY=H*0.86-castScroll;
    for(var i=0;i<CAST_LINES.length;i++){
      var y=startY+i*CAST_LINE_H;if(y<-50||y>H+50) continue;
      var isTitle=i===0;
      ctx.fillStyle=isTitle?'#ffd27a':'#eaf4ff';
      ctx.font=(isTitle?'900 30px':'900 20px')+' "Arial Black", Arial, sans-serif';
      ctx.fillText(CAST_LINES[i][0],W/2,y);
      if(CAST_LINES[i][1]){
        ctx.fillStyle=isTitle?'#9fe8ff':'#8fb8ca';ctx.font='13px monospace';
        ctx.fillText(CAST_LINES[i][1],W/2,y+17);
      }
    }
  }
  if(castDone){
    var fa=Math.min(1,castHoldT/1.4);
    ctx.fillStyle='rgba(2,4,14,'+(0.62*fa)+')';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=fa;
    ctx.fillStyle='#ffe6a0';ctx.shadowColor='rgba(255,190,80,0.8)';ctx.shadowBlur=18;
    ctx.font='900 31px "Arial Black", Arial, sans-serif';ctx.fillText('THANK YOU',W/2,H*0.39);
    ctx.font='900 31px "Arial Black", Arial, sans-serif';ctx.fillText('FOR PLAYING',W/2,H*0.46);
    ctx.shadowBlur=0;ctx.fillStyle='#cfe8ff';ctx.font='600 22px Rajdhani, Arial, sans-serif';
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
  if(state==='finale'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); drawFinaleScene(); ctx.restore(); return; }
  if(state==='cast'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(2,4,14,0.45)';ctx.fillRect(0,0,W,H); drawCast(); ctx.restore(); return; }
  if(state==='bossDeath1'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); drawPhase1DeathScene(); ctx.restore(); return; }
  if(state==='bossOmen'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(0,0,0,0.84)';ctx.fillRect(0,0,W,H); drawBossOmen(); ctx.restore(); return; }
  if(state==='bossFusion'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(2,2,12,0.28)';ctx.fillRect(0,0,W,H); drawFusionScene(bossFusionT); ctx.restore(); return; }
  if(state==='fusion'){ paintFractalBg(BG_MAIN[4],BG_EDGE[4],0); ctx.fillStyle='rgba(2,2,12,0.22)';ctx.fillRect(0,0,W,H); drawEntityArrivalScene(); ctx.restore(); return; }
  var bgOff=0;
  if(state==='warpIn'){var wpg=Math.min(1,1-warpT/0.95);bgOff=H*(1-wpg);}
  if(bgOff>0){ctx.fillStyle='#03060e';ctx.fillRect(0,0,W,H);}
  var mainBg=(stage!==4&&bgCurrent)?bgCurrent:BG_MAIN[stage],edgeBg=BG_EDGE[stage];
  if(!mainBg||!mainBg.complete||!mainBg.naturalWidth) mainBg=bgCurrent;
  paintStageBg(mainBg,edgeBg,bgOff);
  ctx.fillStyle='rgba(4,6,18,'+(stage===3?0.28:(stage===2?0.10:(stage===0?0.08:0.06)))+')';ctx.fillRect(0,0,W,H);
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
  if(state==='bossAwaken') drawBossAwakenFx();
  drawBossCrossOrb();
  drawPhaseFx();
  drawBeams();
  for(var i=0;i<items.length;i++) drawItem(items[i]);
  for(var i=0;i<fx.length;i++) drawExplosion(fx[i]);
  drawBlastZones();

  drawPlayerLaser();
  drawODLaserFx();
  drawOptions();
  drawWingBeams();
  for(var i=0;i<parts.length;i++){var p=parts[i];ctx.globalAlpha=Math.max(0,p.life/0.8);ctx.fillStyle=p.col;ctx.fillRect(p.x-1.5,p.y-1.5,3,3);}
  ctx.globalAlpha=1;

  drawBombFx();
  var gi=player.bank>0.06?GIMG.p3:(player.bank<-0.06?GIMG.p4:GIMG.p2);
  var drawY=player.y;
  if(player.respawnT>0) drawY=player.y+(H+70-player.y)*(player.respawnT/1.3);
  if(gi&&gi.complete){
    ctx.globalAlpha=(state==='bossWarn'||state==='clear')?1:((player.invuln>0&&!player.noBlink&&Math.floor(player.invuln*14)%2===0)?0.25:1);
    var psc=1;
    if(state==='warpOut') psc=Math.max(0.18,1-(1-warpT/1.1)*0.82);
    if(state==='warpIn') psc=0.42+0.58*Math.min(1,1-warpT/0.95);
    if(player.specialPower>=4){ctx.save();ctx.globalCompositeOperation='lighter';var ag=ctx.createRadialGradient(player.x,drawY,0,player.x,drawY,52);ag.addColorStop(0,'rgba(255,215,100,0.28)');ag.addColorStop(1,'rgba(255,180,40,0)');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(player.x,drawY,52,0,TAU);ctx.fill();ctx.restore();}
    drawODAura(drawY);
    ctx.drawImage(gi,player.x-40*psc,drawY-40*psc,80*psc,80*psc);ctx.globalAlpha=1;
  }
  drawPickupMsg();
  drawHUD();
  drawBanner();
  drawEnd();
  ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
}

var dragging=false,dragLift=0,dragMaxY=H-70,lastTapAt=0,lastTapX=0,lastTapY=0;
function pt(e){var r=cvs.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function onDown(e){
  e.preventDefault(); initAudio(); loadSfxExtras();
  try{if(AC&&AC.state==='suspended')AC.resume();}catch(err){}
  if(bgmPending){var pk=bgmPending;bgmPending='';playBgm(pk);}
  var p=pt(e);
  if(state==='menu'){
    if(!audioReady){ audioReady=true; playBgm('m5'); }
    var sbs=stageSelectButtons();
    for(var si=0;si<sbs.length;si++){
      var sb=sbs[si];
      if(p.x>=sb.x&&p.x<=sb.x+sb.w&&p.y>=sb.y&&p.y<=sb.y+sb.h){ selectedStage=si; return; }
    }
    var stb=menuStartButton();
    if(p.x>=stb.x&&p.x<=stb.x+stb.w&&p.y>=stb.y&&p.y<=stb.y+stb.h){ startAtStage(selectedStage); return; }
    return;
  }
  if(state==='bossOmen'){ bossOmenT=6.5; return; }
  if(state==='bossFusion'){ bossFusionT=9.4; return; }
  if(state==='fusion'){ fusionT=3.6; return; }
  if(state==='cast'){ state='menu'; playBgm('m5'); return; }
  if(state==='win'||state==='over'){ startGame(); return; }
  var bx=W-64,by=H-78;
  if((p.x-bx)*(p.x-bx)+(p.y-by)*(p.y-by)<54*54){ bomb(); return; }
  var now=performance.now();
  if((state==='play'||state==='boss')&&now-lastTapAt<320&&Math.hypot(p.x-lastTapX,p.y-lastTapY)<70){ lastTapAt=0; bomb(); dragging=false; return; }
  lastTapAt=now; lastTapX=p.x; lastTapY=p.y;
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

window.__beams=function(){return beams.map(function(b){return {ang:+(b.ang*180/Math.PI).toFixed(0),t:+b.t.toFixed(2),charge:b.charge,fire:b.fire,owner:!!b.owner,sweep:b.sweepSpeed||0};});};
window.__orb=function(){return boss&&boss.crossOrb?{x:Math.round(boss.crossOrb.x),y:Math.round(boss.crossOrb.y),t:+boss.crossOrb.t.toFixed(2)}:null;};
window.__g=function(){return {state:state,stage:stage,score:score,enemies:enemies.length,bullets:bullets.length,ebullets:ebullets.length,hp:boss?Math.round(boss.hp):0,phase:boss?boss.phase:-1,bx:boss?Math.round(boss.x):0,lt:boss?+(boss.laserT.toFixed(1)):0,ut:boss?+(boss.ultT.toFixed(1)):0,uc:boss?+(boss.ultCharge.toFixed(1)):0,style:boss?boss.def.style:'',power:player.specialPower,items:items.length,shots:shots.length,weapon:player.weapon,options:player.options,lives:player.lives,php:player.hp,bombs:player.bombs};};
window.__god=function(){player.invuln=99999;player.noBlink=true;};
window.__stage=function(n){startStage(n);};
window.__boss=function(){if(!boss)spawnBoss();};
window.__form=function(f){spawnWave({t:0,type:f==='escort'?4:2,n:5,form:f,spd:70,noFire:false,aggr:1});};
window.__enemy=function(t){spawnWave({t:0,type:t==null?4:t,n:1,form:'line',spd:0,noFire:false,aggr:1});var e=enemies[enemies.length-1];if(e){e.y=280;e.entering=false;}};
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
window.__cast=function(){startCast();};
window.__castEnd=function(){castScroll=CAST_TOTAL;castHoldT=2;};
window.__p3=function(){if(boss)bossPhase(2);};
window.__fi=function(){return {state:state,fusionT:fusionT,time:time,boss:!!boss};};
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
