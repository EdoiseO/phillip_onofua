import test from 'node:test';
import assert from 'node:assert/strict';
import {createArtworkGate} from './artwork-gate.js';

function fixture({hidden = false, offscreen = false} = {}) {
  const page = new EventTarget();
  Object.assign(page, {hidden, documentElement: {clientWidth: 1280, clientHeight: 800}});
  const stage = {dataset: {}, getBoundingClientRect: () => ({left: 0, right: 500, top: offscreen ? 900 : 0, bottom: 1200})};
  let next, cancelled;
  const gate = createArtworkGate(stage, {page, schedule: cb => {next = cb; return 1;}, cancel: id => {cancelled = id;}});
  return {page, stage, gate, paint: () => next?.(), cancelled: () => cancelled};
}

test('visible artwork waits until the frame after rendering', async () => {
  const {gate, stage, paint} = fixture(); let released = false;
  gate.ready.then(() => {released = true;});
  gate.rendered(); await Promise.resolve(); assert.equal(released, false);
  paint(); assert.equal(await gate.ready, true);
  assert.equal(stage.dataset.boxPainted, 'true'); assert.equal(stage.dataset.artworkGate, 'painted');
});
test('background and offscreen canvases stream without a frame', async () => {
  for (const settings of [{hidden: true}, {offscreen: true}]) {
    const {gate, stage} = fixture(settings);
    assert.equal(await gate.ready, true); assert.equal(stage.dataset.boxPainted, undefined);
  }
});
test('hiding or scrolling away before first paint cannot strand artwork', async () => {
  const hidden = fixture(); hidden.page.hidden = true;
  hidden.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(await hidden.gate.ready, true);
  const scrolled = fixture(); scrolled.gate.visibility(false);
  assert.equal(await scrolled.gate.ready, true);
});
test('disposing before paint cancels the gate without requesting artwork', async () => {
  const {gate, stage, paint, cancelled} = fixture();
  gate.rendered(); gate.dispose(); paint();
  assert.equal(await gate.ready, false); assert.equal(cancelled(), 1);
  assert.equal(stage.dataset.boxPainted, undefined);
});
