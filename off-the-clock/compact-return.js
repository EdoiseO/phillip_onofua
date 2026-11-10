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

// A single cubic easing drives the book, camera and presentation. The small
// lift starts before horizontal travel, while both settle exactly at the end.
export function compactPickupSample(progress){
  const u=Math.max(0,Math.min(1,progress));
  const eased=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
  return {eased,travel:Math.max(0,(eased-.12)/.88),lift:Math.sin(Math.PI*eased)};
}
export function startCompactPickup({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  let start=now(),frame=0,timer=0,finished=false;
  const finish=()=>{if(finished)return;finished=true;clearTimer(timer);cancel(frame);onFrame(compactPickupSample(1),1);onComplete();};
  const tick=time=>{if(finished)return;const u=Math.max(0,Math.min(1,(time-start)/850));if(u>=1)finish();else{onFrame(compactPickupSample(u),u);frame=request(tick);}};
  timer=setTimer(finish,2000);frame=request(tick);
  return ()=>{if(!finished){finished=true;clearTimer(timer);cancel(frame);}};
}

// Fade only the destination scene, never the inspected book. Materials are
// cloned temporarily because the preview box shares materials with the real
// comic box; mutating them would fade the user's box too.
export function createCompactSceneFade(root,excluded){
  const skipped=new Set(), originals=[], clones=new Map();
  excluded.traverse(object=>skipped.add(object));
  function cloneMaterial(original){
    if(clones.has(original))return clones.get(original);
    const clone=original.clone(),baseOpacity=original.opacity;
    clone.transparent=true;clone.depthWrite=false;clone.opacity=0;
    if(original.isShaderMaterial){
      // The printed-cover shader emits alpha directly rather than using the
      // standard opacity uniform; retain its live artwork uniform by reference.
      clone.uniforms={...original.uniforms,compactFade:{value:0}};
      clone.fragmentShader='uniform float compactFade;\n'+clone.fragmentShader.replace(
        'gl_FragColor=vec4(ink*light+vec3(.9,.96,1.0)*(sheen+rim),1.0);',
        'gl_FragColor=vec4(ink*light+vec3(.9,.96,1.0)*(sheen+rim),compactFade);'
      );
    }
    clones.set(original,{clone,baseOpacity});return clones.get(original);
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
      const x=Math.max(0,Math.min(1,(value-.5)/.45)),alpha=x*x*(3-2*x);
      for(const [original,{clone,baseOpacity}] of clones){
        clone.opacity=baseOpacity*alpha;
        if(clone.uniforms?.compactFade)clone.uniforms.compactFade.value=baseOpacity*alpha;
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
