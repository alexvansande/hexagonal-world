import {circularMode,sphereHex} from './circular-projections.mjs';
import {norm,dot} from './geometry.mjs?v=circular-2';
import {sphereAt} from './globe-drag.mjs?v=circular-2';
import {subgridLevels} from './subgrid.mjs';

const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// A small circle of constant angular radius. Using a tangent basis on the
// sphere handles poles and latitude exactly, without stretching lon/lat circles.
export function sphericalCircle(center,radius,steps=72){
 const n=norm(center),u=norm(cross(n,Math.abs(n[2])<.9?[0,0,1]:[1,0,0])),v=cross(n,u);
 return Array.from({length:steps},(_,i)=>{
  const angle=i*Math.PI*2/steps;
  return n.map((x,j)=>x*Math.cos(radius)+(u[j]*Math.cos(angle)+v[j]*Math.sin(angle))*Math.sin(radius));
 });
}

// Invert the shader's normalized weighted vertex interpolation. Ray coefficients
// are proportional to barycentric weights raised to bias; normalize after taking
// the inverse power to recover planar coordinates.
export function patchProjector(patch,bias=1,blend=0){
 const [a,b,c]=patch.v.map(v=>mix(v,norm(v),blend)),det=dot(a,cross(b,c));
 const inverse=[cross(b,c),cross(c,a),cross(a,b)].map(row=>row.map(v=>v/det));
 const coefficients=p=>inverse.map(row=>dot(row,p));
 const point=coeff=>{
  const weights=coeff.map(v=>Math.max(0,v)**(1/bias)),sum=weights.reduce((s,v)=>s+v,0);
  return [0,1].map(j=>weights.reduce((s,v,i)=>s+v*patch.xy[i][j]/sum,0));
 };
 return {coefficients,point};
}

// Clip each spherical chord to a patch's cone before projection. This preserves
// the pieces of circles that cross a region boundary without joining map cuts.
export function projectCircle(circle,projector){
 const coefficients=circle.map(projector.coefficients),segments=[];
 for(let i=0;i<circle.length;i++){
  const a=coefficients[i],b=coefficients[(i+1)%circle.length];let lo=0,hi=1;
  for(let j=0;j<3;j++){
   if(a[j]<0&&b[j]<0){hi=-1;break;}
   if(a[j]<0)lo=Math.max(lo,-a[j]/(b[j]-a[j]));
   else if(b[j]<0)hi=Math.min(hi,-a[j]/(b[j]-a[j]));
  }
  if(hi-lo>1e-10)segments.push([projector.point(mix(a,b,lo)),projector.point(mix(a,b,hi))]);
 }
 return segments;
}

// Clip hemisphere crossings on the sphere before mapping. Split at the full
// world's antipode so a circle never draws a spurious chord across the map.
export function circularCircle(circle,mode,region){
 const segments=[],sign=region===1?-1:1;
 for(let i=0;i<circle.length;i++){
  let a=circle[i],b=circle[(i+1)%circle.length];
  if(mode===2){
   const za=a[2]*sign,zb=b[2]*sign;
   if(za<0&&zb<0)continue;
   if(za<0||zb<0){const cut=norm(mix(a,b,za/(za-zb)));if(za<0)a=cut;else b=cut;}
  }
  const pa=sphereHex(a,mode,region),pb=sphereHex(b,mode,region);
  if(pa&&pb&&Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<.4)segments.push([pa,pb]);
 }
 return segments;
}

export function indicatrixField(tiles,level,bias=1,blend=0){
 const radius=6*Math.PI/180/Math.sqrt(7)**(level-1),centers=[];
 for(const tile of tiles)for(const cell of subgridLevels[level]){
  const center=sphereAt(cell.center,{x:0,y:0,r:0},tile,bias,blend);
  if(center)centers.push({region:tile.id,flat:cell.center,sphere:center});
 }
 // The centers are defined by map positions. Rotating the globe rotates both
 // source circles and source centers together, so their projected outlines are
 // invariant under that rotation. Cache in the unrotated sphere coordinate frame.
 const circles=centers.map(center=>sphericalCircle(center.sphere,radius));
 const cm=circularMode(tiles[0].method);
 const regions=cm?tiles.map(tile=>circles.flatMap(circle=>circularCircle(circle,cm,tile.id))):tiles.map(tile=>tile.patches.flatMap(patch=>{
  const projector=patchProjector(patch,bias,blend);
  return circles.flatMap(circle=>projectCircle(circle,projector));
 }));
 return {centers,radius,regions};
}
