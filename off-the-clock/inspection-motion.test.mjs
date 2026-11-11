import test from 'node:test';
import assert from 'node:assert/strict';
import {createInspectionFadeFrames, sampleInspectionLid, sealedSleeveSlideOut} from './inspection-motion.js';
import {sampleSleeveRig} from './return-motion.js';

test('page controls finish fading out before the close-up controls appear',()=>{
  const {page,controls}=createInspectionFadeFrames();
  assert.deepEqual([page[0].opacity,controls[0].opacity],[1,0]);
  assert.deepEqual([page[30].opacity,controls[30].opacity],[0,0]);
  assert.deepEqual([page.at(-1).opacity,controls.at(-1).opacity],[0,1]);
  assert.ok(page.every(({opacity},i)=>opacity===0||controls[i].opacity===0));
});

test('the sealed flap starts on the first frame and clears the mouth before the comic moves',()=>{
  const first=sampleSleeveRig(sealedSleeveSlideOut((1/60)/1.13));
  assert.ok(first.bagOpen>.02,'first frame lifts the flap');
  assert.equal(first.pull,0);
  for(let i=0;i<=100;i++){
    const rig=sampleSleeveRig(sealedSleeveSlideOut(i/200));
    if(rig.pull>0)assert.equal(rig.bagOpen,1,'flap is fully open when the lift starts');
  }
});

test('inspection carries a lid out of the way before lifting a seated comic',()=>{
  let beganLifting=false;
  for(let i=0;i<=100;i++){
    const frame=sampleInspectionLid(.12,i/100);
    if(frame.cardBlend>0){
      beganLifting=true;
      assert.ok(frame.progress>=.66,'lid must clear the mouth before the comic rises');
    }
  }
  assert.ok(beganLifting);
  assert.deepEqual(sampleInspectionLid(.82,.4),{progress:.82,cardBlend:.4,carry:false});
});
