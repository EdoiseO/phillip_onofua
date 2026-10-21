import {stickerPack} from './stickers.js?v=17.0';

export function createStickerStudio({stage,box,beforeOpen,afterClose}){
  const $=id=>document.getElementById(id),dialog=$('sticker-studio'),anchor=document.createComment('Sticker studio return point');
  const system=box.stickers;
  let active=false,ready=false,mode='turn',selected=stickerPack[0],gesture=null,lastPlacement={surface:'wall',u:.87,v:1.05},loadId=0;
  const options={size:1,angle:-8,finish:'gloss'};
  const buttons=stickerPack.map((art,i)=>{
    const button=document.createElement('button');button.className='sticker-choice';button.type='button';button.setAttribute('aria-label',art.name);button.setAttribute('aria-pressed',String(i===0));
    const img=document.createElement('img');img.src=art.src;img.alt='';img.width=96;img.height=96;img.loading='lazy';
    const label=document.createElement('span');label.textContent=art.name;button.append(img,label);button.addEventListener('click',()=>choose(art));$('sticker-pack').append(button);return button;
  });
  function say(text){$('sticker-feedback').textContent=text;}
  function refresh(){
    const draft=system.draft();dialog.dataset.mode=mode;
    $('sticker-selected-name').textContent=selected.name;$('sticker-selected-note').textContent=selected.note;
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(stickerPack[i].id===selected.id)));
    $('sticker-turn').setAttribute('aria-pressed',String(mode==='turn'));$('sticker-position').setAttribute('aria-pressed',String(mode==='position'));
    $('sticker-place').disabled=!draft||!ready||system.count()>=24;
    $('sticker-undo').disabled=!system.canUndo();$('sticker-clear').disabled=system.count()===0;
    $('sticker-count').textContent=`${String(system.count()).padStart(2,'0')} / 24`;
    $('sticker-save-note').textContent=system.saved()?'Saved on this device. Your box, your stickers.':'Kept for this session. Device storage is unavailable.';
    $('sticker-placement-note').textContent=draft?(system.wraps()?'Wrapping around the corner':draft.surface==='lid'?'On the lid · moves with it':'Preview on the box'):'Pick a sticker to begin';
    $('sticker-placement-note').classList.toggle('is-wrap',system.wraps());
    $('sticker-stage-hint').textContent=mode==='turn'?'Drag to turn the box · Choose a side below':'Tap or drag on the box to position · Place when it feels right';
    $('sticker-size-value').textContent=`${Math.round(options.size*100)}%`;$('sticker-angle-value').textContent=`${options.angle}°`;
    stage.setAttribute('aria-label',mode==='turn'?'Sticker studio. Drag or use arrow keys to turn the box. Choose Position sticker to place it.':'Sticker studio. Tap or drag on the box to preview a sticker. Arrow keys nudge it. Enter places it. Escape returns to the box.');
  }
  function preview(){
    if(!ready)return;
    const data=system.setDraft({...lastPlacement,...options,art:selected.id});lastPlacement={surface:data.surface,u:data.u,v:data.v};refresh();
  }
  function choose(art){selected=art;preview();say(`${art.name} selected. Position it on the box, then choose Place sticker.`);}
  function setMode(value){mode=value;refresh();}
  function position(x,y){const hit=system.pick(x,y);if(!hit)return false;lastPlacement={surface:hit.surface,u:hit.u,v:hit.v};preview();return true;}
  async function open(){
    if(active)return;active=true;beforeOpen();stage.before(anchor);$('sticker-stage').append(stage);
    dialog.showModal();document.body.classList.add('is-decorating');box.decorate(true);mode='turn';
    $('sticker-place').disabled=true;say('Unpacking the sticker pack…');refresh();
    const current=++loadId;
    try{await system.ready();if(!active||current!==loadId)return;ready=true;if(system.count()===0)preview();else refresh();say('Start with a sticker. Turn the box, then switch to Position sticker.');}
    catch(error){console.error('Unable to prepare the sticker pack',error);say('The stickers could not load. Close and reopen the pack to try again.');}
    if(active)$('sticker-turn').focus({preventScroll:true});
  }
  function close(){
    if(!active)return;active=false;++loadId;gesture=null;system.clearDraft();box.decorate(false);box.hold(false);
    dialog.close();document.body.classList.remove('is-decorating');anchor.replaceWith(stage);afterClose();$('decorate-button').focus({preventScroll:true});
  }
  function place(){
    if(!system.place())return;
    say(`${selected.name} placed${lastPlacement.surface==='lid'?' on the lid':''}. Pick another sticker or undo the last change.`);refresh();
  }
  $('decorate-button').addEventListener('click',open);$('sticker-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  $('sticker-turn').addEventListener('click',()=>setMode('turn'));
  $('sticker-position').addEventListener('click',()=>{if(!system.draft())preview();setMode('position');});
  $('sticker-place').addEventListener('click',place);
  $('sticker-undo').addEventListener('click',()=>{system.undo();say('Last change undone.');refresh();});
  $('sticker-clear').addEventListener('click',()=>{system.reset();say('Box cleared. Undo brings the stickers back.');refresh();});
  $('sticker-size').addEventListener('input',e=>{options.size=Number(e.target.value);preview();});
  $('sticker-angle').addEventListener('input',e=>{options.angle=Number(e.target.value);preview();});
  for(const finish of ['gloss','holo'])$(`sticker-${finish}`).addEventListener('click',()=>{
    options.finish=finish;for(const value of ['gloss','holo'])$(`sticker-${value}`).setAttribute('aria-pressed',String(value===finish));preview();
  });
  for(const face of ['front','right','back','left','lid'])$(`sticker-face-${face}`).addEventListener('click',()=>{
    box.decorationFace(face);setMode('turn');
    const poses={front:{surface:'wall',u:0,v:1.1},right:{surface:'wall',u:3.22,v:1.1},back:{surface:'wall',u:6.45,v:1.1},left:{surface:'wall',u:9.67,v:1.1},lid:{surface:'lid',u:0,v:0}};
    if(!system.draft())lastPlacement=poses[face];
    say(`${face==='lid'?'Lid':face+' side'} in view. Switch to Position sticker to move the preview.`);
  });
  // Capture only while the studio owns the stage, leaving all comic controls
  // and click-away inspection behaviour untouched when it closes.
  stage.addEventListener('pointerdown',e=>{
    if(!active)return;e.stopImmediatePropagation();if(e.button>0||e.target.closest('button'))return;
    stage.focus({preventScroll:true});box.hold(true);gesture={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);
    if(mode==='position'&&!position(e.clientX,e.clientY))say('Tap a surface of the box or lid to move the preview.');
  },true);
  stage.addEventListener('pointermove',e=>{
    if(!active)return;e.stopImmediatePropagation();if(!gesture||gesture.id!==e.pointerId)return;
    if(mode==='turn')box.rotate((e.clientX-gesture.x)*.009,(e.clientY-gesture.y)*.006);
    else position(e.clientX,e.clientY);
    gesture.x=e.clientX;gesture.y=e.clientY;
  },true);
  function end(e){if(!active)return;e.stopImmediatePropagation();if(gesture?.id!==e.pointerId)return;gesture=null;box.hold(false);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}
  stage.addEventListener('pointerup',end,true);stage.addEventListener('pointercancel',end,true);
  stage.addEventListener('dblclick',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},true);
  stage.addEventListener('wheel',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
  stage.addEventListener('keydown',e=>{
    if(!active||e.target!==stage)return;e.stopImmediatePropagation();
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Escape'].includes(e.key))e.preventDefault();
    if(e.key==='Escape'){close();return;}if(e.key==='Enter'||e.key===' '){place();return;}
    const dx=e.key==='ArrowLeft'?-.08:e.key==='ArrowRight'?.08:0,dy=e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0;
    if(!dx&&!dy)return;
    if(mode==='turn')box.rotate(dx,-dy);else{lastPlacement.u+=dx;lastPlacement.v+=dy;preview();}
  },true);
  return {open,close,get active(){return active;}};
}
