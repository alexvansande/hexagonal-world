import {gosperScale} from './subgrid.mjs';

// Match the 0.5-degree land source without claiming extra information. Choose
// the first even Gosper level whose nominal spherical diameter fits one source
// cell. Even levels share the parent/subgrid orientation (level 6, radius 1/343).
const sourceDegrees=.5,averageSphereScale=Math.sqrt(Math.PI/(3*Math.sqrt(3)/2));
export const ecologyGridLevel=2*Math.ceil(Math.log(2*averageSphereScale/(sourceDegrees*Math.PI/180))/Math.log(7));
export const ecologyHexRadius=gosperScale**ecologyGridLevel;

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

// A bridge between two touching hexes is sqrt(3)*r long and 1.5*r wide.
// Inside a third hex it covers only the corner beyond 0.75*r. At most one
// such corner contains a point, so only two extra source samples are needed.
export const ecologyBridgeGLSL=`
bool ecologyInside(vec2 p){
 p=abs(p);
 return p.y<=sqrt(3.)*.5&&sqrt(3.)*.5*p.x+.5*p.y<=sqrt(3.)*.5;
}
vec3 ecologySample(vec2 center){return texture2D(map,geographicUV(ecologySphere(center),angles)).rgb;}
vec3 ecologyBridgedColor(vec2 p,vec2 center,vec3 original){
 float radius=${ecologyHexRadius.toFixed(12)}/(circularMode>0?7.:1.);
 vec2 offset=(p-center)/radius;
 for(int corner=0;corner<6;corner++){
  vec2 outward=hexCorner(float(corner));
  if(dot(offset,outward)>.75){
   vec2 tangent=vec2(-outward.y,outward.x);
   vec2 first=center+radius*(1.5*outward+sqrt(3.)*.5*tangent);
   vec2 second=center+radius*(1.5*outward-sqrt(3.)*.5*tangent);
   // Do not extrapolate a class across a cut between projection regions.
   if(!ecologyInside(first)||!ecologyInside(second))return original;
   vec3 a=ecologySample(first),b=ecologySample(second);
   return all(lessThan(abs(a-b),vec3(.5/255.)))?a:original;
  }
 }
 return original;
}
`;
