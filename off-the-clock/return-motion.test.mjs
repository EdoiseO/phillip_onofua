import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnMotion,advanceReturnMotion,interpolateReturnPose,sampleSleeveRig,createStageReturnFrames,createPageReturnFrames,returnBoxOffset,returnBoxTimeline,correctReturnCameraComponent,finishReturnIfReady,shouldSkipSceneFrame,scheduleReturnWatchdog} from './return-motion.js';

test('slide-out overlaps the sleeve and the camera in one motion',()=>{
  const state=createReturnMotion(1,1,true);
  assert.equal(state.duration,2.2);
  let frame=advanceReturnMotion(state,.25);
  assert.equal(frame.focus,1,'camera waits for the zoom-out to get going');
  assert.ok(frame.extraction>0&&frame.extraction<1);assert.ok(frame.unzoom>.3);
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
  const state=createReturnMotion(1,1,true), start=-7;
  assert.equal(returnBoxOffset(start,returnBoxTimeline(0,0,true)),start);
  const frame=advanceReturnMotion(state,1.05);
  const boxTimeline=returnBoxTimeline(frame.timeline,frame.cameraTimeline,true);
  assert.ok(frame.cameraTimeline>0&&frame.cameraTimeline<.5,'camera has started');
  assert.ok(sampleSleeveRig(frame.extraction).bagOpen>0,'film is still closing');
  assert.ok(returnBoxOffset(start,boxTimeline)>start/2,'box is already coming into view');
  assert.equal(returnBoxTimeline(.3,.3,false),.3,'ordinary returns keep their existing timing');
});

test('return preserves the world camera when inspection focus is incomplete',()=>{
  const start=9, overview=5, focus=.35, wide=13;
  const blended=overview+(start-overview)*focus;
  assert.equal(correctReturnCameraComponent(blended,start,overview,focus,0),start);
  assert.equal(correctReturnCameraComponent(wide,start,overview,focus,1),wide);
  assert.equal(correctReturnCameraComponent(blended,start,overview,1,0),blended);
  let previous=start;
  for(let i=1;i<=60;i++){
    const unzoom=i/60, inspection=start+(wide-start)*unzoom;
    const current=correctReturnCameraComponent(overview+(inspection-overview)*focus,start,overview,focus,unzoom);
    assert.ok(Math.abs(current-previous)<.1,`camera jumps at sample ${i}`);
    previous=current;
  }
});

test('60 fps return frames stay continuous through overlap and final handoff',()=>{
  const state=createReturnMotion(1,1,true);
  const start={turn:Math.PI+.08,tilt:.8,zoom:1,height:1.42,float:.065};
  const target={turn:.08,tilt:-.025,zoom:0,height:4.55};
  const rig=sampleSleeveRig(1);
  let previous={focus:1,extraction:1,...start,...rig}, final;
  for(let i=0;i<140;i++){
    const frame=advanceReturnMotion(state,1/60), pose=interpolateReturnPose(start,target,frame.blend);
    pose.zoom=start.zoom*(1-frame.unzoom);
    const current={focus:frame.focus,extraction:frame.extraction,...pose,...sampleSleeveRig(frame.extraction)};
    // The framing rig applies bookFocus together with the zoom.
    current.bookFocus*=pose.zoom;
    const limits={focus:.09,extraction:.08,zoom:.19,float:.01,pull:.2,settle:.2,free:.2,bagOpen:.23,bagFinish:.2,bookFocus:.23,turn:.14,tilt:.04,height:.14};
    for(const [key,limit] of Object.entries(limits))assert.ok(Math.abs(current[key]-previous[key])<limit,`${key} jumps at frame ${i}`);
    previous=current;final=frame;
  }
  assert.equal(final.done,true);
  const handoff={focus:0,extraction:0,...target,float:0,...sampleSleeveRig(0)};
  for(const key of Object.keys(handoff))assert.ok(Math.abs(previous[key]-handoff[key])<1e-9,`${key} jumps on handoff`);
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

test('box and lid return early without changing their starting or final offsets',()=>{
  const start=-7;
  assert.equal(returnBoxOffset(start,0),start);
  assert.ok(returnBoxOffset(start,.4)>start/2,'box is already more than halfway back');
  assert.equal(returnBoxOffset(start,.65),0);
  assert.equal(returnBoxOffset(start,1),0);
  let previous=start;
  for(let i=1;i<=60;i++){
    const offset=returnBoxOffset(start,i/60);
    assert.ok(offset>=previous && offset-previous<.6,`box jumps on frame ${i}`);
    previous=offset;
  }
});

test('return unlocks even when another scene component never settles',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=0;
  const state={motion:createReturnMotion(1,1,true),complete:false,resolve:()=>{resolved++;}};
  for(let frame=0;frame<160&&stage.dataset.returning==='true';frame++){
    state.complete=advanceReturnMotion(state.motion,1/60).done;
    finishReturnIfReady(state,stage,false,1/60);
  }
  assert.equal(stage.dataset.returning,'false');
  assert.equal(resolved,1);
  assert.equal(finishReturnIfReady(state,stage,true,1/60),false);
  assert.equal(resolved,1);
});

test('a momentarily settled return continues ticking until it unlocks',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=0;
  const state={motion:createReturnMotion(1,0,false),complete:false,resolve:()=>{resolved++;}};
  // Simulate the render loop becoming clean and settled before the last frame.
  for(let frame=0;frame<80&&stage.dataset.returning==='true';frame++){
    if(shouldSkipSceneFrame(true,false,true,0,false))continue;
    state.complete=advanceReturnMotion(state.motion,1/60).done;
    finishReturnIfReady(state,stage,true,1/60);
  }
  assert.equal(stage.dataset.returning,'false');
  assert.equal(resolved,1);
  assert.equal(shouldSkipSceneFrame(false,false,true,0,false),true);
});

test('return unlocks as soon as the completed scene settles',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=false;
  const state={complete:true,resolve:()=>{resolved=true;}};
  assert.equal(finishReturnIfReady(state,stage,true,1/60),true);
  assert.equal(stage.dataset.returning,'false');
  assert.equal(resolved,true);
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
