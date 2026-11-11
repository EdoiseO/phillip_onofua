import {createReturnMotion, advanceReturnMotion} from './return-motion.js?v=1.11';

export function shouldReturnFromCompactTap({startedOnBook, endedOnBook, distance, elapsed}) {
  return !startedOnBook && !endedOnBook && distance < 7 && elapsed > 450;
}

// Run a continuous return, with a watchdog so an interrupted animation cannot
// leave the display controls locked. Cancellation is reserved for teardown.
export function startCompactReturn({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  const motion=createReturnMotion(1,0,false);motion.duration=.7;
  let previous=now(),frame=0,timer=0,finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;clearTimer(timer);cancel(frame);onFrame(1,1);onComplete();
  };
  const tick=time=>{
    if(finished)return;
    const dt=Math.min(.035,Math.max(0,(time-previous)/1000));previous=time;
    const state=advanceReturnMotion(motion,dt);
    onFrame(1-state.focus,Math.min(1,motion.elapsed/motion.duration));
    if(state.done)finish();else frame=request(tick);
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

// The rear book sits clear of Green Arrow. During its trip to the close-up it
// travels around the other book, then follows the same arc in reverse.
export const COMPACT_STAND_POSES=[
  [2.53,1.49,-.40,-.14,0,-.07],
  [1.68,1.49,.02,-.14,0,.05]
];
export function standReturnArc(index,fromRotation,frontRotation){
  // When returning from a rotated inspection, give its wider swept volume
  // additional clearance. Normal front-view returns keep the shorter arc.
  const rotated=Math.min(1,fromRotation.angleTo(frontRotation)/.7);
  return index===0?-1-2*rotated:rotated;
}
export function interpolateCompactBook(book,fromPosition,toPosition,fromRotation,toRotation,progress,{lift=0,standArc=0}={}){
  book.position.lerpVectors(fromPosition,toPosition,progress);
  book.position.y+=.25*lift;
  book.position.z+=standArc*Math.sin(Math.PI*progress);
  book.quaternion.slerpQuaternions(fromRotation,toRotation,progress);
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

// Blend props into the dialog background without making opaque box walls
// transparent. Otherwise the walls, artwork and comics inside become visible
// through one another during pickup and return. Materials are temporary: the
// preview box shares some of them with the live comic box.
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
    // Different original hooks (such as holographic stickers) need distinct
    // shader programs; they must not collide with an unmodified live material.
    clone.customProgramCacheKey=()=>`compact-colour-blend-v1:${original.customProgramCacheKey()}`;
    // Keep intrinsic transparency (clear acrylic, decals and soft shadows),
    // but never turn an opaque wall into a translucent one.
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
        // Independent box stand-in photos can arrive during the transition.
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
