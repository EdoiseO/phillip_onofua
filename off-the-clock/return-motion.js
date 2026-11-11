export const RETURN_DURATION_MS = 1050;
// Gentler than cubic: its peak speed is about half as high, so a long camera
// move reads as a glide rather than a crawl-then-swing.
export const easeInOutSine = value => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, value)))) / 2;

// One continuous motion: the zoom-out, the comic going back into its sleeve and
// the camera pull-out overlap, so nothing holds still mid-return.
export function createReturnMotion(focus, extraction, needsRestore) {
  return { focus, extraction, needsRestore, duration: needsRestore ? 2.2 : RETURN_DURATION_MS / 1000, elapsed: 0 };
}

export function advanceReturnMotion(state, dt) {
  state.elapsed = Math.min(state.duration, state.elapsed + Math.max(0, dt));
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = easeInOutSine;
  const duration = state.duration, t = clamp(state.elapsed / duration);
  // Sleeve: board, comic and film reverse slowly over the first 60% (1.3 s),
  // so each stage reads before the collection comes back.
  const restore = state.needsRestore ? ease(t / .6) : 1;
  // Overlap the pull-out with the last part of the initial sleeve framing.
  const cameraTimeline = state.needsRestore ? clamp((t - .30) / .70) : t;
  const cameraBlend = ease(cameraTimeline);
  const blend = ease(t);
  const unzoom = state.needsRestore ? ease(t / .34) : blend;
  return { extraction: state.extraction * (1 - restore), focus: state.focus * (1 - cameraBlend), blend, unzoom, cameraBlend, cameraTimeline, timeline: t, done: state.elapsed >= duration };
}

// Sample the same timeline curve for the canvas's viewport transition. WAAPI
// applies these keyframes without introducing inline styles or another ease.
export function createStageReturnFrames(from, to) {
  return Array.from({length:61},(_,i)=>{
    const offset=i/60, amount=easeInOutSine(offset), frame={offset,position:'fixed',zIndex:'20'};
    for(const key of ['left','top','width','height'])frame[key]=`${from[key]+(to[key]-from[key])*amount}px`;
    return frame;
  });
}

// Bring the page controls back over the first half of the same return clock.
export function createPageReturnFrames() {
  return Array.from({length:61},(_,i)=>{
    const offset=i/60;
    return {offset,opacity:easeInOutSine(Math.min(1,offset*2))};
  });
}

// Bring the box into view before the camera finishes. Use this same progress
// for the raised comic so the rim cannot catch up to it while the box rises.
export function returnBoxLift(timeline, cameraTimeline, needsRestore) {
  const travel = needsRestore ? (timeline - .2) / .55 : cameraTimeline;
  return easeInOutSine(travel / .65);
}

export function mixReturn(start, end, progress) {
  return start * (1 - progress) + end * progress;
}

// Blend in orbit coordinates: a Cartesian blend changes the apparent turn
// rate as the camera's distance changes. Widening the sleeve framing starts
// the turn, and the collection pull-out continues it on the same curve.
export function sampleReturnOrbit(start, rest, wideDistance, unzoom, pullOut) {
  const turn = wideDistance === undefined ? pullOut : mixReturn(unzoom * .18, 1, pullOut);
  const wide = wideDistance === undefined ? start.radius : mixReturn(start.radius, wideDistance, unzoom);
  return {
    theta: mixReturn(start.theta, rest.theta, turn),
    phi: mixReturn(start.phi, rest.phi, turn),
    radius: mixReturn(wide, rest.radius, pullOut),
  };
}

// Keep the book's lower edge above the rising rim even when the inspection
// scale and rotation still make it taller than it is in the resting pose.
export function returnComicHeight(start, rest, lift, rim, bottomOffset, clearance) {
  return Math.max(mixReturn(start, rest, lift), rim + clearance - bottomOffset);
}

// Use the extraction rig's own staged thresholds in reverse. The sleeve
// position itself has already been eased once by advanceReturnMotion.
export function sampleSleeveRig(out) {
  const smooth = (low, high, value) => {
    const x = Math.min(1, Math.max(0, (value - low) / (high - low)));
    return x * x * (3 - 2 * x);
  };
  return {
    pull:smooth(.155,.56,out), settle:smooth(.56,.855,out),
    separate:smooth(.56,.72,out), lower:smooth(.67,.855,out),
    free:smooth(.72,.855,out),
    // Closed at both endpoints. The plateaus leave a beat with the hinge
    // fully open on either side of the comic's movement, in both directions.
    bagOpen:smooth(0,.13,out)*(1-smooth(.88,1,out)),
    bookFocus:smooth(.74,.85,out)
  };
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
  }, 3600);
}

// Keep ticking a return even when the scene has momentarily settled before its
// timeline reaches the exact final frame.
export function shouldSkipSceneFrame(returning, dirty, wasSettled, floatStrength, stickersMoving) {
  return !returning && !dirty && wasSettled && floatStrength <= .0001 && !stickersMoving;
}
