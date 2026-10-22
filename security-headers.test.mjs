import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root=new URL('./',import.meta.url);
const config=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
const headers=new Map(config.headers.find(rule=>rule.source==='/(.*)').headers.map(({key,value})=>[key.toLowerCase(),value]));
const policy=new Map(headers.get('content-security-policy').split(';').map(directive=>{
  const [name,...values]=directive.trim().split(/\s+/);return [name,values];
}));

test('all routes restrict executable content, embedding and sensitive permissions',()=>{
  for(const name of ['default-src','style-src','connect-src'])assert.deepEqual(policy.get(name),["'self'"]);
  for(const name of ['script-src-attr','object-src','base-uri','frame-ancestors','frame-src','form-action','worker-src'])assert.deepEqual(policy.get(name),["'none'"]);
  assert.ok(!headers.get('content-security-policy').includes('unsafe-'));
  assert.equal(headers.get('x-content-type-options'),'nosniff');
  assert.equal(headers.get('x-frame-options'),'DENY');
  assert.equal(headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.equal(headers.get('permissions-policy'),'camera=(), microphone=(), geolocation=(), payment=()');
});

test('every HTML script is local or explicitly hash-approved; import-map hash cannot drift',async()=>{
  const files=(await readdir(root,{recursive:true})).filter(path=>path.endsWith('.html')&&!path.startsWith('.git/'));
  let inlineCount=0;
  for(const path of files){
    const html=await readFile(new URL(path,root),'utf8');
    assert.doesNotMatch(html,/\son\w+\s*=/i,`${path}: inline event handler`);
    for(const [,attributes,body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      const src=attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      if(src){assert.equal(new URL(src,'https://portfolio.test/').origin,'https://portfolio.test',path);continue;}
      const hash=createHash('sha256').update(body).digest('base64');
      assert.ok(policy.get('script-src').includes(`'sha256-${hash}'`),`${path}: update the CSP hash for this script`);
      inlineCount++;
    }
  }
  assert.equal(inlineCount,1,'only the Three.js import map should be inline');
});
