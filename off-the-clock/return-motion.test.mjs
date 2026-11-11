import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnMotion,advanceReturnMotion,sampleSleeveRig,createStageReturnFrames,createPageReturnFrames,returnBoxLift,returnComicHeight,sampleReturnOrbit,mixReturn,releaseReturn,shouldSkipSceneFrame,scheduleReturnWatchdog} from './return-motion.js';

test('slide-out overlaps the sleeve and the camera in one motion',()=>{
  const state=createReturnMotion(1,1,true);
  assert.equal(state.duration,2.2);
  let frame=advanceReturnMotion(state,.25);
  assert.equal(frame.focus,1,'camera waits for the zoom-out to get going');
  assert.ok(frame.extraction>0&&frame.extraction<1);assert.ok(frame.unzoom>.2);
  frame=advanceReturnMotion(state,.8);
  assert.ok(frame.focus<1&&frame.extraction>0,'camera starts while the film is still closing');
  frame=advanceReturnMotion(state,1.5);
  assert.equal(frame.focus,0);assert.equal(frame.extraction,0);assert.equal(frame.blend,1);assert.equal(frame.done,true);
});

test('board and sleeve return before the comic descends and the film closes',()=>{
  const state=createReturnMotion(1,1,true);
  let previous=sampleSleeveRig(1), settleDone=false,pullDone=false,bagDone=false;
  for(let i=0;i<180;i++){
    const frame=advanceReturnMotion(state,1/120), rig=sampleSleeveRig(frame.extraction);
    if(rig.pull<previous.pull-1e-9)assert.ok(rig.settle<.01,'comic descent waits for board and sleeve');
    if(rig.bagOpen<previous.bagOpen-1e-9)assert.ok(rig.pull<.06,'film closes only after comic is mostly down');
    if(rig.settle===0)settleDone=true;
    if(rig.pull===0){assert.ok(settleDone);pullDone=true;}
    if(rig.bagOpen===0){assert.ok(pullDone);bagDone=true;}
    previous=rig;
  }
  assert.ok(settleDone&&pullDone&&bagDone);
});

test('return without extraction begins moving immediately and ends at its target',()=>{
  const state=createReturnMotion(.7,0,false);
  assert.equal(state.duration,1.05);
  const mid=advanceReturnMotion(state,.52);
  assert.ok(mid.focus>0&&mid.focus<.7);assert.equal(mid.extraction,0);
  const end=advanceReturnMotion(state,1);assert.equal(end.focus,0);assert.equal(end.extraction,0);assert.equal(end.done,true);
});

test('nothing holds still mid-return and no frame jumps',()=>{
  for(const needsRestore of [true,false]){
    const state=createReturnMotion(1,needsRestore?1:0,needsRestore),dt=1/60;
    let previous=advanceReturnMotion(state,0),still=0,longestStill=0,peak=0;
    while(!previous.done){
      const frame=advanceReturnMotion(state,dt);
      const deltas=[frame.focus-previous.focus,frame.extraction-previous.extraction,frame.unzoom-previous.unzoom].map(Math.abs);
      const change=deltas[0]+deltas[1]+deltas[2];
      peak=Math.max(peak,...deltas);
      if(!frame.done&&frame.timeline>.05&&frame.timeline<.95){still=change<1e-3?still+dt:0;longestStill=Math.max(longestStill,still);}
      previous=frame;
    }
    assert.ok(longestStill<.08,`motion pauses for ${longestStill.toFixed(2)} s (restore=${needsRestore})`);
    assert.ok(peak<.05,`a frame changes by ${peak.toFixed(3)} (restore=${needsRestore})`);
  }
});

test('box rises while the sleeve closes and the camera begins',()=>{
  const state=createReturnMotion(1,1,true);
  const start=advanceReturnMotion(state,0);
  assert.equal(returnBoxLift(start.timeline,start.cameraTimeline,true),0);
  const frame=advanceReturnMotion(state,1.05);
  assert.ok(frame.cameraTimeline>0&&frame.cameraTimeline<.5,'camera has started');
  assert.ok(sampleSleeveRig(frame.extraction).bagOpen>0,'film is still closing');
  assert.ok(returnBoxLift(frame.timeline,frame.cameraTimeline,true)>.5,'box is already coming into view');
});

test('the orbit widens and turns on the same curve in each camera phase',()=>{
  const start={theta:0,phi:Math.PI/2,radius:4};
  const rest={theta:.52,phi:1.33,radius:15};
  const wide=9;
  for(const needsRestore of [true,false]){
    const state=createReturnMotion(1,Number(needsRestore),needsRestore);
    for(let time=0;time<=state.duration*60;time++){
      const frame=advanceReturnMotion(state,time===0?0:1/60);
      const orbit=sampleReturnOrbit(start,rest,needsRestore?wide:undefined,frame.unzoom,frame.cameraBlend);
      const wideYaw=needsRestore?.18*rest.theta*frame.unzoom:0;
      const widePitch=needsRestore?mixReturn(start.phi,rest.phi,.18*frame.unzoom):start.phi;
      const wideRadius=needsRestore?mixReturn(start.radius,wide,frame.unzoom):start.radius;
      const pullOut=(orbit.radius-wideRadius)/(rest.radius-wideRadius);
      assert.ok(Math.abs((orbit.theta-wideYaw)/(rest.theta-wideYaw)-pullOut)<1e-9);
      assert.ok(Math.abs((orbit.phi-widePitch)/(rest.phi-widePitch)-pullOut)<1e-9);
      if(needsRestore&&frame.cameraBlend===0){
        assert.ok(Math.abs(orbit.theta/(rest.theta*.18)-(orbit.radius-start.radius)/(wide-start.radius))<1e-9);
      }
    }
    const end=advanceReturnMotion(state,1);
    assert.deepEqual(sampleReturnOrbit(start,rest,needsRestore?wide:undefined,end.unzoom,end.cameraBlend),rest);
  }
});

test('the lower edge never dips below the resting clearance as the rim rises',()=>{
  const rim=2.913, restHeight=4.55, restBottom=-1.38, clearance=restHeight+restBottom-rim;
  for(const needsRestore of [true,false]){
    const state=createReturnMotion(1,Number(needsRestore),needsRestore);
    let previous=3.2;
    for(let i=0;i<=Math.ceil(state.duration*60);i++){
      const frame=advanceReturnMotion(state,i===0?0:1/60);
      const lift=returnBoxLift(frame.timeline,frame.cameraTimeline,needsRestore);
      const movingRim=rim+mixReturn(-7,0,lift);
      const bottom=mixReturn(-1.82,restBottom,frame.cameraBlend);
      const height=returnComicHeight(3.2,restHeight,lift,movingRim,bottom,clearance);
      assert.ok(height+bottom-movingRim>=clearance-1e-9,`rim catches the book at frame ${i}`);
      assert.ok(Math.abs(height-previous)<.19,`height jumps at frame ${i}`);
      previous=height;
    }
    assert.ok(Math.abs(previous-restHeight)<1e-9);
  }
});

test('the final motion sample stays exact even when another frame ticks',()=>{
  for(const needsRestore of [true,false]){
    const state=createReturnMotion(.85,Number(needsRestore),needsRestore);
    const final=advanceReturnMotion(state,3);
    assert.equal(final.done,true);
    assert.deepEqual(final,advanceReturnMotion(state,1/60));
    for(const key of ['blend','unzoom','cameraBlend','cameraTimeline','timeline'])assert.equal(final[key],1);
    assert.equal(final.focus,0);
    assert.equal(final.extraction,0);
  }
});

test('compact return can still override the timeline duration',()=>{
  const state=createReturnMotion(1,0,false);state.duration=.7;
  assert.ok(advanceReturnMotion(state,.35).focus>0);
  assert.equal(advanceReturnMotion(state,.35).done,true);
});

test('stage relocation stays continuous at 60 fps and ends at its layout bounds',()=>{
  const from={left:60,top:120,width:1160,height:620},to={left:470,top:180,width:760,height:580};
  const frames=createStageReturnFrames(from,to);
  for(const [index,frame] of frames.entries())for(const key of ['left','top','width','height']){
    if(index===0)assert.equal(parseFloat(frame[key]),from[key]);
    if(index===frames.length-1)assert.equal(parseFloat(frame[key]),to[key]);
    if(index)assert.ok(Math.abs(parseFloat(frame[key])-parseFloat(frames[index-1][key]))<22,`${key} jumps at ${index}`);
  }
});

test('page controls fade in continuously over the first half of the return',()=>{
  const frames=createPageReturnFrames();
  assert.equal(frames[0].opacity,0);
  assert.ok(Math.abs(frames[15].opacity-.5)<1e-9);
  assert.equal(frames[30].opacity,1);
  assert.equal(frames[60].opacity,1);
  for(let i=1;i<frames.length;i++){
    assert.ok(frames[i].opacity>=frames[i-1].opacity);
    assert.ok(frames[i].opacity-frames[i-1].opacity<.1,'opacity does not jump');
  }
});

test('a momentarily settled return continues ticking until the last frame unlocks it',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=0;
  const state={motion:createReturnMotion(1,0,false),resolve:()=>{resolved++;}};
  for(let frame=0;frame<80&&stage.dataset.returning==='true';frame++){
    if(shouldSkipSceneFrame(true,false,true,0,false))continue;
    if(advanceReturnMotion(state.motion,1/60).done)releaseReturn(state,stage);
  }
  assert.equal(stage.dataset.returning,'false');
  assert.equal(resolved,1);
  assert.equal(releaseReturn(state,stage),false);
  assert.equal(shouldSkipSceneFrame(false,false,true,0,false),true);
});

test('watchdog unlocks an offscreen return when no animation frames arrive',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=0, reset=0, callback, delay;
  const state={complete:false,resolve:()=>{resolved++;}};
  scheduleReturnWatchdog(state,stage,()=>{reset++;},(fn,ms)=>{callback=fn;delay=ms;return 1;});
  assert.equal(delay,3600);
  callback();
  assert.equal(stage.dataset.returning,'false');
  assert.equal(reset,1);
  assert.equal(resolved,1);
  callback();
  assert.equal(reset,1);
  assert.equal(resolved,1);
});
