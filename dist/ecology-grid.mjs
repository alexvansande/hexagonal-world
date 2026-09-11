import {gosperScale} from './subgrid.mjs';

// Match the 0.5-degree land source without claiming extra information. Choose
// the first even Gosper level whose nominal spherical diameter fits one source
// cell. Even levels share the parent/subgrid orientation (level 6, radius 1/343).
const sourceDegrees=.5,averageSphereScale=Math.sqrt(Math.PI/(3*Math.sqrt(3)/2));
export const ecologyGridLevel=2*Math.ceil(Math.log(2*averageSphereScale/(sourceDegrees*Math.PI/180))/Math.log(7));
export const ecologyHexRadius=gosperScale**ecologyGridLevel;
// Two more Gosper subdivisions: seven times smaller across, same orientation.
export const riverGridRefinement=7;
export const riverHexRadius=ecologyHexRadius/riverGridRefinement;
export function riverCellCenter(p){
 return ecologyCellCenter(p.map(v=>v*riverGridRefinement)).map(v=>v/riverGridRefinement);
}

export function ecologyCellCenter([x,y]){
 const q=2*x/(3*ecologyHexRadius),r=(-x/3+y/Math.sqrt(3))/ecologyHexRadius,s=-q-r;
 let iq=Math.round(q),ir=Math.round(r),is=Math.round(s);
 const dq=Math.abs(q-iq),dr=Math.abs(r-ir),ds=Math.abs(s-is);
 if(dq>dr&&dq>ds)iq=-ir-is;else if(dr>ds)ir=-iq-is;
 return [ecologyHexRadius*1.5*iq,ecologyHexRadius*Math.sqrt(3)*(ir+iq/2)];
}

export const ecologyGridGLSL=`
uniform int ecologyHex;
uniform int ecologyBridges;
uniform int ecologyOcta;
uniform vec3 ecologyVertices[28];
varying vec2 localPosition;
varying float regionIndex;
vec2 ecologyCenter(vec2 p){
 // Fewer parent hexagons cover more of the sphere: advance two Gosper levels.
 float radius=${ecologyHexRadius.toFixed(12)}/(circularMode>0?7.:1.);
 vec2 qr=vec2(2.*p.x/3.,-p.x/3.+p.y/sqrt(3.))/radius;
 vec3 cube=vec3(qr,-qr.x-qr.y),rounded=floor(cube+.5),error=abs(cube-rounded);
 if(error.x>error.y&&error.x>error.z)rounded.x=-rounded.y-rounded.z;
 else if(error.y>error.z)rounded.y=-rounded.x-rounded.z;
 return radius*vec2(1.5*rounded.x,sqrt(3.)*(rounded.y+rounded.x*.5));
}
vec2 riverCenter(vec2 p){return ecologyCenter(p*${riverGridRefinement.toFixed(1)})/${riverGridRefinement.toFixed(1)};}
vec2 hexCorner(float index){float angle=index*1.047197551197;return vec2(cos(angle),sin(angle));}
vec3 planarWeights(vec2 p,vec2 a,vec2 b,vec2 c){
 float det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
 float u=((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y))/det;
 float v=((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y))/det;
 return vec3(u,v,1.-u-v);
}
vec3 ecologySphere(vec2 p){
 if(circularMode>0)return hexSphere(p,regionIndex);
 int sector=length(p)<.000001?0:int(floor(mod(atan(p.y,p.x)+6.28318530718,6.28318530718)/1.047197551197));
 // Constant loop bounds keep uniform-array indexing valid in WebGL 1.
 for(int region=0;region<4;region++)if(abs(regionIndex-float(region))<.5){
  if(ecologyOcta==1){
   vec3 weights=planarWeights(p,hexCorner(0.),hexCorner(2.),hexCorner(4.));
   if(min(weights.x,min(weights.y,weights.z))>=0.)return atlasSphere(weights,ecologyVertices[region*7+1],ecologyVertices[region*7+3],ecologyVertices[region*7+5],bias,blend);
   for(int e=0;e<6;e+=2){
    weights=planarWeights(p,hexCorner(float(e)),hexCorner(float(e+1)),hexCorner(float(e+2)));
    if(weights.y>=0.&&weights.x>=-.01&&weights.z>=-.01)return atlasSphere(weights,ecologyVertices[region*7+e+1],ecologyVertices[region*7+e+2],ecologyVertices[region*7+((e+2)-((e+2)/6)*6)+1],bias,blend);
   }
  }else{
   for(int e=0;e<6;e++)if(e==sector){
    vec3 weights=planarWeights(p,vec2(0.),hexCorner(float(e)),hexCorner(float(e+1)));
    return atlasSphere(weights,ecologyVertices[region*7],ecologyVertices[region*7+e+1],ecologyVertices[region*7+((e+1)-((e+1)/6)*6)+1],bias,blend);
   }
  }
 }
 return atlasSphere(weights,a,b,c,bias,blend);
}
`;

// Unroll neighbor access so this remains compatible with WebGL 1. Every
// decision uses the original six source colors, never a previously patched cell.
const samples=Array.from({length:6},(_,i)=>`
 location=center+radius*sqrt(3.)*hexCorner(${i+.5});
 valid[${i}]=ecologyInside(location);
 colors[${i}]=valid[${i}]?ecologySample(location):original;
 complete=complete&&valid[${i}];
 if(valid[${i}]&&ecologySame(colors[${i}],original))isolated=false;
`).join('');
const chains=Array.from({length:6},(_,i)=>`
 if(valid[${i}]&&!ecologySame(colors[${i}],original)){
  count=1;continuing=true;
  ${Array.from({length:5},(_,j)=>{const n=(i+j+1)%6;return `
  continuing=continuing&&valid[${n}]&&ecologySame(colors[${i}],colors[${n}]);
  if(continuing)count++;`;}).join('')}
  if(count>longest)longest=count;
 }
`).join('');

// Midpoint experiment: keep all tied longest runs. Their smaller patches
// occupy separate corners/sides, so competing colors need not overwrite them.
const midpointPatches=Array.from({length:6},(_,i)=>`
 if(valid[${i}]&&!ecologySame(colors[${i}],original)){
  count=1;continuing=true;
  ${Array.from({length:2},(_,j)=>{const n=(i+j+1)%6;return `continuing=continuing&&valid[${n}]&&ecologySame(colors[${i}],colors[${n}]);if(continuing)count++;`;}).join('')}
  if(count==longest){
   if(longest==2&&dot(offset,hexCorner(${i+1}.))>=.75)return colors[${i}];
   if(longest==3&&dot(offset,hexCorner(${i+1.5}))>=sqrt(3.)*.25)return colors[${i}];
  }
 }
`).join('');

// Literal sketch mode has no fallback to interpolated/shared boundaries.
const drawnPatches=Array.from({length:6},(_,i)=>`
 if(valid[${i}]&&!ecologySame(colors[${i}],original)){
  count=1;continuing=true;
  ${Array.from({length:5},(_,j)=>{const n=(i+j+1)%6;return `continuing=continuing&&valid[${n}]&&ecologySame(colors[${i}],colors[${n}]);if(continuing)count++;`;}).join('')}
  if(count==longest){
   if(longest==6)return dot(offset,offset)<=4./9.?original:colors[${i}];
   if(longest==2&&dot(offset,hexCorner(${i+1}.))>=.75)return colors[${i}];
   if(longest==3&&dot(offset,hexCorner(${i+1.5}))>=sqrt(3.)*.25)return colors[${i}];
   if(longest==4||longest==5){
    float angle=mod(atan(offset.y,offset.x)-${i+.5}*1.047197551197+12.56637061436,6.28318530718);
    if(dot(offset,offset)<1.e-12||angle<=float(longest-1)*1.047197551197)return colors[${i}];
   }
  }
 }
`).join('');

const stackDirections=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const stackCells=[];for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=2)stackCells.push([q,r]);
const stackIndex=([q,r])=>stackCells.findIndex(c=>c[0]===q&&c[1]===r);
const stackSample=stackCells.map(([q,r],i)=>`location=center+radius*vec2(${(1.5*q).toFixed(12)},${(Math.sqrt(3)*(r+q/2)).toFixed(12)});colors[${i}]=ecologyInside(location)?ecologySample(location):original;weights[${i}]=0.;`).join('\n');
const stackWeights=stackDirections.map((_,i)=>`if(sector==${i}){${[[0,0],stackDirections[i],stackDirections[(i+1)%6]].map((origin,j)=>{
 const weight=['wc','wa','wb'][j];return `weights[${stackIndex(origin)}]+=2.*${weight};`+stackDirections.map(d=>`weights[${stackIndex(d.map((v,k)=>v+origin[k]))}]+=${weight};`).join('');
}).join('')}}`).join('\n');

export const ecologyBridgeGLSL=`
bool ecologyInside(vec2 p){p=abs(p);return p.y<=sqrt(3.)*.5&&sqrt(3.)*.5*p.x+.5*p.y<=sqrt(3.)*.5;}
bool ecologySame(vec3 a,vec3 b){return all(lessThan(abs(a-b),vec3(.5/255.)));}
vec3 ecologySample(vec2 center){return texture2D(map,geographicUV(ecologySphere(center),angles)).rgb;}
vec3 ecologyPairColor(vec2 p,vec2 center,vec3 original){
 float radius=${ecologyHexRadius.toFixed(12)}/(circularMode>0?7.:1.);
 vec2 offset=(p-center)/radius;
 for(int corner=0;corner<6;corner++){
  vec2 outward=hexCorner(float(corner));
  if(dot(offset,outward)>.75){
   vec2 tangent=vec2(-outward.y,outward.x);
   vec2 first=center+radius*(1.5*outward+sqrt(3.)*.5*tangent);
   vec2 second=center+radius*(1.5*outward-sqrt(3.)*.5*tangent);
   if(!ecologyInside(first)||!ecologyInside(second))return original;
   vec3 a=ecologySample(first),b=ecologySample(second);
   return ecologySame(a,b)?a:original;
  }
 }
 return original;
}
// Shared linear class votes include every contributing color. An edge gets
// the same result from either triangle, including at multi-color junctions.
vec3 ecologyStraightColor(vec2 center,vec3 original,float radius,int sector,float wc,float wa,float wb){
 vec3 colors[19];float weights[19];vec2 location;
 ${stackSample}
 ${stackWeights}
 vec3 best=original;float bestScore=-1.;float bestKey=1.e9;
 for(int candidate=0;candidate<19;candidate++){
  float score=0.;
  for(int sampleIndex=0;sampleIndex<19;sampleIndex++)if(ecologySame(colors[candidate],colors[sampleIndex]))score+=weights[sampleIndex];
  float key=dot(colors[candidate],vec3(65536.,256.,1.));
  if(score>bestScore||(score==bestScore&&key<bestKey)){best=colors[candidate];bestScore=score;bestKey=key;}
 }
 return best;
}
vec3 ecologyBridgedColor(vec2 p,vec2 center,vec3 original){
 if(ecologyBridges<2)return ecologyPairColor(p,center,original);
 float radius=${ecologyHexRadius.toFixed(12)}/(circularMode>0?7.:1.);
 vec2 offset=(p-center)/radius,location;
 vec3 colors[6];bool valid[6];bool isolated=true,complete=true;
 ${samples}
 int longest=1,count;bool continuing;
 // Chain length determines whether this isolated cell needs a circle.
 ${chains}
 if(ecologyBridges==5){
  ${drawnPatches}
  return original;
 }
 bool circle=longest>=3&&isolated&&complete;
 if(circle&&dot(offset,offset)<=.75)return original;
 if(ecologyBridges==3&&!circle&&longest<=3){
  ${midpointPatches}
  return original;
 }

 // Every three neighboring centers share one triangle. Sum their barycentric
 // weights by source class, so both sides choose the very same dividing line.
 // Independent, oversized cutouts can exchange colors across a shared edge.
 for(int i=0;i<6;i++){
  vec2 a=sqrt(3.)*hexCorner(float(i)+.5);
  vec2 b=sqrt(3.)*hexCorner(float(i)+1.5);
  float det=a.x*b.y-a.y*b.x;
  float wa=(offset.x*b.y-offset.y*b.x)/det;
  float wb=(a.x*offset.y-a.y*offset.x)/det;
  if(wa>=-.000001&&wb>=-.000001){
   vec3 ca=original,cb=original;bool va=false,vb=false;
   ${Array.from({length:6},(_,i)=>`if(i==${i}){ca=colors[${i}];cb=colors[${(i+1)%6}];va=valid[${i}];vb=valid[${(i+1)%6}];}`).join('\n')}
   if(!va||!vb)return original;
   // The island is replaced by its circle: no leftover original-color corners.
   if(circle)return wa>=wb?ca:cb;
   float wc=1.-wa-wb;
   if(ecologyBridges==4)return ecologyStraightColor(center,original,radius,i,wc,wa,wb);
   float own=wc+(ecologySame(original,ca)?wa:0.)+(ecologySame(original,cb)?wb:0.);
   float sa=wa+(ecologySame(ca,original)?wc:0.)+(ecologySame(ca,cb)?wb:0.);
   float sb=wb+(ecologySame(cb,original)?wc:0.)+(ecologySame(cb,ca)?wa:0.);
   if(own>=sa&&own>=sb)return original;
   return sa>=sb?ca:cb;
  }
 }
 return original;
}
`;
