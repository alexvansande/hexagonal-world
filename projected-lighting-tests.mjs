import assert from 'node:assert/strict';
import {lightingSettings,lightingKey,ProjectedLighting,lightingPlan,lightingCovers} from './dist/projected-lighting.mjs';
import {reliefDefaults,reliefLooks} from './dist/relief.mjs';
import {encodeMapState,decodeMapState} from './dist/map-state.mjs';
const state={...reliefDefaults,method:'rhombic',arrangement:'felv',lon:12,lat:34,roll:56};
for(const name of ['sculpted','dramatic','gentle']){
 const settings=lightingSettings(name,state);
 for(const [key,value] of Object.entries(reliefLooks[name]))assert.equal(settings[key],value,'The original lighting preset is preserved');
 const key=lightingKey(state,name);
 assert.equal(lightingKey({...state,zoom:5,panX:78,panY:10,reliefColorFade:1,shadowOpacity:0,lightOpacity:0},name),key,'View and opacity changes reuse the layer');
 assert.notEqual(lightingKey({...state,lon:13},name),key,'Changing the globe prepares a new layer');
}
assert.equal(lightingSettings('custom',{...state,reliefAzimuth:78}).reliefAzimuth,78);
const deleted=[],fake={gl:{deleteTexture:t=>deleted.push(t)},entries:new Map(),bakes:0};
for(let i=0;i<5;i++)ProjectedLighting.prototype.store.call(fake,''+i,{textures:['dark'+i,'light'+i]});
assert.equal(fake.entries.size,3);assert.deepEqual(deleted,['dark0','light0','dark1','light1']);
const saved={state:{...state,shadowOpacity:.3,lightOpacity:.8},controls:{'lighting-preset':'dramatic'},view:{scale:100,zoom:1,panX:0,panY:0},details:{}};
const restored=decodeMapState(encodeMapState(saved));assert.equal(restored.state.shadowOpacity,.3);assert.equal(restored.state.lightOpacity,.8);assert.equal(restored.controls['lighting-preset'],'dramatic');
console.log('Lighting layers: original presets, geometry invalidation, opacity/view reuse, bounded GPU cache, and saved controls pass.');

const rect=[-3,-2,6,4],view={unit:220,width:1100,height:700,dpr:1,panX:0,panY:0};
const overview=lightingPlan(rect,view),close=lightingPlan(rect,{...view,unit:2640});
assert.equal(overview.level,0);
assert(close.level>=3,'Deep zoom gets at least eight times the overview density');
assert(close.rect[2]<rect[2],'Close-up images cover a region instead of enlarging the whole world');
assert(lightingCovers(close,{...view,unit:2640}));
assert.deepEqual(lightingPlan(rect,{...view,unit:2640,panX:10}).rect,close.rect,'Small pans reuse the image');
assert(!lightingCovers(close,{...view,unit:2640,panX:5000}),'Distant pans need a new window');
for(const compact of [false,true])for(const unit of [220,500,1200,2640])for(const panX of [-2300,-500,0,100,900]){
 const v={...view,width:compact?390:1100,height:compact?700:700,unit,panX};
 const p=lightingPlan(rect,{...v,compact,maxSize:2048,repeat:true});
 assert(lightingCovers(p,v),'Every planned window contains the viewport');
 assert(Math.max(p.rect[2],p.rect[3])*p.density<=Math.min(compact?1000:2200,2048)+1e-6,'Image dimensions respect device limits');
 if(p.level)assert.equal(p.repeat,false,'Detail windows follow screen-space rotation, not periodic wrapping');
}
const touched={entries:new Map([['a',1],['b',2]])};
assert.equal(ProjectedLighting.prototype.get.call(touched,'a'),1);assert.deepEqual([...touched.entries.keys()],['b','a']);
console.log('Lighting zoom levels: higher density, bounded images, viewport coverage, pan reuse and LRU cache pass.');
