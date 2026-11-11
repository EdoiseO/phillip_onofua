// Open the built /off-the-clock/ preview in Playwright CLI, then run:
// playwright-cli run-code --filename=tests/comic-open.browser.js
async page => {
  const url=new URL('/off-the-clock/',page.url()).href;
  const browser=page.context().browser();
  const results=[];
  for(const [width,height,hasTouch] of [[1280,900,false],[390,844,true]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch});
    try{
      // Measure the live geometry at paint time. The application does not
      // expose a debugging API or modify its behavior to support this test.
      await context.route('**/off-the-clock/model.js?*',async route=>{
        const response=await route.fetch();
        const source=(await response.text()).replace('renderer.render(scene,camera);dirty=false;',`
          renderer.render(scene,camera);dirty=false;
          if(window.comicProbe){
            const probe=window.comicProbe;
            const opacity=element=>+getComputedStyle(element).opacity;
            const {x,y,width,height}=stage.getBoundingClientRect();
            if(opening)probe.open.push({
              time:performance.now(),progress:opening.progress,focus,rect:[x,y,width,height],
              page:opacity(document.querySelector('.story')),
              header:opacity(document.querySelector('.inspection-header')),
              controls:opacity(document.querySelector('.inspection-footer')),
              boxY:body.position.y,lidProgress,cardY:cards[selected].group.position.y-body.position.y,
              lidRelative:[lid.position.x,lid.position.y-body.position.y,lid.position.z,...lid.quaternion.toArray()],
            });
            const flap=cards[selected].bag?.flapPanel;
            if(flap)probe.lastFlapAngle=flap.rotation.x;
            if(flap&&probe.slide){
              probe.slide.push({time:performance.now(),flapAngle:flap.rotation.x,pull:sleeveRig.pull,bagOpen:sleeveRig.bagOpen});
            }
          }
        `);
        await route.fulfill({response,body:source});
      });
      const target=await context.newPage();
      const errors=[];
      target.on('pageerror',error=>errors.push(error.message));
      await target.addInitScript(()=>{
        window.comicProbe={open:[],slide:null};
        document.addEventListener('securitypolicyviolation',event=>window.comicProbe.violation=event.violatedDirective);
      });
      await target.bringToFront();
      await target.goto(url);
      const stage=target.locator('#stage[data-box-painted=true]');
      await stage.waitFor();
      await stage.press('Enter');
      const click=selector=>hasTouch?target.locator(selector).tap():target.locator(selector).click();
      const rect=()=>stage.evaluate(node=>{
        const {x,y,width,height}=node.getBoundingClientRect();
        return [x,y,width,height];
      });
      await target.clock.install();
      await target.clock.pauseAt(new Date(await target.evaluate(()=>Date.now())+300));
      const before=await rect();
      await click('#inspect-button');
      await target.waitForTimeout(80);
      await target.clock.runFor(940);
      const after=await rect();
      const {open:frames,violation}=await target.evaluate(()=>window.comicProbe);
      const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
      if(violation||errors.length)throw new Error([violation,...errors].filter(Boolean).join('\n'));
      if(frames.length<52||frames.at(-1)?.progress!==1||frames.at(-1).time-frames[0].time<865||frames.at(-1).time-frames[0].time>925){
        throw new Error(`Expected about 900 ms of opening motion at ${width}px (${frames.length} frames)`);
      }
      if(delta(before,frames[0].rect)>.8||delta(after,frames.at(-1).rect)>.1||delta(before,after)<120)throw new Error('Opening canvas does not join both endpoint rectangles');
      let largestStep=0;
      for(let i=0;i<frames.length;i++){
        const frame=frames[i];
        if(frame.page>.01&&(frame.header>.01||frame.controls>.01))throw new Error('Page and inspection controls overlap');
        if(i>0)largestStep=Math.max(largestStep,delta(frame.rect,frames[i-1].rect));
        if(Math.abs(frame.boxY+7*frame.focus)>1e-6)throw new Error('Box does not sink on the camera curve');
        if(frames[0].lidProgress>=.66&&delta(frame.lidRelative,frames[0].lidRelative)>1e-6){
          throw new Error('A lid that has cleared the box moves relative to it');
        }
        if(frame.lidProgress<.66&&frame.cardY>1.43)throw new Error('Comic rises before the lid clears');
        if(i>0&&delta(frame.lidRelative,frames[i-1].lidRelative)>.45)throw new Error('Lid jumps during the carry');
      }
      if(largestStep>22||!frames.some(frame=>frame.page>.1&&frame.page<.9)||!frames.some(frame=>frame.controls>.1&&frame.controls<.9)){
        throw new Error('Canvas or controls jump instead of animating');
      }

      await target.evaluate(()=>{
        window.comicProbe.slide=[];
        window.comicProbe.slideStart=performance.now();
        window.comicProbe.closedFlapAngle=window.comicProbe.lastFlapAngle;
        document.querySelector('#sleeve-button').click();
      });
      await target.clock.runFor(1200);
      const {slide,slideStart,closedFlapAngle}=await target.evaluate(()=>window.comicProbe);
      const first=slide[0];
      if(!first||first.time-slideStart>17||first.bagOpen<.02||Math.abs(first.flapAngle-closedFlapAngle)<.02||first.pull!==0){
        throw new Error(`Sleeve flap must move on the first painted frame: ${JSON.stringify(first)}`);
      }
      const firstPull=slide.find(frame=>frame.pull>0);
      if(firstPull?.bagOpen!==1)throw new Error('Comic moves before the flap clears the sleeve');
      await target.clock.resume();
      await target.emulateMedia({reducedMotion:'reduce'});
      await target.locator('body[data-reduced-motion=true]').waitFor();
      await click('#return-button');
      await target.locator('#inspection:not([open])').waitFor({state:'attached'});
      await click('#inspect-button');
      if(await stage.getAttribute('data-opening')==='true'||delta(await rect(),after)>.1){
        throw new Error('Reduced-motion inspection should reach the close-up immediately');
      }
      results.push({width,frames:frames.length,largestStep,firstFlapMs:first.time-slideStart,firstFlapAngle:first.flapAngle-closedFlapAngle});
    }finally{
      await context.close();
    }
  }
  return results;
}
