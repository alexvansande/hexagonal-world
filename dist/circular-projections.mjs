// Lambert azimuthal equal area followed by an area-preserving disk/hex map.
// Equal wedge areas require an angular warp as well as radial scaling.
const S=Math.PI/3,A=Math.sqrt(3)/2,K=Math.PI/(2*Math.sqrt(3));
export const circularMode=method=>method==='lambert-one'?1:method==='lambert-two'?2:0;
export function hexSphere([x,y],mode,region=0){
 const theta=Math.atan2(y,x),beta=(Math.floor(theta/S)+.5)*S;
 const u=Math.min(1,Math.hypot(x,y)*Math.cos(theta-beta)/A);
 const phi=beta+K*Math.tan(theta-beta),z=1-(mode===1?2:1)*u*u;
 const t=Math.sqrt(Math.max(0,1-z*z)),south=mode===2&&region===1;
 return [t*Math.cos(phi),(south?-1:1)*t*Math.sin(phi),south?-z:z];
}
export function sphereHex(p,mode,region=0){
 const south=mode===2&&region===1,z=(south?-1:1)*p[2];
 if(mode===2&&z< -1e-10)return null;
 const phi=Math.atan2((south?-1:1)*p[1],p[0]),beta=(Math.floor(phi/S)+.5)*S;
 const delta=Math.atan((phi-beta)/K),theta=beta+delta;
 const u=Math.sqrt(Math.max(0,(1-z)/(mode===1?2:1))),r=u*A/Math.cos(delta);
 return [r*Math.cos(theta),r*Math.sin(theta)];
}
export const circularGLSL=`
uniform int circularMode;
vec3 hexSphere(vec2 p, float region){
 float theta=length(p)<.0000001?0.:atan(p.y,p.x);
 float beta=(floor(theta/1.047197551196598)+.5)*1.047197551196598;
 float u=min(1.,length(p)*cos(theta-beta)/.866025403784439);
 float phi=beta+.906899682117109*tan(theta-beta);
 float z=1.-(circularMode==1?2.:1.)*u*u;
 float t=sqrt(max(0.,1.-z*z));
 return vec3(t*cos(phi),t*sin(phi)*(circularMode==2&&region>.5?-1.:1.),z*(circularMode==2&&region>.5?-1.:1.));
}
vec3 mapSphere(vec2 p,float region,vec3 weights,vec3 a,vec3 b,vec3 c,float bias,float blend){
 if(circularMode>0)return hexSphere(p,region);
 return atlasSphere(weights,a,b,c,bias,blend);
}
`;
