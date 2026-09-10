// Opt-in preview: reuse land classes and triangular temperature/exposure bins.
// The green channel contains wave-exposure bands, not seafloor depth.
import * as original from '../map-layers.mjs';
export * from '../map-layers.mjs';
// sRGB swatches sampled from the user's reference; interpolate the same
// temperature/exposure palette for the other triangular class counts.
const referenceOcean=[
 ['#7cd4df'],
 ['#6eb2ef','#62a0d9'],
 ['#5374ef','#4662d0','#3953ad'],
 ['#401cee','#3917d2','#3013b3','#280f95'],
];
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function rowColor(row,exposure){const x=exposure*(row.length-1),i=Math.floor(x);return mix(rgb(row[i]),rgb(row[Math.min(i+1,row.length-1)]),x-i);}
export function oceanColor(row,column,levels){
 const temperature=row/(levels-1)*3,i=Math.floor(temperature),exposure=row?column/row:0;
 return '#'+mix(rowColor(referenceOcean[i],exposure),rowColor(referenceOcean[Math.min(i+1,3)],exposure),temperature-i).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
}
const temperatureCuts={3:[15],6:[10,20],10:[5,15,25],15:[0,10,20,25]};
const exposureCuts={1:[],2:[1],3:[1,2],4:[1,2,3],5:[1,2,3,4]};
const percentages=[0,10,25,50,75,100];
export function oceanRows(count){
 const cuts=temperatureCuts[count];
 return original.landRows(count).map((row,i)=>({label:row.label,cells:Array.from({length:i+1},(_,j)=>{
  const lo=cuts[i-1],hi=cuts[i],temp=lo===undefined?`<${hi}°C`:hi===undefined?`≥${lo}°C`:`${lo}–${hi}°C`;
  const bands=exposureCuts[i+1],low=percentages[bands[j-1]??0],high=percentages[bands[j]??5];
  const exposure=i===0?'all wave exposures':`${low}–${high}% of samples with significant wave height >2 m`;
  return {name:`${row.label} · ${exposure}`,color:oceanColor(i,j,cuts.length+1),detail:`Annual surface temperature ${temp}; ${exposure}. Hue indicates temperature; within each temperature row, darker means more wave-exposed. The cold apex merges all exposures. This is not a navigation risk score.`};
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
