import {assetURL} from './asset-url.mjs';
import {mix,sub,rotate} from './about-geometry.mjs?v=turn-30';
import {norm} from './geometry.mjs?v=tetra-area-2';
// The About construction's drawing, shared by the About widget and the presentation:
// one WebGL program that paints the continents image onto every stage's mesh.
export const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createConstructionScene(canvas,{onTexture=()=>{},onTextureError=()=>{}}={}){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true});
 if(!gl)return null;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 position;attribute vec3 globe;uniform float aspect;uniform float pointSize;varying vec3 earth;void main(){gl_PointSize=pointSize;earth=globe;gl_Position=vec4(position.x/aspect,position.y,-position.z*.15,1.);}`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 earth;uniform sampler2D map;uniform float line;uniform float opacity;uniform float dots;void main(){if(dots>.5&&length(gl_PointCoord-vec2(.5))>.5)discard;vec3 p=normalize(earth);vec2 uv=vec2(fract(atan(p.y,p.x)/6.2831853+.5),.5-asin(clamp(p.z,-1.,1.))/3.14159265);float sea=smoothstep(.3,.7,texture2D(map,uv).r);vec3 color=mix(vec3(.12,.26,.28),vec3(.51,.65,.66),sea);gl_FragColor=vec4(mix(color,dots>.5?vec3(.06,.20,.31):vec3(.96,.99,1.),line),opacity);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [name,offset] of [['position',0],['globe',12]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,offset);}
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([200,200,200,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);onTexture();};image.onerror=onTextureError;image.crossOrigin='anonymous';image.src=assetURL('continents.png');
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const uniform=name=>gl.getUniformLocation(program,name);
 // Size the drawing buffer to the canvas on screen; returns the aspect the views are framed for.
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);return {aspect:rect.width/Math.max(1,rect.height),dpr,width:rect.width,height:rect.height};}
 // view(point(sample)) gives [x·aspect, y, depth] in clip units; samples carry their geography.
 function render({samples,edges,cuts,markers=[]},view,point,cutOpacity,{aspect,dpr}){
  const data=list=>new Float32Array(list.flatMap(s=>[...view(point(s)),...s.earth]));
  gl.uniform1f(uniform('dots'),0);gl.uniform1f(uniform('pointSize'),5*dpr);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniform('aspect'),aspect);gl.uniform1f(uniform('line'),0);gl.uniform1f(uniform('opacity'),1);
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);gl.bufferData(gl.ARRAY_BUFFER,data(samples),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,samples.length);gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.uniform1f(uniform('line'),1);gl.bufferData(gl.ARRAY_BUFFER,data(edges),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,edges.length);
  if(cutOpacity>0){gl.uniform1f(uniform('opacity'),cutOpacity);gl.bufferData(gl.ARRAY_BUFFER,data(cuts),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,cuts.length);}
  if(markers.length){gl.uniform1f(uniform('dots'),1);gl.uniform1f(uniform('opacity'),1);gl.bufferData(gl.ARRAY_BUFFER,data(markers),gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,markers.length);}
 }
 return {gl,resize,render};
}
// The rhombic flow at a stage value 0–4 (Sphere, Project, Unfold, Adjust, Rearrange):
// the same poses the About page shows, framed for `aspect`.
export function rhombicPose(model,fixedFrame,value,{yaw,pitch,userYaw=0,userPitch=0,aspect}){
 const unfold=smooth(value-1),adjust=smooth(value-2),project=smooth(value),transforms=model.transforms(unfold);
 const corners=model.faces.map((f,i)=>f.v.map((p,j)=>{let q=value<=1?mix(norm(p).map(x=>x*2),p,project):transforms[i](p);q=model.frame(q);if(value>2)q=mix(q,f.adjusted[j],adjust);return q;}));
 // Reveal the cut lines first, then move each fragment rigidly into its final placement.
 const rearrange=Math.max(0,value-3),pieceTimes=model.pieces.map((p,i)=>smooth((rearrange-.12-(p.moving?i*.012:0))/(.88-(p.moving?i*.012:0))));
 const orient=p=>rotate(p,[0,0,1],unfold*2*Math.PI/3);
 const all=corners.flat().map(orient);
 const naturalCenter=[0,1,2].map(i=>(Math.min(...all.map(p=>p[i]))+Math.max(...all.map(p=>p[i])))/2);
 const naturalExtent=Math.max(4,...[0,1].map(i=>Math.max(...all.map(p=>p[i]))-Math.min(...all.map(p=>p[i]))));
 const center=mix(naturalCenter,fixedFrame.center,adjust),extent=naturalExtent+(fixedFrame.extent-naturalExtent)*adjust;
 const scale=1.65*Math.min(1,aspect)/extent;
 const view=p=>rotate(rotate(sub(orient(p),center),[0,1,0],yaw*(1-unfold)+userYaw),[1,0,0],pitch*(1-unfold)+userPitch).map(x=>x*scale);
 const point=s=>{if(value>3)return model.piecePoint(model.pieces[s.piece],s.xy,pieceTimes[s.piece]);if(value<=1)return model.frame(mix(norm(s.p).map(x=>x*2),s.p,project));const c=corners[s.f];return c[0].map((x,i)=>x+s.a*(c[1][i]-x)+s.b*(c[3][i]-x));};
 return {view,point,cutOpacity:smooth(rearrange/.12),center,scale,turn:unfold*2*Math.PI/3};
}
