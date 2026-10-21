// A velocity-continuous clock prevents the first-frame jump of exponential
// position damping, including when a user reverses an opening mid-flight.
export function advanceLidMotion(state,target,dt,reduced=false) {
  if(reduced){state.progress=target;state.velocity=0;return;}
  if(state.progress===target&&state.velocity===0)return;
  const speed=target? .52:-.52,decay=Math.exp(-10*dt);
  const distance=speed*dt+(state.velocity-speed)*(1-decay)/10;
  state.velocity=speed+(state.velocity-speed)*decay;
  state.progress=Math.max(0,Math.min(1,state.progress+distance));
  if(state.progress===target)state.velocity=0;
}

// Overlapping minimum-jerk phases keep the lift, carry, turn and landing
// connected. Switching sides still travels around the body corners.
export function lidPose(THREE, progress, side=1, tilt=0) {
  const smooth=THREE.MathUtils.smoothstep,clamp=THREE.MathUtils.clamp;
  const ease=(from,to)=>THREE.MathUtils.smootherstep(progress,from,to);
  side=clamp(side,-1,1);tilt=clamp(tilt,-.16,.24);
  const lift=ease(0,.32),travel=ease(.12,.66),turn=ease(.48,.98),lower=ease(.58,1);
  const restingRotation=new THREE.Euler(Math.PI-.035+tilt*.5,.28*side,-.025*side,'YXZ');
  const rotation=new THREE.Euler(restingRotation.x*turn,restingRotation.y*turn,restingRotation.z*turn,'YXZ');
  // Fit the final skirt contact once per pose. Using the changing rotation's
  // lowest corner in the flight path introduced a kink halfway through a flip.
  let minY=Infinity;
  const corner=new THREE.Vector3();
  for(const x of [-1.2,1.2])for(const y of [-.21,.135])for(const z of [-2.185,2.185]){
    corner.set(x,y,z).applyEuler(restingRotation);minY=Math.min(minY,corner.y);
  }
  const groundedY=.025-minY;
  // A rounded rectangle path clears the body corners while keeping the
  // two resting positions close. A circular arc cut through the rear walls.
  const routeX=3.08*Math.tanh(4*side)/Math.tanh(4);
  const routeZ=-4.8*(1-smooth(Math.abs(side),.35,1))+.18*Math.abs(side);
  return {
    position:[routeX*travel,THREE.MathUtils.lerp(2.88+.68*lift,groundedY,lower),routeZ*travel],
    rotation
  };
}
