import {circularGLSL} from './circular-projections.mjs';
// Both color and elevation use this exact inverse projection and orientation.
export const projectionGLSL = `
vec3 atlasSphere(vec3 weights, vec3 a, vec3 b, vec3 c, float bias, float blend) {
  vec3 ww = pow(max(weights, vec3(0.)), vec3(bias));
  ww /= ww.x + ww.y + ww.z;
  return normalize(mix(a,normalize(a),blend)*ww.x + mix(b,normalize(b),blend)*ww.y + mix(c,normalize(c),blend)*ww.z);
}
${circularGLSL}
vec2 geographicUV(vec3 p, vec3 angles) {
  float cr=cos(angles.z), sr=sin(angles.z);
  p=vec3(p.x,p.y*cr-p.z*sr,p.y*sr+p.z*cr);
  float cp=cos(angles.y),sp=sin(angles.y);
  p=vec3(p.x*cp-p.z*sp,p.y,p.x*sp+p.z*cp);
  float cy=cos(angles.x),sy=sin(angles.x);
  p=vec3(p.x*cy-p.y*sy,p.x*sy+p.y*cy,p.z);
  return vec2(fract(atan(p.y,p.x)/6.283185307179586+.5),clamp(.5-asin(clamp(p.z,-1.,1.))/3.141592653589793,0.00001,.99999));
}
`;
