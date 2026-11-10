import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnMotion,advanceReturnMotion,finishReturnIfReady,shouldSkipSceneFrame,scheduleReturnWatchdog} from './return-motion.js';

test('return movement restores the comic before pulling back to the box',()=>{
  const state=createReturnMotion(1,1,true);
  let frame=advanceReturnMotion(state,.19);
  assert.equal(frame.focus,1);assert.ok(frame.extraction>0&&frame.extraction<1);
  frame=advanceReturnMotion(state,.19);
  assert.equal(frame.focus,1);assert.equal(frame.extraction,0);
  frame=advanceReturnMotion(state,.2);
  assert.ok(frame.focus>0&&frame.focus<1);assert.equal(frame.extraction,0);
  frame=advanceReturnMotion(state,.2);
  assert.deepEqual(frame,{focus:0,extraction:0,done:true});
});

test('return without extraction begins moving immediately and ends at its target',()=>{
  const state=createReturnMotion(.7,0,false);
  const mid=advanceReturnMotion(state,.2);
  assert.ok(mid.focus>0&&mid.focus<.7);assert.equal(mid.extraction,0);
  assert.deepEqual(advanceReturnMotion(state,1),{focus:0,extraction:0,done:true});
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
  assert.equal(delay,1500);
  callback();
  assert.equal(stage.dataset.returning,'false');
  assert.equal(reset,1);
  assert.equal(resolved,1);
  callback();
  assert.equal(reset,1);
  assert.equal(resolved,1);
});
