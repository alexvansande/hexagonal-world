import {readFileSync} from 'node:fs';
import {addPrintLettering} from './dist/pdf-lettering.mjs';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {pngFromTiles,printLayout} from './dist/map-export.mjs';
const width=2053,height=519;
const blob=await pngFromTiles({width,height,renderTile:async(x,y,w,h)=>{const data=new Uint8ClampedArray(w*h*4);for(let j=0;j<h;j++)for(let i=0;i<w;i++)data.set([(x+i)%256,(y+j)%256,197,255],(j*w+i)*4);return data;}});
const bytes=Buffer.from(await blob.arrayBuffer());assert.equal(bytes.readUInt32BE(16),width);assert.equal(bytes.readUInt32BE(20),height);let offset=8,parts=[];
while(offset<bytes.length){const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);if(type==='IDAT')parts.push(bytes.subarray(offset+8,offset+8+length));offset+=12+length;}
const raw=inflateSync(Buffer.concat(parts));assert.equal(raw.length,(width*3+1)*height);
for(let y=0;y<height;y++){assert.equal(raw[y*(width*3+1)],0);for(let x=0;x<width;x++){const i=y*(width*3+1)+1+x*3;assert.equal(raw[i],x%256);assert.equal(raw[i+1],y%256);assert.equal(raw[i+2],197);}}
const abort=new AbortController();abort.abort();await assert.rejects(pngFromTiles({width:1,height:1,signal:abort.signal,renderTile:()=>{throw Error('Should not render');}}),{name:'AbortError'});
for(const [w,h] of [[1280,720],[390,844]]){const p=printLayout(w,h);assert.equal(p.map.y,124);assert(p.map.y+p.map.height<=p.pageHeight-54);assert(Math.abs(p.map.width/p.map.height-w/h)<1e-10);}
console.log('Exports: streaming PNG rows and tile joins, cancellation, portrait/landscape print layout pass.');

const fonts=JSON.parse(readFileSync('dist/pdf-lettering.json','utf8')),objects=[];
const lettering=addPrintLettering({fonts,pageHeight:1190,add:object=>{objects.push(object);return objects.length;},streamObject:(header,data)=>new Blob([header,data])});
assert.deepEqual(Object.values(fonts).map(f=>f.name).sort(),['Baskerville','Baskerville-Italic','Gotham-Bold']);
for(const font of Object.values(fonts))for(const char of font.text){const glyph=font.glyphs[char.charCodeAt(0)];assert(glyph&&glyph.width>0);if(char!==' ')assert(glyph.path.endsWith('f'),'Visible text must use filled vector paths');}
const embedded=(await Promise.all(objects.map(o=>o.text()))).join('\n');
assert.equal((embedded.match(/\/Subtype \/Type3/g)||[]).length,3);assert.equal((embedded.match(/\/ToUnicode/g)||[]).length,3);assert(!embedded.includes('/Subtype /Image'));
assert.equal(lettering.commands.length,3);for(const text of ['Hexagonal World','A COLLECTION OF HEXAGON BASED MAPS.','By Alex Van de Sande - hexagonal.earth'])assert(lettering.commands.some(c=>c.includes(text)));
console.log('PDF lettering: three embedded vector fonts, complete glyph subsets and selectable text mappings pass.');

const {lifezoneRows,addLifezonesLegend,pdfColor}=await import('./dist/print-legend.mjs');
const {landLegends,oceanLegend}=await import('./dist/map-layers.mjs');
for(const landCount of [3,6,10,15])for(const oceanCount of [3,6,10,15]){
 const rows=lifezoneRows(landCount,oceanCount);
 assert.deepEqual(rows.land.flatMap(r=>r.cells.map(c=>c.name)).sort(),landLegends[landCount].map(c=>c.name).sort());
 assert.deepEqual(rows.ocean.flatMap(r=>r.cells.map(c=>c.name)).sort(),oceanLegend(oceanCount).map(c=>c.name).sort());
 const commands=addLifezonesLegend({landCount,oceanCount,lettering,pageWidth:841.89,pageHeight:1190.551,ink:pdfColor('#193c49')});
 assert.equal(commands.filter(c=>c.endsWith('h f')).length,landCount+oceanCount);
 assert(commands.some(c=>c.includes('(Land)'))&&commands.some(c=>c.includes('(Ocean)')));
 assert(!commands.some(c=>c.includes(' Do ')),'Legend must remain vector');
}
console.log('Print legend: every selected land/ocean class represented once, vector swatches and complete text for all 16 class combinations pass.');
