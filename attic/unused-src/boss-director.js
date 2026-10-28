// Stage-5 fused-boss attack director: one readable wave at a time.
var stage5Director={phase:-1,wave:0,wait:false,cooldown:2.0,lastCount:0};
var STAGE5_ATTACKS=[
  bossChronosBloom,
  bossEchoCross,
  bossCollapse,
  bossSwarm,
  bossHalo,
  bossCrossfire,
  bossSeraphFan
];
function stage5DirectorReset(){
  stage5Director.wave=0;
  stage5Director.wait=false;
  stage5Director.cooldown=2.2;
  stage5Director.lastCount=0;
}
function stage5DirectorStartWave(){
  if(!boss||state!=='boss') return false;
  var n=boss.phase>=2?((stage5Director.wave%3)+1):((stage5Director.wave%2)+1);
  var start=ebullets.length+beams.length+orbBullets.length+(boss.crossOrb?1:0);
  for(var i=0;i<n;i++){
    var fn=STAGE5_ATTACKS[(stage5Director.wave+i)%STAGE5_ATTACKS.length];
    try{ fn(); }catch(e){}
  }
  stage5Director.wave++;
  var added=ebullets.length+beams.length+orbBullets.length+(boss.crossOrb?1:0)-start;
  stage5Director.wait=added>0;
  stage5Director.cooldown=added>0?0.9:1.2;
  return added>0;
}
function updateStage5Director(dt){
  if(!boss||boss.phase<1||state!=='boss'){stage5Director.phase=-1;return;}
  if(typeof bossMech!=='undefined'&&(bossMech.phase==='warn'||bossMech.phase==='active')) return;
  if(stage5Director.phase!==boss.phase){stage5Director.phase=boss.phase;stage5DirectorReset();}
  if(stage5Director.wait){
    if(ebullets.length===0&&beams.length===0&&orbBullets.length===0&&!boss.crossOrb){
      stage5Director.wait=false;stage5Director.cooldown=2.2;
    }
    return;
  }
  stage5Director.cooldown-=dt;
  if(stage5Director.cooldown>0) return;
  if(boss.invuln>0){stage5Director.cooldown=0.35;return;}
  stage5DirectorStartWave();
}
