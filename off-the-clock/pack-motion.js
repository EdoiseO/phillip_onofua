export const PACK_DURATION=2.3;
export const FILE_DURATION=1.5;
export const TEAR_THRESHOLD=.6;
export const PULL_SCALE=.975;
export const BAG_SCALE=.9;
export const SLOT_HEIGHT=1.42;
export const SLOT_LEAN=-.025;
export const collectionSlot=(i,count)=>({
  x:(i%3-1)*.014,y:SLOT_HEIGHT,z:1.43-i*(2.86/Math.max(1,count-1)),roll:(i%3-1)*.009,
});
export const SHORT_BOX={width:2.16,height:2.9,depth:4.15,wall:.068};
export const tornPouchSeat=amount=>({scale:BAG_SCALE-.025*amount,lift:.064*amount});
export const showTearStrip=(phase,time)=>phase==='sealed'||(phase==='opening'&&time<1.02);
export const PACK_STACK_Z=[0,.025,-.025];

const clamp=t=>Math.max(0,Math.min(1,t));
export const smooth=(from,to,value)=>{
  const t=clamp((value-from)/(to-from));
  return t*t*(3-2*t);
};
const mix=(a,b,t)=>a+(b-a)*t;

// The front half of the authored clip is the attached peel. The rest is the
// free strip's curl, tumble and landing, driven by the same clock as the pack.
export function sampleTear(time,from=0){
  return mix(from,1,smooth(0,.30,time));
}

export function tearProgress(from,to,dx,dy){
  const x=to.x-from.x,y=to.y-from.y;
  return clamp((x*dx+y*dy)/Math.max(1,x*x+y*y));
}

export function samplePack(time,index,phone=false){
  const pop=.30+index*.12,end=pop+.26;
  const rise=smooth(pop,end-.065,time);
  const bounce=.095*(smooth(end-.105,end-.055,time)-smooth(end-.055,end,time));
  const spread=smooth(.8,1.3,time),drop=smooth(.99,1.3,time);
  const side=index-1;
  const rowZ=phone?[.015,.24,-.20]:[0,.16,0];
  const start=1.30+index*.15,t=time-start;
  const board=smooth(.105,.20,t),lift=smooth(.15,.34,t),align=smooth(.34,.40,t);
  const insert=smooth(.40,.625,t),seal=smooth(.64,.70,t);
  const prepared=3.06*lift*(1-insert);
  const filmY=.18*(1-insert);
  return {
    x:side*(phone?1.37:1.97)*spread,
    y:3.20*(rise+bounce)*(1-drop)-.17*smooth(0,.30,time)*(1-spread)+.07*(1-Math.abs(side))*spread,
    z:mix(PACK_STACK_Z[index],rowZ[index],spread),
    roll:-side*(phone?.055:.025)*spread,
    yaw:-side*(phone?.045:.035)*spread,
    scale:mix(PULL_SCALE,1,spread),
    visible:time>=pop,
    boardVisible:t>=.105,filmVisible:t>=0,
    // The film descends as the book and board drop further, entering via
    // its fully open top. Outside that window the film cannot touch either.
    bookY:prepared+filmY*lift,boardY:prepared+filmY*lift-.66*(1-board),
    filmY,filmZ:-.46*(1-align),flap:smooth(0,.095,t)*(1-seal),
    shine:t<.625?-1:clamp((t-.625)/.075),
  };
}

export function samplePouch(time){
  return {y:-.17*smooth(0,.30,time)-1.5*smooth(.79,1.02,time),
    opacity:1-smooth(.81,1.02,time)};
}

export function sampleFile(time,index){
  const t=time-index*.20,liftUp=smooth(0,.23,t),reach=smooth(.21,.62,t),drop=smooth(.62,1.10,t);
  return {liftUp,reach,drop,arc:Math.sin(Math.PI*reach)*.18};
}

export function makePackEntries(bag){
  return bag.pulls.map((pull,index)=>({
    id:bag.id+'-pull-'+(index+1),title:bag.title,issue:bag.issue,series:bag.series,
    publisher:bag.publisher,year:bag.year,variant:pull.variant,artist:pull.artist,
    cover:pull.cover,backCover:pull.back,backFrom:pull.backFrom,finish:pull.finish,
    backAssetType:pull.backFrom?'shared-dynamite-back':undefined,
  }));
}
