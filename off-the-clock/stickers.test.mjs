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

async function stickerFixture(storage=new Map()){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}});
  const body=new THREE.Group(),lid=new THREE.Group();
  const system=await createStickerSystem({
    THREE:{...THREE,TextureLoader:class{async loadAsync(){return new THREE.Texture({width:512,height:512});}}},
    body,lid,stage:{getBoundingClientRect:()=>({left:0,top:0,right:600,bottom:600,width:600,height:600})},camera:new THREE.PerspectiveCamera(),
    W:2.16,H:2.9,D:4.15,T:.068,invalidate:()=>{}
  });
  await system.ready();
  return {body,lid,system,storage,cleanup(){system.dispose();if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}};
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
