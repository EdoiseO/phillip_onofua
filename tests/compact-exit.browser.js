// Open the built /off-the-clock/ preview in Playwright CLI, then run:
// playwright-cli run-code --filename=tests/compact-exit.browser.js
async page => {
  const url = new URL('/off-the-clock/', page.url()).href;
  const browser = page.context().browser();
  const results = [];
  for (const [width,height,hasTouch] of [[1280,900,false],[390,844,true]]) {
    for (const bookIndex of [0,1]) {
      const context = await browser.newContext({ viewport:{width,height},hasTouch });
      try {
        await context.route('**/off-the-clock/compacts-display.js?*', async route => {
          const response=await route.fetch();
          // Measure the real geometry and layout at paint time, without a
          // debug API in the built application.
          const source=(await response.text()).replaceAll('renderer.render(scene,camera);', `
            renderer.render(scene,camera);
            if(window.compactProbe){
              const rect=mount.getBoundingClientRect();
              const bounds=books.map(({group})=>new THREE.Box3().setFromObject(group));
              const anchors=books.map(({group})=>{
                const point=group.getWorldPosition(new THREE.Vector3()).project(camera);
                return [rect.left+(1+point.x)*rect.width/2,rect.top+(1-point.y)*rect.height/2];
              });
              window.compactProbe.anchors=anchors;
              if(returning){
                const moving=bounds[${bookIndex}];
                let extent=0;
                for(const x of [moving.min.x,moving.max.x])
                  for(const y of [moving.min.y,moving.max.y])
                    for(const z of [moving.min.z,moving.max.z]){
                      const point=new THREE.Vector3(x,y,z).project(camera);
                      extent=Math.max(extent,Math.abs(point.x),Math.abs(point.y));
                    }
                window.compactProbe.frames.push({
                  extent,
                  time:performance.now(),
                  rect:[rect.x,rect.y,rect.width,rect.height],
                  pageOpacity:+getComputedStyle(pageRoot.querySelector('.story')).opacity,
                  positions:books.map(({group})=>group.position.toArray()),
                  overlap:bounds[0].intersectsBox(bounds[1]),
                  gap:Math.max(...['x','y','z'].flatMap(key=>[bounds[0].min[key]-bounds[1].max[key],bounds[1].min[key]-bounds[0].max[key]])),
                });
              }
            }
          `);
          await route.fulfill({response,body:source});
        });
        const target=await context.newPage();
        const errors=[];
        target.on('pageerror',error=>errors.push(error.message));
        await target.addInitScript(()=>{
          window.compactProbe={anchors:null,frames:[]};
          document.addEventListener('securitypolicyviolation',event=>window.compactProbe.violation=event.violatedDirective);
        });
        await target.bringToFront();
        await target.goto(url);
        await target.locator('#stage[data-box-painted=true]').waitFor();
        const click=selector=>hasTouch?target.locator(selector).tap():target.locator(selector).click();
        const mount=target.locator('#compact-canvas');
        const box=()=>mount.evaluate(node=>{
          const {x,y,width,height}=node.getBoundingClientRect();
          return [x,y,width,height];
        });
        const enter=async()=>{
          await target.waitForFunction(()=>window.compactProbe.anchors!==null);
          const [x,y]=await target.evaluate(index=>window.compactProbe.anchors[index],bookIndex);
          if(hasTouch)await target.touchscreen.tap(x,y);
          else await target.mouse.click(x,y);
          await target.locator('#compact-dialog.compact-inspecting').waitFor();
          await target.locator('#compact-canvas[data-picking=false]').waitFor();
        };
        await click('#collection-compacts');
        await target.locator('#compact-dialog[open] canvas').waitFor();
        await target.locator('#compact-dialog').evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished)));
        const shelf=await box();
        await enter();
        const closeup=await box();
        await target.clock.install();
        await target.clock.pauseAt(new Date(await target.evaluate(()=>Date.now())+300));
        await click('#compact-return');
        await target.clock.runFor(1040);
        const {frames,violation}=await target.evaluate(()=>window.compactProbe);
        if(violation||errors.length)throw new Error([violation,...errors].filter(Boolean).join('\n'));
        if(frames.length<55)throw new Error(`Only ${frames.length} return frames`);
        const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
        if(delta(frames[0].rect,closeup)>.1||delta(frames.at(-1).rect,shelf)>.1||delta(await box(),shelf)>.1) {
          throw new Error('The animated rect must match the close-up and shelf at the endpoints');
        }
        let largestStep=0;
        for(let i=1;i<frames.length;i++)largestStep=Math.max(largestStep,delta(frames[i].rect,frames[i-1].rect));
        if(largestStep>20)throw new Error(`Canvas jumped ${largestStep}px between frames`);
        if(!frames.some(frame=>frame.pageOpacity>.1&&frame.pageOpacity<.8)||frames[Math.ceil(frames.length/2)+1].pageOpacity<.99) {
          throw new Error('Page must fade in during the first half of the exit');
        }
        const early=frames.find(frame=>frame.time>=frames[0].time+42);
        if(!early||early.time-frames[0].time>70||delta(early.positions[bookIndex],frames[0].positions[bookIndex])<.02) {
          throw new Error('Book waits before starting its return');
        }
        if(frames.some(frame=>frame.overlap))throw new Error('Paperback path intersects the other book');
        const maxExtent=Math.max(...frames.map(frame=>frame.extent));
        if(maxExtent>1.01)throw new Error(`Paperback is cropped during the return (extent ${maxExtent})`);
        const focus=await target.evaluate(()=>{
          const active=document.activeElement;
          return {id:active.id,outline:getComputedStyle(active).outlineStyle,bookRing:!!document.querySelector('[data-book]:focus-visible')};
        });
        if(focus.id!=='experience'||focus.outline!=='none'||focus.bookRing)throw new Error(`Pointer exit leaves a focus ring: ${JSON.stringify(focus)}`);
        await mount.focus();
        await target.keyboard.press('Tab');
        await target.locator('[data-book]:focus-visible').waitFor();
        await target.emulateMedia({reducedMotion:'reduce'});
        await target.clock.resume();
        await target.locator('[data-book]:focus-visible').press('Enter');
        await target.locator('#compact-dialog.compact-inspecting').waitFor();
        await click('#compact-return');
        if(await mount.getAttribute('data-returning')!=='false'||delta(await box(),shelf)>.1) {
          throw new Error('Reduced-motion exit should land in the shelf immediately');
        }
        results.push({width,bookIndex,frames:frames.length,largestStep,maxExtent,minGap:Math.min(...frames.map(frame=>frame.gap))});
      } finally {
        await context.close();
      }
    }
  }
  return results;
}
