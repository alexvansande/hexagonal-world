import assert from 'node:assert/strict';
import {layoutOptions,layoutPolygons,styleOptions} from './dist/map-options.mjs';
import {area,clip} from './dist/felv.mjs';
import {riverMask,paintEcology,landClass,oceanClass,landLegends,oceanLegend,missing} from './dist/map-layers.mjs';
for(const option of layoutOptions){
 const polygons=layoutPolygons(option);
 assert.equal(polygons.length,{felv:8,bighex:7,flower:4,dymaxion:4,infinite:37,single:1,double:2,gosper:1}[option.arrangement]);
 for(let i=0;i<polygons.length;i++)for(let j=0;j<i;j++)assert(area(clip(polygons[i],polygons[j].toReversed()))<1e-7,option.name+' icon has overlapping cells');
 const total=polygons.reduce((sum,p)=>sum+area(p),0),hexArea=3*Math.sqrt(3)/2;
 assert(Math.abs(total-hexArea*(option.arrangement==='infinite'?37:['bighex','gosper'].includes(option.arrangement)?7:option.arrangement==='single'?1:option.arrangement==='double'?2:4))<1e-7,'Icon area must preserve each region');
}
assert.equal(styleOptions.find(s=>s.source==='continents').controls['relief-treatment'],'land');
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
for(const count of [3,6,10,15]){
 const samples=[];for(let raw=0;raw<256;raw++)samples.push(raw,0,0,255);
 for(let depth=0;depth<7;depth++)for(let thermal=0;thermal<256;thermal++)samples.push(0,depth,thermal,255);
 const actual=paintEcology(new Uint8ClampedArray(samples),count,count),land=landLegends[count],ocean=oceanLegend(count);
 for(let i=0;i<samples.length;i+=4){const raw=samples[i],entry=raw?land[landClass(raw,count)]:ocean[oceanClass(samples[i+1],samples[i+2],count)];assert.deepEqual([...actual.slice(i,i+4)],[...rgb((entry||missing).color),255]);}
}
const savedFetch=globalThis.fetch,savedDocument=globalThis.document,savedBitmap=globalThis.createImageBitmap;
let fetches=0,canvases=0,paints=0,closed=0;
try{
 globalThis.fetch=async()=>{fetches++;return {ok:true,blob:async()=>({})};};
 globalThis.createImageBitmap=async()=>({width:2,height:1,close(){closed++;}});
 globalThis.document={createElement(){canvases++;return {getContext:()=>({drawImage(){},getImageData(){return {data:new Uint8ClampedArray([0,0,0,255,255,255,255,255])};},createImageData(){return {data:new Uint8ClampedArray(8)};},putImageData(){paints++;}})};}};
 const first=await Promise.all([riverMask(6,1),riverMask(6,1),riverMask(6,1)]);
 assert.equal(fetches,1,'Concurrent river requests share a download');assert.equal(paints,1,'Identical requests reuse the raster');
 for(let levels=1;levels<=12;levels++)for(let width=.5;width<=3;width+=.25)assert.equal(await riverMask(levels,width),first[0]);
 assert.equal(fetches,13,'Each level downloads once, independent of width');
 assert.equal(closed,fetches,'Decoded source bitmaps are released');
 assert.equal(canvases,fetches+1,'One reusable output and one temporary decode canvas per download');
}finally{globalThis.fetch=savedFetch;globalThis.document=savedDocument;globalThis.createImageBitmap=savedBitmap;}
console.log('Audit regressions: geometry icons, style reset, ecology lookup parity, shared river raster and bitmap cleanup pass.');
