import * as THREE from 'three';
import {compacts} from './comics.js?v=39.5';
import {COMPACT_RETURN_MS, createSpineShelfReturn, startCompactReturn, startCompactPickup, compactUiOpacity, frameCompactBounds, createCompactSceneFade, prioritizeCompactBook, COMPACT_STAND_POSES, interpolateCompactBook, standReturnArc, shouldReturnFromCompactTap} from './compact-return.js?v=1.12';
import {createStageReturnFrames, createPageReturnFrames} from './return-motion.js?v=1.11';
import {createPaperback} from './paperback.js?v=2.4';

// These display studies are created only on request, after the short box paints.
export function openCompactDisplays({box,inline=false,pageRoot=document,onClose}){
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
  const root=new THREE.Group();scene.add(root);let activeScene=scene,separateScene=null;
  const books=compacts.map((data,i)=>{const book=createPaperback(THREE,data);book.group.userData.compactIndex=i;return book;});
  const listeners=new AbortController(), eventOptions={signal:listeners.signal};
  const textures=[];const loader=new THREE.TextureLoader();
  compacts.forEach((data,i)=>['front','back','spine'].forEach(side=>loader.load(data[side],texture=>{if(closed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);books[i].setCover(side,texture);},undefined,error=>console.warn('Paperback photograph unavailable',data[side],error))));
  compacts.forEach((data,i)=>loader.load(data.pageEdge,texture=>{if(closed){texture.dispose();return;}textures.push(texture);books[i].setPageEdge(texture);},undefined,error=>console.warn('Paperback page edge unavailable',data.pageEdge,error)));
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowCtx=shadowCanvas.getContext('2d'),gradient=shadowCtx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.36)');gradient.addColorStop(1,'rgba(0,0,0,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  const materials={wood:new THREE.MeshStandardMaterial({color:0x9a7655,roughness:.83}), dark:new THREE.MeshStandardMaterial({color:0x363f48,roughness:.75}), acrylic:new THREE.MeshStandardMaterial({color:0xb4d3dd,transparent:true,opacity:.30,roughness:.18,metalness:.05}),desk:new THREE.MeshStandardMaterial({color:0x66594e,roughness:.95})};
  const cube=(w,h,d,material,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);root.add(mesh);return mesh;};
  let display='switch',selected=-1,angle='front',inspectYaw=-.5,inspectPitch=-.06,drag=null,frame=0,moveFrame=0,cancelReturn=null,returnFade=null,pickupCleanup=null,uiCleanup=null,returning=false,closed=false,boxClone=null,moving=false;
  let inspectionStarted = 0;
  const title=dialog.querySelector('#compact-title'),note=dialog.querySelector('#compact-note'),options=[...dialog.querySelectorAll('[data-display]')],views=[...dialog.querySelectorAll('[data-view]')],bookButtons=[...dialog.querySelectorAll('[data-book]')],inspectControls=dialog.querySelector('.compact-inspect-controls'),backButton=dialog.querySelector('#compact-return'),closeButton=dialog.querySelector('#compact-close');
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
    while(root.children.length){const child=root.children[0];root.remove(child);if(child===boxClone)continue;child.geometry?.dispose();}
  }
  function showBox(){
    if(!boxClone){boxClone=box.cloneClosedBox();const current=boxClone;
      current.traverse(object=>{if(!object.userData.compactPhotoUrl)return;const material=object.material;loader.load(object.userData.compactPhotoUrl,map=>{if(closed){map.dispose();return;}map.colorSpace=THREE.SRGBColorSpace;material.color.set(0xffffff);material.map=map;material.needsUpdate=true;});});}
    boxClone.position.set(-1.9,0,0);root.add(boxClone);
  }
  function contactShadow(x,y,z,w,d){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),shadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);root.add(mesh);}
  function setBook(i,x,y,z,rx=0,ry=0,rz=0){const b=books[i];b.group.position.set(x,y,z);b.group.rotation.set(rx,ry,rz);root.add(b.group);}
  function frameScene(){
    const mobile=mount.clientWidth<600;camera.fov=mobile?45:34;resize();
    if(selected>=0||display==='switch'){
      root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(selected>=0?books[selected].group:root);
      frameCompactBounds(THREE,camera,bounds,Math.max(1,mount.clientWidth),Math.max(1,mount.clientHeight));
    }else{
      // Keep the original angled view, but centre the box and stand on the
      // canvas and fit them to it, so they are framed well on any screen.
      const direction=new THREE.Vector3((display==='stack'?-1:1)*(mobile?2.2:4.0),(mobile?4.0:4.2)-1.5,mobile?15.5:10.8).normalize();
      root.updateMatrixWorld(true);
      const bounds=new THREE.Box3();
      root.traverse(object=>{
        const material=object.material;
        if(!object.isMesh||!object.visible||material===shadowMaterial)return;
        if(material&&!Array.isArray(material)&&material.transparent&&material.opacity<.6&&object.geometry?.type==='PlaneGeometry')return;
        bounds.expandByObject(object);
      });
      const corners=[];for(let k=0;k<8;k++)corners.push(new THREE.Vector3(k&1?bounds.max.x:bounds.min.x,k&2?bounds.max.y:bounds.min.y,k&4?bounds.max.z:bounds.min.z));
      const target=bounds.getCenter(new THREE.Vector3()),right=new THREE.Vector3(),up=new THREE.Vector3(),point=new THREE.Vector3();
      let distance=bounds.getSize(new THREE.Vector3()).length()*1.5;
      const place=()=>{camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld(true);};
      const extents=()=>{let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const c of corners){point.copy(c).project(camera);x0=Math.min(x0,point.x);x1=Math.max(x1,point.x);y0=Math.min(y0,point.y);y1=Math.max(y1,point.y);}return {x0,x1,y0,y1};};
      for(let pass=0;pass<4;pass++){
        place();let e=extents();
        // Scale the distance so the larger extent fills ~85% of the canvas.
        distance*=Math.max(e.x1-e.x0,e.y1-e.y0)/(2*.85);place();e=extents();
        // Shift the aim so the projected extents are centred.
        const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;
        right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
        target.addScaledVector(right,(e.x0+e.x1)/2*tanH*distance).addScaledVector(up,(e.y0+e.y1)/2*tanV*distance);
      }
      place();
    }
  }
  function build(){
    dialog.querySelector('.compact-header > span').textContent=`0${['shelf','stand','stack','switch'].indexOf(display)+1} / 04`;
    dialog.classList.toggle('compact-inspecting',inline&&selected>=0);
    if(inline)dialog.setAttribute('aria-modal',selected>=0?'true':'false');
    clean();
    if(display==='switch'){
      if(!separateScene){separateScene=new THREE.Scene();separateScene.add(new THREE.HemisphereLight(0xd8e7ff,0x655a48,1.35));const key=light.clone(),edge=rim.clone();separateScene.add(key,edge);}
      activeScene=separateScene;
    }else activeScene=scene;
    activeScene.add(root);
    inspectControls.hidden=selected<0;backButton.hidden=selected<0;closeButton.hidden=!backButton.hidden;bookButtons.forEach(b=>b.hidden=selected>=0);options.forEach(b=>{b.hidden=selected>=0;b.setAttribute('aria-pressed',String(b.dataset.display===display));});
    if(selected>=0){
      title.textContent=compacts[selected].title;
      noteLabel.textContent='Drag to turn';
      views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===angle)));
      setBook(selected,0,0,0,inspectPitch,inspectYaw,0);
      mount.setAttribute('aria-label',`${compacts[selected].title} close-up. Drag to turn, or use the front, back and spine buttons.`);
    }else{
      title.textContent='Compact Comics';noteLabel.textContent=shelfCue();mount.setAttribute('aria-label','Paperback display. Select a book to inspect it.');
      // Shelf, stand and stack layouts are kept for reference; the page uses
      // the Compacts shelf (display 'switch'): both books spine-out, no box.
      if(display!=='switch')showBox();
      if(display==='shelf'){
        cube(1.65,.12,.83,materials.wood,2.13,.75,0);cube(.08,.72,.7,materials.dark,2.23,1.14,0);cube(.10,.56,.10,materials.dark,1.60,.45,-.23);cube(.10,.56,.10,materials.dark,2.70,.45,-.23);contactShadow(2.02,.812,0,1.3,.7);
        setBook(0,1.92,1.93,0,0,Math.PI/2,0);setBook(1,2.12,1.93,0,0,Math.PI/2,0);
      }else if(display==='stand'){
        cube(2.0,.12,1.8,materials.desk,2.05,.17,0);
        const back=cube(1.5,1.9,.06,materials.acrylic,2.06,1.25,-.49);back.rotation.x=-.14;
        cube(1.55,.09,.32,materials.acrylic,2.06,.36,.53);contactShadow(2.05,.232,0,2.1,1.5);
        COMPACT_STAND_POSES.forEach((pose,i)=>setBook(i,...pose));
      }else if(display==='stack'){
        cube(2.5,.12,2.7,materials.desk,2,.16,0);contactShadow(2.05,.222,0,2.0,2.1);
        setBook(0,1.98,.34,0,-Math.PI/2,0,0);setBook(1,2.12,.48,.18,-Math.PI/2,0,.06);
      }else{
        cube(1.55,.12,1.15,materials.wood,0,.75,0);cube(.12,.85,.95,materials.dark,.22,1.18,0);contactShadow(-.05,.812,0,1.1,.8);
        setBook(0,-.18,1.93,0,0,Math.PI/2,0);setBook(1,.08,1.93,0,0,Math.PI/2,0);
      }
    }
    frameScene();
  }
  // Snapshots preserve the departing controls in their screen positions while
  // the destination controls are prepared. They are inert and have no IDs.
  const uiElements=()=>[dialog.querySelector('.compact-header'),dialog.querySelector('.compact-options'),inspectControls,dialog.querySelector('.compact-book-controls'),note].filter(Boolean);
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
  const draw=()=>{if(closed)return;if(!returning){renderer.render(activeScene,camera);}frame=requestAnimationFrame(draw);};
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
    dialog.classList.toggle('compact-inspecting',inline);if(inline)dialog.setAttribute('aria-modal','true');
    inspectControls.hidden=false;backButton.hidden=false;closeButton.hidden=!backButton.hidden;bookButtons.forEach(b=>b.hidden=true);options.forEach(b=>b.hidden=true);
    title.textContent=compacts[i].title;noteLabel.textContent='Drag to turn';
    views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='front')));
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
        interpolateCompactBook(book,fromPosition,toPosition,fromRotation,toRotation,travel,{lift,standArc:display==='stand'&&i===0?-1:0});book.scale.copy(fromScale);
        camera.position.lerpVectors(fromCamera,targetCamera.position,eased);camera.quaternion.slerpQuaternions(fromCameraRotation,targetCamera.quaternion,eased);
        camera.fov=fromFov+(toFov-fromFov)*eased;camera.aspect=fromAspect+(toAspect-fromAspect)*eased;camera.updateProjectionMatrix();
        const time=eased*850;canvasAnimation.currentTime=time;if(background)background.currentTime=time;ui.set(progress);
      },
      onComplete(){if(closed)return;pickupCleanup();cancelReturn=null;moving=false;mount.dataset.picking='false';build();views[0].focus();}
    });
  };
  options.forEach(button=>button.addEventListener('click',()=>{if(moving)return;display=button.dataset.display;selected=-1;build();},eventOptions));
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
    const shelfPath=display==='switch'
      ?createSpineShelfReturn(books[returningIndex],books[1-returningIndex],fromPosition,toPosition,fromRotation,toRotation)
      :null;
    const depth=shelfPath?null:prioritizeCompactBook(book);
    const cameraOffset=new THREE.Vector3();
    const frontRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.06,-.5,0));
    const standArc=display==='stand'?standReturnArc(returningIndex,fromRotation,frontRotation):0;
    returnFade=createCompactSceneFade(root,book);
    moving=true;returning=true;mount.dataset.returning='true';
    const paint=(t,progress)=>{
      layout?.set(progress);ui.set(progress);depth?.set(t<.95);returnFade.set(t);
      if(shelfPath)shelfPath(t);
      else interpolateCompactBook(book,fromPosition,toPosition,fromRotation,toRotation,t,{standArc});
      book.scale.lerpVectors(fromScale,toScale,t);
      camera.position.lerpVectors(fromCamera,toCamera,t);
      if(shelfPath){
        // Follow the clearance move without zooming into the cover as it
        // comes forward. The correction is zero at both endpoints.
        cameraOffset.lerpVectors(fromPosition,toPosition,t).negate().add(book.position);
        camera.position.add(cameraOffset);
      }
      camera.quaternion.slerpQuaternions(fromCameraRotation,toCameraRotation,t);
      camera.fov=fromFov+(toFov-fromFov)*t;
      resize();
      renderer.render(activeScene,camera);
    };
    pickupCleanup=()=>{depth?.dispose();pickupCleanup=null;};
    cancelReturn=startCompactReturn({
      onFrame:paint,
      onComplete(){
        if(closed)return;
        pickupCleanup?.();uiCleanup?.();returnFade.dispose();returnFade=null;cancelReturn=null;returning=false;moving=false;mount.dataset.returning='false';build();focus();
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
    cancelAnimationFrame(moveFrame);
    ro.disconnect();
    clean();
    if (boxClone) {
      boxClone.traverse(object => {
        if (object.userData.compactPreviewOwned) {
          object.geometry.dispose();
          object.material.map?.dispose();
          object.material.dispose();
        }
        if (object.userData.compactPreviewOwnedMaterial) object.material.dispose();
      });
      boxClone = null;
    }
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
