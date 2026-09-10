import assert from 'node:assert/strict';
import {oceanRows} from './dist/tests/wave-layers.mjs';
import {paintEcology,oceanClass} from './dist/map-layers.mjs';
for(const count of [3,6,10,15]){
 const rows=oceanRows(count);
 assert.equal(rows.reduce((sum,r)=>sum+r.cells.length,0),count);
 assert.deepEqual(rows.map(r=>r.cells.length),rows.map((_,i)=>i+1));
 assert(rows.every(r=>r.cells.every(c=>c.detail.includes('wave height >2 m'))));
 const diversity=Array.from({length:5},(_,band)=>new Set(Array.from({length:255},(_,i)=>oceanClass(band,i+1,count))).size);
 assert.equal(diversity[4],1);
 for(let i=1;i<5;i++)assert(diversity[i]<=diversity[i-1]);
 const missing=paintEcology(new Uint8ClampedArray([0,255,100,255]),10,count);
 assert.deepEqual([...missing],[153,156,163,255],'Missing waves must not become calm water');
}
console.log('Wave preview: triangular rows, exposure convergence and missing-data handling pass.');
