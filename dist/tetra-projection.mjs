// Face-centered Lambert equal-area coordinates, redistributed by sector area.
// Each sector maps a center/vertex/midpoint spherical triangle to a hex wedge.
// Its spherical area is pi/6. With azimuth phi and edge-plane normal N,
// cumulative sector area is F(phi)-F(0), where
// F(phi)=phi+asin(nu*sin(phi)-nv*cos(phi)). Inverting F is analytic.
// Hex barycentrics supply radial fraction r=w1+w2 and area fraction w2/r.
// Lambert radius squared is proportional to 1-cos(rho); scaling it by r^2
// makes the Jacobian constant, 2*pi/(3*sqrt(3)), in unit-hex coordinates.
// Congruent reflected sectors give identical parameterizations on shared edges.
// The center and sector boundaries need not have a unique shape derivative.
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>a.map(x=>x/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=x=>Math.max(-1,Math.min(1,x));
function basis(a,b,c){
 const C=norm(a),B=norm(b),D=norm(c),U=norm(B.map((x,i)=>x-dot(B,C)*C[i]));
 let V=norm(cross(C,U));if(dot(V,D)<0)V=V.map(x=>-x);
 let N=norm(cross(B,D));if(dot(N,C)<0)N=N.map(x=>-x);
 return {C,U,V,nc:dot(N,C),nu:dot(N,U),nv:dot(N,V)};
}
export function tetraSphere(w,a,b,c){
 for(let i=0;i<3;i++)if(w[i]>1-1e-14)return norm([a,b,c][i]);
 const {C,U,V,nc,nu,nv}=basis(a,b,c),r=Math.max(0,w[1]+w[2]);if(r<1e-12)return C;
 const alpha=Math.max(0,Math.min(1,w[2]/r))*Math.PI/6+Math.asin(clamp(-nv));
 const phi=Math.atan2(Math.sin(alpha)+nv,Math.cos(alpha)+nu);
 const cp=Math.cos(phi),sp=Math.sin(phi),nd=nu*cp+nv*sp;
 const boundaryCos=-nd/Math.hypot(nc,nd),z=1-r*r*(1-boundaryCos),s=Math.sqrt(Math.max(0,1-z*z));
 return C.map((x,i)=>x*z+(U[i]*cp+V[i]*sp)*s);
}
export function tetraWeights(p,a,b,c){
 const {C,U,V,nc,nu,nv}=basis(a,b,c),P=norm(p),z=clamp(dot(C,P));
 if(z>1-1e-14)return [1,0,0];
 const phi=Math.atan2(dot(P,V),dot(P,U)),cp=Math.cos(phi),sp=Math.sin(phi),nd=nu*cp+nv*sp;
 const boundaryCos=-nd/Math.hypot(nc,nd),r=Math.sqrt(Math.max(0,(1-z)/(1-boundaryCos)));
 const t=(phi+Math.asin(clamp(nu*sp-nv*cp))-Math.asin(clamp(-nv)))/(Math.PI/6);
 return [1-r,r*(1-t),r*t];
}
export const tetraGLSL=`
uniform int tetraEqualArea;
vec3 tetraSphere(vec3 w,vec3 a,vec3 b,vec3 c){
 vec3 C=normalize(a),B=normalize(b),D=normalize(c);
 vec3 U=normalize(B-dot(B,C)*C),V=normalize(cross(C,U));if(dot(V,D)<0.)V=-V;
 vec3 N=normalize(cross(B,D));if(dot(N,C)<0.)N=-N;
 float nc=dot(N,C),nu=dot(N,U),nv=dot(N,V),r=max(0.,w.y+w.z);
 if(r<.0000001)return C;
 float alpha=clamp(w.z/r,0.,1.)*.523598775598299+asin(clamp(-nv,-1.,1.));
 float phi=atan(sin(alpha)+nv,cos(alpha)+nu),cp=cos(phi),sp=sin(phi),nd=nu*cp+nv*sp;
 float boundaryCos=-nd/length(vec2(nc,nd)),z=clamp(1.-r*r*(1.-boundaryCos),-1.,1.);
 return C*z+(U*cp+V*sp)*sqrt(max(0.,1.-z*z));
}
`;
