import {fractalRegion,unionEdges,edgeLoops} from './fractal-grid.mjs';
import {hex,world} from './geometry.mjs';
import {visibleTiles} from './tiling.mjs';
import {clip,area} from './felv.mjs';
const box=polygon=>({left:Math.min(...polygon.map(p=>p[0])),right:Math.max(...polygon.map(p=>p[0])),bottom:Math.min(...polygon.map(p=>p[1])),top:Math.max(...polygon.map(p=>p[1]))});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.bottom<b.top&&a.top>b.bottom;
const local=(p,t)=>{const a=-t.r*Math.PI/3,x=p[0]-t.x,y=p[1]-t.y;return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];};
export function pointInLoops(p,loops){
 let inside=false;
 for(const loop of loops)for(let i=0,j=loop.length-1;i<loop.length;j=i++){
  const a=loop[i],b=loop[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function makeGosperFractal(tiles,parents,tiling,{outlineOnly=false}={}){
 const leaves=parents.flatMap(t=>fractalRegion().leaves.map(poly=>poly.map(p=>world(p,t))));
 const outlineEdges=unionEdges(leaves),outline=edgeLoops(outlineEdges),bounds=box(outline.flat());
 if(outlineOnly)return {net:parents,outline,outlineEdges,gridParents:parents,leaves,bounds};
 const cells=leaves.map(polygon=>({polygon,bounds:box(polygon)}));
 const net=[];
 // Clip the existing map to the exact cell union. Barycentric attributes stay
 // attached to their source triangles, so terrain and geography do not warp.
 for(const t of visibleTiles(tiling,bounds)){
  const tileBounds=box(hex.map(p=>world(p,t)));
  const candidates=cells.filter(c=>overlaps(c.bounds,tileBounds)).map(c=>c.polygon.map(p=>local(p,t)));
  if(!candidates.length)continue;
  const drawPatches=[];
  for(const patch of tiles[t.id].patches)for(const polygon of candidates){
   const clipped=clip(patch.xy.map((p,i)=>[...p,...[0,1,2].map(j=>i===j?1:0)]),polygon);
   for(let i=1;i+1<clipped.length;i++){
    const tri=[clipped[0],clipped[i],clipped[i+1]];
    if(area(tri)<1e-12)continue;
    drawPatches.push({xy:tri.map(p=>p.slice(0,2)),weights:tri.map(p=>p.slice(2)),v:patch.v});
   }
  }
  if(drawPatches.length)net.push({...t,drawPatches});
 }
 return {net,outline,outlineEdges,gridParents:parents,leaves,bounds};
}
