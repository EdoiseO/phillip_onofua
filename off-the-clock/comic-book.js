// A saddle-stitched comic from the reviewed comic-set model: folded cover,
// nested sheets and two staples, at true size (6⅝ × 10¼ in = 1.745 × 2.7).
// Only the printed covers are the site's own: they carry each comic's photo.
export const COMIC_WIDTH=1.745;
// The model stands the comic 0.0185 in front of its board. The comic's own
// group is centred on the booklet, so it can slide and turn about itself.
const COMIC_CENTER_Z=.0185;

export function createComicBook(THREE,{template,frontTexture,frontQuad=null,backTexture=null,backQuad=null,foil=false}){
  const group=new THREE.Group();group.name='saddle-stitched-comic';
  const comic=template.scene.getObjectByName('comic').clone(true);comic.position.z=-COMIC_CENTER_Z;group.add(comic);
  const coverMaterial=(map,foilAmount=0)=>new THREE.ShaderMaterial({
    uniforms:{art:{value:map},foil:{value:foilAmount}},side:THREE.DoubleSide,
    // Morph chunks keep the printed covers on the pages when the comic relaxes.
    vertexShader:`#include <common>
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
    fragmentShader:`uniform sampler2D art; uniform float foil; varying vec2 vArtUv; varying vec3 vWorld; varying vec3 vN;
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
        // Foil covers reflect a rainbow band that travels with the view, over
        // the print rather than replacing it. Light ink shows the most foil.
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
  function imageUv(u,v,quad){
    if(!quad)return [u,v];
    // Sample the exact photographed print inside its four corners. Source
    // images are kept unchanged; this is the cover surface's texture mapping.
    const [tl,tr,br,bl]=quad;
    return [(bl[0]*(1-u)+br[0]*u)*(1-v)+(tl[0]*(1-u)+tr[0]*u)*v,
      1-((bl[1]*(1-u)+br[1]*u)*(1-v)+(tl[1]*(1-u)+tr[1]*u)*v)];
  }
  const relaxing=[],ownMaterials=[];
  comic.traverse(o=>{
    if(!o.isMesh)return;
    if(o.morphTargetDictionary?.free_bow!==undefined)relaxing.push(o);
    const name=o.material.name,front=name==='cover_front';
    if(!front&&name!=='cover_back')return;
    const map=front?frontTexture:backTexture;
    if(!map){o.material=new THREE.MeshStandardMaterial({color:0x33343a,roughness:.55});ownMaterials.push(o.material);return;}
    // glTF UVs run from the top of the image; the site's covers load the usual
    // way up. Each comic gets its own UVs for its photograph's quad.
    o.geometry=o.geometry.clone();
    const uv=o.geometry.attributes.uv,quad=front?frontQuad:backQuad;
    for(let i=0;i<uv.count;i++)uv.setXY(i,...imageUv(uv.getX(i),1-uv.getY(i),quad));
    uv.needsUpdate=true;
    o.material=coverMaterial(map,front&&foil?1:0);ownMaterials.push(o.material);
  });
  let previous=-1;
  // 0 is flat inside the sleeve; 1 is the relaxed bow once it is out.
  function setFree(value){
    if(Math.abs(value-previous)<.0001)return;previous=value;
    for(const mesh of relaxing)mesh.morphTargetInfluences[mesh.morphTargetDictionary.free_bow]=value;
  }
  setFree(0);
  return {group,setFree,dispose(){ownMaterials.forEach(m=>m.dispose());}};
}
