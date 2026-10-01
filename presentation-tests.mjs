import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {openingSlides,historySlides,slideLine} from './dist/presentation.mjs';
import {isPresentationPath,presentationPath} from './dist/presentation-route.mjs';
import {parsePeriod} from './dist/tour-content.mjs';
import {periods} from './dist/history/index.mjs';

// The requested order: the About stages, the map, its legend, then history.
assert.deepEqual(openingSlides.map(s=>s.id),['globe','project','unfold','adapt','rearrange','island','recentre','lifezones','oceans','history']);
assert.deepEqual(openingSlides.filter(s=>s.stage!==undefined).map(s=>s.stage),[0,1,2,3,4],'The five About stages, Sphere to Rearrange');
assert.deepEqual(openingSlides.map(s=>s.legend||'hidden'),['hidden','hidden','hidden','hidden','hidden','hidden','hidden','land','both','corner']);
assert.equal(openingSlides.filter(s=>s.pan).length,1);
assert(isPresentationPath(presentationPath)&&isPresentationPath('/lifezone-presentation')&&!isPresentationPath('/lifezone-presentation/x/')&&!isPresentationPath('/'));

// Every era in timeline order, each followed by every one of its spots in Markdown order.
const texts=Object.fromEntries(await Promise.all(periods.map(async p=>[p.id,parsePeriod(await readFile(new URL(`./dist/history/${p.id}.md`,import.meta.url),'utf8'))])));
const history=historySlides(texts);
assert.deepEqual(history.filter(s=>!s.spot).map(s=>s.period),periods.map(p=>p.id));
for(const p of periods){
 const era=history.findIndex(s=>s.period===p.id&&!s.spot);
 assert.deepEqual(history.slice(era+1,era+1+Object.keys(texts[p.id].spots).length).map(s=>s.spot),Object.keys(texts[p.id].spots),`${p.id}: spots follow their era in order`);
 assert.equal(history[era].title,p.label);
}
assert.equal(new Set(history.map(s=>s.id)).size,history.length);
// At most two lines: whole sentences when they fit, a clause and an ellipsis when not.
for(const s of history){assert(s.text.length>0&&s.text.length<=151,`${s.id}: ${s.text.length} characters`);assert(!/[*[\]]/.test(s.text),`${s.id}: Markdown removed`);}
assert.equal(slideLine('Short. Second sentence.'),'Short. Second sentence.');
assert.equal(slideLine('About c. 1400 people lived here.'),'About c. 1400 people lived here.');
const cut=slideLine('A very long opening clause that keeps going for a while, then another clause that also keeps going well past where two presentation lines would end, and more.');
assert(cut.endsWith('…')&&cut.length<=151&&!cut.includes(', …'));
assert.equal(slideLine('People crossed from Wallacea to New Guinea more than 50,000 years ago and were living in the Bismarck Archipelago by about 40,000 years ago and on Buka by 30,000.'),'People crossed from Wallacea to New Guinea more than 50,000 years ago and were living in the Bismarck Archipelago by about 40,000 years ago…');
for(const s of history)assert(!/\b(?:and|or|on|in|of|the|to|by)…$/.test(s.text),`${s.id}: ends on a connective`);
// Spot legends keep their wave for the colour key.
assert(history.some(s=>s.key?.some(k=>k.wave&&k.label)));
console.log(`Presentation: ${openingSlides.length} opening slides, ${history.length} history slides over ${periods.length} eras, two-line texts and the /lifezone-presentation/ route pass.`);
