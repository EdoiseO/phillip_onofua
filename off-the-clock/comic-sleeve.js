// A current-size polypropylene bag (6⅞ × 10½ in) and its backing board, from
// the reviewed comic-set model. The flap folds down the back of the board.
export const BOARD_Z=-.0185;
export const FILM_WIDTH_SCALE=1.057;
export const FILM_HEIGHT_SCALE=1.008;
export const FILM_DEPTH_SCALE=1.16;
export const EMPTY_FRONT_SCALE=.72;
// The model's flap opens about its hinge's local +X, to 150° at most.
const FLAP_OPEN=150*Math.PI/180;

export function createComicSleeve(THREE,template){
  const group=new THREE.Group();group.name='bagged-and-boarded';
  // The model is centred on the board; the site keeps the board 0.0185
  // behind the comic's own centre.
  const holder=new THREE.Group();holder.position.z=BOARD_Z;group.add(holder);
  const board=template.scene.getObjectByName('backing_board').clone(true);board.name='backing-board';
  const sleeve=template.scene.getObjectByName('sleeve').clone(true);
  holder.add(board,sleeve);
  // The photographed model tapers into its welds. Give the board clearance
  // inside the taper as well as between the nominal side edges.
  sleeve.scale.set(FILM_WIDTH_SCALE,FILM_HEIGHT_SCALE,FILM_DEPTH_SCALE);
  // Reflect bright studio strips and dark cards on the film itself. No diffuse grey layer,
  // refractive blur, or detached plane carrying an artificial highlight. The
  // flap drops the dark cards: over the white board they read as an opaque band.
  const filmMaterial=darkCards=>new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, depthTest:true, side:THREE.FrontSide,
    forceSinglePass:true,
    uniforms:{darkCards:{value:darkCards},sweep:{value:-1}},
    vertexShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilm;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vWorldPosition=world.xyz;
        vFilm=position.xy;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float darkCards,sweep;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilm;
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
        if(sweep>=0.0){
          float stripe=(vFilm.x*.8+vFilm.y*.19+.95)/1.9;
          brightAlpha+=.25*sin(sweep*3.14159265)*exp(-pow((stripe-sweep)/.095,2.0));
        }
        float darkAlpha=min(darkCard,1.0)*(.20+.07*fresnel)*darkCards;
        float clearAlpha=.002+fresnel*.045;
        float total=brightAlpha+darkAlpha+clearAlpha;
        vec3 reflection=(vec3(.91,.96,1.0)*(brightAlpha+clearAlpha)+vec3(.035,.05,.075)*darkAlpha)/max(total,.0001);
        gl_FragColor=vec4(reflection,min(total,.46));
        #include <colorspace_fragment>
      }`
  });
  const bodyFilm=filmMaterial(1),flapFilm=filmMaterial(0);
  const flap=sleeve.getObjectByName('sleeve_flap'),front=sleeve.getObjectByName('sleeve_front'),seams=sleeve.getObjectByName('sleeve_weld_edges');
  sleeve.traverse(o=>{
    if(!o.isMesh)return;
    // Clear film draws after the opaque comic and board behind it.
    o.renderOrder=1;
    if(o.material.name==='film'){let p=o;while(p&&p!==flap)p=p.parent;o.material=p?flapFilm:bodyFilm;}
  });
  let previousOpening=-1,previousEmpty=-1;
  // Opening swings the flap up off the back; empty means the comic has left,
  // so the front film settles toward the board that is still enclosed.
  function update(opening,empty){
    if(Math.abs(previousEmpty-empty)<.0001&&Math.abs(previousOpening-opening)<.0001)return;
    previousOpening=opening;previousEmpty=empty;
    flap.rotation.x=FLAP_OPEN*opening;
    const settle=THREE.MathUtils.lerp(1,EMPTY_FRONT_SCALE,empty);
    front.scale.z=settle;seams.scale.z=settle;
  }
  update(0,0);
  return {group,board,film:sleeve,update,shine(value){bodyFilm.uniforms.sweep.value=value;},dispose(){bodyFilm.dispose();flapFilm.dispose();}};
}
