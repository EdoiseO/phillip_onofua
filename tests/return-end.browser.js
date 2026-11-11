// Open the built /off-the-clock/ preview in Playwright CLI, then run:
// playwright-cli run-code --filename=tests/return-end.browser.js
async page => {
  const url = new URL('/off-the-clock/', page.url()).href;
  const browser = page.context().browser();
  const results = [];
  for (const [width, height, hasTouch] of [[1280, 900, false], [390, 844, true]]) {
    for (const mode of ['plain', 'slide-out', 'inspect']) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch });
      try {
        // Observe the real render loop without shipping a debug API. Force
        // extra renders to check the pose after the animation has released it.
        await context.route('**/off-the-clock/model.js?*', async route => {
          const response = await route.fetch();
          const source = (await response.text()).replace(
            'const stickersMoving=stickerSystem.tick(dt,reduced);',
            'const stickersMoving=stickerSystem.tick(dt,reduced);if(window.returnFrames)dirty=true;',
          ).replace('renderer.render(scene,camera);dirty=false;', `
            renderer.render(scene,camera);dirty=false;
            if(window.returnFrames){
              const inverseWorld=new THREE.Matrix4().copy(world.matrixWorld).invert();
              const matrix=new THREE.Matrix4(), bounds=new THREE.Box3();
              const book=cards[selected].book;
              book.traverse(part=>{
                if(!part.isMesh)return;
                matrix.multiplyMatrices(inverseWorld,part.matrixWorld);
                if(!part.geometry.boundingBox)part.geometry.computeBoundingBox();
                bounds.union(new THREE.Box3().copy(part.geometry.boundingBox).applyMatrix4(matrix));
              });
              const orbit=new THREE.Spherical().setFromVector3(camera.position.clone().sub(cameraTarget));
              window.returnFrames.push({
                time:now, phase:position?.timeline, pullOut:position?.cameraBlend, widen:position?.unzoom,
                yaw:orbit.theta, pitch:orbit.phi, distance:orbit.radius,
                clearance:bounds.min.y-body.position.y-bodyLocalBounds.max.y,
                frame:[
                  ...camera.position.toArray(), ...camera.quaternion.toArray(), ...camera.projectionMatrix.toArray(),
                  ...body.matrixWorld.toArray(), ...lid.matrixWorld.toArray(), ...book.matrixWorld.toArray(),
                ],
              });
            }
          `);
          await route.fulfill({ response, body: source });
        });
        const target = await context.newPage();
        const errors = [];
        target.on('pageerror', error => errors.push(error.message));
        target.on('console', message => { if(message.type()==='error')errors.push(message.text()); });
        await target.bringToFront();
        await target.goto(url);
        try {
          await target.locator('#stage[data-box-painted="true"]').waitFor({timeout:10000});
        } catch (error) {
          throw new Error(`${width} ${mode}: ${error.message} ${await target.locator('#stage').evaluate(node=>JSON.stringify(node.dataset))} ${errors.join(' | ')}`);
        }
        const stage = target.locator('#stage');
        await stage.press('Enter');
        await stage.press('i');
        await target.locator('#inspection[open]').waitFor();
        if (mode === 'slide-out') await target.locator('#sleeve-button').click();
        if (mode === 'inspect') await target.locator('#view-comic').click();
        await target.waitForTimeout(2500);
        const finished = await target.evaluate(() => document.querySelector('#inspection').open);
        if (!finished) throw new Error('Inspection did not open');
        await target.clock.install();
        await target.clock.pauseAt(new Date(await target.evaluate(() => Date.now()) + 350));
        await target.evaluate(() => {
          window.returnFrames = [];
          document.querySelector('#return-button').click();
          window.scrollTo({top:0,behavior:'instant'});
        });
        // Let IntersectionObserver see the stage back in the page before
        // advancing the paused clock.
        await target.waitForTimeout(100);
        await target.clock.runFor(mode==='plain'?1400:2550);
        const frames = await target.evaluate(() => window.returnFrames);
        if (errors.length) throw new Error(errors.join('\n'));
        const moving = frames.filter(frame => frame.phase !== undefined);
        const resting = frames.slice(frames.findIndex(frame => frame.phase === 1) + 1);
        if (moving.length < 30 || moving.at(-1)?.phase !== 1 || resting.length < 20) {
          const details=await stage.evaluate(node=>JSON.stringify({hidden:document.hidden,scrollY,rect:node.getBoundingClientRect(),...node.dataset}));
          throw new Error(`${width} ${mode}: incomplete return trace (${moving.length} motion, ${resting.length} rest) ${details}`);
        }
        const end = moving.at(-1);
        const clearance = Math.min(...moving.map(frame => frame.clearance));
        if (clearance < end.clearance - .003) throw new Error(`${width} ${mode}: book dipped ${end.clearance - clearance} below rest`);
        const worstDrift = Math.max(...resting.map(sample => Math.max(
          ...sample.frame.map((value, i) => Math.abs(value - end.frame[i])),
        )));
        if (worstDrift > 1e-6) throw new Error(`${width} ${mode}: post-return transform drift ${worstDrift}`);
        const first = moving[0];
        const angleProgress = sample => mode === 'plain' ? sample.pullOut : .18 * sample.widen * (1 - sample.pullOut) + sample.pullOut;
        const firstProgress = angleProgress(first);
        let turnError = 0;
        for (const sample of moving) {
          const progress = (angleProgress(sample) - firstProgress) / (1 - firstProgress);
          for (const key of ['yaw', 'pitch']) {
            const expected = first[key] + (end[key] - first[key]) * progress;
            turnError = Math.max(turnError, Math.abs(sample[key] - expected));
          }
        }
        if (turnError > .002) throw new Error(`${width} ${mode}: camera turn strays from the pull-out curve by ${turnError} rad`);
        if (await stage.getAttribute('data-returning') !== 'false') throw new Error('Return left input locked');
        results.push({ width, mode, frames: moving.length, clearance, restingClearance: end.clearance, worstDrift, turnError });
      } finally {
        await context.close();
      }
    }
  }
  return results;
}
