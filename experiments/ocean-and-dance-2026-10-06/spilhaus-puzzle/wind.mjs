import {readFileSync} from 'node:fs';
import {localSphere,pieceLocal} from './core.mjs';
const level=4,E=JSON.parse(readFileSync(`edges${level}.json`)),S=JSON.parse(readFileSync(`spil${level}.json`)),partner=JSON.parse(readFileSync(`pairs${level}.json`));
const N=E.pieces.length,eid=E.pieces.map(()=>Array(6)),list=[];for(let p=0;p<N;p++)for(let d=0;d<6;d++){if(eid[p][d]!==undefined)continue;const [q,dq]=partner[p][d];eid[p][d]=eid[q][dq]=list.length;list.push([p,d]);}
const centre=E.pieces.map(pc=>localSphere(pc.parent,pieceLocal(pc,[0,0])));
// rebuild the BFS tree exactly as laid out: parent = the neighbour it was placed from (recompute BFS on joinable edges)
const keptSet=new Set(S.kept),place=S.place;
// tree parents via BFS over pieces whose planar positions/rotations agree across a joinable edge (tree edges always agree)
const DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],par=new Map([[S.kept[0],-1]]),q=[S.kept[0]];
const mism=new Set(S.mismatchedEdges);
while(q.length){const p=q.shift();for(let d=0;d<6;d++){const [r,dr]=partner[p][d];if(!keptSet.has(r)||par.has(r)||mism.has(eid[p][d]))continue;const x=place[p],D=(d+x.k)%6,y=place[r];if(!y||y.a!==x.a+DIR[D][0]||y.b!==x.b+DIR[D][1]||(D+3-dr+6)%6!==y.k)continue;par.set(r,p);q.push(r);}}
const path=p=>{const out=[];while(p!==-1&&p!==undefined){out.push(p);p=par.get(p);}return out;};
const cones=E.cones.map(c=>{const [x,y,z]=c.k.split(',').map(v=>+v/1e6);return {ll:c.ll,X:[x,y,z]};});
function winding(loop,X){const a=[1,0,0],ax=Math.abs(X[0])>.9?[0,1,0]:a,u=norm(cross(X,ax)),v=cross(X,u);let w=0,prev=null;
 for(const P of loop){const d=1+dot(P,X);const s=[dot(P,u)/d,dot(P,v)/d],ang=Math.atan2(s[1],s[0]);if(prev!==null){let da=ang-prev;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;w+=da;}prev=ang;}return Math.round(w/(2*Math.PI));}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
const dense=pts=>{const out=[];for(let i=0;i<pts.length;i++){const A=pts[i],B=pts[(i+1)%pts.length];for(let t=0;t<8;t++)out.push(norm(A.map((v,j)=>v*(1-t/8)+B[j]*t/8)));}out.push(out[0]);return out;};
for(const e of [...mism].slice(0,6)){const [p,d]=list[e],[r]=partner[p][d];const a=path(p),b=path(r);
 // loop: p → root (a), root → r (b reversed), then r → p across the edge
 const loop=dense([...a,...b.reverse()].map(i=>centre[i]));
 console.log('edge',e,'loop pieces',a.length+b.length,'windings',cones.map(c=>c.ll.join('/')+':'+winding(loop,c.X)).join('  '));}
{const geo=P=>{const R=JSON.parse(process.env.ANGLES||'null');return P;};
 const {geo:g,DEFAULT}=await import('./core.mjs');
 const e=[...mism][0],[p,d]=list[e],[r]=partner[p][d];const a=path(p),b=path(r);const seq=[...a,...b.reverse()];
 let prev=null;const out=[];for(const i of seq){const [la,lo]=g(centre[i],DEFAULT);const k=Math.round(la/3)*3+'/'+Math.round(lo/3)*3;if(k!==prev)out.push(k);prev=k;}
 console.log('loop path',out.join(' '));}
