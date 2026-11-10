import {createReturnMotion, advanceReturnMotion} from './return-motion.js?v=1.0';

// Run a continuous return, with a watchdog so an interrupted animation cannot
// leave the display controls locked. Cancellation is reserved for teardown.
export function startCompactReturn({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  const motion=createReturnMotion(1,0,false);motion.duration=.7;
  let previous=now(),frame=0,timer=0,finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;clearTimer(timer);cancel(frame);onComplete();
  };
  const tick=time=>{
    if(finished)return;
    const dt=Math.min(.035,Math.max(0,(time-previous)/1000));previous=time;
    const state=advanceReturnMotion(motion,dt);
    onFrame(1-state.focus);
    if(state.done)finish();else frame=request(tick);
  };
  timer=setTimer(finish,2000);
  frame=request(tick);
  return ()=>{if(!finished){finished=true;clearTimer(timer);cancel(frame);}};
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
    originals.push({object,original});
  });
  let restored=false;
  return {
    set(value){
      if(restored)return;
      const x=Math.max(0,Math.min(1,(value-.5)/.45)),amount=x*x*(3-2*x);
      for(const [original,{clone,visibility}] of clones){
        visibility.value=amount;
        // Independent box stand-in photos can arrive during the transition.
        if('map' in original&&clone.map!==original.map){clone.map=original.map;clone.needsUpdate=true;}
        if(original.color&&clone.color)clone.color.copy(original.color);
      }
    },
    dispose(){
      if(restored)return;restored=true;
      originals.forEach(({object,original})=>{object.material=original;});
      clones.forEach(({clone})=>clone.dispose());
    }
  };
}
