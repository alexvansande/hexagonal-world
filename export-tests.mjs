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
for(const [w,h] of [[1280,720],[390,844]]){const p=printLayout(w,h);assert(p.map.y>=108);assert(p.map.y+p.map.height<=p.pageHeight-54);assert(Math.abs(p.map.width/p.map.height-w/h)<1e-10);}
console.log('Exports: streaming PNG rows and tile joins, cancellation, portrait/landscape print layout pass.');
