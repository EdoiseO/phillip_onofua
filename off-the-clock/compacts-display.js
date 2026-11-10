import * as THREE from 'three';
import {compacts} from './comics.js?v=39.4';
import {startCompactReturn} from './compact-return.js?v=1.0';
import {createPaperback} from './paperback.js?v=2.2';

// These display studies are created only on request, after the short box paints.
export function openCompactDisplays({box,inline=false}){
  const dialog=document.querySelector('#compact-dialog'), mount=document.querySelector('#compact-canvas');
  mount.dataset.returning='false';
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
  let display=inline?'switch':'shelf',selected=-1,angle='front',inspectYaw=-.5,inspectPitch=-.06,drag=null,frame=0,moveFrame=0,cancelReturn=null,returning=false,closed=false,boxClone=null,moving=false;
  const title=document.querySelector('#compact-title'),note=document.querySelector('#compact-note'),options=[...dialog.querySelectorAll('[data-display]')],views=[...dialog.querySelectorAll('[data-view]')],bookButtons=[...dialog.querySelectorAll('[data-book]')],inspectControls=dialog.querySelector('.compact-inspect-controls'),backButton=dialog.querySelector('#compact-return');
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const resize=()=>{const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(()=>{if(!returning)frameScene();});ro.observe(mount);
  function clean(){
    books.forEach(b=>b.group.removeFromParent());
    while(root.children.length){const child=root.children[0];root.remove(child);if(child===boxClone)continue;child.geometry?.dispose();}
  }
  function showBox(){
    if(!boxClone){boxClone=box.cloneClosedBox();const current=boxClone;
      current.traverse(object=>{if(!object.userData.compactPhotoUrl)return;loader.load(object.userData.compactPhotoUrl,map=>{if(closed){map.dispose();return;}map.colorSpace=THREE.SRGBColorSpace;object.material.color.set(0xffffff);object.material.map=map;object.material.needsUpdate=true;});});}
    boxClone.position.set(-1.9,0,0);root.add(boxClone);
  }
  function contactShadow(x,y,z,w,d){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),shadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);root.add(mesh);}
  function setBook(i,x,y,z,rx=0,ry=0,rz=0){const b=books[i];b.group.position.set(x,y,z);b.group.rotation.set(rx,ry,rz);root.add(b.group);}
  function frameScene(){
    const mobile=mount.clientWidth<600;camera.fov=mobile?45:34;resize();
    if(selected>=0||display==='switch'){
      root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(selected>=0?books[selected].group:root);
      const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;
      const distance=Math.max(size.y/(2*tanV),size.x/(2*tanH))*1.14;
      camera.position.set(center.x,center.y,bounds.max.z+distance);camera.lookAt(center);
    }else{camera.position.set((display==='stack'?-1:1)*(mobile?2.2:4.0),mobile?4.0:4.2,mobile?15.5:10.8);camera.lookAt(0,1.5,0);}
  }
  function build({preserveInspection=false}={}){
    if(!preserveInspection)dialog.querySelector('.compact-header > span').textContent=`0${['shelf','stand','stack','switch'].indexOf(display)+1} / 04`;
    if(!preserveInspection){
      dialog.classList.toggle('compact-inspecting',inline&&selected>=0);
      if(inline)dialog.setAttribute('aria-modal',selected>=0?'true':'false');
    }
    clean();
    if(display==='switch'){
      if(!separateScene){separateScene=new THREE.Scene();separateScene.add(new THREE.HemisphereLight(0xd8e7ff,0x655a48,1.35));const key=light.clone(),edge=rim.clone();separateScene.add(key,edge);}
      activeScene=separateScene;
    }else activeScene=scene;
    activeScene.add(root);
    if(!preserveInspection){inspectControls.hidden=selected<0;backButton.hidden=selected<0;bookButtons.forEach(b=>b.hidden=selected>=0);options.forEach(b=>{b.hidden=selected>=0;b.setAttribute('aria-pressed',String(b.dataset.display===display));});}
    if(selected>=0){
      title.textContent=compacts[selected].title;
      note.textContent=`${compacts[selected][`${angle}ImageNote`]} · Drag to turn`;
      views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===angle)));
      setBook(selected,0,0,0,inspectPitch,inspectYaw,0);
      mount.setAttribute('aria-label',`${compacts[selected].title} close-up. Drag to turn, or use the front, back and spine buttons.`);
    }else{
      if(!preserveInspection){title.textContent='Compact Comics displays';note.textContent='Choose a book to take a closer look.';mount.setAttribute('aria-label','Paperback display. Select a book to inspect it.');}
      if(display!=='switch')showBox();
      if(display==='shelf'){
        cube(1.65,.12,.83,materials.wood,2.13,.75,0);cube(.08,.72,.7,materials.dark,2.23,1.14,0);cube(.10,.56,.10,materials.dark,1.60,.45,-.23);cube(.10,.56,.10,materials.dark,2.70,.45,-.23);contactShadow(2.02,.812,0,1.3,.7);
        setBook(0,1.92,1.93,0,0,Math.PI/2,0);setBook(1,2.12,1.93,0,0,Math.PI/2,0);
      }else if(display==='stand'){
        cube(2.0,.12,1.8,materials.desk,2.05,.17,0);
        const back=cube(1.5,1.9,.06,materials.acrylic,2.06,1.25,-.13);back.rotation.x=-.14;
        cube(1.55,.09,.32,materials.acrylic,2.06,.36,.53);contactShadow(2.05,.232,0,2.1,1.5);
        setBook(0,2.53,1.49,-.30,-.14,0,-.07);setBook(1,1.68,1.49,.02,-.14,0,.05);
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
  const draw=()=>{if(closed)return;renderer.render(activeScene,camera);frame=requestAnimationFrame(draw);};
  const select=i=>{
    if(moving||selected>=0)return;
    const finish=()=>{moving=false;selected=i;angle='front';inspectYaw=-.5;inspectPitch=-.06;build();views[0].focus();};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.reducedMotion==='true'){finish();return;}
    moving=true;const book=books[i].group,start=book.position.clone(),at=performance.now();
    const move=now=>{if(closed)return;const t=Math.min(1,(now-at)/350),ease=1-Math.pow(1-t,3);book.position.copy(start);if(display==='stack')book.position.y+=.35*ease;else book.position.z+=.45*ease;if(t<1)moveFrame=requestAnimationFrame(move);else finish();};
    moveFrame=requestAnimationFrame(move);
  };
  options.forEach(button=>button.addEventListener('click',()=>{cancelAnimationFrame(moveFrame);moving=false;display=button.dataset.display;selected=-1;build();},eventOptions));
  views.forEach(button=>button.addEventListener('click',()=>{if(moving)return;angle=button.dataset.view;inspectYaw=angle==='back'?Math.PI-.12:angle==='spine'?Math.PI/2:-.5;inspectPitch=angle==='front'?-.06:0;build();},eventOptions));
  bookButtons.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.book)),eventOptions));
  const returnDisplay=()=>{
    if(moving||selected<0)return;
    const returningIndex=selected, book=books[returningIndex].group;
    const focus=()=>{(inline?bookButtons[returningIndex]:options.find(x=>x.dataset.display===display)).focus();};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.reducedMotion==='true'){
      selected=-1;build();focus();return;
    }
    // Keep the inspection layout visible while preparing the destination.
    // Interpolate the actual close-up pose and camera to the shelf/stand/stack
    // instead of snapping to a rebuilt scene before the return starts.
    const fromPosition=book.position.clone(),fromRotation=book.quaternion.clone(),fromScale=book.scale.clone();
    const fromCamera=camera.position.clone(),fromCameraRotation=camera.quaternion.clone(),fromFov=camera.fov;
    selected=-1;build({preserveInspection:true});
    const toPosition=book.position.clone(),toRotation=book.quaternion.clone(),toScale=book.scale.clone();
    const toCamera=camera.position.clone(),toCameraRotation=camera.quaternion.clone(),toFov=camera.fov;
    book.position.copy(fromPosition);book.quaternion.copy(fromRotation);book.scale.copy(fromScale);
    camera.position.copy(fromCamera);camera.quaternion.copy(fromCameraRotation);camera.fov=fromFov;camera.updateProjectionMatrix();
    moving=true;returning=true;mount.dataset.returning='true';
    cancelReturn=startCompactReturn({
      onFrame(t){
        book.position.lerpVectors(fromPosition,toPosition,t);book.quaternion.slerpQuaternions(fromRotation,toRotation,t);book.scale.lerpVectors(fromScale,toScale,t);
        camera.position.lerpVectors(fromCamera,toCamera,t);camera.quaternion.slerpQuaternions(fromCameraRotation,toCameraRotation,t);camera.fov=fromFov+(toFov-fromFov)*t;camera.updateProjectionMatrix();
      },
      onComplete(){
        if(closed)return;
        cancelReturn=null;returning=false;moving=false;mount.dataset.returning='false';build();focus();
      }
    });
  };
  backButton.addEventListener('click',returnDisplay,eventOptions);
  mount.addEventListener('pointerdown',event=>{if(moving||selected<0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};mount.setPointerCapture(event.pointerId);},eventOptions);
  mount.addEventListener('pointermove',event=>{if(moving||selected<0||!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.x=event.clientX;drag.y=event.clientY;inspectYaw+=dx*.012;inspectPitch=THREE.MathUtils.clamp(inspectPitch+dy*.01,-.7,.7);books[selected].group.rotation.set(inspectPitch,inspectYaw,0);frameScene();},eventOptions);
  mount.addEventListener('pointercancel',()=>{drag=null;},eventOptions);
  mount.addEventListener('pointerup',event=>{if(selected>=0){drag=null;return;}const r=mount.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(books.map(b=>b.group),true);let object=hits[0]?.object;while(object&&object.userData.compactIndex===undefined)object=object.parent;if(object)select(object.userData.compactIndex);},eventOptions);
  const close=()=>{dialog.close();};dialog.querySelector('#compact-close').addEventListener('click',close,eventOptions);
  dialog.addEventListener('keydown',event=>{if(moving){if(event.key!=='Tab'&&event.key!=='Escape')event.preventDefault();return;}if(inline&&selected>=0&&event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not([hidden]):not(:disabled)')].filter(el=>el.getClientRects().length);if(focusable.length&&((event.shiftKey&&document.activeElement===focusable[0])||(!event.shiftKey&&document.activeElement===focusable.at(-1)))){event.preventDefault();(event.shiftKey?focusable.at(-1):focusable[0]).focus();}}else if(selected>=0&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const order=['front','spine','back'],i=order.indexOf(angle);angle=order[(i+(event.key==='ArrowRight'?1:2))%3];inspectYaw=angle==='back'?Math.PI-.12:angle==='spine'?Math.PI/2:-.5;inspectPitch=angle==='front'?-.06:0;build();}else if(event.key==='Escape'&&selected>=0){event.preventDefault();returnDisplay();}},eventOptions);
  dialog.addEventListener('close',()=>{closed=true;listeners.abort();cancelReturn?.();mount.dataset.returning='false';cancelAnimationFrame(frame);cancelAnimationFrame(moveFrame);ro.disconnect();clean();if(boxClone){boxClone.traverse(o=>{if(o.userData.compactPreviewOwned){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}if(o.userData.compactPreviewOwnedMaterial)o.material.dispose();});boxClone=null;}books.forEach(b=>b.dispose());textures.forEach(t=>t.dispose());shadowTexture.dispose();shadowMaterial.dispose();Object.values(materials).forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();document.querySelector('#compact-launch').disabled=false;document.querySelector('#collection-compacts').disabled=false;if(inline){document.querySelector('.viewer').classList.remove('compact-active');document.body.append(dialog);delete dialog.dataset.inline;dialog.classList.remove('compact-inspecting');dialog.removeAttribute('aria-modal');document.querySelector('#collection-comics').setAttribute('aria-pressed','true');document.querySelector('#collection-compacts').setAttribute('aria-pressed','false');document.querySelector('#collection-comics').focus();}else document.querySelector('#compact-launch').focus();},{once:true});
  if(inline){dialog.dataset.inline='';document.querySelector('.viewer').append(dialog);document.querySelector('.viewer').classList.add('compact-active');document.querySelector('#collection-comics').setAttribute('aria-pressed','false');document.querySelector('#collection-compacts').setAttribute('aria-pressed','true');}
  build();if(inline)dialog.show();else dialog.showModal();frameScene();draw();
}
