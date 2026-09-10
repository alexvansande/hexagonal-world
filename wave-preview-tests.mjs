import assert from 'node:assert/strict';
import {oceanRows,paintEcology,oceanClass} from './dist/tests/wave-layers.mjs';
import {oceanLegend as oldLegend} from './dist/map-layers.mjs';
import {waveLegendLayout} from './dist/tests/wave-legend.mjs';
const encoded=c=>1+Math.round((c+5)*4);
for(const count of [3,6,10,15]){
 const rows=oceanRows(count);
 assert.equal(rows.reduce((sum,r)=>sum+r.cells.length,0),count);
 assert.deepEqual(rows.map(r=>r.cells.length),rows.map((_,i)=>i+1));
 assert.deepEqual(rows.flatMap(r=>r.cells.map(c=>c.color)).sort(),oldLegend(count).map(c=>c.color).sort(),'Preserve exactly the old swatches');
 const classes=new Set();
 for(let thermal=1;thermal<256;thermal++)for(let band=0;band<5;band++)classes.add(oceanClass(band,thermal,count));
 assert.equal(classes.size,count,'Every legend swatch is reachable');
 assert.equal(new Set(Array.from({length:5},(_,band)=>oceanClass(band,encoded(-2),count))).size,1);
 assert.equal(new Set(Array.from({length:5},(_,band)=>oceanClass(band,encoded(29),count))).size,rows.length);
 const missing=paintEcology(new Uint8ClampedArray([0,255,encoded(29),255,0,255,0,255]),10,count);
 assert.deepEqual([...missing],[153,156,163,255,153,156,163,255],'Unknown waves/temperature stay unknown outside the cold apex');
 assert.equal(oceanClass(255,encoded(-2),count),0,'Known cold temperature does not need wave data');
 for(const other of [3,6,10,15]){
  const layout=waveLegendLayout(count,other),labels=layout.texts.filter(t=>t.x===220);
  assert.equal(labels.length,Math.max(rows.length,oceanRows(other).length));
  assert.equal(layout.hexes.length,count+other);
  assert(layout.texts.some(t=>t.value==='Gentle Seas ↔ Rough Seas'));
 }
}
console.log('Wave preview: shared temperature axis, unchanged palette, increasing exposure resolution and missing-data checks pass.');
const {addLifezonesLegend}=await import('./dist/tests/wave-print-legend.mjs');
const fonts=JSON.parse((await import('node:fs')).readFileSync('./dist/pdf-lettering.json'));
const lettering={measure:(key,s,size)=>[...s].reduce((n,c)=>n+fonts[key].glyphs[c.charCodeAt(0)].width,0)*size/1000,text:(key,s,size,x,y)=>`${key} ${size} ${x} ${y} (${s}) Tj`};
for(const landCount of [3,6,10,15])for(const oceanCount of [3,6,10,15]){
 const commands=addLifezonesLegend({landCount,oceanCount,lettering,pageWidth:1190,pageHeight:842,ink:'0 0 0'});
 assert(commands.some(s=>s.includes('(Gentle Seas) Tj')));assert(commands.some(s=>s.includes('(Rough Seas) Tj')));
 assert(commands.every(s=>!s.includes('NaN')));
}
console.log('Print legend: all 16 class-count combinations have vector glyphs and finite positions.');
