import {assetURL} from './asset-url.mjs';
import {layoutOptions} from './map-options.mjs?v=turn-30';
import manifest from './maps/surfaces/manifest.mjs?v=lifezones-shadows-3';
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
export const surfaceTileBudget=120;
export function surfacePlan(level,regions,collect){
 while(true){
  const tiles=collect(level),keys=new Set(tiles.map(tile=>`${tile.region}/${tile.x}/${tile.y}`));
  // Count unique image tiles: repeated copies of a hex share the same texture.
  if(level===0||keys.size+regions<=surfaceTileBudget)return {level,tiles};
  level--;
 }
}
// Tiles include a one-pixel gutter on all sides. The UVs address pixel edges,
// so bilinear filtering reads the adjoining tile's pixels without a seam.
export function surfaceTileRect(level,x,y){const span=2/(2**level);return [-1+x*span,1-(y+1)*span,span,span];}
export class PrecomputedSurfaces{
 constructor(gl,redraw,{root='maps/surfaces',extension='webp',budget=surfaceTileBudget,bitmapOptions}={}){this.bitmapOptions=bitmapOptions;this.root=root;this.extension=extension;this.budget=budget;this.controllers=new Map();this.attempts=new Map();this.retryTimers=new Map();this.disposed=false;this.gl=gl;this.redraw=redraw;this.cache=new Map();this.pending=new Set();this.queue=[];this.active=0;this.clock=0;this.requests=0;this.failures=new Set();this.fade=0;this.prefetch=new Set();this.fading=false;}
 prepare(entry,tiles=[],level=0,fallback=null){
  // Give every region a low-resolution image before spending bandwidth on detail.
  // A tile may name its own pyramid path (a lit variant of the same region).
  // Its own set's preview for each region a tile draws, and every region's preview of the entry.
  const previews=new Map([...Array.from({length:entry.regions},(_,region)=>[`${entry.path}/${region}`,[entry.path,region]]),...tiles.filter(tile=>tile.path).map(tile=>[`${tile.path}/${tile.region}`,[tile.path,tile.region]])]);
  this.required=new Set([...previews.keys()].map(key=>`${key}/0/0-0`));
  for(const tile of tiles)this.required.add(`${tile.path||entry.path}/${tile.region}/${level}/${tile.x}-${tile.y}`);
  // Tiles wanted soon (where a camera flight will land) load after the visible ones and stay cached.
  for(const key of this.prefetch)this.required.add(key);
  this.setRequired(this.required);
  let ready=true;
  for(const [path,region] of previews.values()){
   // A region still showing an earlier set (see layers) does not need the new set's preview yet.
   if(!this.tile({...entry,path},region,0,0,0)&&!this.failures.has(`${path}/${region}/0/0-0`)&&!(fallback&&fallback(path,region)))ready=false;
  }
  for(const key of this.prefetch)this.request(key);
  return ready;
 }
 setRequired(keys){
  this.required=keys;this.queue=this.queue.filter(job=>{if(keys.has(job.key))return true;this.pending.delete(job.key);return false;});
  for(const [key,c] of this.controllers)if(!keys.has(key))c.abort();
  for(const key of this.failures)if(!keys.has(key)){this.failures.delete(key);this.attempts.delete(key);clearTimeout(this.retryTimers.get(key));this.retryTimers.delete(key);}
 }
 tile(entry,region,level,x,y){
  const key=`${entry.path}/${region}/${level}/${x}-${y}`;
  return this.request(key,level===0);
 }
 request(key,preview=false){
  const cached=this.cache.get(key);if(cached){cached.used=++this.clock;return cached;}
  if(!this.pending.has(key)&&!this.failures.has(key)){this.pending.add(key);if(preview)this.queue.unshift({key});else this.queue.push({key});this.pump();}
  return null;
 }
 pump(){if(this.disposed)return;while(this.active<4&&this.queue.length){const {key}=this.queue.shift();this.active++;this.requests++;const controller=new AbortController();this.controllers.set(key,controller);
  fetch(assetURL(`${this.root}/${key}.${this.extension}`),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error(r.status);return r.blob();}).then(blob=>createImageBitmap(blob,this.bitmapOptions)).then(image=>{
   if(this.disposed||controller.signal.aborted){image.close();return;}this.failures.delete(key);this.attempts.delete(key);const g=this.gl,texture=g.createTexture();g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,texture);
   for(const name of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,name,g.LINEAR);
   for(const name of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,name,g.CLAMP_TO_EDGE);
   g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,image);const {width,height}=image;image.close();this.cache.set(key,{texture,width,height,used:++this.clock,born:performance.now()});
   // About 32 MB of decoded tile textures, independent of total pyramid size.
   while(this.cache.size>this.budget){let oldest;for(const pair of this.cache)if(!this.required?.has(pair[0])&&(!oldest||pair[1].used<oldest[1].used))oldest=pair;if(!oldest)break;g.deleteTexture(oldest[1].texture);this.cache.delete(oldest[0]);}
  }).catch(error=>{if(this.disposed||error.name==='AbortError')return;this.failures.add(key);const attempt=(this.attempts.get(key)||0)+1;this.attempts.set(key,attempt);
   if(attempt<3){const timer=setTimeout(()=>{this.retryTimers.delete(key);if(this.disposed||!this.required?.has(key))return;this.failures.delete(key);this.redraw();},400*2**(attempt-1));this.retryTimers.set(key,timer);}
  }).finally(()=>{this.controllers.delete(key);this.pending.delete(key);this.active--;this.pump();if(!this.disposed)this.redraw();});
 }}
 retry(){for(const timer of this.retryTimers.values())clearTimeout(timer);this.retryTimers.clear();this.failures.clear();this.attempts.clear();this.redraw();}
 dispose(){this.disposed=true;for(const c of this.controllers.values())c.abort();for(const timer of this.retryTimers.values())clearTimeout(timer);for(const tile of this.cache.values())this.gl.deleteTexture(tile.texture);this.cache.clear();this.queue=[];this.pending.clear();}
 get(entry,region,level,x,y){const overview=this.tile(entry,region,0,0,0);const exact=this.tile(entry,region,level,x,y);if(exact)return {...exact,rect:surfaceTileRect(level,x,y)};
  for(let l=level-1;l>0;l--){const divisor=2**(level-l),px=Math.floor(x/divisor),py=Math.floor(y/divisor),key=`${entry.path}/${region}/${l}/${px}-${py}`,tile=this.cache.get(key);if(tile){tile.used=++this.clock;return {...tile,rect:surfaceTileRect(l,px,py)};}}
  return overview?{...overview,rect:[-1,-1,2,2]}:null;
 }
 // The finest tile of a pyramid already decoded for this cell, at `level` or coarser; never requests.
 cached(path,region,level,x,y,below=Infinity){
  for(let l=Math.min(level,below-1);l>=0;l--){const divisor=2**(level-l),px=Math.floor(x/divisor),py=Math.floor(y/divisor),tile=this.cache.get(`${path}/${region}/${l}/${px}-${py}`);if(tile){tile.used=++this.clock;return {...tile,rect:surfaceTileRect(l,px,py),level:l};}}
  return null;
 }
 // What to draw for one cell, bottom first, each with its opacity. Without a fade this is get().
 // With one, a newly decoded tile fades in over the coarser tile it replaces, and a region
 // changing sets (a piece turned by the dance takes another lit set) keeps the earlier set
 // until the new one is as sharp, then crossfades: transition {from, start} is per region.
 layers(entry,region,level,x,y,transition=null,now=performance.now()){
  const top=this.get(entry,region,level,x,y);
  if(!this.fade)return top?[{...top,alpha:1}]:[];
  const fade=t=>Math.min(1,Math.max(0,(now-t)/this.fade)),ease=a=>a*a*(3-2*a);
  const best=top?this.cached(entry.path,region,level,x,y)||{...top,level:0}:null;
  const from=transition?.from?this.cached(transition.from,region,level,x,y):null;
  const exactPending=this.pending.has(`${entry.path}/${region}/${level}/${x}-${y}`)||this.queue.some(job=>job.key===`${entry.path}/${region}/${level}/${x}-${y}`);
  if(from&&(!best||(best.level<from.level&&exactPending))){this.fading=true;return [{...from,alpha:1}];}
  if(!best)return [];
  if(from){transition.start??=now;}
  const switching=from?fade(transition.start):1,arriving=best.born?fade(best.born):1;
  const under=switching<1?from:arriving<1?this.cached(entry.path,region,level,x,y,best.level):null;
  const alpha=Math.min(switching,arriving);
  if(!under||alpha>=1)return [{...best,alpha:1}];
  this.fading=true;return [{...under,alpha:1},{...best,alpha:ease(alpha)}];
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
