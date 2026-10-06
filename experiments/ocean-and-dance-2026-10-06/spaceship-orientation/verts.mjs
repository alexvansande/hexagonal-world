import {makeGeometry,norm} from '/home/user/hexagonal-world/dist/geometry.mjs';
const g=makeGeometry('rhombic',1.5),pts=[],key=p=>p.map(v=>v.toFixed(6)).join(',');
const seen=new Map();
for(const t of g)for(const v of t.ring){const n=norm(v),k=key(n);if(!seen.has(k))seen.set(k,{p:n,tiles:[]});seen.get(k).tiles.push(t.id);}
console.log(JSON.stringify({vertices:[...seen.values()],centers:g.map(t=>norm(t.center))}));
