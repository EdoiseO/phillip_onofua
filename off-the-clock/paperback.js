// DC Compact paperbacks use real trim dimensions in the same units as the
// reviewed 6⅝ × 10¼ inch comic model (2.7 units tall).
const UNITS_PER_INCH = 2.7 / 10.25;

// This is the same gloss-coated artwork shader as comic-book.js, applied to
// each of the paperback's three independently replaceable printed faces.
function coverMaterial(THREE, map) {
  return new THREE.ShaderMaterial({
    uniforms: { art: { value: map }, foil: { value: 0 } }, side: THREE.DoubleSide,
    vertexShader: `#include <common>
      #include <morphtarget_pars_vertex>
      varying vec2 vArtUv; varying vec3 vWorld; varying vec3 vN;
      void main(){
        vArtUv=uv;
        #include <morphinstance_vertex>
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        vec4 p=modelMatrix*vec4(transformed,1.0);vWorld=p.xyz;vec3 viewNormal=normalMatrix*objectNormal;vN=normalize(vec3(dot(viewMatrix[0].xyz,viewNormal),dot(viewMatrix[1].xyz,viewNormal),dot(viewMatrix[2].xyz,viewNormal)));gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader: `uniform sampler2D art; uniform float foil; varying vec2 vArtUv; varying vec3 vWorld; varying vec3 vN;
      void main(){
        vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;
        vec3 v=normalize(cameraPosition-vWorld),r=reflect(-v,n);
        vec2 p=r.xy/max(abs(r.z),.02);
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
        if(foil>0.0){
          vec3 spectrum=.5+.5*cos(6.2831853*(p.x*.45+p.y*.3+vArtUv.x*.8+vArtUv.y*.55+vec3(0.0,.3333333,.6666667)));
          float band=pow(.5+.5*cos(6.2831853*(diagonal*.85+vArtUv.y*.7)),3.0);
          float lightness=dot(ink,vec3(.2126,.7152,.0722));
          float strength=foil*(.2+.55*smoothstep(.06,.8,lightness))*(.3+.7*band);
          ink=ink*(1.0-strength*(1.0-spectrum))+spectrum*strength*.28;
        }
        gl_FragColor=vec4(ink*light+vec3(.9,.96,1.0)*(sheen+rim),1.0);
        #include <colorspace_fragment>
      }`
  });
}

function imageUv(u, v, quad) {
  if (!quad) return [u, v];
  const [tl, tr, br, bl] = quad;
  return [
    (bl[0]*(1-u)+br[0]*u)*(1-v)+(tl[0]*(1-u)+tr[0]*u)*v,
    1-((bl[1]*(1-u)+br[1]*u)*(1-v)+(tl[1]*(1-u)+tr[1]*u)*v)
  ];
}

function placeholder(THREE, title, side) {
  const canvas = document.createElement('canvas');
  canvas.width = side === 'spine' ? 128 : 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#263542'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#edf2ed'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (side === 'spine') {
    ctx.save(); ctx.translate(canvas.width/2, canvas.height/2); ctx.rotate(-Math.PI/2);
    ctx.font = 'bold 34px sans-serif'; ctx.fillText('Photo coming', 0, 0); ctx.restore();
  } else {
    ctx.font = 'bold 36px sans-serif';
    const words = title.split(/\s+/); let line = ''; const lines = [];
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > canvas.width - 48 && line) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    lines.forEach((value, i) => ctx.fillText(value, canvas.width/2, canvas.height/2 - (lines.length-1)*25 + i*50));
    ctx.font = '24px sans-serif'; ctx.fillText('Photo coming', canvas.width/2, canvas.height/2 + lines.length*30 + 30);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

/** A perfect-bound book, centred on its origin. Dimensions are in comic-box units.
 * setCover('front'|'back'|'spine', texture) swaps artwork as it streams in.
 * Quad coordinates are TL, TR, BR, BL in normalized photo coordinates.
 */
export function createPaperback(THREE, data) {
  const [widthInches, heightInches] = data.physicalSizeInches || [5.5, 8.5];
  const width = widthInches * UNITS_PER_INCH;
  const height = heightInches * UNITS_PER_INCH;
  const depth = (data.thicknessInches || .35) * UNITS_PER_INCH;
  const coverThickness = Math.min(.012 * UNITS_PER_INCH, depth / 12);
  const pageDepth = depth - coverThickness * 2;
  const group = new THREE.Group(); group.name = `paperback-${data.id || 'book'}`;
  const geometries = [], materials = [], placeholders = [], faces = {};
  const add = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh; };
  // The page block is square at the glued spine and gently rounded at the fore edge.
  const radius = Math.min(.024, width / 20), pageInset = (1 / 16) * UNITS_PER_INCH;
  // The block is attached to the spine and recessed at its three exposed edges.
  const left = -width/2 + coverThickness, right = width/2 - pageInset;
  const bottom = -height/2 + pageInset, top = height/2 - pageInset;
  const shape = new THREE.Shape();
  shape.moveTo(left, bottom); shape.lineTo(right-radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom+radius);
  shape.lineTo(right, top-radius); shape.quadraticCurveTo(right, top, right-radius, top);
  shape.lineTo(left, top); shape.closePath();
  const pagesGeometry = new THREE.ExtrudeGeometry(shape, {depth:pageDepth, steps:4, bevelEnabled:false, curveSegments:4});
  pagesGeometry.translate(0, 0, -pageDepth/2);
  const pagePositions = pagesGeometry.attributes.position;
  const foreRound = z => .003 * Math.max(0, 1 - (2*z/pageDepth)**2);
  for (let i=0; i<pagePositions.count; i++) {
    if (pagePositions.getX(i) > right - radius) {
      const influence = Math.max(0, Math.min(1, (pagePositions.getX(i) - (right-radius)) / radius));
      pagePositions.setX(i, pagePositions.getX(i) + foreRound(pagePositions.getZ(i)) * influence);
    }
  }
  pagePositions.needsUpdate = true; pagesGeometry.computeVertexNormals(); geometries.push(pagesGeometry);
  // ExtrudeGeometry's side-wall UVs are in object units. Remap each triangle
  // to run the photograph along the edge and across the page-block depth. The
  // rounded fore-edge corners remain part of this same textured side wall.
  const uv=pagesGeometry.attributes.uv, sideGroup=pagesGeometry.groups.find(part=>part.materialIndex===1);
  const stripAspect=1700/150;
  for(let i=sideGroup.start;i<sideGroup.start+sideGroup.count;i+=3){
    const xs=[0,1,2].map(j=>pagePositions.getX(i+j)), ys=[0,1,2].map(j=>pagePositions.getY(i+j));
    const alongX=Math.max(...xs)-Math.min(...xs)>=Math.max(...ys)-Math.min(...ys);
    for(let j=0;j<3;j++){
      const along=alongX?pagePositions.getX(i+j)-left:pagePositions.getY(i+j)-bottom;
      uv.setXY(i+j,along/(pageDepth*stripAspect),(pagePositions.getZ(i+j)+pageDepth/2)/pageDepth);
    }
  }
  uv.needsUpdate=true;
  const pagesMaterial = new THREE.MeshStandardMaterial({color:0x343532, roughness:.95});
  const edgeMaterial = new THREE.MeshStandardMaterial({color:data.id==='green-arrow-year-one'?0xaaa9a4:0x343532, roughness:.95});
  materials.push(pagesMaterial,edgeMaterial);
  const pages=add(new THREE.Mesh(pagesGeometry, [pagesMaterial,edgeMaterial]));pages.name='paperback-pages';
  // One continuous C-shaped cover shell connects back, bound spine and front.
  // The 0.012-inch board is thin but physically present rather than three planes.
  const wrap = new THREE.Shape();
  wrap.moveTo(-width/2,-depth/2); wrap.lineTo(width/2,-depth/2);
  wrap.lineTo(width/2,-depth/2+coverThickness); wrap.lineTo(-width/2+coverThickness,-depth/2+coverThickness);
  wrap.lineTo(-width/2+coverThickness,depth/2-coverThickness); wrap.lineTo(width/2,depth/2-coverThickness);
  wrap.lineTo(width/2,depth/2); wrap.lineTo(-width/2,depth/2); wrap.closePath();
  const wrapGeometry=new THREE.ExtrudeGeometry(wrap,{depth:height,steps:1,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2});
  // Profile y is book z and extrusion is book height.
  wrapGeometry.rotateX(Math.PI/2);wrapGeometry.translate(0,height/2,0);geometries.push(wrapGeometry);
  const wrapMaterial=new THREE.MeshStandardMaterial({color:0x262828,roughness:.7});materials.push(wrapMaterial);
  const coverShell=add(new THREE.Mesh(wrapGeometry,wrapMaterial));coverShell.name='paperback-cover-wrap';
  // Lightly embossed binding creases sit 0.3 inches from the spine.
  const creaseX=-width/2+.3*UNITS_PER_INCH, creasePositions=[];
  for(const z of [-depth/2-.0022,depth/2+.0022]) creasePositions.push(creaseX,-height/2+.012,z,creaseX,height/2-.012,z);
  const creaseGeometry=new THREE.BufferGeometry();creaseGeometry.setAttribute('position',new THREE.Float32BufferAttribute(creasePositions,3));geometries.push(creaseGeometry);
  const creaseMaterial=new THREE.LineBasicMaterial({color:0x111111,transparent:true,opacity:.3,depthWrite:false});materials.push(creaseMaterial);
  const creases=new THREE.LineSegments(creaseGeometry,creaseMaterial);creases.renderOrder=2;group.add(creases);
  for (const side of ['front','back','spine']) {
    const geometry = new THREE.PlaneGeometry(side === 'spine' ? depth : width, height, 16, 32); geometries.push(geometry);
    // Slightly round the printed face at the exposed outer corners while keeping the UV grid.
    if(side!=='spine'){
      const position=geometry.attributes.position, corner=.012;
      for(let i=0;i<position.count;i++){
        const x=position.getX(i),y=position.getY(i);
        if(Math.abs(x)>width/2-corner&&Math.abs(y)>height/2-corner){
          position.setXY(i,Math.sign(x)*(width/2-corner*.293),Math.sign(y)*(height/2-corner*.293));
        }
      }
      position.needsUpdate=true;geometry.computeVertexNormals();
    }
    const initial = placeholder(THREE, data.title || 'Compact comic', side); placeholders.push(initial);
    const material = coverMaterial(THREE, initial); materials.push(material);
    const mesh = add(new THREE.Mesh(geometry, material)); mesh.name = `paperback-${side}`;
    if (side === 'front') mesh.position.z = depth/2 + .002;
    else if (side === 'back') { mesh.position.z = -depth/2 - .002; mesh.rotation.y = Math.PI; }
    else { mesh.position.x = -width/2 - .002; mesh.rotation.y = -Math.PI/2; }
    faces[side] = {mesh, geometry, material, originalUV: geometry.attributes.uv.array.slice(), quad:data[`${side}Quad`] || null};
  }
  function setCover(side, map) {
    const face = faces[side];
    if (!face) throw new TypeError(`Unknown paperback face: ${side}`);
    if (!map) return;
    const {geometry, quad, originalUV} = face;
    const uv = geometry.attributes.uv;
    // Preserve the original grid UVs, so replacements are
    // always mapped from the original coordinates rather than from a prior photo.
    for (let i=0; i<uv.count; i++) {
      const u = originalUV[i*2], v = originalUV[i*2+1];
      uv.setXY(i, ...imageUv(u, v, quad));
    }
    uv.needsUpdate = true;
    face.material.uniforms.art.value = map;
  }
  function setPageEdge(map) {
    if (!map) return;
    map.wrapS=THREE.RepeatWrapping;
    map.colorSpace=THREE.SRGBColorSpace;
    edgeMaterial.color.set(0xffffff);
    edgeMaterial.map=map;
    edgeMaterial.needsUpdate=true;
  }
  return {group, width, height, depth, setCover, setPageEdge, dispose() {
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    placeholders.forEach(texture => texture.dispose());
  }};
}
