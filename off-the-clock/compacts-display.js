import * as THREE from 'three';
import {compacts} from './comics.js?v=39.0';
import {createPaperback} from './paperback.js?v=1.0';

// These display studies are created only on request, after the short box paints.
export function openCompactDisplays({box,inline=false}){
  const dialog=document.querySelector('#compact-dialog'), mount=document.querySelector('#compact-canvas');
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
  const materials={wood:new THREE.MeshStandardMaterial({color:0x9a7655,roughness:.83}), dark:new THREE.MeshStandardMaterial({color:0x363f48,roughness:.75}), acrylic:new THREE.MeshStandardMaterial({color:0xb4d3dd,transparent:true,opacity:.30,roughness:.18,metalness:.05}),desk:new THREE.MeshStandardMaterial({color:0x66594e,roughness:.95})};
  const cube=(w,h,d,material,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);root.add(mesh);return mesh;};
  let display=inline?'switch':'shelf',selected=-1,angle='front',frame=0,moveFrame=0,closed=false,boxClone=null,moving=false;
  const title=document.querySelector('#compact-title'),note=document.querySelector('#compact-note'),options=[...dialog.querySelectorAll('[data-display]')],views=[...dialog.querySelectorAll('[data-view]')],bookButtons=[...dialog.querySelectorAll('[data-book]')],inspectControls=dialog.querySelector('.compact-inspect-controls'),backButton=dialog.querySelector('#compact-return');
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const resize=()=>{const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(()=>frameScene());ro.observe(mount);
  function clean(){
    books.forEach(b=>b.group.removeFromParent());
    while(root.children.length){const child=root.children[0];root.remove(child);if(child===boxClone){child.userData.compactActive=false;child.traverse(o=>{if(o.userData.compactPreviewOwned){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}if(o.userData.compactPreviewOwnedMaterial)o.material.dispose();});boxClone=null;continue;}child.geometry?.dispose();}
  }
  function showBox(){
    boxClone=box.cloneClosedBox();const current=boxClone;current.userData.compactActive=true;
    current.traverse(object=>{if(!object.userData.compactPhotoUrl)return;loader.load(object.userData.compactPhotoUrl,map=>{if(!current.userData.compactActive||closed){map.dispose();return;}map.colorSpace=THREE.SRGBColorSpace;object.material.color.set(0xffffff);object.material.map=map;object.material.needsUpdate=true;});});
    current.position.set(-1.9,0,0);root.add(current);
  }
  function setBook(i,x,y,z,rx=0,ry=0,rz=0){const b=books[i];b.group.position.set(x,y,z);b.group.rotation.set(rx,ry,rz);root.add(b.group);}
  function frameScene(){
    const mobile=mount.clientWidth<600;camera.fov=mobile?45:34;
    if(selected>=0){camera.position.set(0,0,mobile?6.3:5.4);camera.lookAt(0,0,0);}
    else{camera.position.set((display==='stack'?-1:1)*(mobile?2.2:4.0),mobile?4.0:4.2,mobile?15.5:10.8);camera.lookAt(0,1.5,0);}
    resize();
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
    activeScene.add(root);inspectControls.hidden=selected<0;backButton.hidden=selected<0;bookButtons.forEach(b=>b.hidden=selected>=0);options.forEach(b=>{b.hidden=selected>=0;b.setAttribute('aria-pressed',String(b.dataset.display===display));});
    if(selected>=0){
      title.textContent=compacts[selected].title;note.textContent=angle==='back'?compacts[selected].backImageNote:'A closer look · Front, back and spine';
      views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===angle)));
      setBook(selected,0,0,0,0,angle==='back'?Math.PI:angle==='spine'?Math.PI/2:0,0);
      mount.setAttribute('aria-label',`${compacts[selected].title} close-up. Use the front, back and spine buttons.`);
    }else{
      title.textContent='Compact Comics displays';note.textContent='Choose a book to take a closer look.';mount.setAttribute('aria-label','Paperback display. Select a book to inspect it.');
      if(display!=='switch')showBox();
      if(display==='shelf'){
        cube(1.65,.12,.83,materials.wood,2.13,.75,0);cube(.08,.72,.7,materials.dark,2.23,1.14,0);
        setBook(0,1.92,1.93,0,0,Math.PI/2,0);setBook(1,2.12,1.93,0,0,Math.PI/2,0);
      }else if(display==='stand'){
        cube(2.0,.12,1.8,materials.desk,2.05,.17,0);
        const back=cube(1.5,1.9,.06,materials.acrylic,2.06,1.25,-.13);back.rotation.x=-.14;
        cube(1.55,.09,.32,materials.acrylic,2.06,.36,.53);
        setBook(0,2.2,1.49,-.30,-.14,0,-.07);setBook(1,1.96,1.49,.02,-.14,0,.05);
      }else if(display==='stack'){
        cube(2.5,.12,2.7,materials.desk,2,.16,0);
        setBook(0,1.98,.34,0,-Math.PI/2,0,0);setBook(1,2.12,.48,.18,-Math.PI/2,0,.06);
      }else{
        cube(3.55,.12,1.15,materials.wood,0,.75,0);cube(.12,.85,.95,materials.dark,.22,1.18,0);
        setBook(0,-.18,1.93,0,0,Math.PI/2,0);setBook(1,.08,1.93,0,0,Math.PI/2,0);
      }
    }
    frameScene();
  }
  const draw=()=>{if(closed)return;renderer.render(activeScene,camera);frame=requestAnimationFrame(draw);};
  const select=i=>{
    if(moving||selected>=0)return;
    const finish=()=>{moving=false;selected=i;angle='front';build();views[0].focus();};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.reducedMotion==='true'){finish();return;}
    moving=true;const book=books[i].group,start=book.position.clone(),at=performance.now();
    const move=now=>{if(closed)return;const t=Math.min(1,(now-at)/350),ease=1-Math.pow(1-t,3);book.position.copy(start);if(display==='stack')book.position.y+=.35*ease;else book.position.z+=.45*ease;if(t<1)moveFrame=requestAnimationFrame(move);else finish();};
    moveFrame=requestAnimationFrame(move);
  };
  options.forEach(button=>button.addEventListener('click',()=>{cancelAnimationFrame(moveFrame);moving=false;display=button.dataset.display;selected=-1;build();},eventOptions));
  views.forEach(button=>button.addEventListener('click',()=>{angle=button.dataset.view;build();},eventOptions));
  bookButtons.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.book)),eventOptions));
  const returnDisplay=()=>{selected=-1;build();(inline?bookButtons[0]:options.find(x=>x.dataset.display===display)).focus();};
  backButton.addEventListener('click',returnDisplay,eventOptions);
  mount.addEventListener('pointerup',event=>{if(selected>=0)return;const r=mount.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(books.map(b=>b.group),true);let object=hits[0]?.object;while(object&&object.userData.compactIndex===undefined)object=object.parent;if(object)select(object.userData.compactIndex);},eventOptions);
  const close=()=>{dialog.close();};dialog.querySelector('#compact-close').addEventListener('click',close,eventOptions);
  dialog.addEventListener('keydown',event=>{if(inline&&selected>=0&&event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not([hidden]):not(:disabled)')].filter(el=>el.getClientRects().length);if(focusable.length&&((event.shiftKey&&document.activeElement===focusable[0])||(!event.shiftKey&&document.activeElement===focusable.at(-1)))){event.preventDefault();(event.shiftKey?focusable.at(-1):focusable[0]).focus();}}else if(selected>=0&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const order=['front','spine','back'],i=order.indexOf(angle);angle=order[(i+(event.key==='ArrowRight'?1:2))%3];build();}else if(event.key==='Escape'&&selected>=0){event.preventDefault();returnDisplay();}},eventOptions);
  dialog.addEventListener('close',()=>{closed=true;listeners.abort();cancelAnimationFrame(frame);cancelAnimationFrame(moveFrame);ro.disconnect();clean();books.forEach(b=>b.dispose());textures.forEach(t=>t.dispose());Object.values(materials).forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();document.querySelector('#compact-launch').disabled=false;document.querySelector('#collection-compacts').disabled=false;if(inline){document.querySelector('.viewer').classList.remove('compact-active');document.body.append(dialog);delete dialog.dataset.inline;dialog.classList.remove('compact-inspecting');dialog.removeAttribute('aria-modal');document.querySelector('#collection-comics').setAttribute('aria-pressed','true');document.querySelector('#collection-compacts').setAttribute('aria-pressed','false');document.querySelector('#collection-comics').focus();}else document.querySelector('#compact-launch').focus();},{once:true});
  if(inline){dialog.dataset.inline='';document.querySelector('.viewer').append(dialog);document.querySelector('.viewer').classList.add('compact-active');document.querySelector('#collection-comics').setAttribute('aria-pressed','false');document.querySelector('#collection-compacts').setAttribute('aria-pressed','true');}
  build();if(inline)dialog.show();else dialog.showModal();frameScene();draw();
}
