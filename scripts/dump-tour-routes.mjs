// Write one JSON per tour for scripts/relax-tour-routes.py: unique routes, hard
// stops (endpoints, named places and junctions shared by routes), and per-tour
// relaxation settings. Return routes reuse their forward partner's strands.
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tourChapters} from '../dist/tour-routes.mjs';
import {routeKey} from '../dist/tour-periods.mjs';
import {silkRoadPlaces} from '../dist/tour-route-data.mjs';
import {tradePlaces} from '../dist/tour-trade-periods.mjs';
import {migrationPlaces} from '../dist/tour-migrations.mjs';
import {vikingPlaces} from '../dist/tour-vinland.mjs';
import {polynesiaPlaces} from '../dist/tour-polynesia.mjs';
import {americasPlaces} from '../dist/tour-americas.mjs';
import {africaPlaces} from '../dist/tour-africa.mjs';
import {oceanPlaces} from '../dist/tour-oceans.mjs';
const settings={
 'silk-road':{strands:2,sea:'coastal',noise:.3,places:{...silkRoadPlaces,...tradePlaces}},
 'origin-of-mankind':{strands:3,sea:'coastal',noise:.35,places:migrationPlaces,landBridge:['migration-beringia']},
 'iceland-to-vinland':{strands:3,sea:'coastal',noise:.3,places:vikingPlaces},
 'french-polynesia':{strands:3,sea:'open',noise:.25,places:polynesiaPlaces},
 'americas-exchange':{strands:2,sea:'coastal',noise:.3,places:americasPlaces},
 'african-networks':{strands:2,sea:'coastal',noise:.3,places:africaPlaces},
 'ocean-crossings':{strands:2,sea:'open',noise:.2,places:oceanPlaces},
};
const output=resolve(process.argv[2]||'_relax');await mkdir(output,{recursive:true});
for(const [tour,chapters] of Object.entries(tourChapters)){
 const {places,landBridge=[],...options}=settings[tour],routes=new Map(),seen=new Map();
 for(const period of chapters.periods)for(const route of period.routes){
  const key=routeKey(route);if(routes.has(key))continue;
  const partner=route.returnOf&&period.routes.find(r=>r.id===route.returnOf);
  routes.set(key,{id:key,coordinates:route.coordinates,returnOf:partner?routeKey(partner):null,landBridge:landBridge.includes(route.id)});
 }
 // Junctions: a coordinate used by two different routes (ignoring return pairs) is a hard stop.
 const counts=new Map();
 for(const r of routes.values())if(!r.returnOf)for(const c of new Set(r.coordinates.map(c=>c.join())))counts.set(c,(counts.get(c)||0)+1);
 const junctions=[...counts].filter(([,n])=>n>1).map(([c])=>c.split(',').map(Number));
 const hard=[...Object.values(places).map(c=>[...c]),...junctions];
 const list=[...routes.values()];
 await writeFile(resolve(output,tour+'.json'),JSON.stringify({tour,...options,places:hard,routes:list}));
 console.log(tour,list.length,'routes',hard.length,'hard stops');
}
