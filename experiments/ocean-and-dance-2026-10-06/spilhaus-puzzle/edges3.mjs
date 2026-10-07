// Level-3 pieces: per-edge water fraction and length, and the shared corner graph, at a chosen orientation.
import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,localSphere,pieceLocal,geo,corner,DEFAULT} from './core.mjs';
const level=+process.argv[2]||3,mask=new Uint8Array(readFileSync('../mask.bin')),outer=new Uint8Array(readFileSync('outer.bin')),W=4320,H=2160;
const px=([la,lo])=>Math.min(H-1,Math.floor((90-la)/180*H))*W+Math.floor((lo/360+.5)*W)%W;
const pcs=pieces(level),n=48,water=[],len=[],cornerKeys=[],verts=new Map();
const key=P=>P.map(v=>Math.round(v*1e6)).join(',');
pcs.forEach((pc,i)=>{water.push([]);len.push([]);cornerKeys.push([]);
 for(let d=0;d<6;d++){const a=corner(d),b=corner(d+1);let wet=0,prev=null,L=0;const seq=[];
  for(let s=0;s<=n;s++){const t=s/n,P=localSphere(pc.parent,pieceLocal(pc,[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t]));if(prev)L+=Math.acos(Math.min(1,prev[0]*P[0]+prev[1]*P[1]+prev[2]*P[2]));prev=P;if(s<n&&s>0){const k=px(geo(P,DEFAULT));wet+=1-mask[k];seq.push(mask[k]?(outer[k]?2:1):0);}}
  {let first=seq.indexOf(0),last=seq.lastIndexOf(0),bridge=false;for(let s=first+1;s<last;s++)if(seq[s]===2){bridge=true;break;}(globalThis.bridges??=[]).push([i,d,bridge&&first>=0]);}
  // half path from this piece's centre to the edge midpoint: 0 water, 1 other land, 2 rim land
  {let h='';for(let s=0;s<=24;s++){const t=s/24,m=[(a[0]+b[0])/2*t,(a[1]+b[1])/2*t],k=px(geo(localSphere(pc.parent,pieceLocal(pc,m)),DEFAULT));h+=mask[k]?(outer[k]?'2':'1'):'0';}(globalThis.halves??=[]).push([i,d,h]);}
  water[i].push(wet/(n-1));len[i].push(L*180/Math.PI);
  const C=localSphere(pc.parent,pieceLocal(pc,a)),k=key(C);cornerKeys[i].push(k);
  if(!verts.has(k)){const g=geo(C,DEFAULT);verts.set(k,{k,ll:g,rim:outer[px(g)],cells:new Set()});}verts.get(k).cells.add(i);
 }});
const degree=[...verts.values()].map(v=>v.cells.size),hist={};for(const d of degree)hist[d]=(hist[d]||0)+1;
const cones=[...verts.values()].filter(v=>v.cells.size===2).map(v=>({k:v.k,ll:v.ll.map(x=>+x.toFixed(2)),rim:v.rim}));
console.log('level',level,'pieces',pcs.length,'corner degrees',JSON.stringify(hist),'cones',JSON.stringify(cones));
// Water inside each piece: label connected water samples on a fine triangular grid; an edge may
// join only if its water touches the piece's largest water patch (an isthmus piece can't join both sides).
const G=14,grid=[];for(let j=-G;j<=G;j++)for(let i=-G;i<=G;i++){const x=(i+j/2)/G,y=j*Math.sqrt(3)/2/G;if(Math.abs(y)<=Math.sqrt(3)/2*1.001&&Math.abs(Math.sqrt(3)*x)+Math.abs(y)<=Math.sqrt(3)*1.001)grid.push({i,j,x,y});}
const gi=new Map(grid.map((g,n)=>[g.i+','+g.j,n])),nb=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
const dominant=pcs.map((pc,p)=>{const wet=grid.map(g=>!mask[px(geo(localSphere(pc.parent,pieceLocal(pc,[g.x,g.y])),DEFAULT))]),lab=new Int32Array(grid.length).fill(-1),sizes=[];
 for(let s=0;s<grid.length;s++){if(!wet[s]||lab[s]>=0)continue;const id=sizes.length;let n=0;const st=[s];lab[s]=id;while(st.length){const c=st.pop();n++;for(const [di,dj] of nb){const t=gi.get((grid[c].i+di)+','+(grid[c].j+dj));if(t!==undefined&&wet[t]&&lab[t]<0){lab[t]=id;st.push(t);}}}sizes.push(n);}
 const dom=sizes.length?sizes.indexOf(Math.max(...sizes)):-1;
 return Array.from({length:6},(_,d)=>{const a=corner(d),b=corner(d+1),dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);
  // samples within a small band inside the edge
  return grid.some((g,n)=>lab[n]===dom&&dom>=0&&Math.abs((g.x-a[0])*dy-(g.y-a[1])*dx)/L<1.6/G&&((g.x-a[0])*dx+(g.y-a[1])*dy)/(L*L)>-0.05&&((g.x-a[0])*dx+(g.y-a[1])*dy)/(L*L)<1.05);});
});
const bridge=pcs.map(()=>Array(6).fill(false)),half=pcs.map(()=>Array(6).fill(''));for(const [i,d,h] of globalThis.halves)half[i][d]=h;for(const [i,d,b] of globalThis.bridges)bridge[i][d]=b;
writeFileSync(`edges${level}.json`,JSON.stringify({dominant,half,bridge,pieces:pcs,ocean:water.map(r=>r.map(w=>w)),water,len,cornerKeys,verts:[...verts.values()].map(v=>({k:v.k,ll:v.ll,rim:v.rim})),cones}));
