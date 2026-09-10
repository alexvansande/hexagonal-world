import assert from 'node:assert/strict';
import {lightingSettings,lightingKey,ProjectedLighting} from './dist/projected-lighting.mjs';
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
