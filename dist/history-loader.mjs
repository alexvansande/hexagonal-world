// Loads one timeline period from dist/history: its Markdown (texts and spots),
// authored routes and generated strands, and the shared wave colours. Two-way
// routes expand into a reversed partner on the same lane; every strand gets its
// own sparse traffic timing. Fetched on demand, cached per period.
import {parsePeriod} from './tour-content.mjs?v=history-1';
import {tradeTraffic} from './tour-trade-traffic.mjs?v=frequency-1';
import {period as periodInfo} from './history/index.mjs?v=history-1';
const base=new URL('./history/',import.meta.url);
const cache=new Map();let wavesPromise=null;
export function loadWaves(){
 return wavesPromise||=fetch(new URL('waves.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Wave colours unavailable');return r.json();}).then(waves=>{
  // One colour per wave everywhere: publish them as CSS variables for routes and legends.
  if(typeof document!=='undefined'){const style=document.createElement('style');style.id='wave-colours';
   style.textContent=Object.entries(waves).map(([id,w])=>`.tour-routes [data-wave="${id}"],.tour-route-key [data-wave="${id}"]{--route-color:${w.color}}`).join('\n');document.head.append(style);}
  return waves;
 }).catch(error=>{wavesPromise=null;throw error;});
}
export const reverseRoute=(route,id=route.id+'-return')=>Object.freeze({...route,id,returnOf:route.id,coordinates:Object.freeze([...route.coordinates].reverse()),strands:route.strands&&Object.freeze(route.strands.map(s=>Object.freeze([...s].reverse())))});
export function assembleRoutes(authored,strands={}){
 const routes=[];
 for(const entry of authored){
  const forward={...entry,animated:true,lane:entry.lane||0,zoom:entry.zoom||0,coordinates:Object.freeze(entry.coordinates.map(Object.freeze)),strands:strands[entry.id]&&Object.freeze(strands[entry.id].map(s=>Object.freeze(s.map(Object.freeze))))};
  const pair=entry.twoWay?[forward,reverseRoute(forward)]:[forward];
  for(const route of pair){const seed=route.id,frequency=route.frequency||1;
   routes.push(Object.freeze({...route,traffic:route.strands?route.strands.map((_,i)=>tradeTraffic(`${seed}~${i}`,frequency/route.strands.length)):tradeTraffic(seed,frequency)}));}
 }
 return Object.freeze(routes);
}
export function loadPeriod(id){
 const info=periodInfo(id);
 if(cache.has(info.id))return cache.get(info.id);
 const promise=Promise.all([
  fetch(new URL(`${info.id}.md`,base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Period text unavailable');return r.text();}),
  fetch(new URL(`${info.id}.routes.json`,base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Period routes unavailable');return r.json();}),
  fetch(new URL(`${info.id}.strands.json`,base),{cache:'no-cache'}).then(r=>r.ok?r.json():{strands:{}}).catch(()=>({strands:{}})),
  loadWaves(),
 ]).then(([markdown,authored,sidecar,waves])=>{
  const text=parsePeriod(markdown),routes=assembleRoutes(authored,sidecar.strands||{});
  const spots=Object.values(text.spots).filter(s=>s.spot).map(s=>({id:s.id,title:s.title,latitude:s.spot[0],longitude:s.spot[1],view:s.view}));
  return Object.freeze({period:info,text,routes,spots,waves,stories:Object.freeze([...new Set(authored.map(r=>r.story))])});
 }).catch(error=>{cache.delete(info.id);throw error;});
 cache.set(info.id,promise);return promise;
}
