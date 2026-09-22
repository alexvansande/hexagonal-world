import assert from 'node:assert/strict';
import {tourLocations,projectTourLocations,tourEnabled,pacificLayoutEnabled,pacificLightingEnabled} from './dist/tour-markers.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {sphereAt,geographicPoint} from './dist/globe-drag.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {defaultLayerPreset} from './dist/default-layers.mjs';
import manifest from './dist/maps/default-layers/manifest.mjs';
const entry=manifest.entries['dymaxion/lifezones'];
assert.equal(tourLocations.length,7,'Seven entry points');
assert.equal(new Set(tourLocations.map(p=>p.id)).size,7);
assert.deepEqual(tourLocations.map(p=>p.id),['origin-of-mankind','silk-road','iceland-to-vinland','french-polynesia','americas-exchange','african-networks','ocean-crossings']);
assert(tourLocations.every(p=>p.overlay),'Every remaining dot opens a story');
assert(tourEnabled(entry));assert(!tourEnabled(null));
// Stories exist on Spaceship Earth and Felv in every style except political borders and distortion analysis.
for(const [key,value] of Object.entries(manifest.entries)){const [arrangement,style]=key.split('/');assert.equal(tourEnabled(value),['dymaxion','felv'].includes(arrangement)&&!['political','distortion-analysis'].includes(style),key);}
assert(tourEnabled(manifest.entries['felv/satellite'])&&tourEnabled(manifest.entries['dymaxion/elevation'])&&!tourEnabled(manifest.entries['dymaxion/political'])&&!tourEnabled(manifest.entries['felv/distortion-analysis'])&&!tourEnabled(manifest.entries['gosper/lifezones']));
assert(pacificLayoutEnabled(manifest.entries['dymaxion/satellite'])&&!pacificLayoutEnabled(manifest.entries['felv/lifezones']),'The Pacific-facing arrangement is a Spaceship Earth feature');
assert(pacificLightingEnabled(manifest.entries['dymaxion/lifezones'])&&!pacificLightingEnabled(manifest.entries['dymaxion/satellite']),'Relit Pacific artwork exists for Lifezones only');
const angles=layoutOptions[0].state,tiles=makeGeometry(angles.method,angles.height),net=makeArrangement(tiles,angles.arrangement,layouts(tiles)).net;
const projected=projectTourLocations(tiles,net,angles);
assert.equal(projected.length,7,'every anchor must land in the visible Spaceship net');
for(const {location,tile,local} of projected){
 const p=geographicPoint(angles,sphereAt(world(local,tile),tile,tiles[tile.id]));
 const latitude=Math.asin(p[2])*180/Math.PI,longitude=Math.atan2(p[1],p[0])*180/Math.PI;
 assert(Math.abs(latitude-location.latitude)<1e-7,location.id+' latitude round trip');
 assert(Math.abs(longitude-location.longitude)<1e-7,location.id+' longitude round trip');
 assert.equal(location.overlay,{'origin-of-mankind':'human-migrations','silk-road':'silk-road','iceland-to-vinland':'norse-voyages','french-polynesia':'polynesia','americas-exchange':'americas-exchange','african-networks':'african-networks','ocean-crossings':'ocean-crossings'}[location.id]);
}
// Custom geography and puzzles must not accidentally retain the default tour.
for(const change of [{lon:0},{arrangement:'gosper'},{method:'tetra'}])assert(!tourEnabled(defaultLayerPreset({...entry.signature.state,...change},entry.signature.controls)));
assert(!tourEnabled(defaultLayerPreset(entry.signature.state,{...entry.signature.controls,puzzlegrid:true})));
console.log('Tour markers: seven unique entry points, geographic round trips and arrangement/style gating pass.');
