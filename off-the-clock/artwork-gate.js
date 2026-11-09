// Protect the first visible box frame without holding up a background tab or
// an off-screen canvas. A hidden page may not receive animation frames at all.
export function createArtworkGate(stage, {page = document, schedule = requestAnimationFrame, cancel = cancelAnimationFrame} = {}) {
  let resolve, settled = false, frame = 0, disposed = false;
  const ready = new Promise(done => { resolve = done; });
  function release(reason) {
    if (settled || disposed) return;
    settled = true;
    stage.dataset.artworkGate = reason;
    page.removeEventListener('visibilitychange', visibilityChanged);
    resolve(true);
  }
  function visibilityChanged() { if (page.hidden) release('hidden'); }
  page.addEventListener('visibilitychange', visibilityChanged);
  const rect = stage.getBoundingClientRect();
  const viewport = page.documentElement;
  if (page.hidden) release('hidden');
  else if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= viewport.clientHeight || rect.left >= viewport.clientWidth) release('offscreen');
  return {
    ready,
    visibility(visible) { if (!visible) release('offscreen'); },
    rendered() {
      if (frame || disposed) return;
      frame = schedule(() => {
        if (disposed) return;
        stage.dataset.boxPainted = 'true';
        release('painted');
      });
    },
    dispose() {
      disposed = true;
      cancel(frame);
      page.removeEventListener('visibilitychange', visibilityChanged);
      resolve(false);
    }
  };
}
