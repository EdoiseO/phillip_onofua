import test from 'node:test';
import assert from 'node:assert/strict';
import {startCompactReturn} from './compact-return.js';

function simulatedScheduler(){
  let id=0;const frames=new Map(),timers=new Map();
  return {
    request(cb){frames.set(++id,cb);return id;},cancel(id){frames.delete(id);},
    setTimer(cb){timers.set(++id,cb);return id;},clearTimer(id){timers.delete(id);},now:()=>0,
    frame(time){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time));},
    timeout(){const callbacks=[...timers.values()];timers.clear();callbacks.forEach(cb=>cb());},
    pending(){return {frames:frames.size,timers:timers.size};}
  };
}

test('compact return advances continuously and unlocks after reaching the destination',()=>{
  const scheduler=simulatedScheduler();let locked=true,completions=0;const samples=[];
  startCompactReturn({...scheduler,onFrame:t=>samples.push(t),onComplete(){locked=false;completions++;}});
  for(let time=16;time<1200&&locked;time+=16)scheduler.frame(time);
  assert.equal(locked,false,'return must release controls');
  assert.equal(completions,1);assert.equal(samples.at(-1),1);
  assert.ok(samples.some(t=>t>0&&t<1),'book moves through intermediate poses');
  assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
  scheduler.timeout();assert.equal(completions,1);
});

test('compact return watchdog unlocks if animation frames stop',()=>{
  const scheduler=simulatedScheduler();let locked=true,completions=0;
  startCompactReturn({...scheduler,onFrame(){},onComplete(){locked=false;completions++;}});
  scheduler.timeout();assert.equal(locked,false);assert.equal(completions,1);
  assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});

test('closing a compact display cancels pending return callbacks',()=>{
  const scheduler=simulatedScheduler();let completions=0;
  const cancel=startCompactReturn({...scheduler,onFrame(){},onComplete(){completions++;}});
  cancel();scheduler.frame(16);scheduler.timeout();
  assert.equal(completions,0);assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});
