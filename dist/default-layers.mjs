import {assetURL} from './asset-url.mjs';
import manifest from './maps/default-layers/manifest.mjs?v=lighting-comparison-3';
import {layoutOptions,styleOptions} from './map-options.mjs?v=lifezones-shadows-3';
import {PrecomputedSurfaces} from './precomputed-surfaces.mjs?v=cloud-assets-1';
import {ProjectedLighting,lightingPlan} from './projected-lighting.mjs?v=performance-1';
const shapeKeys=['method','arrangement','lon','lat','roll','bias','height','gridRotation'];
const paintKeys=['riverWidth','riverLevels','reliefColorFade','distortionOpacity'];
const controlKeys=['map-source','palette','rivers-visible','river-color','relief-enabled','lighting-preset','relief-treatment','relief-tone','graticule','distortion','land-classes','ocean-classes'];
const same=(a,b)=>typeof a==='number'?Math.abs(a-Number(b))<1e-9:a===b;
export function defaultLayerPreset(state,controls){
 if(controls.puzzlegrid||controls.interpolation!=='0')return null;
 const layout=layoutOptions.find(l=>shapeKeys.every(k=>same(state[k],l.state[k])));if(!layout)return null;
 for(const style of styleOptions){const entry=manifest.entries[`${layout.arrangement}/${style.id}`];if(!entry)continue;
  const signature=entry.signature;
  if(signature.controls['relief-treatment']==='land'&&signature.controls['relief-enabled']&&controls['background-color']!==signature.controls['background-color'])continue;
  if(paintKeys.every(k=>same(state[k],signature.state[k]))&&controlKeys.every(k=>same(controls[k],signature.controls[k])))return entry;
 }
 return null;
}
export const imageVertex=`attribute vec2 position;attribute vec2 regionPosition;attribute float opacity;varying vec2 localPosition;varying vec2 flatPosition;varying float tileAlpha;uniform vec2 size;uniform vec3 view;uniform float gridRotation;
void main(){localPosition=regionPosition;flatPosition=position;tileAlpha=opacity;float c=cos(gridRotation),s=sin(gridRotation);vec2 p=(vec2(c*position.x-s*position.y,s*position.x+c*position.y)*view.x+view.yz)/size*2.;gl_Position=vec4(p.x,-p.y,0.,1.);}`;
export const imageFragment=`precision highp float;varying vec2 localPosition;varying vec2 flatPosition;varying float tileAlpha;uniform sampler2D map;uniform vec4 bakedRect;uniform int felvClip;
void main(){if(felvClip==1){float y=-flatPosition.y;float x=flatPosition.x-sqrt(3.)*y;if(y<0.||y>sqrt(3.)||x< -1.||x>5.)discard;}vec2 at=(localPosition-bakedRect.xy)/bakedRect.zw;at.y=1.-at.y;gl_FragColor=vec4(texture2D(map,(at*256.+1.)/258.).rgb*tileAlpha,tileAlpha);}`;
// Map and lighting level numbers describe different extents. Compare pixels
// per map unit, never their level numbers. The temporary tiles are exact-density
// downsampled copies, so the test doesn't exaggerate blur by rounding down a level.
export function lightingDetailSelection(entry,view,capToBase=false){
 const info=entry.lighting,plan=lightingPlan(info.rect,{...view,repeat:info.repeat,maxSize:2200});
 const level=Math.min(info.detailLevel||0,plan.level),density=2200/Math.max(info.rect[2],info.rect[3])*2**level;
 const capped=Boolean(capToBase&&info.mapResolution&&density>info.mapResolution.density);
 return {level:capped?'map':level,density:capped?info.mapResolution.density:density,originalDensity:density,capped};
}
export class DefaultLayers{
 constructor(gl,redraw){this.gl=gl;this.maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);this.redraw=redraw;this.detail=new PrecomputedSurfaces(gl,redraw,{root:'maps/default-layers',extension:'png',bitmapOptions:{imageOrientation:'flipY'}});this.base=new PrecomputedSurfaces(gl,redraw,{root:'maps/default-layers',extension:'png'});this.lights=new Map();this.pending=new Map();this.failures=new Map();this.attempts=new Map();this.timers=new Map();this.required=new Set();this.compositor=null;this.disposed=false;}
 prepare(entry){this.entry=entry;this.required=new Set();for(const [key,c] of this.pending)if(!key.startsWith(entry.path+'/'))c.abort();for(const key of this.failures.keys())if(!key.startsWith(entry.path+'/')){this.failures.delete(key);this.attempts.delete(key);clearTimeout(this.timers.get(key));this.timers.delete(key);}}
 lighting(entry,unit,dpr,width,height,panX,panY,{capToBase=false,compareHighest=false}={}){
  if(!entry.lighting){this.detail.setRequired(new Set());return null;}
  if(!entry.lighting.mapResolution){capToBase=false;compareHighest=false;}
  const info=entry.lighting,maxLevel=Math.min(info.maxLevel,info.maxLevel+Math.floor(Math.log2(this.maxTextureSize/Math.max(info.width,info.height)))),target=Math.min(maxLevel,Math.max(0,Math.ceil(Math.log2(unit*dpr*Math.max(info.rect[2],info.rect[3])/Math.max(info.width,info.height)))+info.maxLevel));
  const pair=level=>[0,1].map(i=>`${entry.path}/light/${i}/preview-${level}`);
  for(const key of [...pair(0),...pair(target)])this.required.add(key);
  const preview=pair(0).map(key=>this.light(key));
  if(preview.some(x=>!x))return null;
  const detail=pair(target).map(key=>this.light(key));
  return {...info,textures:detail.every(Boolean)?detail:preview,details:this.lightingDetail(entry,{unit,dpr,width,height,panX,panY},capToBase,compareHighest)};
 }
 light(key){
  if(this.lights.has(key)){const t=this.lights.get(key);this.lights.delete(key);this.lights.set(key,t);return t;}
  if(this.pending.has(key)||this.failures.has(key))return null;
  const c=new AbortController();this.pending.set(key,c);
  fetch(assetURL(`maps/default-layers/${key}.png`),{signal:c.signal}).then(r=>{if(!r.ok)throw Error(r.status);return r.blob();}).then(blob=>createImageBitmap(blob,{imageOrientation:'flipY'})).then(image=>{
   if(this.disposed||c.signal.aborted){image.close();return;}
   const g=this.gl,t=g.createTexture();g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,t);for(const n of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,n,g.LINEAR);for(const n of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,n,g.CLAMP_TO_EDGE);
   g.texImage2D(g.TEXTURE_2D,0,g.RGB,g.RGB,g.UNSIGNED_BYTE,image);image.close();this.lights.set(key,t);
   for(const [old,texture] of this.lights){if(this.lights.size<=4)break;if(this.required.has(old))continue;g.deleteTexture(texture);this.lights.delete(old);}
  }).catch(e=>{if(e.name==='AbortError'||this.disposed)return;const n=(this.attempts.get(key)||0)+1;this.attempts.set(key,n);this.failures.set(key,n);if(n<3)this.timers.set(key,setTimeout(()=>{this.timers.delete(key);if(!this.required.has(key))return;this.failures.delete(key);this.redraw();},600*2**(n-1)));}).finally(()=>{this.pending.delete(key);if(!this.disposed)this.redraw();});return null;
 }
 lightingDetail(entry,view,capToBase=false,compareHighest=false){
  const info=entry.lighting;if(!info.detailLevel){this.detail.setRequired(new Set());return [];}
  const selection=lightingDetailSelection(entry,view,false);let level=compareHighest?info.detailLevel:selection.level;
  if(!level){this.comparison=selection;this.detail.setRequired(new Set());return [];}
  const {unit,width,height,panX,panY}=view,angle=info.repeat?info.angle:0,c=Math.cos(angle),s=Math.sin(angle),corners=[];
  for(const x of [-width/2-panX,width/2-panX])for(const y of [-height/2-panY,height/2-panY])corners.push([(c*x+s*y)/unit,(-s*x+c*y)/unit]);
  const bounds=[Math.min(...corners.map(p=>p[0])),Math.min(...corners.map(p=>p[1])),Math.max(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[1]))];
  const collect=l=>{
   const [left,top,rw,rh]=info.rect,density=l==='map'?info.mapResolution.density:2200/Math.max(rw,rh)*2**l,tw=l==='map'?info.mapResolution.width:Math.round(rw*density),th=l==='map'?info.mapResolution.height:Math.round(rh*density),result=[];
   const qx=info.repeat?[Math.floor((bounds[0]-left)/rw),Math.floor((bounds[2]-left)/rw)]:[0,0],qy=info.repeat?[Math.floor((bounds[1]-top)/rh),Math.floor((bounds[3]-top)/rh)]:[0,0];
   for(let q=qx[0];q<=qx[1];q++)for(let r=qy[0];r<=qy[1];r++){
    const x0=Math.max(0,Math.floor((bounds[0]-left-q*rw)*density/256)),x1=Math.min(Math.ceil(tw/256)-1,Math.floor((bounds[2]-left-q*rw)*density/256));
    const y0=Math.max(0,Math.floor((bounds[1]-top-r*rh)*density/256)),y1=Math.min(Math.ceil(th/256)-1,Math.floor((bounds[3]-top-r*rh)*density/256));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)result.push({x,y,rect:[left+q*rw+x*256/density,top+r*rh+y*256/density,Math.min(256,tw-x*256)/density,Math.min(256,th-y*256)/density],density});
   }return result;
  };
  // Select a common reference that fits the budget BEFORE applying the cap.
  // Otherwise the original could drop a level while the capped version stays
  // sharper, reversing the comparison on large displays.
  const budget=compareHighest?384:120;this.detail.budget=budget;
  const count=tiles=>new Set(tiles.map(t=>t.x+'/'+t.y)).size*2;
  let tiles=collect(level);while(level>1&&count(tiles)>budget)tiles=collect(--level);
  const originalDensity=2200/Math.max(info.rect[2],info.rect[3])*2**level;
  const capped=Boolean(capToBase&&info.mapResolution&&originalDensity>info.mapResolution.density);
  if(capped){level='map';tiles=collect(level);}
  this.comparison={level,originalDensity,density:capped?info.mapResolution.density:originalDensity,capped,limited:compareHighest&&originalDensity<2200/Math.max(info.rect[2],info.rect[3])*2**info.detailLevel};
  if(count(tiles)>budget){this.comparison.budgetFallback=true;this.detail.setRequired(new Set());return [];}
  const path=entry.path+'/detail';this.detail.setRequired(new Set(tiles.flatMap(t=>[0,1].map(i=>`${path}/${i}/${level}/${t.x}-${t.y}`))));
  const result=[];for(const tile of tiles){const textures=[0,1].map(i=>this.detail.tile({path},i,level,tile.x,tile.y));if(textures.every(Boolean))result.push({...tile,textures:textures.map(t=>t.texture),repeat:info.repeat,angle:info.angle});}
  return result;
 }
 composite(entry,width,height,unit,panX,panY,dark,light){
  if(!this.compositor)this.compositor=new ProjectedLighting(this.gl);this.compositor.composite(entry,width,height,unit,panX,panY,dark,light);
  for(const tile of entry.details||[]){const [x,y,w,h]=tile.rect,angle=tile.repeat?tile.angle:0,c=Math.cos(angle),s=Math.sin(angle),point=(x,y)=>[(unit*(c*x-s*y)+panX)*2/width,-(unit*(s*x+c*y)+panY)*2/height];const a=point(x,y),b=point(x+w,y),d=point(x,y+h),e=point(x+w,y+h),g=1/tile.density;
   this.compositor.composite({...tile,rect:[x-g,y-g,w+2*g,h+2*g]},width,height,unit,panX,panY,dark,light,{capture:false,quad:new Float32Array([...a,...b,...d,...d,...b,...e])});
  }
 }
 retry(){this.detail.retry();this.base.retry();this.failures.clear();this.attempts.clear();for(const t of this.timers.values())clearTimeout(t);this.timers.clear();this.redraw();}
 dispose(){this.disposed=true;this.detail.dispose();this.base.dispose();for(const c of this.pending.values())c.abort();for(const t of this.timers.values())clearTimeout(t);for(const t of this.lights.values())this.gl.deleteTexture(t);this.lights.clear();this.compositor?.dispose();}
}

// Graticule widths are screen-space values, so these inexpensive vector lines
// stay sharp at arbitrary zoom. No terrain, river or ecology work is included.
export function graticuleFragment(projection){return `#extension GL_OES_standard_derivatives : enable
precision highp float;varying vec2 localPosition;varying float regionIndex;varying vec2 flatPosition;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;
uniform vec3 angles;uniform float bias;uniform float blend;uniform float grid;uniform float gridWidth;uniform vec3 gridColor;uniform int felvClip;
${projection}
void main(){if(felvClip==1){float y=-flatPosition.y;float x=flatPosition.x-sqrt(3.)*y;if(y<0.||y>sqrt(3.)||x< -1.||x>5.)discard;}
vec2 uv=geographicUV(mapSphere(localPosition,regionIndex,weights,a,b,c,bias,blend),angles);float lon=(uv.x-.5)*6.28318530718,lat=(.5-uv.y)*3.14159265359;
float lo=abs(mod(lon+grid*.5,grid)-grid*.5)*max(.12,cos(lat)),la=abs(mod(lat+grid*.5,grid)-grid*.5);
gl_FragColor=vec4(gridColor,(1.-smoothstep(gridWidth*.4,gridWidth,min(lo,la)))*.35);}`;}
