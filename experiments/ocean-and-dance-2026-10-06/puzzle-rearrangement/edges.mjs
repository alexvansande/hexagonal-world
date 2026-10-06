import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,edgeOcean,DEFAULT,localSphere,pieceLocal,geo} from './core.mjs';
const mask=new Uint8Array(readFileSync('../mask.bin'));
for(const level of [1,2]){const pcs=pieces(level),o=edgeOcean(pcs,mask,4320,2160,DEFAULT);
 // sanity: adjacent cells share edges -> matching ocean values
 const centres=pcs.map(pc=>geo(localSphere(pc.parent,pieceLocal(pc,[0,0])),DEFAULT));
 writeFileSync(`edges${level}.json`,JSON.stringify({pieces:pcs,ocean:o,centres}));
 const flat=o.flat();console.log('level',level,'pieces',pcs.length,'mean edge ocean',(flat.reduce((a,b)=>a+b)/flat.length).toFixed(3),'all-land pieces',o.filter(e=>e.every(x=>x<.01)).length,'all-ocean',o.filter(e=>e.every(x=>x>.99)).length);}
