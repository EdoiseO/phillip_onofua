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
      // Sample the actual canvas. Compare aligned ink samples when the sheet is
      // tilted so a change in its silhouette alone cannot pass the gloss test.
      async function sample(view, response, yaw=0){
        const screen=(await stage.screenshot()).toString('base64');
        const original=response && (await response.body()).toString('base64');
        return target.evaluate(async ({screen,original,view,yaw,touch})=>{
          async function decode(mime,data){
            const image=new Image();image.src='data:'+mime+';base64,'+data;
            await image.decode();return image;
          }
          const shot=await decode('image/png',screen),{width:sw,height:sh}=shot;
          const book=Math.min(1.73,sw/sh*1.85/1.31)*sh/2;
          const w=Math.min(sw*.91,sh*.89*1262/1600),h=w*1600/1262;
          const cx=sw*(touch?.5:.60), cy=sh/2;
          const canvas=document.createElement('canvas');canvas.width=24;canvas.height=32;
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          ctx.imageSmoothingQuality='high';
          function grid(image,rect,projection){
            ctx.save();
            if(projection){
              ctx.setTransform(projection.inverse());
              ctx.drawImage(image,0,0);
            }else ctx.drawImage(image,...rect,0,0,24,32);
            ctx.restore();
            return Array.from(ctx.getImageData(0,0,24,32).data).filter((_,i)=>i%4!==3);
          }
          let rect, projection, source=[0,0,1,1];
          if(view==='seated') rect=[sw/2+.22*book,cy-.06*book,.21*book,.24*book];
          else if(view==='across') rect=[cx-.43*w,cy-.28*h,.86*w,.32*h];
          else if(view==='left'||view==='right'){
            source=[.12,.07,.76,.19];
            // Project the same upper strip of each page through the book's
            // gentle resting tilt. A few pixels of skew shift the lettering.
            const cz=Math.cos(.012),sz=Math.sin(.012),ax=-.065,ay=-.045;
            function point(u,v){
              const x=((view==='left'?-1:0)+u)*.655,y=.5-v;
              const rx=x*cz-y*sz, ry=x*sz+y*cz;
              return [sw/2+rx*Math.cos(ay)*book,cy-(ry*Math.cos(ax)+rx*Math.sin(ay)*Math.sin(ax))*book];
            }
            const tl=point(source[0],source[1]),tr=point(source[0]+source[2],source[1]),bl=point(source[0],source[1]+source[3]);
            projection=new DOMMatrix([(tr[0]-tl[0])/24,(tr[1]-tl[1])/24,(bl[0]-tl[0])/32,(bl[1]-tl[1])/32,...tl]);
          }else{
            const rollDegrees=1, roll=rollDegrees*Math.PI/180;
            projection=new DOMMatrix().translate(cx,cy).scale(Math.cos(yaw),1)
              .rotate(rollDegrees).scale(w/24,h/32).translate(-12,-16);
            const bottom=cy+(h*Math.cos(roll)+w*Math.sin(roll))/2;
            if(touch && grid(shot,[0,bottom+2,sw,sh-bottom-2]).some(channel=>channel>90))
              throw Error('The comic overlaps the phone poster');
          }
          const pixels=grid(shot,rect,projection);
          if(!original)return pixels;
          const ink=await decode('image/jpeg',original);
          const ref=grid(ink,source.map((v,i)=>v*(i%2?ink.height:ink.width)));
          return pixels.reduce((sum,n,i)=>sum+Math.abs(n-ref[i]),0)/pixels.length;
        },{screen,original,view,yaw,touch});
      }
      async function checkPaper(view){
        const pixels=await sample(view);
        let matte=0;
        for(let i=0;i<pixels.length;i+=3){
          const [r,g,b]=pixels.slice(i,i+3);
          if(b>207 && r>=g-1 && g>=b-1 && r-b<19)matte++;
        }
        if(matte/(pixels.length/3)<.98)throw Error(view+' shows ink or background through the folded paper');
      }
      await target.bringToFront(); await target.goto(url);
      const stage=target.locator('#stage[data-box-painted=true]'), poster=target.locator('#view-poster');
      const click=async selector=>touch?target.locator(selector).tap():target.locator(selector).click();
      const counts=()=>({
        pages:requests.filter(p=>p.includes('/assets/pages/')).map(p=>p.split('/').at(-1)),
        full:requests.filter(p=>p.endsWith('/posters/ben10-6-poster.jpg')).length,
        posters:requests.filter(p=>p.includes('/assets/posters/')).length,
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
      if(box.pages.length||box.posters)throw Error('Preview art was fetched before the interior opened');
      const leftPage=target.waitForResponse(r=>r.url().endsWith('/page-02.jpg')&&r.ok());
      const rightPage=target.waitForResponse(r=>r.url().endsWith('/page-03.jpg')&&r.ok());
      await Promise.all([leftPage,rightPage,click('#open-interior')]);
      const spread=counts();
      if(spread.pages.sort().join(',')!=='page-02.jpg,page-03.jpg'||spread.posters)throw Error('Unexpected spread requests '+JSON.stringify(spread));
      await target.emulateMedia({reducedMotion:'no-preference'});
      await target.clock.pauseAt(new Date(await target.evaluate(()=>Date.now()+400)));
      const leaves=await Promise.all([sample('left',await leftPage),sample('right',await rightPage)]);
      if(leaves.some(d=>d>22))throw Error('Printed pages 2|3 do not match the spread: '+leaves);
      await checkPaper('seated');
      const fullResponse=target.waitForResponse(r=>r.url().endsWith('/posters/ben10-6-poster.jpg')&&r.ok());
      await poster.dispatchEvent('click');
      await target.locator('#inspection[data-poster=opening]').waitFor();
      await target.clock.runFor(550);
      await checkPaper('across');
      await target.clock.runFor(410);
      if(await target.locator('#inspection').getAttribute('data-poster')!=='open'||await poster.textContent()!=='Put away')throw Error('Poster did not reach its reading pose');
      const difference=await sample('open',await fullResponse);
      if(difference>24)throw Error('Open poster differs from its print by '+difference);
      if(touch)await target.keyboard.press('Escape');else await poster.dispatchEvent('click');
      await target.clock.runFor(380);
      await checkPaper('across');
      await target.clock.runFor(580);
      await checkPaper('seated');
      if(await target.locator('#inspection').getAttribute('data-poster')!=='seated'||!(await poster.evaluate(n=>document.activeElement===n)))throw Error('Poster did not return home with focus');
      await target.clock.resume();
      await target.emulateMedia({reducedMotion:'reduce'});
      await target.locator('body[data-reduced-motion=true]').waitFor();
      await click('#return-button');
      await target.locator('#stage[data-state=open]:not([data-returning=true])').waitFor();
      await select(touch?'A':'E');
      await click('#view-poster');
      await target.locator('#inspection[data-poster=open]').waitFor();
      const rest=await sample('open');
      const rect=await stage.boundingBox(),x=rect.x+rect.width*.5,y=rect.y+rect.height*.5,dx=40;
      if(touch){
        const session=await context.newCDPSession(target);
        try{
          for(const [type,touchPoints] of [['touchStart',[{x,y}]],['touchMove',[{x:x+dx,y}]],['touchEnd',[]]])
            await session.send('Input.dispatchTouchEvent',{type,touchPoints});
        }finally{await session.detach();}
      }else{
        await target.mouse.move(x,y);await target.mouse.down();
        await target.mouse.move(x+dx,y,{steps:4});await target.mouse.up();
      }
      await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
      const tilted=await sample('open',null,dx*.005);
      const columns=Array(24).fill(0);
      for(let i=0;i<rest.length;i++)columns[Math.floor(i/3)%24]+=(tilted[i]-rest[i])/(32*3);
      const sweep=Math.max(...columns)-Math.min(...columns);
      if(sweep<9)throw Error('Dragging produced no moving gloss band: '+sweep);
      await click('#view-poster');
      if(await target.locator('#inspection').getAttribute('data-poster')!=='seated')throw Error('Reduced motion did not stow immediately');
      await click('#return-button');
      await target.locator('#stage[data-state=open]:not([data-returning=true])').waitFor();
      const final=counts();
      if(final.full!==1||final.posters!==1||final.pages.length!==2||errors.length)throw Error(JSON.stringify({counts:final,errors}));
      results.push({width,height,box,spread,final,leaves,difference,sweep});
    }finally{await context.close();}
  }
  return results;
}
