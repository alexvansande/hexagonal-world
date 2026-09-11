import {layoutOptions} from './map-options.mjs?v=ivory-lines-1';
import manifest from './maps/surfaces/manifest.mjs';
export const surfaceSources=['ecology','countries','continents','marble','terrain'];
export function surfacePreset(state,source,land=10,ocean=6,blend=0,bridges=5){
 if(blend!==0||bridges!==5||(source==='ecology'&&(land!==10||ocean!==6)))return null;
 const layout=layoutOptions.find(l=>['method','lon','lat','roll','bias','height'].every(k=>Math.abs((state[k]??0)-(l.state[k]??0))<1e-9||state[k]===l.state[k]));
 if(!layout)return null;
 const type=['ivory','elevation'].includes(source)?'continents':source;
 const entry=manifest.entries[`${layout.arrangement}/${type}`];
 const signature=JSON.stringify(['method','lon','lat','roll','bias','height'].map(k=>state[k]));
 return entry?.signature===signature?entry:null;
}
export function surfaceLevel(density,maxLevel){return Math.min(maxLevel,Math.max(0,Math.ceil(Math.log2(Math.max(1,density)*2/256))));}
// Tiles include a one-pixel gutter on all sides. The UVs address pixel edges,
// so bilinear filtering reads the adjoining tile's pixels without a seam.
export function surfaceTileRect(level,x,y){const span=2/(2**level);return [-1+x*span,1-(y+1)*span,span,span];}
export class PrecomputedSurfaces{
 constructor(gl,redraw){this.gl=gl;this.redraw=redraw;this.cache=new Map();this.pending=new Set();this.queue=[];this.active=0;this.clock=0;this.requests=0;this.failures=new Set();}
 tile(entry,region,level,x,y){
  const key=`${entry.path}/${region}/${level}/${x}-${y}`;
  const cached=this.cache.get(key);if(cached){cached.used=++this.clock;return cached;}
  if(!this.pending.has(key)&&!this.failures.has(key)){this.pending.add(key);this.queue.push({key});this.pump();}
  return null;
 }
 pump(){while(this.active<4&&this.queue.length){const {key}=this.queue.shift();this.active++;this.requests++;
  fetch(`maps/surfaces/${key}.webp`).then(r=>{if(!r.ok)throw Error(r.status);return r.blob();}).then(createImageBitmap).then(image=>{
   const g=this.gl,texture=g.createTexture();g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,texture);
   for(const name of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,name,g.LINEAR);
   for(const name of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,name,g.CLAMP_TO_EDGE);
   g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,image);image.close();this.cache.set(key,{texture,used:++this.clock});
   // About 32 MB of decoded tile textures, independent of total pyramid size.
   while(this.cache.size>120){let oldest;for(const pair of this.cache)if(!oldest||pair[1].used<oldest[1].used)oldest=pair;g.deleteTexture(oldest[1].texture);this.cache.delete(oldest[0]);}
  }).catch(()=>this.failures.add(key)).finally(()=>{this.pending.delete(key);this.active--;this.pump();this.redraw();});
 }}
 get(entry,region,level,x,y){const overview=this.tile(entry,region,0,0,0);const exact=this.tile(entry,region,level,x,y);if(exact)return {...exact,rect:surfaceTileRect(level,x,y)};
  for(let l=level-1;l>0;l--){const divisor=2**(level-l),px=Math.floor(x/divisor),py=Math.floor(y/divisor),key=`${entry.path}/${region}/${l}/${px}-${py}`,tile=this.cache.get(key);if(tile){tile.used=++this.clock;return {...tile,rect:surfaceTileRect(l,px,py)};}}
  return overview?{...overview,rect:[-1,-1,2,2]}:null;
 }
}
// Clip the existing projection triangles, interpolating every attribute. This
// preserves projection seams and avoids drawing a full hex once per image tile.
export function clipSurfaceTriangle(vertices,rect){
 let polygon=vertices;
 const [x,y,w,h]=rect;
 for(const [axis,bound,sign] of [[15,x,1],[15,x+w,-1],[16,y,1],[16,y+h,-1]]){
  const out=[];
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;
   if(da>=-1e-12)out.push(a);
   if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}
  }
  polygon=out;if(!polygon.length)break;
 }
 const out=[];for(let i=1;i+1<polygon.length;i++)out.push(...polygon[0],...polygon[i],...polygon[i+1]);return out;
}
