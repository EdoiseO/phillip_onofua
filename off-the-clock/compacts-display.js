import * as THREE from 'three';
import {compacts} from './comics.js?v=39.5';
import {COMPACT_RETURN_MS, createSpineShelfReturn, startCompactReturn, startCompactPickup, compactUiOpacity, frameCompactBounds, createCompactSceneFade, prioritizeCompactBook, interpolateCompactBook, shouldReturnFromCompactTap} from './compact-return.js?v=1.13';
import {createStageReturnFrames, createPageReturnFrames} from './return-motion.js?v=1.11';
import {createPaperback} from './paperback.js?v=2.4';

// The Compacts shelf is created only on request, after the short box paints.
export function openCompactDisplays({inline=false,pageRoot=document,onClose}){
  const dialog=pageRoot.querySelector('#compact-dialog'), mount=dialog.querySelector('#compact-canvas');
  const comicsButton=pageRoot.querySelector('#collection-comics');
  const experience=pageRoot.querySelector('#experience');
  const compactsButton=pageRoot.querySelector('#collection-compacts');
  mount.dataset.returning='false';mount.dataset.picking='false';
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.setClearColor(0x0b0e13,0);renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(34,1,.1,80);
  scene.add(new THREE.HemisphereLight(0xd8e7ff,0x655a48,1.35));
  const light=new THREE.DirectionalLight(0xfff5e4,2.4);light.position.set(-4,8,6);scene.add(light);
  const rim=new THREE.DirectionalLight(0xb6d3ff,1.05);rim.position.set(4,5,-4);scene.add(rim);
  const root=new THREE.Group();scene.add(root);
  const books=compacts.map((data,i)=>{const book=createPaperback(THREE,data);book.group.userData.compactIndex=i;return book;});
  const listeners=new AbortController(), eventOptions={signal:listeners.signal};
  const textures=[];const loader=new THREE.TextureLoader();
  compacts.forEach((data,i)=>['front','back','spine'].forEach(side=>loader.load(data[side],texture=>{if(closed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);books[i].setCover(side,texture);},undefined,error=>console.warn('Paperback photograph unavailable',data[side],error))));
  compacts.forEach((data,i)=>loader.load(data.pageEdge,texture=>{if(closed){texture.dispose();return;}textures.push(texture);books[i].setPageEdge(texture);},undefined,error=>console.warn('Paperback page edge unavailable',data.pageEdge,error)));
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowCtx=shadowCanvas.getContext('2d'),gradient=shadowCtx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.36)');gradient.addColorStop(1,'rgba(0,0,0,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  const materials={wood:new THREE.MeshStandardMaterial({color:0x9a7655,roughness:.83}), dark:new THREE.MeshStandardMaterial({color:0x363f48,roughness:.75})};
  const cube=(w,h,d,material,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);root.add(mesh);return mesh;};
  let selected=-1,angle='front',inspectYaw=-.5,inspectPitch=-.06,drag=null,frame=0,cancelReturn=null,returnFade=null,pickupCleanup=null,uiCleanup=null,returning=false,closed=false,moving=false;
  let inspectionStarted = 0;
  const header=dialog.querySelector('.compact-header');
  const title=header.querySelector('#compact-title'),note=dialog.querySelector('#compact-note'),views=[...dialog.querySelectorAll('[data-view]')],bookButtons=[...dialog.querySelectorAll('[data-book]')],inspectControls=dialog.querySelector('.compact-inspect-controls'),backButton=dialog.querySelector('#compact-return'),closeButton=dialog.querySelector('#compact-close');
  const noteLabel = note.querySelector('#compact-note-label');
  const shelfCue = () => `${matchMedia('(pointer:coarse)').matches ? 'Tap' : 'Click'} a book to take a closer look`;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let renderWidth=0,renderHeight=0;
  function resizeRenderer(width,height){
    if(width===renderWidth&&height===renderHeight)return;
    renderer.setSize(width,height,false);renderWidth=width;renderHeight=height;
  }
  const resize=()=>{const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);resizeRenderer(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(()=>{if(!moving&&!returning)frameScene();});ro.observe(mount);
  function clean(){
    books.forEach(b=>b.group.removeFromParent());
    while(root.children.length){const child=root.children[0];root.remove(child);child.geometry?.dispose();}
  }
  function contactShadow(x,y,z,w,d){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),shadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);root.add(mesh);}
  function setBook(i,x,y,z,rx=0,ry=0,rz=0){const b=books[i];b.group.position.set(x,y,z);b.group.rotation.set(rx,ry,rz);root.add(b.group);}
  function frameScene(){
    const mobile=mount.clientWidth<600;camera.fov=mobile?45:34;resize();
    root.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(selected>=0?books[selected].group:root);
    frameCompactBounds(THREE,camera,bounds,Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight));
  }
  function updateDisplayUI(){
    const inspecting=selected>=0;
    const book=inspecting?compacts[selected]:null;
    dialog.classList.toggle('compact-inspecting',inline&&inspecting);
    if(inline)dialog.setAttribute('aria-modal',String(inspecting));
    header.hidden=inline&&!inspecting;
    inspectControls.hidden=!inspecting;
    backButton.hidden=!inspecting;
    closeButton.hidden=inspecting;
    bookButtons.forEach(button=>{button.hidden=inspecting;});
    if(book){
      title.textContent=book.title;
      dialog.setAttribute('aria-labelledby',title.id);
      dialog.removeAttribute('aria-label');
      mount.setAttribute('aria-label',`${book.title} close-up. Drag to turn, or use the front, back and spine buttons.`);
      noteLabel.textContent='Drag to turn';
      views.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===angle)));
    }else{
      dialog.setAttribute('aria-label','Compact Comics');
      dialog.removeAttribute('aria-labelledby');
      title.textContent='';
      mount.setAttribute('aria-label','Compact Comics. Select a book to inspect it.');
      noteLabel.textContent=shelfCue();
    }
  }
  function build(){
    updateDisplayUI();
    clean();
    if(selected>=0){
      setBook(selected,0,0,0,inspectPitch,inspectYaw,0);
    }else{
      cube(1.55,.12,1.15,materials.wood,0,.75,0);cube(.12,.85,.95,materials.dark,.22,1.18,0);contactShadow(-.05,.812,0,1.1,.8);
      setBook(0,-.18,1.93,0,0,Math.PI/2,0);setBook(1,.08,1.93,0,0,Math.PI/2,0);
    }
    frameScene();
  }
  // Snapshots preserve the departing controls in their screen positions while
  // the destination controls are prepared. They are inert and have no IDs.
  const uiElements=()=>[header,inspectControls,dialog.querySelector('.compact-book-controls'),note]
    .filter(element=>element&&!element.hidden);
  function snapshotUI({embedded=false}={}){
    const snapshots=[];
    uiElements().forEach(element=>{
      const r=element.getBoundingClientRect();if(!r.width||!r.height)return;
      const copy=element.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));copy.setAttribute('aria-hidden','true');copy.inert=true;dialog.append(copy);
      const animation=copy.animate([{position:'fixed',left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`,boxSizing:'border-box',margin:'0',pointerEvents:'none',opacity:0},{position:'fixed',left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`,boxSizing:'border-box',margin:'0',pointerEvents:'none',opacity:1}],{duration:1000,fill:'both'});animation.pause();
      const fixedStyles=[];
      if(embedded&&element.matches('.compact-header')){
        const headerStyles=[
          [element,copy,['display','padding','gridTemplateColumns']],
          [element.querySelector('h2'),copy.querySelector('h2'),['fontSize']],
          ...Array.from(element.querySelectorAll('button'),(button,index)=>[button,copy.querySelectorAll('button')[index],['display']]),
        ];
        for(const [source,target,properties] of headerStyles){
          const computed=getComputedStyle(source),frame={};properties.forEach(property=>frame[property]=computed[property]);
          const fixed=target.animate([frame,frame],{duration:1000,fill:'both'});fixed.pause();fixed.currentTime=0;fixedStyles.push(fixed);
        }
      }
      snapshots.push({copy,animation,fixedStyles});
    });
    return snapshots;
  }
  function startUISwap(outgoing){
    const incoming=uiElements().map(element=>{const animation=element.animate([{opacity:0},{opacity:1}],{duration:1000,fill:'both'});animation.pause();animation.currentTime=0;return animation;});
    const set=progress=>{const opacity=compactUiOpacity(progress);outgoing.forEach(({animation})=>animation.currentTime=opacity.outgoing*1000);incoming.forEach(animation=>animation.currentTime=opacity.incoming*1000);};
    set(0);
    return {set,dispose(){incoming.forEach(animation=>animation.cancel());outgoing.forEach(({copy,animation,fixedStyles})=>{animation.cancel();fixedStyles.forEach(a=>a.cancel());copy.remove();});}};
  }
  function animateBackToPage(from){
    const to=mount.getBoundingClientRect();
    const placeholder=document.createElement('div');placeholder.className=mount.className;placeholder.setAttribute('aria-hidden','true');mount.before(placeholder);
    const stageAnimation=mount.animate(createStageReturnFrames(from,to),{duration:COMPACT_RETURN_MS,fill:'both'});
    const pageElements=Array.from(pageRoot.querySelectorAll('.portfolio-header-wrap, .story, .footer'),element=>{
      const inert=element.inert;element.inert=true;
      return {element,inert,animation:element.animate(createPageReturnFrames(),{duration:COMPACT_RETURN_MS,fill:'both'})};
    });
    const animations=[stageAnimation,...pageElements.map(({animation})=>animation)];
    animations.forEach(animation=>{animation.pause();animation.currentTime=0;});
    return {
      set(progress){animations.forEach(animation=>animation.currentTime=progress*COMPACT_RETURN_MS);},
      dispose(){
        animations.forEach(animation=>animation.cancel());
        placeholder.remove();
        pageElements.forEach(({element,inert})=>{element.inert=inert;});
      },
    };
  }
  const draw=()=>{if(closed)return;if(!returning){renderer.render(scene,camera);}frame=requestAnimationFrame(draw);};
  const select=i=>{
    if(moving||selected>=0)return;
    inspectionStarted = performance.now();
    const finishInstant=()=>{selected=i;angle='front';inspectYaw=-.5;inspectPitch=-.06;build();views[0].focus();};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.reducedMotion==='true'){finishInstant();return;}
    moving=true;mount.dataset.picking='true';
    const book=books[i].group,fromPosition=book.position.clone(),fromRotation=book.quaternion.clone(),fromScale=book.scale.clone();
    const fromCamera=camera.position.clone(),fromCameraRotation=camera.quaternion.clone(),fromFov=camera.fov,fromAspect=camera.aspect;
    const oldCanvas=renderer.domElement.getBoundingClientRect();
    const snapshots=snapshotUI({embedded:inline});
    selected=i;angle='front';inspectYaw=-.5;inspectPitch=-.06;
    updateDisplayUI();
    const ui=startUISwap(snapshots);uiCleanup=()=>{ui.dispose();uiCleanup=null;};
    let background=null;
    if(inline){background=dialog.animate([{backgroundColor:'rgba(11,14,19,0)'},{backgroundColor:'#0b0e13'}],{duration:850,fill:'both'});background.pause();background.currentTime=0;}
    // Compute the exact pose and framing build() will use without displaying
    // a rebuilt scene. The renderer takes the final layout before interpolation.
    book.position.set(0,0,0);book.rotation.set(inspectPitch,inspectYaw,0);root.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(book);
    const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);
    const targetCamera=camera.clone();frameCompactBounds(THREE,targetCamera,bounds,width,height);
    const toAspect=targetCamera.aspect,toFov=targetCamera.fov;
    const toPosition=book.position.clone(),toRotation=book.quaternion.clone();book.position.copy(fromPosition);book.quaternion.copy(fromRotation);book.scale.copy(fromScale);
    resizeRenderer(width,height);
    const newCanvas=renderer.domElement.getBoundingClientRect(),dx=oldCanvas.left-newCanvas.left,dy=oldCanvas.top-newCanvas.top,sx=oldCanvas.width/newCanvas.width,sy=oldCanvas.height/newCanvas.height;
    const canvasAnimation=renderer.domElement.animate([{transformOrigin:'top left',transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},{transformOrigin:'top left',transform:'translate(0,0) scale(1,1)'}],{duration:850,fill:'both'});canvasAnimation.pause();
    const restoreBookDepth=prioritizeCompactBook(book);
    returnFade=createCompactSceneFade(root,book);returnFade.set(1);
    pickupCleanup=()=>{restoreBookDepth.dispose();canvasAnimation.cancel();background?.cancel();uiCleanup?.();returnFade?.dispose();returnFade=null;pickupCleanup=null;};
    cancelReturn=startCompactPickup({
      onFrame({eased,travel,lift},progress){
        restoreBookDepth.set(eased>.05);returnFade.set(1-eased);
        interpolateCompactBook(book,fromPosition,toPosition,fromRotation,toRotation,travel,{lift});book.scale.copy(fromScale);
        camera.position.lerpVectors(fromCamera,targetCamera.position,eased);camera.quaternion.slerpQuaternions(fromCameraRotation,targetCamera.quaternion,eased);
        camera.fov=fromFov+(toFov-fromFov)*eased;camera.aspect=fromAspect+(toAspect-fromAspect)*eased;camera.updateProjectionMatrix();
        const time=eased*850;canvasAnimation.currentTime=time;if(background)background.currentTime=time;ui.set(progress);
      },
      onComplete(){if(closed)return;pickupCleanup();cancelReturn=null;moving=false;mount.dataset.picking='false';build();views[0].focus();}
    });
  };
  views.forEach(button=>button.addEventListener('click',()=>{if(moving)return;angle=button.dataset.view;inspectYaw=angle==='back'?Math.PI-.12:angle==='spine'?Math.PI/2:-.5;inspectPitch=angle==='front'?-.06:0;build();},eventOptions));
  bookButtons.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.book)),eventOptions));
  const returnDisplay=(pointerExit=false)=>{
    if(moving||selected<0)return;
    drag = null;
    const returningIndex=selected, book=books[returningIndex].group;
    // Keep the reading order near the display. Hidden book buttons reveal
    // themselves only when reached with the keyboard.
    const focus=()=>{(inline?(pointerExit?experience:compactsButton):mount).focus({preventScroll:true});};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.reducedMotion==='true'){
      selected=-1;build();focus();return;
    }
    const fromRect=mount.getBoundingClientRect();
    const fromPosition=book.position.clone(),fromRotation=book.quaternion.clone(),fromScale=book.scale.clone();
    const fromCamera=camera.position.clone(),fromCameraRotation=camera.quaternion.clone(),fromFov=camera.fov;
    const snapshots=snapshotUI({embedded:inline});
    // Put the destination back into normal flow so its final framing and
    // controls can be measured before the old canvas starts moving.
    selected=-1;build();
    const toPosition=book.position.clone(),toRotation=book.quaternion.clone(),toScale=book.scale.clone();
    const toCamera=camera.position.clone(),toCameraRotation=camera.quaternion.clone(),toFov=camera.fov;
    const layout=inline?animateBackToPage(fromRect):null;
    const ui=startUISwap(snapshots);
    uiCleanup=()=>{ui.dispose();layout?.dispose();uiCleanup=null;};
    const shelfPath=createSpineShelfReturn(books[returningIndex],books[1-returningIndex],fromPosition,toPosition,fromRotation,toRotation);
    const cameraOffset=new THREE.Vector3();
    returnFade=createCompactSceneFade(root,book);
    moving=true;returning=true;mount.dataset.returning='true';
    const paint=(t,progress)=>{
      layout?.set(progress);ui.set(progress);returnFade.set(t);
      shelfPath(t);
      book.scale.lerpVectors(fromScale,toScale,t);
      camera.position.lerpVectors(fromCamera,toCamera,t);
      // Follow the clearance move without zooming into the cover as it
      // comes forward. The correction is zero at both endpoints.
      cameraOffset.lerpVectors(fromPosition,toPosition,t).negate().add(book.position);
      camera.position.add(cameraOffset);
      camera.quaternion.slerpQuaternions(fromCameraRotation,toCameraRotation,t);
      camera.fov=fromFov+(toFov-fromFov)*t;
      resize();
      renderer.render(scene,camera);
    };
    cancelReturn=startCompactReturn({
      onFrame:paint,
      onComplete(){
        if(closed)return;
        uiCleanup?.();returnFade.dispose();returnFade=null;cancelReturn=null;returning=false;moving=false;mount.dataset.returning='false';build();focus();
      }
    });
    paint(0,0);
  };
  backButton.addEventListener('click',event=>returnDisplay(event.detail>0),eventOptions);
  function raycastBooks(event, groups) {
    const bounds = mount.getBoundingClientRect();
    pointer.set((event.clientX-bounds.left)/bounds.width*2-1, -(event.clientY-bounds.top)/bounds.height*2+1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(groups, true);
  }
  function hitsSelectedBook(event) {
    // The crease lines have a broad raycast tolerance that reaches past the cover.
    return raycastBooks(event, [books[selected].group]).some(({object}) => object.isMesh);
  }
  mount.addEventListener('pointerdown', event => {
    if (moving || returning || selected < 0 || drag || !event.isPrimary || event.button !== 0) return;
    drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0,
      startedOnBook: hitsSelectedBook(event),
    };
    mount.setPointerCapture(event.pointerId);
  }, eventOptions);
  mount.addEventListener('pointermove', event => {
    if (moving || returning || selected < 0 || drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.distance += Math.abs(dx) + Math.abs(dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    inspectYaw += dx * .012;
    inspectPitch = THREE.MathUtils.clamp(inspectPitch + dy * .01, -.7, .7);
    books[selected].group.rotation.set(inspectPitch, inspectYaw, 0);
    frameScene();
  }, eventOptions);
  function cancelDrag(event) {
    if (drag?.id === event.pointerId) drag = null;
  }
  mount.addEventListener('pointercancel', cancelDrag, eventOptions);
  mount.addEventListener('lostpointercapture', cancelDrag, eventOptions);
  mount.addEventListener('pointerup', event => {
    if (moving || returning) return;
    if (selected >= 0) {
      if (drag?.id !== event.pointerId) return;
      const {startedOnBook, x, y, distance} = drag;
      drag = null;
      const endedOnBook = hitsSelectedBook(event);
      if (shouldReturnFromCompactTap({
        startedOnBook, endedOnBook,
        distance: distance + Math.abs(event.clientX - x) + Math.abs(event.clientY - y),
        elapsed: performance.now() - inspectionStarted,
      })) returnDisplay(true);
      return;
    }
    let object = raycastBooks(event, books.map(book => book.group))[0]?.object;
    while (object && object.userData.compactIndex === undefined) object = object.parent;
    if (object) select(object.userData.compactIndex);
  }, eventOptions);
  const close=()=>{if(onClose)onClose();else dialog.close();};dialog.querySelector('#compact-close').addEventListener('click',close,eventOptions);
  dialog.addEventListener('keydown',event=>{if(moving){if(event.key!=='Tab'&&event.key!=='Escape')event.preventDefault();return;}if(inline&&selected>=0&&event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not([hidden]):not(:disabled)')].filter(el=>el.getClientRects().length);if(focusable.length&&((event.shiftKey&&document.activeElement===focusable[0])||(!event.shiftKey&&document.activeElement===focusable.at(-1)))){event.preventDefault();(event.shiftKey?focusable.at(-1):focusable[0]).focus();}}else if(selected>=0&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const order=['front','spine','back'],i=order.indexOf(angle);angle=order[(i+(event.key==='ArrowRight'?1:2))%3];inspectYaw=angle==='back'?Math.PI-.12:angle==='spine'?Math.PI/2:-.5;inspectPitch=angle==='front'?-.06:0;build();}else if(event.key==='Escape'&&selected>=0){event.preventDefault();returnDisplay();}},eventOptions);
  function dispose({ restoreFocus = false } = {}) {
    if (closed) return;
    closed = true;
    listeners.abort();
    if (dialog.open) dialog.close();
    cancelReturn?.();
    pickupCleanup?.();
    uiCleanup?.();
    returnFade?.dispose();
    mount.dataset.picking = 'false';
    mount.dataset.returning = 'false';
    cancelAnimationFrame(frame);
    ro.disconnect();
    clean();
    books.forEach(book => book.dispose());
    textures.forEach(texture => texture.dispose());
    shadowTexture.dispose();
    shadowMaterial.dispose();
    Object.values(materials).forEach(material => material.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    compactsButton.disabled = false;
    if (inline) {
      delete dialog.dataset.inline;
      dialog.classList.remove('compact-inspecting');
      dialog.removeAttribute('aria-modal');
    }
    if (restoreFocus) (inline ? comicsButton : compactsButton).focus();
  }
  dialog.addEventListener('close', () => {
    if(onClose)onClose();
    else dispose({restoreFocus:true});
  }, eventOptions);
  if(inline)dialog.dataset.inline='';
  build();if(inline)dialog.show();else dialog.showModal();frameScene();draw();
  return { dispose };
}
