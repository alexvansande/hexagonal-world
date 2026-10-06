import {readFileSync,writeFileSync} from 'node:fs';
import {makeGeometry,layouts} from '/home/user/hexagonal-world/dist/geometry.mjs';
import {makeArrangement} from '/home/user/hexagonal-world/dist/arrangements.mjs';
import {optimize,outerEdgeSamples,landScore} from '/home/user/hexagonal-world/dist/optimizer.mjs';
const W=4320,H=2160,land=new Uint8Array(readFileSync('mask.bin')),ocean=land.map(v=>1-v);
const config={method:'rhombic',height:1.5,bias:1,blend:0},tiles=makeGeometry('rhombic',1.5),arrangement=makeArrangement(tiles,'dymaxion',layouts(tiles));
const val=outerEdgeSamples(config,arrangement,2048),landPct=a=>(landScore(val,a,land,W,H)*100).toFixed(1)+'%';
const refs={default:{lon:-170.01889457926154,lat:32.99273576349003,roll:-13.384930707514286},vertices:{lon:-79.63,lat:77.93,roll:-81.53}};
for(const [k,a] of Object.entries(refs))console.log(k,'border on land',landPct(a));
const runs=[];
for(const seed of [1,17931,42,7,99,2024,31337,555]){
 const r=optimize({config,arrangement,start:refs.vertices,mask:ocean,width:W,height:H,budget:6000,seed});
 runs.push({seed,angles:r.angles,land:1-r.after});console.log('seed',seed,JSON.stringify(r.angles),'border on land',landPct(r.angles));
}
runs.sort((a,b)=>b.land-a.land);writeFileSync('border-best.json',JSON.stringify(runs,null,1));
