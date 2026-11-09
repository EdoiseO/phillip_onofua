import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {comics,compacts} from './comics.js';

test('compact paperbacks have sourced dimensions and local photos for all three faces',()=>{
  assert.equal(compacts.length,2);
  for(const book of compacts){
    assert.equal(book.format,'compact-paperback');
    for(const key of ['id','title','series','publisher','year','pageCount','thicknessInches','thicknessBasis','source'])assert.ok(book[key],`${book.id}: ${key}`);
    assert.deepEqual(book.physicalSizeInches,[5.5,8.5]);
    assert.match(book.thicknessBasis,/approximate/i);
    assert.equal(book.backImageNote,'Photographed from my copy');
    for(const side of ['front','back','spine']){
      assert.ok(existsSync(new URL(book[side],import.meta.url)),book[side]);
      assert.equal(book[`${side}Quad`].length,4);
      assert.ok(book[`${side}Quad`].every(point=>point.length===2&&point.every(n=>n>=0&&n<=1)));
    }
    assert.ok(!comics.some(comic=>comic.id===book.id),'paperbacks must stay out of the short box');
  }
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
