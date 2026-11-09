import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnMotion,advanceReturnMotion} from './return-motion.js';

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
