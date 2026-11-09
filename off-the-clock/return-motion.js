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
