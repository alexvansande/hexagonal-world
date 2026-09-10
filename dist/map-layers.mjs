import {compactDevice} from './device-profile.mjs';
// Custom triangular aggregations of the source's 39 Holdridge classes.
// Each successive climate row adds one moisture distinction.
const group=(name,color,raw)=>({name,color,raw,detail:'Holdridge '+raw.join(', ')});
const polar=()=>group('Polar zones & tundra','#d9e4df',[1,2,3,4,5,6]);
const boreal=()=>[
 group('Boreal desert & scrub','#a5ad79',[7,8]),group('Boreal forest','#66867b',[9,10,11])];
const temperate=()=>[
 group('Temperate desert & steppe','#d7c485',[12,13,14,18,19,20]),
 group('Temperate dry & moist forest','#7e9e60',[15,21,22]),group('Temperate wet & rain forest','#377b5d',[16,17,23,24])];
const warm=()=>[
 group('Warm desert & scrub','#e3a75d',[25,26,27,32,33,34]),group('Warm dry forest','#b0bf50',[28,35,36]),
 group('Warm moist forest','#59a542',[29,37]),group('Warm wet & rain forest','#126948',[30,31,38,39])];
const landBands={
 3:[['Cold',[group('Polar & boreal zones','#8aa49e',[1,2,3,4,5,6,7,8,9,10,11])]],
 ['Warm',[group('Desert, scrub & steppe','#d6b46b',[12,13,14,18,19,20,25,26,27,32,33,34]),group('Temperate & warm forests','#398958',[15,16,17,21,22,23,24,28,29,30,31,35,36,37,38,39])]]],
 6:[['Cold',[group('Polar & boreal zones','#d9e4df',[1,2,3,4,5,6,7,8,9,10,11])]],
 ['Temperate',[group('Temperate desert & steppe','#c9ba7c',[12,13,14,18,19,20]),group('Temperate forests','#548556',[15,16,17,21,22,23,24])]],
 ['Warm',[group('Warm desert & scrub','#e3a75d',[25,26,27,32,33,34]),group('Warm dry & moist forest','#91af4c',[28,29,35,36,37]),group('Warm wet & rain forest','#126948',[30,31,38,39])]]],
 10:[['Polar',[polar()]],['Boreal',boreal()],['Temperate',temperate()],['Warm',warm()]],
 15:[['Polar',[polar()]],['Boreal',boreal()],['Temperate',temperate()],
 ['Subtropical',[
 group('Subtropical desert & scrub','#e3b15d',[25,26,27]),group('Subtropical dry forest','#b7c858',[28]),
 group('Subtropical moist forest','#68a54b',[29]),group('Subtropical wet & rain forest','#2d9163',[30,31])]],
 ['Tropical',[
 group('Tropical desert & scrub','#edbe56',[32,33,34]),group('Tropical very dry forest','#c6d44b',[35]),
 group('Tropical dry forest','#8ab546',[36]),group('Tropical moist forest','#3ca454',[37]),group('Tropical wet & rain forest','#126948',[38,39])]]]
};
export const landLegends=Object.fromEntries(Object.entries(landBands).map(([n,bands])=>[n,bands.flatMap(([,cells])=>cells)]));
const landLookup=Object.fromEntries(Object.entries(landLegends).map(([n,cells])=>[n,Object.fromEntries(cells.flatMap((c,i)=>c.raw.map(raw=>[raw,i])))]));
export function landClass(raw,count){
 if(!landLookup[count])throw Error('Invalid land class count');
 return raw===254?0:landLookup[count][raw]??-1;
}
export function landRows(count){return landBands[count].map(([label,cells])=>({label,cells}));}

// Blue channel: 0 = missing SST, otherwise 1 + round((°C + 5) * 4).
export const oceanTemperature=encoded=>encoded>0?(encoded-1)/4-5:null;
// sRGB swatches sampled from the user's reference; interpolate the same
// temperature/exposure palette for the other triangular class counts.
const referenceOcean=[
 ['#7cd4df'],
 ['#6eb2ef','#62a0d9'],
 ['#5374ef','#4662d0','#3953ad'],
 ['#401cee','#3917d2','#3013b3','#280f95'],
];
const oceanRGB=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function rowColor(row,exposure){const x=exposure*(row.length-1),i=Math.floor(x);return mix(oceanRGB(row[i]),oceanRGB(row[Math.min(i+1,row.length-1)]),x-i);}
export function oceanColor(row,column,levels){
 const temperature=row/(levels-1)*3,i=Math.floor(temperature),exposure=row?column/row:0;
 return '#'+mix(rowColor(referenceOcean[i],exposure),rowColor(referenceOcean[Math.min(i+1,3)],exposure),temperature-i).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
}
const temperatureCuts={3:[15],6:[10,20],10:[5,15,25],15:[0,10,20,25]};
const exposureCuts={1:[],2:[1],3:[1,2],4:[1,2,3],5:[1,2,3,4]};
const percentages=[0,10,25,50,75,100];
export function oceanRows(count){
 const cuts=temperatureCuts[count];
 return landRows(count).map((row,i)=>({label:row.label,cells:Array.from({length:i+1},(_,j)=>{
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
 const row=cuts.filter(cut=>oceanTemperature(thermal)>=cut).length;
 // Known cold water converges regardless of waves; missing SST stays unknown.
 if(row===0)return Number.isInteger(exposure)&&((exposure>=0&&exposure<=4)||exposure===255)?0:-1;
 if(!Number.isInteger(exposure)||exposure<0||exposure>4)return -1;
 return row*(row+1)/2+exposureCuts[row+1].filter(cut=>exposure>=cut).length;
}
export const missing={name:'No source data',color:'#999ca3',detail:'Unmapped land or unavailable marine data; not a life-zone class'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function paintEcology(pixels,landCount,oceanCount){
 const land=landLegends[landCount].map(c=>rgb(c.color)),ocean=oceanLegend(oceanCount).map(c=>rgb(c.color)),unknown=rgb(missing.color),out=new Uint8ClampedArray(pixels.length);
 // Classify each possible source value once instead of searching class groups
 // for every pixel in the multi-megapixel source image.
 const landColors=Array.from({length:256},(_,raw)=>land[landClass(raw,landCount)]||unknown);
 const oceanColors=Object.fromEntries([0,1,2,3,4,255].map(exposure=>[exposure,Array.from({length:256},(_,thermal)=>ocean[oceanClass(exposure,thermal,oceanCount)]||unknown)]));
 for(let i=0;i<pixels.length;i+=4){const raw=pixels[i],color=raw===0?(oceanColors[pixels[i+1]]?.[pixels[i+2]]||unknown):landColors[raw];out[i]=color[0];out[i+1]=color[1];out[i+2]=color[2];out[i+3]=255;}
 return out;
}
const images=new Map();
function loadImage(path){if(!images.has(path)){if(images.size>=3)images.delete(images.keys().next().value);images.set(path,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{images.delete(path);reject(Error('Could not load '+path));};image.src=path;}));}return images.get(path);}
let ecologyPixels,riverPaths,riverCanvas,riverMaskKey;
async function loadRivers(){
 if(!riverPaths)riverPaths=(async()=>{const response=await fetch('maps/river-lines.json');if(!response.ok)throw Error('River data could not load');return response.json();})().catch(error=>{riverPaths=null;throw error;});
 return riverPaths;
}
export async function riverMask(levels=6,widthScale=1){
 const key=`${Math.round(levels)}/${Number(widthScale).toFixed(2)}`;
 const paths=await loadRivers();if(key===riverMaskKey)return riverCanvas;
 const width=compactDevice?1440:4320,height=width/2;
 if(!riverCanvas){riverCanvas=document.createElement('canvas');riverCanvas.width=width;riverCanvas.height=height;}
 const canvas=riverCanvas,context=canvas.getContext('2d');context.clearRect(0,0,width,height);context.lineJoin='round';context.lineCap='round';
 for(const [rank,points] of paths){if(rank>levels)continue;context.globalAlpha=1;context.strokeStyle=`rgba(255,255,255,${rank<=3?1:rank<=6?.82:.62})`;context.lineWidth=widthScale*(width/4320)*(rank<=3?2.4:rank<=6?1.55:.95);context.beginPath();points.forEach(([lon,lat],i)=>{const x=(lon+180)/360*width,y=(90-lat)/180*height;i?context.lineTo(x,y):context.moveTo(x,y);});context.stroke();}
 riverMaskKey=key;return canvas;
}
export async function mapSource(type,landCount=10,oceanCount=6){
 if(compactDevice){
  const source=type==='ecology'?await ecologySource(landCount,oceanCount):await loadImage('maps/mobile/'+({terrain:'terrain.jpg',marble:'satellite.jpg',countries:'countries.png',ivory:'ivory.png',elevation:'elevation.png'}[type]||'continents.png'));
  return source;
 }
 return desktopSource(type,landCount,oceanCount);
}
async function desktopSource(type,landCount,oceanCount){
 if(type!=='ecology')return loadImage(type==='terrain'?'maps/topography.jpg':type==='marble'?'maps/bluemarble-high.jpg':type==='countries'?'maps/countries.png':'continents.png');
 return ecologySource(landCount,oceanCount);
}
async function ecologySource(landCount,oceanCount){
 const img=await loadImage('maps/ecology-waves.png'),canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const context=canvas.getContext('2d');
 if(!ecologyPixels){context.drawImage(img,0,0);ecologyPixels=context.getImageData(0,0,img.width,img.height).data;}
 context.putImageData(new ImageData(paintEcology(ecologyPixels,landCount,oceanCount),img.width,img.height),0,0);
 return canvas;
}
