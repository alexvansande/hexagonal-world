export const TAU=Math.PI*2;
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const mul=(a,s)=>a.map(x=>x*s);
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const norm=a=>mul(a,1/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const average=a=>mul(a.reduce(add),1/a.length);
export const key=v=>norm(v).map(x=>Math.round(x*1e7)).join(',');
export const hex=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
const tetra=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
const order=(arr,c)=>{const n=norm(c),u=norm(cross(n,[0,0,1])),v=cross(n,u);return [...arr].sort((a,b)=>Math.atan2(dot(a,v),dot(a,u))-Math.atan2(dot(b,v),dot(b,u)));};
export function makeGeometry(method,height=1.5){
 return tetra.map((t,id)=>{
 let center,ring,patches;
 if(method==='tetra'||method==='spherical'){
 const face=order(tetra.filter((_,i)=>i!==id),mul(t,-1));center=average(face);ring=face.flatMap((v,i)=>[v,average([v,face[(i+1)%3]])]);
 }else if(method==='octa'){
 const face=order(t.map((s,i)=>[0,0,0].map((_,j)=>j===i?s:0)),t);center=average(face);ring=face.flatMap((v,i)=>{const w=face[(i+1)%3],z=face[(i+2)%3];return [v,average([v,w,mul(z,-1)])];});
 }else{
 center=t; const corners=[];for(let i=0;i<3;i++){corners.push(t.map((s,j)=>j===i?(method==='tetrakis'?height:2)*s:0));corners.push(t.map((s,j)=>j===i?-s:s));}ring=order(corners,center);
 }
 if(method==='octa'){
 patches=[{xy:[hex[0],hex[2],hex[4]],v:[ring[0],ring[2],ring[4]]}];for(let i=0;i<6;i+=2)patches.push({xy:[hex[i],hex[(i+1)%6],hex[(i+2)%6]],v:[ring[i],ring[(i+1)%6],ring[(i+2)%6]]});
 }else patches=hex.map((p,i)=>({xy:[[0,0],p,hex[(i+1)%6]],v:[center,ring[i],ring[(i+1)%6]]}));
 return {id,center,ring,patches};
 });
}
const rot=(p,r)=>{const a=r*Math.PI/3;return [p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];};
export const world=(p,t)=>add(rot(p,t.r),[t.x,t.y]);
// Geometry uses Y up; canvas coordinates use Y down. Convert exactly once.
export const canvasWorld=(p,t)=>{const [x,y]=world(p,t);return [x,-y];};
const edgePairCache=new WeakMap();
export function matching(tiles,id,e){
 let pairs=edgePairCache.get(tiles);
 if(!pairs){
  const edges=new Map();
  for(const t of tiles)for(let j=0;j<6;j++)edges.set(`${key(t.ring[j])}|${key(t.ring[(j+1)%6])}`,{id:t.id,e:j});
  pairs=tiles.map(t=>t.ring.map((p,j)=>{
   const pair=edges.get(`${key(t.ring[(j+1)%6])}|${key(p)}`);
   if(!pair||pair.id===t.id)throw Error('Unpaired edge');
   return pair;
  }));
  edgePairCache.set(tiles,pairs);
 }
 return pairs[id][e];
}
export function layouts(tiles){const results=[];const seen=new Set();function visit(placed){if(placed.length===4){const k=[...placed].sort((a,b)=>a.id-b.id).map(t=>[t.id,t.x.toFixed(3),t.y.toFixed(3),t.r].join(',')).join(';');if(!seen.has(k)){seen.add(k);results.push(placed);}return;}for(const t of placed)for(let e=0;e<6;e++){const m=matching(tiles,t.id,e);if(placed.some(p=>p.id===m.id))continue;const w=(e+t.r)%6,angle=(w+.5)*Math.PI/3;const n={id:m.id,r:(w+3-m.e+12)%6,x:t.x+Math.sqrt(3)*Math.cos(angle),y:t.y+Math.sqrt(3)*Math.sin(angle)};let valid=true;for(const p of placed){const d=Math.hypot(p.x-n.x,p.y-n.y);if(d<1.7){valid=false;break;}if(d<1.74){let edge=-1;for(let j=0;j<6;j++){const mid=world(mul(add(hex[j],hex[(j+1)%6]),.5),p);if(Math.hypot(mid[0]-(p.x+n.x)/2,mid[1]-(p.y+n.y)/2)<1e-6)edge=j;}if(edge<0){valid=false;break;}const mm=matching(tiles,p.id,edge);if(mm.id!==n.id||(mm.e+n.r)%6!==(edge+p.r+3)%6){valid=false;break;}}}if(valid)visit([...placed,n]);}}visit([{id:0,x:0,y:0,r:0}]);return results;}
export function sphereArea(a,b,c){a=norm(a);b=norm(b);c=norm(c);return 2*Math.atan2(Math.abs(dot(a,cross(b,c))),1+dot(a,b)+dot(b,c)+dot(c,a));}
