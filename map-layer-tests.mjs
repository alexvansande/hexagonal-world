import assert from 'node:assert/strict';
import {landClass,oceanClass,landLegends,landRows,oceanRows,oceanLegend,paintEcology,fillEcologyGaps} from './dist/map-layers.mjs';
for(const n of [3,6,10,15]){assert.equal(landLegends[n].length,n);for(let raw=1;raw<=39;raw++)assert(landClass(raw,n)>=0&&landClass(raw,n)<n);assert.equal(landClass(254,n),-1);}
for(const n of [3,6,10,15]){assert.equal(oceanLegend(n).length,n);for(let d=0;d<5;d++)for(let t=1;t<256;t++)assert(oceanClass(d,t,n)>=0&&oceanClass(d,t,n)<n);}
const px=new Uint8ClampedArray([1,0,0,255,0,0,1,255,0,4,3,255,254,0,0,255]);const out=paintEcology(px,10,6);assert.equal(out.length,px.length);for(let i=0;i<out.length;i+=4)assert.equal(out[i+3],255);assert(out[0]!==1||out[1]!==0||out[2]!==0);
// Missing coastal land must never appear as a polar oasis.
for(const n of [3,6,10,15]){
 const unknown=paintEcology(new Uint8ClampedArray([254,0,0,255]),n,10);assert.deepEqual([...unknown.slice(0,3)],[153,156,163]);
 const ice=paintEcology(new Uint8ClampedArray([1,0,0,255]),n,10);assert.notDeepEqual([...ice.slice(0,3)],[153,156,163]);
}
console.log('Map layers: class presets and RGB ecology rendering pass.');

for(const count of [3,6,10,15]){
 const expected=Array.from({length:(Math.sqrt(8*count+1)-1)/2},(_,i)=>i+1);
 assert.deepEqual(landRows(count).map(r=>r.cells.length),expected);
 assert.deepEqual(oceanRows(count).map(r=>r.cells.length),expected);
 const raw=landLegends[count].flatMap(c=>c.raw).sort((a,b)=>a-b);
 assert.deepEqual(raw,Array.from({length:39},(_,i)=>i+1),'Every Holdridge class must occur exactly once');
 const reached=new Set();
 for(let d=0;d<5;d++)for(let t=1;t<256;t++)reached.add(oceanClass(d,t,count));
 assert.equal(reached.size,count,'Every marine class must be reachable from source temperatures');
 assert.equal(oceanClass(255,1,count),0,'Cold apex merges exposures');
 assert.equal(oceanClass(0,0,count),-1,'Missing SST stays unknown');
}

console.log('Triangular classes: row counts, complete land partitions, all ocean classes reachable, cold convergence and missing-data handling pass.');

const rgba=values=>new Uint8ClampedArray(values.flatMap(v=>[...v,255]));
const gaps=rgba([[25,0,0],[254,0,0],[0,4,100],[0,255,0],[0,1,80],[254,0,0]]),saved=new Uint8ClampedArray(gaps),filled=fillEcologyGaps(gaps,6,1);
assert.deepEqual(gaps,saved,'Gap filling must not mutate source data');
assert.equal(filled[4],25,'Land borrows a valid land class, not adjoining water');
assert.equal(filled[20],25,'Donors wrap around the longitude seam');
assert.equal(filled[13],4);assert.equal(filled[14],100);
for(const p of [0,2,4])assert.deepEqual(filled.slice(p*4,p*4+4),gaps.slice(p*4,p*4+4),'Valid data stays unchanged');
assert.deepEqual(fillEcologyGaps(rgba([[254,0,0]]),1,1),rgba([[254,0,0]]),'No donor means no invented class');
assert.deepEqual([...fillEcologyGaps(rgba([[25,0,0],[254,0,0],[254,0,0],[254,0,0],[254,0,0]]),5,1)].filter((_,i)=>i%4===0),[25,25,25,25,25],'Flood crosses multi-cell gaps');
assert.throws(()=>fillEcologyGaps(gaps,2,2));
console.log('Ecology gaps: nearest valid fields, longitude wrapping, multiple-cell gaps, realm separation and unchanged source data pass.');
