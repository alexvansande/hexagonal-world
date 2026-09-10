import {makeFelv} from './felv.mjs';
import {hex,world,matching} from './geometry.mjs';
import {makeTiling,directions,axial} from './tiling.mjs';
const H=Math.sqrt(3)/2,mod=x=>(x%6+6)%6;
export const arrangementNames={infinite:'Infinite',flower:'Flower',dymaxion:'Fuller',bighex:'Big hex',felv:'Felv'};
function edgeBetween(a,b){return Array.from({length:6},(_,e)=>e).find(e=>{const p=world(hex[e],a),q=world(hex[(e+1)%6],a);return Math.hypot(p[0]+q[0]-a.x-b.x,p[1]+q[1]-a.y-b.y)<1e-6;});}
export function markEdges(tiles,net){return net.map(t=>({...t,opacity:1,bad:Array.from({length:6},(_,e)=>{const local=mod(e-t.r),a=world(hex[local],t),b=world(hex[(local+1)%6],t);return net.some(n=>n!==t&&Array.from({length:6},(_,j)=>j).some(j=>{const c=world(hex[j],n),d=world(hex[(j+1)%6],n);if(Math.hypot(a[0]-d[0],a[1]-d[1],b[0]-c[0],b[1]-c[1])>1e-6)return false;const pair=matching(tiles,t.id,local);return pair.id!==n.id||pair.e!==j;}));})}));}
function bestNet(tiles,positions){
 let best=null,bestScore=-1;
 const contacts=[];
 for(let i=0;i<positions.length;i++)for(let j=0;j<i;j++){
  const e=edgeBetween({x:positions[i][0],y:positions[i][1],r:0},{x:positions[j][0],y:positions[j][1],r:0});
  if(e!==undefined)contacts.push([i,j,e]);
 }
 function visit(net,unused){if(!unused.length){let score=0;for(const [i,j,e] of contacts){const pair=matching(tiles,net[i].id,mod(e-net[i].r));if(pair.id===net[j].id&&mod(pair.e+net[j].r)===mod(e+3))score++;}if(score>bestScore){bestScore=score;best=net;}return;}
 for(const id of unused)for(let r=0;r<6;r++){const [x,y]=positions[net.length];visit([...net,{id,r,x,y}],unused.filter(i=>i!==id));}}
 for(let r=0;r<6;r++)visit([{id:0,r,x:positions[0][0],y:positions[0][1]}],[1,2,3]);return best;
}
export function makeArrangement(tiles,name,nets){
 const flower=nets.find(net=>net.some(t=>{const edges=net.filter(n=>n!==t).map(n=>edgeBetween(t,n));return edges.every(e=>e!==undefined)&&new Set(edges.map(e=>e%2)).size===1;}))||nets[0];
 if(name==='infinite')return {net:nets[0],tiling:makeTiling(tiles,nets[0])};
 if(name==='flower')return {net:markEdges(tiles,flower)};
 if(name==='dymaxion')return {net:markEdges(tiles,bestNet(tiles,[[0,0],[-1.5,H],[1.5,H],[-1.5,-H]]))};
 if(name==='bighex'){
 const c=flower.find(t=>flower.every(n=>n===t||edgeBetween(t,n)!==undefined));const tiling=makeTiling(tiles,flower),[q,s]=axial(c.x,c.y);
 const net=[[0,0],...directions].map(([dq,ds])=>({ ...tiling.at(q+dq,s+ds),x:(q+dq)*1.5,y:Math.sqrt(3)*(s+ds+(q+dq)/2)}));return {net:markEdges(tiles,net)};
 }
 return makeFelv(tiles,bestNet(tiles,[[0,0],[-1.5,H],[1.5,H],[-1.5,-H]]));
}
