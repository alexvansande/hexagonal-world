import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {periods} from './dist/history/index.mjs';
import {assembleRoutes} from './dist/history-loader.mjs';
import {projectTourRoutes,routeFragments,routePath,sampleRoute} from './dist/tour-route-renderer.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
// Budgets keep every period cheap on phones: the renderer re-projects on each
// camera change and CSS animates the dots, so sample counts and path counts are
// the real costs. Timing budgets are generous so CI machines do not flake.
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const budgets={routes:150,samples:70000,paths:1600,projectMs:1200,pathMs:250};
let heaviest={samples:0};
for(const info of periods){
 const authored=JSON.parse(await readFile(`dist/history/${info.id}.routes.json`,'utf8')),strands=JSON.parse(await readFile(`dist/history/${info.id}.strands.json`,'utf8')).strands;
 const routes=assembleRoutes(authored,strands);
 const t0=performance.now(),projected=projectTourRoutes(tiles,net,state,routes),projectMs=performance.now()-t0;
 const samples=projected.reduce((sum,r)=>sum+r.anchors.length,0);
 const t1=performance.now();let paths=0;
 for(const route of projected)for(const anchors of route.strandAnchors){const fragments=routeFragments(anchors,world,route.lane);paths+=fragments.length*4;routePath(anchors,world,route.lane);for(const f of fragments)assert(!/NaN/.test(f.d),'no bridged cut or NaN in '+route.id);}
 const pathMs=performance.now()-t1;
 assert(routes.length<=budgets.routes,`${info.id}: ${routes.length} routes exceed ${budgets.routes}`);
 assert(samples<=budgets.samples,`${info.id}: ${samples} samples exceed ${budgets.samples}`);
 assert(paths<=budgets.paths,`${info.id}: ${paths} SVG paths exceed ${budgets.paths}`);
 assert(projectMs<budgets.projectMs,`${info.id}: projection took ${projectMs.toFixed(0)} ms`);
 assert(pathMs<budgets.pathMs,`${info.id}: path building took ${pathMs.toFixed(0)} ms`);
 if(samples>heaviest.samples)heaviest={id:info.id,samples,paths,projectMs};
 // Sampling never over-resolves short legs: step 0.18° keeps a sample every few pixels at tour zoom.
 for(const route of routes)assert(sampleRoute(route).length<=Math.ceil(route.coordinates.length*1+route.coordinates.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-route.coordinates[i-1][0],((p[1]-route.coordinates[i-1][1]+540)%360)-180)/.18:0,0))+1);
 // A period is a handful of small fetches, never more than a couple of map tiles.
 for(const [suffix,limit] of [['.md',24000],['.routes.json',80000],['.strands.json',260000]]){const {size}=await stat(`dist/history/${info.id}${suffix}`);assert(size<limit,`${info.id}${suffix} is ${size} bytes`);}
}
for(const name of ['history-loader.mjs','history/index.mjs','history/waves.json','tour-trade-traffic.mjs']){const {size}=await stat('dist/'+name);assert(size<12000,`${name} is ${size} bytes`);}
const app=await readFile('dist/app.mjs','utf8');assert(!/\.routes\.json|\.strands\.json/.test(app),'startup never pays for period data');
console.log(`History performance: every period within budget (heaviest ${heaviest.id}: ${heaviest.samples} samples, ${heaviest.paths} paths, ${heaviest.projectMs.toFixed(0)} ms), small files and no eager data pass.`);
