const entries=rows=>rows.map(([name,color,detail])=>({name,color,detail}));
export const landLegends={
 15:entries([
 ['Ice & polar desert','#e3e9e8','Holdridge 1–2'],['Tundra','#a8b3a0','Holdridge 3–6'],['Boreal desert & scrub','#b3b48a','Holdridge 7–8'],['Boreal forest','#557d72','Holdridge 9–11'],['Temperate desert','#d1b989','Holdridge 12–13, 18–19'],['Temperate steppe','#b6b965','Holdridge 14, 20'],['Cool moist forest','#789b54','Holdridge 15'],['Cool wet forest','#377b5d','Holdridge 16–17'],['Warm temperate forest','#5f9345','Holdridge 21–24'],['Hot desert & scrub','#e3a75d','Holdridge 25–27, 32–34'],['Subtropical dry forest','#a4b24d','Holdridge 28'],['Subtropical humid forest','#2d9b63','Holdridge 29–31'],['Tropical very dry forest','#cdbe50','Holdridge 35'],['Tropical dry forest','#8ab546','Holdridge 36'],['Tropical humid forest','#126948','Holdridge 37–39']]),
 10:entries([
 ['Polar zones & tundra','#cbd5ce','Holdridge 1–6'],['Boreal zones','#66867b','Holdridge 7–11'],['Temperate desert & steppe','#c9ba7c','Holdridge 12–14, 18–20'],['Cool temperate forest','#548556','Holdridge 15–17'],['Warm temperate forest','#5f9345','Holdridge 21–24'],['Hot desert & scrub','#e3a75d','Holdridge 25–27, 32–34'],['Subtropical dry forest','#a4b24d','Holdridge 28'],['Subtropical humid forest','#2d9b63','Holdridge 29–31'],['Tropical dry forest','#b0b84b','Holdridge 35–36'],['Tropical humid forest','#126948','Holdridge 37–39']]),
 3:entries([['Polar & boreal zones','#8aa49e','Holdridge 1–11; unclassified polar land'],['Desert, scrub & steppe','#d6b46b','Holdridge 12–14, 18–20, 25–27, 32–34'],['Temperate & warm forests','#398958','Remaining forest classes']]),
 6:entries([
 ['Polar & tundra','#d9e4df','Holdridge 1–6; unclassified polar land'],['Boreal zones','#66867b','Holdridge 7–11'],
 ['Temperate desert, steppe & forest','#c9ba7c','Holdridge 12–20'],['Warm temperate forest','#5f9345','Holdridge 21–24'],
 ['Subtropical zones','#65a95d','Holdridge 25–31'],['Tropical zones','#b18b4a','Holdridge 32–39']])
};
const groups15=[[1,2],[3,4,5,6],[7,8],[9,10,11],[12,13,18,19],[14,20],[15],[16,17],[21,22,23,24],[25,26,27,32,33,34],[28],[29,30,31],[35],[36],[37,38,39]];
const map10=[0,0,1,1,2,2,3,3,4,5,6,7,8,8,9];
export function landClass(raw,count){
 if(raw===254)return 0;
 if(raw<1||raw>39)return -1;
 const fine=groups15.findIndex(a=>a.includes(raw));
 if(count===15)return fine;if(count===10)return map10[fine];
 if(count===6)return raw<=6?0:raw<=11?1:raw<=20?2:raw<=24?3:raw<=31?4:5;
 if(count===3)return raw<=11?0:[4,5,9].includes(fine)?1:2;
 throw Error('Invalid land class count');
}
const depths=['Shelf · <200 m','Upper slope · 200–1,000 m','Lower slope · 1,000–2,000 m','Deep · 2,000–4,000 m','Abyssal · ≥4,000 m'];
const temps=['Cold','Temperate','Warm'];
const tempDetails=['Annual surface temperature <10°C','Annual surface temperature 10–20°C','Annual surface temperature ≥20°C'];
const oceanColors=[['#80dce5','#48b9cc','#2794b1','#196985','#104459'],['#8dc4f3','#5c9bdf','#3b73c0','#285095','#1a3267'],['#b4b6fa','#898bea','#6363ce','#4746a5','#302d73']];
export function oceanLegend(count){
 if(count===3)return entries([['Cold waters · all depths','#48b9cc',tempDetails[0]],['Mild/warm shelf','#9ca8f4','Surface ≥10°C; depth <200 m'],['Mild/warm offshore','#3d499e','Surface ≥10°C; depth ≥200 m']]);
 if(count===10)return ['Cold','Temperate & warm'].flatMap((t,i)=>[0,1,2,3,4].map(d=>({name:`${t} ${depths[d].split(' · ')[0].toLowerCase()}`,color:oceanColors[i][d],detail:`${i===0?tempDetails[0]:'Surface temperature ≥10°C'}; ${depths[d].split(' · ')[1]}`})));
 if(![6,15].includes(count))throw Error('Invalid ocean class count');
 return temps.flatMap((t,i)=>(count===6?[0,1]:[0,1,2,3,4]).map(d=>({name:`${t} ${count===6?(d===0?'shelf':'offshore'):depths[d].split(' · ')[0].toLowerCase()}`,color:oceanColors[i][count===6?(d===0?0:3):d],detail:`${tempDetails[i]}; ${count===6?(d===0?'depth <200 m':'depth ≥200 m'):depths[d].split(' · ')[1]}`})));
}
export function oceanClass(depth,thermal,count){if(thermal<1||thermal>3||depth<0||depth>4)return -1;if(count===3)return thermal===1?0:depth===0?1:2;if(count===6)return (thermal-1)*2+(depth===0?0:1);if(count===10)return (thermal===1?0:5)+depth;if(count===15)return (thermal-1)*5+depth;throw Error('Invalid ocean class count');}
export const missing={name:'No source data',color:'#999ca3',detail:'Unmapped land or unavailable marine data; not a life-zone class'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function paintEcology(pixels,landCount,oceanCount){
 const land=landLegends[landCount].map(c=>rgb(c.color)),ocean=oceanLegend(oceanCount).map(c=>rgb(c.color)),unknown=rgb(missing.color),out=new Uint8ClampedArray(pixels.length);
 // Classify each possible source value once instead of searching class groups
 // for every pixel in the multi-megapixel source image.
 const landColors=Array.from({length:256},(_,raw)=>land[landClass(raw,landCount)]||unknown);
 const oceanColors=Array.from({length:5},(_,depth)=>Array.from({length:4},(_,thermal)=>ocean[oceanClass(depth,thermal,oceanCount)]||unknown));
 for(let i=0;i<pixels.length;i+=4){const raw=pixels[i],color=raw===0?(oceanColors[pixels[i+1]]?.[pixels[i+2]]||unknown):landColors[raw];out[i]=color[0];out[i+1]=color[1];out[i+2]=color[2];out[i+3]=255;}
 return out;
}
const images=new Map();
function loadImage(path){if(!images.has(path))images.set(path,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{images.delete(path);reject(Error('Could not load '+path));};image.src=path;}));return images.get(path);}
let ecologyPixels,riverPaths,riverCanvas,riverMaskKey;
async function loadRivers(){
 if(!riverPaths)riverPaths=(async()=>{const response=await fetch('maps/river-lines.json');if(!response.ok)throw Error('River data could not load');return response.json();})().catch(error=>{riverPaths=null;throw error;});
 return riverPaths;
}
export async function riverMask(levels=6,widthScale=1){
 const key=`${Math.round(levels)}/${Number(widthScale).toFixed(2)}`;
 const paths=await loadRivers();if(key===riverMaskKey)return riverCanvas;
 const width=4320,height=2160;
 if(!riverCanvas){riverCanvas=document.createElement('canvas');riverCanvas.width=width;riverCanvas.height=height;}
 const canvas=riverCanvas,context=canvas.getContext('2d');context.clearRect(0,0,width,height);context.lineJoin='round';context.lineCap='round';
 for(const [rank,points] of paths){if(rank>levels)continue;context.globalAlpha=1;context.strokeStyle=`rgba(255,255,255,${rank<=3?1:rank<=6?.82:.62})`;context.lineWidth=widthScale*(rank<=3?2.4:rank<=6?1.55:.95);context.beginPath();points.forEach(([lon,lat],i)=>{const x=(lon+180)/360*width,y=(90-lat)/180*height;i?context.lineTo(x,y):context.moveTo(x,y);});context.stroke();}
 riverMaskKey=key;return canvas;
}
export async function mapSource(type,landCount=10,oceanCount=6){
 if(type!=='ecology')return loadImage(type==='terrain'?'maps/topography.jpg':type==='marble'?'maps/bluemarble-high.jpg':type==='countries'?'maps/countries.png':'continents.png');
 const img=await loadImage('maps/ecology-data.png'),canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const context=canvas.getContext('2d');
 if(!ecologyPixels){context.drawImage(img,0,0);ecologyPixels=context.getImageData(0,0,img.width,img.height).data;}
 context.putImageData(new ImageData(paintEcology(ecologyPixels,landCount,oceanCount),img.width,img.height),0,0);
 return canvas;
}
