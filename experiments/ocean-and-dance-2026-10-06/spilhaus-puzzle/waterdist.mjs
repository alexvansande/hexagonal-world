// Shortest path to rim land where only water costs (degrees of great-circle length); land is free.
import {readFileSync,writeFileSync} from 'node:fs';
const W=4320,H=2160,w=1440,h=720,m=new Uint8Array(readFileSync('../mask.bin')),outer=new Uint8Array(readFileSync('outer.bin'));
const land=new Float32Array(w*h),rim=new Uint8Array(w*h);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=Math.floor(y*h/H)*w+Math.floor(x*w/W),k=y*W+x;land[i]+=m[k]/9;if(outer[k])rim[i]=1;}
const dist=new Float64Array(w*h).fill(Infinity),heap=[];
const push=(i,d)=>{let j=heap.length;heap.push([i,d]);while(j){const p=(j-1)>>1;if(heap[p][1]<=d)break;heap[j]=heap[p];j=p;}heap[j]=[i,d];};
const pop=()=>{const r=heap[0],last=heap.pop();if(heap.length){let j=0;while(j*2+1<heap.length){let c=j*2+1;if(c+1<heap.length&&heap[c+1][1]<heap[c][1])c++;if(heap[c][1]>=last[1])break;heap[j]=heap[c];j=c;}heap[j]=last;}return r;};
for(let i=0;i<w*h;i++)if(rim[i]){dist[i]=0;push(i,0);}
const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
while(heap.length){const [i,d]=pop();if(d>dist[i])continue;const x=i%w,y=(i-x)/w;
 for(const [dx,dy] of dirs){const yy=y+dy;if(yy<0||yy>=h)continue;const j=yy*w+(x+dx+w)%w,lat=(90-(y+yy+1)*90/h)*Math.PI/180;
  const len=Math.hypot(dy*180/h,dx*360/w*Math.cos(lat)),water=1-(land[i]+land[j])/2,nd=d+len*Math.max(0,water);
  if(nd<dist[j]){dist[j]=nd;push(j,nd);}}}
const f=new Float32Array(readFileSync('outer-field.bin').buffer.slice(0));
for(let i=0;i<w*h;i++)if(f[i]>0)f[i]=dist[i];   // keep inland depth (negative) on rim land
writeFileSync('outer-field-water.bin',Buffer.from(f.buffer));
const at=(la,lo)=>dist[Math.floor((90-la)/180*h)*w+Math.floor((lo+180)/360*w)%w];
console.log('Java Sea',at(-5.5,112).toFixed(2),'N Pacific',at(34,-161.7).toFixed(2),'S Pacific',at(-55.4,-150).toFixed(2),'Antarctica',at(-80,0).toFixed(2),'Mindanao',at(7.8,124.5).toFixed(2),'Banks Is.',at(72.5,-121.6).toFixed(2));
