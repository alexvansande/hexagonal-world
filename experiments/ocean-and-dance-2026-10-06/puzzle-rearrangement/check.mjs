import {pieces,localSphere,pieceLocal,corner} from './core.mjs';
for(const level of [1,2]){const pcs=pieces(level),mids=[];
 pcs.forEach((pc,i)=>{for(let d=0;d<6;d++){const a=corner(d),b=corner(d+1);mids.push({i,d,p:localSphere(pc.parent,pieceLocal(pc,[(a[0]+b[0])/2,(a[1]+b[1])/2]))});}});
 let bad=0,maxd=0;const pair=[];for(const m of mids){const others=mids.filter(o=>o!==m&&Math.hypot(...o.p.map((v,k)=>v-m.p[k]))<1e-6);if(others.length!==1)bad++;else pair.push([m,others[0]]);}
 // also check corner points along shared edge match (orientation reversed)
 let cornerBad=0;for(const [m,o] of pair){const A=localSphere(pcs[m.i].parent,pieceLocal(pcs[m.i],corner(m.d))),B=localSphere(pcs[o.i].parent,pieceLocal(pcs[o.i],corner(o.d+1)));if(Math.hypot(...A.map((v,k)=>v-B[k]))>1e-6)cornerBad++;}
 // area check: centres distinct
 console.log('level',level,'edge midpoints not shared by exactly 2:',bad,'of',mids.length,'; reversed-corner mismatches',cornerBad);}
