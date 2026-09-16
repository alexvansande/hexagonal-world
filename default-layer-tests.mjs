import {mergedEntry} from './dist/merged-maps.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {existsSync} from './test-asset-index.mjs';
import manifest from './dist/maps/default-layers/manifest.mjs';
import {DefaultLayers,defaultLayerPreset,imageFragment,lightingDetailSelection} from './dist/default-layers.mjs';
import {shareCombinations} from './dist/share-routes.mjs';
import {packRiverField,paintRiverMask} from './dist/river-layers.mjs';
import {displayPixelRatio} from './dist/device-profile.mjs';
assert.equal(Object.keys(manifest.entries).length,64);
for(const {layout,style} of shareCombinations){
 const entry=manifest.entries[layout.arrangement+'/'+style.id];assert(entry);
 const {state,controls}=entry.signature;
 if(style.id==='lifezones'){assert.equal(controls['relief-enabled'],true);assert.equal(controls['lighting-preset'],'sculpted');assert(entry.lighting,'Lifezones shadows must be baked, not calculated at startup');}
 assert.equal(defaultLayerPreset({...layout.state,...style.state},{...layout.controls,...style.controls})?.path,entry.path,'Current presets match their baked signatures');
 assert.equal(defaultLayerPreset(state,controls)?.path,entry.path,'Every complete default uses image layers');
 assert.equal(defaultLayerPreset({...state,lon:state.lon+.01},controls),null,'Custom geography cannot use a stale image');
 assert.equal(defaultLayerPreset(state,{...controls,'river-color':'#abcdef'}),null,'Custom rivers cannot use a stale image');
 assert.equal(defaultLayerPreset(state,{...controls,puzzlegrid:true}),null,'Puzzle artwork must use its actual cut');
 assert.equal(defaultLayerPreset({...state,shadowOpacity:.123,lightOpacity:.456},controls)?.path,entry.path,'Changing compositing opacity never rebakes lighting');
 assert.equal(defaultLayerPreset({...state,panX:99999,zoom:12},controls)?.path,entry.path,'Pan and zoom never enable terrain shading on a default map');
 for(let r=0;r<entry.regions;r++)for(let l=0;l<=entry.maxLevel;l++)for(let y=0;y<2**l;y++)for(let x=0;x<2**l;x++)assert(existsSync(`dist/maps/default-layers/${entry.basePath||entry.path+'/base'}/${r}/${l}/${x}-${y}.png`));
 if(entry.lighting&&!mergedEntry(entry))for(let i=0;i<2;i++)for(let l=0;l<=entry.lighting.maxLevel;l++)assert(existsSync(`dist/maps/default-layers/${entry.path}/light/${i}/preview-${l}.png`));
 for(let level=1;level<=(mergedEntry(entry)?0:entry.lighting?.detailLevel||0);level++){const folder=`dist/maps/default-layers/${entry.path}/detail`,size=JSON.parse(readFileSync(`${folder}/complete-${level}.json`));for(let layer=0;layer<2;layer++)for(let y=0;y<Math.ceil(size.height/256);y++)for(let x=0;x<Math.ceil(size.width/256);x++)assert(existsSync(`${folder}/${layer}/${level}/${x}-${y}.png`),'Lighting detail pyramid is complete');}
}
assert(!imageFragment.includes('ecology')&&!imageFragment.includes('horizon')&&!imageFragment.includes('heightMap'),'The default fragment program only samples images');
// A map level of 4 is not the same density as lighting level 4. This was why
// the first comparison checkbox did nothing on close-up views.
for(const style of ['satellite','elevation','lifezones']){
 const entry=manifest.entries['dymaxion/'+style],view={unit:2640,dpr:2,width:1440,height:1000,panX:-5681,panY:120};
 const original=lightingDetailSelection(entry,view),capped=lightingDetailSelection(entry,view,true);
 assert(capped.capped&&capped.density<original.density);
 assert.equal(capped.density,128*2**entry.maxLevel);
 assert(!lightingDetailSelection(entry,{...view,unit:100},true).capped,'Normal views should report that both choices use the same resolution');
 const {width,height}=entry.lighting.mapResolution;
 if(process.env.REMOTE_ASSET_TESTS!=='1')for(let layer=0;layer<2;layer++)for(let y=0;y<Math.ceil(height/256);y++)for(let x=0;x<Math.ceil(width/256);x++)assert(existsSync(`dist/maps/default-layers/${entry.path}/detail/${layer}/map/${x}-${y}.png`));
}
const field={width:4,height:2,distances:new Uint8Array([0,16,64,255,32,64,128,254]),widths:new Uint8Array([16,32,64,128,8,48,64,1])};
const packed=packRiverField(field,4096);assert.equal(packed.data.length,16);
for(let i=0;i<8;i++){assert.equal(packed.data[i*2],field.distances[i]);assert.equal(packed.data[i*2+1],field.widths[i]);}
assert.deepEqual([packRiverField(field,2).width,packRiverField(field,2).height],[2,1]);
for(const width of [.5,.75,1,1.5,3]){const old=paintRiverMask(field.distances,width,undefined,field.widths);for(let i=0;i<8;i++){const d=packed.data[i*2],w=packed.data[i*2+1];assert.equal(d<255&&d<=width*64?Math.round(255*Math.min(1,w/64*width)):0,old[i*4+3],'Packed field preserves the painted texel coverage');}}
assert.equal(displayPixelRatio(1440,1000,2,2),2);assert(displayPixelRatio(8000,6000,3,3)**2*8000*6000<=16000001);
console.log('Default image layers: all 64 preset matches and asset pyramids, custom invalidation, packed river parity, device pixel budget pass.');

// Resource disposal and transient failures reproduce the reported missing-map path.
const {PrecomputedSurfaces}=await import('./dist/precomputed-surfaces.mjs');
const {RiverFields}=await import('./dist/river-layers.mjs');
const fetchBefore=globalThis.fetch,bitmapBefore=globalThis.createImageBitmap;
let rejectDownload=true,deleted=0,closed=0,attempts=0;
const gpu={createTexture:()=>({}),activeTexture(){},bindTexture(){},texParameteri(){},texImage2D(){},deleteTexture(){deleted++;}};
try{
 globalThis.fetch=async()=>{attempts++;return {ok:!rejectDownload,status:503,blob:async()=>({})};};
 globalThis.createImageBitmap=async()=>({close(){closed++;}});
 const cache=new PrecomputedSurfaces(gpu,()=>{}),entry={path:'retry',regions:1};
 cache.prepare(entry);await new Promise(r=>setImmediate(r));assert.equal(cache.failures.size,1);assert.equal(cache.pending.size,0);
 rejectDownload=false;cache.retry();cache.prepare(entry);await new Promise(r=>setImmediate(r));
 assert.equal(cache.failures.size,0);assert.equal(cache.cache.size,1);assert.equal(attempts,2);assert.equal(closed,1);
 cache.dispose();assert.equal(deleted,1);assert.equal(cache.cache.size,0);assert.equal(cache.pending.size,0);
 const fields=new RiverFields({load:async()=>field});await fields.get(6);assert(fields.cached);fields.clear();assert.equal(fields.cached,null);assert.equal(fields.pending,null);
 console.log('Transient image retry, decoded-image closing, texture disposal and live river release pass.');
}finally{globalThis.fetch=fetchBefore;globalThis.createImageBitmap=bitmapBefore;}

let required;const crowded=DefaultLayers.prototype.lightingDetail.call({detail:{setRequired(keys){required=keys;}}},{path:'budget',lighting:{rect:[0,0,3,3],repeat:true,angle:Math.PI/4,detailLevel:3}},{unit:1600,dpr:2,width:1600,height:1600,panX:0,panY:0});assert.equal(crowded.length,0);assert.equal(required.size,0,'A rotated repeating view falls back to its overview rather than exceeding the lighting cache budget');
