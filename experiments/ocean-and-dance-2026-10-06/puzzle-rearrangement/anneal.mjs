import {readFileSync,writeFileSync} from 'node:fs';
const TIE=+(process.env.TIE||0);const level=+process.argv[2],restarts=+(process.argv[3]||8),iters=+(process.argv[4]||200000);
const {pieces,ocean}=JSON.parse(readFileSync(`edges${level}.json`));const N=pieces.length;
const DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]; // axial steps for directions 30+60d
const K=(a,b)=>a*4096+b;
// best rotation for a piece given which directions are exposed (bitmask)
const best=Array.from({length:N},(_,p)=>{const c=new Float64Array(64),k=new Uint8Array(64);for(let m=0;m<64;m++){let bc=1e9,bk=0;for(let r=0;r<6;r++){let s=0;for(let d=0;d<6;d++)if(m>>d&1)s+=ocean[p][(d-r+6)%6]+TIE;if(s<bc-1e-12){bc=s;bk=r;}}c[m]=bc;k[m]=bk;}return {c,k};});
let rng=12345;const rand=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
function solve(seed){
 rng=seed;const pos=[],occ=new Map();
 // start: random compact blob grown by BFS
 const order=[...Array(N).keys()].sort(()=>rand()-.5);occ.set(K(0,0),order[0]);pos[order[0]]=[0,0];
 for(let i=1;i<N;i++){const front=[];for(const [k] of occ){const a=Math.floor((k+2048*4097)/4096)-2048,b=k-a*4096;for(const [da,db] of DIR)if(!occ.has(K(a+da,b+db)))front.push([a+da,b+db]);}const f=front[Math.floor(rand()*front.length)];occ.set(K(...f),order[i]);pos[order[i]]=f;}
 const mask=(a,b)=>{let m=0;for(let d=0;d<6;d++)if(!occ.has(K(a+DIR[d][0],b+DIR[d][1])))m|=1<<d;return m;};
 const cellCost=(a,b)=>{const p=occ.get(K(a,b));return p===undefined?0:best[p].c[mask(a,b)];};
 const local=cells=>{const seen=new Set();let s=0;for(const [a,b] of cells){for(const [da,db] of [[0,0],...DIR]){const k=K(a+da,b+db);if(seen.has(k))continue;seen.add(k);s+=cellCost(a+da,b+db);}}return s;};
 const total=()=>{let s=0;for(const p of pos)s+=cellCost(...p);return s;};
 const connected=()=>{const start=occ.keys().next().value,seen=new Set([start]),st=[start];while(st.length){const k=st.pop(),a=Math.round(k/4096),b=k-a*4096;for(const [da,db] of DIR){const n=K(a+da,b+db);if(occ.has(n)&&!seen.has(n)){seen.add(n);st.push(n);}}}return seen.size===occ.size;};
 let cost=total(),bestCost=cost,bestPos=pos.map(p=>[...p]);
 const T0=1.0,T1=0.002;
 for(let it=0;it<iters;it++){const T=T0*Math.pow(T1/T0,it/iters);
  if(rand()<.6){ // swap two pieces
   const p=Math.floor(rand()*N),q=Math.floor(rand()*N);if(p===q)continue;const A=pos[p],B=pos[q];
   const before=best[p].c[mask(...A)]+best[q].c[mask(...B)],after=best[q].c[mask(...A)]+best[p].c[mask(...B)],dE=after-before;
   if(dE<=0||rand()<Math.exp(-dE/T)){pos[p]=B;pos[q]=A;occ.set(K(...A),q);occ.set(K(...B),p);cost+=dE;}
  }else{ // relocate a piece to an empty cell next to the shape
   const p=Math.floor(rand()*N),A=pos[p];const q=pos[Math.floor(rand()*N)],d=DIR[Math.floor(rand()*6)],B=[q[0]+d[0],q[1]+d[1]];
   if(occ.has(K(...B)))continue;const before=local([A,B]);occ.delete(K(...A));occ.set(K(...B),p);pos[p]=B;
   const after=local([A,B]),dE=after-before;
   if((dE<=0||rand()<Math.exp(-dE/T))&&connected())cost+=dE;else{occ.delete(K(...B));occ.set(K(...A),p);pos[p]=A;}
  }
  if(cost<bestCost-1e-9){bestCost=cost;bestPos=pos.map(p=>[...p]);}
 }
 pos.splice(0,N,...bestPos);occ.clear();bestPos.forEach((p,i)=>occ.set(K(...p),i));
 const rotations=bestPos.map((p,i)=>best[i].k[mask(...p)]);let exposed=0;for(const p of bestPos)exposed+=6-[...Array(6).keys()].filter(d=>!(mask(...p)>>d&1)).length;
 let oc=0;for(const p of bestPos){const mm=mask(...p),r=best[pos.indexOf(p)];}
 return {cost:total(),pos:bestPos,rotations,exposed};
}
const results=[];for(let s=1;s<=restarts;s++){const r=solve(s*7919);results.push(r);console.log('seed',s,'ocean on border',r.cost.toFixed(2),'edge-lengths of',r.exposed,'exposed edges =',(100*r.cost/r.exposed).toFixed(1)+'% ocean');}
results.sort((a,b)=>a.cost-b.cost);writeFileSync(`layout${level}.json`,JSON.stringify(results[0]));
