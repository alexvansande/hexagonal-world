import assert from 'node:assert/strict';
import {silkRoadRoutes,silkRoadTradeRoutes,sampleRoute,projectTourRoutes,routePath} from './dist/tour-routes.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {sphereAt,geographicPoint} from './dist/globe-drag.mjs';
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const routes=projectTourRoutes(tiles,net,state,[...silkRoadRoutes,...silkRoadTradeRoutes]);
assert.equal(new Set(routes.map(r=>r.id)).size,routes.length);
for(const route of routes){
 assert.equal(route.anchors.length,sampleRoute(route).length,'No missing route samples');
 for(const {location,local,tile} of route.anchors){
  const p=geographicPoint(state,sphereAt(world(local,tile),tile,tiles[tile.id]));
  assert(Math.abs(Math.asin(p[2])*180/Math.PI-location.latitude)<1e-6);
  assert(Math.abs(Math.atan2(p[1],p[0])*180/Math.PI-location.longitude)<1e-6);
 }
 const commands=routePath(route.anchors,world).match(/[ML]/g);
 for(let i=1;i<commands.length;i++)if(route.anchors[i-1].tile!==route.anchors[i].tile)assert.equal(commands[i],'M','Never draw across a net cut');
}
// All branches form one connected geographic network, including the selected gate.
const key=p=>p.join(','),connected=new Set(silkRoadRoutes[0].coordinates.map(key));
let changed=true;while(changed){changed=false;for(const r of silkRoadRoutes)if(r.coordinates.some(p=>connected.has(key(p))))for(const p of r.coordinates)if(!connected.has(key(p))){connected.add(key(p));changed=true;}}
assert(silkRoadRoutes.every(r=>r.coordinates.every(p=>connected.has(key(p)))));
assert(connected.has('45.4,82.4'));
const trade=id=>silkRoadTradeRoutes.find(route=>route.id===id);
assert(silkRoadTradeRoutes.every(route=>route.animated));
assert.equal(new Set(silkRoadTradeRoutes.map(route=>route.wave)).size,5);
for(const region of ['china','india','europe','byzantium'])assert(silkRoadTradeRoutes.filter(route=>route.region===region).length>=5,region+' has a regional network');
// Every commodity's new internal routes must connect to its international flow,
// even when direction reverses. Avoid attractive but disconnected extra lines.
for(const wave of new Set(silkRoadTradeRoutes.map(route=>route.wave))){
 const network=silkRoadTradeRoutes.filter(route=>route.wave===wave),reached=new Set(network[0].coordinates.map(key));
 let added=true;while(added){added=false;for(const route of network)if(route.coordinates.some(p=>reached.has(key(p))))for(const p of route.coordinates)if(!reached.has(key(p))){reached.add(key(p));added=true;}}
 assert(network.every(route=>route.coordinates.every(p=>reached.has(key(p)))),wave+' regional branches are connected');
}
const byzantium=silkRoadTradeRoutes.filter(route=>route.coordinates.some(p=>key(p)==='41.01,28.98'));
assert(new Set(byzantium.map(route=>route.title)).size>=3,'Constantinople joins Anatolia, Via Egnatia and Aegean corridors');
assert.deepEqual(trade('trade-silk-rome-levant').coordinates.at(-1),[41.9,12.5],'Silk reaches Rome');
assert.deepEqual(trade('trade-gold-silver-rome-levant').coordinates[0],[41.9,12.5],'Precious metals flow out of Rome');
assert.deepEqual(trade('trade-horses-hexi').coordinates.at(-1),[34.26,108.94],'Horses flow toward China');
assert.deepEqual(trade('trade-spices-cotton-indian-ocean').coordinates[0],[21.7,72.99],'Indian goods flow toward the Red Sea');
// Opposite traffic on one corridor must occupy separate lanes, not coincide
// after reversal. Offsets stay in screen pixels and never join across a cut.
const tile={},other={},anchors=[[0,0],[10,0],[20,0]].map(local=>({local,tile})),point=p=>p;
assert.equal(routePath(anchors,point,4),'M0.00,4.00 L10.00,4.00 L20.00,4.00');
assert.equal(routePath([...anchors].reverse(),point,4),'M20.00,-4.00 L10.00,-4.00 L0.00,-4.00');
assert.equal(routePath([...anchors,{local:[80,0],tile:other},{local:[90,0],tile:other}],point,4),'M0.00,4.00 L10.00,4.00 L20.00,4.00 M80.00,4.00 L90.00,4.00');
assert.equal(trade('trade-silk-hexi').lane,trade('trade-horses-hexi').lane,'Reversed travel places equal signed offsets on opposite sides');
console.log('Silk Road: connected branches, geographic round trips and no lines across map cuts pass.');
