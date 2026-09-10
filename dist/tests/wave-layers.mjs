// Opt-in preview: reuse land classes, temperature cuts and triangular palettes.
// The green channel contains wave-exposure bands, not seafloor depth.
import * as original from '../map-layers.mjs';
export * from '../map-layers.mjs';
const bands={
 3:[['Rough','≥10%'],['Gentle','<10%']],
 6:[['Rough','≥25%'],['Moderate','10–25%'],['Gentle','<10%']],
 10:[['Very rough','≥50%'],['Rough','25–50%'],['Moderate','10–25%'],['Gentle','<10%']],
 15:[['Very rough','≥75%'],['Rough','50–75%'],['Exposed','25–50%'],['Moderate','10–25%'],['Gentle','<10%']]
};
export function oceanRows(count){
 return original.oceanRows(count).map((row,i)=>({label:bands[count][i][0],cells:row.cells.map(cell=>({
  ...cell,name:`${bands[count][i][0]} · ${i===0?'all temperatures':cell.name.split(' ')[0]}`,
  detail:`Significant wave height >2 m in ${bands[count][i][1]} of samples; ${cell.detail.split('; ')[1]}. Preview classification, not a safety rating.`
 }))}));
}
export function oceanLegend(count){return oceanRows(count).flatMap(row=>row.cells);}
let dataPromise;
export async function mapSource(type,landCount=10,oceanCount=10){
 if(type!=='ecology')return original.mapSource(type,landCount,oceanCount);
 if(!dataPromise)dataPromise=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);resolve({width:image.width,height:image.height,pixels:ctx.getImageData(0,0,image.width,image.height).data});};
  image.onerror=()=>{dataPromise=null;reject(Error('Wave preview data could not load'));};image.src='/tests/ecology-waves.png';
 });
 const {width,height,pixels}=await dataPromise,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 canvas.getContext('2d').putImageData(new ImageData(original.paintEcology(pixels,landCount,oceanCount),width,height),0,0);return canvas;
}
