import {makeGeometry,layouts,world,add,mul,dot,norm} from './geometry.mjs?v=circular-2';
import {makeFelv} from './felv.mjs';
import {layoutOptions} from './map-options.mjs?v=turn-30';
import {followPoint,geographicPoint} from './globe-drag.mjs?v=circular-2';
import {makeArrangement} from './arrangements.mjs?v=gosper-1';
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const near=(a,b)=>Math.hypot(...sub(a,b))<1e-6;
export function rotate(p,axis,angle){return add(add(mul(p,Math.cos(angle)),mul(cross(axis,p),Math.sin(angle))),mul(axis,dot(axis,p)*(1-Math.cos(angle))));}
export function construction(){
 const tiles=makeGeometry('rhombic'),net=makeArrangement(tiles,'dymaxion',layouts(tiles)).net,faces=[];
 for(const tile of tiles){
  // A rhombus is the pair of triangles meeting at a degree-three cube vertex.
  for(let j=0;j<6;j++)if(Math.abs(Math.hypot(...tile.ring[j])-Math.sqrt(3))<1e-6){
   const ids=[(j+5)%6,j,(j+1)%6],v=[tile.center,...ids.map(i=>tile.ring[i])],t=net.find(n=>n.id===tile.id);
   const local=[[0,0],...ids.map(i=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)])];
   const xy=local.map(p=>[...world(p,t),0]);
   let n=norm(cross(sub(v[1],v[0]),sub(v[2],v[0])));if(dot(n,v[0])<0)n=mul(n,-1);
   faces.push({v,xy,n,local,tile:tile.id});
  }
 }
 // Preserve precisely those hinges that are also joined in the four-hexagon net.
 const links=faces.map(()=>[]);
 for(let i=0;i<12;i++)for(let j=0;j<i;j++){
  const shared=faces[i].v.flatMap((p,a)=>faces[j].v.flatMap((q,b)=>near(p,q)&&near(faces[i].xy[a],faces[j].xy[b])?[[a,b]]:[]));
  if(shared.length===2){links[i].push(j);links[j].push(i);}
 }
 const root=0,order=[root];faces[root].parent=-1;
 for(const i of order)for(const j of links[i])if(faces[j].parent===undefined){faces[j].parent=i;order.push(j);}
 if(order.length!==12)throw Error('Incomplete unfolding tree');
 const origin=faces[0].v[0],u=norm(sub(faces[0].v[1],origin)),n=faces[0].n,v=cross(n,u);
 const a=Math.atan2(faces[0].xy[1][1]-faces[0].xy[0][1],faces[0].xy[1][0]-faces[0].xy[0][0]);
 const frame=p=>{const q=sub(p,origin),x=dot(q,u),y=dot(q,v);return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),dot(q,n)];};
 function transforms(t){const result=[];result[0]=p=>p;
  for(const i of order.slice(1)){const f=faces[i],parent=faces[f.parent],base=result[f.parent],shared=f.v.filter(p=>parent.v.some(q=>near(p,q))),axis=norm(sub(shared[1],shared[0]));
   const angle=Math.atan2(dot(axis,cross(f.n,parent.n)),dot(f.n,parent.n));
   result[i]=p=>base(add(shared[0],rotate(sub(p,shared[0]),axis,angle*t)));
  }return result;
 }
 const flat=transforms(1);faces.forEach((f,i)=>f.flat=f.v.map(p=>frame(flat[i](p))));
 // Anchor the adjusted net at the root's center; both stages share the same overall scale.
 const offset=faces[0].xy[0];faces.forEach(f=>f.adjusted=f.xy.map(p=>mul(sub(p,offset),Math.sqrt(3))));
 // Keep the Spaceship Earth longitude/roll, moving its nearest face center exactly to north.
 const preset=layoutOptions.find(option=>option.name==='Spaceship Earth').state;
 const polarFace=faces.reduce((a,b)=>geographicPoint(preset,a.n)[2]>geographicPoint(preset,b.n)[2]?a:b);
 const orientation=followPoint(preset,polarFace.n,[0,0,1]);
 const geography=p=>geographicPoint(orientation,p);
 // The Felv preset labels the same solid after a half-turn about its polar axis.
 // Relabel the cuts, not the globe: geography stays attached to the existing faces.
 const symmetry=p=>[-p[0],-p[1],p[2]];
 const planarTurn=(p,r)=>world(p,{x:0,y:0,r});
 const destinations=makeFelv(tiles,net).net.map((canonical,index)=>{
  const tile=tiles.find(t=>near(t.center,symmetry(tiles[canonical.id].center)));
  const shift=tile.ring.findIndex(p=>near(p,symmetry(tiles[canonical.id].ring[0])));
  const xy=planarTurn([canonical.x,canonical.y],-2);
  return {...canonical,id:tile.id,x:xy[0]-1.5,y:xy[1]+Math.sqrt(3)/2,r:canonical.r-shift-2,
   polygon:canonical.polygon.map(p=>planarTurn(p,shift)),
   drawPatches:canonical.drawPatches.map(p=>({...p,xy:p.xy.map(q=>planarTurn(q,shift)),v:p.v.map(symmetry)})),
   canonical,index};
 });
 const pieces=destinations.map(destination=>{
  const source=net.find(t=>t.id===destination.id);
  const center=mul(destination.polygon.reduce(add),1/destination.polygon.length);
  const start=world(center,source),end=world(center,destination);
  const turn=((destination.r-source.r+9)%6-3)*Math.PI/3;
  const moving=Math.hypot(...sub(start,end))>1e-8||Math.abs(turn)>1e-8;
  // Bow the Americas left, Antarctica over the top and right, and the southern tip right.
  const displayArc={1:[-.65,.15],3:[-.5,-.15],5:[.2,-.25],6:[.7,.6],7:[1.6,1.7]}[destination.index]||[0,0];
  const arc=planarTurn(displayArc,-2);
  return {source,destination,center,start,end,turn,arc,moving};
 });
 const piecePoint=(piece,xy,t)=>{
  const angle=piece.source.r*Math.PI/3+piece.turn*t,q=sub(xy,piece.center),center=add(mix(piece.start,piece.end,t),mul(piece.arc,Math.sin(Math.PI*t)));
  return mul(sub([center[0]+q[0]*Math.cos(angle)-q[1]*Math.sin(angle),center[1]+q[0]*Math.sin(angle)+q[1]*Math.cos(angle),piece.moving?.18*Math.sin(Math.PI*t):0],offset),Math.sqrt(3));
 };
 return {faces,transforms,frame,geography,polarFace,pieces,piecePoint};
}

// Clip first, then subdivide: the same surface samples follow every stage and every cut.
export function constructionMesh(model,steps=12){
 const samples=[],edges=[],cuts=[];
 const onEdge=(p,a,b)=>{
  const d=sub(b,a),q=sub(p,a),length=dot(d,d);
  return length>1e-12&&Math.abs(d[0]*q[1]-d[1]*q[0])<1e-7&&dot(q,d)>-1e-7&&dot(q,d)<length+1e-7;
 };
 model.pieces.forEach((piece,pieceIndex)=>{
  const seen=new Set();
  for(const patch of piece.destination.drawPatches){
   const f=model.faces.findIndex(face=>face.tile===piece.source.id&&patch.v.every(p=>face.v.some(q=>near(p,q))));
   if(f<0)throw Error('Cut patch has no rhombus');
   const face=model.faces[f],u=sub(face.v[1],face.v[0]),v=sub(face.v[3],face.v[0]),uu=dot(u,u),vv=dot(v,v),uv=dot(u,v),det=uu*vv-uv*uv;
   const at=weights=>{
    const xy=[0,1].map(j=>weights.reduce((sum,w,i)=>sum+w*patch.xy[i][j],0));
    const original=[0,1,2].map(j=>weights.reduce((sum,w,i)=>sum+w*patch.weights[i][j],0));
    const p=[0,1,2].map(j=>original.reduce((sum,w,i)=>sum+w*patch.v[i][j],0)),q=sub(p,face.v[0]);
    return {f,p,xy,piece:pieceIndex,earth:model.geography(p),a:(dot(q,u)*vv-dot(q,v)*uv)/det,b:(dot(q,v)*uu-dot(q,u)*uv)/det};
   };
   const point=(x,y)=>at([1-x-y,x,y]);
   for(let y=0;y<steps;y++)for(let x=0;x<steps-y;x++){
    samples.push(point(x/steps,y/steps),point((x+1)/steps,y/steps),point(x/steps,(y+1)/steps));
    if(x+y<steps-1)samples.push(point((x+1)/steps,y/steps),point((x+1)/steps,(y+1)/steps),point(x/steps,(y+1)/steps));
   }
   for(let e=0;e<3;e++){
    const a=patch.xy[e],b=patch.xy[(e+1)%3];
    const boundary=polygon=>polygon.some((p,i)=>onEdge(a,p,polygon[(i+1)%polygon.length])&&onEdge(b,p,polygon[(i+1)%polygon.length]));
    const faceEdge=boundary(face.local),cutEdge=boundary(piece.destination.polygon);
    const key=[a,b].map(p=>p.map(x=>x.toFixed(7)).join(',')).sort().join('|');
    if((!faceEdge&&!cutEdge)||seen.has(key))continue;seen.add(key);
    const list=faceEdge?edges:cuts;
    for(let j=0;j<steps;j++)for(const t of [j/steps,(j+1)/steps])list.push(at([0,1,2].map(i=>i===e?1-t:i===(e+1)%3?t:0)));
   }
  }
 });
 return {samples,edges,cuts};
}

// One presentation frame for the planar sequence: +120° puts Africa below Eurasia.
export const orientConstruction=p=>rotate(p,[0,0,1],2*Math.PI/3);
export function rearrangementFrame(model){
 const adjusted=model.faces.flatMap(f=>f.adjusted.map(orientConstruction));
 const center=[0,1,2].map(i=>(Math.min(...adjusted.map(p=>p[i]))+Math.max(...adjusted.map(p=>p[i])))/2);
 // Fit the full movement once, so the camera never follows the moving silhouette.
 let radius=2;
 for(const piece of model.pieces){
  const r=Math.max(...piece.destination.polygon.map(p=>Math.hypot(...sub(p,piece.center))))*Math.sqrt(3);
  // Bound travel between samples as well as the sampled positions.
  const margin=(Math.hypot(...sub(piece.end,piece.start))*Math.sqrt(3)+r*Math.abs(piece.turn)+Math.PI*Math.hypot(...piece.arc)*Math.sqrt(3))/128;
  for(let step=0;step<=64;step++)for(const xy of piece.destination.polygon){
   const p=orientConstruction(model.piecePoint(piece,xy,step/64));
   radius=Math.max(radius,Math.abs(p[0]-center[0])+margin,Math.abs(p[1]-center[1])+margin);
  }
 }
 return {center,extent:radius*2};
}
