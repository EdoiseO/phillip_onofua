// A sealed premium mystery bag. The pouch, its tear and the falling strip
// come from the reviewed glTF; the three pulls reuse the site's comic model.
import { loadModel } from './models.js?v=38.0';
import { createComicBook } from './comic-book.js?v=40.0';
import { createComicSleeve, posePackSleeve } from './comic-sleeve.js?v=40.3';
import { BAG_SCALE, PACK_DURATION, samplePack, samplePouch, sampleTear, showTearStrip, tornPouchSeat } from './pack-motion.js?v=1.3';

// The modelled pack is taller than a bagged comic. At 0.9 it stands in the
// short box like the sleeved comics, and its comics still clear the film.
export const loadBlindBag=()=>loadModel('./assets/models/blind-bag.glb');

export function createBlindBag(THREE,gltf,{comicModel,frontTexture=null,backTexture=null,pullTextures=[],pullBacks=[],pulls}){
  const smooth=(a,b,v)=>THREE.MathUtils.smoothstep(v,a,b);
  const group=new THREE.Group();group.name='blind-bag';
  const bag=gltf.scene.clone(true);bag.scale.setScalar(BAG_SCALE);group.add(bag);
  // glTF UVs expect unflipped images. Share the loaded cover, not a copy of its pixels.
  const unflipped=texture=>{const t=texture.clone();t.flipY=false;t.needsUpdate=true;return t;};
  const ownTextures=[],artMeshes={front:[],back:[]},fins=[];
  bag.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();
    const name=o.material.name;
    o.userData.baseColor=o.material.color.clone();
    // Dither the disappearing wrapper, keeping depth writes on while it sinks.
    o.material.alphaHash=true;
    if(name==='art_front')artMeshes.front.push(o);
    if(name==='art_back')artMeshes.back.push(o);
    if(name.startsWith('fin_'))fins.push(o);
  });
  // Photographs can arrive after the bag is built; until then the art faces stay plain film.
  function setArt(side,texture){
    for(const o of artMeshes[side]){
      // Only dispose maps this bag made; a glTF default map belongs to the shared model.
      const owned=ownTextures.indexOf(o.material.map);
      if(owned>=0){ownTextures.splice(owned,1);o.material.map.dispose();}
      if(texture){o.material.map=unflipped(texture);o.material.color.copy(o.userData.baseColor);ownTextures.push(o.material.map);}
      else{o.material.map=null;if(side==='back')o.material.color.set(0xe7e7e2);}
      o.material.needsUpdate=true;
    }
    // A photographed back already shows its own printed fin seam.
    if(side==='back')fins.forEach(o=>{o.visible=!texture;});
  }
  if(frontTexture)setArt('front',frontTexture);
  setArt('back',backTexture);
  const strip=bag.getObjectByName('tear_strip');
  const pouch=['bag_body','seal_bottom'].map(name=>bag.getObjectByName(name));
  const mixer=new THREE.AnimationMixer(bag);
  const clip=name=>THREE.AnimationClip.findByName(gltf.animations,name);
  const tear=mixer.clipAction(clip('tear_open')),crinkle=mixer.clipAction(clip('hover'));
  for(const action of [tear,crinkle]){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.paused=true;}
  const tearDuration=tear.getClip().duration,crinkleDuration=crinkle.getClip().duration;

  // A pull and its own sleeve share one rig, including while filing. Build
  // all geometry without asking the artwork loader to do any additional work.
  const pullGroup=new THREE.Group();pullGroup.scale.setScalar(BAG_SCALE);group.add(pullGroup);
  const entries=pulls.map((pull,k)=>{
    const booklet=createComicBook(THREE,{template:comicModel,frontTexture:pullTextures[k]??null,backTexture:pullBacks[k]??null,foil:pull.finish==='foil'});
    const bag=createComicSleeve(THREE,comicModel);
    const rig=new THREE.Group();rig.userData.pullIndex=k;
    rig.add(booklet.group,bag.group);pullGroup.add(rig);
    return {group:rig,book:booklet.group,booklet,sleeve:bag.group,bag};
  });
  const tearEnds=[new THREE.Vector3(.94,1.456,.058),new THREE.Vector3(-.94,1.456,.058)];
  const projected=tearEnds.map(v=>v.clone()), partBounds=new THREE.Box3(), pullBounds=new THREE.Box3();

  let phase='sealed',time=0,tearTime=0,tearFrom=0,crinkleTime=-1,spring=null,hover=-1;
  let watchdog,resolveOpen,show=0,phone=false,wrapperOpacity=1,filing=false,seated=0;
  const tilts=entries.map(()=>0);
  function pose(){
    const pouchFrame=samplePouch(time),row=phase==='row';
    const rowAmount=row?smooth(.48,.94,show):1;
    wrapperOpacity=phase==='filed'?(filing?1-show:1):pouchFrame.opacity*(row?rowAmount:1)+(row?1-rowAmount:0);
    bag.visible=wrapperOpacity>.001;
    // Once torn, the bottom seal is too low for the box floor in the
    // presentation pose. Ease into a slightly smaller, raised seat.
    const seat=tornPouchSeat(phase==='filed'||row?seated:0);
    bag.position.y=(phase==='opening'?pouchFrame.y:0)+seat.lift;
    bag.scale.setScalar(seat.scale);
    bag.traverse(o=>{if(o.isMesh)o.material.opacity=wrapperOpacity;});
    strip.visible=showTearStrip(phase,time);
    const sealed=tearTime===0;
    tear.enabled=!sealed||crinkleTime<0;crinkle.enabled=sealed&&crinkleTime>=0;
    tear.time=phase==='filed'?tearDuration:tearTime;crinkle.time=Math.max(0,crinkleTime);mixer.update(0);
    pullGroup.visible=phase==='opening'||(row&&rowAmount>.001);
    if(phase!=='filed')entries.forEach((entry,k)=>{
      const {group:rig}=entry;
      const p=samplePack(time,k,phone);
      rig.visible=p.visible;
      rig.position.set(p.x,p.y+3.25*(1-rowAmount),p.z);
      rig.rotation.set(tilts[k]*.065,p.yaw-tilts[k]*.105,p.roll);
      rig.scale.setScalar(p.scale*Math.max(.0001,rowAmount));
      posePackSleeve(entry,p);
    });
  }
  function finishOpening(){
    if(phase!=='opening')return;
    clearTimeout(watchdog);phase='row';time=PACK_DURATION;tearTime=tearDuration;pose();
    const resolve=resolveOpen;resolveOpen=undefined;resolve?.(true);
  }
  pose();
  return {
    group,
    get phase(){return phase;},
    scrub(value){
      if(phase!=='sealed')return;
      spring=null;crinkleTime=-1;tearTime=.91*Math.max(0,Math.min(1,value));pose();
    },
    cancelTear(){if(phase==='sealed'&&tearTime>0)spring={start:tearTime,time:0};},
    open(reduced){
      if(phase!=='sealed')return Promise.resolve(false);
      phase='opening';time=0;tearFrom=tearTime/tearDuration;crinkleTime=-1;spring=null;
      return new Promise(resolve=>{
        resolveOpen=resolve;
        if(reduced)finishOpening();
        else watchdog=setTimeout(finishOpening,PACK_DURATION*1000+800);
      });
    },
    crinkle(){if(phase==='sealed'&&tearTime===0)crinkleTime=0;},
    hover(index){hover=index;},
    takePulls(){
      if(phase!=='row')return [];
      phase='filed';filing=true;pose();return entries;
    },
    showKeepsake(){filing=false;pose();},
    tick(dt,reduced,presentation,isPhone,seat){
      if(phase==='sealed'&&crinkleTime<0&&!spring)return false;
      show=presentation;phone=isPhone;seated=seat;
      if(spring){
        spring.time+=dt;tearTime=spring.start*(1-smooth(0,.26,spring.time));
        if(tearTime===0)spring=null;
      }
      if(crinkleTime>=0){crinkleTime=reduced?-1:crinkleTime+dt;if(crinkleTime>crinkleDuration)crinkleTime=-1;}
      if(phase==='opening'){
        time+=dt;tearTime=tearDuration*sampleTear(time,tearFrom);
        if(reduced||time>=PACK_DURATION)finishOpening();
      }
      let tilting=false;
      if(phase==='row')tilts.forEach((value,k)=>{
        const wanted=!reduced&&hover===k?1:0;
        tilts[k]=THREE.MathUtils.damp(value,wanted,dt,12);
        if(Math.abs(tilts[k]-wanted)<.001)tilts[k]=wanted;
        tilting||=value!==tilts[k];
      });
      pose();
      return phase==='opening'||spring!==null||crinkleTime>=0||tilting;
    },
    tearGuide(camera){
      if(phase!=='sealed')return null;
      bag.updateWorldMatrix(true,false);
      return projected.map((v,i)=>v.copy(tearEnds[i]).applyMatrix4(bag.matrixWorld).project(camera));
    },
    // Do not frame the detached strip. Ease the sinking pouch
    // out of the fit so its last visible pixels cannot jerk the camera.
    bounds(target){
      target.makeEmpty();pullBounds.makeEmpty();
      for(const part of pouch)target.expandByObject(part);
      if(pullGroup.visible)for(const {group:rig,book} of entries)if(rig.visible)pullBounds.expandByObject(book);
      if(!pullBounds.isEmpty()){
        if(wrapperOpacity>.001){
          partBounds.copy(target).union(pullBounds);
          target.min.copy(pullBounds.min).lerp(partBounds.min,wrapperOpacity);
          target.max.copy(pullBounds.max).lerp(partBounds.max,wrapperOpacity);
        }else target.copy(pullBounds);
      }
      return target;
    },
    setTextures({frontTexture,backTexture,pullTextures,pullBacks}={}){
      if(frontTexture!==undefined)setArt('front',frontTexture);
      if(backTexture!==undefined)setArt('back',backTexture);
      pullTextures?.forEach((t,k)=>{if(t)entries[k]?.booklet.setCover(true,t);});
      pullBacks?.forEach((t,k)=>{if(t)entries[k]?.booklet.setCover(false,t);});
    },
    dispose(){
      clearTimeout(watchdog);resolveOpen?.(false);mixer.stopAllAction();
      ownTextures.forEach(t=>t.dispose());bag.traverse(o=>{if(o.isMesh)o.material.dispose();});
      if(phase!=='filed')entries.forEach(e=>{e.booklet.dispose();e.bag.dispose();});
    }
  };
}
