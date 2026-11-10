import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldReturnFromCompactTap, startCompactReturn} from './compact-return.js';

test('compact inspection returns only for a settled tap entirely off the book', () => {
  const tap = {startedOnBook: false, endedOnBook: false, distance: 6.99, elapsed: 451};
  assert.equal(shouldReturnFromCompactTap(tap), true);
  assert.equal(shouldReturnFromCompactTap({...tap, startedOnBook: true}), false);
  assert.equal(shouldReturnFromCompactTap({...tap, endedOnBook: true}), false);
  assert.equal(shouldReturnFromCompactTap({...tap, distance: 7}), false);
  assert.equal(shouldReturnFromCompactTap({...tap, elapsed: 450}), false);
});

function simulatedScheduler(){
  let id=0;const frames=new Map(),timers=new Map();
  return {
    request(cb){frames.set(++id,cb);return id;},cancel(id){frames.delete(id);},
    setTimer(cb){timers.set(++id,cb);return id;},clearTimer(id){timers.delete(id);},now:()=>0,
    frame(time){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(time));},
    timeout(){const callbacks=[...timers.values()];timers.clear();callbacks.forEach(cb=>cb());},
    pending(){return {frames:frames.size,timers:timers.size};}
  };
}

test('compact return advances continuously and unlocks after reaching the destination',()=>{
  const scheduler=simulatedScheduler();let locked=true,completions=0;const samples=[];
  startCompactReturn({...scheduler,onFrame:t=>samples.push(t),onComplete(){locked=false;completions++;}});
  for(let time=16;time<1200&&locked;time+=16)scheduler.frame(time);
  assert.equal(locked,false,'return must release controls');
  assert.equal(completions,1);assert.equal(samples.at(-1),1);
  assert.ok(samples.some(t=>t>0&&t<1),'book moves through intermediate poses');
  assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
  scheduler.timeout();assert.equal(completions,1);
});

test('compact return watchdog unlocks if animation frames stop',()=>{
  const scheduler=simulatedScheduler();let locked=true,completions=0;
  startCompactReturn({...scheduler,onFrame(){},onComplete(){locked=false;completions++;}});
  scheduler.timeout();assert.equal(locked,false);assert.equal(completions,1);
  assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});

test('closing a compact display cancels pending return callbacks',()=>{
  const scheduler=simulatedScheduler();let completions=0;
  const cancel=startCompactReturn({...scheduler,onFrame(){},onComplete(){completions++;}});
  cancel();scheduler.frame(16);scheduler.timeout();
  assert.equal(completions,0);assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});

test('destination colour blend keeps box opaque and preserves intentional transparent details',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createCompactSceneFade}=await import('./compact-return.js');
  const root=new THREE.Group(),book=new THREE.Group(),wall=new THREE.MeshBasicMaterial(),detail=new THREE.MeshBasicMaterial({opacity:.7,transparent:true,depthWrite:false});
  wall.customProgramCacheKey=()=> 'wall-with-special-print';wall.onBeforeCompile=shader=>{shader.fragmentShader='// special print\n'+shader.fragmentShader;};
  const bookMesh=new THREE.Mesh(new THREE.BoxGeometry(),wall);book.add(bookMesh);root.add(book);
  const box=new THREE.Mesh(new THREE.BoxGeometry(),wall),decal=new THREE.Mesh(new THREE.BoxGeometry(),detail);root.add(box,decal);
  const fade=createCompactSceneFade(root,book);
  assert.equal(bookMesh.material,wall,'the inspected book keeps its original material');
  assert.notEqual(box.material,wall,'the destination has an independent material');
  const shader={uniforms:{},fragmentShader:'void main(){\n#include <colorspace_fragment>\n}'};
  box.material.onBeforeCompile(shader,{});
  assert.match(shader.fragmentShader,/special print/,'existing material shader hooks are preserved');
  assert.equal(box.material.customProgramCacheKey(),'compact-colour-blend-v1:wall-with-special-print');
  assert.notEqual(box.material.customProgramCacheKey(),wall.customProgramCacheKey());
  assert.match(shader.fragmentShader,/#include <colorspace_fragment>\s*gl_FragColor.rgb=mix/);
  for(const value of [0,.75,1]){
    fade.set(value);
    assert.equal(box.visible,value!==0);
    assert.equal(box.material.transparent,false);assert.equal(box.material.depthWrite,true);assert.equal(box.material.opacity,1);
    assert.equal(decal.material.transparent,true);assert.equal(decal.material.depthWrite,false);assert.equal(decal.material.opacity,.7);
    if(value===0)assert.equal(shader.uniforms.compactVisibility.value,0);
    if(value===.75)assert.ok(shader.uniforms.compactVisibility.value>0&&shader.uniforms.compactVisibility.value<1);
    if(value===1)assert.equal(shader.uniforms.compactVisibility.value,1);
  }
  const lateMap=new THREE.Texture();wall.map=lateMap;fade.set(.75);assert.equal(box.material.map,lateMap,'late box photos update the temporary material');
  fade.dispose();assert.equal(box.material,wall);assert.equal(decal.material,detail);assert.equal(box.visible,true);
  fade.dispose();bookMesh.geometry.dispose();box.geometry.dispose();decal.geometry.dispose();wall.dispose();detail.dispose();lateMap.dispose();
});

test('printed-cover fade preserves the original live art uniform',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createCompactSceneFade}=await import('./compact-return.js');
  const root=new THREE.Group(),book=new THREE.Group(),texture=new THREE.Texture();root.add(book);
  const original=new THREE.ShaderMaterial({uniforms:{art:{value:texture}},fragmentShader:'void main(){gl_FragColor=vec4(1.);\n#include <colorspace_fragment>\n}',vertexShader:'void main(){gl_Position=vec4(position,1.);}'});
  const object=new THREE.Mesh(new THREE.BoxGeometry(),original);root.add(object);
  const fade=createCompactSceneFade(root,book),temporary=object.material;
  assert.equal(temporary.uniforms.art,original.uniforms.art);
  assert.match(temporary.fragmentShader,/#include <colorspace_fragment>\s*gl_FragColor.rgb=mix/);
  fade.set(0);assert.equal(temporary.uniforms.compactVisibility.value,0);assert.equal(temporary.transparent,false);assert.equal(temporary.depthWrite,true);
  fade.set(1);assert.equal(temporary.uniforms.compactVisibility.value,1);
  assert.equal(original.uniforms.compactVisibility,undefined);
  fade.dispose();assert.equal(object.material,original);
  object.geometry.dispose();original.dispose();texture.dispose();
});

test('compact pickup moves continuously and reaches its destination before unlocking', async()=>{
  const {startCompactPickup}=await import('./compact-return.js');
  const scheduler=simulatedScheduler();let locked=true,completed=0;const samples=[];
  startCompactPickup({...scheduler,onFrame:sample=>samples.push(sample),onComplete(){assert.deepEqual(samples.at(-1),{eased:1,travel:1,lift:Math.sin(Math.PI)});locked=false;completed++;}});
  for(let time=0;time<1200&&locked;time+=1000/60)scheduler.frame(time);
  assert.equal(locked,false);assert.equal(completed,1);assert.equal(samples[0].eased,0);
  assert.ok(samples.some(s=>s.lift>0&&s.travel===0),'lift begins before the book travels');
  for(let i=1;i<samples.length;i++)for(const key of ['eased','travel','lift'])assert.ok(Math.abs(samples[i][key]-samples[i-1][key])<.1,`${key} must not jump at frame ${i}`);
  assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});

test('compact pickup eases gently across the full trip',async()=>{
  const {compactPickupSample}=await import('./compact-return.js');
  assert.equal(compactPickupSample(.25).eased,.125);
  assert.equal(compactPickupSample(.5).eased,.5);
  assert.equal(compactPickupSample(.75).eased,.875);
});

test('compact pickup watchdog reaches destination and releases input exactly once',async()=>{
  const {startCompactPickup}=await import('./compact-return.js');
  const scheduler=simulatedScheduler();let locked=true,completed=0,last;
  startCompactPickup({...scheduler,onFrame:sample=>last=sample,onComplete(){locked=false;completed++;}});
  scheduler.timeout();assert.equal(last.travel,1);assert.equal(locked,false);assert.equal(completed,1);assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
  scheduler.frame(900);assert.equal(completed,1);
});

test('closing during pickup cancels frames and the watchdog',async()=>{
  const {startCompactPickup}=await import('./compact-return.js');const scheduler=simulatedScheduler();let completed=0;
  const cancel=startCompactPickup({...scheduler,onFrame(){},onComplete(){completed++;}});cancel();scheduler.frame(900);scheduler.timeout();
  assert.equal(completed,0);assert.deepEqual(scheduler.pending(),{frames:0,timers:0});
});

test('pickup target and rebuilt close-up use the same camera for desktop and phone',async()=>{
  const THREE=await import('./vendor/three.module.js');const {frameCompactBounds}=await import('./compact-return.js');
  const book=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.7,.36));book.rotation.set(-.06,-.5,0);book.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(book);
  for(const [width,height] of [[1280,680],[375,600]]){
    const target=new THREE.PerspectiveCamera(),rebuilt=new THREE.PerspectiveCamera();
    frameCompactBounds(THREE,target,bounds,width,height);frameCompactBounds(THREE,rebuilt,bounds,width,height);
    assert.ok(target.position.distanceTo(rebuilt.position)<1e-12);assert.ok(target.quaternion.angleTo(rebuilt.quaternion)<1e-7);
    assert.equal(target.fov,rebuilt.fov);assert.equal(target.aspect,rebuilt.aspect);
  }
  book.geometry.dispose();
});


test('UI swap never overlaps and is driven by elapsed progress',async()=>{
  const {compactUiOpacity}=await import('./compact-return.js');
  assert.deepEqual(compactUiOpacity(0),{outgoing:1,incoming:0});
  assert.deepEqual(compactUiOpacity(.45),{outgoing:0,incoming:0});
  assert.deepEqual(compactUiOpacity(.55),{outgoing:0,incoming:0});
  assert.deepEqual(compactUiOpacity(1),{outgoing:0,incoming:1});
  for(let i=0;i<=100;i++){const {outgoing,incoming}=compactUiOpacity(i/100);assert.ok(outgoing===0||incoming===0,`UI overlaps at ${i}%`);}
});

test('return watchdog renders final UI progress before completion',()=>{
  const scheduler=simulatedScheduler();let last,done=false;
  startCompactReturn({...scheduler,onFrame:(position,progress)=>last={position,progress},onComplete(){done=true;assert.deepEqual(last,{position:1,progress:1});}});
  scheduler.timeout();assert.equal(done,true);
});

test('moving book retains its own depth while rendering over props and restores hooks',async()=>{
  const THREE=await import('./vendor/three.module.js');const {prioritizeCompactBook}=await import('./compact-return.js');
  const book=new THREE.Group(),a=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),b=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  let originalCalls=0,clears=0;a.renderOrder=3;a.onBeforeRender=()=>originalCalls++;book.add(a,b);const original=a.onBeforeRender;
  const restore=prioritizeCompactBook(book),renderer={info:{render:{frame:1}},clearDepth(){clears++;}};
  restore.set(true);assert.equal(a.renderOrder,1000);a.onBeforeRender(renderer);b.onBeforeRender(renderer);assert.equal(clears,1);assert.equal(originalCalls,1);
  renderer.info.render.frame++;a.onBeforeRender(renderer);assert.equal(clears,2);restore.set(false);assert.equal(a.renderOrder,3);assert.equal(a.onBeforeRender,original);restore.dispose();
  a.geometry.dispose();a.material.dispose();b.geometry.dispose();b.material.dispose();
});
