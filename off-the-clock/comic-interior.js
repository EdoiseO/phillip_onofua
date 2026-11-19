// Coordinates are in page heights. The open poster's origin is the intersection
// of its creases, so folded panels stay attached to the same two hinges.
import * as THREE from 'three';

const PAGE_WIDTH = .655;
const DURATION = 920;
const mix = THREE.MathUtils.lerp;
function eased(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t < .5 ? 4*t**3 : 1 - (-2*t+2)**3/2;
}

function page(side) {
  const geometry = new THREE.PlaneGeometry(PAGE_WIDTH, 1, 32, 3);
  geometry.translate(side*PAGE_WIDTH/2, 0, 0);
  const positions = geometry.attributes.position, colors = [];
  for (let i=0; i<positions.count; i++) {
    const x = Math.abs(positions.getX(i))/PAGE_WIDTH;
    const gutter = Math.exp(-x*11);
    positions.setZ(i, .014*Math.sin(Math.PI*x) - .014*gutter);
    const light = 1 - .18*gutter - .018*x;
    colors.push(light, light, light);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function paperMaterial(color, side=THREE.FrontSide) {
  return new THREE.MeshBasicMaterial({color, side, vertexColors:true, toneMapped:false});
}

// Atlas coordinates are continuous across the two hinges. The pair of narrow
// highlights either side of each crease survives even in the flat reading pose.
function printMaterial() {
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    uniforms:{art:{value:null}},
    vertexShader:`varying vec2 sheetUv; varying vec3 facing;
      void main(){ sheetUv=uv; facing=normalMatrix*normal;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`uniform sampler2D art; varying vec2 sheetUv; varying vec3 facing;
      float ridge(float a){
        return .10*exp(-abs(a-.0018)*280.)-.14*exp(-abs(a+.002)*240.);
      }
      void main(){
        vec3 ink=gl_FrontFacing?texture2D(art,sheetUv).rgb:vec3(.74,.72,.66);
        vec3 n=normalize(gl_FrontFacing?facing:-facing);
        float light=.76+.24*abs(dot(n,normalize(vec3(-.24,.34,1.))));
        float crease=ridge(sheetUv.x-.5)+ridge(sheetUv.y-.5);
        gl_FragColor=vec4(ink*(light+crease)+.13*max(crease,0.),1.);
        #include <colorspace_fragment>
      }`,
  });
}

export function createComicInterior(comic, fetchArt, notify) {
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,20);
  camera.position.z = 8;
  const book = new THREE.Group(), sheet = new THREE.Group(), rightWing = new THREE.Group();
  scene.add(book,sheet);
  const leftLeaf = new THREE.Group();
  book.add(leftLeaf);
  const left = new THREE.Mesh(page(-1),paperMaterial(0xf5f1e6));
  const right = new THREE.Mesh(page(1),paperMaterial(0xffffff));
  leftLeaf.add(left); book.add(right);
  // The reverse of the swinging inside cover shows the actual edition.
  const coverGeometry = left.geometry.clone();
  const coverUv = coverGeometry.attributes.uv;
  for (let i=0; i<coverUv.count; i++) coverUv.setX(i,1-coverUv.getX(i));
  const cover = new THREE.Mesh(coverGeometry,paperMaterial(0xffffff,THREE.BackSide));
  leftLeaf.add(cover);
  for (const [leaf,parent] of [[left,leftLeaf],[right,book]]) {
    const stock = new THREE.Mesh(leaf.geometry,paperMaterial(0xcac6bb,THREE.DoubleSide));
    stock.position.set(Math.sign(leaf.geometry.attributes.position.getX(1))*.002,-.004,-.006);
    parent.add(stock);
  }

  const {poster} = comic;
  const ratio = poster.height/poster.width;
  const tileWidth=.5, tileHeight=ratio/2;
  const ink = printMaterial(), lower = [];
  sheet.add(rightWing);
  for (let col=0; col<2; col++) {
    const column = col ? rightWing : sheet;
    const bottom = new THREE.Group();
    column.add(bottom); lower.push(bottom);
    for (let row=0; row<2; row++) {
      const tile = new THREE.PlaneGeometry(tileWidth,tileHeight);
      const uv = tile.attributes.uv;
      for (let i=0;i<uv.count;i++) uv.setXY(i,(uv.getX(i)+col)/2,(uv.getY(i)+1-row)/2);
      tile.translate((col-.5)*tileWidth,(.5-row)*tileHeight,0);
      const mesh = new THREE.Mesh(tile,ink);
      (row ? bottom : column).add(mesh);
    }
  }
  const foldedMaterial = new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const folded = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth,tileHeight),foldedMaterial);
  folded.position.set(-tileWidth/2,tileHeight/2,.001);
  sheet.add(folded);

  let alive=true, changed=true, phase='seated', elapsed=0, direction=0, lastTime=0;
  let entryStart=performance.now(), entering=true, fullTexture, intent=0;
  function state(value) { phase=value; changed=true; notify(value); }
  function mapTo(surface,url) {
    return fetchArt(url).then(texture=>{
      if (!alive || !texture) return false;
      surface.map=texture; surface.needsUpdate=true; changed=true;
      return true;
    });
  }
  mapTo(cover.material,comic.cover);
  mapTo(foldedMaterial,poster.foldedImage);
  mapTo(right.material,comic.pages[0].image).then(loaded=>{
    if (!alive) return;
    if (!loaded) { notify('page-error'); return; }
    // Only the immediately following spread is warmed, once page 1 is ready.
    for (const page of comic.pages.slice(1,3)) fetchArt(page.image);
  });

  function travel(sign,reduced) {
    direction=sign;
    lastTime=performance.now();
    if (reduced) {
      elapsed=sign>0?DURATION:0; direction=0;
      state(sign>0?'open':'seated');
    } else state(sign>0?'opening':'closing');
  }
  async function reveal(reduced) {
    const request=++intent;
    if (!fullTexture) {
      state('loading');
      const texture=await fetchArt(poster.image);
      if (!alive || request!==intent) return;
      if (!texture) { state('seated'); notify('poster-error'); return; }
      fullTexture=texture; ink.uniforms.art.value=texture;
    }
    travel(1,reduced);
  }
  function stow(reduced) {
    intent++;
    if (phase==='loading' || elapsed===0) { direction=0; state('seated'); }
    else travel(-1,reduced);
  }

  function render(renderer,width,height,now,reduced) {
    changed=false;
    if (direction) {
      elapsed=reduced?(direction>0?DURATION:0):THREE.MathUtils.clamp(elapsed+direction*Math.max(0,now-lastTime),0,DURATION);
      lastTime=now;
      if ((direction>0 && elapsed===DURATION)||(direction<0 && elapsed===0)) {
        direction=0; state(elapsed?'open':'seated');
      }
    }
    const entry=reduced?1:eased((now-entryStart)/360);
    entering=entry<1;
    leftLeaf.rotation.y=(1-entry)*(Math.PI-.04);
    const lift=eased(elapsed/240), across=eased((elapsed-240)/310), down=eased((elapsed-550)/370);
    const aspect=width/height, phone=width<650;
    camera.left=-aspect; camera.right=aspect; camera.updateProjectionMatrix();
    const bookStart=Math.min(1.73,aspect*1.85/(2*PAGE_WIDTH));
    const bookHeight=bookStart*mix(1,phone?.64:.56,lift);
    book.scale.setScalar(bookHeight);
    book.rotation.set(-.065,-.045,.012);
    book.position.set(phone?0:-aspect*.61*lift,phone?(-1-bookHeight*.64)*lift:-.23*lift,0);
    const openWidth=Math.min(1.78/ratio,aspect*1.82);
    const size=mix(bookStart*.76,openWidth,lift);
    const endX=phone?0:aspect*.20;
    sheet.scale.setScalar(size);
    sheet.position.set(
      mix(bookStart*.33+size*.25,endX+(1-across)*openWidth*.22,lift),
      mix(-bookStart*.06-size*ratio*.25,-(1-down)*openWidth*ratio*.13,lift),
      mix(.065,1.65,lift)
    );
    sheet.rotation.set(mix(-.065,0,lift),mix(-.045,0,lift),mix(.012,0,lift));
    // The right stack folds behind the left, and the lower pair behind the upper.
    // Offset the hinge pins by a paper thickness to keep coplanar layers apart.
    rightWing.rotation.y=(1-across)*Math.PI;
    rightWing.position.z=-.004*(1-across);
    for (const hinge of lower) {
      hinge.rotation.x=(1-down)*Math.PI;
      hinge.position.z=-.001*(1-down);
    }
    ink.visible=!!fullTexture;
    folded.visible=!fullTexture;
    sheet.visible=entry>.98;
    renderer.render(scene,camera);
  }

  return {
    get phase(){return phase;},
    get needsPaint(){return changed||entering||direction!==0;},
    render,reveal,stow,
    dispose(){
      alive=false; intent++;
      const owned=new Set();
      scene.traverse(o=>{if(o.isMesh){owned.add(o.geometry);owned.add(o.material);}});
      owned.forEach(resource=>resource.dispose());
      // All artwork textures remain owned by the box's shared artwork cache.
    },
  };
}
