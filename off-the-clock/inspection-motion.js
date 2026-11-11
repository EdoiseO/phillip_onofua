import {createPageReturnFrames, easeInOutSine} from './return-motion.js?v=1.11';

export const INSPECTION_OPEN_MS=900;
const LID_CLEAR=.66;
const CARRY_END=.44;

export function sampleInspectionOpen(elapsed){
  const progress=Math.max(0,Math.min(1,elapsed/INSPECTION_OPEN_MS));
  return {progress,blend:easeInOutSine(progress)};
}

// If the user inspects before the lid clears the box, finish its carry
// before lifting the comic. A lid that has already cleared stays in place.
export function sampleInspectionLid(start,blend){
  if(start>=LID_CLEAR)return {progress:start,cardBlend:blend,carry:false};
  return {
    progress:start+(LID_CLEAR-start)*Math.min(1,blend/CARRY_END),
    cardBlend:easeInOutSine((blend-CARRY_END)/(1-CARRY_END)),
    carry:true,
  };
}

export function createInspectionFadeFrames(){
  const page=createPageReturnFrames().map(({offset,opacity})=>({offset,opacity:1-opacity}));
  const controls=page.map(({offset,opacity})=>({offset:1-offset,opacity})).reverse();
  return {page,controls};
}

// Give the flap the first frames at the start of a sealed sleeve's slide-out.
// At .13 the flap is fully open. The original lift begins later, at .155.
export function sealedSleeveSlideOut(progress){
  return Math.max(Math.min(.13,progress),easeInOutSine(progress));
}
