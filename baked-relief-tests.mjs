import assert from 'node:assert/strict';
import {bakedStyle,bakedStrength,loadBakedLayer} from './dist/baked-relief.mjs';
import {styleOptions} from './dist/map-options.mjs';
import {readFileSync,statSync} from 'node:fs';
for(const style of styleOptions){
 const controls={source:style.source,treatment:style.controls['relief-treatment'],tone:style.controls['relief-tone']};
 assert(bakedStyle(style.state,controls),'Every standard style has a baked path');
 assert.equal(bakedStyle({...style.state,reliefAzimuth:style.state.reliefAzimuth+.5},controls),null,'Custom desktop light uses the live renderer');
 assert.equal(bakedStyle({...style.state,reliefAzimuth:13},controls,true,style.id).id,style.id,'Mobile retains the style layer');
 for(const folder of ['', 'mobile/']){const file=`dist/maps/lighting/${folder}${style.id}.jpg`;assert(statSync(file).size<(folder?1500000:6000000));assert.equal(readFileSync(file).readUInt16BE(0),0xffd8);}
}
assert.equal(bakedStrength.off,0);assert(bakedStrength.dramatic>bakedStrength.style);
const pending=[];globalThis.Image=class {set src(value){this.url=value;pending.push(this);}};
const a=loadBakedLayer('lifezones',true),b=loadBakedLayer('lifezones',true);assert.equal(a,b);assert.equal(pending.length,1);pending[0].onload();await a;
const fail=loadBakedLayer('ivory',true);pending.at(-1).onerror();await assert.rejects(fail);const retry=loadBakedLayer('ivory',true);pending.at(-1).onload();await retry;
console.log('Baked lighting: standard/custom selection, mobile styles, bounded assets, deduplication and retry pass.');
