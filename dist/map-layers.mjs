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

// Blue-channel v2: 0 = missing SST, otherwise 1 + round((°C + 5) * 4).
// Bathymetry is seafloor depth. These are custom depth/surface-climate groups,
// not measured temperatures at depth or scientific Holdridge marine zones.
export const oceanTemperature=encoded=>encoded>0?(encoded-1)/4-5:null;
const thermalCuts={1:[],2:[15],3:[10,20],4:[5,15,25],5:[0,10,20,25]};
const thermalNames={1:['All climates'],2:['Cooler','Warmer'],3:['Cold','Temperate','Warm'],4:['Cold','Cool','Mild','Warm'],5:['Polar','Cold','Temperate','Subtropical','Tropical']};
const oceanBands={
 3:[['Deep','≥200 m',[1,2,3,4]],['Shelf','<200 m',[0]]],
 6:[['Deep','≥1,000 m',[2,3,4]],['Slope','200–1,000 m',[1]],['Shelf','<200 m',[0]]],
 10:[['Deep','≥2,000 m',[3,4]],['Lower slope','1,000–2,000 m',[2]],['Upper slope','200–1,000 m',[1]],['Shelf','<200 m',[0]]],
 15:[['Abyssal','≥4,000 m',[4]],['Deep','2,000–4,000 m',[3]],['Lower slope','1,000–2,000 m',[2]],['Upper slope','200–1,000 m',[1]],['Shelf','<200 m',[0]]]
};
const oceanPalette=[['#253c67'],['#346587','#514f8a'],['#419bb6','#527abc','#7770c5'],['#60becf','#69a6db','#8194e8','#9991e8'],['#98dfe4','#78cbdc','#82b8ee','#a2adf2','#b8a7ed']];
export function oceanRows(count){
 if(!oceanBands[count])throw Error('Invalid ocean class count');
 return oceanBands[count].map(([label,depth],row)=>({label,cells:Array.from({length:row+1},(_,column)=>{
  const cuts=thermalCuts[row+1],lo=cuts[column-1],hi=cuts[column];
  const range=lo===undefined?`<${hi}°C`:hi===undefined?`≥${lo}°C`:`${lo}–${hi}°C`;
  return {name:row===0?`${label} · all surface climates`:`${thermalNames[row+1][column]} ${label.toLowerCase()}`,color:oceanPalette[row][column],detail:`Seafloor ${depth}; ${row===0?'surface temperature merged':'annual surface temperature '+range}`};
 })}));
}
export function oceanLegend(count){return oceanRows(count).flatMap(row=>row.cells);}
export function oceanClass(depth,thermal,count){
 const bands=oceanBands[count];if(!bands)throw Error('Invalid ocean class count');
 const row=bands.findIndex(([, ,depths])=>depths.includes(depth));if(row<0)return -1;
 if(row===0)return 0; // Deepest group does not need surface-temperature data.
 if(!Number.isInteger(thermal)||thermal<1||thermal>255)return -1;
 const temperature=oceanTemperature(thermal),column=thermalCuts[row+1].filter(cut=>temperature>=cut).length;
 return row*(row+1)/2+column;
}
export const missing={name:'No source data',color:'#999ca3',detail:'Unmapped land or unavailable marine data; not a life-zone class'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function paintEcology(pixels,landCount,oceanCount){
 const land=landLegends[landCount].map(c=>rgb(c.color)),ocean=oceanLegend(oceanCount).map(c=>rgb(c.color)),unknown=rgb(missing.color),out=new Uint8ClampedArray(pixels.length);
 // Classify each possible source value once instead of searching class groups
 // for every pixel in the multi-megapixel source image.
 const landColors=Array.from({length:256},(_,raw)=>land[landClass(raw,landCount)]||unknown);
 const oceanColors=Array.from({length:5},(_,depth)=>Array.from({length:256},(_,thermal)=>ocean[oceanClass(depth,thermal,oceanCount)]||unknown));
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
export async function mapSource(type,landCount=10,oceanCount=6,shadow='gentle'){
 if(compactDevice){
  const source=type==='ecology'?await ecologySource(landCount,oceanCount):await loadImage('maps/mobile/'+({terrain:'terrain.jpg',marble:'satellite.jpg',countries:'countries.png',ivory:'ivory.png',elevation:'elevation.png'}[type]||'continents.png'));
  if(shadow==='off'||['terrain','marble','countries','continents'].includes(type))return source;
  const shade=await loadImage('maps/mobile/shade.jpg'),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const c=canvas.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='multiply';c.globalAlpha={gentle:.35,sculpted:.65,dramatic:1}[shadow]??.35;c.drawImage(shade,0,0,canvas.width,canvas.height);return canvas;
 }
 return desktopSource(type,landCount,oceanCount);
}
async function desktopSource(type,landCount,oceanCount){
 if(type!=='ecology')return loadImage(type==='terrain'?'maps/topography.jpg':type==='marble'?'maps/bluemarble-high.jpg':type==='countries'?'maps/countries.png':'continents.png');
 return ecologySource(landCount,oceanCount);
}
async function ecologySource(landCount,oceanCount){
 const img=await loadImage('maps/ecology-data-v2.png'),canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const context=canvas.getContext('2d');
 if(!ecologyPixels){context.drawImage(img,0,0);ecologyPixels=context.getImageData(0,0,img.width,img.height).data;}
 context.putImageData(new ImageData(paintEcology(ecologyPixels,landCount,oceanCount),img.width,img.height),0,0);
 return canvas;
}
