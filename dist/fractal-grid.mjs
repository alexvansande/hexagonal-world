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
export const fractalFineScale=1/7;
export function fineFractalTiles(bounds){
 const s=fractalFineScale,dx=1.5*s,dy=Math.sqrt(3)*s,pad=1.02*s,tiles=[];
 for(let q=Math.ceil((bounds.left-pad)/dx);q<=Math.floor((bounds.right+pad)/dx);q++){
  for(let r=Math.ceil((bounds.bottom-pad)/dy-q/2);r<=Math.floor((bounds.top+pad)/dy-q/2);r++)tiles.push({x:q*dx,y:dy*(r+q/2),r:0});
 }
 return tiles;
}
// Reveal the next, smaller copy over the zoom range where it becomes useful.
// A factor of seven brings the fine copy to the same screen scale.
export function fractalZoomBlend(zoom=1){
 const z=Math.max(1,Number(zoom)||1);
 return Math.max(0,Math.min(1,Math.log(z)/Math.log(7)));
}
// Preserve the original hierarchy at every zoom; fade whole grids instead.
export function fractalLevelOpacities(){return fractalOpacities;}
export function fractalGridWeights(zoom=1){
 const fine=fractalZoomBlend(zoom);
 const large=1-Math.max(0,Math.min(1,Math.log(Math.max(2,zoom)/2)/Math.log(9/2)));
 return {large,fine};
}
export function fractalDetailPlan(zoom=1){
 // The two grids overlap in scale. Use one representative per size, ordered
 // from coarse to fine, rather than drawing duplicate hierarchy levels.
 const levels=[['large',3],['large',2],['large',1],['fine',2],['fine',1],['fine',0]];
 const center=Math.min(4,1+Math.log(Math.max(1,zoom))/Math.log(Math.sqrt(7)));
 const plan={large:[0,0,0,0,0],fine:[0,0,0,0,0]};
 levels.forEach(([grid,level],i)=>{
  const t=Math.max(0,Math.min(1,1.5-Math.abs(i-center)));
  plan[grid][level]=fractalOpacities[level]*t*t*(3-2*t);
 });
 return plan;
}
let cached;
export function fractalEdgeOwners(opacities){
 // An edge on a parent boundary also belongs to every finer outline.
 // Give it to the brightest visible claimant, including when its original
 // parent level is hidden. This keeps outlines closed without double ink.
 return Array.from({length:4},(_,source)=>{
  let owner=-1;
  for(let level=0;level<=source;level++)if(opacities[level]>0&&(owner<0||opacities[level]>opacities[owner]))owner=level;
  return owner;
 });
}
export function visibleFractalLines(opacities){
 const owners=fractalEdgeOwners(opacities),lines=Array.from({length:4},()=>[]);
 fractalRegion().lines.forEach((edges,source)=>{if(owners[source]>=0)lines[owners[source]].push(...edges);});
 return lines;
}
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
