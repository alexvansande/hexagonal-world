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
assert.deepEqual(Object.values(fonts).map(f=>f.name).sort(),['Baskerville','Baskerville','Baskerville-Italic','Gotham-Bold']);
for(const font of Object.values(fonts))for(const char of font.text){const glyph=font.glyphs[char.charCodeAt(0)];assert(glyph&&glyph.width>0);if(char!==' ')assert(glyph.path.endsWith('f'),'Visible text must use filled vector paths');}
const embedded=(await Promise.all(objects.map(o=>o.text()))).join('\n');
assert.equal((embedded.match(/\/Subtype \/Type3/g)||[]).length,4);assert.equal((embedded.match(/\/ToUnicode/g)||[]).length,4);assert(!embedded.includes('/Subtype /Image'));
assert.equal(lettering.commands.length,3);for(const text of ['Hexagonal Earth','A COLLECTION OF HEXAGON BASED MAPS.','By Alex Van de Sande - hexagonal.earth'])assert(lettering.commands.some(c=>c.includes(text)));
console.log('PDF lettering: four embedded vector fonts, complete glyph subsets and selectable text mappings pass.');

const {lifezoneRows,addLifezonesLegend,pdfColor}=await import('./dist/print-legend.mjs');
const {landLegends,oceanLegend}=await import('./dist/map-layers.mjs');
for(const landCount of [3,6,10,15])for(const oceanCount of [3,6,10,15]){
 const rows=lifezoneRows(landCount,oceanCount);
 for(const side of ['land','ocean'])assert.deepEqual(rows[side].map(r=>r.cells.length),rows[side].map((_,i)=>i+1),'Print rows must form a complete triangle');
 assert.deepEqual(rows.land.flatMap(r=>r.cells.map(c=>c.name)).sort(),landLegends[landCount].map(c=>c.name).sort());
 assert.deepEqual(rows.ocean.flatMap(r=>r.cells.map(c=>c.name)).sort(),oceanLegend(oceanCount).map(c=>c.name).sort());
 const commands=addLifezonesLegend({landCount,oceanCount,lettering,pageWidth:841.89,pageHeight:1190.551,ink:pdfColor('#193c49')});
 assert.equal(commands.filter(c=>c.endsWith('h f')).length,landCount+oceanCount);
 assert(commands.some(c=>c.includes('(Land)'))&&commands.some(c=>c.includes('(Ocean)')));
 assert(!commands.some(c=>c.includes(' Do ')),'Legend must remain vector');
}
console.log('Print legend: every selected land/ocean class represented once, vector swatches and complete text for all 16 class combinations pass.');

assert.equal(fonts.title.name,'Baskerville');assert.equal(fonts.legend.name,'Baskerville-Italic');assert(lettering.commands.some(c=>c.includes('/Fsubtitle 13 Tf')));

// Verify PDF raster scale independently of paper fit, including partial edge tiles.
const {printPDF}=await import('./dist/map-export.mjs');
const originalGlobals={fetch:globalThis.fetch,document:globalThis.document,ImageData:globalThis.ImageData};
try{
 globalThis.fetch=async()=>({ok:true,json:async()=>fonts});
 globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height});}};
 globalThis.document={createElement:()=>({getContext:()=>({putImageData(){}}),toBlob:callback=>callback(new Blob(['test image']))})};
 for(const rasterScale of [2,10]){
  const w=205.3,h=119.7,tiles=[];
  const pdf=await printPDF({width:w,height:h,rasterScale,renderTile:async(x,y,width,height,ratio)=>{assert.equal(ratio,rasterScale);assert(width<=1024&&height<=1024);tiles.push({x,y,width,height});return new Uint8ClampedArray(width*height*4);}});
  assert.equal(Math.max(...tiles.map(t=>t.x+t.width)),Math.round(w*rasterScale));
  assert.equal(Math.max(...tiles.map(t=>t.y+t.height)),Math.round(h*rasterScale));
  assert.equal(tiles.reduce((sum,t)=>sum+t.width*t.height,0),Math.round(w*rasterScale)*Math.round(h*rasterScale));
  const text=await pdf.text();assert.equal((text.match(/\/Subtype \/Image/g)||[]).length,tiles.length);assert.equal((text.match(/\/Subtype \/Type3/g)||[]).length,4);
 }
}finally{Object.assign(globalThis,originalGlobals);}
console.log('PDF 2x and 10x: exact map raster scale, bounded tiles, complete pixel coverage and vector lettering pass.');
