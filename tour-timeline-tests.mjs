import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {timelineStops,timelineStop,timelineRoutes,timelinePeriod,defaultTimelineStop} from './dist/tour-timeline.mjs';
import {tourChapters} from './dist/tour-routes.mjs';
import {tourLocations} from './dist/tour-markers.mjs';
import {projectTourRoutes} from './dist/tour-route-renderer.mjs';
import {makeGeometry,layouts} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
// The timeline module must stay tiny and import nothing: it loads with the app.
const source=await readFile('dist/tour-timeline.mjs','utf8');assert(!/^import /m.test(source)&&source.length<6000,'timeline data is small and dependency-free');
assert.equal(new Set(timelineStops.map(s=>s.id)).size,timelineStops.length);
for(let i=1;i<timelineStops.length;i++)assert(timelineStops[i].year>timelineStops[i-1].year,'stops are in chronological order');
assert.equal(timelineStop('nope').id,defaultTimelineStop);
// Every chapter of every story lands on exactly one stop; nothing is orphaned or shown twice.
const placements=new Map();
for(const stop of timelineStops)for(const entry of stop.chapters){
 assert(tourLocations.some(t=>t.id===entry.tour),entry.tour+' exists');
 const period=tourChapters[entry.tour].periods.find(p=>p.id===entry.period);assert(period,entry.storyId+' exists');
 if(entry.waves)for(const wave of entry.waves)assert(period.waves.includes(wave),`${entry.storyId} filters a real wave (${wave})`);
 placements.set(entry.storyId,(placements.get(entry.storyId)||0)+1);
 assert(stop.tours.includes(entry.tour));assert.equal(timelinePeriod(stop,entry.tour)?.length>0,true);
}
for(const [tour,chapters] of Object.entries(tourChapters))for(const period of chapters.periods)assert.equal(placements.get(period.storyId),1,`${period.storyId} appears on exactly one stop`);
assert.equal(placements.size,Object.values(tourChapters).reduce((n,c)=>n+c.periods.length,0),'no unknown chapters are listed');
// Route unions are unique, non-empty where chapters exist, and project onto the default net without gaps.
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const data=Object.fromEntries(Object.entries(tourChapters).map(([id,c])=>[id,{periods:c.periods}]));
let busiest={routes:0};
for(const stop of timelineStops){
 const routes=timelineRoutes(stop,data);
 assert.equal(new Set(routes.map(r=>r.id)).size,routes.length,stop.id+' has unique routes');
 if(stop.chapters.length)assert(routes.length>0,stop.id+' draws something');else assert(stop.note,stop.id+' explains why it is empty');
 assert(routes.length<=170,`${stop.id} stays readable (${routes.length} routes)`);
 for(const route of projectTourRoutes(tiles,net,state,routes))assert(route.strandAnchors.every(a=>a.length>1),route.id+' projects');
 if(routes.length>busiest.routes)busiest={id:stop.id,routes:routes.length};
 // Partial data (a story still loading) never throws.
 assert(Array.isArray(timelineRoutes(stop,{})));
}
const trade=timelineRoutes(timelineStops.find(s=>s.id==='high-middle-ages'),data).filter(r=>r.id.startsWith('norse-'));
assert(trade.length&&trade.every(r=>r.wave==='trade'),'the Norse composite chapter contributes only its trade lanes at 1300');
assert.deepEqual(timelineStops.map(s=>s.id),['early-hominins','out-of-africa','ice-age-to-farming','bronze-age','antiquity','middle-ages','high-middle-ages','globalization','plantations-and-empires']);
const app=await readFile('dist/app.mjs','utf8');
assert(app.includes("searchParams.set('history'")&&app.includes("enableHistory(true)"),'history stop persists in the URL and restores on load');
console.log(`Timeline: ${timelineStops.length} stops, every chapter placed once, unique unions (busiest ${busiest.id}: ${busiest.routes} routes), URL state pass.`);
