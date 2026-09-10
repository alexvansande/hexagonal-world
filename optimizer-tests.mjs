import assert from 'node:assert/strict';
import {edgeSamples,outerEdgeSamples,rotation,landScore,optimize} from './dist/optimizer.mjs';
import {makeGeometry,layouts} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
const start={lon:0,lat:0,roll:0};
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const s=edgeSamples({method,height:1.5},32);assert.equal(s.length,12*32*3);
 for(let i=0;i<s.length;i+=3)assert(Math.abs(Math.hypot(...s.slice(i,i+3))-1)<1e-12);
 assert.equal(landScore(s,start,new Uint8Array(512),32,16),0);
 assert.equal(landScore(s,{lon:123,lat:67,roll:-152},new Uint8Array(512).fill(1),32,16),1);
 const tiles=makeGeometry(method),nets=layouts(tiles);
 assert.equal(outerEdgeSamples({method,height:1.5},makeArrangement(tiles,'infinite',nets),8).length,0,'Infinite tiling has no outer edge');
 assert.equal(outerEdgeSamples({method,height:1.5},makeArrangement(tiles,'flower',nets),8).length,18*8*3,'Flower samples only exposed edges');
 assert.equal(outerEdgeSamples({method,height:1.5},makeArrangement(tiles,'dymaxion',nets),8).length,16*8*3,'Fuller samples only exposed edges');
 assert.equal(outerEdgeSamples({method,height:1.5},makeArrangement(tiles,'bighex',nets),8).length,18*8*3,'Big hex samples only exposed edges');
 assert.equal(outerEdgeSamples({method,height:1.5},makeArrangement(tiles,'felv',nets),8).length,13*8*3,'Felv samples only exposed edges');
}
// Independent sequential Euler rotations match the renderer's convention.
for(const angles of [{lon:30,lat:20,roll:-40},{lon:-170,lat:-80,roll:125}]){
 const d=Math.PI/180;let [x,y,z]=[.3,.4,.5],a=angles.roll*d;
 [y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];a=angles.lat*d;
 [x,z]=[x*Math.cos(a)-z*Math.sin(a),x*Math.sin(a)+z*Math.cos(a)];a=angles.lon*d;
 [x,y]=[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
 const m=rotation(angles),v=[.3,.4,.5];for(let i=0;i<3;i++)assert(Math.abs(m.slice(i*3,i*3+3).reduce((s,a,j)=>s+a*v[j],0)-[x,y,z][i])<1e-12);
}
const width=128,height=64,mask=new Uint8Array(width*height);
for(let y=18;y<42;y++)for(let x=50;x<80;x++)mask[y*width+x]=1;
const result=optimize({config:{method:'tetra'},start,mask,width,height,budget:100,seed:42});
assert(result.after<=result.before);assert(result.after<result.before,'search should avoid the synthetic land patch');
assert.equal(result.samples,24576);assert(Number.isFinite(result.angles.lon));
console.log('Optimizer: sphere samples, land masks, rotation convention, improvement and dense validation passed.');

const {clearanceField,clearanceMask}=await import('./dist/clearance.mjs');
const coast=new Uint8Array(36*18);coast[9*36]=1;
const field=clearanceField(coast,36,18,36,18);
assert.equal(field.distance[9*36],0);
assert(Math.abs(field.distance[9*36+1]-field.distance[9*36+35])<1e-10,'clearance must wrap across the date line');
assert(Math.abs(field.distance[8*36]-10)<1e-10,'north/south distances are angular degrees');
const near=clearanceMask(field.distance,10),far=clearanceMask(field.distance,20);
for(let i=0;i<near.length;i++)assert(far[i]>=near[i],'larger clearance must include all previously penalized pixels');
assert(far.reduce((a,b)=>a+b)>near.reduce((a,b)=>a+b));
assert(clearanceField(new Uint8Array(36*18),36,18,36,18).distance.every(d=>d===Infinity));
assert(clearanceField(new Uint8Array(36*18).fill(1),36,18,36,18).distance.every(d=>d===0));
console.log('Coastline clearance: angular units, date-line wrapping, monotonic thresholds and empty/full masks pass.');
