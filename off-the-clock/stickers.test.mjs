import test from 'node:test';
import assert from 'node:assert/strict';
import {wallPoint,validSticker} from './stickers.js';

const width=2.228,depth=4.218,perimeter=2*(width+depth);
test('artwork crosses every vertical corner without a position discontinuity',()=>{
  for(const corner of [width/2,width/2+depth,width*1.5+depth,-width/2]){
    const a=wallPoint(corner-.00001,1.2,width,depth),b=wallPoint(corner+.00001,1.2,width,depth);
    assert.ok(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.00003);
    assert.equal(a.normal.reduce((sum,v,i)=>sum+v*b.normal[i],0),0);
  }
});
test('a sticker can wrap over the perimeter seam in either direction',()=>{
  for(const s of [-28,-1.2,0,1.1,3.4,9,30]){
    const a=wallPoint(s,1,width,depth),b=wallPoint(s+perimeter,1,width,depth);
    a.position.forEach((v,i)=>assert.ok(Math.abs(v-b.position[i])<1e-10));
  }
});
test('all wall samples stay on the shell, with unit outward normals',()=>{
  for(let s=-20;s<20;s+=.137){
    const {position:[x,y,z],normal:n}=wallPoint(s,1.2,width,depth);
    assert.equal(y,1.2);assert.ok(Math.abs(x)<=width/2+1e-10);assert.ok(Math.abs(z)<=depth/2+1e-10);
    assert.ok(Math.abs(Math.abs(x)-width/2)<1e-10||Math.abs(Math.abs(z)-depth/2)<1e-10);
    assert.equal(Math.hypot(...n),1);assert.ok(x*n[0]+z*n[2]>0);
  }
});
test('saved stickers reject corrupt, unbounded, or unknown data',()=>{
  const good={art:'marvel',surface:'wall',u:.9,v:1,size:1,angle:-12,finish:'gloss'};
  assert.ok(validSticker(good));
  for(const bad of [null,{}, {...good,art:'url'}, {...good,u:Infinity}, {...good,size:99}, {...good,v:NaN}, {...good,surface:'comic'}, {...good,angle:900}, {...good,finish:'unknown'}])assert.ok(!validSticker(bad));
});

// Exercise the real Three.js geometry without a browser or a network loader.
// These regressions guard the work done during dragging and overlapping placement.
import * as THREE from './vendor/three.module.js';
import {createStickerSystem,STORAGE_KEY} from './stickers.js';

async function stickerFixture(storage=new Map(),image={width:512,height:512}){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}});
  const body=new THREE.Group(),lid=new THREE.Group(),camera=new THREE.PerspectiveCamera(40,1,.1,30);
  camera.position.set(0,1.3,8);camera.lookAt(0,1.3,0);camera.updateMatrixWorld();
  const system=await createStickerSystem({
    THREE:{...THREE,TextureLoader:class{async loadAsync(){return new THREE.Texture(image);}}},
    body,lid,stage:{getBoundingClientRect:()=>({left:0,top:0,right:600,bottom:600,width:600,height:600})},camera,
    W:2.16,H:2.9,D:4.15,T:.068,invalidate:()=>{}
  });
  await system.ready();
  return {body,lid,camera,system,storage,cleanup(){system.dispose();if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}};
}
const placement={art:'marvel',surface:'wall',u:.9,v:1.3,size:1,angle:-12,finish:'gloss'};

test('dragging reuses the preview mesh, buffers, and material, including a wall-to-lid move',async()=>{
  const f=await stickerFixture();
  try{
    f.system.setDraft(placement);
    const mesh=f.body.children[0],geometry=mesh.geometry,material=mesh.material,positions=geometry.attributes.position.array;
    let disposals=0;geometry.addEventListener('dispose',()=>disposals++);material.addEventListener('dispose',()=>disposals++);
    for(let i=0;i<120;i++)f.system.setDraft({...placement,u:.1+i*.013});
    f.system.setDraft({...placement,surface:'lid',u:.3,v:0,art:'batman',finish:'holo'});
    assert.equal(f.lid.children[0],mesh);assert.equal(f.body.children.length,0);
    assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);assert.equal(geometry.attributes.position.array,positions);
    assert.equal(disposals,0);assert.ok(material.iridescence>0);assert.ok(geometry.boundingBox.isEmpty()===false);
    assert.ok(f.system.place());assert.equal(f.lid.children[0],mesh);assert.equal(disposals,0);
    f.system.tick(1,true);assert.ok(Number.isFinite(geometry.boundingSphere.radius));
  }finally{f.cleanup();}
});

test('24 overlapping stickers keep insertion order through animation, save, reload and undo',async()=>{
  const storage=new Map();let f=await stickerFixture(storage);
  const verify=()=>{
    assert.equal(f.system.count(),24);assert.equal(f.body.children.length,24);
    const orders=f.body.children.map(mesh=>mesh.renderOrder);
    assert.equal(new Set(orders).size,24);assert.deepEqual(orders,[...orders].sort((a,b)=>a-b));
    for(const mesh of f.body.children){
      assert.equal(mesh.material.depthWrite,false);assert.equal(mesh.material.depthTest,true);
      assert.equal(mesh.material.forceSinglePass,true);assert.ok(mesh.material.alphaTest>0);
    }
  };
  try{
    for(let i=0;i<24;i++){f.system.setDraft({...placement,art:i%2?'marvel':'omnitrix'});assert.ok(f.system.place());f.system.tick(.016,false);}
    verify();assert.equal(JSON.parse(storage.get(STORAGE_KEY)).length,24);
    f.system.setDraft(placement);assert.equal(f.system.place(),false);f.system.clearDraft();
    f.system.tick(1,true);verify();
    f.system.reset();assert.equal(f.system.count(),0);f.system.undo();verify();
  }finally{f.cleanup();}
  f=await stickerFixture(storage);
  try{verify();assert.equal(f.system.pick(-1,300),null);assert.equal(f.system.pick(300,601),null);}finally{f.cleanup();}
});

test('switching Holo on and off restores Gloss without rebuilding on every adjustment',async()=>{
  const f=await stickerFixture();
  try{
    f.system.setDraft(placement);
    const mesh=f.body.children[0],material=mesh.material,geometry=mesh.geometry;
    const gloss={roughness:material.roughness,metalness:material.metalness,clearcoatRoughness:material.clearcoatRoughness};
    f.system.setDraft({...placement,finish:'holo'});
    assert.ok(material.iridescence>0);
    const compiledVersion=material.version;
    for(let angle=0;angle<40;angle++)f.system.setDraft({...placement,finish:'holo',angle});
    assert.equal(material.version,compiledVersion,'moving a Holo sticker should not recompile its shader');
    f.system.setDraft(placement);
    assert.equal(material.iridescence,0);
    for(const [key,value] of Object.entries(gloss))assert.equal(material[key],value);
    assert.equal(f.body.children[0],mesh);
    assert.equal(mesh.geometry,geometry);
    assert.equal(mesh.material,material);
  }finally{f.cleanup();}
});

test('a rotated lid preview fits, keeps its reported size on repeated edits, and saves exactly that transform',async()=>{
  const f=await stickerFixture();
  try{
    let data=f.system.setDraft({...placement,art:'batman',surface:'lid',u:1,v:2,size:1.65,angle:45});
    assert.ok(data.size<1.65);assert.ok(Math.abs(Math.round(data.size*100)-data.size*100)<1e-8);
    const original={...data};
    for(let i=0;i<50;i++){data=f.system.setDraft(data);assert.equal(data.size,original.size);assert.equal(data.angle,original.angle);assert.ok(Math.abs(data.u-original.u)<1e-10&&Math.abs(data.v-original.v)<1e-10);}
    const mesh=f.lid.children[0],bounds=mesh.geometry.boundingBox;
    assert.ok(bounds.min.x>=-1.13001&&bounds.max.x<=1.13001);
    assert.ok(bounds.min.z>=-2.10501&&bounds.max.z<=2.10501);
    const positions=mesh.geometry.attributes.position.array.slice();
    assert.equal(f.system.count(),0);assert.equal(f.storage.has(STORAGE_KEY),false);
    assert.ok(f.system.place());f.system.tick(1,true);
    assert.deepEqual(mesh.geometry.attributes.position.array,positions);
    assert.deepEqual(JSON.parse(f.storage.get(STORAGE_KEY)),[data]);
  }finally{f.cleanup();}
});

test('preview picking ignores transparent cutouts, hidden surfaces, and hidden drafts',async()=>{
  const pixels=new Uint8ClampedArray(4*4*4);
  for(const i of [5,6,9,10])pixels[i*4+3]=255;
  const f=await stickerFixture(new Map(),{width:4,height:4,data:pixels});
  const screen=point=>{const p=new THREE.Vector3(...point).project(f.camera);return [(p.x+1)*300,(1-p.y)*300];};
  try{
    f.system.setDraft({...placement,u:0,angle:0});
    assert.equal(f.system.hitDraft(300,300),true);
    assert.equal(f.system.hitDraft(...screen([.5,1.8,depth/2+.024])),false);
    f.system.showDraft(false);assert.equal(f.system.hitDraft(300,300),false);assert.equal(f.system.place(),false);
    f.system.showDraft(true);assert.equal(f.system.hitDraft(300,300),true);
    f.system.setDraft({...placement,u:width+depth,angle:0});
    assert.equal(f.system.hitDraft(300,300),false);
  }finally{f.cleanup();}
});

test('developer stickers save and reload alongside the original collection',async()=>{
  const storage=new Map();let f=await stickerFixture(storage);
  const arts=['marvel','javascript','typescript','python','cplusplus','html5','css3'];
  try{
    for(const [i,art] of arts.entries()){
      const data=f.system.setDraft({...placement,art,surface:i%2?'lid':'wall',finish:i%2?'holo':'gloss'});
      assert.ok(validSticker(data));assert.ok(f.system.place());
    }
    assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)).map(item=>item.art),arts);
  }finally{f.cleanup();}
  f=await stickerFixture(storage);
  try{
    assert.equal(f.system.count(),arts.length);
    assert.equal(f.body.children.length+f.lid.children.length,arts.length);
    f.system.setDraft({...placement,art:'python'});assert.ok(f.system.place());
    f.system.undo();assert.equal(f.system.count(),arts.length);
    assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)).map(item=>item.art),arts);
  }finally{f.cleanup();}
});
