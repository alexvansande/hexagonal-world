// Puzzle unfoldings: every internal join is a true spherical neighbour pair.
import {readFileSync,writeFileSync} from 'node:fs';
import {audit,defaultPlace,DIR} from './validate.mjs';
const level=+process.argv[2],restarts=+(process.argv[3]||4),iters=+(process.argv[4]||100000),TIE=+(process.env.TIE||0.001);
const {pieces,ocean}=JSON.parse(readFileSync(`edges${level}.json`)),partner=JSON.parse(readFileSync(`pairs${level}.json`)),N=pieces.length;
const edges=[];const eid=pieces.map(()=>Array(6));
for(let p=0;p<N;p++)for(let d=0;d<6;d++){const [q,dq]=partner[p][d];if(eid[p][d]!==undefined)continue;eid[p][d]=eid[q][dq]=edges.length;edges.push([p,d,q,dq]);}
const E=edges.length;
function unfold(tree){ // tree: Uint8Array over edges -> placement or null
 const adj=Array.from({length:N},()=>[]);for(let e=0;e<E;e++)if(tree[e]){const [p,d,q,dq]=edges[e];adj[p].push([d,q,dq]);adj[q].push([dq,p,d]);}
 const place=Array(N),occ=new Map();place[0]={a:0,b:0,k:0};occ.set('0,0',0);const st=[0];let seen=1;
 while(st.length){const p=st.pop(),x=place[p];for(const [d,q,dq] of adj[p]){if(place[q])continue;const D=(d+x.k)%6,a=x.a+DIR[D][0],b=x.b+DIR[D][1],key=a+','+b;if(occ.has(key))return null;place[q]={a,b,k:(D+3-dq+6)%6};occ.set(key,q);st.push(q);seen++;}}
 if(seen<N)return null;
 // every planar contact must be a true partner join
 let cost=0,exposed=0,oce=0;
 for(let p=0;p<N;p++){const x=place[p];for(let D=0;D<6;D++){const q=occ.get((x.a+DIR[D][0])+','+(x.b+DIR[D][1])),d=(D-x.k+6)%6;
  if(q===undefined){exposed++;oce+=ocean[p][d];cost+=ocean[p][d]+TIE;continue;}
  const [tq,td]=partner[p][d];if(tq!==q||td!==(D+3-place[q].k+6)%6)return null;}}
 return {place,cost,exposed,ocean:oce};
}
// start: BFS tree over the default layout's (all valid) joins
const def=defaultPlace(pieces),docc=new Map(def.map((x,p)=>[x.a+','+x.b,p]));
function defaultTree(){const t=new Uint8Array(E),seen=new Set([0]),q=[0];while(q.length){const p=q.shift(),x=def[p];for(let D=0;D<6;D++){const n=docc.get((x.a+DIR[D][0])+','+(x.b+DIR[D][1]));if(n===undefined||seen.has(n))continue;seen.add(n);q.push(n);t[eid[p][(D-x.k+6)%6]]=1;}}return t;}
let rng=1;const rand=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
function treePath(tree,u,v){ // edge ids on tree path u->v
 const adj=Array.from({length:N},()=>[]);for(let e=0;e<E;e++)if(tree[e]){const [p,,q]=edges[e];adj[p].push([q,e]);adj[q].push([p,e]);}
 const par=new Int32Array(N).fill(-2),pe=new Int32Array(N);par[u]=-1;const st=[u];while(st.length){const x=st.pop();if(x===v)break;for(const [y,e] of adj[x])if(par[y]===-2){par[y]=x;pe[y]=e;st.push(y);}}
 const path=[];for(let x=v;x!==u;x=par[x])path.push(pe[x]);return path;
}
const base=unfold(defaultTree());console.log('default: exposed',base.exposed,'ocean',(100*base.ocean/base.exposed).toFixed(1)+'%');
let overall=null;
for(let r=0;r<restarts;r++){rng=r*104729+17;let tree=defaultTree(),cur=base,best=base,acc=0;
 for(let it=0;it<iters;it++){const T=0.6*Math.pow(0.003/0.6,it/iters);
  const e=Math.floor(rand()*E);if(tree[e])continue;const [p,,q]=edges[e];if(p===q)continue;
  const path=treePath(tree,p,q),rm=path[Math.floor(rand()*path.length)];
  tree[e]=1;tree[rm]=0;const s=unfold(tree);
  if(s&&(s.cost<=cur.cost||rand()<Math.exp(-(s.cost-cur.cost)/T))){cur=s;acc++;if(s.cost<best.cost)best=s;}else{tree[e]=0;tree[rm]=1;}
 }
 const chk=audit(level,best.place);console.log('restart',r,'exposed',best.exposed,'ocean',best.ocean.toFixed(2),'=',(100*best.ocean/best.exposed).toFixed(1)+'%','accepted',acc,'audit',JSON.stringify(chk));
 if(!overall||best.cost<overall.cost)overall=best;
}
writeFileSync(`unfold${level}.json`,JSON.stringify({pos:overall.place.map(x=>[x.a,x.b]),rotations:overall.place.map(x=>x.k),ocean:overall.ocean,exposed:overall.exposed}));
