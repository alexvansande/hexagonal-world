import {addLifezonesLegend,pdfColor} from './print-legend.mjs?v=triangular-1';
import {loadPrintLettering,addPrintLettering} from './pdf-lettering.mjs?v=triangular-1';
// Encode rows incrementally: the final PNG is never held in one giant canvas.
const utf8=new TextEncoder();
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=utf8.encode(type),out=new Uint8Array(data.length+12),view=new DataView(out.buffer);view.setUint32(0,data.length);out.set(name,4);out.set(data,8);let crc=0xffffffff;for(let i=4;i<out.length-4;i++)crc=crcTable[(crc^out[i])&255]^(crc>>>8);view.setUint32(out.length-4,(crc^0xffffffff)>>>0);return out;}
export async function pngFromTiles({width,height,tileSize=1024,renderTile,onProgress=()=>{},signal}){
 const ihdr=new Uint8Array(13),view=new DataView(ihdr.buffer);view.setUint32(0,width);view.setUint32(4,height);ihdr[8]=8;ihdr[9]=2;
 const parts=[new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr)];
 const stream=new CompressionStream('deflate'),writer=stream.writable.getWriter();
 const reading=(async()=>{const reader=stream.readable.getReader();try{while(true){const {value,done}=await reader.read();if(done)break;parts.push(chunk('IDAT',value));}}finally{reader.releaseLock();}})();
 try{
  const bandHeight=Math.min(256,tileSize),stride=width*3+1;let completed=0;const total=Math.ceil(height/bandHeight)*Math.ceil(width/tileSize);
  for(let y=0;y<height;y+=bandHeight){
   const rows=Math.min(bandHeight,height-y),band=new Uint8Array(stride*rows);
   for(let x=0;x<width;x+=tileSize){signal?.throwIfAborted();const columns=Math.min(tileSize,width-x),rgba=await renderTile(x,y,columns,rows);
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=(j*columns+i)*4,b=j*stride+1+(x+i)*3;band[b]=rgba[a];band[b+1]=rgba[a+1];band[b+2]=rgba[a+2];}
    onProgress(++completed/total);await new Promise(resolve=>setTimeout(resolve,0));
   }
   signal?.throwIfAborted();await writer.write(band);
  }
  await writer.close();await reading;
 }catch(error){await writer.abort(error).catch(()=>{});await reading.catch(()=>{});throw error;}
 parts.push(chunk('IEND',new Uint8Array()));return new Blob(parts,{type:'image/png'});
}

// A3 print page, with dedicated title and credit bands, independent of screen UI.
export function printLayout(width,height){
 const pageWidth=width>=height?1190.551:841.89,pageHeight=width>=height?841.89:1190.551,margin=36,top=124,bottom=54;
 const scale=Math.min((pageWidth-2*margin)/width,(pageHeight-top-bottom)/height);
 return {pageWidth,pageHeight,map:{x:(pageWidth-width*scale)/2,y:top,width:width*scale,height:height*scale},margin};
}
function pdfString(s){return '('+s.replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)')+')';}
export async function printPDF({width,height,renderTile,signal,onProgress=()=>{},background='#ffffff',lifezones=null,mapInsetTop=0}){
 const fonts=await loadPrintLettering();signal?.throwIfAborted();
 const layout=printLayout(width,height),dpi=300,factor=layout.map.width/width*dpi/72,pxWidth=Math.round(width*factor),pxHeight=Math.round(height*factor);
 const objects=[],add=data=>{objects.push(data);return objects.length;},bytes=s=>utf8.encode(s);
 const catalog=add(null),pages=add(null),page=add(null),resources=[],commands=[`${pdfColor(background)} rg 0 0 ${layout.pageWidth} ${layout.pageHeight} re f`];
 const streamObject=(header,data)=>new Blob([bytes('<< '+header+' /Length '+data.size+' >>\nstream\n'),data,bytes('\nendstream')]);
 function addImage(blob,pixelWidth,pixelHeight,rect){const id=add(streamObject(`/Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,blob)),name='I'+id;resources.push('/'+name+' '+id+' 0 R');commands.push(`q ${rect.width} 0 0 ${rect.height} ${rect.x} ${layout.pageHeight-rect.y-rect.height} cm /${name} Do Q`);}
 const tile=document.createElement('canvas'),ctx=tile.getContext('2d'),tileSize=1024,total=Math.ceil(pxWidth/tileSize)*Math.ceil(pxHeight/tileSize);let done=0;
 for(let y=0;y<pxHeight;y+=tileSize)for(let x=0;x<pxWidth;x+=tileSize){
  signal?.throwIfAborted();const tw=Math.min(tileSize,pxWidth-x),th=Math.min(tileSize,pxHeight-y),rgba=await renderTile(x,y,tw,th,factor);tile.width=tw;tile.height=th;ctx.putImageData(new ImageData(rgba,tw,th),0,0);
  const blob=await new Promise((resolve,reject)=>tile.toBlob(b=>b?resolve(b):reject(Error('PDF image encoding failed')),'image/jpeg',.98));
  addImage(blob,tw,th,{x:layout.map.x+x/pxWidth*layout.map.width,y:layout.map.y+y/pxHeight*layout.map.height,width:tw/pxWidth*layout.map.width,height:th/pxHeight*layout.map.height});onProgress(++done/total);await new Promise(resolve=>setTimeout(resolve,0));
 }
 const brightness=[1,3,5].reduce((sum,i,k)=>sum+parseInt(background.slice(i,i+2),16)*[.299,.587,.114][k],0),ink=pdfColor(brightness>145?'#193c49':'#f6f4ed');
 const headingOffset=mapInsetTop*layout.map.width/width;
 const lettering=addPrintLettering({fonts,add,streamObject,pageHeight:layout.pageHeight,headingOffset,ink});commands.push(...lettering.commands);
 if(lifezones)commands.push(...addLifezonesLegend({...lifezones,lettering,pageWidth:layout.pageWidth,pageHeight:layout.pageHeight-headingOffset,ink}));
 const content=add(streamObject('',new Blob([commands.join('\n')]))),info=add(bytes('<< /Title '+pdfString('Hexagonal World')+' /Author '+pdfString('Alex Van de Sande')+' /Subject '+pdfString('A collection of hexagon based maps. | By Alex Van de Sande - hexagonal.earth')+' >>'));
 objects[catalog-1]=bytes(`<< /Type /Catalog /Pages ${pages} 0 R >>`);objects[pages-1]=bytes(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);objects[page-1]=bytes(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${layout.pageWidth} ${layout.pageHeight}] /Resources << /Font << ${lettering.resources} >> /XObject << ${resources.join(' ')} >> >> /Contents ${content} 0 R >>`);
 const output=[bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offsets=[0];let offset=output[0].length;
 objects.forEach((object,i)=>{offsets.push(offset);const entry=new Blob([`${i+1} 0 obj\n`,object,'\nendobj\n']);output.push(entry);offset+=entry.size;});
 const xref=offset;output.push(bytes(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
 tile.width=tile.height=1;return new Blob(output,{type:'application/pdf'});
}
