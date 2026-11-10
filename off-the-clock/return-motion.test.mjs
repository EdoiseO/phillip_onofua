import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnMotion,advanceReturnMotion,interpolateReturnPose,interpolateSleeveRig,createStageReturnFrames,finishReturnIfReady,shouldSkipSceneFrame,scheduleReturnWatchdog} from './return-motion.js';

test('return overlaps sleeve restoration and camera movement',()=>{
  const state=createReturnMotion(1,1,true);
  let frame=advanceReturnMotion(state,.2);
  assert.equal(frame.focus,1);assert.ok(frame.extraction>0&&frame.extraction<1);
  frame=advanceReturnMotion(state,.14);
  assert.ok(frame.focus<1&&frame.extraction>0,'camera moves before sleeve finishes');
  frame=advanceReturnMotion(state,.2);
  assert.ok(frame.focus>0&&frame.focus<1);assert.equal(frame.extraction,0);
  frame=advanceReturnMotion(state,.42);
  assert.equal(frame.focus,0);assert.equal(frame.extraction,0);assert.equal(frame.blend,1);assert.equal(frame.done,true);
});

test('return without extraction begins moving immediately and ends at its target',()=>{
  const state=createReturnMotion(.7,0,false);
  const mid=advanceReturnMotion(state,.48);
  assert.ok(mid.focus>0&&mid.focus<.7);assert.equal(mid.extraction,0);
  const end=advanceReturnMotion(state,1);assert.equal(end.focus,0);assert.equal(end.extraction,0);assert.equal(end.done,true);
});

test('60 fps return frames stay continuous through overlap and final handoff',()=>{
  const state=createReturnMotion(1,1,true);
  const start={turn:Math.PI+.08,tilt:.8,zoom:1,height:1.42,float:.065};
  const target={turn:.08,tilt:-.025,zoom:0,height:4.55};
  const rig={pull:1,settle:1,free:1,bagOpen:1,bagFinish:1,bookFocus:1};
  let previous={focus:1,extraction:1,...start,...rig}, final;
  for(let i=0;i<64;i++){
    const frame=advanceReturnMotion(state,1/60), pose=interpolateReturnPose(start,target,frame.blend);
    const current={focus:frame.focus,extraction:frame.extraction,...pose,...interpolateSleeveRig(rig,frame.extraction)};
    for(const key of ['focus','extraction','zoom','float','pull','settle','free','bagOpen','bagFinish','bookFocus'])assert.ok(Math.abs(current[key]-previous[key])<.11,`${key} jumps at frame ${i}`);
    for(const key of ['turn','tilt','height'])assert.ok(Math.abs(current[key]-previous[key])<.17,`${key} jumps at frame ${i}`);
    previous=current;final=frame;
  }
  assert.equal(final.done,true);
  const handoff={focus:0,extraction:0,...target,float:0,...interpolateSleeveRig(rig,0)};
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

test('return unlocks even when another scene component never settles',()=>{
  const stage={dataset:{returning:'true'}};
  let resolved=0;
  const state={motion:createReturnMotion(1,1,true),complete:false,resolve:()=>{resolved++;}};
  for(let frame=0;frame<90&&stage.dataset.returning==='true';frame++){
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
  for(let frame=0;frame<60&&stage.dataset.returning==='true';frame++){
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
  assert.equal(delay,2000);
  callback();
  assert.equal(stage.dataset.returning,'false');
  assert.equal(reset,1);
  assert.equal(resolved,1);
  callback();
  assert.equal(reset,1);
  assert.equal(resolved,1);
});
