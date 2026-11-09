import * as THREE from 'three';
import { createArtworkGate } from './artwork-gate.js?v=1.0';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createCardboardTextures, addBoxDetails } from './box-details.js?v=17.0';
import { createComicSleeve } from './comic-sleeve.js?v=38.0';
import { createComicBook } from './comic-book.js?v=40.0';
import { loadBlindBag, createBlindBag } from './blind-bag.js?v=40.0';
import { loadModel } from './models.js?v=38.0';
import { lidPose, advanceLidMotion } from './lid-motion.js?v=15.0';
import { createStickerSystem } from './stickers.js?v=30.0';
import { mobileControlsQuery } from './ruler-control.js?v=19.0';
import { createReturnMotion, advanceReturnMotion } from './return-motion.js?v=1.0';

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b);
const damp = (a,b,dt,s=7) => THREE.MathUtils.damp(a,b,s,dt);

function canvasTexture(w,h,draw) {
  const c=document.createElement('canvas'); c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function roundedPath(path,x,y,w,h,r){
  path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);
}
function addMesh(group,geometry,material,pos,rotation){
  const m=new THREE.Mesh(geometry,material);if(pos)m.position.set(...pos);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}
function block(g,w,h,d,mat,pos){return addMesh(g,new RoundedBoxGeometry(w,h,d,2,.018),mat,pos);}

// Subdivide the rounded wall faces before bending them. RoundedBoxGeometry's
// broad middle faces otherwise have no vertices with which to form a bow.
function bowedWallGeometry(width,height,depth,side){
  const source=new RoundedBoxGeometry(width,height,depth,2,.018);
  const attributes=['position','normal','uv'], arrays=Object.fromEntries(attributes.map(key=>[key,[]]));
  const groups=[];
  const read=(i)=>Object.fromEntries(attributes.map(key=>[key,Array.from({length:source.attributes[key].itemSize},(_,j)=>source.attributes[key].array[i*source.attributes[key].itemSize+j])]));
  const midpoint=(a,b)=>Object.fromEntries(attributes.map(key=>[key,a[key].map((v,i)=>(v+b[key][i])/2)]));
  const add=v=>{for(const key of attributes)arrays[key].push(...v[key]);};
  const split=(a,b,c,depthLeft)=>{
    if(!depthLeft){add(a);add(b);add(c);return;}
    const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
    split(a,ab,ca,depthLeft-1);split(ab,b,bc,depthLeft-1);split(ca,bc,c,depthLeft-1);split(ab,bc,ca,depthLeft-1);
  };
  for(const group of source.groups){
    const start=arrays.position.length/3;
    for(let i=group.start;i<group.start+group.count;i+=3)split(read(i),read(i+1),read(i+2),2);
    groups.push({start,count:arrays.position.length/3-start,materialIndex:group.materialIndex});
  }
  const geometry=new THREE.BufferGeometry();
  for(const key of attributes)geometry.setAttribute(key,new THREE.Float32BufferAttribute(arrays[key],source.attributes[key].itemSize));
  groups.forEach(group=>geometry.addGroup(group.start,group.count,group.materialIndex));
  const p=geometry.attributes.position,n=geometry.attributes.normal,bulge=.012;
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),z=p.getZ(i),ay=Math.PI*(y/height+.5),az=Math.PI*(z/depth+.5);
    p.setX(i,p.getX(i)+side*bulge*Math.sin(ay)*Math.sin(az));
    const nx=n.getX(i),ny=n.getY(i)-nx*side*bulge*Math.PI/height*Math.cos(ay)*Math.sin(az),nz=n.getZ(i)-nx*side*bulge*Math.PI/depth*Math.sin(ay)*Math.cos(az);
    const length=Math.hypot(nx,ny,nz)||1;n.setXYZ(i,nx/length,ny/length,nz/length);
  }
  source.dispose();geometry.computeBoundingSphere();return geometry;
}

export async function createBox(stage,comics){
  // The models download alongside the cardboard maps below.
  const modelsReady=Promise.all([
    loadModel('./assets/models/comic-set.glb'),
    comics.some(c=>c.blindBag)?loadBlindBag():null,
  ]);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x0b0e13,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const env=new RoomEnvironment();
  // Long studio strips give the sleeve its moving, photographic reflections.
  const softbox=new THREE.Mesh(new THREE.PlaneGeometry(2,9),new THREE.MeshBasicMaterial({color:0xffffff}));
  softbox.position.set(-3,3,6);softbox.lookAt(0,2,0);env.add(softbox);
  const pmrem=new THREE.PMREMGenerator(renderer), envTexture=pmrem.fromScene(env,.035).texture;
  scene.environment=envTexture;scene.environmentIntensity=.6;pmrem.dispose();env.dispose();
  const camera=new THREE.PerspectiveCamera(33,1,.1,60);
  const homeCamera=new THREE.Vector3(6.1,5.6,10.5), homeTarget=new THREE.Vector3(0,2.65,0), cameraTarget=homeTarget.clone();
  const mobileView=matchMedia(mobileControlsQuery),mobileAnchor=new THREE.Vector3();
  camera.position.copy(homeCamera);camera.lookAt(homeTarget);
  scene.add(new THREE.HemisphereLight(0xcbdfff,0x665d4b,.9));
  const key=new THREE.DirectionalLight(0xfff3df,2.7);key.position.set(-4,8,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=8;key.shadow.camera.bottom=-5;key.shadow.normalBias=.035;key.shadow.bias=-.0001;scene.add(key);scene.add(key.target);
  const rim=new THREE.DirectionalLight(0xb6d3ff,1.05);rim.position.set(4,5,-4);scene.add(rim);
  const world=new THREE.Group();scene.add(world);
  const board=new THREE.MeshStandardMaterial(createCardboardTextures(THREE));
  const cardboardLoader=new THREE.TextureLoader();
  const cardboardMaps=await Promise.all(['color','normal','roughness'].map(kind=>cardboardLoader.loadAsync(`./assets/materials/cardboard-${kind}.jpg`)));
  cardboardMaps.forEach((t,i)=>{t.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();});
  const inside=new THREE.MeshStandardMaterial({map:cardboardMaps[0],normalMap:cardboardMaps[1],roughnessMap:cardboardMaps[2],normalScale:new THREE.Vector2(.48,.48),color:0xe0c9af,roughness:1,metalness:0});
  // RoundedBoxGeometry uses +X, -X, +Y, -Y, +Z, -Z material groups.
  const innerFace=index=>Array.from({length:6},(_,i)=>i===index?inside:board);
  const edge=new THREE.MeshStandardMaterial({color:0xbcb4a2,roughness:1});
  const body=new THREE.Group();world.add(body);body.userData.box=true;
  const W=2.16,H=2.9,D=4.15,T=.068;
  const lidClosedY=H-.02;
  block(body,W,T,D,innerFace(2),[0,T/2,0]);
  for(const side of [-1,1])addMesh(body,bowedWallGeometry(T,H,D,side),innerFace(side<0?0:1),[side*W/2,H/2,0]);
  for(const z of [-D/2,D/2]){
    const shape=new THREE.Shape();roundedPath(shape,-W/2,0,W,H,.035);
    const hole=new THREE.Path();roundedPath(hole,-.38,2.25,.76,.23,.09);shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false,curveSegments:16});
    // Separate inward and outward caps, preserving the real hand hole.
    geometry.clearGroups();const normals=geometry.attributes.normal,uv=geometry.attributes.uv,positions=geometry.attributes.position;
    for(let i=0;i<normals.count;i+=3){
      const nz=normals.getZ(i),material=Math.abs(nz)>.9?(nz*Math.sign(z)<0?1:0):2;
      const previousGroup=geometry.groups.at(-1);if(previousGroup?.materialIndex===material)previousGroup.count+=3;else geometry.addGroup(i,3,material);
      if(material!==2)for(let j=i;j<i+3;j++)uv.setXY(j,(positions.getX(j)+W/2)/W,positions.getY(j)/H);
    }
    addMesh(body,geometry,[board,inside,edge],[0,0,z-T/2]);
    block(body,.79,.018,T,edge,[0,2.24,z]);
  }
  // Exposed card stock and folded corner seams break up the clean white silhouette.
  for(const x of [-W/2,W/2]){
    block(body,T+.005,.014,D,edge,[x,H+.006,0]);
    block(body,.009,H-.18,.014,board,[x+(x<0?-.038:.038),H/2,D/2-.16]);
  }
  const lid=new THREE.Group();world.add(lid);lid.userData.box=true;lid.userData.lid=true;
  // Only the recessed rectangular liner is kraft. All folded lips stay white.
  block(lid,W+.24,.09,D+.21,board,[0,.08,0]);
  addMesh(lid,new THREE.PlaneGeometry(W+.075,D+.045),inside,[0,.033,0],[Math.PI/2,0,0]);
  for(const x of [-1,1])block(lid,.065,.29,D+.21,board,[x*(W+.18)/2,-.065,0]);
  for(const z of [-1,1])block(lid,W+.24,.29,.065,board,[0,-.065,z*(D+.15)/2]);
  const boxDetails=addBoxDetails({THREE,body,lid,W,H,D,T});
  // Cardboard, not animated sticker curls, determines camera framing and the floor.
  const bodyLocalBounds=new THREE.Box3().setFromObject(body),lidLocalBounds=new THREE.Box3().setFromObject(lid);
  lid.position.y=lidClosedY;
  const textureLoader=new THREE.TextureLoader(),loadedArt=new Set();
  const loadColor=url=>textureLoader.loadAsync(url).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(disposed){t.dispose();return null;}loadedArt.add(t);return t;});
  // Only the models hold up the first frame. The box opens closed, so no comic
  // is visible yet: covers, backs and pulls stream in once it is on screen.
  const [comicModel,bagModel]=await modelsReady;
  const cards=comics.map((comic,i)=>{
    const g=new THREE.Group();world.add(g);g.userData.comicIndex=i;
    if(comics[i].blindBag){
      const blind=createBlindBag(THREE,bagModel,{comicModel,pulls:comics[i].pulls});
      g.add(blind.group);
      g.position.set((i%3-1)*.014,1.42,1.43-i*(2.86/Math.max(1,comics.length-1)));
      g.rotation.set(-.025,0,(i%3-1)*.009);
      return {group:g,blind,baseZ:g.position.z,baseX:g.position.x,y:1.42,v:0};
    }
    const booklet=createComicBook(THREE,{template:comicModel,frontQuad:comics[i].frontQuad,backQuad:comics[i].backQuad});
    const book=booklet.group,bag=createComicSleeve(THREE,comicModel),sleeve=bag.group;
    const [widthIn,heightIn]=comics[i].physicalSizeInches??[6.625,10.25];
    // The model is a standard 6⅝ × 10¼ in comic; smaller formats scale from it.
    book.scale.set(widthIn/6.625,heightIn/10.25,comics[i].thicknessScale??1);
    g.add(book,sleeve);
    g.position.set((i%3-1)*.014,1.42,1.43-i*(2.86/Math.max(1,comics.length-1)));
    g.rotation.set(-.025,0,(i%3-1)*.009);
    return {group:g,book,booklet,sleeve,bag,baseZ:g.position.z,baseX:g.position.x,y:1.42,v:0};
  });
  const shadowMap=canvasTexture(256,256,(c,w,h)=>{const gradient=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(0,0,0,.8)');gradient.addColorStop(.4,'rgba(0,0,0,.45)');gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,w,h);});
  // Shadow helpers belong to the scene, not the rotating box. In particular,
  // the transparent contact plane must never cast a solid rectangular shadow.
  const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(6.5,6.5),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
  contactShadow.rotation.x=-Math.PI/2;contactShadow.castShadow=false;contactShadow.receiveShadow=false;scene.add(contactShadow);
  const ground=addMesh(scene,new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.22}),[0,-.02,0],[-Math.PI/2,0,0]);ground.castShadow=false;
  // A soft studio halo sits behind the book, outside the fitted model bounds.
  const haloMap=canvasTexture(128,128,(c,w,h)=>{
    const gradient=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    gradient.addColorStop(0,'rgba(255,255,255,.85)');gradient.addColorStop(.32,'rgba(255,255,255,.55)');gradient.addColorStop(.68,'rgba(255,255,255,.13)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=gradient;c.fillRect(0,0,w,h);
  });
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloMap,color:0xa2b9df,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  halo.visible=false;scene.add(halo);
  let lidSide=1,wantedLidSide=1,lidTilt=0,wantedLidTilt=0,lidProgress=0;
  const lidMotion={progress:0,velocity:0};
  let opened=false,selected=0,openProgress=0,yaw=0,pitch=0,desiredYaw=0,desiredPitch=0,reduced=false,frame=0,last=performance.now(),visible=true,dirty=true,decorating=false;
  const stickerSystem=await createStickerSystem({THREE,body,lid,stage,camera,W,H,D,T,invalidate:()=>{dirty=true;}});
  if(stickerSystem.hasSaved)await stickerSystem.ready().catch(error=>console.warn('Saved stickers could not load',error));
  const decorationTarget=new THREE.Vector3(0,1.55,0);
  let inspecting=false,focusProgress=0,unwrapped=false,unwrapProgress=0,inspectYaw=.08,inspectPitch=-.025,wantedInspectYaw=.08,wantedInspectPitch=-.025,detailProgress=0,wantedDetail=0;
  let floatTime=0,floatStrength=0,held=false,wasSettled=false,returnState=null,returnParked=false;
  const lerp=THREE.MathUtils.lerp;
  let viewportWidth=1,viewportHeight=1;
  const resize=()=>{viewportWidth=Math.max(1,stage.clientWidth);viewportHeight=Math.max(1,stage.clientHeight);renderer.setSize(viewportWidth,viewportHeight,false);dirty=true;};
  const ro=new ResizeObserver(resize);ro.observe(stage);resize();
  const bookBounds=new THREE.Box3();
  const inspectionBounds=new THREE.Box3(),inspectionCenter=new THREE.Vector3(),inspectionCamera=new THREE.Vector3();
  const sleeveBounds=new THREE.Box3(),sleeveOffset=new THREE.Vector3(),inverseCardRotation=new THREE.Quaternion();
  const overviewCamera=homeCamera.clone(),overviewTarget=homeTarget.clone();
  const overviewDirection=homeCamera.clone().sub(homeTarget).normalize();
  const overviewRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),overviewDirection).normalize();
  const overviewUp=new THREE.Vector3().crossVectors(overviewDirection,overviewRight).normalize();
  const overviewBounds=Array.from({length:3},()=>new THREE.Box3()),overviewCorners=Array.from({length:24},()=>new THREE.Vector3()),relative=new THREE.Vector3();
  let disposed=false,firstRender=false;
  const artworkGate=createArtworkGate(stage),firstPaint=artworkGate.ready;
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;artworkGate.visibility(visible);if(visible)dirty=true;});io.observe(stage);
  function update(now){
    frame=requestAnimationFrame(update);const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(elapsed,.035);last=now;
    if(document.hidden||!visible)return;
    const stickersMoving=stickerSystem.tick(dt,reduced);
    if(!dirty&&wasSettled&&floatStrength<=.0001&&!stickersMoving)return;
    openProgress=reduced?Number(opened):damp(openProgress,Number(opened),dt,4.5);
    if(returnState){
      const position=advanceReturnMotion(returnState.motion,reduced?10:elapsed);
      focusProgress=position.focus;unwrapProgress=position.extraction;
      if(position.done){returnState.complete=true;detailProgress=0;inspectYaw=wantedInspectYaw;inspectPitch=wantedInspectPitch;}
    }else{
      focusProgress=reduced?Number(inspecting):damp(focusProgress,Number(inspecting),dt,5);
      unwrapProgress=reduced?Number(unwrapped):damp(unwrapProgress,Number(unwrapped),dt,3.9);
    }
    detailProgress=reduced?wantedDetail:damp(detailProgress,wantedDetail,dt,6);
    inspectYaw=reduced?wantedInspectYaw:damp(inspectYaw,wantedInspectYaw,dt,8);
    inspectPitch=reduced?wantedInspectPitch:damp(inspectPitch,wantedInspectPitch,dt,8);
    lidSide=reduced?wantedLidSide:damp(lidSide,wantedLidSide,dt,5);lidTilt=reduced?wantedLidTilt:damp(lidTilt,wantedLidTilt,dt,5);
    const focus=smooth(0,1,focusProgress), extraction=cards[selected].blind?0:smooth(0,1,unwrapProgress);
    // Keep one mobile canvas and field of view throughout opening. Make room
    // for the 56px ruler + 8px gap inside the camera, without resizing WebGL.
    const rail=mobileView.matches&&!decorating?64*smooth(0,1,openProgress)*(1-focus):0;
    camera.fov=mobileView.matches?40:viewportWidth/viewportHeight<.83?40:33;
    camera.setViewOffset(Math.max(1,viewportWidth-rail),viewportHeight,0,0,viewportWidth,viewportHeight);
    // Steady the book as soon as its dedicated close-up is requested, instead
    // of carrying the Front/Back float through the whole extraction animation.
    const floatingWanted=inspecting&&!held&&!reduced&&wantedDetail===0?smooth(.82,1,focus)*(1-detailProgress)*(1-Math.sin(extraction*Math.PI)):0;
    floatStrength=reduced?0:damp(floatStrength,floatingWanted,dt,wantedDetail?12:4);
    if(wantedDetail&&floatStrength<.001)floatStrength=0;
    if(inspecting&&!reduced)floatTime+=dt;
    // Keep the lid aside until every raised comic is back below the rim.
    const lidWanted=opened||cards.some(c=>c.y>1.52)?1:0;
    advanceLidMotion(lidMotion,reduced?Number(opened):lidWanted,dt,reduced);lidProgress=lidMotion.progress;
    boxDetails.setLidShadow(1-smooth(0,.12,lidProgress));
    const lidT=lidProgress,reveal=smooth(.56,.96,openProgress)*smooth(.8,1,lidProgress);
    body.position.y=-7*focus;body.visible=focus<.995;
    lid.visible=focus<.995;
    const pose=lidPose(THREE,lidT,lidSide,lidTilt);
    lid.position.set(...pose.position);lid.position.y-=7*focus;lid.rotation.copy(pose.rotation);
    // A small closed-pose offset reads as a loose lid and blends away as it lifts.
    const loose=1-smooth(0,.25,lidProgress);lid.position.x+=.012*loose;lid.position.z-=.008*loose;
    stage.dataset.lidSide=wantedLidSide<0?'left':'right';
    let bagsMoving=false;
    cards.forEach((card,i)=>{
      const active=i===selected, lift=active&&!returnParked?reveal:0;
      const target=1.42+lift*3.13;
      if(active&&returnState){
        const progress=returnState.motion.focus>0?1-focusProgress/returnState.motion.focus:1;
        card.y=lerp(returnState.startY,1.42,clamp(progress,0,1));card.v=0;
      }else if(reduced){card.y=target;card.v=0;}else{card.v+=(target-card.y)*155*dt;card.v*=Math.exp(-20*dt);card.y+=card.v*dt;}
      card.group.visible=active||focus<.995;
      card.group.position.y=active?lerp(card.y,3.2,focus):card.y-7*focus;
      const amount=clamp((card.y-1.42)/3.13,0,1);
      card.group.position.z=THREE.MathUtils.lerp(card.baseZ,1.12,amount);
      card.group.position.x=THREE.MathUtils.lerp(card.baseX,.2,amount);
      card.group.rotation.y=amount*.33;
      card.group.rotation.x=-.025*(1-amount)+amount*.025;
      card.group.rotation.z=(i%3-1)*.009*(1-amount)-.025*amount;
      card.group.scale.setScalar(1+focus*.32*(active?1:0));
      if(card.blind){card.blind.setOpen(active&&inspecting&&unwrapped);bagsMoving=card.blind.tick(active&&returnState?elapsed*2.5:dt,reduced)||bagsMoving;}
      else{
      const out=active?extraction:0,pull=smooth(.12,.68,out),settle=smooth(.68,1,out);
      card.book.position.set(.75*settle,3.05*pull-2.57*settle,.36*settle);
      card.book.rotation.z=-.025*settle;
      card.booklet.setFree(smooth(.72,1,out));
      card.sleeve.position.set(-1.12*settle,-.26*settle,-.36*settle);
      card.sleeve.rotation.set(0,-.28*settle,.1*settle);
      card.bag.update(smooth(0,.2,out),smooth(.65,1,out));
      }
      if(active){
        card.group.position.x=lerp(card.group.position.x,0,focus);
        card.group.position.z=lerp(card.group.position.z,1.2,focus);
        card.group.rotation.y=lerp(card.group.rotation.y,inspectYaw,focus);
        card.group.rotation.x=lerp(card.group.rotation.x,inspectPitch,focus);
        card.group.rotation.z=lerp(card.group.rotation.z,0,focus);
      }
    });
    yaw=damp(yaw,desiredYaw,dt,5);pitch=damp(pitch,desiredPitch,dt,5);
    world.rotation.y=(-.13+yaw)*(1-focus);world.rotation.x=pitch*(1-focus);
    scene.environmentRotation.y=yaw*.32;
    world.updateWorldMatrix(true,true);
    overviewBounds[0].copy(bodyLocalBounds).applyMatrix4(body.matrixWorld);overviewBounds[1].copy(lidLocalBounds).applyMatrix4(lid.matrixWorld);
    // The invisible floor stays horizontal and below both parts at every
    // tilt, including the lid travelling to either side. It cannot slice
    // through the box when a lower corner rotates beneath the original floor.
    const boxBounds=overviewBounds[0],floorY=Math.min(0,boxBounds.min.y,overviewBounds[1].min.y)-.02;
    ground.position.y=floorY;
    contactShadow.position.set((boxBounds.min.x+boxBounds.max.x)/2,floorY+.008,(boxBounds.min.z+boxBounds.max.z)/2);
    contactShadow.scale.set(Math.max(3,boxBounds.max.x-boxBounds.min.x+1.8)/6.5,Math.max(3,boxBounds.max.z-boxBounds.min.z+1.8)/6.5,1);
    const shadowVisibility=1-smooth(0,.45,focus);
    contactShadow.material.opacity=shadowVisibility*(1-.55*Math.abs(Math.sin(world.rotation.x)));
    contactShadow.visible=shadowVisibility>.001;
    ground.material.opacity=.22*shadowVisibility;ground.visible=shadowVisibility>.001;
    if(focus<=.0001){
      // Fit the actual lid, box and raised comic, especially on narrow screens.
      overviewBounds[2].setFromObject(cards[selected].group);
      // The closed mobile box is the hero: aim at its centre and fit closely.
      // Blend back to the raised-comic framing as the lid opens.
      const mobileCollection=mobileView.matches&&!decorating;
      // The resting lid may run partly off-frame so opening keeps the box and
      // raised comic close instead of pulling the camera back.
      if(!decorating){const crop=(mobileCollection?.7:.55)*smooth(.5,1,lidProgress);overviewBounds[1].min.lerp(overviewBounds[0].min,crop);overviewBounds[1].max.lerp(overviewBounds[0].max,crop);}
      mobileAnchor.set(0,1.45,0).lerp(homeTarget,smooth(0,1,Math.max(openProgress,lidProgress)));
      const anchor=decorating?decorationTarget:mobileCollection?mobileAnchor:homeTarget;
      let n=0,minX=Infinity,maxX=-Infinity;
      for(const bounds of overviewBounds)for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=overviewCorners[n++].set(x,y,z);relative.copy(p).sub(anchor);const px=relative.dot(overviewRight);minX=Math.min(minX,px);maxX=Math.max(maxX,px);
      }
      overviewTarget.copy(anchor).addScaledVector(overviewRight,(minX+maxX)/2*smooth(0,1,Math.max(openProgress,lidProgress)));
      let distance=decorating||mobileCollection?7:homeCamera.distanceTo(homeTarget);const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;
      for(const point of overviewCorners){relative.copy(point).sub(overviewTarget);const depth=relative.dot(overviewDirection);distance=Math.max(distance,depth+Math.abs(relative.dot(overviewRight))*1.1/tanH,depth+Math.abs(relative.dot(overviewUp))*1.08/tanV);}
      overviewCamera.copy(overviewTarget).addScaledVector(overviewDirection,distance);
    }
    if(focus>.0001){
      // Frame the actual animated bounds, including the comic at the top of its pull.
      cards[selected].group.updateWorldMatrix(true,true);
      if(cards[selected].blind)cards[selected].blind.bounds(inspectionBounds);else inspectionBounds.setFromObject(cards[selected].group);
      inspectionBounds.getCenter(inspectionCenter);
      const bookFocus=cards[selected].blind?0:smooth(.9,1,extraction)*detailProgress;
      if(bookFocus>0){
        bookBounds.setFromObject(cards[selected].book);
        inspectionBounds.min.lerp(bookBounds.min,bookFocus);inspectionBounds.max.lerp(bookBounds.max,bookFocus);
        inspectionBounds.getCenter(inspectionCenter);
      }
      // Center the entire extracted comic and keep every edge in view as it turns.
      const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;
      const extentX=Math.max(Math.abs(inspectionBounds.min.x-inspectionCenter.x),Math.abs(inspectionBounds.max.x-inspectionCenter.x));
      const extentY=Math.max(Math.abs(inspectionBounds.min.y-inspectionCenter.y),Math.abs(inspectionBounds.max.y-inspectionCenter.y));
      const distance=Math.max(extentX*1.12/tanH,extentY*1.12/tanV)+inspectionBounds.max.z-inspectionCenter.z+.08;
      inspectionCamera.copy(inspectionCenter);inspectionCamera.z+=distance;
      camera.position.copy(overviewCamera).lerp(inspectionCamera,focus);
      cameraTarget.copy(overviewTarget).lerp(inspectionCenter,focus);
      // Set the bag and its board aside in the comic close-up. Offset in screen
      // space so they cannot obscure the cover or enlarge its camera framing.
      if(bookFocus>0){
        sleeveBounds.setFromObject(cards[selected].sleeve,true);
        const parkX=Math.min(0,inspectionCenter.x-sleeveBounds.max.x-(inspectionCamera.z-sleeveBounds.min.z)*tanH*1.08);
        cards[selected].group.getWorldQuaternion(inverseCardRotation).invert();
        sleeveOffset.set(parkX*bookFocus/cards[selected].group.scale.x,0,0).applyQuaternion(inverseCardRotation);
        cards[selected].sleeve.position.add(sleeveOffset);
      }
    }else{camera.position.copy(overviewCamera);cameraTarget.copy(overviewTarget);}
    camera.lookAt(cameraTarget);
    // Apply idle movement after fitting the camera: otherwise camera tracking
    // cancels the float. Each frame resets these transforms before measuring.
    const floatY=Math.sin(floatTime*Math.PI*2/4.8)*.065*floatStrength;
    const floatRoll=Math.sin(floatTime*Math.PI*2/6.4)*.007*floatStrength;
    const activeCard=cards[selected],freeFloat=smooth(.85,1,extraction);
    activeCard.group.position.y+=floatY*(1-freeFloat);
    activeCard.group.rotation.z+=floatRoll*(1-freeFloat);
    if(activeCard.book){activeCard.book.position.y+=floatY*freeFloat/activeCard.group.scale.y;activeCard.book.rotation.z+=floatRoll*freeFloat;}
    halo.visible=focus>.001;
    if(halo.visible){
      activeCard.group.updateWorldMatrix(true,true);
      if(activeCard.blind){activeCard.blind.bounds(bookBounds);bookBounds.getCenter(halo.position);const size=bookBounds.getSize(relative);halo.scale.set(size.x*2.25,size.y*1.8,1);}
      else{bookBounds.setFromObject(activeCard.book);bookBounds.getCenter(halo.position);halo.scale.set(activeCard.book.scale.x*1.8*activeCard.group.scale.x*2.25,activeCard.book.scale.y*2.7*activeCard.group.scale.y*1.8,1);}
      halo.position.z=inspectionBounds.min.z-.65;
      halo.material.opacity=.19*focus*(1-detailProgress*.55);
    }
    stage.dataset.idleMotion=inspecting&&!reduced&&floatStrength>.001?'floating':'still';
    stage.dataset.halo=halo.visible?'on':'off';
    const settled=Math.abs(lidProgress-Number(opened))<.0001&&Math.abs(lidSide-wantedLidSide)<.0001&&Math.abs(lidTilt-wantedLidTilt)<.0001&&Math.abs(openProgress-Number(opened))<.0001&&cards.every(c=>Math.abs(c.v)<.001)&&Math.abs(yaw-desiredYaw)<.0001&&Math.abs(pitch-desiredPitch)<.0001&&Math.abs(focusProgress-Number(inspecting))<.0001&&Math.abs(unwrapProgress-Number(unwrapped))<.0001&&Math.abs(inspectYaw-wantedInspectYaw)<.0001&&Math.abs(inspectPitch-wantedInspectPitch)<.0001&&Math.abs(detailProgress-wantedDetail)<.0001&&!bagsMoving;
    stage.dataset.motionSettled=String(settled && (!returnState || returnState.complete));
    if(returnState?.complete && settled){
      const finished=returnState;returnState=null;cards[selected].blind?.reset();
      // Render the exact seated pose even when the scene becomes settled on
      // this frame; otherwise the previous raised frame can remain on screen.
      dirty=true;stage.dataset.returning='false';finished.resolve();
    }
    wasSettled=settled;
    if(dirty||!settled||floatStrength>.0001||stickersMoving){
      renderer.render(scene,camera);dirty=false;
      if(!firstRender){
        firstRender=true;
        artworkGate.rendered();
      }
    }
  }
  frame=requestAnimationFrame(update);
  // Stream artwork into the visible box: every front first, in shelf order,
  // then backs and blind-bag contents. A comic that is selected or inspected
  // jumps the queue for its back. Shared images (pull backs) load once.
  let painted=false;
  const art=new Map(),backsStarted=new Set(),pendingBacks=new Set();
  const fetchArt=url=>{
    if(!url)return Promise.resolve(null);
    if(!art.has(url))art.set(url,loadColor(url).catch(error=>{console.warn('Artwork unavailable',url,error);return null;}));
    return art.get(url);
  };
  const applyArt=fn=>value=>{if(!disposed){fn(value);dirty=true;}};
  function loadBack(i){
    if(disposed||backsStarted.has(i))return;
    if(!painted){pendingBacks.add(i);return;}
    backsStarted.add(i);
    const comic=comics[i],card=cards[i];
    if(comic.blindBag){
      Promise.all([fetchArt(comic.bagBack),Promise.all(comic.pulls.map(pull=>fetchArt(pull.cover))),Promise.all(comic.pulls.map(pull=>fetchArt(pull.back)))])
        .then(applyArt(([backTexture,pullTextures,pullBacks])=>card.blind.setTextures({backTexture:backTexture??undefined,pullTextures,pullBacks})));
    }else if(comic.backCover)fetchArt(comic.backCover).then(applyArt(t=>{if(t)card.booklet.setCover(false,t);}));
  }
  firstPaint.then(shown=>{
    if(!shown||disposed)return;
    painted=true;
    const fronts=comics.map((comic,i)=>fetchArt(comic.cover).then(applyArt(t=>{
      if(!t)return;
      if(cards[i].blind)cards[i].blind.setTextures({frontTexture:t});else cards[i].booklet.setCover(true,t);
    })));
    pendingBacks.forEach(loadBack);pendingBacks.clear();
    Promise.allSettled(fronts).then(()=>comics.forEach((_,i)=>loadBack(i)));
  });
  const raycaster=new THREE.Raycaster();
  return {
    firstPaint,
    cloneClosedBox(){
      const copy=new THREE.Group(),shell=body.clone(true),top=lid.clone(true);
      shell.position.set(0,0,0);shell.rotation.set(0,0,0);shell.visible=true;
      top.position.set(.012,lidClosedY,-.008);top.rotation.set(0,0,0);top.visible=true;
      copy.add(shell,top);
      // These independently-owned stand-ins can receive their own artwork;
      // the live comics replace and dispose their materials while streaming.
      for(let i=0;i<5;i++){
        const card=new THREE.Mesh(new THREE.BoxGeometry(1.72,2.65,.03),new THREE.MeshStandardMaterial({color:0xe7e4db,roughness:1}));
        card.position.set(0,1.42,1.43-i*.55);card.userData.compactPreviewOwned=true;copy.add(card);
        const artGeometry=new THREE.PlaneGeometry(1.72,2.65,12,20),quad=comics[i]?.frontQuad,uv=artGeometry.attributes.uv;
        if(quad){const [tl,tr,br,bl]=quad;for(let j=0;j<uv.count;j++){const u=uv.getX(j),v=uv.getY(j);uv.setXY(j,(bl[0]*(1-u)+br[0]*u)*(1-v)+(tl[0]*(1-u)+tr[0]*u)*v,1-((bl[1]*(1-u)+br[1]*u)*(1-v)+(tl[1]*(1-u)+tr[1]*u)*v));}}
        const art=new THREE.Mesh(artGeometry,new THREE.MeshBasicMaterial({color:0x777a78}));
        art.position.set(0,1.42,1.45-i*.55);art.userData.compactPreviewOwned=true;art.userData.compactPhotoUrl=comics[i]?.cover;copy.add(art);
      }
      shell.traverse(object=>{if(object.isMesh&&object.material?.type==='MeshBasicMaterial'&&object.material?.transparent){object.material=object.material.clone();object.material.opacity=1;object.userData.compactPreviewOwnedMaterial=true;}});
      return copy;
    },
    setLid(side,tilt=0){wantedLidSide=clamp(side,-1,1);wantedLidTilt=clamp(tilt,-.16,.24);dirty=true;},
    setOpen(value){opened=value;if(value)returnParked=false;dirty=true;stage.dataset.state=value?'open':'closed';},
    select(index){if(index!==selected)cards[index].blind?.crinkle();returnParked=false;selected=index;loadBack(index);dirty=true;stage.dataset.activeIndex=String(index);},
    rotate(dx,dy=0){if(inspecting){wantedInspectYaw+=dx;wantedInspectPitch=clamp(wantedInspectPitch+dy,-.85,.85);}else if(decorating){desiredYaw+=dx;desiredPitch=clamp(desiredPitch+dy,-.45,1.1);}else{desiredYaw=clamp(desiredYaw+dx,-.8,.8);desiredPitch=clamp(desiredPitch+dy,-.08,.12);}dirty=true;},
    stickers:stickerSystem,
    decorate(value){decorating=value;desiredYaw=0;desiredPitch=0;dirty=true;},
    decorationFace(face){const views={front:[.66,0],right:[-.91,0],back:[-2.48,0],left:[2.23,0],lid:[.66,1.05]};[desiredYaw,desiredPitch]=views[face]??views.front;dirty=true;},
    reset(){wantedDetail=0;if(inspecting){wantedInspectYaw=.08;wantedInspectPitch=-.025;}else{desiredYaw=0;desiredPitch=0;wantedLidSide=1;wantedLidTilt=0;}dirty=true;},
    inspectView(view){if(!inspecting)return;wantedDetail=view==='comic'?1:0;wantedInspectYaw=view==='back'?Math.PI+.08:.08;wantedInspectPitch=-.025;dirty=true;},
    focus(value){
      wantedDetail=0;inspecting=value;held=false;floatTime=0;floatStrength=0;
      if(value){returnParked=false;unwrapped=false;wantedInspectYaw=.08;wantedInspectPitch=-.025;loadBack(selected);cards[selected].blind?.crinkle();dirty=true;return Promise.resolve();}
      const needsRestore=unwrapped||unwrapProgress>.001;returnParked=true;unwrapped=false;wantedInspectYaw=.08;wantedInspectPitch=-.025;dirty=true;
      if(reduced){focusProgress=0;unwrapProgress=0;cards[selected].blind?.reset();return Promise.resolve();}
      stage.dataset.motionSettled='false';stage.dataset.returning='true';
      return new Promise(resolve=>{returnState={motion:createReturnMotion(focusProgress,unwrapProgress,needsRestore),startY:cards[selected].y,complete:false,resolve};});
    },
    hold(value){held=value;dirty=true;},
    unwrap(value){unwrapped=inspecting&&value;dirty=true;},
    reduce(value){reduced=value;dirty=true;},
    hit(x,y){const r=stage.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);const hits=raycaster.intersectObjects(inspecting?[cards[selected].group]:[body,lid,...cards.map(c=>c.group)],true);if(!hits.length)return null;let o=hits[0].object;while(o&&o!==world){if(o.userData.comicIndex!==undefined)return {comic:o.userData.comicIndex};if(o.userData.lid)return {lid:true};if(o.userData.box)return {box:true};o=o.parent;}return null;},
    dispose(){if(returnState){returnState.resolve();returnState=null;}disposed=true;artworkGate.dispose();stickerSystem.dispose();cancelAnimationFrame(frame);ro.disconnect();io.disconnect();renderer.dispose();envTexture.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.map?.dispose();m.dispose();});});cards.forEach(c=>{c.blind?.dispose();c.booklet?.dispose();});[...loadedArt,...cardboardMaps].forEach(t=>t.dispose());}
  };
}
