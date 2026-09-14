import {hex,world,matching} from './geometry.mjs';
import {clip,area} from './felv.mjs';
import {edgeKey,edgeLoops} from './fractal-grid.mjs';
const EPS=1e-7;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clean=p=>p.filter((a,i)=>distance(a,p[(i+1)%p.length])>EPS);
// Seven nonempty Voronoi cells, symmetric under the parent's edge reflections.
function seven(polygon){
 const center=[0,1].map(k=>polygon.reduce((s,p)=>s+p[k],0)/polygon.length);
 const radius=Math.min(...polygon.map((a,i)=>Math.abs(cross(a,polygon[(i+1)%polygon.length],center))/distance(a,polygon[(i+1)%polygon.length])))*.9;
 const seeds=[center,...hex.map(p=>p.map((v,k)=>center[k]+v*radius))];
 return seeds.map(a=>{
  let p=polygon;
  for(const b of seeds){if(a===b)continue;const n=b.map((v,k)=>v-a[k]),mid=a.map((v,k)=>(v+b[k])/2),out=[];
   const side=q=>n.reduce((s,v,k)=>s+v*(q[k]-mid[k]),0);
   for(let i=0;i<p.length;i++){const u=p[i],v=p[(i+1)%p.length],d=side(u),e=side(v);if(d<=EPS)out.push(u);if((d<0)!==(e<0)){const t=d/(d-e);out.push(u.map((x,k)=>x+t*(v[k]-x)));}}p=clean(out);
  }return p;
 });
}
export function puzzleCells(count=28){
 let cells=seven(hex);if(count===196)cells=cells.flatMap(seven);
 // Split T junctions before adding tabs: each physical segment has one curve.
 const vertices=cells.flat();
 return cells.map(poly=>poly.flatMap((a,i)=>{const b=poly[(i+1)%poly.length],l=distance(a,b),points=vertices.filter(p=>Math.abs(cross(a,b,p))<EPS*l&&distance(a,p)+distance(p,b)<l+EPS).sort((p,q)=>distance(a,p)-distance(a,q));return points.filter((p,j)=>distance(p,b)>EPS&&(!j||distance(p,points[j-1])>EPS));}));
}
const boundaryEdge=(a,b)=>hex.findIndex((p,i)=>Math.abs(cross(p,hex[(i+1)%6],a))<EPS&&Math.abs(cross(p,hex[(i+1)%6],b))<EPS);
// Positive bulges to the right of the directed (counterclockwise) edge.
export function connector(a,b,sign=1){
 const dx=b[0]-a[0],dy=b[1]-a[1],point=(x,y)=>[a[0]+dx*x+dy*y*sign,a[1]+dy*x-dx*y*sign];
 const result=[a,point(.32,0)];
 const curves=[[[.40,0],[.43,-.01],[.42,.055]],[[.30,.22],[.70,.22],[.58,.055]],[[.57,-.01],[.60,0],[.68,0]]];
 let start=[.32,0];
 for(const [c,d,end] of curves){for(let i=1;i<=8;i++){const t=i/8,s=1-t;result.push(point(...[0,1].map(k=>s*s*s*start[k]+3*s*s*t*c[k]+3*s*t*t*d[k]+t*t*t*end[k])));}start=end;}
 result.push(b);return result;
}
export function puzzleRegion(tiles,id,count=28){
 const cells=puzzleCells(count),edges=new Map(),polygons=[];
 for(const cell of cells){const polygon=[];
  for(let i=0;i<cell.length;i++){const a=cell[i],b=cell[(i+1)%cell.length],key=edgeKey(a,b);let edge=edges.get(key);
   if(!edge){const e=boundaryEdge(a,b);let sign;
    if(e>=0){const pair=matching(tiles,id,e);sign=id*6+e<pair.id*6+pair.e?1:-1;}
    else {let hash=0;for(const ch of key)hash=(hash*31+ch.charCodeAt(0))|0;sign=hash&1?1:-1;}
    edge={a,b,points:connector(a,b,sign),boundary:e>=0};edges.set(key,edge);
   }
   const path=distance(a,edge.a)<EPS?edge.points:[...edge.points].reverse();polygon.push(...path.slice(0,-1));
  }polygons.push(polygon);
 }
 const boundary=[...edges.values()].filter(e=>e.boundary);
 const outline=edgeLoops(boundary.flatMap(e=>e.points.slice(0,-1).map((p,i)=>[p,e.points[i+1]])))[0];
 return {polygons,edges:[...edges.values()],outline};
}
// Ear clipping keeps concave sockets intact; a triangle fan would fill them in.
export function triangulate(polygon){
 const p=clean(polygon).filter((a,i,arr)=>Math.abs(cross(arr[(i+arr.length-1)%arr.length],a,arr[(i+1)%arr.length]))>1e-10),triangles=[];
 while(p.length>3){let found=false;for(let i=0;i<p.length;i++){const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];if(cross(a,b,c)<=1e-12)continue;
  if(p.some(q=>q!==a&&q!==b&&q!==c&&cross(a,b,q)>=-1e-12&&cross(b,c,q)>=-1e-12&&cross(c,a,q)>=-1e-12))continue;
  triangles.push([a,b,c]);p.splice(i,1);found=true;break;
 }if(!found)throw Error('Puzzle boundary could not be triangulated');}
 if(p.length===3)triangles.push(p);return triangles;
}
export function neighbor(tiles,id,e){const pair=matching(tiles,id,e),angle=(e+.5)*Math.PI/3;return {id:pair.id,r:(e+3-pair.e+6)%6,x:Math.sqrt(3)*Math.cos(angle),y:Math.sqrt(3)*Math.sin(angle)};}
export function puzzleArtwork(tiles,id,region){
 const triangles=triangulate(region.outline),sources=[{id,r:0,x:0,y:0},...hex.map((_,e)=>neighbor(tiles,id,e))],result=[];
 const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[0])),Math.max(...p.map(v=>v[1]))];
 const cuts=triangles.map(p=>({p,b:bounds(p)}));
 // Copy neighboring source triangles with their original spherical attributes.
 // Region coordinates are retained too, for categorical maps and rivers.
 for(const source of sources)for(const patch of tiles[source.id].patches){
  const input=patch.xy.map((p,i)=>[...world(p,source),...[0,1,2].map(j=>i===j?1:0),...p]),b=bounds(input);
  for(const cut of cuts){if(b[0]>cut.b[2]||b[2]<cut.b[0]||b[1]>cut.b[3]||b[3]<cut.b[1])continue;
   const p=clip(input,cut.p);for(let i=1;i+1<p.length;i++){const t=[p[0],p[i],p[i+1]];if(area(t)<1e-12)continue;result.push({xy:t.map(p=>p.slice(0,2)),weights:t.map(p=>p.slice(2,5)),regionXY:t.map(p=>p.slice(5,7)),regionId:source.id,v:patch.v});}
  }
 }return result;
}
