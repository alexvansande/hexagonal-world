import {subgridLevels,rotateLocal} from './subgrid.mjs';
const corners=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
const key=p=>p.map(v=>Math.round(v*1e8)).join(',');
export const edgeKey=(a,b)=>[key(a),key(b)].sort().join('|');
export const cellPolygon=cell=>corners.map(p=>rotateLocal(p.map(v=>v*cell.scale),cell.angle).map((v,i)=>v+cell.center[i]));
// Every outline follows the smallest cells exactly. Opposite directed edges
// cancel; no convex hulls or larger regular hexagons approximate the union.
export function unionEdges(polygons){
 const edges=new Map();
 for(const polygon of polygons)for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],id=edgeKey(a,b);
  if(edges.has(id))edges.delete(id);else edges.set(id,[a,b]);
 }
 return [...edges.values()];
}
export function edgeLoops(edges){
 const outgoing=new Map(edges.map(([a,b])=>[key(a),[a,b]])),loops=[];
 while(outgoing.size){
  const first=outgoing.values().next().value,loop=[],start=key(first[0]);let current=first;
  do{loop.push(current[0]);outgoing.delete(key(current[0]));const next=key(current[1]);if(next===start)break;current=outgoing.get(next);if(!current)throw Error('Open fractal boundary');}while(loop.length<=edges.length);
  loops.push(loop);
 }
 return loops;
}
export const fractalOpacities=[.05,.1,.2,.4,.8];
let cached;
export function fractalRegion(){
 if(cached)return cached;
 const leaves=subgridLevels[3].map(cellPolygon),groups=[leaves.map(p=>[p])],outlines=[];
 for(let level=0;level<4;level++){
  if(level)groups.push(Array.from({length:groups[level-1].length/7},(_,i)=>groups[level-1].slice(i*7,i*7+7).flat()));
  outlines.push(groups[level].map(unionEdges));
 }
 // Assign each elementary edge to its strongest level, avoiding compounded ink.
 const strongest=new Map();outlines.forEach((groups,level)=>groups.flat().forEach(([a,b])=>strongest.set(edgeKey(a,b),{a,b,level})));
 cached={leaves,outlines,lines:Array.from({length:4},(_,level)=>[...strongest.values()].filter(e=>e.level===level).map(e=>[e.a,e.b])),boundary:edgeLoops(outlines[3][0])};
 return cached;
}
