// Embedded Type 3 fonts contain only the vector outlines used by our fixed labels.
// ToUnicode maps preserve selectable, searchable text in the finished document.
let fontPromise;
export function loadPrintLettering(){
 if(!fontPromise)fontPromise=fetch(new URL('./pdf-lettering.json?v=print-legend-1',import.meta.url)).then(response=>{if(!response.ok)throw Error('Print lettering could not load');return response.json();}).catch(error=>{fontPromise=null;throw error;});
 return fontPromise;
}
const literal=text=>'('+text.replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)')+')';
export function addPrintLettering({fonts,add,streamObject,pageHeight,headingOffset=0,ink="0.098039 0.235294 0.286275"}){
 const resources=[],commands=[];
 const measure=(key,text,size)=>[...text].reduce((sum,c)=>sum+fonts[key].glyphs[c.charCodeAt(0)].width,0)*size/1000;
 const text=(key,value,size,x,y)=>`BT /F${key} ${size} Tf ${ink} rg 1 0 0 1 ${x} ${y} Tm ${literal(value)} Tj ET`;
 for(const [key,size,x,y] of [['title',44,36,pageHeight-86-headingOffset],['subtitle',10,38,pageHeight-111-headingOffset],['credit',18,36,24]]){
  const font=fonts[key],codes=Object.keys(font.glyphs).map(Number).sort((a,b)=>a-b),first=codes[0],last=codes.at(-1),charProcs=[];
  for(const code of codes){const glyph=font.glyphs[code],body=`${glyph.width} 0 ${font.bbox.join(' ')} d1\n${glyph.path}\n`,id=add(streamObject('',new Blob([body])));charProcs.push(`/g${code} ${id} 0 R`);}
  const unicode=`/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /PrintLabelUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n${codes.length} beginbfchar\n${codes.map(code=>`<${code.toString(16).padStart(2,'0')}> <${code.toString(16).padStart(4,'0')}>`).join('\n')}\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
  const cmap=add(streamObject('',new Blob([unicode]))),name='F'+key;
  const descriptor=add(new Blob([`<< /Type /FontDescriptor /FontName /${font.name} /Flags ${key==='title'?96:32} /FontBBox [${font.bbox.join(' ')}] /ItalicAngle ${key==='title'?-12:0} /Ascent ${font.bbox[3]} /Descent ${font.bbox[1]} /CapHeight 700 /StemV 80 >>`]));
  const id=add(new Blob([`<< /Type /Font /Subtype /Type3 /Name /${font.name} /FontDescriptor ${descriptor} 0 R /FontBBox [${font.bbox.join(' ')}] /FontMatrix [.001 0 0 .001 0 0] /CharProcs << ${charProcs.join(' ')} >> /Encoding << /Type /Encoding /Differences [${codes.map(code=>`${code} /g${code}`).join(' ')}] >> /FirstChar ${first} /LastChar ${last} /Widths [${Array.from({length:last-first+1},(_,i)=>font.glyphs[i+first]?.width||0).join(' ')}] /Resources << >> /ToUnicode ${cmap} 0 R >>`]));
  resources.push(`/${name} ${id} 0 R`);commands.push(text(key,font.text,size,x,y));
 }
 return {resources:resources.join(' '),commands,text,measure};
}
