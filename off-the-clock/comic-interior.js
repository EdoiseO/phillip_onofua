// Coordinates are in page heights. The open poster's origin is the intersection
// of its creases, so folded panels stay attached to the same two hinges.
import * as THREE from 'three';

const PAGE_WIDTH = .655;
const OPEN_MS = 1800;
const STOW_MS = 1500;
const SEATED_ROLL = THREE.MathUtils.degToRad(-3.75);
const OPEN_ROLL = THREE.MathUtils.degToRad(-1);
const SEATED_WIDTH = .76;
const mix = THREE.MathUtils.lerp;
function eased(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t < .5 ? 4*t**3 : 1 - (-2*t+2)**3/2;
}

// A gently front-weighted cosine leaves more time for the paper to settle.
function paperPhase(time, start, end) {
  const t = THREE.MathUtils.clamp((time-start)/(end-start), 0, 1);
  return (1-Math.cos(Math.PI*(t+.2*t*(1-t))))/2;
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
function printMaterial(heightToWidth) {
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    uniforms:{
      art:{value:null}, bend:{value:new THREE.Vector2()}, inverseHeight:{value:1/heightToWidth},
    },
    vertexShader:`uniform vec2 bend; uniform float inverseHeight;
      varying vec2 sheetUv; varying vec3 facing; varying vec3 eyePosition;
      void main(){
        sheetUv=uv;
        vec4 p=modelViewMatrix*vec4(position,1.);
        vec3 tangentX=modelViewMatrix[0].xyz, tangentY=modelViewMatrix[1].xyz;
        vec3 sag=vec3(0.,-1.,-.55)*length(tangentX);
        // Only free edges bow. Both layers of the doubled wing get the same
        // deflection in view space, even though their normals face opposite ways.
        vec2 arm=max(vec2(2.*uv.x-1.,1.-2.*uv.y),0.);
        p.xyz+=sag*dot(bend,arm*arm);
        tangentX+=sag*(4.*bend.x*arm.x);
        tangentY-=sag*(4.*bend.y*arm.y*inverseHeight);
        facing=cross(tangentX,tangentY);
        eyePosition=p.xyz; gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`uniform sampler2D art; varying vec2 sheetUv; varying vec3 facing; varying vec3 eyePosition;
      float ridge(float a){
        return .10*exp(-abs(a-.0018)*280.)-.14*exp(-abs(a+.002)*240.);
      }
      void main(){
        vec3 n=normalize(gl_FrontFacing?facing:-facing);
        float light=.79+.21*max(dot(n,normalize(vec3(-.24,.34,1.))),0.);
        float crease=ridge(sheetUv.x-.5)+ridge(sheetUv.y-.5);
        vec3 paper=vec3(.89,.87,.82)*(light+.32*crease);
        if(gl_FrontFacing){
          vec3 ink=texture2D(art,sheetUv).rgb;
          // Reflect a long softbox in the coated side only. Its position relative
          // to each fragment moves the reflection continuously across the folds.
          vec3 reflection=reflect(vec3(0.,0.,-1.),n);
          vec3 lamp=normalize(vec3(1.2,.9,-3.)-eyePosition);
          float offset=dot(reflection-lamp,normalize(vec3(1.,.35,0.)));
          float gloss=(.12*exp(-48.*offset*offset)+.08*exp(-540.*offset*offset))
                    *smoothstep(.05,.6,reflection.z);
          paper=ink*(light+crease)+vec3(.94,.97,1.)*gloss;
        }
        gl_FragColor=vec4(paper,1.);
        #include <colorspace_fragment>
      }`,
  });
}

export function createComicInterior(comic, fetchArt, notify) {
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1,1,1,-1,.01,20);
  camera.position.z = 8;
  const packetHome = new THREE.Vector3();
  const book = new THREE.Group(), sheet = new THREE.Group(), rightWing = new THREE.Group();
  scene.add(book,sheet);
  const leftLeaf = new THREE.Group();
  book.add(leftLeaf);
  const left = new THREE.Mesh(page(-1),paperMaterial(0xffffff));
  const right = new THREE.Mesh(page(1),paperMaterial(0xffffff));
  leftLeaf.add(left); book.add(right);
  // The outside of the turning leaf carries this edition's front cover.
  const coverGeometry = left.geometry.clone();
  const coverUv = coverGeometry.attributes.uv;
  for (let i=0; i<coverUv.count; i++) coverUv.setX(i,1-coverUv.getX(i));
  const cover = new THREE.Mesh(coverGeometry,paperMaterial(0xffffff,THREE.BackSide));
  leftLeaf.add(cover);
  for (const [leaf,parent] of [[left,leftLeaf],[right,book]]) {
    const stock = new THREE.Mesh(leaf.geometry,paperMaterial(0xcac6bb,THREE.FrontSide));
    stock.position.set(Math.sign(leaf.geometry.attributes.position.getX(1))*.002,-.004,-.006);
    parent.add(stock);
  }

  const {poster} = comic;
  const ratio = poster.height/poster.width;
  const tileWidth=.5, tileHeight=ratio/2;
  // The folded packet's centre sits slightly toward the fore-edge. Its origin
  // is a hinge at the corner, so rotate the centre-to-hinge offset in page space.
  const seatedHinge = new THREE.Vector3(tileWidth/2, -tileHeight/2, 0)
    .multiplyScalar(SEATED_WIDTH)
    .applyAxisAngle(new THREE.Vector3(0,0,1), SEATED_ROLL)
    .add(new THREE.Vector3(.35, -.045, .027));
  const ink = printMaterial(ratio), lower = [];
  sheet.add(rightWing);
  for (let col=0; col<2; col++) {
    const column = col ? rightWing : sheet;
    const bottom = new THREE.Group();
    column.add(bottom); lower.push(bottom);
    for (let row=0; row<2; row++) {
      const tile = new THREE.PlaneGeometry(tileWidth,tileHeight,12,12);
      const uv = tile.attributes.uv;
      for (let i=0;i<uv.count;i++) uv.setXY(i,(uv.getX(i)+col)/2,(uv.getY(i)+1-row)/2);
      tile.translate((col-.5)*tileWidth,(.5-row)*tileHeight,0);
      const mesh = new THREE.Mesh(tile,ink);
      (row ? bottom : column).add(mesh);
    }
  }
  // A sliver of the folded sheet catches light along its cut edges.
  const packetEdge=new THREE.Mesh(new THREE.PlaneGeometry(tileWidth,tileHeight),new THREE.MeshBasicMaterial({color:0xd7d2c6,toneMapped:false}));
  packetEdge.position.set(-tileWidth/2+.003,tileHeight/2-.004,-.009);
  sheet.add(packetEdge);

  let alive=true, changed=true, phase='seated', elapsed=0, direction=0, lastTime=0;
  let entryStart, entering=false, fullTexture, intent=0;
  let pitch=0, yaw=0;
  function state(value) {
    if(value==='seated'){pitch=0; yaw=0;}
    phase=value; changed=true; notify(value);
  }
  function mapTo(surface,url) {
    return fetchArt(url).then(texture=>{
      if (!alive || !texture) return false;
      surface.map=texture; surface.needsUpdate=true; changed=true;
      return true;
    });
  }
  const spread=Promise.all([
    mapTo(left.material,comic.pages[0].image),
    mapTo(right.material,comic.pages[1].image),
    mapTo(cover.material,comic.cover),
  ]).then(([leftReady,rightReady,coverReady])=>{
    if (!alive) return false;
    if (!leftReady || !rightReady) { notify('page-error'); return false; }
    entryStart=performance.now(); entering=coverReady; changed=true;
    return true;
  });

  function travel(sign,reduced) {
    direction=sign;
    lastTime=performance.now();
    if (reduced) {
      elapsed=sign>0?OPEN_MS:0; direction=0;
      state(sign>0?'open':'seated');
    } else state(sign>0?'opening':'closing');
  }
  async function reveal(reduced) {
    const request=++intent;
    if (!fullTexture) {
      state('loading');
      const [ready,texture]=await Promise.all([spread,fetchArt(poster.image)]);
      if (!alive || request!==intent) return;
      if (!ready) { state('seated'); notify('page-error'); return; }
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
      // Keep one pose clock when the visitor reverses a fold mid-swing.
      const rate=direction>0 ? 1 : -OPEN_MS/STOW_MS;
      const endpoint=direction>0 ? OPEN_MS : 0;
      elapsed=reduced ? endpoint : THREE.MathUtils.clamp(elapsed+rate*Math.max(0,now-lastTime),0,OPEN_MS);
      lastTime=now;
      if (elapsed===endpoint) {
        direction=0; state(elapsed?'open':'seated');
      }
    }
    const entry=reduced||!entering?1:eased((now-entryStart)/360);
    entering=entry<1;
    leftLeaf.rotation.y=(1-entry)*(Math.PI-.04);
    // The packet is nearly clear by 450 ms. Its lift eases through the first
    // crease, and the lower fold starts while the across fold is settling.
    const lift=paperPhase(elapsed,0,570);
    const across=paperPhase(elapsed,480,1180);
    const down=paperPhase(elapsed,1080,OPEN_MS);
    const acrossSwing=Math.sin(Math.PI*across), downSwing=Math.sin(Math.PI*down);
    ink.uniforms.bend.value.set(.014*acrossSwing,.018*downSwing);
    const aspect=width/height, phone=width<650;
    camera.left=-aspect; camera.right=aspect; camera.updateProjectionMatrix();
    const bookStart=Math.min(1.73,aspect*1.85/(2*PAGE_WIDTH));
    const bookHeight=bookStart*mix(1,phone ? .64 : .56,lift);
    book.scale.setScalar(bookHeight);
    book.rotation.set(-.065,-.045,.012);
    book.position.set(phone?0:-aspect*.61*lift,phone?(-1-bookHeight*.64)*lift:-.23*lift,0);
    const openWidth=Math.min(1.78/ratio,aspect*1.82);
    const size=mix(bookStart*SEATED_WIDTH,openWidth,lift);
    const endX=phone?0:aspect*.20;
    sheet.scale.setScalar(size);
    // Seat the packet in the tilted page's local plane. A fixed world Z
    // would bury it beneath the fore-edge at the larger desktop book size.
    packetHome.copy(seatedHinge).multiplyScalar(bookStart).applyEuler(book.rotation);
    sheet.position.set(
      mix(packetHome.x,endX+(1-across)*openWidth*.22,lift),
      mix(packetHome.y,-(1-down)*openWidth*ratio*.13,lift),
      mix(packetHome.z,1.65,lift)
    );
    // The in-plane tilt relaxes over the whole gesture, in either direction.
    sheet.rotation.set(
      mix(-.065,0,lift)+.38*downSwing+pitch*down,
      mix(-.045,0,lift)-.59*acrossSwing+yaw*down,
      book.rotation.z*(1-lift) + mix(SEATED_ROLL,OPEN_ROLL,paperPhase(elapsed,0,OPEN_MS))
    );
    packetEdge.visible=across<.01;
    // The lower panels fold face-to-face over the print. This leaves two
    // matte outer backs while the doubled right half opens across. The tiny
    // offsets give each folded layer its own depth at the ends of travel.
    rightWing.rotation.y=(1-across)*Math.PI;
    rightWing.position.z=-.004*(1-across);
    for (const hinge of lower) {
      hinge.rotation.x=-(1-down)*Math.PI;
      hinge.position.z=.002*(1-down);
    }
    sheet.visible=entry>.98;
    renderer.render(scene,camera);
  }

  return {
    get phase(){return phase;},
    get ready(){return entryStart!==undefined;},
    get needsPaint(){return this.ready&&(changed||entering||direction!==0);},
    render,reveal,stow,
    tilt(dx,dy){
      if(phase!=='open')return;
      yaw=THREE.MathUtils.clamp(yaw+dx*.005,-.38,.38);
      pitch=THREE.MathUtils.clamp(pitch+dy*.005,-.28,.28);
      changed=true;
    },
    dispose(){
      alive=false; intent++;
      const owned=new Set();
      scene.traverse(o=>{if(o.isMesh){owned.add(o.geometry);owned.add(o.material);}});
      owned.forEach(resource=>resource.dispose());
      // All artwork textures remain owned by the box's shared artwork cache.
    },
  };
}
