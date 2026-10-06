// Count planar joins that are not true spherical partners (with orientation).
import {readFileSync} from 'node:fs';
export const DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export function audit(level,place){ // place[p]={a,b,k}
 const partner=JSON.parse(readFileSync(new URL(`pairs${level}.json`,import.meta.url))),occ=new Map(place.map((x,p)=>[x.a+','+x.b,p]));
 let good=0,bad=0;
 place.forEach((x,p)=>{for(let D=0;D<6;D++){const q=occ.get((x.a+DIR[D][0])+','+(x.b+DIR[D][1]));if(q===undefined||q<p)continue;
  const d=(D-x.k+6)%6,dq=(D+3-place[q].k+6)%6,[tq,td]=partner[p][d];if(tq===q&&td===dq)good++;else bad++;}});
 return {good,bad,overlaps:place.length-occ.size};
}
export function defaultPlace(pieces){
 const S3=Math.sqrt(3),e0=[S3*Math.cos(Math.PI/6),S3*Math.sin(Math.PI/6)],e1=[0,S3],phi=pieces[0].netTurn,rot=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
 return pieces.map(pc=>{const c=rot(pc.netCenter,-phi).map(v=>v/pc.scale),a=Math.round(c[0]/e0[0]);return {a,b:Math.round((c[1]-a*e0[1])/e1[1]),k:0};});
}
if(process.argv[2]){
 const level=+process.argv[2],{pieces}=JSON.parse(readFileSync(`edges${level}.json`));
 console.log('level',level,'default layout joins',audit(level,defaultPlace(pieces)));
 try{const L=JSON.parse(readFileSync(`layout${level}.json`));console.log('level',level,'previous rearrangement joins',audit(level,L.pos.map(([a,b],p)=>({a,b,k:L.rotations[p]}))));}catch{}
}
