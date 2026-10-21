import test from 'node:test';
import assert from 'node:assert/strict';
import {wallPoint,validSticker} from './stickers.js';

const width=2.228,depth=4.218,perimeter=2*(width+depth);
test('artwork crosses every vertical corner without a position discontinuity',()=>{
  for(const corner of [width/2,width/2+depth,width*1.5+depth,-width/2]){
    const a=wallPoint(corner-.00001,1.2,width,depth),b=wallPoint(corner+.00001,1.2,width,depth);
    assert.ok(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.00003);
    assert.equal(a.normal.reduce((sum,v,i)=>sum+v*b.normal[i],0),0);
  }
});
test('a sticker can wrap over the perimeter seam in either direction',()=>{
  for(const s of [-28,-1.2,0,1.1,3.4,9,30]){
    const a=wallPoint(s,1,width,depth),b=wallPoint(s+perimeter,1,width,depth);
    a.position.forEach((v,i)=>assert.ok(Math.abs(v-b.position[i])<1e-10));
  }
});
test('all wall samples stay on the shell, with unit outward normals',()=>{
  for(let s=-20;s<20;s+=.137){
    const {position:[x,y,z],normal:n}=wallPoint(s,1.2,width,depth);
    assert.equal(y,1.2);assert.ok(Math.abs(x)<=width/2+1e-10);assert.ok(Math.abs(z)<=depth/2+1e-10);
    assert.ok(Math.abs(Math.abs(x)-width/2)<1e-10||Math.abs(Math.abs(z)-depth/2)<1e-10);
    assert.equal(Math.hypot(...n),1);assert.ok(x*n[0]+z*n[2]>0);
  }
});
test('saved stickers reject corrupt, unbounded, or unknown data',()=>{
  const good={art:'marvel',surface:'wall',u:.9,v:1,size:1,angle:-12,finish:'gloss'};
  assert.ok(validSticker(good));
  for(const bad of [null,{}, {...good,art:'url'}, {...good,u:Infinity}, {...good,size:99}, {...good,v:NaN}, {...good,surface:'comic'}, {...good,angle:900}, {...good,finish:'unknown'}])assert.ok(!validSticker(bad));
});
