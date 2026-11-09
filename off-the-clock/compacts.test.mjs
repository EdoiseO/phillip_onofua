import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {comics,compacts} from './comics.js';

test('compact paperbacks have sourced dimensions and local photos for all three faces',()=>{
  assert.equal(compacts.length,2);
  for(const book of compacts){
    assert.equal(book.format,'compact-paperback');
    for(const key of ['id','title','series','publisher','year','pageCount','thicknessInches','thicknessBasis','source','pageEdge','pageEdgeNote'])assert.ok(book[key],`${book.id}: ${key}`);
    assert.deepEqual(book.physicalSizeInches,[5.5,8.5]);
    assert.match(book.thicknessBasis,/approximate/i);
    assert.equal(book.backImageNote,'Photographed from my copy');
    assert.ok(existsSync(new URL(book.pageEdge,import.meta.url)),book.pageEdge);
    for(const side of ['front','back','spine']){
      assert.ok(existsSync(new URL(book[side],import.meta.url)),book[side]);
      assert.equal(book[`${side}Quad`].length,4);
      assert.ok(book[`${side}Quad`].every(point=>point.length===2&&point.every(n=>n>=0&&n<=1)));
    }
    assert.ok(!comics.some(comic=>comic.id===book.id),'paperbacks must stay out of the short box');
  }
  assert.match(compacts.find(book=>book.id==='green-arrow-year-one').pageEdgeNote,/estimated/i);
});

test('paperback photo mapping keeps a continuous grid and survives replacement',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createPaperback}=await import('./paperback.js');
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},save(){},translate(){},rotate(){},fillText(){},restore(){},measureText:()=>({width:30})})})};
  try{
    const book=createPaperback(THREE,compacts[0]),face=book.group.getObjectByName('paperback-front'),uv=face.geometry.attributes.uv;
    assert.ok(uv.count>4);
    book.setCover('front',new THREE.Texture());
    const first=Array.from(uv.array),middle=(16*17+8)*2;
    const [tl,tr,br,bl]=compacts[0].frontQuad;
    assert.ok(Math.abs(first[middle]-(tl[0]+tr[0]+br[0]+bl[0])/4)<1e-5);
    assert.ok(Math.abs(first[middle+1]-(1-(tl[1]+tr[1]+br[1]+bl[1])/4))<1e-5);
    book.setCover('front',new THREE.Texture());
    assert.deepEqual(Array.from(uv.array),first);
    book.dispose();
  }finally{globalThis.document=previous;}
});


test('paperback has a connected cover and a recessed, three-edged page block',async()=>{
  const THREE=await import('./vendor/three.module.js');
  const {createPaperback}=await import('./paperback.js');
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},save(){},translate(){},rotate(){},fillText(){},restore(){},measureText:()=>({width:30})})})};
  try{
    const book=createPaperback(THREE,compacts[0]);
    const wrap=book.group.getObjectByName('paperback-cover-wrap'),pages=book.group.getObjectByName('paperback-pages');
    assert.ok(wrap&&pages,'cover shell and page block exist');
    wrap.geometry.computeBoundingBox();pages.geometry.computeBoundingBox();
    const cover=wrap.geometry.boundingBox,block=pages.geometry.boundingBox;
    assert.ok(cover.max.x>block.max.x&&cover.max.y>block.max.y&&cover.min.y<block.min.y,'cover overhangs pages');
    assert.ok(cover.max.z>block.max.z&&cover.min.z<block.min.z,'cover has front and back thickness');
    assert.equal(book.group.getObjectByName('paperback-page-lines'),undefined,'page lines come from the photo');
    const edgeTexture=new THREE.Texture();book.setPageEdge(edgeTexture);
    assert.equal(pages.material[1].map,edgeTexture);
    assert.equal(edgeTexture.wrapS,THREE.RepeatWrapping);
    const positions=pages.geometry.attributes.position,uv=pages.geometry.attributes.uv,side=pages.geometry.groups.find(g=>g.materialIndex===1);
    const seen=new Set();
    for(let i=side.start;i<side.start+side.count;i+=3){
      const xs=[0,1,2].map(j=>positions.getX(i+j)),ys=[0,1,2].map(j=>positions.getY(i+j));
      if(Math.min(...xs)>block.max.x-.01)seen.add('fore');
      if(Math.min(...ys)>block.max.y-.001)seen.add('top');
      if(Math.max(...ys)<block.min.y+.001)seen.add('bottom');
      for(let j=0;j<3;j++)assert.ok(uv.getY(i+j)>=-.0001&&uv.getY(i+j)<=1.0001,'depth maps to the photograph height');
    }
    assert.deepEqual(seen,new Set(['fore','top','bottom']),'all exposed edges use the same photo material');
    book.dispose();
  }finally{globalThis.document=previous;}
});
