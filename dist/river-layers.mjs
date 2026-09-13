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
 const response=await fetch(url,{signal});if(!response.ok)throw Error('River data could not load');
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
