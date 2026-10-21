// A saddle-stitched booklet: one folded cover, nested folded paper
// sheets, and two wire staples passing through the spine. No solid block.
export const COMIC_SPINE_X=-.8885;
export const COMIC_COVER_RADIUS=.0115;
export function createComicBook(THREE,{frontTexture,frontQuad=null,backTexture=null,backQuad=null,paperSheets=8}){
  const group=new THREE.Group();group.name='saddle-stitched-comic';
  const spine=COMIC_SPINE_X, radius=COMIC_COVER_RADIUS, H=2.7;
  const surfaces=[],edgeRecords=[],normalJoins=[];
  const coverMaterial=map=>new THREE.ShaderMaterial({
    uniforms:{art:{value:map}},side:THREE.DoubleSide,
    vertexShader:`varying vec2 vArtUv; varying vec3 vWorld; varying vec3 vN;
      void main(){vArtUv=uv;vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;vec3 viewNormal=normalMatrix*normal;vN=normalize(vec3(dot(viewMatrix[0].xyz,viewNormal),dot(viewMatrix[1].xyz,viewNormal),dot(viewMatrix[2].xyz,viewNormal)));gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`uniform sampler2D art; varying vec2 vArtUv; varying vec3 vWorld; varying vec3 vN;
      void main(){
        vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;
        vec3 v=normalize(cameraPosition-vWorld),r=reflect(-v,n);
        vec2 p=r.xy/max(abs(r.z),.02);
        // Gloss-coated ink catches broad studio reflections and a tighter
        // white glint. It follows the view and curved surface on both covers.
        float diagonal=p.x+.18*p.y;
        float broad=exp(-pow((diagonal-.34)/.12,2.0))*(1.0-smoothstep(1.5,2.5,abs(p.y)));
        float glint=exp(-pow((diagonal-.34)/.025,2.0))*(1.0-smoothstep(1.7,2.7,abs(p.y)));
        float fill=exp(-pow((p.x+.95)/.4,2.0))*.3;
        float facing=abs(dot(n,v));
        float fresnel=.04+.96*pow(1.0-facing,5.0);
        float sheen=broad*(.10+.4*fresnel)+glint*(.18+.35*fresnel)+fill*.035;
        float rim=.035*pow(1.0-facing,3.0);
        float light=.91+.09*max(dot(n,normalize(vec3(-.35,.7,1.0))),0.0);
        vec3 ink=texture2D(art,vArtUv).rgb;
        gl_FragColor=vec4(ink*light+vec3(.9,.96,1.0)*(sheen+rim),1.0);
        #include <colorspace_fragment>
      }`
  });
  const frontMaterial=coverMaterial(frontTexture);
  const rearMaterial=backTexture?coverMaterial(backTexture):new THREE.MeshStandardMaterial({color:0x33343a,roughness:.55});
  function imageUv(u,v,quad){
    if(!quad)return [u,v];
    // Sample the exact photographed print inside its four corners. Source
    // images are kept unchanged; this is the rear surface's texture mapping.
    const [tl,tr,br,bl]=quad;
    return [(bl[0]*(1-u)+br[0]*u)*(1-v)+(tl[0]*(1-u)+tr[0]*u)*v,
      1-((bl[1]*(1-u)+br[1]*u)*(1-v)+(tl[1]*(1-u)+tr[1]*u)*v)];
  }
  function position(x,y,z,free){
    const t=Math.max(0,Math.min(1,(x-spine)/(.9-spine)));
    const bow=free*(.047*t*t+.008*Math.sin(t*Math.PI))*(.85+.15*Math.cos(y*1.8));
    const corner=free*.006*Math.pow(t,8)*Math.pow(y/1.35,3);
    return [x,y,z*(1+free*.9*Math.pow(t,1.65))+bow+corner];
  }
  function meshSurface(name,cols,rows,point,uvAt,material,reverse=false){
    const points=[],uvs=[],idx=[];
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
      const u=col/cols,v=row/rows;points.push(...point(u,v));uvs.push(...uvAt(u,v));
    }
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const a=row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;
      if(reverse)idx.push(a,d,b,a,c,d);else idx.push(a,b,d,a,d,c);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(idx);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;group.add(mesh);
    surfaces.push({geometry,base:points});return mesh;
  }
  const plainUv=(u,v)=>[u,v];
  const face=(side,r,height,right)=>((u,v)=>[spine+u*(right-spine),(v-.5)*height,side*r]);
  const front=meshSurface('printed-front-cover',48,36,face(1,radius,H,.9),(u,v)=>imageUv(u,v,frontQuad),frontMaterial);
  const rear=meshSurface('printed-rear-cover',48,36,face(-1,radius,H,.9),(u,v)=>imageUv(1-u,v,backQuad),rearMaterial,true);
  // Each half of the fold picks up the corresponding printed cover edge.
  const arcPoint=(r,height,start,end)=>(u,v)=>{const a=start+(end-start)*u;return [spine-r*Math.sin(a),(v-.5)*height,r*Math.cos(a)];};
  // The photographed covers are separate sources. Blend only their existing
  // edge ink over the narrow apex of the fold, rather than creating a hard
  // longitudinal color seam between two stretched image columns.
  const foldMaterial=frontMaterial.clone();
  foldMaterial.uniforms.rearArt={value:backTexture||frontTexture};
  foldMaterial.uniforms.rearAvailable={value:backTexture?1:0};
  foldMaterial.uniforms.rearFallback={value:new THREE.Color(0x33343a)};
  foldMaterial.vertexShader=foldMaterial.vertexShader
    .replace('varying vec2 vArtUv;', 'attribute vec2 rearUv; attribute float inkBlend; varying vec2 vRearUv; varying float vInkBlend; varying vec2 vArtUv;')
    .replace('vArtUv=uv;', 'vArtUv=uv;vRearUv=rearUv;vInkBlend=inkBlend;');
  foldMaterial.fragmentShader=foldMaterial.fragmentShader
    .replace('uniform sampler2D art;', 'uniform sampler2D rearArt; uniform float rearAvailable; uniform vec3 rearFallback; varying vec2 vRearUv; varying float vInkBlend; uniform sampler2D art;')
    .replace('vec3 ink=texture2D(art,vArtUv).rgb;', 'vec3 rearInk=mix(rearFallback,texture2D(rearArt,vRearUv).rgb,rearAvailable);vec3 ink=mix(texture2D(art,vArtUv).rgb,rearInk,smoothstep(.38,.62,vInkBlend));');
  function coverFold(name,start,end){
    const fold=meshSurface(name,24,36,arcPoint(radius,H,start,end),(u,v)=>imageUv(0,v,frontQuad),foldMaterial,true);
    const rearUvs=[],blend=[];
    for(let row=0;row<=36;row++)for(let col=0;col<=24;col++){
      rearUvs.push(...imageUv(1,row/36,backQuad));
      blend.push((start+(end-start)*col/24)/Math.PI);
    }
    fold.geometry.setAttribute('rearUv',new THREE.Float32BufferAttribute(rearUvs,2));
    fold.geometry.setAttribute('inkBlend',new THREE.Float32BufferAttribute(blend,1));
    return fold;
  }
  const frontFold=coverFold('front-half-of-cover-fold',0,Math.PI/2);
  const rearFold=coverFold('rear-half-of-cover-fold',Math.PI/2,Math.PI);
  const join=(a,colsA,colA,b,colsB,colB,rows)=>normalJoins.push({a:a.geometry,b:b.geometry,colsA,colA,colsB,colB,rows});
  join(front,48,0,frontFold,24,0,36);
  join(frontFold,24,24,rearFold,24,0,36);
  join(rearFold,24,24,rear,48,0,36);
  const paperMaterial=new THREE.MeshStandardMaterial({color:0xc6c3b9,roughness:.88,side:THREE.DoubleSide});
  const pageEdgePositions=[],pageEdgeColors=[];
  function traceEdge(point,segments,color){
    for(let i=0;i<segments;i++){pageEdgePositions.push(...point(i/segments),...point((i+1)/segments));pageEdgeColors.push(...color,...color);}
  }
  for(let sheet=0;sheet<paperSheets;sheet++){
    const r=.0094-sheet*(.00784/Math.max(1,paperSheets-1)),height=2.678-(sheet%3)*.0008,right=.891-(sheet%4)*.0014;
    const leaves=[];
    for(const side of [1,-1]){
      leaves.push(meshSurface(`paper-sheet-${sheet}-${side}`,20,18,face(side,r,height,right),plainUv,paperMaterial,side<0));
      // Physical cut edges follow the exact leaves, including their slight fan.
      const color=sheet%3===0?[.39,.38,.36]:sheet%3===1?[.76,.74,.69]:[.55,.54,.51];
      traceEdge(t=>[right,(t-.5)*height,side*r],32,color);
      for(const sign of [-1,1])traceEdge(t=>[spine+t*(right-spine),sign*height/2,side*r],24,color);
    }
    const fold=meshSurface(`nested-fold-${sheet}`,28,18,arcPoint(r,height,0,Math.PI),plainUv,paperMaterial,true);
    join(leaves[0],20,0,fold,28,0,18);
    join(fold,28,28,leaves[1],20,0,18);
  }
  const edgeGeometry=new THREE.BufferGeometry();edgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(pageEdgePositions,3));edgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(pageEdgeColors,3));
  const pageEdges=new THREE.LineSegments(edgeGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8}));pageEdges.name='separate-paper-edges';group.add(pageEdges);edgeRecords.push({geometry:edgeGeometry,base:pageEdgePositions});
  // Staples sit on the outside of the folded spine. Their short rounded legs
  // enter the fold at each end, rather than floating on the back cover.
  const wireMaterial=new THREE.MeshStandardMaterial({color:0xc5c9ce,metalness:1,roughness:.22,envMapIntensity:1.2});
  for(const y of [-.72,.72]){
    const outer=spine-radius-.0022;
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(spine+.001,y-.061,0),new THREE.Vector3(outer+.001,y-.058,0),
      new THREE.Vector3(outer,y-.045,0),new THREE.Vector3(outer,y+.045,0),
      new THREE.Vector3(outer+.001,y+.058,0),new THREE.Vector3(spine+.001,y+.061,0)
    ]);
    const staple=new THREE.Mesh(new THREE.TubeGeometry(path,30,.0018,8,false),wireMaterial);staple.name='spine-staple';group.add(staple);
  }
  const averagedNormal=new THREE.Vector3(),otherNormal=new THREE.Vector3();
  let previous=-1;
  function setFree(value){
    if(Math.abs(value-previous)<.0001)return;previous=value;
    for(const {geometry,base} of [...surfaces,...edgeRecords]){
      const p=geometry.attributes.position;
      for(let i=0;i<p.count;i++)p.setXYZ(i,...position(base[i*3],base[i*3+1],base[i*3+2],value));
      p.needsUpdate=true;if(geometry.index)geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
    }
    // Separate material/UV meshes share one physically continuous fold.
    // Weld their shading normals again after each change in paper curvature.
    for(const {a,b,colsA,colA,colsB,colB,rows} of normalJoins){
      const an=a.attributes.normal,bn=b.attributes.normal;
      for(let row=0;row<=rows;row++){
        const ai=row*(colsA+1)+colA,bi=row*(colsB+1)+colB;
        averagedNormal.fromBufferAttribute(an,ai).add(otherNormal.fromBufferAttribute(bn,bi)).normalize();
        an.setXYZ(ai,averagedNormal.x,averagedNormal.y,averagedNormal.z);
        bn.setXYZ(bi,averagedNormal.x,averagedNormal.y,averagedNormal.z);
      }
      an.needsUpdate=true;bn.needsUpdate=true;
    }
  }
  setFree(0);return {group,setFree};
}
