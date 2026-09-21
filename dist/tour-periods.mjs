// Shared chapter/period scaffolding for every dated story. Periods are editorial
// snapshots with their own route sets and Markdown; equal slider steps are not
// equal spans of years. Traffic timing is visual only and never a volume claim.
import {tradeTraffic} from './tour-trade-traffic.mjs?v=frequency-1';

// Opposite traffic on one corridor keeps the same signed lane: after reversal the
// perpendicular offset lands on the other side, so both directions stay visible.
export const reverseRoute=(route,id=route.id+'-return')=>Object.freeze({...route,id,returnOf:route.id,coordinates:Object.freeze([...route.coordinates].reverse())});
export const bothWays=routes=>routes.flatMap(route=>[route,reverseRoute(route)]);

export function definePeriods(tourId,periods,defaultId,{heading='Through time',seed=route=>route.id}={}){
 const list=Object.freeze(periods.map(period=>Object.freeze({
  ...period,storyId:`${tourId}-${period.id}`,
  waves:Object.freeze(period.waves||[...new Set(period.routes.map(route=>route.wave).filter(Boolean))]),
  routes:Object.freeze(period.routes.map(route=>Object.freeze({...route,animated:route.animated!==false,traffic:tradeTraffic(seed(route,period),route.frequency)}))),
 })));
 const fallback=list.find(period=>period.id===defaultId)||list[0];
 return Object.freeze({heading,periods:list,defaultId:fallback.id,periodFor:id=>list.find(period=>period.id===id)||fallback});
}
