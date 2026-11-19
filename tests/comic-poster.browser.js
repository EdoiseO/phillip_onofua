// Run with playwright-cli run-code --filename=tests/comic-poster.browser.js on the built preview.
async page => {
  const url = new URL('/off-the-clock/',page.url()).href;
  const results = [];
  for(const [width,height,touch] of [[1280,900,false],[390,844,true]]){
    const context=await page.context().browser().newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'});
    try{
      const target=await context.newPage(), requests=[], errors=[];
      target.on('request',r=>requests.push(new URL(r.url()).pathname));
      target.on('pageerror',e=>errors.push(e.message));
      target.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await target.addInitScript(()=>{
        document.addEventListener('securitypolicyviolation',e=>console.error('CSP: '+e.violatedDirective));
      });
      await target.clock.install();
      // Compare the actual canvas to the fetched print: a state label alone cannot
      // detect an invisible, cropped or reversed poster. Average ink over a grid
      // so device antialiasing and the two narrow crease highlights are tolerated.
      async function checkPrint(response, folded){
        const screen=(await stage.screenshot()).toString('base64');
        const original=(await response.body()).toString('base64');
        const difference=await target.evaluate(async ({screen,original,touch,folded})=>{
          async function decode(mime,data){
            const im=new Image();im.src='data:'+mime+';base64,'+data;await im.decode();return im;
          }
          const [shot,print]=await Promise.all([decode('image/png',screen),decode('image/jpeg',original)]);
          const bookHeight=Math.min(1.73,shot.width/shot.height*1.85/1.31)*shot.height/2;
          const w=folded ? .38*bookHeight : Math.min(shot.width*.91,shot.height*.89*print.width/print.height),h=w*print.height/print.width;
          const x=folded?shot.width/2+.33*bookHeight-w/2:(touch ? .5 : .60)*shot.width-w/2;
          const y=(shot.height-h)/2+(folded ? .06*bookHeight : 0);
          const canvas=document.createElement('canvas');canvas.width=24;canvas.height=32;
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          ctx.imageSmoothingQuality='high';
          function sample(image,rect){
            ctx.drawImage(image,...rect,0,0,24,32);
            return ctx.getImageData(0,0,24,32).data;
          }
          const pixels=sample(shot,[x,y,w,h]),reference=sample(print,[0,0,print.width,print.height]);
          let error=0;
          for(let i=0;i<pixels.length;i++)if(i%4!==3)error+=Math.abs(pixels[i]-reference[i]);
          if(touch&&!folded){
            const margin=sample(shot,[0,y+h+2,shot.width,shot.height-y-h-2]);
            if(margin.some((v,i)=>i%4!==3&&v>90))throw Error('The comic is still visible below the phone poster');
          }
          return error/(24*32*3);
        },{screen,original,touch,folded});
        if(difference>24)throw Error((folded?'Folded':'Full')+' poster differs from its source by '+difference);
        return difference;
      }
      await target.bringToFront(); await target.goto(url);
      const stage=target.locator('#stage[data-box-painted=true]'), poster=target.locator('#view-poster');
      const click=async selector=>touch?target.locator(selector).tap():target.locator(selector).click();
      const counts=()=>({
        pages:requests.filter(p=>p.includes('/assets/pages/')).map(p=>p.split('/').at(-1)),
        full:requests.filter(p=>p.endsWith('/posters/ben10-6-poster.jpg')).length,
        quarter:requests.filter(p=>p.endsWith('/posters/ben10-6-quarter.jpg')).length,
      });
      await stage.waitFor();
      await stage.press('Enter'); await stage.press('i');
      if(await poster.isVisible()||await target.locator('#open-interior').isVisible())throw Error('A regular comic exposes preview controls');
      await click('#return-button');
      const tabs=target.locator('.comic-tab');
      const select=async letter=>{
        const idx=await tabs.evaluateAll((nodes,l)=>nodes.findIndex(n=>n.getAttribute('aria-label')?.startsWith('Ben 10 #6, Cover '+l)),letter);
        if(idx<0)throw Error('Missing edition '+letter);
        await target.locator('#comic-ruler').evaluate((el,i)=>{el.value=i;el.dispatchEvent(new Event('input',{bubbles:true}));},idx);
        await stage.press('i');
      };
      await select(touch?'E':'A');
      const box=counts();
      if(box.pages.length||box.full||box.quarter)throw Error('Preview art was fetched before the interior opened');
      const quarterResponse=target.waitForResponse(r=>r.url().endsWith('/posters/ben10-6-quarter.jpg')&&r.ok());
      await Promise.all([
        ...['page-02.jpg','page-03.jpg','ben10-6-quarter.jpg'].map(name=>target.waitForResponse(r=>r.url().endsWith('/'+name)&&r.ok())),
        click('#open-interior'),
      ]);
      await target.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const spread=counts();
      if(spread.pages.sort().join(',')!=='page-01.jpg,page-02.jpg,page-03.jpg'||spread.full||spread.quarter!==1)throw Error('Unexpected spread requests '+JSON.stringify(spread));
      await target.emulateMedia({reducedMotion:'no-preference'});
      await target.clock.pauseAt(new Date(await target.evaluate(()=>Date.now()+400)));
      const seatedDifference=await checkPrint(await quarterResponse,true);
      const fullResponse=target.waitForResponse(r=>r.url().endsWith('/posters/ben10-6-poster.jpg')&&r.ok());
      await poster.dispatchEvent('click');
      await target.locator('#inspection[data-poster=opening]').waitFor();
      await target.clock.runFor(960);
      if(await target.locator('#inspection').getAttribute('data-poster')!=='open'||await poster.textContent()!=='Put away')throw Error('Poster did not reach its reading pose');
      const difference=await checkPrint(await fullResponse,false);
      if(touch)await target.keyboard.press('Escape');else await poster.dispatchEvent('click');
      await target.clock.runFor(960);
      if(await target.locator('#inspection').getAttribute('data-poster')!=='seated'||!(await poster.evaluate(n=>document.activeElement===n)))throw Error('Poster did not return home with focus');
      await target.clock.resume();
      await target.emulateMedia({reducedMotion:'reduce'});
      await target.locator('body[data-reduced-motion=true]').waitFor();
      await click('#return-button');
      await target.locator('#stage[data-state=open]:not([data-returning=true])').waitFor();
      await select(touch?'A':'E');
      await click('#view-poster');
      await target.locator('#inspection[data-poster=open]').waitFor();
      await click('#view-poster');
      if(await target.locator('#inspection').getAttribute('data-poster')!=='seated')throw Error('Reduced motion did not stow immediately');
      await click('#return-button');
      await target.locator('#stage[data-state=open]:not([data-returning=true])').waitFor();
      const final=counts();
      if(final.full!==1||final.quarter!==1||final.pages.length!==3||errors.length)throw Error(JSON.stringify({counts:final,errors}));
      results.push({width,height,box,spread,final,seatedDifference,difference});
    }finally{await context.close();}
  }
  return results;
}
