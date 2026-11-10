export const RETURN_DURATION_MS = 960;
export const easeInOutCubic = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

// Both movements share a clock: the camera begins while the sleeve finishes.
export function createReturnMotion(focus, extraction, needsRestore) {
  return { focus, extraction, needsRestore, duration: RETURN_DURATION_MS / 1000, elapsed: 0 };
}

export function advanceReturnMotion(state, dt) {
  state.elapsed += Math.max(0, dt);
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = easeInOutCubic;
  const duration = state.duration;
  const restore = state.needsRestore ? ease(clamp(state.elapsed / (duration * .52))) : 1;
  const out = ease(clamp((state.elapsed - (state.needsRestore ? duration * .31 : 0)) / (duration * (state.needsRestore ? .69 : 1))));
  const blend = ease(clamp(state.elapsed / duration));
  return { extraction: state.extraction * (1 - restore), focus: state.focus * (1 - out), blend, timeline:clamp(state.elapsed/duration), done: state.elapsed >= duration };
}

// Sample the same timeline curve for the canvas's viewport transition. WAAPI
// applies these keyframes without introducing inline styles or another ease.
export function createStageReturnFrames(from, to) {
  return Array.from({length:61},(_,i)=>{
    const offset=i/60, amount=easeInOutCubic(offset), frame={offset,position:'fixed',zIndex:'20'};
    for(const key of ['left','top','width','height'])frame[key]=`${from[key]+(to[key]-from[key])*amount}px`;
    return frame;
  });
}

// Bring the page controls back over the first half of the same return clock.
export function createPageReturnFrames() {
  return Array.from({length:61},(_,i)=>{
    const offset=i/60;
    return {offset,opacity:easeInOutCubic(Math.min(1,offset*2))};
  });
}

// The box and its contents return sooner than the camera, while beginning at
// their actual previous position so an interrupted inspection stays smooth.
export function returnBoxOffset(start, timeline) {
  const progress=Math.max(0,Math.min(1,timeline/.65));
  return progress===1?0:start*(1-easeInOutCubic(progress));
}

// All inspection transforms and the raised comic height use the same eased
// timeline progress. Supplying the current raised target also permits the box to
// finish opening while the comic is returning.
export function interpolateReturnPose(start, target, blend) {
  const mix = (a, b) => a + (b - a) * blend;
  return { turn: mix(start.turn, target.turn), tilt: mix(start.tilt, target.tilt), zoom: mix(start.zoom, target.zoom), height: mix(start.height, target.height), float: mix(start.float, 0) };
}

// The book and sleeve rig starts at its existing pose, then follows the
// already-eased sleeve curve without applying a second smoothstep.
export function interpolateSleeveRig(start, remaining) {
  return Object.fromEntries(Object.entries(start).map(([key,value])=>[key,value*remaining]));
}

// A slow unrelated spring or effect must not keep the collection locked after
// the return itself has finished. Give it a short grace period to settle.
export function finishReturnIfReady(state, stage, settled, dt) {
  if (!state?.complete || state.finished) return false;
  state.settleWait = (state.settleWait || 0) + Math.max(0, dt);
  if (!settled && state.settleWait < .2) return false;
  return releaseReturn(state, stage);
}

export function releaseReturn(state, stage) {
  if (!state || state.finished) return false;
  state.finished = true;
  stage.dataset.returning = 'false';
  state.resolve();
  return true;
}

// rAF can pause when the canvas leaves the viewport. Do not leave input locked
// while there are no frames to advance the normal return timeline.
export function scheduleReturnWatchdog(state, stage, onTimeout, schedule = setTimeout) {
  return schedule(() => {
    if (state.finished) return;
    onTimeout();
    releaseReturn(state, stage);
  }, 2000);
}

// Keep ticking a return even when the scene has momentarily settled before its
// timeline reaches the exact final frame.
export function shouldSkipSceneFrame(returning, dirty, wasSettled, floatStrength, stickersMoving) {
  return !returning && !dirty && wasSettled && floatStrength <= .0001 && !stickersMoving;
}
