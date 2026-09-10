import {fadedLegendColor} from '../legend-colors.mjs';
import {waveLegendLayout} from './wave-legend.mjs';
export {pdfColor} from '../print-legend.mjs';
import {pdfColor} from '../print-legend.mjs';
export function addLifezonesLegend({landCount,oceanCount,colorFade=0,lettering,pageWidth,pageHeight,ink}){
 const layout=waveLegendLayout(landCount,oceanCount),scale=.8,left=pageWidth-388,top=pageHeight-18,commands=[];
 for(const h of layout.hexes){const vertices=Array.from({length:6},(_,k)=>{const a=(k*60-90)*Math.PI/180;return `${left+(h.x+Math.cos(a)*h.r)*scale} ${top-(h.y+Math.sin(a)*h.r)*scale}`;});commands.push(`${pdfColor(fadedLegendColor(h.color,colorFade))} rg ${vertices[0]} m ${vertices.slice(1).map(p=>p+' l').join(' ')} h f`);}
 const label=(value,size,x,y,key)=>commands.push(lettering.text(key,value,size,x-lettering.measure(key,value,size)/2,y));
 for(const t of layout.texts){const size=t.size*scale,x=left+t.x*scale,y=top-t.y*scale,key=t.italic?'title':'credit';
  if(!t.value.includes('↔')){label(t.value,size,x,y,key);continue;}
  const [a,b]=t.value.split(' ↔ '),gap=14,aw=lettering.measure(key,a,size),bw=lettering.measure(key,b,size),start=x-(aw+gap+bw)/2;
  label(a,size,start+aw/2,y,key);label(b,size,start+aw+gap+bw/2,y,key);
  const ax=start+aw+3,bx=ax+gap-6,ay=y+3;
  commands.push(`${ink} RG .5 w ${ax} ${ay} m ${bx} ${ay} l ${ax+2} ${ay+2} m ${ax} ${ay} l ${ax+2} ${ay-2} l ${bx-2} ${ay+2} m ${bx} ${ay} l ${bx-2} ${ay-2} l S`);
 }
 return commands;
}
