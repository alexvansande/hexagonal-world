import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {shareCombinations,readSharePath,sharePair,inferSharePair,presetSettings} from './dist/share-routes.mjs';
import {buildSharePages} from './scripts/build-share-pages.mjs';
import {analyticsAllowed,eventPayload} from './dist/analytics.mjs';
assert.equal(shareCombinations.length,64);assert.equal(new Set(shareCombinations.map(p=>p.path)).size,64);
const directory=await mkdtemp(join(tmpdir(),'hex-share-'));
try{
 await buildSharePages(directory);
 for(const pair of shareCombinations){
  assert.equal(readSharePath(pair.path),pair);assert.equal(readSharePath(pair.path.slice(0,-1)),pair);
  assert.equal(inferSharePair(presetSettings(pair)),pair);
  const html=await readFile(join(directory,pair.path,'index.html'),'utf8');
  assert(html.includes(`<base href="/">`));assert(html.includes(`property="og:url" content="https://hexagonal.earth${pair.path}"`));
  assert(html.includes(`property="og:image" content="https://hexagonal.earth${pair.image}"`));
  assert(html.includes(`name="twitter:image" content="https://hexagonal.earth${pair.image}"`));
  const jpeg=await readFile(new URL('.'+pair.image,import.meta.resolve('./dist/index.html')));
  assert.equal(jpeg.readUInt16BE(0),0xffd8);assert(jpeg.length>5000);
  assert(html.includes('About this'));assert(html.includes('https://www.goatcounter.com/'));
 }
}finally{await rm(directory,{recursive:true,force:true});}
assert.equal(readSharePath('/not/a-map/'),null);
assert.equal(sharePair('lifezones','felv').path,'/lifezones/felv/');
const endpoint='https://example.goatcounter.com/count';
assert(analyticsAllowed('hexagonal.earth',false,false,endpoint));
for(const args of [['localhost',false,false,endpoint],['127.0.0.1',false,false,endpoint],['hexagonal.earth',true,false,endpoint],['hexagonal.earth',false,true,endpoint],['hexagonal.earth',false,false,'']])assert(!analyticsAllowed(...args));
assert.deepEqual(eventPayload('download','pdf'),{path:'download-pdf',title:'download: pdf',event:true,referrer:''});
for(const [kind,value] of [['pan','42'],['style','some#private-map-state'],['download','error'],['format','https://private.example']])assert.equal(eventPayload(kind,value),null);
console.log('Sharing: 64 unique static preview pages, preset recovery, absolute asset base, and restricted analytics payloads pass.');
