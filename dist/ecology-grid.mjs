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

// Generate constant array indices for WebGL 1. A complete rectangle can enter
// an adjacent cell, so consider patch origins in its first ring and read the
// original colors out to ring two (19 shared samples, never recursive fills).
const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const cells=[];for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=2)cells.push([q,r]);
const cellIndex=([q,r])=>cells.findIndex(c=>c[0]===q&&c[1]===r);
const point=([q,r])=>[1.5*q,Math.sqrt(3)*(r+q/2)];
const vec=([x,y])=>`vec2(${x.toFixed(12)},${y.toFixed(12)})`;
const neighbors=directions.map(cellIndex);
const originIndex=cellIndex([0,0]);
const sampleCell=(c,i)=>i===originIndex?`colors[${i}]=original;valid[${i}]=true;`:`location=center+radius*${vec(point(c))};valid[${i}]=ecologyInside(location);colors[${i}]=valid[${i}]?ecologySample(location):original;`;
const sampleCode=cells.map((c,i)=>neighbors.includes(i)||i===originIndex?sampleCell(c,i):'').join('\n');
const outerSamples=cells.map((c,i)=>neighbors.includes(i)||i===originIndex?'':sampleCell(c,i)).join('\n');
const hexVertices=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
function overlapsCell(origin,normal){
 const tangent=[-normal[1],normal[0]],rect=[0,Math.sqrt(3)].flatMap(along=>[-1,1].map(across=>origin.map((v,k)=>v+along*normal[k]+across*tangent[k])));
 return [normal,tangent,...directions.map(d=>point(d))].every(axis=>{
  const a=hexVertices.map(p=>p[0]*axis[0]+p[1]*axis[1]),b=rect.map(p=>p[0]*axis[0]+p[1]*axis[1]);
  return Math.min(Math.max(...a),Math.max(...b))-Math.max(Math.min(...a),Math.min(...b))>1e-9;
 });
}
const tripleCondition=(origin,i)=>{
 const ids=[i,(i+1)%6,(i+2)%6].map(j=>cellIndex(origin.map((n,k)=>n+directions[j][k]))),[a,b,c]=ids,o=cellIndex(origin);
 return `valid[${o}]&&valid[${a}]&&valid[${b}]&&valid[${c}]&&!ecologySame(colors[${o}],colors[${a}])&&ecologySame(colors[${a}],colors[${b}])&&ecologySame(colors[${a}],colors[${c}])`;
};
// Rule 2 replaces bridges attached to a reshaped endpoint, including the
// bridge tips outside that endpoint. Merely painting over half its hex leaves
// those tips behind as detached spikes.
const affectedCode=[[0,0],...directions].map(origin=>`affected[${cellIndex(origin)}]=${directions.map((_,i)=>`(${tripleCondition(origin,i)})`).join('||')};`).join('\n');
const rectangles=[[0,0],...directions].flatMap(origin=>directions.map((_,i)=>{
 const ids=[i,(i+1)%6,(i+2)%6].map(j=>cellIndex(origin.map((n,k)=>n+directions[j][k]))),a=ids[0],b=ids[1],c=ids[2],o=cellIndex(origin),normal=point(directions[(i+1)%6]).map(n=>n/Math.sqrt(3));
 if(!overlapsCell(point(origin),normal))return '';
 return `if(valid[${o}]&&valid[${a}]&&valid[${b}]&&valid[${c}]&&!ecologySame(colors[${o}],colors[${a}])&&ecologySame(colors[${a}],colors[${b}])&&ecologySame(colors[${a}],colors[${c}])){
 if(!ecologySame(colors[${a}],original))hasPatch=true;
 delta=offset-${vec(point(origin))};normal=${vec(normal)};
 along=dot(delta,normal);across=dot(delta,vec2(-normal.y,normal.x));
 if(along>=0.&&along<=sqrt(3.)&&abs(across)<=1.){
  priority=vec3(axial+${vec(origin)},${i.toFixed(1)});
  if(priority.x>best.x||(priority.x==best.x&&(priority.y>best.y||(priority.y==best.y&&priority.z>best.z)))){best=priority;patched=colors[${a}];}
 }
 }`;
})).join('\n');

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
vec3 ecologyBridgedColor(vec2 p,vec2 center,vec3 original){
 if(ecologyBridges<2)return ecologyPairColor(p,center,original);
 float radius=${ecologyHexRadius.toFixed(12)}/(circularMode>0?7.:1.);
 vec2 offset=(p-center)/radius,location;
 vec3 colors[19];bool valid[19];
 ${sampleCode}
 if(${neighbors.map(n=>`valid[${n}]&&ecologySame(colors[${n}],original)`).join('&&')})return original;
 ${outerSamples}
 bool affected[19];
 ${affectedCode}
 vec3 patched=original;bool isolated=true,complete=true;
 ${neighbors.map(n=>`complete=complete&&valid[${n}];if(valid[${n}]&&ecologySame(colors[${n}],original))isolated=false;`).join('\n')}
 ${neighbors.map((n,i)=>{const other=neighbors[(i+5)%6];return `if(dot(offset,hexCorner(${i.toFixed(1)}))>.75&&valid[${n}]&&valid[${other}]&&!affected[${n}]&&!affected[${other}]&&ecologySame(colors[${n}],colors[${other}]))patched=colors[${n}];`;}).join('\n')}
 // Global lattice order makes each rectangle one layer across cell boundaries.
 vec2 axial=floor(vec2(2.*center.x/3.,-center.x/3.+center.y/sqrt(3.))/radius+.5);
 bool hasPatch=false;float along,across;vec2 delta,normal;vec3 best=vec3(-1.e9),priority;
 ${rectangles}
 // Rule 3 is a circle overlay, not a second classification outside the circle.
 if(hasPatch&&isolated&&complete&&dot(offset,offset)<=.75)return original;
 return patched;
}
`;
