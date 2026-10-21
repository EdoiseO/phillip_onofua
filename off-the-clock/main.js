import {comics} from './comics.js?v=15.0';
import {createBox} from './model.js?v=26.0';
import {createStickerStudio} from './sticker-studio.js?v=26.0';
import {createRuler,mobileControlsQuery} from './ruler-control.js?v=19.0';

const $=id=>document.getElementById(id);
const stage=$('stage'),openButton=$('open-button'),dialog=$('inspection');
const collectionViewer=stage.closest('.viewer');
const mobileCollection=matchMedia(mobileControlsQuery);
const lidControls=$('lid-controls'),lidAnchor=document.createComment('Desktop lid controls');
lidControls.before(lidAnchor);
function moveLidControls(){
  if(mobileCollection.matches)$('series-jump').before(lidControls);
  else lidAnchor.after(lidControls);
}
mobileCollection.addEventListener('change',moveLidControls);moveLidControls();
// Pointer focus keeps keyboard controls active without framing the 3D scene.
// Switch back immediately when the user resumes keyboard navigation.
document.addEventListener('pointerdown',()=>{stage.dataset.pointerFocus='';},true);
document.addEventListener('keydown',e=>{if(!e.metaKey&&!e.ctrlKey&&!e.altKey)delete stage.dataset.pointerFocus;},true);
const stageAnchor=document.createComment('3D scene home');stage.before(stageAnchor);
let box,opened=false,index=0,inspecting=false,unwrapped=false,lastWheel=0,lastWheelInput=0,wheelSum=0,pointer=null,lastTap=null,clickTimer=0,focusStarted=0,inspectionView='front';
let lidSide=1,lidTilt=0;
function renderLid(){ $('lid-controls').hidden=!opened||inspecting;for(const side of ['left','right'])$('lid-'+side).setAttribute('aria-pressed',String(side===(lidSide<0?'left':'right'))); }
function positionLid(side,tilt=0){lidSide=Math.max(-1,Math.min(1,side));lidTilt=Math.max(-.16,Math.min(.24,tilt));box?.setLid(lidSide,lidTilt);renderLid();}
for(const side of ['left','right'])$('lid-'+side).addEventListener('click',()=>{positionLid(side==='left'?-1:1);announce(`Lid resting to the ${side}.`);});
const media=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=media.matches;
const seriesSelect=$('series-select');
const comicRuler=$('comic-ruler');comicRuler.max=String(comics.length-1);
const collectionRuler=createRuler(comicRuler,{ticks:comics.length*2-1,start:'FIRST',end:'LAST',format:value=>`${value+1} of ${comics.length}. ${comics[value].title}, ${comics[value].variant}`});
comicRuler.addEventListener('input',()=>select(Number(comicRuler.value)));
for(const series of new Set(comics.map(c=>c.series))){const option=document.createElement('option');option.value=series;option.textContent=series;seriesSelect.append(option);}
seriesSelect.addEventListener('change',()=>select(comics.findIndex(c=>c.series===seriesSelect.value)));
const tabs=comics.map((comic,i)=>{
  const b=document.createElement('button');b.className='comic-tab';b.setAttribute('aria-label',`${comic.title}, ${comic.variant}`);b.setAttribute('aria-pressed','false');b.title=`${comic.title} · ${comic.variant}${comic.collectionStatus==='Incoming'?' · Incoming':''}`;b.dataset.series=comic.series;
  const img=document.createElement('img');img.src=comic.cover;img.alt='';b.append(img);b.addEventListener('click',()=>select(i));$('comic-tabs').append(b);return b;
});
function announce(message){$(inspecting?'inspection-announcement':'announcement').textContent=message;}
function backImageLabel(comic){return comic.backAssetType==='outer-blind-bag-packaging-back'?'Verified outer mystery-bag packaging':'Verified back-cover photograph';}
function renderStageInstructions(){
  if(inspecting||document.body.classList.contains('is-decorating'))return;
  stage.setAttribute('aria-label',mobileCollection.matches
    ?'Comic box. Tap to open; tap the lid to close. Use the ruler on the right to browse comics. Swipe over the box to scroll the page. Enter opens or closes; arrow keys browse; I inspects.'
    :'Comic box. Enter opens or closes. Arrow keys browse; I inspects. Drag the box to turn or drag the lid to move and tilt it. Click the lid to close. Lid position buttons are also available. Escape closes.');
}
function render(){
  const comic=comics[index];renderLid();renderStageInstructions();
  collectionViewer.dataset.open=String(opened);
  $('mobile-collection').hidden=!opened;
  comicRuler.value=String(index);comicRuler.disabled=!box||!opened;collectionRuler.update();
  $('comic-ruler-value').textContent=`${String(index+1).padStart(2,'0')} / ${comics.length}`;
  $('comic-ruler-note').textContent=opened?comic.variant:'Tap the box to open.';
  $('eyebrow').textContent=opened?'04 / FROM MY COLLECTION':'04 / OFF THE CLOCK';
  $('title').replaceChildren();
  $('title').classList.toggle('series-title',opened);
  if(opened){const lines=comic.displayTitle??[comic.series,comic.issue==='Ashcan'?'Ashcan':`Issue ${comic.issue}`];$('title').append(lines[0],document.createElement('br'),lines[1]);}
  else $('title').append('One more',document.createElement('br'),'issue');
  const dot=document.createElement('span');dot.className='period';dot.textContent='.';$('title').append(dot);
  $('description').textContent=opened?comic.description:'Some worlds are worth getting lost in. This little box holds a few of mine.';
  $('issue-meta').hidden=!opened;$('genre').textContent=opened?comic.variant:'';
  $('edition-label').hidden=!opened;$('edition-label').textContent=`${comic.issue==='Ashcan'?'Ashcan':`Issue ${comic.issue}`} · ${comic.collectionStatus==='Incoming'?'Incoming':comic.quantity>1?`${comic.quantity} copies`:'From my collection'}`;
  $('edition-label').classList.toggle('incoming',comic.collectionStatus==='Incoming');
  $('series-jump').hidden=!opened;seriesSelect.value=comic.series;
  $('issue-type').textContent=opened?(comic.blindBag?'BLIND BAG':`${comic.publisher.toUpperCase()} · ${comic.year}`):'';
  openButton.classList.toggle('is-open',opened);openButton.innerHTML=opened?'Close the box <span aria-hidden="true">↙</span>':'Open the box <span aria-hidden="true">↗</span>';
  openButton.setAttribute('aria-expanded',String(opened));$('inspect-button').hidden=!opened;
  $('left-hint').textContent=opened?'DOUBLE-CLICK A COVER FOR A CLOSER LOOK.':`${comics.length} EDITIONS. ONE LITTLE BOX.`;
  $('reading-progress').hidden=!opened;$('browse-controls').hidden=!opened;
  $('issue-count').textContent=`${String(index+1).padStart(2,'0')} / ${comics.length}`;
  $('progress-fill').style.width=`${(index+1)/comics.length*100}%`;
  $('previous').disabled=index===0;$('next').disabled=index===comics.length-1;
  tabs.forEach((t,i)=>t.setAttribute('aria-pressed',String(i===index)));
  $('scene-status').textContent=opened?`${String(index+1).padStart(2,'0')} / ${comics.length} — ${comic.series.toUpperCase()}`:'WAITING TO BE OPENED';
  $('gesture-hint').innerHTML=opened?'<span class="mouse-icon" aria-hidden="true"></span>Scroll to browse <span class="hint-dot">·</span> Drag box to turn <span class="hint-dot">·</span> Drag lid to move; click to close <span class="hint-dot">·</span> Double-click to inspect':'<span class="mouse-icon" aria-hidden="true"></span>Click the box to open <span class="hint-dot">·</span> Drag to turn';
  stage.dataset.state=inspecting?'inspecting':opened?'open':'closed';stage.dataset.activeIndex=String(index);stage.dataset.sleeve=unwrapped?'removed':'on';
  if(inspecting){
    for(const view of ['front','spine','back'])$('view-'+view).setAttribute('aria-pressed',String(inspectionView===view));
    $('back-image-note').hidden=inspectionView!=='back'&&!!comic.backCover;$('back-image-note').textContent=inspectionView==='back'&&!unwrapped?'The backing board is inside the sleeve. Slide out the comic to view its back.':comic.backCover?`${backImageLabel(comic)}${comic.backQualityNote?' · '+comic.backQualityNote:''}`:comic.blindBag?'Packaging rear not found; enclosed comic variants are unknown.':comic.collectionStatus==='Incoming'?'Exact back image not yet available for this incoming issue.':'Exact back image not found for this edition.';
    $('inspection-title').textContent=comic.title;$('inspection-variant').textContent=comic.variant+(comic.issue==='Ashcan'?' · smaller format':'')+(comic.collectionStatus==='Incoming'?' · Incoming':comic.quantity>1?` · ${comic.quantity} copies`:'');
    $('inspection-number').textContent=`${String(index+1).padStart(2,'0')} / ${comics.length}`;
    $('sleeve-button').innerHTML=unwrapped?'Slide back into sleeve <span aria-hidden="true">↓</span>':'Slide out of sleeve <span aria-hidden="true">↑</span>';
    $('sleeve-button').setAttribute('aria-pressed',String(unwrapped));
    $('sleeve-status').textContent=unwrapped?'OUT OF THE SLEEVE':'IN THE SLEEVE';
    $('inspection-instructions').textContent=unwrapped?'Drag to catch the shine. Click empty space to return to the box.':'Drag to turn. Click the comic to unbag it, or empty space to return to the box.';
  }
}
function setOpen(value){if(!box)return;if(inspecting)leaveInspection();opened=value;box.setOpen(value);render();announce(value?`Box opened. ${comics[index].title}, ${comics[index].variant}.`:'Box closed.');}
function select(i){if(!box)return;index=Math.max(0,Math.min(comics.length-1,i));if(!opened)setOpen(true);box.select(index);render();const strip=$('comic-tabs');strip.scrollTo({left:tabs[index].offsetLeft-strip.offsetLeft-strip.clientWidth/2+tabs[index].clientWidth/2,behavior:reduced?'instant':'smooth'});announce(`${index+1} of ${comics.length}. ${comics[index].title}. ${comics[index].variant}.`);}
function step(direction){if(inspecting)return;if(!opened){setOpen(true);return;}select(index+direction);}
function enterInspection(i=index){
  if(!box||inspecting)return;clearTimeout(clickTimer);select(i);inspecting=true;unwrapped=false;inspectionView='front';focusStarted=performance.now();
  $('inspection-stage').append(stage);dialog.showModal();document.body.classList.add('is-inspecting');
  stage.setAttribute('aria-label','Comic close-up. Drag or use arrow keys to rotate. Enter or Space slides the comic out of its sleeve. R resets the view. Click empty space or press Escape to return to the box.');
  box.focus(true);render();stage.focus({preventScroll:true});announce(`Inspecting ${comics[index].title}. Drag to rotate. Click the comic or press Enter to remove its sleeve.`);
}
function leaveInspection(){
  if(!inspecting)return;clearTimeout(clickTimer);inspecting=false;unwrapped=false;pointer=null;lastTap=null;
  box.focus(false);dialog.close();document.body.classList.remove('is-inspecting');stageAnchor.after(stage);
  stage.setAttribute('aria-label','Comic box. Enter opens or closes. Arrow keys browse; I inspects. Drag the box to turn or drag the lid to move and tilt it. Click the lid to close. Lid position buttons are also available. Escape closes.');render();$('inspect-button').focus({preventScroll:true});announce('Returned to the box.');
}
function toggleSleeve(){if(!inspecting)return;unwrapped=!unwrapped;if(!unwrapped&&inspectionView!=='front'){inspectionView='front';box.inspectView('front');}box.unwrap(unwrapped);render();announce(unwrapped?'Sleeve opened. Comic sliding out.':'Comic sliding back into its sleeve.');}
function updateMotion(){box?.reduce(reduced);document.body.dataset.reducedMotion=String(reduced);$('motion-toggle').setAttribute('aria-pressed',String(reduced));$('motion-toggle').textContent=reduced?'Motion reduced':'Motion on';}
openButton.addEventListener('click',()=>setOpen(!opened));
$('inspect-button').addEventListener('click',()=>enterInspection());$('return-button').addEventListener('click',leaveInspection);$('sleeve-button').addEventListener('click',toggleSleeve);
for(const view of ['front','spine','back'])$('view-'+view).addEventListener('click',()=>{inspectionView=view;if(view!=='front'&&!unwrapped){unwrapped=true;box?.unwrap(true);}box?.inspectView(view);render();announce(view==='spine'?'Spine and staple detail.':view==='back'?(comics[index].backCover?backImageLabel(comics[index])+'.':'Back-cover image not available for this edition.'):'Front cover.');});
dialog.addEventListener('cancel',e=>{e.preventDefault();leaveInspection();});
$('previous').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));
$('motion-toggle').addEventListener('click',()=>{reduced=!reduced;updateMotion();});
media.addEventListener('change',e=>{reduced=e.matches;updateMotion();});
stage.addEventListener('wheel',e=>{
  if(!box||(!inspecting&&mobileCollection.matches)||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;
  e.preventDefault();if(inspecting)return;
  const now=performance.now();if(now-lastWheel<600)return;
  if(now-lastWheelInput>180)wheelSum=0;lastWheelInput=now;
  wheelSum+=e.deltaY*(e.deltaMode===1?16:1);
  if(Math.abs(wheelSum)>42){step(Math.sign(wheelSum));lastWheel=now;wheelSum=0;}
},{passive:false});
stage.addEventListener('keydown',e=>{
  if(e.target!==stage)return;
  if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Enter',' ','Escape','Home','End','i','I','r','R'].includes(e.key))e.preventDefault();
  if(inspecting){
    if(e.key==='ArrowRight')box.rotate(.18);if(e.key==='ArrowLeft')box.rotate(-.18);
    if(e.key==='ArrowUp')box.rotate(0,-.12);if(e.key==='ArrowDown')box.rotate(0,.12);
    if(e.key==='Enter'||e.key===' ')toggleSleeve();if(e.key==='Escape')leaveInspection();if(e.key.toLowerCase()==='r'){inspectionView='front';box.reset();render();}return;
  }
  if(e.key==='ArrowRight'||e.key==='ArrowDown')step(1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')step(-1);
  if(e.key==='Enter'||e.key===' ')setOpen(!opened);
  if(e.key==='Escape')setOpen(false);
  if(e.key==='Home')select(0);if(e.key==='End')select(comics.length-1);
  if(e.key.toLowerCase()==='i'&&opened)enterInspection();
  if(e.key.toLowerCase()==='r'){box?.reset();lidSide=1;lidTilt=0;render();}
});
stage.addEventListener('pointerdown',e=>{
  if(e.target.closest('button')||e.button>0||pointer||!e.isPrimary)return;
  const hit=box?.hit(e.clientX,e.clientY);
  const mobileScroll=mobileCollection.matches&&!inspecting;
  // Collection swipes belong to the page on phones. Only track enough to
  // distinguish a tap from a swipe; rotation remains available in close-ups.
  if(!mobileScroll)box?.hold(true);
  clearTimeout(clickTimer);stage.focus({preventScroll:true});pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,type:e.pointerType,mobileScroll,moved:0,hit,lid:opened&&!inspecting&&!!hit?.lid};
  if(!mobileScroll)stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  if(pointer.mobileScroll){
    pointer.moved=Math.max(pointer.moved,Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y));
    return;
  }
  const dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;pointer.moved+=Math.abs(dx)+Math.abs(dy);
  if(pointer.moved>5){if(pointer.lid)positionLid(lidSide+dx*.009,lidTilt+dy*.003);else box?.rotate(dx*(inspecting ? .007 : .005),inspecting?dy*.006:pointer.type==='touch'?0:dy*.0008);}
  pointer.lastX=e.clientX;pointer.lastY=e.clientY;
});
stage.addEventListener('pointerup',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const gesture=pointer;pointer=null;box?.hold(false);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
  if(gesture.mobileScroll&&Math.max(gesture.moved,Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y))>=7){lastTap=null;return;}
  if(gesture.lid){lastTap=null;if(gesture.moved<7)setOpen(false);else announce(`Lid resting to the ${lidSide<0?'left':'right'}.`);return;}
  if(!inspecting&&!gesture.mobileScroll&&gesture.type==='touch'&&Math.abs(e.clientY-gesture.y)>55&&Math.abs(e.clientY-gesture.y)>Math.abs(e.clientX-gesture.x)){step(e.clientY<gesture.y?1:-1);lastTap=null;return;}
  if(gesture.moved>=7){lastTap=null;return;}
  const hit=box?.hit(e.clientX,e.clientY);
  if(inspecting){
    if(performance.now()-focusStarted<=450)return;
    // Only a tap that starts and ends off the model dismisses the close-up.
    // Rotation drags and taps on the comic, sleeve, or board stay in inspection.
    if(!gesture.hit&&!hit)leaveInspection();
    else if(hit?.comic===index)clickTimer=setTimeout(toggleSleeve,220);
    return;
  }
  if(!hit)return;
  if(!opened){setOpen(true);return;}
  if(hit.comic!==undefined){
    const now=performance.now();
    if(gesture.type==='touch'&&lastTap&&now-lastTap.time<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<30){enterInspection(hit.comic);lastTap=null;return;}
    select(hit.comic);lastTap={time:now,x:e.clientX,y:e.clientY};
  }
});
stage.addEventListener('dblclick',e=>{e.preventDefault();clearTimeout(clickTimer);if(inspecting)return;const hit=box?.hit(e.clientX,e.clientY);if(hit?.comic!==undefined)enterInspection(hit.comic);});
function cancelPointer(){const previous=pointer;pointer=null;lastTap=null;clearTimeout(clickTimer);box?.hold(false);if(previous&&stage.hasPointerCapture(previous.id))stage.releasePointerCapture(previous.id);}
stage.addEventListener('pointercancel',cancelPointer);
stage.addEventListener('pointerleave',()=>{if(pointer?.mobileScroll)cancelPointer();});
mobileCollection.addEventListener('change',()=>{cancelPointer();renderStageInstructions();});
stage.addEventListener('lostpointercapture',()=>{if(pointer)cancelPointer();});
window.addEventListener('blur',cancelPointer);
try{
  box=await createBox(stage,comics);box.select(0);box.setOpen(false);updateMotion();render();seriesSelect.disabled=false;openButton.disabled=false;$('loading').hidden=true;
  createStickerStudio({stage,box,beforeOpen:()=>{if(inspecting)leaveInspection();setOpen(false);},afterClose:()=>{stage.setAttribute('aria-label','Comic box. Enter opens or closes. Arrow keys browse; I inspects. Drag to turn. Escape closes.');render();}});
  $('decorate-button').disabled=false;
}catch(error){console.error('Unable to prepare the 3D collection',error);$('loading').hidden=true;$('unavailable').hidden=false;openButton.textContent='3D unavailable';}
window.addEventListener('pagehide',event=>{if(!event.persisted)box?.dispose();});
