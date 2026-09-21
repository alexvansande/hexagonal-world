import assert from 'node:assert/strict';
import {tourLocations,projectTourLocations,tourEnabled} from './dist/tour-markers.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {sphereAt,geographicPoint} from './dist/globe-drag.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {defaultLayerPreset} from './dist/default-layers.mjs';
import manifest from './dist/maps/default-layers/manifest.mjs';
const entry=manifest.entries['dymaxion/lifezones'];
assert.equal(tourLocations.length,15);
assert.equal(new Set(tourLocations.map(p=>p.id)).size,15);
assert(tourEnabled(entry));assert(!tourEnabled(null));
for(const [key,value] of Object.entries(manifest.entries))assert.equal(tourEnabled(value),key==='dymaxion/lifezones',key);
const angles=layoutOptions[0].state,tiles=makeGeometry(angles.method,angles.height),net=makeArrangement(tiles,angles.arrangement,layouts(tiles)).net;
const projected=projectTourLocations(tiles,net,angles);
assert.equal(projected.length,15,'every anchor must land in the visible Spaceship net');
for(const {location,tile,local} of projected){
 const p=geographicPoint(angles,sphereAt(world(local,tile),tile,tiles[tile.id]));
 const latitude=Math.asin(p[2])*180/Math.PI,longitude=Math.atan2(p[1],p[0])*180/Math.PI;
 assert(Math.abs(latitude-location.latitude)<1e-7,location.id+' latitude round trip');
 assert(Math.abs(longitude-location.longitude)<1e-7,location.id+' longitude round trip');
 assert.equal(location.overlay,location.id==='origin-of-mankind'?'human-migrations':location.id==='silk-road'?'silk-road':location.id==='french-polynesia'?'polynesia':({'ancient-egypt':'egypt-thutmose-iii',mesopotamia:'neo-assyrian','iceland-to-vinland':'norse-voyages','amazon-mouth':'amazon-basin',india:'maurya-ashoka',china:'qing-qianlong'}[location.id]||null));
}
// Custom geography and puzzles must not accidentally retain the default tour.
for(const change of [{lon:0},{arrangement:'felv'},{method:'tetra'}])assert(!tourEnabled(defaultLayerPreset({...entry.signature.state,...change},entry.signature.controls)));
assert(!tourEnabled(defaultLayerPreset(entry.signature.state,{...entry.signature.controls,puzzlegrid:true})));
console.log('Tour markers: fifteen unique IDs, geographic round trips and default-only gating pass.');
