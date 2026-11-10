export const RETURN_DURATION_MS = 960;
export const easeInOutCubic = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

// A slide-out gets time to reverse its stages before the collection returns.
export function createReturnMotion(focus, extraction, needsRestore) {
  return { focus, extraction, needsRestore, duration: needsRestore ? 1.16 : RETURN_DURATION_MS / 1000, elapsed: 0 };
}

export function advanceReturnMotion(state, dt) {
  state.elapsed += Math.max(0, dt);
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = easeInOutCubic;
  const duration = state.duration;
  const restore = state.needsRestore ? ease(clamp(state.elapsed / (duration * .55))) : 1;
  const cameraTimeline = clamp((state.elapsed - (state.needsRestore ? duration * .50 : 0)) / (duration * (state.needsRestore ? .50 : 1)));
  const cameraBlend = ease(cameraTimeline);
  const blend = ease(clamp(state.elapsed / duration));
  const unzoom = state.needsRestore ? ease(clamp(state.elapsed / (duration * .32))) : blend;
  return { extraction: state.extraction * (1 - restore), focus: state.focus * (1 - cameraBlend), blend, unzoom, cameraTimeline, timeline:clamp(state.elapsed/duration), done: state.elapsed >= duration };
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

// Start bringing the box up during the latter part of the sleeve restoration,
// while the viewport and camera still wait for the film to close.
export function returnBoxTimeline(timeline, cameraTimeline, needsRestore) {
  return needsRestore ? Math.max(0,Math.min(1,(timeline-.12)/.58)) : cameraTimeline;
}

// All inspection transforms and the raised comic height use the same eased
// timeline progress. Supplying the current raised target also permits the box to
// finish opening while the comic is returning.
export function interpolateReturnPose(start, target, blend) {
  const mix = (a, b) => a + (b - a) * blend;
  return { turn: mix(start.turn, target.turn), tilt: mix(start.tilt, target.tilt), zoom: mix(start.zoom, target.zoom), height: mix(start.height, target.height), float: mix(start.float, 0) };
}

// Use the extraction rig's own staged thresholds in reverse. The sleeve
// position itself has already been eased once by advanceReturnMotion.
export function sampleSleeveRig(out) {
  const smooth = (low, high, value) => {
    const x = Math.min(1, Math.max(0, (value - low) / (high - low)));
    return x * x * (3 - 2 * x);
  };
  return {
    pull:smooth(.12,.68,out), settle:smooth(.68,1,out),
    free:smooth(.72,1,out), bagOpen:smooth(0,.2,out),
    bagFinish:smooth(.65,1,out), bookFocus:smooth(.9,1,out)
  };
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
  }, 2400);
}

// Keep ticking a return even when the scene has momentarily settled before its
// timeline reaches the exact final frame.
export function shouldSkipSceneFrame(returning, dirty, wasSettled, floatStrength, stickersMoving) {
  return !returning && !dirty && wasSettled && floatStrength <= .0001 && !stickersMoving;
}
