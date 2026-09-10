import {landRows,oceanRows} from './map-layers.mjs?v=mobile-2';

export const pdfColor=hex=>[1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(6)).join(' ');

// Use the same triangular class rows as the live map.
export function lifezoneRows(landCount,oceanCount){
 return {land:landRows(landCount),ocean:oceanRows(oceanCount)};
}

export function addLifezonesLegend({landCount,oceanCount,lettering,pageWidth,pageHeight,ink}){
 const {land,ocean}=lifezoneRows(landCount,oceanCount),commands=[],{text,measure}=lettering;
 const label=(value,size,x,y,key='title',align='left')=>commands.push(text(key,value,size,x-(align==='center'?measure(key,value,size)/2:align==='right'?measure(key,value,size):0),y));
 function diagram(title,rows,x,axis){
  const center=x+111,radius=7.8,step=Math.sqrt(3)*radius+1.1;
  label(title,19,center,pageHeight-37,'credit','center');
  rows.forEach((row,i)=>{
   const y=pageHeight-52-i*(1.5*radius+1);
   label(row.label,10.5,x+58,y-3.5,'title','right');
   row.cells.forEach((cell,j)=>{
    const cx=center+(j-(row.cells.length-1)/2)*step;
    const vertices=Array.from({length:6},(_,k)=>{const angle=(30+k*60)*Math.PI/180;return `${cx+radius*Math.cos(angle)} ${y+radius*Math.sin(angle)}`;});
    commands.push(`${pdfColor(cell.color)} rg ${vertices[0]} m ${vertices.slice(1).map(p=>p+' l').join(' ')} h f`);
   });
  });
  if(axis){
   label(axis[0],10,center-14,pageHeight-119,'title','right');label(axis[1],10,center+14,pageHeight-119);
   const y=pageHeight-116,a=center-10,b=center+10;
   commands.push(`${ink} RG .5 w ${a} ${y} m ${b} ${y} l ${a+3} ${y+2} m ${a} ${y} l ${a+3} ${y-2} l ${b-3} ${y+2} m ${b} ${y} l ${b-3} ${y-2} l S`);
  }else label('Climate zones',10,center,pageHeight-119,'title','center');
 }
 diagram('Land',land,pageWidth-386,['Arid','Humid']);
 diagram('Ocean',ocean,pageWidth-212,['Cold','Warm']);
 return commands;
}
