// Edge partners by hashing sphere midpoints (O(n)).
import {writeFileSync} from 'node:fs';
import {pieces,localSphere,pieceLocal,corner} from './core.mjs';
const level=+process.argv[2],pcs=pieces(level),map=new Map(),partner=pcs.map(()=>Array(6));
const key=P=>P.map(v=>Math.round(v*1e5)).join(',');
pcs.forEach((pc,i)=>{for(let d=0;d<6;d++){const a=corner(d),b=corner(d+1),k=key(localSphere(pc.parent,pieceLocal(pc,[(a[0]+b[0])/2,(a[1]+b[1])/2])));
 if(map.has(k)){const [j,e]=map.get(k);partner[i][d]=[j,e];partner[j][e]=[i,d];map.delete(k);}else map.set(k,[i,d]);}});
console.log('level',level,'unpaired',map.size);writeFileSync(`pairs${level}.json`,JSON.stringify(partner));
