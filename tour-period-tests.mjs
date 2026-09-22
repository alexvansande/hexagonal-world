import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {tradePeriods,tradePeriod} from './dist/tour-trade-periods.mjs';
import {parseTourContent} from './dist/tour-content.mjs';
import {projectTourRoutes,routePath,sampleRoute,routeStrands} from './dist/tour-route-renderer.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
const stories=parseTourContent(await readFile('dist/tour-stories.md','utf8'));
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
assert.deepEqual(tradePeriods.map(p=>p.year),[-1300,150,900,1300]);
assert.equal(tradePeriod('unrecognized').id,'antiquity');
const has=(period,point)=>period.routes.some(r=>r.coordinates.some(p=>p.join()===point.join()));
for(const period of tradePeriods){
 assert.equal(new Set(period.routes.map(r=>r.id)).size,period.routes.length);
 assert.equal(stories[period.storyId].legend.length,period.waves.length);
 assert.deepEqual([...new Set(period.routes.map(r=>r.wave))].sort(),[...period.waves].sort());
 for(const r of period.routes){assert(r.animated);assert(r.coordinates.length>=2);for(const [lat,lon] of r.coordinates)assert(Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lon)&&Math.abs(lon)<=180);}
 for(const route of projectTourRoutes(tiles,net,state,period.routes))routeStrands(route).forEach((strand,s)=>{
  const anchors=route.strandAnchors[s];assert.equal(anchors.length,sampleRoute(strand).length);
  const d=routePath(anchors,world,route.lane);assert(!/NaN|Infinity/.test(d));
  const commands=d.match(/[ML]/g);for(let i=1;i<commands.length;i++)if(anchors[i-1].tile!==anchors[i].tile)assert.equal(commands[i],'M','Period routes must never bridge a map cut');
 });
}
const [bronze,ancient,early,high]=tradePeriods;
assert(!bronze.routes.some(r=>r.wave==='silk'));
assert(bronze.routes.filter(r=>r.wave==='tin').every(r=>r.uncertain));
assert(has(bronze,[35.13,33.94])&&has(bronze,[50.2,-5.2]),'Cypriot copper and southwest British tin');
const eastern=['central-asia','hindukush','iran','mesopotamia','eastern-mediterranean'].map(id=>bronze.routes.find(r=>r.id==='bronze-tin-'+id));
assert(eastern.every(r=>r?.uncertain&&r.wave==='tin'&&r.animated),'Eastern supply stays explicitly uncertain and uses the tin flow');
for(const [from,to] of [[0,2],[1,2],[2,3],[3,4]])assert.deepEqual(eastern[from].coordinates.at(-1),eastern[to].coordinates[0],'Tin flows continuously westward through each junction');
assert.deepEqual(eastern[4].coordinates.at(-1),[35.3,25.2],'Eastern tin reaches the Mediterranean network');
assert([ancient,early,high].every(p=>!p.routes.some(r=>eastern.some(e=>e.id===r.id))),'Proposed Bronze Age routes stay in their period');
assert(!has(ancient,[33.31,44.37])&&has(ancient,[33.09,44.58]),'Ctesiphon before Baghdad');
assert(!ancient.routes.some(r=>r.id.includes('byzantium')||r.id.endsWith('china-canal')),'No later capital/canal in antiquity');
assert(has(early,[33.31,44.37])&&has(early,[54.97,49.05])&&has(early,[50.45,30.52]),'Baghdad, Bolgar and Kyiv join medieval network');
assert(has(high,[47.2,47.4])&&has(high,[24.87,118.67])&&has(high,[45.44,12.34]),'Golden Horde, Quanzhou and Venice');
assert(!high.routes.some(r=>r.id.startsWith('trade-gold-silver-europe-')),'No inherited Roman European network in 1300');
// Follow static import/re-export edges from the real app: a lazy loader must not
// accidentally re-export a large dataset through a seemingly small renderer.
const seen=new Set();
async function walk(file){
 file=resolve(file);if(seen.has(file))return;seen.add(file);
 const source=await readFile(file,'utf8');
 for(const match of source.matchAll(/(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"](\.\/[^'"]+)['"]/g)){
  await walk(resolve(dirname(file),match[1].split('?')[0]));
 }
}
await walk('dist/app.mjs');
for(const name of ['tour-trade-periods.mjs','tour-trade.mjs','tour-trade-regions.mjs','tour-route-data.mjs','tour-area-data.mjs','tour-migrations.mjs','tour-vinland.mjs','tour-polynesia.mjs','tour-americas.mjs','tour-africa.mjs','tour-oceans.mjs','tour-periods.mjs','tour-trade-traffic.mjs','tour-silk-road-relaxed.mjs','tour-origin-of-mankind-relaxed.mjs','tour-iceland-to-vinland-relaxed.mjs','tour-french-polynesia-relaxed.mjs','tour-americas-exchange-relaxed.mjs'])assert(!seen.has(resolve('dist',name)),name+' must not be eagerly imported');
const app=await readFile('dist/app.mjs','utf8');assert(!app.includes('tourStory.ready.then'), 'Story text must not be prefetched at startup');
console.log('Trade periods: dated hubs, legends, route seams and no eager story datasets pass.');
