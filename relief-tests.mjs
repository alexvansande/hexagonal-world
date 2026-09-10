import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reliefDefaults,reliefRanges,reliefDimensions,shadowReach} from './dist/relief.mjs';
import {encodeMapState,decodeMapState} from './dist/map-state.mjs';

// The deepest ocean must never puncture the supporting table. The slab and
// terrain stay independently adjustable across every allowed endpoint.
for(const height of [0,1.1,2.5])for(const ocean of [0,.45,1])for(const sea of [0,105,255])for(const thickness of [0,.55,2]){
  const state={...reliefDefaults,reliefHeight:height,reliefOcean:ocean,reliefSeaLevel:sea,reliefThickness:thickness};
  const d=reliefDimensions(state);
  assert(d.base-d.depth*d.sea*ocean>=-1e-12);
  assert(d.maximum>=d.thickness-1e-12);
  assert(Number.isFinite(shadowReach(state))&&shadowReach(state)>=0);
}
assert(shadowReach({...reliefDefaults,reliefAltitude:15})>shadowReach({...reliefDefaults,reliefAltitude:60}));
assert(shadowReach({...reliefDefaults,reliefThickness:2})>shadowReach({...reliefDefaults,reliefThickness:0}));
assert.equal(reliefDefaults.reliefHeight,1.1);
assert.equal(reliefDefaults.reliefAzimuth,315);

// Compact map URLs preserve projection, source/material, panel/cutout choices,
// relief controls, and the current view without a separate preset library.
const saved={version:1,state:{...reliefDefaults,method:'rhombic',arrangement:'flower'},controls:{'map-source':'terrain','relief-enabled':true,'relief-material':'ivory','relief-treatment':'atlas','relief-tone':'warm'},view:{scale:160,zoom:2,panX:10,panY:-20},details:[true,false]};
const restored=decodeMapState(encodeMapState(saved));
for(const [id] of reliefRanges)assert.equal(restored.state[id],saved.state[id]);
for(const [key,value] of Object.entries(saved.controls))assert.equal(restored.controls[key],value);

const manifest=JSON.parse(readFileSync('dist/maps/height/manifest.json','utf8'));
assert.deepEqual(manifest.size,[21600,10800]);assert.equal(manifest.tiles.length,6);
for(const name of manifest.tiles){
  const png=readFileSync(`dist/maps/height/${name}`);
  assert.equal(png.readUInt32BE(16),7202);assert.equal(png.readUInt32BE(20),5402);
  assert.equal(png[24],8);assert.equal(png[25],0,'Height tiles must remain single-channel grayscale');
}
console.log('Relief: table clearance, shadow direction/height relationships, compact map URLs, and full-resolution grayscale assets pass.');
