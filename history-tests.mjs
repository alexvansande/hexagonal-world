import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {periods,period,defaultPeriod} from './dist/history/index.mjs';
import {parsePeriod} from './dist/tour-content.mjs';
import {assembleRoutes,reverseRoute} from './dist/history-loader.mjs';
import {tourLocations} from './dist/tour-markers.mjs';
import {historyPath,readHistoryPath,historyPages,readHashShare} from './dist/history-routes.mjs';
// The history folder is the source of truth: one Markdown per period (texts,
// spots, views), authored routes as JSON, generated strands as a sidecar, and
// one colour per wave shared by every period.
const fnv=text=>{let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h.toString(16);};
const waves=JSON.parse(await readFile('dist/history/waves.json','utf8')),relax=JSON.parse(await readFile('dist/history/relax.json','utf8'));
const storyIds=new Set(tourLocations.map(l=>l.id));
assert.equal(periods.length,9);assert.equal(new Set(periods.map(p=>p.id)).size,9);
for(let i=1;i<periods.length;i++)assert(periods[i].year>periods[i-1].year,'periods are ordered in time');
assert.deepEqual(periods.map(p=>p.tick),['2M ya','50k ya','10k ya','3k ya','200 CE','1000 CE','1400 CE','1600 CE','1800 CE'],'approximate dates tick the scrubber');
assert.equal(period('nonsense').id,defaultPeriod);assert.equal(period('1000-ce').label,'Middle Ages');
assert(Object.isFrozen(periods)&&periods.every(p=>Object.isFrozen(p)&&p.stories.length>=0));
for(const [id,w] of Object.entries(waves))assert(/^#[0-9a-f]{6}$/.test(w.color)&&w.label,`wave ${id} has a colour and a label`);
const files=(await readdir('dist/history')).filter(f=>f.endsWith('.md')).sort();
assert.deepEqual(files,periods.map(p=>p.id+'.md').sort(),'exactly one Markdown per period');
const used=new Set();let detail=0,total=0,spots=0,labelsTotal=0;
for(const info of periods){
 const text=parsePeriod(await readFile(`dist/history/${info.id}.md`,'utf8'));
 assert.equal(text.title,`${info.label} · ${info.date}`,`${info.id}: heading names the age and its date`);
 assert(text.intro.paragraphs.length>=1,`${info.id}: intro paragraph`);
 const routesFile=await readFile(`dist/history/${info.id}.routes.json`,'utf8'),authored=JSON.parse(routesFile);
 const sidecar=JSON.parse(await readFile(`dist/history/${info.id}.strands.json`,'utf8'));
 assert(sidecar.generated===true);
 assert.equal(sidecar.routesHash,fnv(routesFile),`${info.id}: strands sidecar is stale; run scripts/relax-tour-routes.py ${info.id}`);
 assert.deepEqual(Object.keys(text.spots).sort(),[...info.stories].sort(),`${info.id}: the index lists every spot of the period`);
 for(const story of new Set(authored.map(r=>r.story)))assert(text.spots[story],`${info.id}: routes of ${story} need a spot`);
 for(const spot of Object.values(text.spots)){
  spots++;assert(/^[a-z][a-z0-9-]*$/.test(spot.id),`${info.id}: spot id ${spot.id}`);
  if(!authored.some(r=>r.story===spot.id))assert(spot.view!=='fit',`${info.id}/${spot.id}: a spot without routes needs a view box`);
  assert(spot.spot&&Math.abs(spot.spot[0])<=90&&Math.abs(spot.spot[1])<=180,`${info.id}/${spot.id}: spot position`);
  assert(spot.view==='fit'||/^-?[\d.]+\s*,\s*-?[\d.]+\s*(→|->)\s*-?[\d.]+\s*,\s*-?[\d.]+$/.test(spot.view),`${info.id}/${spot.id}: view is fit or a box`);
  assert(spot.title&&spot.paragraphs.length,`${info.id}/${spot.id}: title and text`);
  assert.equal(spot.legend.length,spot.waves.length,`${info.id}/${spot.id}: legend lines name their wave`);
  assert(spot.labels.length<=6,`${info.id}/${spot.id}: labels are used sparingly`);labelsTotal+=spot.labels.length;
  for(const l of spot.labels)assert(['site','area'].includes(l.kind)&&l.text&&Math.abs(l.latitude)<=90&&Math.abs(l.longitude)<=180&&(l.kind==='site'||l.text===l.text.replace(/\b[a-z]/g,c=>c.toUpperCase())||/\b(of|the|and|aux|de|la)\b/.test(l.text)),`${info.id}/${spot.id}: label ${l.text}`);
  for(const w of spot.waves)assert(waves[w],`${info.id}/${spot.id}: unknown wave ${w}`);
  for(const w of new Set(authored.filter(r=>r.story===spot.id).map(r=>r.wave)))assert(spot.waves.includes(w),`${info.id}/${spot.id}: legend misses drawn wave ${w}`);
  if(spot.source&&!spot.source.url.startsWith('https://'))await stat('dist/'+spot.source.url.slice(2));
 }
 const ids=new Set();
 for(const r of authored){
  assert(!ids.has(r.id),`${info.id}: duplicate route ${r.id}`);ids.add(r.id);total++;
  assert(text.spots[r.story]&&waves[r.wave]&&typeof r.title==='string',`${info.id}/${r.id}: story, wave and title`);used.add(r.wave);
  assert(Array.isArray(r.coordinates)&&r.coordinates.length>=2&&r.coordinates.every(c=>c.length===2&&Math.abs(c[0])<=90&&Math.abs(c[1])<=180),`${info.id}/${r.id}: coordinates`);
  assert(r.zoom===undefined||(r.zoom>=0&&r.zoom<=8),`${info.id}/${r.id}: detail zoom`);if(r.zoom)detail++;
  assert(r.frequency===undefined||r.frequency>0);assert(r.lane===undefined||Number.isInteger(r.lane));
  const strands=sidecar.strands[r.id];assert(strands&&strands.length>=1,`${info.id}: no strands for ${r.id}`);
  for(const s of strands){assert(s.length>=2);assert.deepEqual(s[0],r.coordinates[0],`${r.id}: strand starts at the first stop`);assert.deepEqual(s.at(-1),r.coordinates.at(-1),`${r.id}: strand ends at the last stop`);}
  if(relax.landBridge.includes(r.id))assert(r.story==='origin-of-mankind');
  if(typeof relax.places[r.story]==='string')assert(relax.places[relax.places[r.story]],`${r.story} places alias resolves`);
 }
 const routes=assembleRoutes(authored,sidecar.strands);
 assert.equal(routes.length,authored.length+authored.filter(r=>r.twoWay).length,`${info.id}: two-way routes gain a reversed partner`);
 for(const r of routes){
  const source=authored.find(a=>a.id===(r.returnOf||r.id));
  assert(Object.isFrozen(r)&&r.animated&&Array.isArray(r.traffic)&&r.traffic.length===r.strands.length,`${r.id}: one sparse timing per strand`);
  assert.equal(r.zoom,source.zoom||0);assert.equal(r.lane,source.lane||0);
  if(r.returnOf){const f=routes.find(x=>x.id===r.returnOf);assert.deepEqual(r.coordinates,[...f.coordinates].reverse());assert.deepEqual(r.strands[0],[...f.strands[0]].reverse());}
 }
}
assert.deepEqual([...used].sort(),Object.keys(waves).sort(),'every wave colour is used and every used wave has a colour');
assert(detail>0,'some routes are detail routes that appear only when zoomed in');
assert(labelsTotal>60,'spots carry site and area labels');
for(const story of storyIds)assert(relax.places[story]&&Object.keys(relax.places[story]).length>0,`relax.json names hard stops for ${story}`);
assert.equal(reverseRoute({id:'a',coordinates:[[0,0],[1,1]]}).id,'a-return');
// Every age and pane has its own address; style and layout ride in the hash.
assert.equal(historyPath('1000-ce'),'/history/1000-ce/');assert.equal(historyPath('1000-ce','silk-road'),'/history/1000-ce/silk-road/');
assert.deepEqual(readHistoryPath('/history/1000-ce/silk-road/'),{period:'1000-ce',spot:'silk-road'});
assert.deepEqual(readHistoryPath('/history/middle-ages'),{period:'1000-ce',spot:null},'old stop names resolve');
assert.deepEqual(readHistoryPath('/history/1000-ce/nonsense/'),{period:'1000-ce',spot:null},'an unknown pane falls back to the age');
assert.equal(readHistoryPath('/history/never/'),null);assert.equal(readHistoryPath('/silk-road/'),null);
assert.equal(historyPages.length,periods.length+spots,'one page per age plus one per pane');
assert.equal(new Set(historyPages.map(p=>p.path)).size,historyPages.length);
assert.equal(readHashShare('#m=abc&s=lifezones/spaceship-earth'),'/lifezones/spaceship-earth/');assert.equal(readHashShare('#m=abc'),null);
// Startup never pays for history: the app imports the loader, not the data.
const app=await readFile('dist/app.mjs','utf8');
assert(app.includes("from './history-loader.mjs")&&!/\.routes\.json|\.strands\.json|tour-stories\.md/.test(app));
for(const name of ['tour-data','tour-timeline','tour-routes','tour-periods','tour-migrations','tour-vinland'])assert(!app.includes(`./${name}.mjs`),`app no longer imports ${name}`);
console.log(`History folder: ${periods.length} periods, ${spots} spots, ${total} authored routes (${detail} detail), fresh strands, ${labelsTotal} labels, ${Object.keys(waves).length} shared wave colours pass.`);
