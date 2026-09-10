import assert from 'node:assert/strict';
import {layoutOptions,layoutPolygons,styleOptions} from './dist/map-options.mjs';
import {area,clip} from './dist/felv.mjs';
import {riverMask,paintEcology,landClass,oceanClass,landLegends,oceanLegend,missing} from './dist/map-layers.mjs';
for(const option of layoutOptions){
 const polygons=layoutPolygons(option);
 assert.equal(polygons.length,{felv:8,bighex:7,flower:4,dymaxion:4,infinite:37}[option.arrangement]);
 for(let i=0;i<polygons.length;i++)for(let j=0;j<i;j++)assert(area(clip(polygons[i],polygons[j].toReversed()))<1e-7,option.name+' icon has overlapping cells');
 const total=polygons.reduce((sum,p)=>sum+area(p),0),hexArea=3*Math.sqrt(3)/2;
 assert(Math.abs(total-hexArea*(option.arrangement==='infinite'?37:option.arrangement==='bighex'?7:4))<1e-7,'Icon area must preserve each region');
}
assert.equal(styleOptions.find(s=>s.source==='continents').controls['relief-treatment'],'land');
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
for(const count of [3,6,10,15]){
 const samples=[];for(let raw=0;raw<256;raw++)samples.push(raw,0,0,255);
 for(let depth=0;depth<7;depth++)for(let thermal=0;thermal<6;thermal++)samples.push(0,depth,thermal,255);
 const actual=paintEcology(new Uint8ClampedArray(samples),count,count),land=landLegends[count],ocean=oceanLegend(count);
 for(let i=0;i<samples.length;i+=4){const raw=samples[i],entry=raw?land[landClass(raw,count)]:ocean[oceanClass(samples[i+1],samples[i+2],count)];assert.deepEqual([...actual.slice(i,i+4)],[...rgb((entry||missing).color),255]);}
}
const savedFetch=globalThis.fetch,savedDocument=globalThis.document;let fetches=0,canvases=0,strokes=0;
try{
 globalThis.fetch=async()=>{fetches++;return {ok:true,json:async()=>[[1,[[0,0],[1,1]]]]};};
 globalThis.document={createElement(){canvases++;return {getContext:()=>({clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}})};}};
 const first=await Promise.all([riverMask(6,1),riverMask(6,1),riverMask(6,1)]);
 assert.equal(fetches,1,'Concurrent river requests share a download');assert.equal(strokes,1,'Identical requests reuse the raster');
 for(let levels=1;levels<=12;levels++)for(let width=.5;width<=3;width+=.25)assert.equal(await riverMask(levels,width),first[0]);
 assert.equal(canvases,1,'All slider combinations must reuse a bounded raster');
}finally{globalThis.fetch=savedFetch;globalThis.document=savedDocument;}
console.log('Audit regressions: non-overlapping geometry icons, style reset, ecology lookup parity, and bounded/shared river raster pass.');
