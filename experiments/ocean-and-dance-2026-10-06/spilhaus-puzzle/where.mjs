import {readFileSync} from 'node:fs';
const level=+process.argv[2],E=JSON.parse(readFileSync(`edges${level}.json`)),S=JSON.parse(readFileSync(`spil${level}.json`)),partner=JSON.parse(readFileSync(`pairs${level}.json`));
const V=new Map(E.verts.map(v=>[v.k,v.ll]));
// rebuild the edge list in the same order as spilhaus.mjs
const eid=E.pieces.map(()=>Array(6)),list=[];for(let p=0;p<E.pieces.length;p++)for(let d=0;d<6;d++){if(eid[p][d]!==undefined)continue;const [q,dq]=partner[p][d];eid[p][d]=eid[q][dq]=list.length;list.push([p,d]);}
const bins=new Map();
for(const e of S.mismatchedEdges){const [p,d]=list[e],ll=V.get(E.cornerKeys[p][d]),k=`${Math.round(ll[0]/10)*10},${Math.round(ll[1]/10)*10}`;bins.set(k,(bins.get(k)||0)+1);}
console.log([...bins].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,n])=>k+':'+n).join('  '));
