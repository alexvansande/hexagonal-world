import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tourChapters,sampleRoute,projectTourRoutes,routePath} from './dist/tour-routes.mjs';
import {routeStrands} from './dist/tour-route-renderer.mjs';
import {tourLocations} from './dist/tour-markers.mjs';
import {loadTourData} from './dist/tour-data.mjs';
import {definePeriods,bothWays,reverseRoute} from './dist/tour-periods.mjs';
import {parseTourContent} from './dist/tour-content.mjs';
import {pacificTourNet} from './dist/tour-layout.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
const stories=parseTourContent(await readFile('dist/tour-stories.md','utf8'));
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net,pacific=pacificTourNet(tiles,net);
const css=await readFile('dist/style.css','utf8');
// Every entry point is a dated story with a slider, its own heading and Markdown per chapter.
assert.deepEqual(Object.keys(tourChapters).sort(),tourLocations.map(p=>p.id).sort());
for(const [id,chapters] of Object.entries(tourChapters)){
 const data=await loadTourData(id);
 assert.equal(data.heading,chapters.heading);assert.equal(data.periods.length,chapters.periods.length,id+' lazy data matches the chapter index');
 assert(chapters.periods.length>=4&&chapters.periods.length<=5,id+' has four or five chapters');
 assert.equal(data.periodFor('unknown').id,chapters.periodFor('unknown').id,'Unknown periods fall back to the story default');
 assert.notEqual(chapters.heading,'Through time',id+' names its slider');
 assert(stories[id]?.paragraphs.length,id+' keeps an overview section for previews');
 const routeSets=new Set();
 for(const period of chapters.periods){
  assert.equal(period.storyId,`${id}-${period.id}`);assert.match(period.date,/(BCE|CE|years ago)/);
  const story=stories[period.storyId];assert(story?.paragraphs.length&&story.note&&story.source,period.storyId+' has prose, a caveat and a source link');
  assert.equal(story.legend.length,period.waves.length,period.storyId+' legend matches its waves');
  assert.deepEqual([...new Set(period.routes.map(r=>r.wave))].sort(),[...period.waves].sort(),period.storyId+' waves are all drawn');
  for(const wave of period.waves)assert(css.includes(`[data-wave="${wave}"]`),wave+' has a color');
  assert.equal(new Set(period.routes.map(r=>r.id)).size,period.routes.length,period.storyId+' unique route IDs');
  routeSets.add(period.routes.map(r=>r.id).sort().join());
  for(const r of period.routes){
   assert(r.animated&&[r.traffic].flat().every(t=>t&&t.speed===13),r.id+' uses sparse traffic at the shared speed');
   assert(r.coordinates.length>=2&&r.coordinates.every(([lat,lon])=>Number.isFinite(lat)&&Math.abs(lat)<=90&&Number.isFinite(lon)&&Math.abs(lon)<=180));
   // Two-way traffic: a reversed partner in the same chapter, same signed lane, opposite order.
   if(r.returnOf){const forward=period.routes.find(f=>f.id===r.returnOf);assert(forward,r.id+' partner present');assert.equal(forward.lane,r.lane);assert.deepEqual([...forward.coordinates].reverse(),r.coordinates);assert.equal(forward.wave,r.wave);assert.equal(!!forward.uncertain,!!r.uncertain);}
  }
  // Every chapter fits the map: all samples land on the net used for that story, and no stroke bridges a cut.
  const layout=id==='french-polynesia'?pacific:net;
  for(const route of projectTourRoutes(tiles,layout,state,period.routes))routeStrands(route).forEach((strand,s)=>{
   const anchors=route.strandAnchors[s];
   assert.equal(anchors.length,sampleRoute(strand).length,route.id+' has no missing samples');
   const d=routePath(anchors,world,route.lane);assert(!/NaN|Infinity/.test(d));
   const commands=d.match(/[ML]/g);for(let i=1;i<commands.length;i++)if(anchors[i-1].tile!==anchors[i].tile)assert.equal(commands[i],'M',route.id+' must not bridge a map cut');
  });
 }
 assert.equal(routeSets.size,chapters.periods.length,id+' chapters draw genuinely different networks');
}
// Helper semantics.
const sample=definePeriods('demo',[{id:'a',label:'A',date:'c. 1 CE',routes:bothWays([{id:'x',wave:'w',coordinates:[[0,0],[1,1]],lane:3}])}],'a',{heading:'Demo'});
assert.equal(sample.periods[0].storyId,'demo-a');assert.deepEqual(sample.periods[0].waves,['w']);assert.equal(sample.periodFor('zzz').id,'a');
assert.equal(reverseRoute({id:'x',coordinates:[[0,0],[1,1]]}).id,'x-return');
assert.notEqual(sample.periods[0].routes[0].traffic.phase,sample.periods[0].routes[1].traffic.phase,'Return traffic has its own seed');
// Human migrations: species chapters are distinct and admixture is drawn as two-way contact, never as ancestry arrows.
const migration=tourChapters['origin-of-mankind'],find=(period,prefix)=>period.routes.filter(r=>r.id.startsWith('migration-'+prefix));
const [hominins,archaic,sapiens,later]=migration.periods;
assert.deepEqual(migration.periods.map(p=>p.id),['early-hominins','archaic-eurasia','sapiens-expansion','later-movements']);
assert.equal(migration.defaultId,'sapiens-expansion');
assert(find(hominins,'erectus').length>=4&&hominins.routes.every(r=>r.uncertain),'Early hominin dispersals are all schematic and uncertain');
assert(hominins.routes.every(r=>!r.returnOf),'Early hominin chapter is expansion only: no return lanes');
assert(find(archaic,'neanderthal').every(r=>r.uncertain)&&find(archaic,'neanderthal').some(r=>r.returnOf),'Neanderthal ranges are two-way links');
assert(find(archaic,'denisovan').length>=2&&find(archaic,'sapiens-africa').length>=2&&find(archaic,'early').length===2,'Chapter 2 pairs archaic ranges with the first sapiens departures');
assert(find(sapiens,'admixture').every(r=>r.returnOf||sapiens.routes.some(o=>o.returnOf===r.id)),'Admixture zones are bidirectional');
assert(!find(sapiens,'neanderthal').length&&!find(later,'neanderthal').length,'No Neanderthal line continues into the sapiens chapters as an ancestor route');
assert(find(later,'holocene').length>=5&&find(later,'beringia').length===1,'Later movements combine Ice Age Americas with Holocene dispersals');
assert.match(stories['origin-of-mankind-archaic-eurasia'].note,/not from descent/,'Story text rules out reading Neanderthals as a direct ancestor of everyone');
// Vikings: four chapters of the wider expansion, then the Iceland–Greenland–Vinland story on its own.
const norse=tourChapters['iceland-to-vinland'];
assert.deepEqual(norse.periods.map(p=>p.id),['first-raids','rus-and-danelaw','settlements','kings','north-atlantic']);
assert.equal(norse.defaultId,'north-atlantic');
const last=norse.periods[4];
assert(last.routes.some(r=>r.id==='norse-vinland'&&r.uncertain)&&last.routes.some(r=>r.id==='norse-vinland-return'),'Vinland voyages go out and back, and stay uncertain');
assert(last.routes.some(r=>r.id==='norse-nordrsetur')&&last.routes.some(r=>r.id==='norse-thule'&&r.uncertain)&&last.routes.some(r=>r.id==='norse-gaelic'),'Final chapter carries the whole North Atlantic story');
assert(last.routes.every(r=>r.wave!=='raids'),'The final chapter is not a raiding map');
assert(norse.periods[0].routes.some(r=>r.id==='viking-lindisfarne'&&r.wave==='raids')&&!norse.periods[0].routes.some(r=>r.id.includes('iceland')),'First raids predate Iceland');
assert(norse.periods[1].routes.some(r=>r.id==='viking-dnieper')&&norse.periods[1].routes.some(r=>r.id==='viking-volga-return'),'Rus river trade runs both ways');
assert(norse.periods[3].routes.some(r=>r.id==='viking-normans'&&r.uncertain)&&norse.periods[3].routes.some(r=>r.id==='viking-vinland'),'Kings chapter marks the Norman crossing as a caveat and includes Vinland');
assert(norse.periods.slice(0,4).every(p=>p.routes.some(r=>r.wave==='raids')),'Each expansion chapter has raids or conquest');
// Polynesia: settlement is one-way, voyaging two-way and denser, South America uncertain and sparse.
const poly=tourChapters['french-polynesia'];
assert.deepEqual(poly.periods.map(p=>p.id),['near-oceania','lapita','east-polynesia','far-corners','south-america']);
assert(poly.periods[0].routes.some(r=>r.id==='polynesia-near-bismarck')&&poly.periods[0].routes.some(r=>r.id==='polynesia-near-obsidian-return'),'Near Oceania predates Lapita with Pleistocene crossings and obsidian exchange');
assert(poly.periods[1].routes.some(r=>r.id==='polynesia-austronesian-marianas'&&r.uncertain),'Marianas settlement joins the Austronesian chapter as a fainter line');
assert(poly.periods.every(p=>p.routes.filter(r=>r.wave==='settlement').every(r=>!r.returnOf&&!p.routes.some(o=>o.returnOf===r.id))),'Settlement crossings are one-way');
assert(poly.periods.every(p=>p.routes.filter(r=>r.wave==='voyaging').every(r=>r.frequency===1.5&&(r.returnOf||p.routes.some(o=>o.returnOf===r.id)))),'Voyaging is two-way and busier');
const contact=poly.periods[4].routes.filter(r=>r.wave==='contact');
assert(contact.length===4&&contact.every(r=>r.uncertain&&r.frequency===.5),'South American contact is two-way, uncertain and sparse');
assert(contact.some(r=>r.coordinates.some(([lat,lon])=>lon>-82&&lon<-69)),'Contact lines reach the South American coast');
const corners=poly.periods[3].routes;for(const point of [[19.5,-155.5],[-27.12,-109.35],[-35.5,174]])assert(corners.some(r=>r.coordinates.some(p=>p.join()===point.join())),'Far corners reach Hawaiʻi, Rapa Nui and Aotearoa');
for(const route of projectTourRoutes(tiles,pacific,state,contact))for(const anchors of route.strandAnchors){
 for(let i=1;i<anchors.length;i++){const a=anchors[i-1],b=anchors[i],p=world(a.local,a.tile),q=world(b.local,b.tile);assert(Math.hypot(p[0]-q[0],p[1]-q[1])<.05,'Contact arcs stay continuous on the Pacific arrangement');}
}
// Americas: four periods, evidence-based defaults, hypotheses marked uncertain, turquoise omitted.
const americas=tourChapters['americas-exchange'];
assert.deepEqual(americas.periods.map(p=>p.id),['early-exchange','classic','andean-networks','late-precolumbian']);
assert.equal(americas.defaultId,'late-precolumbian');
const ids=period=>period.routes.map(r=>r.id);
for(const [index,expected] of [['americas-early-spondylus',0],['americas-classic-obsidian-hopewell',1],['americas-classic-saladoid',1],['americas-andean-macaws',2],['americas-late-inca-north',3],['americas-late-guanin',3]].map(([id,i])=>[i,id]))assert(ids(americas.periods[index]).includes(expected),expected);
assert(['americas-andean-macaws','americas-andean-cacao-chaco','americas-andean-metallurgy','americas-early-cacao','americas-late-guanin'].every(id=>americas.periods.some(p=>p.routes.find(r=>r.id===id)?.uncertain)),'Hypotheses are drawn as uncertain');
assert(!americas.periods.some(p=>p.routes.some(r=>/turquoise/.test(r.id))),'Contested turquoise sourcing is not drawn');
assert(americas.periods.some(p=>p.routes.some(r=>r.coordinates.some(([lat])=>lat>35)))&&americas.periods.every(p=>p.routes.some(r=>r.coordinates.some(([lat])=>lat<-5))),'Networks span North America to the Andes');
assert(americas.periods[3].routes.some(r=>r.id==='americas-late-amazon-return'),'Amazon exchange runs both ways');
assert(americas.periods[2].routes.some(r=>r.id==='americas-andean-marajo')&&americas.periods[2].routes.some(r=>r.id==='americas-andean-muiraquita'&&r.uncertain)&&americas.periods[3].routes.some(r=>r.id==='americas-late-tapajos-return'),'Amazonian river pottery and greenstone networks are drawn as uncertain links');
assert(!americas.periods.some(p=>p.routes.some(r=>r.id.includes('marajo')&&r.coordinates.some(([lat,lon])=>lat<-10&&lon<-70))),'No Marajó-to-Inca line is invented');
console.log('Chapters: five dated stories, matching Markdown and colors, two-way pairs, per-chapter fits without bridged cuts, and species/voyage/exchange semantics pass.');
