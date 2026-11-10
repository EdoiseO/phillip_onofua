import test from 'node:test';
import assert from 'node:assert/strict';
import {startCompactReturn} from './compact-return.js';

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

test('destination fade uses temporary materials and restores shared box materials',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createCompactSceneFade}=await import('./compact-return.js');
  const root=new THREE.Group(),book=new THREE.Group(),paper=new THREE.MeshBasicMaterial({opacity:.7,transparent:true});
  const bookMesh=new THREE.Mesh(new THREE.BoxGeometry(),paper);book.add(bookMesh);root.add(book);
  const box=new THREE.Mesh(new THREE.BoxGeometry(),paper);root.add(box);
  const fade=createCompactSceneFade(root,book);
  assert.equal(bookMesh.material,paper,'the inspected book keeps its original material');
  assert.notEqual(box.material,paper,'the destination has an independent material');
  fade.set(0);assert.equal(box.material.opacity,0);assert.equal(paper.opacity,.7);
  fade.set(.75);assert.ok(box.material.opacity>0&&box.material.opacity<.7);
  fade.set(1);assert.equal(box.material.opacity,.7);
  fade.dispose();assert.equal(box.material,paper);assert.equal(paper.opacity,.7);
  fade.dispose();bookMesh.geometry.dispose();box.geometry.dispose();paper.dispose();
});

test('printed-cover fade preserves the original live art uniform',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createCompactSceneFade}=await import('./compact-return.js');
  const root=new THREE.Group(),book=new THREE.Group(),texture=new THREE.Texture();root.add(book);
  const original=new THREE.ShaderMaterial({uniforms:{art:{value:texture}},fragmentShader:'void main(){vec3 ink=vec3(1.);float light=1.;float sheen=0.;float rim=0.;gl_FragColor=vec4(ink*light+vec3(.9,.96,1.0)*(sheen+rim),1.0);}',vertexShader:'void main(){gl_Position=vec4(position,1.);}'});
  const object=new THREE.Mesh(new THREE.BoxGeometry(),original);root.add(object);
  const fade=createCompactSceneFade(root,book),temporary=object.material;
  assert.equal(temporary.uniforms.art,original.uniforms.art);
  assert.match(temporary.fragmentShader,/uniform float compactFade/);
  fade.set(0);assert.equal(temporary.uniforms.compactFade.value,0);
  fade.set(1);assert.equal(temporary.uniforms.compactFade.value,1);
  assert.equal(original.uniforms.compactFade,undefined);
  fade.dispose();assert.equal(object.material,original);
  object.geometry.dispose();original.dispose();texture.dispose();
});
