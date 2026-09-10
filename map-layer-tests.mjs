import assert from 'node:assert/strict';
import {landClass,oceanClass,landLegends,landRows,oceanRows,oceanLegend,paintEcology} from './dist/map-layers.mjs';
for(const n of [3,6,10,15]){assert.equal(landLegends[n].length,n);for(let raw=1;raw<=39;raw++)assert(landClass(raw,n)>=0&&landClass(raw,n)<n);assert.equal(landClass(254,n),0);}
for(const n of [3,6,10,15]){assert.equal(oceanLegend(n).length,n);for(let d=0;d<5;d++)for(let t=1;t<256;t++)assert(oceanClass(d,t,n)>=0&&oceanClass(d,t,n)<n);}
const px=new Uint8ClampedArray([1,0,0,255,0,0,1,255,0,4,3,255,254,0,0,255]);const out=paintEcology(px,10,6);assert.equal(out.length,px.length);for(let i=0;i<out.length;i+=4)assert.equal(out[i+3],255);assert(out[0]!==1||out[1]!==0||out[2]!==0);
const antarctica=new Uint8ClampedArray([254,0,0,255]);const polar=paintEcology(antarctica,6,10);assert.deepEqual([...polar.slice(0,3)],[217,228,223]);console.log('Map layers: class presets and RGB ecology rendering pass.');

for(const count of [3,6,10,15]){
 const expected=Array.from({length:(Math.sqrt(8*count+1)-1)/2},(_,i)=>i+1);
 assert.deepEqual(landRows(count).map(r=>r.cells.length),expected);
 assert.deepEqual(oceanRows(count).map(r=>r.cells.length),expected);
 const raw=landLegends[count].flatMap(c=>c.raw).sort((a,b)=>a-b);
 assert.deepEqual(raw,Array.from({length:39},(_,i)=>i+1),'Every Holdridge class must occur exactly once');
 const reached=new Set();
 for(let d=0;d<5;d++)for(let t=1;t<256;t++)reached.add(oceanClass(d,t,count));
 assert.equal(reached.size,count,'Every marine class must be reachable from source temperatures');
 const diversity=Array.from({length:5},(_,d)=>new Set(Array.from({length:255},(_,i)=>oceanClass(d,i+1,count))).size);
 assert.equal(diversity[4],1,'Deepest waters must merge surface temperatures');
 for(let d=1;d<5;d++)assert(diversity[d]<=diversity[d-1],'Temperature diversity must decrease with depth');
 assert.equal(diversity[0],expected.length,'Shelf must retain the maximum temperature detail');
 assert.equal(oceanClass(4,0,count),0,'Deepest waters do not require SST');
 assert.equal(oceanClass(0,0,count),-1,'Missing shelf SST must stay unknown');
}
const encoded=t=>1+Math.round((t+5)*4);
assert.notEqual(oceanClass(0,encoded(2),6),oceanClass(0,encoded(25),6));
assert.equal(oceanClass(4,encoded(2),6),oceanClass(4,encoded(25),6));
console.log('Triangular classes: row counts, complete land partitions, all ocean classes reachable, depth convergence and missing-data handling pass.');
