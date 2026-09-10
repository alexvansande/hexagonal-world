import {landLegends,oceanLegend} from './map-layers.mjs';

export const pdfColor=hex=>[1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(6)).join(' ');

// Preserve the source classes, including the coarser settings that combine
// climate bands. Ocean temperature is not interchangeable with land climate.
export function lifezoneRows(landCount,oceanCount){
 const landGroups={
  3:[['Cold',[0]],['Arid',[1]],['Forest',[2]]],
  6:[['Polar',[0]],['Boreal',[1]],['Temperate',[2,3]],['Warm',[4,5]]],
  10:[['Polar',[0]],['Boreal',[1]],['Temperate',[2,3,4]],['Warm',[5,6,8,7,9]]],
  15:[['Polar',[0,1]],['Boreal',[2,3]],['Temperate',[4,5,6,7,8]],['Warm',[9,12,10,13,11,14]]]
 };
 const oceanGroups={
  3:[['Cold',[0]],['Mild/warm',[1,2]]],
  6:[['Cold',[0,1]],['Temperate',[2,3]],['Warm',[4,5]]],
  10:[['Cold',[0,1,2,3,4]],['Mild/warm',[5,6,7,8,9]]],
  15:[['Cold',[0,1,2,3,4]],['Temperate',[5,6,7,8,9]],['Warm',[10,11,12,13,14]]]
 };
 const rows=(groups,entries)=>groups.map(([label,indices])=>({label,cells:indices.map(i=>entries[i])}));
 return {land:rows(landGroups[landCount],landLegends[landCount]),ocean:rows(oceanGroups[oceanCount],oceanLegend(oceanCount))};
}

export function addLifezonesLegend({landCount,oceanCount,lettering,pageWidth,pageHeight,ink}){
 const {land,ocean}=lifezoneRows(landCount,oceanCount),commands=[],{text,measure}=lettering;
 const label=(value,size,x,y,key='title',align='left')=>commands.push(text(key,value,size,x-(align==='center'?measure(key,value,size)/2:align==='right'?measure(key,value,size):0),y));
 function diagram(title,rows,x,axis){
  const center=x+111,radius=7.8,step=Math.sqrt(3)*radius+1.1;
  label(title,19,center,pageHeight-37,'credit','center');
  rows.forEach((row,i)=>{
   const y=pageHeight-52-i*(45/Math.max(1,rows.length-1));
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
 diagram('Land',land,pageWidth-386,landCount>=10?['Arid','Humid']:null);
 diagram('Ocean',ocean,pageWidth-212,['Shallow','Deep']);
 return commands;
}
