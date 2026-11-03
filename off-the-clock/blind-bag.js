// A sealed premium mystery bag. The pouch, its tear and the falling strip
// come from the reviewed glTF; the three pulls reuse the site's comic model.
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createComicBook } from './comic-book.js?v=37.0';

// The modelled pack is taller than a bagged comic. At 0.9 it stands in the
// short box like the sleeved comics, and its comics still clear the film.
const BAG_SCALE=.9;
const COMIC_WIDTH_SCALE=6.625*(2.7/10.25)/1.8;
let template=null;

export function loadBlindBag(){
  // The page's policy keeps connect-src to 'self', which blocks fetch() of the
  // blob URLs the loader makes for embedded images. Decode them as <img>
  // elements instead; img-src already allows blob:.
  template??=new GLTFLoader().register(parser=>{parser.textureLoader=new TextureLoader(parser.options.manager);return {name:'image-element-textures'};}).loadAsync('./assets/models/blind-bag.glb');
  return template;
}

export function createBlindBag(THREE,gltf,{frontTexture,backTexture=null,pullTextures,pulls}){
  const smooth=(a,b,v)=>THREE.MathUtils.smoothstep(v,a,b);
  const group=new THREE.Group();group.name='blind-bag';
  const bag=gltf.scene.clone(true);bag.scale.setScalar(BAG_SCALE);group.add(bag);
  // glTF UVs expect unflipped images. Share the loaded cover, not a copy of its pixels.
  const unflipped=texture=>{const t=texture.clone();t.flipY=false;t.needsUpdate=true;return t;};
  const ownTextures=[];
  bag.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();
    const name=o.material.name;
    if(name==='art_front'&&frontTexture){o.material.map=unflipped(frontTexture);ownTextures.push(o.material.map);}
    if(name==='art_back'){
      if(backTexture){o.material.map=unflipped(backTexture);ownTextures.push(o.material.map);}
      else{o.material.map=null;o.material.color.set(0xe7e7e2);}
    }
    // A photographed back already shows its own printed fin seam.
    if(backTexture&&name.startsWith('fin_'))o.visible=false;
  });
  const pouch=['bag_body','seal_bottom'].map(name=>bag.getObjectByName(name));
  const mixer=new THREE.AnimationMixer(bag);
  const clip=name=>THREE.AnimationClip.findByName(gltf.animations,name);
  const tear=mixer.clipAction(clip('tear_open')),crinkle=mixer.clipAction(clip('hover'));
  for(const action of [tear,crinkle]){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();action.paused=true;}
  const tearDuration=tear.getClip().duration,crinkleDuration=crinkle.getClip().duration;

  // The pulls wait inside, stacked front to back, until the mouth is open.
  const pullGroup=new THREE.Group();pullGroup.scale.setScalar(BAG_SCALE);pullGroup.visible=false;group.add(pullGroup);
  const books=pulls.map((pull,k)=>{
    const booklet=createComicBook(THREE,{frontTexture:pullTextures[k],paperSheets:8,foil:pull.finish==='foil'});
    booklet.group.scale.set(COMIC_WIDTH_SCALE,1,1);pullGroup.add(booklet.group);return booklet.group;
  });

  let open=false,tearTime=0,reveal=0,crinkleTime=-1,moving=false;
  function pose(){
    const sealed=tearTime===0;
    tear.enabled=!sealed||crinkleTime<0;crinkle.enabled=sealed&&crinkleTime>=0;
    tear.time=tearTime;crinkle.time=Math.max(0,crinkleTime);mixer.update(0);
    pullGroup.visible=reveal>0;
    // Rise together as one stack, then fan out like a hand of cards.
    const rise=smooth(0,.55,reveal),fan=smooth(.45,1,reveal);
    books.forEach((book,k)=>{
      const side=k-(books.length-1)/2;
      // Spread far enough that each cover reads, with the middle pull on top.
      book.position.set(side*1.55*fan,3.05*rise+.12*fan*(1-Math.abs(side)),(1-k)*.024*(1-fan)+(.05+.06*(1-Math.abs(side)))*fan);
      book.rotation.set(0,-side*.1*fan,-side*.09*fan);
    });
  }
  pose();
  return {
    group,pullCount:books.length,
    get opened(){return open;},
    get moving(){return moving;},
    setOpen(value){open=value;moving=true;},
    crinkle(){if(tearTime===0&&!open){crinkleTime=0;moving=true;}},
    reset(){open=false;tearTime=0;reveal=0;crinkleTime=-1;moving=false;pose();},
    // The tear only runs forward. Putting the pulls back slides them into the torn bag.
    tick(dt,reduced){
      if(crinkleTime>=0){crinkleTime=reduced?-1:crinkleTime+dt;if(crinkleTime>crinkleDuration)crinkleTime=-1;}
      if(open&&tearTime<tearDuration)tearTime=reduced?tearDuration:Math.min(tearDuration,tearTime+dt);
      const wanted=open&&tearTime>=tearDuration*.74?1:0;
      reveal=reduced?wanted:wanted>reveal?Math.min(wanted,reveal+dt/1.3):Math.max(wanted,reveal-dt/.9);
      moving=crinkleTime>=0||(open&&tearTime<tearDuration)||reveal!==wanted;
      pose();return moving;
    },
    // Frame the pouch and the comics, not the strip falling out of shot.
    bounds(target){
      target.makeEmpty();for(const part of pouch)target.expandByObject(part);
      if(pullGroup.visible)target.expandByObject(pullGroup);
      return target;
    },
    dispose(){mixer.stopAllAction();ownTextures.forEach(t=>t.dispose());}
  };
}
