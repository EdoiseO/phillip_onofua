import {easeInOutSine} from './return-motion.js?v=1.11';

export const COMPACT_RETURN_MS=960;

export function shouldReturnFromCompactTap({startedOnBook, endedOnBook, distance, elapsed}) {
  return !startedOnBook && !endedOnBook && distance < 7 && elapsed > 450;
}

// Run a continuous return, with a watchdog so an interrupted animation cannot
// leave the display controls locked. Cancellation is reserved for teardown.
export function startCompactReturn({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  const start=now();
  let frame=0,timer=0,finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;clearTimer(timer);cancel(frame);onFrame(1,1);onComplete();
  };
  const tick=time=>{
    if(finished)return;
    const progress=Math.max(0,(time-start)/COMPACT_RETURN_MS);
    if(progress>=1)finish();else{onFrame(easeInOutSine(progress),progress);frame=request(tick);}
  };
  timer=setTimer(finish,2000);
  frame=request(tick);
  return ()=>{if(!finished){finished=true;clearTimer(timer);cancel(frame);}};
}

// The departing UI clears before the destination starts appearing.
export function compactUiOpacity(progress){
  const u=Math.max(0,Math.min(1,progress));
  return {outgoing:Math.max(0,1-u/.45),incoming:u===1?1:Math.max(0,Math.min(1,(u-.55)/.45))};
}

export function interpolateCompactBook(book,fromPosition,toPosition,fromRotation,toRotation,progress,{lift=0}={}){
  book.position.lerpVectors(fromPosition,toPosition,progress);
  book.position.y+=.25*lift;
  book.quaternion.slerpQuaternions(fromRotation,toRotation,progress);
}

// Put the other book behind the turning volume while the selected book
// comes forward. Once it is in front of the shelf, turn and align its spine
// with its slot, then slide straight back between the other book and bookend.
export function createSpineShelfReturn(book, neighbor, from, to, fromRotation, toRotation){
  const destination=neighbor.group.position.clone();
  const reach=Math.hypot(book.width,book.height,book.depth)/2+neighbor.width/2+.08;
  const front=Math.max(from.z,destination.z+reach);
  const parked=Math.min(destination.z,from.z-reach);
  const clamp=value=>Math.min(1,Math.max(0,value));
  const ease=(progress,start,end)=>easeInOutSine((progress-start)/(end-start));
  return progress=>{
    const forward=Math.sin(Math.PI/2*clamp(progress/.28));
    const align=ease(progress,.08,.64);
    const slide=ease(progress,.64,1);
    book.group.position.lerpVectors(from,to,align);
    book.group.position.z=progress<.64
      ? from.z+(front-from.z)*forward
      : front+(to.z-front)*slide;
    book.group.quaternion.slerpQuaternions(fromRotation,toRotation,align);
    neighbor.group.position.z=parked+(destination.z-parked)*ease(progress,.28,.57);
  };
}

// Shared by normal scene builds and pickup target calculation, so the final
// camera position is identical when the temporary scene is replaced.
export function frameCompactBounds(THREE,camera,bounds,width,height){
  camera.fov=width<600?45:34;camera.aspect=width/height;
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;
  const distance=Math.max(size.y/(2*tanV),size.x/(2*tanH))*1.14;
  camera.position.set(center.x,center.y,bounds.max.z+distance);camera.lookAt(center);camera.updateProjectionMatrix();
}

// A single quadratic easing drives the book, camera and presentation. The small
// lift starts before horizontal travel, while both settle exactly at the end.
export function compactPickupSample(progress){
  const u=Math.max(0,Math.min(1,progress));
  const eased=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  return {eased,travel:Math.max(0,(eased-.12)/.88),lift:Math.sin(Math.PI*eased)};
}
export function startCompactPickup({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  let start=now(),frame=0,timer=0,finished=false;
  const finish=()=>{if(finished)return;finished=true;clearTimer(timer);cancel(frame);onFrame(compactPickupSample(1),1);onComplete();};
  const tick=time=>{if(finished)return;const u=Math.max(0,Math.min(1,(time-start)/850));if(u>=1)finish();else{onFrame(compactPickupSample(u),u);frame=request(tick);}};
  timer=setTimer(finish,2000);frame=request(tick);
  return ()=>{if(!finished){finished=true;clearTimer(timer);cancel(frame);}};
}

// Render the moving book over opaque destination props while retaining depth
// testing between its own cover, pages and spine. Restore all hooks on teardown.
export function prioritizeCompactBook(book){
  const saved=[];let lastFrame=-1,active=false;
  book.traverse(object=>{if(object.isMesh||object.isLine)saved.push({object,renderOrder:object.renderOrder,onBeforeRender:object.onBeforeRender});});
  const set=enabled=>{
    if(enabled===active)return;active=enabled;
    saved.forEach(({object,renderOrder,onBeforeRender})=>{
      object.renderOrder=enabled?1000:renderOrder;
      object.onBeforeRender=enabled?function(renderer,...args){
        if(renderer.info.render.frame!==lastFrame){lastFrame=renderer.info.render.frame;renderer.clearDepth();}
        onBeforeRender.call(this,renderer,...args);
      }:onBeforeRender;
    });
  };
  return {set,dispose(){set(false);}};
}

// Blend the shelf and the other book into the background while preserving
// depth testing, so their surfaces never show through each other.
export function createCompactSceneFade(root,excluded){
  const skipped=new Set(), originals=[], clones=new Map();
  excluded.traverse(object=>skipped.add(object));
  function cloneMaterial(original){
    if(clones.has(original))return clones.get(original);
    const clone=original.clone(),visibility={value:1};
    // Mix after the renderer's output colour conversion so this colour
    // matches the CSS background even under tone mapping and scene lights.
    const blend='\ngl_FragColor.rgb=mix(vec3(11.0/255.0,14.0/255.0,19.0/255.0),gl_FragColor.rgb,compactVisibility);';
    if(original.isShaderMaterial){
      // Keep artwork uniforms live when its texture finishes loading.
      clone.uniforms={...original.uniforms,compactVisibility:visibility};
      clone.fragmentShader='uniform float compactVisibility;\n'+clone.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>'+blend);
    }else{
      clone.onBeforeCompile=(shader,renderer)=>{
        original.onBeforeCompile.call(clone,shader,renderer);
        shader.uniforms.compactVisibility=visibility;
        shader.fragmentShader='uniform float compactVisibility;\n'+shader.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>'+blend);
      };
    }
    // Keep the fade shader distinct from the unfaded material.
    clone.customProgramCacheKey=()=>`compact-colour-blend-v1:${original.customProgramCacheKey()}`;
    // Keep the contact shadow transparent and the solid props opaque.
    clones.set(original,{clone,visibility});return clones.get(original);
  }
  root.traverse(object=>{
    if(skipped.has(object)||!object.material)return;
    const original=object.material;
    object.material=Array.isArray(original)?original.map(m=>cloneMaterial(m).clone):cloneMaterial(original).clone;
    originals.push({object,original,visible:object.visible});
  });
  let restored=false;
  return {
    set(value){
      if(restored)return;
      const x=Math.max(0,Math.min(1,(value-.5)/.45)),amount=x*x*(3-2*x);
      originals.forEach(({object,visible})=>{object.visible=visible&&amount>0;});
      for(const [original,{clone,visibility}] of clones){
        visibility.value=amount;
        // The neighboring book’s page-edge texture can arrive during the transition.
        if('map' in original&&clone.map!==original.map){clone.map=original.map;clone.needsUpdate=true;}
        if(original.color&&clone.color)clone.color.copy(original.color);
      }
    },
    dispose(){
      if(restored)return;restored=true;
      originals.forEach(({object,original,visible})=>{object.material=original;object.visible=visible;});
      clones.forEach(({clone})=>clone.dispose());
    }
  };
}
