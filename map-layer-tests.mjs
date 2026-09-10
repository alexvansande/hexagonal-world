import assert from 'node:assert/strict';
import {landClass,oceanClass,landLegends,oceanLegend,paintEcology} from './dist/map-layers.mjs';
for(const n of [3,6,10,15]){assert.equal(landLegends[n].length,n);for(let raw=1;raw<=39;raw++)assert(landClass(raw,n)>=0&&landClass(raw,n)<n);assert.equal(landClass(254,n),0);}
for(const n of [3,6,10,15]){assert.equal(oceanLegend(n).length,n);for(let d=0;d<5;d++)for(let t=1;t<4;t++)assert(oceanClass(d,t,n)>=0&&oceanClass(d,t,n)<n);}
const px=new Uint8ClampedArray([1,0,0,255,0,0,1,255,0,4,3,255,254,0,0,255]);const out=paintEcology(px,10,6);assert.equal(out.length,px.length);for(let i=0;i<out.length;i+=4)assert.equal(out[i+3],255);assert(out[0]!==1||out[1]!==0||out[2]!==0);
const antarctica=new Uint8ClampedArray([254,0,0,255]);const polar=paintEcology(antarctica,6,10);assert.deepEqual([...polar.slice(0,3)],[217,228,223]);console.log('Map layers: class presets and RGB ecology rendering pass.');
