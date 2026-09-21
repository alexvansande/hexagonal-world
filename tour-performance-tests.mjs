import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {tourChapters,sampleRoute,projectTourRoutes,routePath} from './dist/tour-routes.mjs';
import {routeFragments} from './dist/tour-route-renderer.mjs';
import {pacificTourNet} from './dist/tour-layout.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
// Budgets keep every chapter cheap on phones: the renderer re-projects on each
// camera change and CSS animates the dots, so sample counts and path counts are
// the real costs. Timing budgets are generous so CI machines do not flake.
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net,pacific=pacificTourNet(tiles,net);
const budgets={routes:70,samples:24000,paths:420,projectMs:700,pathMs:120};
let heaviest={samples:0};
for(const [id,chapters] of Object.entries(tourChapters)){
 const layout=id==='french-polynesia'?pacific:net;
 for(const period of chapters.periods){
  const t0=performance.now(),projected=projectTourRoutes(tiles,layout,state,period.routes),projectMs=performance.now()-t0;
  const samples=projected.reduce((sum,r)=>sum+r.anchors.length,0);
  const t1=performance.now();let paths=0;
  for(const route of projected)for(const anchors of route.strandAnchors){const fragments=routeFragments(anchors,world,route.lane);paths+=fragments.length*2;routePath(anchors,world,route.lane);}
  const pathMs=performance.now()-t1;
  assert(period.routes.length<=budgets.routes,`${period.storyId}: ${period.routes.length} routes exceed ${budgets.routes}`);
  assert(samples<=budgets.samples,`${period.storyId}: ${samples} samples exceed ${budgets.samples}`);
  assert(paths<=budgets.paths,`${period.storyId}: ${paths} SVG paths exceed ${budgets.paths}`);
  assert(projectMs<budgets.projectMs,`${period.storyId}: projection took ${projectMs.toFixed(0)} ms`);
  assert(pathMs<budgets.pathMs,`${period.storyId}: path building took ${pathMs.toFixed(0)} ms`);
  if(samples>heaviest.samples)heaviest={id:period.storyId,samples,paths,projectMs};
  // Sampling never over-resolves short legs: step 0.18° keeps a sample every few pixels at tour zoom.
  for(const route of period.routes)assert(sampleRoute(route).length<=Math.ceil(route.coordinates.length*1+route.coordinates.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-route.coordinates[i-1][0],((p[1]-route.coordinates[i-1][1]+540)%360)-180)/.18:0,0))+1);
 }
}
// Lazily loaded data modules stay small: a chapter must not cost more than a map tile.
for(const name of ['tour-migrations.mjs','tour-vinland.mjs','tour-polynesia.mjs','tour-americas.mjs','tour-trade-periods.mjs','tour-periods.mjs','tour-trade-traffic.mjs']){
 const {size}=await stat('dist/'+name);assert(size<40000,`${name} is ${size} bytes`);
}
for(const name of ['silk-road','origin-of-mankind','iceland-to-vinland','french-polynesia','americas-exchange']){
 const {size}=await stat(`dist/tour-${name}-relaxed.mjs`);assert(size<130000,`${name} strands are ${size} bytes`);
}
const stories=await stat('dist/tour-stories.md');assert(stories.size<80000,'Story Markdown stays a single small fetch');
// Startup never pays for chapters: the eager import graph excludes every data module (also asserted in tour-period-tests).
const app=await readFile('dist/app.mjs','utf8');assert(!/from '\.\/tour-(migrations|vinland|polynesia|americas|trade-periods)\.mjs/.test(app));
console.log(`Chapter performance: every chapter within budget (heaviest ${heaviest.id}: ${heaviest.samples} samples, ${heaviest.paths} paths, ${heaviest.projectMs.toFixed(0)} ms), small lazy modules and no eager data pass.`);
