// Land masses of the mask; "outer" = Afro-Eurasia + the Americas (the Spilhaus rim).
import {readFileSync,writeFileSync} from 'node:fs';
import {clearanceField} from '/home/user/hexagonal-world/dist/clearance.mjs';
const W=4320,H=2160,m=new Uint8Array(readFileSync('../mask.bin')),lab=new Int32Array(W*H).fill(-1),sizes=[];
for(let s=0;s<W*H;s++){if(!m[s]||lab[s]>=0)continue;const id=sizes.length;let n=0;const st=[s];lab[s]=id;
 while(st.length){const i=st.pop();n++;const x=i%W,y=(i-x)/W;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const yy=y+dy;if(yy<0||yy>=H)continue;const j=yy*W+(x+dx+W)%W;if(m[j]&&lab[j]<0){lab[j]=id;st.push(j);}}}
 sizes.push(n);}
const at=(la,lo)=>lab[Math.min(H-1,Math.floor((90-la)/180*H))*W+Math.floor((lo+180)/360*W)%W];
const named={afroeurasia:at(55,90),europe:at(50,10),africa:at(5,20),northamerica:at(40,-100),southamerica:at(-10,-55),antarctica:at(-80,0),australia:at(-25,135),greenland:at(72,-40)};
console.log('components',sizes.length,JSON.stringify(named));
const outerIds=new Set([named.afroeurasia,named.europe,named.africa,named.northamerica,named.southamerica]);
const outer=new Uint8Array(W*H);for(let i=0;i<W*H;i++)outer[i]=outerIds.has(lab[i])?1:0;
const toOuter=clearanceField(outer,W,H,1440,720).distance;                       // degrees from outer land
const inner=clearanceField(outer.map(v=>1-v),W,H,1440,720).distance;            // degrees inland, inside outer land
const f=new Float32Array(1440*720);for(let i=0;i<f.length;i++)f[i]=inner[i]>0?-inner[i]:toOuter[i]; // <=0 on rim land
writeFileSync('outer-field.bin',Buffer.from(f.buffer));writeFileSync('outer.bin',outer);
const ab=new Uint8Array(W*H);for(let i=0;i<W*H;i++)ab[i]=lab[i]===named.afroeurasia?1:lab[i]===named.northamerica?2:0;writeFileSync('ab.bin',ab);
