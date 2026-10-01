import assert from 'node:assert/strict';
import {existsSync} from './test-asset-index.mjs';
import {layoutOptions,styleOptions} from './dist/map-options.mjs';
import {PrecomputedSurfaces,surfacePreset,surfaceLevel,surfacePlan,surfaceTileBudget,surfaceTileRect,clipSurfaceTriangle} from './dist/precomputed-surfaces.mjs';
for(const layout of layoutOptions)for(const style of styleOptions){
 const state={...layout.state,...style.state};
 const entry=surfacePreset(state,style.source,style.controls['land-classes'],style.controls['ocean-classes']);
 assert(entry,`${layout.arrangement}/${style.id} has pre-rendered assets`);
 if(style.source==='ecology')assert(entry.path.startsWith('lifezones-defaults-1/'),'Default Lifezones must use tiles rebuilt for the approved palette');
 for(let region=0;region<entry.regions;region++)for(let level=0;level<=entry.maxLevel;level++)for(let y=0;y<2**level;y++)for(let x=0;x<2**level;x++)assert(existsSync(`dist/maps/surfaces/${entry.path}/${region}/${level}/${x}-${y}.webp`));
 assert.equal(surfacePreset({...state,lon:state.lon+.001},style.source),null,'Custom orientation must not use a default bake');
 assert.equal(surfacePreset({...state,bias:1.01},style.source),null);
 assert.equal(surfacePreset(state,style.source,10,6,.1),null);
 assert.equal(surfacePreset(state,style.source,10,6,0,3),null);
}
assert.equal(surfacePreset(layoutOptions[0].state,'ecology',15,6),null,'Custom lifezone classes use live rendering');
assert.equal(surfaceLevel(128,4),0);assert.equal(surfaceLevel(256,4),1);assert.equal(surfaceLevel(10000,4),4);
const fullView=level=>Array.from({length:4*4**level},(_,i)=>({region:Math.floor(i/4**level),x:i%2**level,y:Math.floor(i/2**level)%2**level}));
const retina=surfacePlan(3,4,fullView);
assert.equal(retina.level,2,'A full Retina map must fit its visible tiles and previews in memory');
assert(retina.tiles.length+4<=surfaceTileBudget);
assert.equal(surfacePlan(4,4,()=>[{region:0,x:3,y:5}]).level,4,'A close-up keeps maximum detail when visible tiles fit');
assert.equal(surfacePlan(4,4,()=>Array(200).fill({region:0,x:3,y:5})).level,4,'Repeated map copies share a texture budget');
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
 // A late response from an old view must not evict a current preview, even
 // when that preview is older than every other cached texture.
 const pinned=new PrecomputedSurfaces(gpu,()=>{}),protectedKey='protected/0/0/0-0';
 pinned.cache.set(protectedKey,{texture:{},used:-1});
 for(let i=1;i<surfaceTileBudget;i++)pinned.cache.set(`old/${i}`,{texture:{},used:i});
 pinned.prepare({path:'protected',regions:1});
 pinned.tile({path:'late'},0,1,0,0);
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 assert(pinned.cache.has(protectedKey),'Current preview survives cache pressure');
 assert.equal(pinned.cache.size,surfaceTileBudget,'Protecting previews does not increase the memory limit');
 console.log('Progressive surfaces: previews first, detail fallback, deduplication and style-switch priority pass.');
 // A piece turned by the dance takes another lit set. Only that region waits for the new set's
 // preview, never the whole map dropping to previews, and only while it can show its earlier set.
 const lit=new PrecomputedSurfaces(gpu,()=>{}),base={path:'base',regions:4};
 for(let r=0;r<4;r++){lit.cache.set(`base/${r}/0/0-0`,{texture:{},used:0});lit.cache.set(`lit/${r}/${r}/0/0-0`,{texture:{},used:0});}
 const sets=[0,1,2,3].map(r=>({region:r,x:0,y:0,path:`lit/${r}`}));
 assert.equal(lit.prepare(base,sets,0),true,'Each region needs only its own set');
 assert(![...lit.required].some(key=>/^lit\/0\/[123]\//.test(key)),'Other regions’ previews of a set are not fetched');
 sets[2].path='lit/9';
 assert.equal(lit.prepare(base,sets,0),false,'Without an earlier set a new preview is still awaited');
 assert.equal(lit.prepare(base,sets,0,(path,region)=>path==='lit/9'&&region===2),true,'A region showing its earlier set keeps the map sharp');
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 // Fades: without one, layers() is get(); with one, a newly decoded tile fades in over the
 // coarser tile it replaces, and a region changing sets crossfades from the set it showed.
 const fading=new PrecomputedSurfaces(gpu,()=>{}),one={path:'one',regions:1},t0=1000;
 fading.cache.set('one/0/0/0-0',{texture:'coarse',used:0,born:0});fading.cache.set('one/0/1/1-0',{texture:'fine',used:0,born:t0});
 assert.deepEqual(fading.layers(one,0,1,1,0,null,t0).map(l=>[l.texture,l.alpha]),[['fine',1]],'No fade unless asked');
 fading.fade=400;
 assert.deepEqual(fading.layers(one,0,1,1,0,null,t0+100).map(l=>l.texture),['coarse','fine'],'A new tile fades in over the coarser one');
 const half=fading.layers(one,0,1,1,0,null,t0+200)[1].alpha;assert(half>.3&&half<.7,'Halfway through the fade, half mixed');
 assert(fading.fading);
 assert.deepEqual(fading.layers(one,0,1,1,0,null,t0+400).map(l=>[l.texture,l.alpha]),[['fine',1]],'The fade ends on the new tile alone');
 fading.cache.set('old/0/1/1-0',{texture:'old-fine',used:0,born:0});
 const turn={from:'old',start:null};
 fading.cache.set('new/0/0/0-0',{texture:'new-coarse',used:0,born:0});fading.pending.add('new/0/1/1-0');
 assert.deepEqual(fading.layers({path:'new',regions:1},0,1,1,0,turn,t0).map(l=>l.texture),['old-fine'],'The earlier set stays until the new one is as sharp');
 assert.equal(turn.start,null);
 fading.pending.delete('new/0/1/1-0');fading.cache.set('new/0/1/1-0',{texture:'new-fine',used:0,born:0});
 const mixed=fading.layers({path:'new',regions:1},0,1,1,0,turn,t0+50);
 assert.deepEqual(mixed.map(l=>l.texture),['old-fine','new-fine'],'Then the sets crossfade');assert.equal(turn.start,t0+50);
 assert.deepEqual(fading.layers({path:'new',regions:1},0,1,1,0,turn,t0+50+400).map(l=>[l.texture,l.alpha]),[['new-fine',1]]);
 // Tiles a camera flight will land on load after the visible ones and are kept.
 const ahead=new PrecomputedSurfaces(gpu,()=>{});ahead.prefetch=new Set(['ahead/0/3/1-1']);ahead.prepare({path:'ahead',regions:1});
 assert(ahead.required.has('ahead/0/3/1-1'));assert.equal(ahead.queue.at(-1)?.key??[...ahead.pending].at(-1),'ahead/0/3/1-1','Prefetch queues behind the previews');
 for(const resolve of responses.splice(0))resolve();
 await new Promise(resolve=>setImmediate(resolve));
 console.log('Presentation surfaces: per-region lit previews, tile and set crossfades, flight prefetch pass.');
}finally{globalThis.fetch=originalFetch;globalThis.createImageBitmap=originalBitmap;}
