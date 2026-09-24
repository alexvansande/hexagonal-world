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

// More formats: a stored zip any unpacker reads, the Instagram wall of posts,
// and the history poster's boxes, leaders and wrapped text.
{
 const {zipFiles,instagramGrid,instagramTile}=await import('./dist/map-export.mjs');
 const {crc32}=await import('node:zlib');
 const files=[{name:'post-01.png',data:new Uint8Array([137,80,78,71,1,2,3])},{name:'READ ME.txt',data:new TextEncoder().encode('Post 01 first · ünïcode')}];
 const zip=Buffer.from(await zipFiles(files,new Date(2026,8,24,10,30,0)).arrayBuffer());
 const end=zip.length-22;assert.equal(zip.readUInt32LE(end),0x06054b50,'end of central directory');
 assert.equal(zip.readUInt16LE(end+10),files.length);const centralSize=zip.readUInt32LE(end+12),centralOffset=zip.readUInt32LE(end+16);assert.equal(centralOffset+centralSize,end);
 let offset=0,central=centralOffset;
 for(const file of files){
  assert.equal(zip.readUInt32LE(offset),0x04034b50,'local header');assert.equal(zip.readUInt16LE(offset+8),0,'stored, not deflated');
  const nameLength=zip.readUInt16LE(offset+26),name=zip.toString('utf8',offset+30,offset+30+nameLength);assert.equal(name,file.name);
  assert.equal(zip.readUInt32LE(offset+14),crc32(file.data));assert.equal(zip.readUInt32LE(offset+18),file.data.length);
  assert.deepEqual([...zip.subarray(offset+30+nameLength,offset+30+nameLength+file.data.length)],[...file.data]);
  assert.equal(zip.readUInt32LE(central),0x02014b50,'central directory entry');assert.equal(zip.readUInt32LE(central+42),offset,'entry points at its local header');assert.equal(zip.readUInt32LE(central+16),crc32(file.data));
  offset+=30+nameLength+file.data.length;central+=46+zip.readUInt16LE(central+28);
 }
 assert.equal(central,end);
 for(const [width,height,rows] of [[800,560,2],[560,800,3],[2053,519,1]]){
  const plan=instagramGrid({width,height,rows});
  assert.equal(plan.tiles.length,3*rows);assert.equal(plan.width,3*instagramTile.width);assert.equal(plan.height,rows*instagramTile.height);
  assert(width*plan.scale<=plan.width*.92+1e-9&&height*plan.scale<=plan.height*.92+1e-9,'the map keeps a margin inside the wall');
  assert(Math.abs(width*plan.scale-plan.width*.92)<1e-6||Math.abs(height*plan.scale-plan.height*.92)<1e-6,'the map fills the wall in one direction');
  assert(Math.abs(plan.offset[0]*2+width*plan.scale-plan.width)<1e-6&&Math.abs(plan.offset[1]*2+height*plan.scale-plan.height)<1e-6,'centred');
  assert.deepEqual(plan.tiles.map(t=>t.post),plan.tiles.map((_,i)=>plan.tiles.length-i),'posting order runs from the bottom right to the top left');
  assert.equal(plan.tiles.at(-1).post,1);assert.equal(plan.tiles[0].post,plan.tiles.length);
 }
 console.log('More formats: stored zip with CRCs and a readable central directory, Instagram walls of 3, 6 and 9 centred posts in posting order pass.');

 const {posterLayout,leaderPath,markdownRuns,wrapRuns,posterType}=await import('./dist/history-poster.mjs');
 assert.deepEqual(markdownRuns('Some **bold** and *soft* text with a [link](https://example.org/a) end'),[{text:'Some '},{text:'bold',bold:true},{text:' and '},{text:'soft',italic:true},{text:' text with a '},{text:'link'},{text:' end'}]);
 const measure=(text,font)=>text.length*parseFloat(font.match(/([\d.]+)px/)[1])*.5;
 const lines=wrapRuns(markdownRuns('one two **three four** five six seven'),40,(text,run)=>text.length*10*(run.bold?1.2:1));
 assert(lines.every(line=>line.reduce((sum,piece)=>sum+piece.text.length*10*(piece.run.bold?1.2:1),0)<=40||line.length===1),'lines fit or hold one long word');
 assert(!lines.some(line=>/^\s|\s$/.test(line.map(p=>p.text).join(''))),'no line starts or ends with a space');
 assert.deepEqual(lines.flatMap(l=>l.map(p=>p.text).join('').split(' ')),['one','two','three','four','five','six','seven']);
 // Leaders leave sideways and bend once at 45°, or leave at 45° and finish straight down.
 for(const [from,to] of [[[0,0],[100,30]],[[0,0],[-100,30]],[[0,0],[30,-100]],[[50,50],[50,50]]]){
  const path=leaderPath(from,to);assert.equal(path.length,3);assert.deepEqual(path[0],from);assert.deepEqual(path[2],to);
  const [a,b]=[[path[1][0]-path[0][0],path[1][1]-path[0][1]],[path[2][0]-path[1][0],path[2][1]-path[1][1]]];
  const straight=v=>Math.abs(v[0])<1e-9||Math.abs(v[1])<1e-9,diagonal=v=>Math.abs(Math.abs(v[0])-Math.abs(v[1]))<1e-9;
  assert((straight(a)&&diagonal(b))||(diagonal(a)&&straight(b)),`leader ${JSON.stringify(path)} is not straight then diagonal`);
 }
 const map={left:0,top:0,right:800,bottom:560};
 const story=i=>({id:'s'+i,title:'Story '+i,x:120+i*170,y:120+i*80,paragraphs:['Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(2),'A second paragraph with **bold** words.'],legend:[{color:'#ffd000',text:'**Gold** · Mali → Mediterranean'}],note:'Volumes are unknown; dots show direction only.'});
 const layout=posterLayout({map,spots:[0,1,2,3].map(story),scale:1,measure,heading:{label:'High Middle Ages',date:'c. 1400 CE'},labelScale:1});
 assert.equal(layout.boxes.length,4);assert(layout.left<map.left&&layout.right>map.right&&layout.top<map.top&&layout.bottom>=map.bottom);
 assert(layout.heading&&layout.heading.y<map.top,'the period heading sits above the map');
 const overlaps=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 for(const box of layout.boxes){
  assert(box.x+box.width<=map.left||box.x>=map.right,`box ${box.id} stands beside the map, not over it`);
  assert(box.y>=layout.top&&box.y+box.height<=layout.bottom,`box ${box.id} is inside the poster`);
  assert(box.lines.length>6&&box.lines[0].style.size===posterType.title,'title first, then the wrapped text');
  assert(box.lines.some(line=>line.swatch==='#ffd000'),'legend lines carry their wave colour');
  assert.deepEqual(box.leader[0],[box.rule,box.leader[0][1]]);assert.deepEqual(box.leader[2],box.anchor);
  assert(box.leader[0][1]>=box.y&&box.leader[0][1]<=box.y+box.height,'the leader leaves from the rule');
  assert.equal(box.side==='left',box.anchor[0]<400);assert.equal(box.align,box.side==='left'?'right':'left');
  for(const other of layout.boxes)if(other!==box)assert(!overlaps(box,other),`boxes ${box.id} and ${other.id} overlap`);
 }
 // Every spot on one side: the column shares its boxes with the other side rather than overflowing.
 const oneSided=posterLayout({map,spots:[0,1,2,3,4,5].map(i=>({...story(i),x:700,y:60+i*90})),scale:1,measure});
 assert(oneSided.boxes.some(b=>b.side==='left')&&oneSided.boxes.some(b=>b.side==='right'),'a crowded side hands boxes across');
 for(const box of oneSided.boxes)for(const other of oneSided.boxes)if(other!==box)assert(!overlaps(box,other));
 // Stories all on one side within reach: the empty side keeps only its margin.
 const lopsided=posterLayout({map,spots:[0,1].map(i=>({...story(i),x:100,y:150+i*250})),scale:1,measure});
 assert(lopsided.boxes.every(b=>b.side==='left')&&lopsided.right-map.right<map.right*.1&&map.left-lopsided.left>map.right*.3,'an unused column is dropped');
 // Far more text than the map is tall: the poster grows instead of stacking boxes over each other.
 const crowded=posterLayout({map,spots:Array.from({length:10},(_,i)=>({...story(i),x:i%2?700:100,y:60+i*50})),scale:1,measure});
 assert(crowded.bottom>map.bottom+100,'the poster lengthens for long columns');
 for(const box of crowded.boxes)for(const other of crowded.boxes)if(other!==box)assert(!overlaps(box,other));
 assert(crowded.boxes.every(b=>b.y+b.height<=crowded.bottom));
 // A squarer page (an Instagram wall) puts the stories in a band under the map, dealt to three columns.
 const wall=posterLayout({map,spots:[0,1,2,3,4,5].map(story),scale:1,measure,aspect:3240/2700,heading:{label:'Middle Ages',date:'c. 1000 CE'}});
 assert(wall.boxes.every(b=>b.side==='below'&&b.y>=map.bottom&&b.x>=map.left&&b.x+b.width<=map.right+1e-6),'boxes stand under the map');
 assert.equal(new Set(wall.boxes.map(b=>b.x.toFixed(3))).size,3,'three columns');
 for(const box of wall.boxes)for(const other of wall.boxes)if(other!==box)assert(!overlaps(box,other));
 const columnsOf=wall.boxes.reduce((m,b)=>{(m[b.x]||=[]).push(b);return m;},{});
 {const tall=Object.values(columnsOf).map(l=>l.reduce((sum,b)=>sum+b.height,0));assert(Math.max(...tall)-Math.min(...tall)<=Math.max(...wall.boxes.map(b=>b.height))+1e-6,'columns are balanced to within one box');}
 for(const box of wall.boxes){
  assert.deepEqual(box.leader.at(-1),box.anchor);assert(box.leader[0][1]===box.y,'the leader leaves the rule');
  for(let i=1;i<box.leader.length;i++){const a=[box.leader[i][0]-box.leader[i-1][0],box.leader[i][1]-box.leader[i-1][1]];assert(Math.abs(a[0])<1e-9||Math.abs(a[1])<1e-9||Math.abs(Math.abs(a[0])-Math.abs(a[1]))<1e-9,'every leader segment is straight or at 45°');}
  // No leader crosses another box: sample each segment.
  for(const other of wall.boxes)if(other!==box)for(let i=1;i<box.leader.length;i++)for(let t=0;t<=1;t+=.05){const x=box.leader[i-1][0]+(box.leader[i][0]-box.leader[i-1][0])*t,y=box.leader[i-1][1]+(box.leader[i][1]-box.leader[i-1][1])*t;assert(!(x>other.x+1e-6&&x<other.x+other.width-1e-6&&y>other.y+1e-6&&y<other.y+other.height-1e-6),`leader of ${box.id} crosses ${other.id}`);}
 }
 assert(Math.abs(Math.log((wall.width/wall.height)/1.2))<Math.abs(Math.log((layout.width/layout.height)/1.2)),'the band fits the wall better than the side columns');
 const page=posterLayout({map,spots:[0,1,2,3].map(story),scale:1,measure,aspect:2.2});
 assert(page.boxes.every(b=>b.side!=='below'),'a wide page keeps the side columns');
 // Sizes follow the map: twice the scale doubles the column and the type.
 const big=posterLayout({map:{left:0,top:0,right:1600,bottom:1120},spots:[story(0)].map(s=>({...s,x:240,y:240})),scale:2,measure});
 assert(Math.abs(big.boxes[0].width-2*layout.boxes[0].width)<1e-6&&Math.abs(big.boxes[0].lines[0].y-2*layout.boxes[0].lines[0].y)<1e-6);
 // Place names: crowded sites keep their dots and move or lose their names; crowded areas slide or drop.
 const {placeLabels}=await import('./dist/history-poster.mjs');
 const crowd=placeLabels([{kind:'site',text:'Baghdad',x:100,y:100},{kind:'site',text:'Kyiv',x:104,y:102},{kind:'site',text:'Constantinople',x:108,y:100},{kind:'site',text:'Cairo',x:100,y:101},{kind:'area',text:'Baltic Sea',x:110,y:100},{kind:'area',text:'Steppe',x:400,y:300}],{scale:1,labelScale:1,measure});
 assert.equal(crowd.filter(l=>l.kind==='site').length,4,'every site keeps its dot');
 const boxes=crowd.filter(l=>l.tx!==null).map(l=>{const w=l.text.length*(l.kind==='site'?9.5:19)*.5;return l.align==='left'?[l.tx,l.ty-7,l.tx+w,l.ty+7]:l.align==='right'?[l.tx-w,l.ty-7,l.tx,l.ty+7]:[l.tx-w/2,l.ty-10,l.tx+w/2,l.ty+10];});
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3]),'placed names never overlap');}
 assert(crowd.some(l=>l.kind==='area'&&l.text==='Steppe'),'a lone area label stays');
 assert(crowd.filter(l=>l.kind==='site'&&l.tx===null).length>=1||crowd.some(l=>l.align==='right'),'a crowded site moves or drops its name');
 console.log('History poster: Markdown runs and wrapping, straight-diagonal leaders, boxes beside the map without overlaps, balanced and lengthened columns, scale-following sizes pass.');
}
