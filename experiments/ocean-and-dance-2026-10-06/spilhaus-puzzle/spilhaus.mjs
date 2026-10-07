// Rigid level-n puzzle laid out Spilhaus-style: all water joined except slits from sea cones to the rim
// (Afro-Eurasia + Americas) and one Americas–Afro-Eurasia link (Bering); land edges never join.
import {readFileSync,writeFileSync} from 'node:fs';
const level=+process.argv[2]||3,{dominant,half,bridge,pieces,water,len,cornerKeys,verts,cones}=JSON.parse(readFileSync(`edges${level}.json`)),partner=JSON.parse(readFileSync(`pairs${level}.json`)),N=pieces.length;
const ab=new Uint8Array(readFileSync('ab.bin')),W=4320,H=2160,px=([la,lo])=>Math.min(H-1,Math.floor((90-la)/180*H))*W+Math.floor((lo/360+.5)*W)%W;
// rim land with water on both sides along centre → edge → centre: the two pieces lie across a land bridge
const crosses=seq=>{const f=seq.indexOf('0'),l=seq.lastIndexOf('0');if(f<0)return false;for(let i=f+1;i<l;i++)if(seq[i]==='2')return true;return false;};
const FW=new Float32Array(readFileSync('outer-field-water.bin').buffer.slice(0)),depth=([la,lo])=>-FW[Math.min(719,Math.floor((90-la)/180*720))*1440+Math.floor((lo/360+.5)*1440)%1440];
const INLAND=+(process.env.INLAND??1);
const V=new Map(verts.map(v=>[v.k,{...v,side:ab[px(v.ll)],deep:ab[px(v.ll)]&&depth(v.ll)>=INLAND,adj:[]}]));
const edges=[],eid=pieces.map(()=>Array(6));
for(let p=0;p<N;p++)for(let d=0;d<6;d++){if(eid[p][d]!==undefined)continue;const [q,dq]=partner[p][d];eid[p][d]=eid[q][dq]=edges.length;
 const a=cornerKeys[p][d],b=cornerKeys[p][(d+1)%6],w=(water[p][d]+water[q][dq])/2;edges.push({p,d,q,dq,a,b,w,len:len[p][d],bridge:bridge[p][d]||bridge[q][dq]||crosses(half[p][d]+[...half[q][dq]].reverse().join(''))});}
for(const [i,e] of edges.entries()){V.get(e.a).adj.push([i,e.b]);V.get(e.b).adj.push([i,e.a]);}
function dijkstra(sources,isTarget){const dist=new Map(),prev=new Map(),heap=[];const push=(k,d)=>{heap.push([k,d]);heap.sort((x,y)=>y[1]-x[1]);};
 for(const s of sources){dist.set(s,0);push(s,0);}
 while(heap.length){const [k,d]=heap.pop();if(d>dist.get(k))continue;if(isTarget(k)){const path=[];let c=k;while(prev.has(c)){const [e,f]=prev.get(c);path.push(e);c=f;}return {cost:d,path,end:k};}
  for(const [e,o] of V.get(k).adj){const nd=d+edges[e].w*edges[e].len;if(nd<(dist.get(o)??Infinity)){dist.set(o,nd);prev.set(o,[e,k]);push(o,nd);}}}
 return null;}
const cut=new Set(),report=[];
for(const c of cones){if(V.get(c.k).side){report.push({cone:c.ll,on:V.get(c.k).side===1?'Afro-Eurasia':'Americas',slit:0});continue;}
 const r=dijkstra([c.k],k=>V.get(k).deep);r.path.forEach(e=>cut.add(e));if(process.env.TRACE)console.error('slit',c.ll,r.path.map(e=>V.get(edges[e].a).ll.map(x=>Math.round(x)).join('/')+(edges[e].w>0.01?'w'+edges[e].w.toFixed(1):'')).join(' '));report.push({cone:c.ll,slitWaterDeg:+r.cost.toFixed(2),toward:V.get(r.end).ll.map(x=>+x.toFixed(1)),edges:r.path.length});}
const link=dijkstra([...V.values()].filter(v=>v.deep&&v.side===1).map(v=>v.k),k=>V.get(k).deep&&V.get(k).side===2);link.path.forEach(e=>cut.add(e));
report.push({link:'Afro-Eurasia → Americas',waterDeg:+link.cost.toFixed(2),at:V.get(link.end).ll.map(x=>+x.toFixed(1))});
const joinable=edges.map((e,i)=>e.w>=0.5&&!cut.has(i)&&!e.bridge&&dominant[e.p][e.d]&&dominant[e.q][e.dq]);
// Straits narrower than a piece: force the joins along a hard-coded route (piece nearest each sample point).
const {localSphere,pieceLocal,geo,DEFAULT}=await import('./core.mjs');
const centres=pieces.map(pc=>{const [la,lo]=geo(localSphere(pc.parent,pieceLocal(pc,[0,0])),DEFAULT).map(x=>x*Math.PI/180);return [Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)];});
const vec=([la,lo])=>{la*=Math.PI/180;lo*=Math.PI/180;return [Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)];};
const nearest=X=>{let b=-1,bd=-2;for(let i=0;i<N;i++){const d=centres[i][0]*X[0]+centres[i][1]*X[1]+centres[i][2]*X[2];if(d>bd){bd=d;b=i;}}return b;};
const straits={'Bosporus–Dardanelles':[[42.0,29.5],[41.2,29.1],[40.9,28.6],[40.7,27.6],[40.3,26.6],[40.0,26.1],[39.6,25.4]],'Danish straits':[[58.2,9.0],[57.5,11.0],[56.6,12.0],[56.0,12.7],[55.5,12.9],[55.0,13.8]],'Kerch':[[45.6,36.9],[45.2,36.5],[44.9,36.4]]};
const forced=[];
for(const [name,route] of Object.entries(straits)){const seq=[];for(let i=0;i+1<route.length;i++)for(let t=0;t<20;t++){const a=route[i],b=route[i+1],p=nearest(vec([a[0]+(b[0]-a[0])*t/20,a[1]+(b[1]-a[1])*t/20]));if(seq.at(-1)!==p)seq.push(p);}
 let joined=0;for(let i=0;i+1<seq.length;i++){const d=partner[seq[i]].findIndex(([q])=>q===seq[i+1]);if(d>=0){joinable[eid[seq[i]][d]]=true;joined++;}}forced.push({name,pieces:seq.length,joined});}

// main water component
const comp=new Int32Array(N).fill(-1);let best=-1,bestSize=0;
for(let s=0;s<N;s++){if(comp[s]>=0)continue;const st=[s];comp[s]=s;let size=0;while(st.length){const p=st.pop();size+=water[p].reduce((a,b)=>a+b,0);for(let d=0;d<6;d++){const e=eid[p][d];if(!joinable[e])continue;const [q]=partner[p][d];if(comp[q]<0){comp[q]=s;st.push(q);}}}if(size>bestSize){bestSize=size;best=s;}}
const kept=[...Array(N).keys()].filter(p=>comp[p]===best);
if(process.env.DEBUGSEA){const keptSet=new Set(kept);for(const [n,ll] of [['Black Sea',[43,34]],['Baltic',[57,19]],['Aegean',[38.5,25]],['Bosporus N',[42.0,29.5]],['Dardanelles S',[39.6,25.4]]]){const p=nearest(vec(ll));console.error(n,'piece',p,'kept',keptSet.has(p),'comp',comp[p],'water',water[p].map(w=>w.toFixed(1)).join(','),'joinable',[0,1,2,3,4,5].map(d=>joinable[eid[p][d]]?1:0).join(''));}}
// lay out (rigid, on one lattice) by BFS over joinable edges
const DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],place=Array(N),occ=new Map();place[kept[0]]={a:0,b:0,k:0};occ.set('0,0',kept[0]);const queue=[kept[0]];let overlaps=0;
while(queue.length){const p=queue.shift(),x=place[p];for(let d=0;d<6;d++){if(!joinable[eid[p][d]])continue;const [q,dq]=partner[p][d];if(place[q])continue;const D=(d+x.k)%6,a=x.a+DIR[D][0],b=x.b+DIR[D][1],key=a+','+b;place[q]={a,b,k:(D+3-dq+6)%6};if(occ.has(key)){overlaps++;place[q].overlap=true;}else occ.set(key,q);queue.push(q);}}
// audit: every joinable edge between kept pieces must meet in the plane; every planar contact must be a true joinable join
let mismatched=0,falseContacts=0;const mismatchedEdges=[];
for(const p of kept)for(let d=0;d<6;d++){const [q,dq]=partner[p][d];if(q<p&&!(q===p))continue;const x=place[p],D=(d+x.k)%6,n=occ.get((x.a+DIR[D][0])+','+(x.b+DIR[D][1]));
 if(joinable[eid[p][d]]){if(n!==q||(D+3-place[q].k+6)%6!==dq){mismatched++;mismatchedEdges.push(eid[p][d]);const want=(D+3-dq+6)%6,turn=(want-place[q].k+6)%6;(globalThis.turns??={})[turn]=(globalThis.turns[turn]||0)+1;}}
 else if(n!==undefined&&kept.includes(n))falseContacts++;}
const cutWater=[...cut].reduce((s,e)=>s+edges[e].w*edges[e].len,0)*111.2;
console.error('mismatch turns',JSON.stringify(globalThis.turns));console.log(JSON.stringify({forced,bridgesBlocked:edges.filter(e=>e.bridge&&e.w>=0.5).length,level,pieces:N,kept:kept.length,cutEdges:cut.size,oceanCutKm:Math.round(cutWater),overlaps,mismatched,falseContacts,report},null,1));
writeFileSync(`spil${level}.json`,JSON.stringify({kept,pos:kept.map(p=>[place[p].a,place[p].b]),rotations:kept.map(p=>place[p].k),place:Object.fromEntries(kept.map(p=>[p,place[p]])),cut:[...cut],mismatchedEdges}));
