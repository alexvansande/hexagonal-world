import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectTourAreas,tourAreaSets,areaPaths} from './dist/tour-areas.mjs';
import {projectTourLocations,tourLocations} from './dist/tour-markers.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';

const angles=layoutOptions[0].state,tiles=makeGeometry(angles.method,angles.height),net=makeArrangement(tiles,angles.arrangement,layouts(tiles)).net;
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;};
const geoInside=(p,geometry)=>(geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates).some(polygon=>polygon.reduce((yes,ring)=>yes!==inside(p,ring),false));
const projectedInside=(anchor,area)=>area.fills.filter(f=>f.tile.id===anchor.tile.id).reduce((yes,f)=>yes!==inside(anchor.local,f.local),false);
// Area overlays are no longer entry points; the geometry, clipping and provenance remain testable.
assert.equal(Object.keys(tourAreaSets).length,5);
const landmarks={
 'ancient-egypt':{in:[[32.6,25.7],[35.2,31.8],[31.7,19]],out:[[44.4,33.3],[23,30],[32,15]]},
 mesopotamia:{in:[[43.15,36.35],[44.4,33.3],[31.2,30],[33.4,35.1]],out:[[51.4,35.7],[32,19],[29,39]]},
 india:{in:[[85.1,25.6],[72.8,33.7],[85.8,20.3],[76.5,15.3]],out:[[80.7,7.5],[78.1,9.9],[90,30]]},
 china:{in:[[116.4,39.9],[106.9,47.9],[91.1,29.7],[87.6,43.8],[132,44]],out:[[127,37],[85.3,27.7],[96.2,16.8],[77.2,28.6]]},
 'amazon-mouth':{in:[[-60,-3],[-73.25,-3.75],[-54.7,-2.4]],out:[[-47.9,-15.8],[-63,8],[-49,-5],[-70,-23]]},
};
let samples=0;
for(const [id,areas] of Object.entries(tourAreaSets)){
 const area=areas[0],projected=projectTourAreas(tiles,net,angles,areas)[0];
 assert(projected.fills.length&&projected.segments.length,id+' has both fill and actual border');
 for(const expected of [true,false])for(const p of landmarks[id][expected?'in':'out'])assert.equal(geoInside(p,area.geometry),expected,`${id} landmark ${p}`);
 // Independent geographic membership must match the projected fill across the
 // entire globe, including off-continent space and every hexagonal piece.
 for(let lat=-78.37;lat<80;lat+=4.77)for(let lon=-178.83;lon<180;lon+=5.13){
  const [anchor]=projectTourLocations(tiles,net,angles,[{latitude:lat,longitude:lon}]);
  assert.equal(projectedInside(anchor,projected),geoInside([lon,lat],area.geometry),`${id} fill membership ${lat},${lon}`);samples++;
 }
 const paths=areaPaths(projected,world);assert(!/NaN|Infinity/.test(paths.fill+paths.border));
 // No stroke is manufactured along the closure edges of a clipped patch.
 assert.equal((paths.border.match(/M/g)||[]).length,projected.segments.length);
 assert(!paths.border.includes('Z'));
}
// A concave polygon with a hole spans multiple pieces; neither the hole nor the
// concavity may be filled in, including when their boundaries meet a map cut.
const synthetic={id:'hole-check',geometry:{type:'Polygon',coordinates:[
 [[-70,-25],[90,-25],[90,55],[40,55],[40,20],[-10,20],[-10,55],[-70,55],[-70,-25]],
 [[-40,-10],[0,-10],[0,10],[-40,10],[-40,-10]],
]}};
const projected=projectTourAreas(tiles,net,angles,[synthetic])[0];
assert(new Set(projected.fills.map(f=>f.tile.id)).size>1);
for(let lat=-20.3;lat<54;lat+=5)for(let lon=-65.7;lon<90;lon+=5){
 const [p]=projectTourLocations(tiles,net,angles,[{latitude:lat,longitude:lon}]);
 assert.equal(projectedInside(p,projected),geoInside([lon,lat],synthetic.geometry),`concavity/hole ${lat},${lon}`);
}
assert.equal(tourAreaSets['amazon-mouth'][0].hybasId,6030007000);
assert.equal(tourAreaSets['amazon-mouth'][0].sourceAreaKm2,5912922.8);
console.log(`Tour areas: ${samples} global fill comparisons, holes/cuts, geographic landmarks and data provenance pass.`);
