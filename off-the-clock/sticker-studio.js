import {stickerPack} from './stickers.js?v=30.0';
import {createRuler,mobileControlsQuery} from './ruler-control.js?v=19.0';

export function createStickerStudio({stage,box,beforeOpen,afterClose}){
  const $=id=>document.getElementById(id),dialog=$('sticker-studio'),anchor=document.createComment('Sticker studio return point');
  const system=box.stickers;
  let active=false,ready=false,selected=stickerPack[0],gesture=null,drag=null,lastPlacement={surface:'wall',u:.87,v:1.05},loadId=0;
  const options={size:1,angle:-8,finish:'gloss'};
  const sizeRuler=createRuler($('sticker-size'),{ticks:49,start:'SMALL',end:'LARGE',format:value=>`${Math.round(value*100)} percent`});
  const angleRuler=createRuler($('sticker-angle'),{ticks:61,start:'−180°',end:'+180°',format:value=>`${value} degrees`});
  const adjustmentFields=dialog.querySelector('.sticker-adjustments'),adjustmentAnchor=document.createComment('Desktop sticker controls');
  adjustmentFields.before(adjustmentAnchor);
  const mobileControls=matchMedia(mobileControlsQuery);
  const faceControls=dialog.querySelector('.sticker-faces'),faceAnchor=document.createComment('Desktop surface controls');
  faceControls.before(faceAnchor);
  const collectionHeading=$('sticker-pack-heading'),collectionAnchor=document.createComment('Desktop sticker collections');
  collectionHeading.before(collectionAnchor);
  function moveMobileControls(){
    const order=mobileControls.matches?['front','back','left','right','lid']:['front','right','back','left','lid'];
    for(const face of order)faceControls.append($(`sticker-face-${face}`));
    if(mobileControls.matches){
      $('sticker-mobile-rail').append(adjustmentFields);
      $('sticker-view-dock').append(faceControls);
      $('sticker-collection-dock').append(collectionHeading);
    }else{
      adjustmentAnchor.after(adjustmentFields);
      faceAnchor.after(faceControls);
      collectionAnchor.after(collectionHeading);
    }
  }
  let selectedFace;
  function selectFace(face=null){
    if(selectedFace===face)return;selectedFace=face;
    for(const name of ['front','right','back','left','lid'])$(`sticker-face-${name}`).setAttribute('aria-pressed',String(name===face));
  }
  selectFace();
  function rulerControl(control){
    dialog.dataset.ruler=control;
    for(const name of ['size','angle'])$(`sticker-ruler-${name}`).setAttribute('aria-pressed',String(control===name));
  }
  for(const control of ['size','angle'])$(`sticker-ruler-${control}`).addEventListener('click',()=>rulerControl(control));
  mobileControls.addEventListener('change',moveMobileControls);moveMobileControls();rulerControl('size');
  function toolsTab(value,focus=false){
    dialog.dataset.tools=value;
    for(const tab of ['pack','adjust']){const button=$(`sticker-tab-${tab}`);button.setAttribute('aria-selected',String(tab===value));button.tabIndex=tab===value?0:-1;}
    if(focus)$(`sticker-tab-${value}`).focus({preventScroll:true});
  }
  for(const tab of ['pack','adjust']){
    $(`sticker-tab-${tab}`).addEventListener('click',()=>toolsTab(tab));
    $(`sticker-tab-${tab}`).addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();toolsTab(e.key==='Home'?'pack':e.key==='End'?'adjust':tab==='pack'?'adjust':'pack',true);}});
  }
  toolsTab('pack');
  const ghost=document.createElement('div');ghost.className='sticker-drag-ghost';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');
  const ghostArt=document.createElement('img'),ghostLabel=document.createElement('span');ghostArt.alt='';ghostArt.draggable=false;ghost.append(ghostArt,ghostLabel);dialog.append(ghost);
  const buttons=stickerPack.map(art=>{
    const button=document.createElement('button');button.className='sticker-choice';button.type='button';button.setAttribute('aria-label',art.name);button.setAttribute('aria-pressed','false');button.setAttribute('aria-describedby','sticker-drag-help');
    const img=document.createElement('img');img.src=art.src;img.alt='';img.width=96;img.height=96;img.loading='lazy';img.draggable=false;
    const label=document.createElement('span');label.textContent=art.name;button.append(img,label);
    let suppressClickUntil=0;
    button.addEventListener('click',e=>{if(e.detail&&performance.now()<suppressClickUntil){e.preventDefault();return;}choose(art);});
    button.addEventListener('dragstart',e=>e.preventDefault());button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('pointerdown',e=>{
      if(!active||!ready||drag||gesture||e.button>0||!e.isPrimary||system.count()>=24)return;
      beginDrag(e,button,art,'pack',()=>{suppressClickUntil=performance.now()+600;});
    });
    button.addEventListener('pointermove',e=>{if(drag?.owner===button)moveDrag(e);});
    button.addEventListener('pointerup',e=>{if(drag?.owner===button)finishDrag(e);});
    button.addEventListener('pointercancel',e=>{if(drag?.owner===button&&drag.id===e.pointerId)cancelDrag();});
    button.addEventListener('lostpointercapture',e=>{if(drag?.owner===button&&drag.id===e.pointerId)cancelDrag();});
    $('sticker-pack').append(button);return button;
  });
  let collection='originals';
  function showCollection(value){
    collection=value;
    for(const name of ['originals','code'])$(`sticker-collection-${name}`).setAttribute('aria-pressed',String(name===value));
    buttons.forEach((button,i)=>{button.hidden=stickerPack[i].collection!==value;});
    $('sticker-pack').setAttribute('aria-label',value==='code'?'Choose a code sticker':'Choose an original sticker');
  }
  for(const name of ['originals','code'])$(`sticker-collection-${name}`).addEventListener('click',()=>showCollection(name));
  showCollection(collection);
  function focusPack(){
    const chosen=buttons[stickerPack.indexOf(selected)];
    (chosen.hidden?buttons.find(button=>!button.hidden):chosen).focus({preventScroll:true});
  }
  function say(text){$('sticker-feedback').textContent=text;}
  function refresh(){
    const draft=system.draft(),busy=!!drag?.moved,editable=ready&&!!draft&&!busy;
    dialog.classList.toggle('has-sticker-preview',!!draft);
    $('sticker-selected-name').textContent=draft?selected.name:'Choose a sticker';
    $('sticker-selected-note').textContent=draft?selected.note:'See it on the box before you stick it.';
    buttons.forEach((button,i)=>{button.setAttribute('aria-pressed',String(!!draft&&stickerPack[i].id===selected.id));button.disabled=!ready||system.count()>=24;});
    $('sticker-place').disabled=!editable||system.count()>=24;$('sticker-cancel').disabled=!draft||busy;
    $('sticker-undo').disabled=!system.canUndo()||busy;$('sticker-clear').disabled=system.count()===0||busy;
    $('sticker-count').textContent=`${String(system.count()).padStart(2,'0')} / 24`;
    $('sticker-save-note').textContent=draft?'Preview only · Stick here to save.':system.saved()?'Saved on this device. Your box, your stickers.':'Kept for this session. Device storage is unavailable.';
    $('sticker-placement-note').textContent=system.count()>=24?'Box full · undo or clear to make room':draft?(system.wraps()?'Preview · wrapping around the corner':draft.surface==='lid'?'Preview on the lid':'Preview on the box'):'Pick a sticker to see it on the box';
    if(draft)$('sticker-placement-note').textContent+=` · ${Math.round(options.size*100)}% · ${options.angle}°`;
    $('sticker-placement-note').classList.toggle('is-wrap',system.wraps());
    $('sticker-drag-help').textContent=draft?'Adjust it. Move it. Stick here.':'Pick a sticker. Try it on.';
    $('sticker-stage-hint').textContent=draft?'Drag the sticker to move · Drag the box to turn':'Tap a sticker to preview · Or drag one onto the box';
    $('sticker-size').value=String(options.size);$('sticker-angle').value=String(options.angle);
    $('sticker-size').disabled=!editable;$('sticker-angle').disabled=!editable;
    $('sticker-size-value').textContent=`${Math.round(options.size*100)}%`;$('sticker-angle-value').textContent=`${options.angle}°`;
    for(const finish of ['gloss','holo']){const button=$(`sticker-${finish}`);button.disabled=!editable;button.setAttribute('aria-pressed',String(options.finish===finish));}
    sizeRuler.update();angleRuler.update();
    stage.setAttribute('aria-label',draft?'Sticker preview. Drag the sticker to move it. Drag the box to turn. Size and angle change this preview. Arrow keys move it; Enter sticks it; Escape cancels.':'Sticker studio. Drag or use arrow keys to turn the box. Pick or drag a sticker to preview it. Escape returns to the box.');
  }
  function preview(){
    if(!ready||system.count()>=24)return;
    const data=system.setDraft({...lastPlacement,...options,art:selected.id});
    lastPlacement={surface:data.surface,u:data.u,v:data.v};
    Object.assign(options,{size:data.size,angle:data.angle,finish:data.finish});
    refresh();return data;
  }
  function choose(art){
    if(!ready||drag||system.count()>=24)return;
    if(!system.draft()){
      // Begin on a visible surface, including after the box has been turned.
      const r=stage.getBoundingClientRect(),hit=system.pick(r.left+r.width/2,r.top+r.height/2);
      if(hit)lastPlacement={surface:hit.surface,u:hit.u,v:hit.v};
    }
    selected=art;preview();
    say(`${art.name} preview. Adjust its size and angle, drag it to a spot, then choose Stick here.`);
  }
  function position(x,y,grab=null){
    const hit=system.pick(x,y);if(!hit)return false;
    const offset=grab?.surface===hit.surface?grab:{u:0,v:0};
    lastPlacement={surface:hit.surface,u:hit.u+offset.u,v:hit.v+offset.v};preview();return true;
  }
  function beginDrag(e,owner,art,source,suppressClick=()=>{}){
    const before=system.draft(),hit=source==='preview'?system.pick(e.clientX,e.clientY):null;
    drag={id:e.pointerId,owner,art,source,x:e.clientX,y:e.clientY,moved:false,valid:false,frame:0,suppressClick,before,previousArt:selected,previousOptions:{...options},previousPlacement:{...lastPlacement},grab:hit&&before&&hit.surface===before.surface?{surface:hit.surface,u:before.u-hit.u,v:before.v-hit.v}:null};
    owner.setPointerCapture(e.pointerId);box.hold(true);
  }
  function moveDrag(e){
    if(drag?.id!==e.pointerId)return;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
    if(!drag.moved){
      drag.moved=true;selected=drag.art;ghostArt.src=selected.src;drag.owner.classList.add('is-dragging');dialog.classList.add('is-dragging-sticker');
      say(`${selected.name} picked up. Release on the box to preview it.`);
    }
    e.preventDefault();drag.nextX=e.clientX;drag.nextY=e.clientY;
    if(!drag.frame)drag.frame=requestAnimationFrame(()=>{if(drag){drag.frame=0;updateDrag(drag.nextX,drag.nextY);}});
  }
  function updateDrag(x,y){
    if(!drag)return;
    // Passing across a smaller surface may fit the preview temporarily; it must
    // not permanently shrink the sticker before the final drop location is known.
    Object.assign(options,drag.previousOptions);
    drag.valid=position(x,y,drag.grab);system.showDraft(drag.valid);if(!drag.valid)refresh();
    ghost.hidden=false;ghost.style.left=`${x}px`;ghost.style.top=`${y}px`;
    ghostArt.style.transform=`rotate(${-options.angle}deg) scale(${options.size})`;
    ghost.classList.toggle('is-over-box',drag.valid);ghostLabel.textContent=drag.valid?'Release to preview':'Drop onto the box';
  }
  function releaseDrag(){
    if(!drag)return null;
    const previous=drag;drag=null;cancelAnimationFrame(previous.frame);if(previous.moved)previous.suppressClick();
    previous.owner.classList.remove('is-dragging');dialog.classList.remove('is-dragging-sticker');ghost.hidden=true;
    if(previous.owner.hasPointerCapture(previous.id))previous.owner.releasePointerCapture(previous.id);
    box.hold(false);return previous;
  }
  function restorePreview(previous){
    selected=previous.previousArt;Object.assign(options,previous.previousOptions);lastPlacement=previous.previousPlacement;
    if(previous.before)system.setDraft(previous.before);else system.clearDraft();
  }
  function finishDrag(e){
    if(drag?.id!==e.pointerId)return;
    if(drag.moved)updateDrag(e.clientX,e.clientY);
    const previous=releaseDrag();
    if(previous.moved){
      if(previous.valid)say(`${selected.name} preview. Fine-tune size and angle, drag to move, then Stick here.`);
      else{restorePreview(previous);say(previous.before?'Drop cancelled. Your previous preview is restored.':'Drop cancelled. Choose a sticker or drop it on the box.');}
    }
    refresh();
  }
  function cancelDrag(){
    const previous=releaseDrag();if(!previous)return;
    if(previous.moved){restorePreview(previous);say('Drag cancelled. Your preview is unchanged.');}refresh();
  }
  function focusSelection(){focusPack();}
  function cancelPreview(){system.clearDraft();stage.classList.remove('can-move-sticker');say('Preview cancelled. Pick a sticker to try again.');refresh();focusSelection();}
  function adjust(){if(system.draft()){const wanted=options.size;preview();if(options.size<wanted-.005)say(`Sized to ${Math.round(options.size*100)} percent to fit this surface. Choose Stick here when ready.`);}else refresh();}
  async function open(){
    if(active)return;active=true;beforeOpen();stage.before(anchor);$('sticker-stage').append(stage);
    dialog.showModal();document.body.classList.add('is-decorating');box.decorate(true);selectFace();
    $('sticker-place').disabled=true;say('Unpacking the sticker pack…');refresh();
    const current=++loadId;
    try{await system.ready();if(!active||current!==loadId)return;ready=true;refresh();say('Pick a sticker to preview it on the box. Adjust size and angle, move it, then choose Stick here.');}
    catch(error){console.error('Unable to prepare the sticker pack',error);say('The stickers could not load. Close and reopen the pack to try again.');}
    if(active)focusPack();
  }
  function close(){
    if(!active)return;active=false;++loadId;releaseDrag();releaseTurn();system.clearDraft();box.decorate(false);box.hold(false);stage.classList.remove('can-move-sticker');
    dialog.close();document.body.classList.remove('is-decorating');anchor.replaceWith(stage);afterClose();$('decorate-button').focus({preventScroll:true});
  }
  function place(){
    if(drag||!system.place())return;
    stage.classList.remove('can-move-sticker');say(`${selected.name} stuck${lastPlacement.surface==='lid'?' on the lid':''}. Choose another sticker or undo the last change.`);refresh();if(system.count()<24)focusSelection();else $('sticker-undo').focus({preventScroll:true});
  }
  $('decorate-button').addEventListener('click',open);$('sticker-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();if(drag)cancelDrag();else if(system.draft())cancelPreview();else close();});
  $('sticker-cancel').addEventListener('click',cancelPreview);$('sticker-place').addEventListener('click',place);
  $('sticker-undo').addEventListener('click',()=>{system.undo();say('Last change undone.');refresh();});
  $('sticker-clear').addEventListener('click',()=>{system.reset();say('Box cleared. Undo brings the stickers back.');refresh();});
  $('sticker-size').addEventListener('input',e=>{options.size=Number(e.target.value);adjust();});
  $('sticker-angle').addEventListener('input',e=>{options.angle=Number(e.target.value);adjust();});
  for(const finish of ['gloss','holo'])$(`sticker-${finish}`).addEventListener('click',()=>{options.finish=finish;adjust();});
  for(const face of ['front','right','back','left','lid'])$(`sticker-face-${face}`).addEventListener('click',()=>{
    box.decorationFace(face);selectFace(face);
    const poses={front:{surface:'wall',u:0,v:1.1},right:{surface:'wall',u:3.22,v:1.1},back:{surface:'wall',u:6.45,v:1.1},left:{surface:'wall',u:9.67,v:1.1},lid:{surface:'lid',u:0,v:0}};
    lastPlacement=poses[face];if(system.draft())preview();
    say(`${face==='lid'?'Lid':face+' side'} in view. ${system.draft()?'Adjust the preview, then Stick here.':'Pick a sticker to try here.'}`);
  });
  // A drag on the cutout moves the preview; a drag on bare box turns the box.
  stage.addEventListener('pointerdown',e=>{
    if(!active)return;e.stopImmediatePropagation();if(drag||gesture||e.button>0||!e.isPrimary||e.target.closest('button'))return;
    stage.focus({preventScroll:true});
    if(system.hitDraft(e.clientX,e.clientY)){beginDrag(e,stage,selected,'preview');return;}
    box.hold(true);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};stage.setPointerCapture(e.pointerId);
  },true);
  stage.addEventListener('pointermove',e=>{
    if(!active)return;e.stopImmediatePropagation();
    if(drag?.owner===stage){moveDrag(e);return;}
    if(!gesture){if(!drag&&e.pointerType==='mouse')stage.classList.toggle('can-move-sticker',system.hitDraft(e.clientX,e.clientY));return;}
    if(gesture.id!==e.pointerId)return;
    if(!gesture.moved&&Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)<6)return;
    gesture.moved=true;selectFace();box.rotate((e.clientX-gesture.x)*.009,(e.clientY-gesture.y)*.006);gesture.x=e.clientX;gesture.y=e.clientY;
  },true);
  function releaseTurn(){const previous=gesture;gesture=null;box.hold(false);if(previous&&stage.hasPointerCapture(previous.id))stage.releasePointerCapture(previous.id);}
  function end(e){
    if(!active)return;e.stopImmediatePropagation();
    if(drag?.owner===stage&&drag.id===e.pointerId){if(e.type==='pointerup')finishDrag(e);else cancelDrag();return;}
    if(gesture?.id!==e.pointerId)return;
    const tap=!gesture.moved&&e.type==='pointerup';releaseTurn();
    if(tap&&system.draft()&&position(e.clientX,e.clientY))say('Preview moved. Adjust size and angle, then Stick here.');
  }
  stage.addEventListener('pointerup',end,true);stage.addEventListener('pointercancel',end,true);
  stage.addEventListener('lostpointercapture',e=>{if(drag?.owner===stage&&drag.id===e.pointerId)cancelDrag();if(gesture?.id===e.pointerId)releaseTurn();},true);
  window.addEventListener('blur',()=>{if(active){cancelDrag();releaseTurn();}});
  stage.addEventListener('dblclick',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},true);
  stage.addEventListener('wheel',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
  stage.addEventListener('keydown',e=>{
    if(!active||e.target!==stage)return;e.stopImmediatePropagation();
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Escape'].includes(e.key))e.preventDefault();
    if(e.key==='Escape'){if(drag)cancelDrag();else if(system.draft())cancelPreview();else close();return;}if(e.key==='Enter'||e.key===' '){place();return;}
    const dx=e.key==='ArrowLeft'?-.08:e.key==='ArrowRight'?.08:0,dy=e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0;
    if(!dx&&!dy)return;
    if(!system.draft()){selectFace();box.rotate(dx,-dy);}else{lastPlacement.u+=dx;lastPlacement.v+=dy;preview();}
  },true);
  return {open,close,get active(){return active;}};
}
