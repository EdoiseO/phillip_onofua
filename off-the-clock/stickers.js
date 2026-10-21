export const stickerPack = [
  {id:'omnitrix',name:'Omnitrix',note:'Hero time.',width:1.05},
  {id:'marvel',name:'Marvel Comics',note:'A whole universe.',width:1.18},
  {id:'batman',name:'The Dark Knight',note:'Gotham after hours.',width:1.45},
  {id:'spider-man',name:'Spider-Man',note:'Your friendly neighbour.',width:1.05},
  {id:'dino',name:'Offline Dino',note:'No signal. Still running.',width:.85},
  {id:'openai',name:'OpenAI',note:'Stay curious.',width:.95}
].map(sticker=>({...sticker,src:`./assets/stickers/${sticker.id}.png`}));

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
      const c=document.createElement('canvas');c.width=map.image.width;c.height=map.image.height;
      const ctx=c.getContext('2d');ctx.drawImage(map.image,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);
      const paper=new THREE.CanvasTexture(c);paper.colorSpace=THREE.SRGBColorSpace;
      return [art.id,{map,paper,ratio:map.image.height/map.image.width}];
    })).then(entries=>{textures=new Map(entries);}).catch(error=>{loading=null;throw error;});
    await loading;
  }
  function constrain(data){
    const art=stickerPack.find(s=>s.id===data.art),size=clamp(data.size,.45,1.65);
    const w=art.width*size,h=w*textures.get(data.art).ratio,angle=data.angle*Math.PI/180;
    const extentX=(Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h)/2;
    const extentY=(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)/2;
    if(data.surface==='wall')return {...data,size,u:((data.u+width/2)%perimeter+perimeter)%perimeter-width/2,v:clamp(data.v,extentY+.12,H-extentY-.16)};
    // Keep lid stickers on the removable lid; they never bridge the opening.
    const maxSize=Math.min(1,(W+.1)/Math.max(.01,extentX*2),(D+.06)/Math.max(.01,extentY*2));
    return {...data,size:size*maxSize,u:clamp(data.u,-(W+.1)/2+extentX*maxSize,(W+.1)/2-extentX*maxSize),v:clamp(data.v,-(D+.06)/2+extentY*maxSize,(D+.06)/2-extentY*maxSize)};
  }
  function make(data,isDraft=false){
    data=constrain(data);
    const art=stickerPack.find(s=>s.id===data.art),tex=textures.get(data.art);
    // Small cells keep corner-crossing triangles outside the cardboard shell.
    const g=new THREE.PlaneGeometry(art.width*data.size,art.width*data.size*tex.ratio,96,64);
    const p=g.attributes.position,n=g.attributes.normal,angle=data.angle*Math.PI/180;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),u=data.u+x*Math.cos(angle)-y*Math.sin(angle),v=data.v+x*Math.sin(angle)+y*Math.cos(angle);
      const point=data.surface==='wall'?wallPoint(u,v,width,depth):{position:[u,.125,-v],normal:[0,1,0]};
      p.setXYZ(i,...point.position);n.setXYZ(i,...point.normal);
    }
    const base=Float32Array.from(p.array);
    const material=new THREE.MeshPhysicalMaterial({map:tex.map,transparent:true,alphaTest:.05,roughness:.27,metalness:data.finish==='holo'?.12:0,clearcoat:1,clearcoatRoughness:.12,iridescence:data.finish==='holo'?.85:0,iridescenceIOR:1.35,iridescenceThicknessRange:[140,460],envMapIntensity:.85,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,opacity:isDraft?.82:1});
    const mesh=new THREE.Mesh(g,material);mesh.userData.sticker=true;mesh.renderOrder=isDraft?40:3;mesh.receiveShadow=false;
    const paper=new THREE.Mesh(g.clone(),new THREE.MeshStandardMaterial({map:tex.paper,transparent:true,alphaTest:.05,roughness:.65,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));paper.renderOrder=2;
    const parent=data.surface==='wall'?body:lid;parent.add(paper,mesh);
    const item={data,mesh,paper,base,press:isDraft?.18:0,isDraft};shape(item);return item;
  }
  function shape(item){
    const p=item.mesh.geometry.attributes.position,n=item.mesh.geometry.attributes.normal,uv=item.mesh.geometry.attributes.uv;
    const back=item.paper.geometry.attributes.position;
    const layer=.022+(item.isDraft?.006+items.length*.0007:items.indexOf(item)*.0007);
    for(let i=0;i<p.count;i++){
      const curl=Math.pow(uv.getX(i),3)*.22*item.press;
      for(let axis=0;axis<3;axis++){
        const j=i*3+axis;p.array[j]=item.base[j]+n.array[j]*(layer+curl);back.array[j]=item.base[j]+n.array[j]*(layer+curl-.003);
      }
    }
    p.needsUpdate=true;back.needsUpdate=true;item.mesh.geometry.computeBoundingSphere();item.paper.geometry.computeBoundingSphere();
  }
  function removeMesh(item){if(!item)return;for(const mesh of [item.mesh,item.paper]){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}}
  function clearDraft(){removeMesh(draft);draft=null;invalidate();}
  function setDraft(data){clearDraft();draft=make(data,true);invalidate();return {...draft.data};}
  function pick(x,y){
    const r=stage.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);
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
  function wraps(data){
    if(!data||data.surface!=='wall')return false;
    const art=stickerPack.find(s=>s.id===data.art),r=textures.get(data.art).ratio,a=data.angle*Math.PI/180;
    const extent=art.width*data.size*(Math.abs(Math.cos(a))+r*Math.abs(Math.sin(a)))/2;
    return [width/2,width/2+depth,width*1.5+depth,width*1.5+2*depth,-width/2].some(edge=>Math.abs(data.u-edge)<extent);
  }
  return {
    async ready(){await prepare();if(stored.length){items=stored.map(s=>make(s));stored=[];items.forEach(shape);invalidate();}},
    setDraft,clearDraft,pick,
    draft(){return draft?{...draft.data}:null;},
    wraps(){return wraps(draft?.data);},
    count(){return items.length;},
    saved(){return saved;},
    canUndo(){return history.length>0;},
    place(){if(!draft||items.length>=24)return false;remember();const data=draft.data;clearDraft();const item=make(data);items.push(item);item.press=1;shape(item);save();invalidate();return true;},
    undo(){if(!history.length)return;clearDraft();items.forEach(removeMesh);items=history.pop().map(s=>make(s));items.forEach(shape);save();invalidate();},
    reset(){if(!items.length)return;remember();clearDraft();items.forEach(removeMesh);items=[];save();invalidate();},
    tick(dt,reduced){let moving=false;for(const item of items){if(item.press>0){item.press=reduced?0:item.press*Math.exp(-dt*8);if(item.press<.001)item.press=0;shape(item);moving=true;}}return moving;},
    hasSaved:stored.length>0,
    dispose(){clearDraft();items.forEach(removeMesh);if(textures)for(const tex of textures.values()){tex.map.dispose();tex.paper.dispose();}}
  };
}
