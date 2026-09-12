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

const {encodeMapState,decodeMapState}=await import('./dist/map-state.mjs');
const baseline={state:{lon:12,sidebarExpanded:false},controls:{'map-source':'ecology',graticule:true},view:{scale:100,zoom:1,panX:0,panY:0},details:{'map-source-panel':false}};
assert.equal(encodeMapState(baseline,baseline),'');
const changed={...baseline,state:{...baseline.state,lon:0},controls:{...baseline.controls,'map-source':'wikipedia-tissot',graticule:false},details:{'map-source-panel':true}};
const short=encodeMapState(changed,baseline),delta=decodeMapState(short);
assert.deepEqual(delta.state,{lon:0});assert.deepEqual(delta.controls,{'map-source':'wikipedia-tissot',graticule:false});assert.deepEqual(delta.details,changed.details);assert.equal(delta.view,undefined);
assert(short.length<encodeMapState(changed).length/2);
const moved={...changed,view:{scale:100,zoom:2,panX:-35,panY:15}};
assert.deepEqual(decodeMapState(encodeMapState(moved,baseline)).view,moved.view);
for(const invalid of [[2,[999,1]],[2,[0]],[2,[],[],[1,2]],[2,[],{},[]]])assert.throws(()=>decodeMapState(btoa(JSON.stringify(invalid))));
assert.equal(decodeMapState(encodeMapState(changed)).controls['map-source'],'wikipedia-tissot');
console.log('Compact links: default omission, changed/false/zero values, panels, exact view, legacy compatibility and malformed input pass.');
