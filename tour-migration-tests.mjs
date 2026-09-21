import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrationRoutes,migrationSources} from './dist/tour-migrations.mjs';
import {tourRouteSets,sampleRoute,projectTourRoutes,routePath} from './dist/tour-routes.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {sphereAt,geographicPoint} from './dist/globe-drag.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {tourLocations} from './dist/tour-markers.mjs';
import {parseTourContent} from './dist/tour-content.mjs';
const origin=tourLocations.find(p=>p.id==='origin-of-mankind'),key=p=>p.join(',');
assert.deepEqual(tourRouteSets[origin.id],migrationRoutes);
assert.equal(new Set(migrationRoutes.map(r=>r.id)).size,migrationRoutes.length);
assert.deepEqual([...new Set(migrationRoutes.map(r=>r.wave))],['early','expansion','later']);
const reachable=new Set([key([origin.latitude,origin.longitude])]);
for(let iteration=0;iteration<migrationRoutes.length;iteration++)for(const r of migrationRoutes)if(reachable.has(key(r.coordinates[0])))r.coordinates.forEach(p=>reachable.add(key(p)));
for(const r of migrationRoutes){
 assert(reachable.has(key(r.coordinates[0])),'Every branch flows out from an already reached junction');
 assert(r.animated&&r.period&&r.uncertainty&&r.sources.length);
 assert(r.sources.every(id=>migrationSources[id]?.startsWith('https://')));
 assert(r.coordinates.every(([lat,lon])=>Math.abs(lat)<=90&&Math.abs(lon)<=180));
}
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
for(const route of projectTourRoutes(tiles,net,state,migrationRoutes)){
 assert.equal(route.anchors.length,sampleRoute(route).length,'No missing migration samples');
 const commands=routePath(route.anchors,world).match(/[ML]/g);
 for(let i=0;i<route.anchors.length;i++){
  const {location,local,tile}=route.anchors[i],p=geographicPoint(state,sphereAt(world(local,tile),tile,tiles[tile.id]));
  assert(Math.abs(Math.asin(p[2])*180/Math.PI-location.latitude)<1e-6);
  assert(Math.abs(((Math.atan2(p[1],p[0])*180/Math.PI-location.longitude+540)%360)-180)<1e-6);
  if(i&&route.anchors[i-1].tile!==tile)assert.equal(commands[i],'M','No strokes jump across separated hexagons');
 }
}
const bering=sampleRoute(migrationRoutes.find(r=>r.id==='migration-beringia'));
assert(bering.every(p=>Math.abs(p.longitude)>125),'Bering route takes the short date-line crossing');
const content=parseTourContent(readFileSync('dist/tour-stories.md','utf8')),story=content[origin.id];
assert.equal(story.source.url,'./human-migrations-sources.md');assert.equal(content['origin-of-mankind-sapiens-expansion'].legend.length,2);
assert(!story.legend.length,'The overview defers its color key to the chapters');
assert.equal(parseTourContent('## x\n### Test\n\n[bad](javascript:alert(1))').x.source,null,'Local source support must not admit executable URLs');
const css=readFileSync('dist/style.css','utf8');
assert(css.includes('to{stroke-dashoffset:-8.1}'),'Negative offset moves dots toward each branch endpoint');
assert(css.includes('.tour-routes.flow-paused .route-flow path{animation-play-state:paused}'));
assert(css.includes('@media(prefers-reduced-motion:reduce){.tour-routes .route-flow path{animation:none}'));
console.log('Migration routes: outward connected branches, documented evidence, exact geography, date-line and cut handling, motion direction, pause and reduced-motion rules pass.');
