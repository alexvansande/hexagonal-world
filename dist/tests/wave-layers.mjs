// Opt-in preview: reuse land classes, temperature cuts and triangular palettes.
// The green channel contains wave-exposure bands, not seafloor depth.
import * as original from '../map-layers.mjs';
export * from '../map-layers.mjs';
// Preserve every swatch of the old palette; transpose the triangular axes.
const temperatureCuts={3:[15],6:[10,20],10:[5,15,25],15:[0,10,20,25]};
const exposureCuts={1:[],2:[1],3:[1,2],4:[1,2,3],5:[1,2,3,4]};
const percentages=[0,10,25,50,75,100];
export function oceanRows(count){
 const old=original.oceanRows(count),cuts=temperatureCuts[count];
 return original.landRows(count).map((row,i)=>({label:row.label,cells:Array.from({length:i+1},(_,j)=>{
  const lo=cuts[i-1],hi=cuts[i],temp=lo===undefined?`<${hi}°C`:hi===undefined?`≥${lo}°C`:`${lo}–${hi}°C`;
  const bands=exposureCuts[i+1],low=percentages[bands[j-1]??0],high=percentages[bands[j]??5];
  const exposure=i===0?'all wave exposures':`${low}–${high}% of samples with significant wave height >2 m`;
  return {name:`${row.label} · ${exposure}`,color:old[old.length-1-j].cells[i-j].color,detail:`Annual surface temperature ${temp}; ${exposure}. Shared climate labels are illustrative SST bands, not Holdridge marine zones or a safety rating.`};
 })}));
}
export function oceanLegend(count){return oceanRows(count).flatMap(row=>row.cells);}
export function oceanClass(exposure,thermal,count){
 const cuts=temperatureCuts[count];if(!cuts)throw Error('Invalid ocean class count');
 if(!Number.isInteger(thermal)||thermal<1||thermal>255)return -1;
 const row=cuts.filter(cut=>original.oceanTemperature(thermal)>=cut).length;
 // Known cold water converges regardless of waves; missing SST stays unknown.
 if(row===0)return 0;
 if(!Number.isInteger(exposure)||exposure<0||exposure>4)return -1;
 return row*(row+1)/2+exposureCuts[row+1].filter(cut=>exposure>=cut).length;
}
export function paintEcology(pixels,landCount,oceanCount){
 const out=original.paintEcology(pixels,landCount,oceanCount),rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const colors=oceanLegend(oceanCount).map(c=>rgb(c.color)),unknown=rgb(original.missing.color);
 const lookup=Object.fromEntries([0,1,2,3,4,255].map(exposure=>[exposure,Array.from({length:256},(_,thermal)=>colors[oceanClass(exposure,thermal,oceanCount)]||unknown)]));
 for(let i=0;i<pixels.length;i+=4)if(pixels[i]===0){const color=lookup[pixels[i+1]]?.[pixels[i+2]]||unknown;out[i]=color[0];out[i+1]=color[1];out[i+2]=color[2];}
 return out;
}
let dataPromise;
export async function mapSource(type,landCount=10,oceanCount=10){
 if(type!=='ecology')return original.mapSource(type,landCount,oceanCount);
 if(!dataPromise)dataPromise=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);resolve({width:image.width,height:image.height,pixels:ctx.getImageData(0,0,image.width,image.height).data});};
  image.onerror=()=>{dataPromise=null;reject(Error('Wave preview data could not load'));};image.src='/tests/ecology-waves.png';
 });
 const {width,height,pixels}=await dataPromise,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 canvas.getContext('2d').putImageData(new ImageData(paintEcology(pixels,landCount,oceanCount),width,height),0,0);return canvas;
}
