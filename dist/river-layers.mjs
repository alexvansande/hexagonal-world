import {assetURL} from './asset-url.mjs';
// Lossless precomputed HydroRIVERS distances; only the selected level is loaded.
export const riverDischargeThresholds=[10000,5000,2000,1000,500,200,100,50,30,20,10,5];
export const riverLevel=value=>Math.max(1,Math.min(12,Math.round(Number(value)||1)));
export function paintRiverMask(distances,widthScale,rgba=new Uint8ClampedArray(distances.length*4),widths=null){
 const scale=Math.max(.5,Math.min(3,Number(widthScale)||1)),threshold=scale*64;
 for(let i=0;i<distances.length;i++){
  const p=i*4;rgba[p]=rgba[p+1]=rgba[p+2]=255;
  rgba[p+3]=distances[i]!==255&&distances[i]<=threshold?Math.round(255*Math.min(1,(widths?widths[i]/64:1)*scale)):0;
 }
 return rgba;
}
async function loadField(url,{signal}){
 const response=await fetch(assetURL(url),{signal});if(!response.ok)throw Error('River data could not load');
 const bitmap=await createImageBitmap(await response.blob());
 try{
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0);
  const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const distances=new Uint8Array(canvas.width*canvas.height),widths=new Uint8Array(distances.length);
  for(let i=0;i<distances.length;i++){distances[i]=rgba[i*4];widths[i]=rgba[i*4+1];}
  const field={width:canvas.width,height:canvas.height,distances,widths};canvas.width=canvas.height=1;return field;
 }finally{bitmap.close();}
}
export class RiverFields{
 constructor({mobile=false,load=loadField}={}){this.mobile=mobile;this.load=load;this.cached=null;this.pending=null;}
 clear(){this.pending?.controller.abort();this.pending=null;this.cached=null;}
 async get(value){
  const level=riverLevel(value);
  // Cancel obsolete downloads even when returning to an already cached level.
  if(this.pending&&this.pending.level!==level){this.pending.controller.abort();this.pending=null;}
  if(this.cached?.level===level)return this.cached;
  if(this.pending?.level===level)return this.pending.promise;
  const controller=new AbortController(),request={level,controller};
  this.pending=request;
  request.promise=(async()=>{
   try{
    const field=await this.load(`maps/hydrorivers/v2/${this.mobile?'mobile':'desktop'}/level-${level}.png`,{signal:controller.signal});
    if(this.pending!==request||controller.signal.aborted)throw new DOMException('Superseded river level','AbortError');
    this.cached={...field,level};return this.cached;
   }finally{if(this.pending===request)this.pending=null;}
  })();
  return request.promise;
 }
}

// Pack the two native field channels directly for a live GPU upload. The
// temporary packed array can be collected immediately after texImage2D.
export function packRiverField(field,maxWidth=Infinity){
 const width=Math.min(field.width,maxWidth),height=Math.max(1,Math.round(field.height*width/field.width)),data=new Uint8Array(width*height*2);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const source=Math.min(field.height-1,Math.floor((y+.5)*field.height/height))*field.width+Math.min(field.width-1,Math.floor((x+.5)*field.width/width)),i=(y*width+x)*2;
  data[i]=field.distances[source];data[i+1]=field.widths?.[source]??64;
 }
 return {width,height,data};
}
export const riverFieldGLSL=`
uniform int riverField;uniform vec2 riverSize;uniform float riverWidthScale;
float fieldCoverage(vec2 uv){vec4 value=texture2D(riverMap,uv);float d=floor(value.r*255.+.5),width=floor(value.a*255.+.5);return d<254.5&&d<=riverWidthScale*64.?floor(255.*min(1.,width/64.*riverWidthScale)+.5)/255.:0.;}
float riverCoverage(vec2 uv){
 if(riverField==0)return texture2D(riverMap,uv).a;
 // Match the old LINEAR-filtered painted mask: threshold each texel before
 // interpolation, instead of changing the river's width by filtering distances.
 vec2 p=uv*riverSize-.5,base=(floor(p)+.5)/riverSize,f=fract(p),step=1./riverSize;
 return mix(mix(fieldCoverage(base),fieldCoverage(base+vec2(step.x,0.)),f.x),mix(fieldCoverage(base+vec2(0.,step.y)),fieldCoverage(base+step),f.x),f.y);
}`;
