import {hex,world} from './geometry.mjs';
import {sphereAt} from './globe-drag.mjs';
const H=Math.sqrt(3)/2,rotate=(p,r)=>{const a=r*Math.PI/3;return [p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];};
export const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
// Convex polygon clipping, retaining original barycentric coordinates as attributes.
export function clip(input,boundary){let poly=input;for(let j=0;j<boundary.length;j++){const a=boundary[j],b=boundary[(j+1)%boundary.length],side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=side(p),e=side(q);if(d>=-1e-9)out.push(p);if((d<0)!==(e<0)){const t=d/(d-e);out.push(p.map((v,k)=>v+t*(q[k]-v)));}}poly=out;}return poly;}
function piece(tile,indices){
 // Indices refer to the diagram's world-facing corners, not the region's rotation.
 const polygon=indices.map(i=>rotate(i===6?[0,0]:hex[i],-tile.r));
 return {...tile,polygon,opacity:1,bad:Array(6).fill(false)};
}
function turn(piece,pivot,r){const p=rotate([piece.x-pivot[0],piece.y-pivot[1]],r);return {...piece,x:pivot[0]+p[0],y:pivot[1]+p[1],r:piece.r+r};}
function placements(piece,target){const source=piece.polygon.map(p=>world(p,piece)),out=[];for(let r=0;r<6;r++)for(const dest of target){const start=rotate(source[0],r),offset=[dest[0]-start[0],dest[1]-start[1]];const moved=source.map(p=>{const q=rotate(p,r);return [q[0]+offset[0],q[1]+offset[1]];});if(moved.every(p=>target.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-7))){const c=rotate([piece.x,piece.y],r);out.push({...piece,x:c[0]+offset[0],y:c[1]+offset[1],r:piece.r+r});}}return out;}
export function seams(tiles,net){const result=[];for(let i=0;i<net.length;i++)for(let j=0;j<i;j++){const a=net[i],b=net[j],pa=a.polygon.map(p=>world(p,a)),pb=b.polygon.map(p=>world(p,b));for(let e=0;e<pa.length;e++)for(let f=0;f<pb.length;f++){const p=pa[e],q=pa[(e+1)%pa.length],u=pb[f],v=pb[(f+1)%pb.length],dx=q[0]-p[0],dy=q[1]-p[1],l=dx*dx+dy*dy;if(l<1e-12)continue;const cross=t=>dx*(t[1]-p[1])-dy*(t[0]-p[0]);if(Math.abs(cross(u))+Math.abs(cross(v))>1e-7)continue;const at=t=>((t[0]-p[0])*dx+(t[1]-p[1])*dy)/l,lo=Math.max(0,Math.min(at(u),at(v))),hi=Math.min(1,Math.max(at(u),at(v)));if(hi-lo<1e-7)continue;const point=t=>[p[0]+dx*t,p[1]+dy*t];let error=0;for(let k=0;k<=12;k++){const xy=point(lo+(hi-lo)*k/12),va=sphereAt(xy,a,tiles[a.id]),vb=sphereAt(xy,b,tiles[b.id]);if(!va||!vb){error=Infinity;break;}error=Math.max(error,Math.hypot(...va.map((x,k)=>x-vb[k])));}result.push({a:point(lo),b:point(hi),error});}}return result;}
export function makeFelv(tiles,fuller){
 const [green,blue,pink,yellow]=fuller;
 const fixed=[piece(green,[0,1,2,3,4]),piece(blue,[0,2,3,4,5]),piece(pink,[0,1,2,3,4,5]),piece(yellow,[0,1,2,3])];
 fixed.push(turn(piece(blue,[0,1,2]),[-.5,H],-2));
 fixed.push(turn(piece(green,[0,4,5]),[1,0],2));
 const triangles=placements(piece(yellow,[3,4,6]),[[2,2*H],[2.5,H],[3,2*H]]);
 const diamonds=placements(piece(yellow,[6,4,5,0]),[[2,0],[2.5,-H],[3,0],[2.5,H]]);
 let net,best=Infinity;
 for(const triangle of triangles)for(const diamond of diamonds){const candidate=[...fixed,triangle,diamond],score=seams(tiles,candidate).reduce((s,e)=>s+e.error,0);if(score<best){best=score;net=candidate;}}
 if(!net)throw Error('Felv pieces could not be placed');
 for(const t of net){t.drawPatches=[];for(const patch of tiles[t.id].patches){const p=clip(patch.xy.map((xy,i)=>[...xy,...[0,1,2].map(j=>i===j?1:0)]),t.polygon);for(let i=1;i+1<p.length;i++){const tri=[p[0],p[i],p[i+1]];if(area(tri)>1e-10)t.drawPatches.push({xy:tri.map(p=>p.slice(0,2)),weights:tri.map(p=>p.slice(2)),v:patch.v});}}}
 return {net,seams:seams(tiles,net)};
}
