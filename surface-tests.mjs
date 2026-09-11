import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {layoutOptions,styleOptions} from './dist/map-options.mjs';
import {PrecomputedSurfaces,surfacePreset,surfaceLevel,surfaceTileRect,clipSurfaceTriangle} from './dist/precomputed-surfaces.mjs';
for(const layout of layoutOptions)for(const style of styleOptions){
 const state={...layout.state,...style.state};
 const entry=surfacePreset(state,style.source,style.controls['land-classes'],style.controls['ocean-classes']);
 assert(entry,`${layout.arrangement}/${style.id} has pre-rendered assets`);
 for(let region=0;region<entry.regions;region++)for(let level=0;level<=entry.maxLevel;level++)for(let y=0;y<2**level;y++)for(let x=0;x<2**level;x++)assert(existsSync(`dist/maps/surfaces/${entry.path}/${region}/${level}/${x}-${y}.webp`));
 assert.equal(surfacePreset({...state,lon:state.lon+.001},style.source),null,'Custom orientation must not use a default bake');
 assert.equal(surfacePreset({...state,bias:1.01},style.source),null);
 assert.equal(surfacePreset(state,style.source,10,6,.1),null);
 assert.equal(surfacePreset(state,style.source,10,6,0,3),null);
}
assert.equal(surfacePreset(layoutOptions[0].state,'ecology',15,6),null,'Custom lifezone classes use live rendering');
assert.equal(surfaceLevel(128,4),0);assert.equal(surfaceLevel(256,4),1);assert.equal(surfaceLevel(10000,4),4);
for(let level=0;level<=4;level++){
 const n=2**level;let area=0;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const r=surfaceTileRect(level,x,y);area+=r[2]*r[3];if(x+1<n)assert.equal(r[0]+r[2],surfaceTileRect(level,x+1,y)[0]);}
 assert.equal(area,4,'Tile rectangles cover the full region without gaps');
}
const vertex=(x,y)=>{const v=Array(18).fill(0);v[0]=x;v[1]=-y;v[2]=x+y;v[14]=1;v[15]=x;v[16]=y;return v;};
const triangle=[vertex(-1,-1),vertex(1,-1),vertex(0,1)];
for(let level=0;level<=4;level++){
 let area=0;
 for(let y=0;y<2**level;y++)for(let x=0;x<2**level;x++){
  const clipped=clipSurfaceTriangle(triangle,surfaceTileRect(level,x,y));
  for(let i=0;i<clipped.length;i+=18){assert(Math.abs(clipped[i+2]-clipped[i+15]-clipped[i+16])<1e-12);assert.equal(clipped[i+14],1);}
  for(let i=0;i<clipped.length;i+=54){const a=clipped.slice(i,i+18),b=clipped.slice(i+18,i+36),c=clipped.slice(i+36,i+54);area+=Math.abs((b[15]-a[15])*(c[16]-a[16])-(c[15]-a[15])*(b[16]-a[16]))/2;}
 }
 assert(Math.abs(area-2)<1e-10,'Clipped tiles retain triangle area and projection attributes');
}
console.log('Default surfaces: all 64 presets, complete zoom pyramids, custom fallback and gap-free clipped geometry pass.');
// Hold network responses so the order is deterministic, including rapid switches.
const originalFetch=globalThis.fetch,originalBitmap=globalThis.createImageBitmap;
const requests=[],responses=[];
const gpu={createTexture:()=>({}),activeTexture(){},bindTexture(){},texParameteri(){},texImage2D(){},deleteTexture(){}};
try{
 globalThis.fetch=url=>{requests.push(url);return new Promise(resolve=>responses.push(()=>resolve({ok:true,blob:async()=>({})})));};
 globalThis.createImageBitmap=async()=>({close(){}});
 const cache=new PrecomputedSurfaces(gpu,()=>{}),entry={path:'first',regions:4};
 assert.equal(cache.prepare(entry),false);
 assert.equal(requests.length,4);assert(requests.every(url=>url.endsWith('/0/0-0.webp')),'All regions start with previews');
 cache.get(entry,0,0,0,0);assert.equal(requests.length,4,'Pending preview requests are deduplicated');
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cache.prepare(entry),true);
 assert.deepEqual(cache.get(entry,0,2,1,1).rect,[-1,-1,2,2],'Preview remains visible while detail loads');
 for(let x=0;x<4;x++)cache.get(entry,0,2,x,2);
 assert(cache.queue.length>0);
 const next={path:'next',regions:2};cache.prepare(next);
 assert(cache.queue.every(job=>job.key.startsWith('next/')),'Switching styles drops obsolete queued detail');
 assert(![...cache.pending].some(key=>key.startsWith('first/')&&cache.queue.some(job=>job.key===key)));
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 assert(requests.slice(-2).every(url=>url.startsWith('maps/surfaces/next/')),'New previews take priority over old detail');
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cache.pending.size,0);
 console.log('Progressive surfaces: previews first, detail fallback, deduplication and style-switch priority pass.');
}finally{globalThis.fetch=originalFetch;globalThis.createImageBitmap=originalBitmap;}
