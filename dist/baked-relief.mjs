import {styleOptions} from './map-options.mjs?v=topographic-1';
import {reliefRanges} from './relief.mjs?v=mobile-2';
export function bakedStyle(state,{source,treatment,tone},mobile=false,preferred='lifezones'){
 const options=styleOptions.filter(style=>style.source===source);
 if(mobile)return options.find(style=>style.id===preferred)||options[0]||null;
 return options.find(style=>style.controls['relief-treatment']===treatment&&style.controls['relief-tone']===tone&&reliefRanges.every(([key])=>Math.abs(state[key]-style.state[key])<1e-6))||null;
}
export const bakedStrength={off:0,style:1,gentle:.6,sculpted:1,dramatic:1.45};
export const bakedTints={warm:{shadow:[.40,.34,.49],light:[1,.94,.83]},neutral:{shadow:[.38,.44,.49],light:[1,1,1]},cool:{shadow:[.22,.32,.49],light:[.81,.89,1]}};
// At most two decoded layers, and no speculative downloads of other styles.
const layers=new Map();
export function loadBakedLayer(id,mobile=false){
 const url=`maps/lighting/${mobile?'mobile/':''}${id}.jpg`;
 if(!layers.has(url)){
  if(layers.size>=2)layers.delete(layers.keys().next().value);
  const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{if(layers.get(url)===promise)layers.delete(url);reject(Error('Precomputed lighting could not load'));};image.src=url;});layers.set(url,promise);
 }
 return layers.get(url);
}
