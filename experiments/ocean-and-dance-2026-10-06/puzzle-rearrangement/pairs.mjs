// True spherical edge partners: piece p edge d <-> piece q edge d' (corners reversed).
import {writeFileSync} from 'node:fs';
import {pieces,localSphere,pieceLocal,corner} from './core.mjs';
for(const level of [1,2]){const pcs=pieces(level),mids=[];
 pcs.forEach((pc,i)=>{for(let d=0;d<6;d++){const a=corner(d),b=corner(d+1);mids.push({i,d,p:localSphere(pc.parent,pieceLocal(pc,[(a[0]+b[0])/2,(a[1]+b[1])/2]))});}});
 const partner=pcs.map(()=>Array(6));
 for(const m of mids){const o=mids.find(o=>o!==m&&Math.hypot(...o.p.map((v,k)=>v-m.p[k]))<1e-6);partner[m.i][m.d]=[o.i,o.d];}
 writeFileSync(`pairs${level}.json`,JSON.stringify(partner));
}
