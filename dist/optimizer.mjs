import {makeGeometry,matching,norm,add,mul,world,hex} from './geometry.mjs';
const D=Math.PI/180;
// Uniform samples along the flat hexagon perimeter, with each paired edge counted once.
export function edgeSamples({method,height,bias=1,blend=0},resolution=256){
 const tiles=makeGeometry(method,height),samples=[];
 for(const tile of tiles)for(let e=0;e<6;e++){
  const other=matching(tiles,tile.id,e);if(tile.id>other.id)continue;
  const mix=v=>add(mul(v,1-blend),mul(norm(v),blend));
  const a=mix(tile.ring[e]),b=mix(tile.ring[(e+1)%6]);
  for(let i=0;i<resolution;i++){const t=(i+.5)/resolution,wa=(1-t)**bias,wb=t**bias;samples.push(...norm(add(mul(a,wa),mul(b,wb))));}
 }
 return new Float64Array(samples);
}
function sphereAt(point,tile,geometry,bias=1,blend=0){
 const angle=-tile.r*Math.PI/3,dx=point[0]-tile.x,dy=point[1]-tile.y;
 const x=dx*Math.cos(angle)-dy*Math.sin(angle),y=dx*Math.sin(angle)+dy*Math.cos(angle);
 if(tile.polygon&&tile.polygon.some((a,i)=>{const b=tile.polygon[(i+1)%tile.polygon.length];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])< -1e-8;}))return null;
 for(const patch of geometry.patches){const [a,b,c]=patch.xy;
  const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det;
  const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;
  const weights=[u,v,1-u-v];if(weights.some(w=>w< -1e-8))continue;
  const powered=weights.map(w=>Math.max(0,w)**bias),sum=powered.reduce((s,w)=>s+w,0);
  return norm([0,1,2].map(j=>patch.v.reduce((s,p,i)=>s+(p[j]*(1-blend)+norm(p)[j]*blend)*powered[i]/sum,0)));
 }
 return null;
}
function overlap(a,b){
 const [p,q]=[a,b],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);if(length<1e-12)return null;
 return point=>Math.abs(dx*(point[1]-p[1])-dy*(point[0]-p[0]))<=1e-7*length;
}
function coveredInterval(segment,other){
 const [a,b]=[segment.a,segment.b],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),sameLine=overlap(a,b);
 if(!sameLine||!sameLine(other.a)||!sameLine(other.b))return null;
 const length2=dx*dx+dy*dy,parameter=p=>((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2;
 const lo=Math.max(0,Math.min(parameter(other.a),parameter(other.b))),hi=Math.min(1,Math.max(parameter(other.a),parameter(other.b)));
 return hi-lo>1e-8?[lo,hi]:null;
}
// Return only portions of the selected planar net that are not covered by
// another piece. This keeps internal joins out of the land-edge objective.
function outerSegments(segments){
 const exposed=[];
 for(const segment of segments){
  const cuts=[0,1];
  for(const other of segments)if(other!==segment){const interval=coveredInterval(segment,other);if(interval)cuts.push(...interval);}
  cuts.sort((a,b)=>a-b);
  const unique=cuts.filter((value,i)=>i===0||value-cuts[i-1]>1e-8);
  for(let i=0;i+1<unique.length;i++){
   const lo=unique[i],hi=unique[i+1],mid=(lo+hi)/2,point=[segment.a[0]+(segment.b[0]-segment.a[0])*mid,segment.a[1]+(segment.b[1]-segment.a[1])*mid];
   const internal=segments.some(other=>other!==segment&&coveredInterval(segment,other)?.[0]<=mid+1e-8&&coveredInterval(segment,other)?.[1]>=mid-1e-8);
   if(!internal)exposed.push({a:[segment.a[0]+(segment.b[0]-segment.a[0])*lo,segment.a[1]+(segment.b[1]-segment.a[1])*lo],b:[segment.a[0]+(segment.b[0]-segment.a[0])*hi,segment.a[1]+(segment.b[1]-segment.a[1])*hi],tile:segment.tile});
  }
 }
 return exposed;
}
export function outerEdgeSamples(config,arrangement,resolution=256){
 if(!arrangement?.net||arrangement.tiling)return new Float64Array();
 const geometry=makeGeometry(config.method,config.height),segments=[];
 for(const tile of arrangement.net){const polygon=tile.polygon||hex;for(let i=0;i<polygon.length;i++)segments.push({a:world(polygon[i],tile),b:world(polygon[(i+1)%polygon.length],tile),tile});}
 const samples=[];
 for(const segment of outerSegments(segments))for(let i=0;i<resolution;i++){
  const t=(i+.5)/resolution,point=[segment.a[0]+(segment.b[0]-segment.a[0])*t,segment.a[1]+(segment.b[1]-segment.a[1])*t],sample=sphereAt(point,segment.tile,geometry[segment.tile.id],config.bias??1,config.blend??0);
  if(sample)samples.push(...sample);
 }
 return new Float64Array(samples);
}
export function rotation({lon,lat,roll}){
 const cy=Math.cos(lon*D),sy=Math.sin(lon*D),cp=Math.cos(lat*D),sp=Math.sin(lat*D),cr=Math.cos(roll*D),sr=Math.sin(roll*D);
 // Same X roll, negative Y pitch, then Z longitude as the map shader.
 return [cy*cp,-cy*sp*sr-sy*cr,-cy*sp*cr+sy*sr,sy*cp,-sy*sp*sr+cy*cr,-sy*sp*cr-cy*sr,sp,cp*sr,cp*cr];
}
export function landScore(samples,angles,mask,width,height){
 const m=rotation(angles);let total=0;
 for(let i=0;i<samples.length;i+=3){const x=samples[i],y=samples[i+1],z=samples[i+2];
  const px=m[0]*x+m[1]*y+m[2]*z,py=m[3]*x+m[4]*y+m[5]*z,pz=m[6]*x+m[7]*y+m[8]*z;
  const u=(Math.atan2(py,px)/(2*Math.PI)+.5)*width-.5,v=Math.max(0,Math.min(height-1,(.5-Math.asin(Math.max(-1,Math.min(1,pz)))/Math.PI)*height-.5));
  const ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,x0=(ix+width)%width,x1=(x0+1)%width,y1=Math.min(height-1,iy+1);
  total+=(mask[iy*width+x0]*(1-fx)+mask[iy*width+x1]*fx)*(1-fy)+(mask[y1*width+x0]*(1-fx)+mask[y1*width+x1]*fx)*fy;
 }
 return total/(samples.length/3);
}
const wrap=x=>((x+180)%360+360)%360-180;
function canonical(p){let {lon,lat,roll}=p;lat=wrap(lat);if(lat>90){lat=180-lat;lon+=180;roll+=180;}if(lat< -90){lat=-180-lat;lon+=180;roll+=180;}return {lon:wrap(lon),lat,roll:wrap(roll)};}
export function optimize({config,start,mask,width,height,arrangement,budget=1500,seed=1},progress=()=>{}){
 let rng=seed>>>0;const random=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
 const sample=(resolution)=>arrangement?outerEdgeSamples(config,arrangement,resolution):edgeSamples(config,resolution),coarse=sample(64),fine=sample(512);let evaluations=0;
 if(!coarse.length)return {angles:{...start},before:0,after:0,evaluations,samples:0};
 const score=(p,samples=coarse)=>{evaluations++;return landScore(samples,p,mask,width,height);};
 const baseline=score(start,fine);let pool=[{angles:{...start},score:score(start)}];
 const retain=entry=>{pool.push(entry);pool.sort((a,b)=>a.score-b.score);pool.length=Math.min(pool.length,12);};
 for(let i=0;i<budget;i++){
  const angles={lon:random()*360-180,lat:Math.asin(random()*2-1)/D,roll:random()*360-180};retain({angles,score:score(angles)});
  if(i%100===0)progress({phase:'Exploring rotations',percent:Math.round(i/budget*65)});
 }
 // Refine multiple independent basins, not just the best coarse-grid candidate.
 const refined=[];for(let i=0;i<pool.length;i++){
  let best=pool[i];for(const step of [12,6,3,1.5,.75])for(let sweep=0;sweep<5;sweep++){
   let improved=false;for(const axis of ['lon','lat','roll'])for(const sign of [-1,1]){const angles=canonical({...best.angles,[axis]:best.angles[axis]+sign*step}),s=score(angles);if(s<best.score){best={angles,score:s};improved=true;}}
   if(!improved)break;
  }refined.push({...best,score:score(best.angles,fine)});progress({phase:'Refining candidates',percent:65+Math.round((i+1)/pool.length*20)});
 }
 refined.push({angles:{...start},score:baseline});refined.sort((a,b)=>a.score-b.score);let best=refined[0];
 for(const step of [.6,.3,.15,.075])for(let sweep=0;sweep<5;sweep++){
  let improved=false;for(const axis of ['lon','lat','roll'])for(const sign of [-1,1]){const angles=canonical({...best.angles,[axis]:best.angles[axis]+sign*step}),s=score(angles,fine);if(s<best.score){best={angles,score:s};improved=true;}}
  if(!improved)break;
 }
 // Independent denser validation prevents accepting a coarse-sampling regression.
 progress({phase:'Validating perimeter',percent:95});const validation=edgeSamples(config,2048);const before=score(start,validation),after=score(best.angles,validation);
 return {angles:after<=before?best.angles:{...start},before,after:Math.min(after,before),evaluations,samples:validation.length/3};
}
