// A thin, open-topped polypropylene bag. The two faces share their welded
// sides and bottom; the closure folds down the BACK of a separate backing board.
export function createComicSleeve(THREE) {
  const group = new THREE.Group();
  const W=1.84, bottom=-1.42, top=1.42, height=top-bottom, nx=32, ny=44;
  // The board remains inside the bag when the booklet is taken out. Its cut
  // edge and matte stock are distinct from both the printed comic and film.
  const stockPixels=new Uint8Array(64*128*4);
  for(let i=0;i<64*128;i++){
    const grain=((i*7919)%17)/17*2-1;
    stockPixels.set([244+grain,242+grain,236+grain,255],i*4);
  }
  const stockTexture=new THREE.DataTexture(stockPixels,64,128,THREE.RGBAFormat);
  stockTexture.colorSpace=THREE.SRGBColorSpace;stockTexture.needsUpdate=true;
  const stock=new THREE.MeshStandardMaterial({map:stockTexture,color:0xe8e8e8,roughness:1,metalness:0});
  const cutEdge=new THREE.MeshStandardMaterial({color:0xc9c4b9,roughness:1,metalness:0});
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.778,2.766,.0064),[cutEdge,cutEdge,cutEdge,cutEdge,stock,stock]);
  board.position.z=-.0185;board.name='backing-board';group.add(board);
  // Reflect bright studio strips and dark cards on the film itself. No diffuse grey layer,
  // refractive blur, or detached plane carrying an artificial highlight.
  const material = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, depthTest:true, side:THREE.FrontSide,
    forceSinglePass:true,
    vertexShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilmUv;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vWorldPosition=world.xyz;vFilmUv=uv;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilmUv;
      float panel(vec2 p,vec2 center,vec2 size){
        vec2 d=abs(p-center);
        vec2 fall=vec2(1.0)-smoothstep(size,size+vec2(.12,.2),d);
        return fall.x*fall.y;
      }
      void main(){
        vec3 n=normalize(vWorldNormal);
        if(!gl_FrontFacing)n=-n;
        vec3 v=normalize(cameraPosition-vWorldPosition);
        float facing=abs(dot(n,v));
        float fresnel=.025+.975*pow(1.0-facing,5.0);
        vec3 reflected=reflect(-v,n);
        vec2 projected=reflected.xy/max(abs(reflected.z),.02);
        // Paired bright softboxes and dark studio cards make clear film
        // readable over both dark ink and the white backing board.
        vec2 studio=vec2(projected.x+.10*projected.y,projected.y);
        float light=panel(studio,vec2(-.70,.22),vec2(.065,1.65));
        light+=.48*panel(studio,vec2(.95,.05),vec2(.035,1.9));
        float darkCard=exp(-pow((studio.x+.51)/.075,2.0))*(1.0-smoothstep(1.5,2.4,abs(studio.y)));
        darkCard+=.5*panel(studio,vec2(-1.02,.22),vec2(.065,1.72));
        darkCard+=.35*panel(studio,vec2(-.39,.22),vec2(.045,1.72));
        darkCard+=.65*panel(studio,vec2(.66,.05),vec2(.04,1.9));
        float core=exp(-pow((studio.x+.70)/.024,2.0))*(1.0-smoothstep(1.5,2.3,abs(studio.y-.22)));
        float brightAlpha=light*(.25+.55*fresnel)+core*.17;
        float darkAlpha=min(darkCard,1.0)*(.20+.07*fresnel);
        float edge=min(min(vFilmUv.x,1.0-vFilmUv.x),vFilmUv.y);
        float weld=1.0-smoothstep(0.0,.003,edge);
        brightAlpha=max(brightAlpha,weld*(.24+.13*fresnel));
        float clearAlpha=.002+fresnel*.045;
        float total=brightAlpha+darkAlpha+clearAlpha;
        vec3 reflection=(vec3(.91,.96,1.0)*(brightAlpha+clearAlpha)+vec3(.035,.05,.075)*darkAlpha)/max(total,.0001);
        gl_FragColor=vec4(reflection,min(total,.46));
        #include <colorspace_fragment>
      }`
  });
  const vertices=[], uvs=[], indices=[];
  // The weld pinches beyond the board, never through its corners. Extra
  // rows/columns preserve that clearance even in the triangulated surface.
  const xAt=col=>col===0?-W/2:col===nx?W/2:-.902+(col-1)/(nx-2)*1.804;
  const yAt=row=>row===0?bottom:-1.392+(row-1)/(ny-1)*(top+1.392);
  for(let side=0;side<2;side++)for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++){
    const x=xAt(col),y=yAt(row);
    vertices.push(x,y,0);uvs.push(x/W+.5,(y-bottom)/height);
  }
  const stride=nx+1,faceCount=stride*(ny+1);
  for(let side=0;side<2;side++)for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
    const a=side*faceCount+row*stride+col,b=a+1,c=a+stride,d=c+1;
    if(side===0)indices.push(a,b,d,a,d,c);else indices.push(a,d,b,a,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  const film=new THREE.Mesh(geometry,material);film.name='bag-film';group.add(film);
  // The weld is shaded on the same connected film, so it follows every fold.
  const flap=new THREE.Group();flap.name='rear-flap';group.add(flap);flap.position.y=top;
  const flapGeometry=new THREE.PlaneGeometry(W,.34,nx,10);
  const flapMaterial=material.clone();flapMaterial.side=THREE.DoubleSide;
  const closure=new THREE.Mesh(flapGeometry,flapMaterial);closure.name='closure-film';flap.add(closure);
  const tape=new THREE.Mesh(new THREE.PlaneGeometry(1.67,.018),new THREE.MeshBasicMaterial({color:0xd8e4eb,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}));
  flap.add(tape);
  const pos=geometry.attributes.position;
  let previousEmpty=-1,previousOpening=-1;
  function update(opening,empty){
    if(Math.abs(previousEmpty-empty)<.0001&&Math.abs(previousOpening-opening)<.0001)return;
    previousEmpty=empty;previousOpening=opening;
    // Empty means the comic has left; the backing board is still enclosed.
    // Contract the front film toward the board, not toward the book's origin.
    const centerZ=THREE.MathUtils.lerp(-.005,-.0185,empty);
    const halfDepth=THREE.MathUtils.lerp(.0195,.006,empty);
    const surfaceDepth=(x,y)=>{
      const edge=Math.abs(x)/(W/2);
      const sideTaper=1-THREE.MathUtils.smoothstep(Math.abs(x),.902,W/2);
      const bottomTaper=THREE.MathUtils.smoothstep(y,bottom,-1.392);
      const crease=Math.pow(edge,12)*Math.sin(y*39+x*4)*.0005;
      return Math.max(.00025,halfDepth+.0005*Math.sin(x*4+y*6)+crease)*sideTaper*bottomTaper;
    };
    for(let side=0;side<2;side++)for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++){
      const i=side*faceCount+row*stride+col,x=xAt(col),y=yAt(row),t=(y-bottom)/height;
      const edge=Math.abs(x)/(W/2),sideTaper=1-THREE.MathUtils.smoothstep(Math.abs(x),.902,W/2);
      const mouth=side===0?opening*.013*Math.pow(t,18)*sideTaper:0;
      const depth=surfaceDepth(x,y)+mouth;
      // Small outward wrinkles can catch light without crossing rigid stock.
      const wrinkles=empty*.003*(.5+.5*Math.sin(x*11-y*2))*Math.sin(t*Math.PI)*sideTaper;
      const looseEdge=THREE.MathUtils.smoothstep(Math.abs(x),.902,W/2);
      const softX=x+empty*.003*Math.sin(y*6)*looseEdge;
      pos.setXYZ(i,softX,y,centerZ+(side===0?depth+wrinkles:-depth));
    }
    pos.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    // The flap shares the rear mouth's exact root, and swings away behind it.
    const angle=-Math.PI*(1-opening),cs=Math.cos(angle),sn=Math.sin(angle),fp=flapGeometry.attributes.position;
    for(let row=0;row<=10;row++)for(let col=0;col<=nx;col++){
      const x=xAt(col),y=(10-row)/10*.34,root=centerZ-surfaceDepth(x,top);
      const bend=.0018*Math.sin(y/.34*Math.PI)+.0006*Math.sin(x*20)*y/.34;
      const softX=x+empty*.003*Math.sin(top*6)*THREE.MathUtils.smoothstep(Math.abs(x),.902,W/2);
      fp.setXYZ(row*stride+col,softX*(1-.018*y/.34),y*cs-bend*sn,root+y*sn+bend*cs);
    }
    fp.needsUpdate=true;flapGeometry.computeVertexNormals();flapGeometry.computeBoundingSphere();
    const tapeY=.285,bend=.0018*Math.sin(tapeY/.34*Math.PI)+.0005;
    tape.position.set(0,tapeY*cs-bend*sn,centerZ-surfaceDepth(0,top)+tapeY*sn+bend*cs);tape.rotation.x=angle;
  }
  update(0,0);
  return {group,update};
}
