// A thin polypropylene sleeve around the backing board from the reviewed
// comic-set asset. Its front lip and flap span the mouth when sealed.
export const BOARD_Z=-.0185;
export const FLAP_OPEN=Math.PI/3; // Measured from upright toward the front: 30° above horizontal.
const HALF_WIDTH=.905,TOP=1.407,BOTTOM=-1.394,FRONT=.0155,BACK=-.024;
const BRIDGE=FRONT-BACK+.002,TAIL=.323;
const smooth=t=>{const x=Math.min(1,Math.max(0,t));return x*x*(3-2*x);};

export function createComicSleeve(THREE,template){
  const group=new THREE.Group();group.name='bagged-and-boarded';
  const board=template.scene.getObjectByName('backing_board').clone(true);board.name='backing-board';board.position.z=BOARD_Z;
  const sleeve=new THREE.Group();sleeve.name='sleeve';group.add(board,sleeve);
  // Put the frost, reflections and rim highlights on the film surfaces.
  // The flap skips dark reflections so it reads clearly against the white board.
  const filmMaterial=({darkCards=0,edgeTint=0,frost=0,topRim=0,sideRim=0,sheen=0})=>new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, depthTest:true, side:THREE.DoubleSide,
    forceSinglePass:true,
    uniforms:{
      darkCards:{value:darkCards},sweep:{value:-1},edgeTint:{value:edgeTint},
      frost:{value:frost},topRim:{value:topRim},sideRim:{value:sideRim},
      sheen:{value:sheen},flapTurn:{value:0},
    },
    vertexShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilm;
      varying vec2 vFilmUv;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vWorldPosition=world.xyz;
        vFilm=position.xy;
        vFilmUv=uv;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float darkCards,sweep,edgeTint;
      uniform float frost,topRim,sideRim,sheen,flapTurn;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vFilm;
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
        if(sweep>=0.0){
          float stripe=(vFilm.x*.8+vFilm.y*.19+.95)/1.9;
          brightAlpha+=.25*sin(sweep*3.14159265)*exp(-pow((stripe-sweep)/.095,2.0));
        }
        float darkAlpha=min(darkCard,1.0)*(.20+.07*fresnel)*darkCards;
        float clearAlpha=.002+fresnel*.045+edgeTint*(.3+.7*fresnel);
        clearAlpha+=frost*(.75+.25*fresnel);
        // Paint the rim on the film itself, roughly one pixel wide.
        vec2 pixel=clamp(fwidth(vFilmUv),vec2(.0005),vec2(.10));
        float rimTop=1.0-smoothstep(.55,1.45,(1.0-vFilmUv.y)/pixel.y);
        float rimSides=1.0-smoothstep(.55,1.45,min(vFilmUv.x,1.0-vFilmUv.x)/pixel.x);
        brightAlpha+=max(topRim*rimTop,sideRim*rimSides);
        // The same band travels across both segments as the flap turns.
        float band=(vFilmUv.x-mix(-.19,1.19,flapTurn))/.24;
        brightAlpha+=sheen*exp(-band*band)*(.56+.44*fresnel);
        float total=brightAlpha+darkAlpha+clearAlpha;
        vec3 reflection=(vec3(.91,.96,1.0)*(brightAlpha+clearAlpha)+vec3(.035,.05,.075)*darkAlpha)/max(total,.0001);
        gl_FragColor=vec4(reflection,min(total,.46));
        #include <colorspace_fragment>
      }`
  });
  const bodyFilm=filmMaterial({darkCards:1,frost:.046,topRim:.44});
  const weldFilm=filmMaterial({edgeTint:.07});
  const flapFinish={edgeTint:.07,frost:.14,sideRim:.52,sheen:.22};
  const bridgeFilm=filmMaterial(flapFinish);
  const tailFilm=filmMaterial({...flapFinish,topRim:.52});
  const owned=[];
  function sheet(parent,name,width,height,material){
    const geometry=new THREE.PlaneGeometry(width,height);
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.renderOrder=1;
    owned.push(geometry);parent.add(mesh);return mesh;
  }
  const height=TOP-BOTTOM,centerY=(TOP+BOTTOM)/2,depth=FRONT-BACK;
  // Keep both film faces straight through the mouth. The narrow welded
  // perimeter is separate from the two faces and cannot roll into the path.
  sheet(sleeve,'sleeve_front',2*HALF_WIDTH,height,bodyFilm).position.set(0,centerY,FRONT);
  sheet(sleeve,'sleeve_back',2*HALF_WIDTH,height,bodyFilm).position.set(0,centerY,BACK);
  for(const side of [-1,1]){
    const weld=sheet(sleeve,'sleeve_side_weld',depth,height,weldFilm);
    weld.rotation.y=Math.PI/2;weld.position.set(side*HALF_WIDTH,centerY,(FRONT+BACK)/2);
  }
  const bottom=sheet(sleeve,'sleeve_bottom_weld',2*HALF_WIDTH,depth,weldFilm);
  bottom.rotation.x=Math.PI/2;bottom.position.set(0,BOTTOM,(FRONT+BACK)/2);
  const flap=new THREE.Group();flap.name='sleeve_flap';
  flap.position.set(0,TOP,FRONT);sleeve.add(flap);
  const bridge=sheet(flap,'sleeve_flap_bridge',2*HALF_WIDTH,BRIDGE,bridgeFilm);
  const tail=sheet(flap,'sleeve_flap_panel',2*HALF_WIDTH,TAIL,tailFilm);
  const inverse=new THREE.Quaternion();
  let previousOpening=-1;
  function update(opening){
    if(Math.abs(previousOpening-opening)<.00001)return;
    previousOpening=opening;
    // Peel the taped section away from the back first. Once straight,
    // the two segments swing together off the front lip as a flat panel.
    const angle=THREE.MathUtils.lerp(-Math.PI/2,FLAP_OPEN,smooth((opening-.29)/.71));
    const tailAngle=opening<.29?THREE.MathUtils.lerp(-Math.PI,-Math.PI/2,smooth(opening/.29)):angle;
    const y=Math.cos(angle)*BRIDGE,z=Math.sin(angle)*BRIDGE;
    bridge.rotation.x=angle;bridge.position.set(0,y/2,z/2);
    tail.rotation.x=tailAngle;tail.position.set(0,y+Math.cos(tailAngle)*TAIL/2,z+Math.sin(tailAngle)*TAIL/2);
    bridgeFilm.uniforms.flapTurn.value=opening;
    tailFilm.uniforms.flapTurn.value=opening;
  }
  function placeBoard(x,y,z){
    // Express the desired position in the comic's frame, even as the empty
    // sleeve turns aside. This keeps the board upright beside the comic.
    inverse.copy(group.quaternion).invert();
    board.position.set(x,y,z).sub(group.position).applyQuaternion(inverse);
    board.quaternion.copy(inverse);
  }
  update(0);
  return {group,board,film:sleeve,flap,flapPanel:tail,update,placeBoard,
    shine(value){bodyFilm.uniforms.sweep.value=value;},
    dispose(){
      bodyFilm.dispose();weldFilm.dispose();bridgeFilm.dispose();tailFilm.dispose();
      owned.forEach(g=>g.dispose());
    }};
}

// Both the interactive extraction and Back to the box pose this exact rig.
// Translate the comic out of the film's depth before lowering it beside the board.
export function poseComicSleeve(card,{pull,separate,lower,free,bagOpen}){
  const height=3.05*pull-2.57*lower;
  card.book.position.set(.75*separate,height,.36*separate);
  card.book.rotation.z=-.025*separate;
  card.booklet.setFree(free);
  card.sleeve.position.set(-1.12*separate,-.26*separate,-.36*separate);
  card.sleeve.rotation.set(0,-.28*separate,.1*separate);
  card.bag.placeBoard(-1.12*separate,height,BOARD_Z+.30*separate);
  card.bag.update(bagOpen);
}

export function posePackSleeve({book,bag},p){
  book.position.y=p.bookY;
  bag.board.visible=p.boardVisible;bag.board.position.y=p.boardY;
  bag.film.visible=p.filmVisible;bag.film.position.set(0,p.filmY,p.filmZ);
  bag.update(p.flap);bag.shine(p.shine);
}
