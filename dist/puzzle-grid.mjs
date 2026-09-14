import {hex,world,matching} from './geometry.mjs';
import {clip,area} from './felv.mjs';
import {subgridLevels} from './subgrid.mjs';
import {cellPolygon,edgeKey,edgeLoops} from './fractal-grid.mjs';
const EPS=1e-7;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clean=p=>p.filter((a,i)=>distance(a,p[(i+1)%p.length])>EPS);
// Use precisely the same alternating rotations and centers as the hex/Gosper grid.
export function puzzleCells(count=28){return subgridLevels[count===196?2:1].map(cellPolygon);}
function baseEdges(cells){const edges=new Map();for(const cell of cells)for(let i=0;i<6;i++){const a=cell[i],b=cell[(i+1)%6],key=edgeKey(a,b);if(edges.has(key))edges.get(key).uses++;else edges.set(key,{a,b,uses:1});}return edges;}
const connectorCatalogs=new WeakMap();
const hash=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function connectorCatalog(tiles,count){
 let cache=connectorCatalogs.get(tiles);if(!cache){cache=new Map();connectorCatalogs.set(tiles,cache);}if(cache.has(count))return cache.get(count);
 const base=baseEdges(puzzleCells(count)),regions=tiles.map(({id})=>{
  const partners=new Map();
  for(let e=0;e<6;e++){const n=neighbor(tiles,id,e);for(const edge of base.values())if(edge.uses===1)partners.set(edgeKey(world(edge.a,n),world(edge.b,n)),`${n.id}:${edgeKey(edge.a,edge.b)}`);}
  return new Map([...base].map(([key,edge])=>{const own=`${id}:${key}`,partner=edge.uses===1?partners.get(key):null,identity=partner?[own,partner].sort().join('|'):own;return [key,{identity,reverse:!!partner&&own>partner,boundary:edge.uses===1}];}));
 });
 const identities=[...new Set(regions.flatMap(r=>[...r.values()].map(e=>e.identity)))].sort((a,b)=>hash(a)-hash(b)||a.localeCompare(b));
 const profiles=new Map(identities.map((identity,index)=>{
  const h=hash(identity),random=shift=>((h>>>shift)&255)/255;
  // Unique depths are assigned without hashing collisions. Other dimensions
  // vary independently, making the differences visible as well as exact.
  return [identity,{depth:.16+.12*(index+.5)/identities.length,width:.8+.4*random(0),center:.43+.14*random(8),lean:-.3+.6*random(16),sign:h&1?1:-1}];
 }));
 const result={regions,profiles};cache.set(count,result);return result;
}
// Positive bulges to the right of the directed (counterclockwise) edge.
export function connector(a,b,sign=1,profile={depth:.22,width:1,center:.5,lean:0}){
 const dx=b[0]-a[0],dy=b[1]-a[1],point=(x,y)=>{const u=profile.center+(x-.5)*profile.width+profile.lean*y,v=y*profile.depth/.22;return [a[0]+dx*u+dy*v*sign,a[1]+dy*u-dx*v*sign];};
 const result=[a,point(.32,0)];
 const curves=[[[.40,0],[.43,-.01],[.42,.055]],[[.30,.22],[.70,.22],[.58,.055]],[[.57,-.01],[.60,0],[.68,0]]];
 let start=[.32,0];
 for(const [c,d,end] of curves){for(let i=1;i<=8;i++){const t=i/8,s=1-t;result.push(point(...[0,1].map(k=>s*s*s*start[k]+3*s*s*t*c[k]+3*s*t*t*d[k]+t*t*t*end[k])));}start=end;}
 result.push(b);return result;
}
export function puzzleRegion(tiles,id,count=28){
 const cells=puzzleCells(count),edges=new Map(),polygons=[],catalog=connectorCatalog(tiles,count);
 for(const cell of cells){const polygon=[];
  for(let i=0;i<cell.length;i++){const a=cell[i],b=cell[(i+1)%cell.length],key=edgeKey(a,b);let edge=edges.get(key);
   if(!edge){const {identity,reverse,boundary}=catalog.regions[id].get(key),profile=catalog.profiles.get(identity);
    // Generate in the canonical partner's direction, then reverse the points.
    // This preserves asymmetric tabs exactly on the mating piece.
    const points=reverse?connector(b,a,profile.sign,profile).reverse():connector(a,b,profile.sign,profile);
    edge={a,b,points,boundary,identity};edges.set(key,edge);
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
