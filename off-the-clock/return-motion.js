// Return the extracted comic before moving the camera and box back into view.
// A fixed timeline avoids a long damp tail and gives reduced motion a clean snap.
export function createReturnMotion(focus, extraction, needsRestore) {
  return { focus, extraction, restoreDuration: needsRestore ? .38 : 0, duration: .4, elapsed: 0 };
}

export function advanceReturnMotion(state, dt) {
  state.elapsed += Math.max(0, dt);
  const restore = state.restoreDuration ? Math.min(1, state.elapsed / state.restoreDuration) : 1;
  const out = Math.min(1, Math.max(0, (state.elapsed - state.restoreDuration) / state.duration));
  const ease = value => value * value * (3 - 2 * value);
  return { extraction: state.extraction * (1 - ease(restore)), focus: state.focus * (1 - ease(out)), done: out === 1 };
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
  }, 1500);
}

// Keep ticking a return even when the scene has momentarily settled before its
// timeline reaches the exact final frame.
export function shouldSkipSceneFrame(returning, dirty, wasSettled, floatStrength, stickersMoving) {
  return !returning && !dirty && wasSettled && floatStrength <= .0001 && !stickersMoving;
}
