import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from './vendor/three.module.js';
import {comics} from './comics.js';
import {createComicBook} from './comic-book.js';
import {createComicSleeve,poseComicSleeve,posePackSleeve,FLAP_OPEN} from './comic-sleeve.js';
import {advanceReturnMotion,createReturnMotion,sampleSleeveRig,easeInOutSine} from './return-motion.js';
import {FILE_DURATION,PACK_DURATION,TEAR_THRESHOLD,BAG_SCALE,SHORT_BOX,SLOT_LEAN,collectionSlot,showTearStrip,tornPouchSeat,makePackEntries,sampleFile,samplePack,samplePouch,sampleTear,tearProgress} from './pack-motion.js';

// Load the exact GLBs served to visitors. Resolve the same vendor import map
// inside Node; textures are irrelevant to clearance, so only decode geometry.
const here=path=>new URL(path,import.meta.url);
const moduleUrl=(path,imports={})=>{
  let source=readFileSync(here(path),'utf8');
  for(const [from,to] of Object.entries(imports))source=source.replaceAll(`from '${from}'`,`from '${to}'`);
  return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
};
const vendor={'three':here('./vendor/three.module.js').href};
const loaderUrl=moduleUrl('./vendor/addons/loaders/GLTFLoader.js',{
  ...vendor,
  '../utils/BufferGeometryUtils.js':moduleUrl('./vendor/addons/utils/BufferGeometryUtils.js',vendor),
  '../utils/SkeletonUtils.js':moduleUrl('./vendor/addons/utils/SkeletonUtils.js',vendor),
});
const loadGlb=async name=>{
  globalThis.self=globalThis;
  globalThis.createImageBitmap=async()=>({width:4,height:4});
  globalThis.ProgressEvent??=class ProgressEvent{constructor(type,details){Object.assign(this,{type,...details});}};
  const {GLTFLoader}=await import(loaderUrl);
  const bytes=readFileSync(here(`./assets/models/${name}.glb`));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
};
const comicModel=loadGlb('comic-set');

function makeRig(template){
  const group=new THREE.Group(),booklet=createComicBook(THREE,{template}),bag=createComicSleeve(THREE,template);
  group.add(booklet.group,bag.group);
  return {group,booklet,book:booklet.group,bag,sleeve:bag.group};
}

const tri=new THREE.Triangle(),worldBounds=new THREE.Box3();
const positions=[];
function clearance(plastic,contents,where,space=null){
  const inverse=space?space.matrixWorld.clone().invert():new THREE.Matrix4();
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3();
  for(const [name,object] of contents){
    const bounds=new THREE.Box3();
    object.traverse(mesh=>{
      if(!mesh.isMesh)return;
      matrix.multiplyMatrices(inverse,mesh.matrixWorld);
      for(let i=0;i<mesh.geometry.attributes.position.count;i++)bounds.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(matrix));
    });
    plastic.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.visible)return;
      mesh.geometry.boundingBox??mesh.geometry.computeBoundingBox();
      matrix.multiplyMatrices(inverse,mesh.matrixWorld);
      if(!mesh.morphTargetInfluences&&!bounds.intersectsBox(worldBounds.copy(mesh.geometry.boundingBox).applyMatrix4(matrix)))return;
      const {index,attributes}=mesh.geometry;
      for(let i=0;i<attributes.position.count;i++){
        positions[i]??=new THREE.Vector3();
        mesh.getVertexPosition(i,positions[i]).applyMatrix4(matrix);
      }
      const count=index?.count??attributes.position.count;
      for(let i=0;i<count;i+=3){
        const a=positions[index?index.getX(i):i],b=positions[index?index.getX(i+1):i+1],c=positions[index?index.getX(i+2):i+2];
        assert.ok(!bounds.intersectsTriangle(tri.set(a,b,c)),`${where}: ${name} intersects ${mesh.name}`);
      }
    });
  }
}

test('regular extraction and Back to the box clear the actual film, welds and flap at 60 fps',async()=>{
  const rig=makeRig(await comicModel),state=createReturnMotion(1,1,true);
  const frames=Array.from({length:61},(_,i)=>i/60);
  for(let i=0;i<=Math.ceil(state.duration*60);i++)frames.push(advanceReturnMotion(state,i===0?0:1/60).extraction);
  for(const out of frames){
    poseComicSleeve(rig,sampleSleeveRig(out));
    rig.group.updateMatrixWorld(true);
    clearance(rig.bag.film,[['comic',rig.book],['board',rig.bag.board]],`regular extraction ${out.toFixed(4)}`,rig.sleeve);
  }
});

test('new sleeves receive the board and comic through the open mouth at 60 fps',async()=>{
  const rig=makeRig(await comicModel);
  for(let k=0;k<3;k++){
    for(let i=0;i<=PACK_DURATION*60;i++){
      const pose=samplePack(i/60,k);
      posePackSleeve(rig,pose);
      if(!pose.filmVisible)continue;
      rig.group.updateMatrixWorld(true);
      clearance(rig.bag.film,[['comic',rig.book],['board',rig.bag.board]],`pull ${k+1} at ${i/60}s`);
      if(pose.filmZ===0&&pose.bookY-pose.filmY>.025)assert.equal(pose.flap,1,'flap stays open during insertion');
    }
  }
});

test('pulls cross the posed blind bag mouth without touching the film at 60 fps',async()=>{
  const {scene,animations}=await loadGlb('blind-bag');
  const comic=(await comicModel).scene.getObjectByName('comic'),mesh=new THREE.Box3().setFromObject(comic,true);
  const mixer=new THREE.AnimationMixer(scene),clip=THREE.AnimationClip.findByName(animations,'tear_open');
  const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);
  action.clampWhenFinished=true;action.play();action.paused=true;
  const bagParts=['bag_body','fin_seal','seal_bottom','tear_strip'].map(name=>scene.getObjectByName(name));
  const object=new THREE.Mesh(new THREE.BoxGeometry(...mesh.getSize(new THREE.Vector3()).toArray()));
  for(let i=0;i<=60;i++){
    const time=i/60,pouch=samplePouch(time);
    action.time=sampleTear(time)*clip.duration;mixer.update(0);
    scene.position.y=pouch.y;scene.updateMatrixWorld(true);
    for(let k=0;k<3;k++){
      const p=samplePack(time,k);
      object.position.set(p.x,p.y,p.z);object.scale.setScalar(p.scale);object.updateMatrixWorld(true);
      for(const film of bagParts)clearance(film,[['pull',object]],`pouch, pull ${k+1} at ${time}s`);
    }
  }
});

test('pack poses are continuous at 60 fps and the actions are staggered',()=>{
  const first=Array.from({length:3},(_,i)=>samplePack(.30+i*.12,i));
  assert.deepEqual(first.map(p=>p.visible),[true,true,true]);
  for(const phone of [false,true])for(let k=0;k<3;k++){
    let previous=samplePack(0,k,phone);
    for(let f=1;f<=138;f++){
      const p=samplePack(f/60,k,phone);
      for(const key of ['x','y','z','bookY','boardY','filmY','filmZ','flap','scale']){
        assert.ok(Math.abs(p[key]-previous[key])<.43,`${key} jumps at frame ${f} for pull ${k+1}`);
      }
      if(p.boardVisible)assert.ok(p.filmVisible);
      previous=p;
    }
    assert.equal(previous.bookY,0);assert.equal(previous.boardY,0);assert.equal(previous.filmY,0);assert.equal(previous.flap,0);
  }
  const edge=sampleTear(.30,.54);
  assert.equal(edge,1);
  assert.equal(sampleTear(0,.54),.54);
});

test('tear follows the gesture in one direction and filing ends in three distinct entries',()=>{
  const a={x:200,y:5},b={x:100,y:5};
  assert.ok(tearProgress(a,b,-70,2)>=TEAR_THRESHOLD);
  assert.ok(tearProgress(a,b,-59,2)<TEAR_THRESHOLD);
  assert.equal(tearProgress(a,b,20,0),0);
  assert.equal(tearProgress(a,b,-200,0),1);
  for(const bag of comics.filter(c=>c.blindBag)){
    const entries=makePackEntries(bag);
    assert.equal(new Set(entries.map(c=>c.id)).size,3);
    for(let k=0;k<3;k++){
      assert.equal(entries[k].cover,bag.pulls[k].cover);
      assert.equal(entries[k].backCover,bag.pulls[k].back);
      assert.deepEqual(sampleFile(k*.2,k),{liftUp:0,reach:0,drop:0,arc:0});
      assert.equal(sampleFile(FILE_DURATION,k).drop,1);
      let previous=sampleFile(0,k);
      for(let f=1;f<=FILE_DURATION*60;f++){
        const next=sampleFile(f/60,k);
        assert.ok(next.reach-previous.reach<.07&&next.drop-previous.drop<.06);
        if(next.reach>.02)assert.equal(next.liftUp,1,'clear the rim before moving to a slot');
        if(next.drop>0)assert.equal(next.reach,1,'align with the slot before lowering');
        previous=next;
      }
    }
  }
});

test('the real sleeve flap opens fully before motion in both directions and closes only once seated or clear',async()=>{
  const rig=makeRig(await comicModel);
  // Read the front and back faces at the actual open mouth, excluding the
  // curved side welds. Compare this gap with both the comic and board depth.
  const mouthDepth=object=>{
    const top=new THREE.Box3().setFromObject(object,true).max.y;
    const depth=[];
    object.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const v=new THREE.Vector3();
      for(let i=0;i<mesh.geometry.attributes.position.count;i++){
        mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);
        if(v.y>top-.0005&&Math.abs(v.x)<.75)depth.push(v.z);
      }
    });
    assert.ok(depth.length);
    return depth;
  };
  poseComicSleeve(rig,sampleSleeveRig(.14));rig.group.updateMatrixWorld(true);
  const front=mouthDepth(rig.bag.film.getObjectByName('sleeve_front'));
  const back=mouthDepth(rig.bag.film.getObjectByName('sleeve_back'));
  const contents=new THREE.Box3().setFromObject(rig.book,true).union(new THREE.Box3().setFromObject(rig.bag.board,true));
  assert.equal(rig.bag.flap.rotation.x,FLAP_OPEN);
  assert.ok(Math.min(...front)-Math.max(...back)>contents.max.z-contents.min.z,
    'the physical mouth fits the comic and board depth together');
  for(const direction of [1,-1]){
    const backToBox=createReturnMotion(1,1,true);
    const travel=Array.from({length:69},(_,i)=>easeInOutSine(i/68));
    const ranges=direction===1?[travel]:[travel.toReversed(),
      Array.from({length:133},(_,i)=>advanceReturnMotion(backToBox,i===0?0:1/60).extraction)];
    for(const range of ranges){
      let previous=sampleSleeveRig(range[0]);
      assert.equal(previous.bagOpen,0);
      for(const out of range.slice(1)){
        const p=sampleSleeveRig(out);
        const moving=['pull','separate','lower','free'].some(key=>p[key]!==previous[key]);
        if(moving){
          assert.equal(previous.bagOpen,1,'the previous frame already has the flap fully open');
          assert.equal(p.bagOpen,1,'the flap stays open throughout the movement');
        }
        previous=p;
      }
      assert.equal(previous.bagOpen,0);
    }
  }
  for(let k=0;k<3;k++){
    let previous=samplePack(0,k);
    for(let i=1;i<=138;i++){
      const p=samplePack(i/60,k);
      if(['bookY','boardY','filmY','filmZ'].some(key=>p[key]!==previous[key])){
        assert.equal(p.flap,1,'board, book and film move only while the flap is open');
        assert.equal(previous.flap,1,'the flap is open before moving a pull');
      }
      previous=p;
    }
    assert.equal(previous.flap,0);
  }
});

test('the posed torn wrapper fits below the rim in every slot without the detached strip',async()=>{
  const {scene,animations}=await loadGlb('blind-bag');
  const clip=THREE.AnimationClip.findByName(animations,'tear_open');
  const mixer=new THREE.AnimationMixer(scene),action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);
  action.clampWhenFinished=true;action.play();action.paused=true;action.time=clip.duration;mixer.update(0);
  const strip=scene.getObjectByName('tear_strip');
  strip.visible=showTearStrip('filed',PACK_DURATION);
  assert.equal(strip.visible,false);
  assert.equal(showTearStrip('opening',1.02),false);
  assert.equal(showTearStrip('opening',.3),true);
  const {width,height,depth,wall}=SHORT_BOX;
  const interior=new THREE.Box3(new THREE.Vector3(-width/2+wall/2,wall,-depth/2+wall/2),new THREE.Vector3(width/2-wall/2,height,depth/2-wall/2));
  const card=new THREE.Group(),bounds=new THREE.Box3();
  card.add(scene);
  function measure(){
    card.updateMatrixWorld(true);bounds.makeEmpty();
    for(const name of ['bag_body','fin_seal','seal_bottom'])bounds.union(new THREE.Box3().setFromObject(scene.getObjectByName(name),true));
    return bounds;
  }
  const seat=tornPouchSeat(1);
  for(const count of [30,33,36])for(let index=0;index<count;index++){
    const slot=collectionSlot(index,count);
    card.position.set(slot.x,slot.y,slot.z);card.rotation.set(SLOT_LEAN,0,slot.roll);
    scene.scale.setScalar(BAG_SCALE);scene.position.y=0;
    assert.ok(measure().min.y<interior.min.y,'the old raised-display geometry clipped the box floor');
    scene.scale.setScalar(seat.scale);scene.position.y=seat.lift;
    assert.ok(interior.containsBox(measure()),`torn pouch outside the box at ${index+1}/${count}`);
  }
});
