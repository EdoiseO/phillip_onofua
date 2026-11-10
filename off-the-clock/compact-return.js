import {createReturnMotion, advanceReturnMotion} from './return-motion.js?v=1.0';

// Run a continuous return, with a watchdog so an interrupted animation cannot
// leave the display controls locked. Cancellation is reserved for teardown.
export function startCompactReturn({onFrame,onComplete,request=requestAnimationFrame,cancel=cancelAnimationFrame,setTimer=setTimeout,clearTimer=clearTimeout,now=()=>performance.now()}){
  const motion=createReturnMotion(1,0,false);motion.duration=.7;
  let previous=now(),frame=0,timer=0,finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;clearTimer(timer);cancel(frame);onComplete();
  };
  const tick=time=>{
    if(finished)return;
    const dt=Math.min(.035,Math.max(0,(time-previous)/1000));previous=time;
    const state=advanceReturnMotion(motion,dt);
    onFrame(1-state.focus);
    if(state.done)finish();else frame=request(tick);
  };
  timer=setTimer(finish,2000);
  frame=request(tick);
  return ()=>{if(!finished){finished=true;clearTimer(timer);cancel(frame);}};
}
