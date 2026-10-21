// Keep the native range input for touch, keyboard and assistive technology.
// The decorative ruler follows its value without creating a second control.
export const mobileControlsQuery='(max-width:700px), (pointer:coarse) and (max-width:950px) and (max-height:500px)';
export function createRuler(input,{ticks=49,format=value=>String(value),start,end}={}){
  const min=Number(input.min),max=Number(input.max);
  const root=document.createElement('div');root.className='ruler-control';
  input.before(root);root.append(input);
  const scale=document.createElement('div');scale.className='ruler-scale';scale.setAttribute('aria-hidden','true');
  const marks=Array.from({length:ticks},(_,i)=>{
    const mark=document.createElement('i');mark.style.setProperty('--tick-position',`${i/(ticks-1)*100}%`);
    scale.append(mark);return mark;
  });
  const cursor=document.createElement('span');cursor.className='ruler-cursor';scale.append(cursor);
  const ends=document.createElement('div');ends.className='ruler-ends';ends.setAttribute('aria-hidden','true');
  for(const text of [start??String(min),end??String(max)]){const span=document.createElement('span');span.textContent=text;ends.append(span);}
  root.prepend(scale);root.append(ends);
  function update(){
    const value=Number(input.value),progress=Math.max(0,Math.min(1,(value-min)/(max-min||1)));
    root.style.setProperty('--ruler-position',`${progress*100}%`);
    root.classList.toggle('is-disabled',input.disabled);input.setAttribute('aria-valuetext',format(value));
    marks.forEach((mark,i)=>{
      const position=i/(ticks-1),distance=Math.abs(position-progress);
      const rise=Math.exp(-distance*13)*15;
      mark.style.setProperty('--tick-length',`${(i%4===0?18:9)+rise}px`);
      mark.style.opacity=String(position<=progress ? .78 : .2+Math.exp(-distance*13)*.23);
    });
  }
  const mobile=matchMedia(mobileControlsQuery);
  const orient=()=>input.setAttribute('aria-orientation',mobile.matches?'vertical':'horizontal');
  mobile.addEventListener('change',orient);orient();
  input.addEventListener('input',update);update();return {update};
}
