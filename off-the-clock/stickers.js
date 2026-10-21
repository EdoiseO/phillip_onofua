export const stickerPack = [
  {id:'omnitrix',name:'Omnitrix',note:'Hero time.',width:1.05},
  {id:'marvel',name:'Marvel Comics',note:'A whole universe.',width:1.18},
  {id:'batman',name:'The Dark Knight',note:'Gotham after hours.',width:1.45},
  {id:'spider-man',name:'Spider-Man',note:'Your friendly neighbour.',width:1.05},
  {id:'dino',name:'Offline Dino',note:'No signal. Still running.',width:.85},
  {id:'openai',name:'OpenAI',note:'Stay curious.',width:.95},
  {id:'javascript',name:'JavaScript',note:'One more idea. One more script.',width:.95,collection:'code',extension:'svg'},
  {id:'typescript',name:'TypeScript',note:'A little more type safety.',width:.95,collection:'code',extension:'svg'},
  {id:'python',name:'Python',note:'Small scripts. Big ideas.',width:1.05,collection:'code',extension:'svg'},
  {id:'cplusplus',name:'C++',note:'Close to the metal.',width:.95,collection:'code',extension:'svg'},
  {id:'html5',name:'HTML5',note:'It starts with a little markup.',width:.9,collection:'code',extension:'svg'},
  {id:'css3',name:'CSS3',note:'Make it feel right.',width:.9,collection:'code',extension:'svg'}
].map(sticker=>({...sticker,collection:sticker.collection??'originals',src:`./assets/stickers/${sticker.id}.${sticker.extension??'png'}`}));

export const STORAGE_KEY='phillip-shortbox-stickers-v1';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

// Unroll the four walls into a continuous strip. Sampling across a corner folds
// the same artwork onto the neighbouring wall, with no duplicated or cut UVs.
export function wallPoint(s,y,width,depth,offset=0){
  const x=width/2,z=depth/2,p=2*(width+depth);
  const t=((s+x)%p+p)%p;
  if(t<=width)return {position:[-x+t,y,z+offset],normal:[0,0,1]};
  if(t<=width+depth)return {position:[x+offset,y,z-(t-width)],normal:[1,0,0]};
  if(t<=2*width+depth)return {position:[x-(t-width-depth),y,-z-offset],normal:[0,0,-1]};
  return {position:[-x-offset,y,-z+(t-2*width-depth)],normal:[-1,0,0]};
}

export function validSticker(value){
  return value&&stickerPack.some(s=>s.id===value.art)&&['wall','lid'].includes(value.surface)
    &&['u','v','size','angle'].every(k=>Number.isFinite(value[k]))
    &&Math.abs(value.u)<100&&Math.abs(value.v)<100&&value.size>=.45&&value.size<=1.65
    &&Math.abs(value.angle)<=180&&['gloss','holo'].includes(value.finish);
}

export async function createStickerSystem({THREE,body,lid,stage,camera,W,H,D,T,invalidate}){
  const width=W+T,depth=D+T,perimeter=2*(width+depth);
  const loader=new THREE.TextureLoader();
  let textures=null,loading=null,draft=null,items=[],history=[],saved=true;
  const raycaster=new THREE.Raycaster(),inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),hitPoint=new THREE.Vector3();
  let stored=[];
  try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(parsed))stored=parsed.filter(validSticker).slice(0,24);}catch{saved=false;}
  function snapshot(){return items.map(item=>({...item.data}));}
  function remember(){history.push(snapshot());if(history.length>20)history.shift();}
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));saved=true;}catch{saved=false;}}
  async function prepare(){
    if(textures)return;
    if(!loading)loading=Promise.all(stickerPack.map(async art=>{
      const map=await loader.loadAsync(art.src);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
      // Read the cutout once so picking a preview ignores its transparent corners.
      let pixels=map.image.data;
      if(!pixels&&typeof document!=='undefined'){
        const canvas=document.createElement('canvas');canvas.width=map.image.width;canvas.height=map.image.height;
        const context=canvas.getContext('2d');context.drawImage(map.image,0,0);pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      }
      return [art.id,{map,pixels,ratio:map.image.height/map.image.width}];
    })).then(entries=>{textures=new Map(entries);}).catch(error=>{loading=null;throw error;});
    await loading;
  }
  function constrain(data){
    const art=stickerPack.find(s=>s.id===data.art),size=clamp(Math.round(data.size*100)/100,.45,1.65);
    const w=art.width*size,h=w*textures.get(data.art).ratio,angle=data.angle*Math.PI/180;
    const extentX=(Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h)/2;
    const extentY=(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)/2;
    // Fit the rotated artwork, then return its actual size to the controls.
    // Round down to the ruler's 1% step so applying that value is idempotent.
    const fit=data.surface==='wall'?Math.min(1,(H-.28)/(extentY*2)):Math.min(1,(W+.1)/(extentX*2),(D+.06)/(extentY*2));
    const fittedSize=Math.floor(size*fit*100+1e-8)/100,scale=fittedSize/size;
    if(data.surface==='wall')return {...data,size:fittedSize,u:((data.u+width/2)%perimeter+perimeter)%perimeter-width/2,v:clamp(data.v,extentY*scale+.12,H-extentY*scale-.16)};
    // Keep lid stickers on the removable lid; they never bridge the opening.
    return {...data,size:fittedSize,u:clamp(data.u,-(W+.1)/2+extentX*scale,(W+.1)/2-extentX*scale),v:clamp(data.v,-(D+.06)/2+extentY*scale,(D+.06)/2-extentY*scale)};
  }
  function make(data,isDraft=false,layer=items.length){
    // Keep a fine grid for corner wrapping, but use one cutout mesh rather than
    // two nearly coplanar transparent faces. The reverse is plain sticker paper.
    const g=new THREE.PlaneGeometry(1,1,96,64);
    g.attributes.position.setUsage(THREE.DynamicDrawUsage);g.attributes.normal.setUsage(THREE.DynamicDrawUsage);
    const material=new THREE.MeshPhysicalMaterial({alphaTest:.35,alphaToCoverage:true,transparent:true,forceSinglePass:true,depthWrite:false,roughness:.27,clearcoat:1,clearcoatRoughness:.12,iridescenceIOR:1.35,iridescenceThicknessRange:[140,460],envMapIntensity:.85,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = vec3(0.96);');};
    material.customProgramCacheKey=()=>'sticker-paper-reverse-v1';
    const mesh=new THREE.Mesh(g,material);mesh.userData.sticker=true;mesh.receiveShadow=false;
    const item={data:null,mesh,base:new Float32Array(g.attributes.position.array.length),press:0,isDraft,layer};
    project(item,data);return item;
  }
  function project(item,data){
    data=constrain(data);item.data=data;
    const art=stickerPack.find(s=>s.id===data.art),tex=textures.get(data.art),g=item.mesh.geometry;
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,angle=data.angle*Math.PI/180;
    const w=art.width*data.size,h=w*tex.ratio,cos=Math.cos(angle),sin=Math.sin(angle);
    for(let i=0;i<p.count;i++){
      const x=(uv.getX(i)-.5)*w,y=(uv.getY(i)-.5)*h,u=data.u+x*cos-y*sin,v=data.v+x*sin+y*cos;
      const point=data.surface==='wall'?wallPoint(u,v,width,depth):{position:[u,.125,-v],normal:[0,1,0]};
      item.base.set(point.position,i*3);n.setXYZ(i,...point.normal);
    }
    n.needsUpdate=true;
    const material=item.mesh.material,holo=data.finish==='holo';
    if((material.iridescence>0)!==holo)material.needsUpdate=true;
    material.map=tex.map;material.metalness=holo?.12:0;material.iridescence=holo?.85:0;
    const parent=data.surface==='wall'?body:lid;if(item.mesh.parent!==parent)parent.add(item.mesh);
    // Box depth still occludes hidden faces. Among cutouts, explicit insertion
    // order wins at every viewing angle, even during overlapping peel motions.
    item.mesh.renderOrder=item.isDraft?100:10+item.layer;
    shape(item);
  }
  function shape(item){
    const g=item.mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    const layer=.024+item.layer*.001;
    for(let i=0;i<p.count;i++){
      const curl=Math.pow(uv.getX(i),3)*.22*item.press;
      for(let axis=0;axis<3;axis++){
        const j=i*3+axis;p.array[j]=item.base[j]+n.array[j]*(layer+curl);
      }
    }
    p.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
  }
  function removeMesh(item){if(!item)return;item.mesh.removeFromParent();item.mesh.geometry.dispose();item.mesh.material.dispose();}
  function clearDraft(){if(!draft)return;removeMesh(draft);draft=null;invalidate();}
  function setDraft(data){
    if(draft){project(draft,data);}else{draft=make(data,true);}
    draft.mesh.visible=true;
    invalidate();return {...draft.data};
  }
  function pick(x,y){
    const r=stage.getBoundingClientRect();
    if(!r.width||!r.height||x<r.left||x>r.right||y<r.top||y>r.bottom)return null;
    raycaster.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);
    const candidates=[];
    for(const [parent,surface] of [[body,'wall'],[lid,'lid']]){
      parent.updateWorldMatrix(true,false);inverse.copy(parent.matrixWorld).invert();localRay.copy(raycaster.ray).applyMatrix4(inverse);
      const planes=surface==='wall'?[[[0,0,1],depth/2,'front'],[[1,0,0],width/2,'right'],[[0,0,-1],depth/2,'back'],[[-1,0,0],width/2,'left']]:[[[0,1,0],.125,'lid']];
      for(const [normal,distance,face] of planes){
        const n=new THREE.Vector3(...normal);if(localRay.direction.dot(n)>=-.001)continue;
        if(!localRay.intersectPlane(new THREE.Plane(n,-distance),hitPoint))continue;
        const p=hitPoint.clone();let u,v;
        if(surface==='wall'){
          if(p.y<.1||p.y>H-.12||Math.abs(p.x)>width/2+.001||Math.abs(p.z)>depth/2+.001)continue;
          if((face==='front'||face==='back')&&Math.abs(p.x)<.41&&p.y>2.22&&p.y<2.51)continue;
          u=face==='front'?p.x:face==='right'?width/2+depth/2-p.z:face==='back'?width+depth-p.x:width*1.5+depth*1.5+p.z;
          v=p.y;
        }else{if(Math.abs(p.x)>(W+.2)/2||Math.abs(p.z)>(D+.17)/2)continue;u=p.x;v=-p.z;}
        candidates.push({surface,u,v,face,distance:parent.localToWorld(p).distanceTo(raycaster.ray.origin)});
      }
    }
    return candidates.sort((a,b)=>a.distance-b.distance)[0]??null;
  }
  function hitDraft(x,y){
    if(!draft||!draft.mesh.visible)return false;
    const r=stage.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return false;
    const surface=pick(x,y);draft.mesh.updateWorldMatrix(true,false);
    for(const hit of raycaster.intersectObject(draft.mesh)){
      if(surface&&hit.distance>surface.distance+.1)continue;
      const tex=textures.get(draft.data.art),image=tex.map.image;
      const u=clamp(Math.floor(hit.uv.x*image.width),0,image.width-1),v=clamp(Math.floor((1-hit.uv.y)*image.height),0,image.height-1);
      if(!tex.pixels||tex.pixels[(v*image.width+u)*4+3]>=90)return true;
    }
    return false;
  }
  function wraps(data){
    if(!data||data.surface!=='wall')return false;
    const art=stickerPack.find(s=>s.id===data.art),r=textures.get(data.art).ratio,a=data.angle*Math.PI/180;
    const extent=art.width*data.size*(Math.abs(Math.cos(a))+r*Math.abs(Math.sin(a)))/2;
    return [width/2,width/2+depth,width*1.5+depth,width*1.5+2*depth,-width/2].some(edge=>Math.abs(data.u-edge)<extent);
  }
  return {
    async ready(){await prepare();if(stored.length){items=stored.map((s,i)=>make(s,false,i));stored=[];invalidate();}},
    setDraft,clearDraft,pick,hitDraft,
    showDraft(value){if(draft&&draft.mesh.visible!==value){draft.mesh.visible=value;invalidate();}},
    draft(){return draft?{...draft.data}:null;},
    wraps(){return wraps(draft?.data);},
    count(){return items.length;},
    saved(){return saved;},
    canUndo(){return history.length>0;},
    place(){if(!draft||!draft.mesh.visible||items.length>=24)return false;remember();const item=draft;draft=null;item.isDraft=false;item.layer=items.length;item.mesh.renderOrder=10+item.layer;items.push(item);item.press=.18;shape(item);save();invalidate();return true;},
    undo(){if(!history.length)return;clearDraft();items.forEach(removeMesh);items=history.pop().map((s,i)=>make(s,false,i));save();invalidate();},
    reset(){if(!items.length)return;remember();clearDraft();items.forEach(removeMesh);items=[];save();invalidate();},
    tick(dt,reduced){let moving=false;for(const item of items){if(item.press>0){item.press=reduced?0:item.press*Math.exp(-dt*8);if(item.press<.001)item.press=0;shape(item);moving=true;}}return moving;},
    hasSaved:stored.length>0,
    dispose(){clearDraft();items.forEach(removeMesh);if(textures)for(const tex of textures.values()){tex.map.dispose();}}
  };
}
