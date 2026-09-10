import {circularMode,hexSphere} from './circular-projections.mjs';
import {norm} from './geometry.mjs?v=circular-2';
import {rotation} from './optimizer.mjs';
export const transform=(m,p)=>[0,1,2].map(i=>m[i*3]*p[0]+m[i*3+1]*p[1]+m[i*3+2]*p[2]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// Invert exactly the same planar patch interpolation used by the fragment shader.
export function sphereAt(point,tile,geometry,bias=1,blend=0){
 const angle=-tile.r*Math.PI/3,dx=point[0]-tile.x,dy=point[1]-tile.y;
 const x=dx*Math.cos(angle)-dy*Math.sin(angle),y=dx*Math.sin(angle)+dy*Math.cos(angle);
 if(tile.polygon&&tile.polygon.some((a,i)=>{const b=tile.polygon[(i+1)%tile.polygon.length];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])< -1e-8;}))return null;
 for(const patch of geometry.patches){const [a,b,c]=patch.xy;
  const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det;
  const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;
  const weights=[u,v,1-u-v];if(weights.some(w=>w< -1e-8))continue;
  if(circularMode(geometry.method))return hexSphere([x,y],circularMode(geometry.method),geometry.id);
  const powered=weights.map(w=>Math.max(0,w)**bias),sum=powered.reduce((a,b)=>a+b,0);
  return norm([0,1,2].map(j=>patch.v.reduce((s,p,i)=>s+(p[j]*(1-blend)+norm(p)[j]*blend)*powered[i]/sum,0)));
 }
 return null;
}
// Apply the shortest world-space rotation that maps the new cursor sample to
// the geographic point grabbed on pointer-down. Roll changes along with pitch/yaw.
export function followPoint(angles,sample,anchor){
 const matrix=rotation(angles),from=norm(transform(matrix,sample)),to=norm(anchor);
 let axis=cross(from,to),s=Math.hypot(...axis),c=Math.max(-1,Math.min(1,dot(from,to)));
 if(s<1e-12){if(c>0)return {...angles};axis=norm(cross(from,Math.abs(from[0])<.8?[1,0,0]:[0,1,0]));s=0;c=-1;}else axis=axis.map(v=>v/s);
 const [x,y,z]=axis,k=1-c;
 const q=[c+x*x*k,x*y*k-z*s,x*z*k+y*s,y*x*k+z*s,c+y*y*k,y*z*k-x*s,z*x*k-y*s,z*y*k+x*s,c+z*z*k];
 const m=Array.from({length:9},(_,i)=>{const r=Math.floor(i/3),col=i%3;return [0,1,2].reduce((s,k)=>s+q[r*3+k]*matrix[k*3+col],0);});
 const lat=Math.asin(Math.max(-1,Math.min(1,m[6]))),pole=Math.abs(Math.cos(lat))<1e-8;
 return {lon:Math.atan2(pole?-m[1]:m[3],pole?m[4]:m[0])*180/Math.PI,lat:lat*180/Math.PI,roll:pole?0:Math.atan2(m[7],m[8])*180/Math.PI};
}
export const geographicPoint=(angles,p)=>transform(rotation(angles),p);
