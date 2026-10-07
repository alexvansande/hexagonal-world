// Pieces = whole level-1 / level-2 Gosper cells from the app's subgrid hierarchy.
import {readFileSync} from 'node:fs';
const R='/home/user/hexagonal-world/dist/';
const {makeGeometry,layouts,hex,world,norm}=await import(R+'geometry.mjs');
const {makeArrangement}=await import(R+'arrangements.mjs');
const {subgridLevels,nestedHexLevels}=await import(R+'subgrid.mjs');
const deepLevels=nestedHexLevels(4);
const {cellPolygon}=await import(R+'fractal-grid.mjs');
const {neighbor}=await import(R+'puzzle-grid.mjs');
const {rotation}=await import(R+'optimizer.mjs');
export const tiles=makeGeometry('rhombic',1.5);
export const net=makeArrangement(tiles,'dymaxion',layouts(tiles)).net;
export const DEFAULT=process.env.ANGLES?JSON.parse(process.env.ANGLES):{lon:-170.01889457926154,lat:32.99273576349003,roll:-13.384930707514286};
const rot=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
// Tile-local point -> unit sphere, crossing into the correctly rotated neighbour
// when a Gosper cell bulges past its parent's straight edge (as puzzleArtwork does).
function patchSphere(id,p){
 for(const patch of tiles[id].patches){const [a,b,c]=patch.xy;
  const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/det,v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/det,w=[u,v,1-u-v];
  if(w.every(x=>x>=-1e-9))return norm([0,1,2].map(j=>patch.v.reduce((s,q,i)=>s+q[j]*w[i],0)));
 }return null;
}
export function localSphere(id,p){
 const inside=patchSphere(id,p);if(inside)return inside;
 const e=((Math.floor(Math.atan2(p[1],p[0])/(Math.PI/3))%6)+6)%6; // edge e spans corners e..e+1
 const n=neighbor(tiles,id,e),q=rot([p[0]-n.x,p[1]-n.y],-n.r*Math.PI/3);
 return patchSphere(n.id,q);
}
// Each piece: parent id, local centre, scale, angle (tile-local frame); plus its
// net-world centre and turn so "rotation 0" means as drawn on Spaceship Earth.
export function pieces(level){
 const out=[];
 for(const t of net)(level<=3?subgridLevels:deepLevels)[level].forEach((c,i)=>{
  out.push({parent:t.id,index:i,center:c.center,scale:c.scale,angle:c.angle,netCenter:world(c.center,t),netTurn:((c.angle%(Math.PI/3))+Math.PI/3)%(Math.PI/3),r:t.r});
 });
 return out;
}
// Canonical piece frame: hex of circumradius 1, corners at k*60deg; edge d (corner d..d+1)
// faces 30+60d. Map a canonical point into the parent-local frame of piece pc.
export function pieceLocal(pc,q){
 // net-world: rotate by netTurn, scale, add netCenter; tile-local: undo the tile placement.
 const t=net.find(x=>x.id===pc.parent),w=rot(q.map(v=>v*pc.scale),pc.netTurn).map((v,i)=>v+pc.netCenter[i]);
 return rot([w[0]-t.x,w[1]-t.y],-t.r*Math.PI/3);
}
export const geo=(P,angles)=>{const m=rotation(angles);const x=m[0]*P[0]+m[1]*P[1]+m[2]*P[2],y=m[3]*P[0]+m[4]*P[1]+m[5]*P[2],z=m[6]*P[0]+m[7]*P[1]+m[8]*P[2];return [Math.asin(Math.max(-1,Math.min(1,z)))*180/Math.PI,Math.atan2(y,x)*180/Math.PI];};
export const corner=k=>[Math.cos(k*Math.PI/3),Math.sin(k*Math.PI/3)];
// Ocean fraction along each of the 6 canonical edges.
export function edgeOcean(pcs,mask,W,H,angles,n=200){
 return pcs.map(pc=>Array.from({length:6},(_,d)=>{let ocean=0;
  const a=corner(d),b=corner(d+1);
  for(let i=0;i<n;i++){const t=(i+.5)/n,q=[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t],[la,lo]=geo(localSphere(pc.parent,pieceLocal(pc,q)),angles);
   const u=Math.floor((lo/360+.5)*W)%W,v=Math.min(H-1,Math.floor((.5-la/180)*H));ocean+=1-mask[v*W+u];}
  return ocean/n;}));
}
