import {reliefDefaults,reliefLooks} from './relief.mjs?v=layers-4';
export function lightingSettings(name,state){return name==='custom'?{...state}:{...state,...reliefDefaults,...reliefLooks[name]};}
export function lightingKey(state,name,extra=[]){
 const s=lightingSettings(name,state);
 return JSON.stringify([name,...['method','arrangement','lon','lat','roll','bias','height','gridRotation',...Object.keys(reliefDefaults).filter(k=>k!=='reliefColorFade')].map(k=>s[k]),...extra]);
}
// Detail levels double the map-space density, but cover only a padded view.
// Snapped windows are reusable during small pans and never exceed the GPU budget.
export function lightingPlan(rect,{unit,width,height,dpr=1,panX=0,panY=0,compact=false,maxSize=4096,repeat=false}){
 const edge=Math.min(compact?1000:2200,maxSize),baseDensity=edge/Math.max(rect[2],rect[3]);
 const cap=edge/(1.5*Math.max(width,height)/unit);
 const level=Math.max(0,Math.min(6,Math.ceil(Math.log2(unit*dpr/baseDensity)),Math.floor(Math.log2(cap/baseDensity))));
 if(!level)return {level:0,density:baseDensity,rect:[...rect],repeat};
 const density=baseDensity*2**level,span=edge/density,step=span/4;
 const cx=Math.round((-panX/unit)/step)*step,cy=Math.round((-panY/unit)/step)*step;
 return {level,density,rect:[cx-span/2,cy-span/2,span,span],repeat:false};
}
export function lightingCovers(entry,{unit,width,height,panX,panY}){
 if(entry.repeat||entry.level===0)return true;
 const [x,y,w,h]=entry.rect,cx=-panX/unit,cy=-panY/unit;
 return x<=cx-width/(2*unit)&&y<=cy-height/(2*unit)&&x+w>=cx+width/(2*unit)&&y+h>=cy+height/(2*unit);
}
const vs='attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
const fs=`precision highp float;varying vec2 uv;uniform sampler2D source;uniform sampler2D gainMap;uniform sampler2D lightMap;uniform vec2 size;uniform vec3 view;uniform vec4 rect;uniform vec2 opacity;uniform float angle;uniform int repeatLayer;
void main(){vec2 point=(vec2(uv.x,1.-uv.y)*size-size*.5-view.yz)/view.x;if(repeatLayer==1){float c=cos(angle),s=sin(angle);point=vec2(c*point.x+s*point.y,-s*point.x+c*point.y);}
vec2 at=(point-rect.xy)/rect.zw;if(repeatLayer==1)at=fract(at);at.y=1.-at.y;vec3 color=texture2D(source,uv).rgb;
if(all(greaterThanEqual(at,vec2(0.)))&&all(lessThanEqual(at,vec2(1.)))){vec3 gain=texture2D(gainMap,at).rgb*1.9921875;vec3 light=texture2D(lightMap,at).rgb;
// Preserve the original renderer's affine light model, including diffuse gains
// above one. Opacities blend its two cached image layers independently.
color=color*(vec3(1.)-max(vec3(1.)-gain,vec3(0.))*opacity.x+max(gain-vec3(1.),vec3(0.))*opacity.y)+light*opacity.y;}
gl_FragColor=vec4(clamp(color,0.,1.),1.);}`;
export class ProjectedLighting {
 constructor(gl){this.gl=gl;this.entries=new Map();this.bakes=0;this.program=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(this.program,s);gl.deleteShader(s);}gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);this.screen=this.texture();}
 texture(){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);for(const n of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,n,g.LINEAR);for(const n of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,n,g.CLAMP_TO_EDGE);return t;}
 snapshot(){const g=this.gl,t=this.texture();g.copyTexImage2D(g.TEXTURE_2D,0,g.RGB,0,0,g.canvas.width,g.canvas.height,0);return t;}
 get(key){const entry=this.entries.get(key);if(entry){this.entries.delete(key);this.entries.set(key,entry);}return entry;}
 store(key,entry){if(this.entries.has(key)){for(const t of this.entries.get(key).textures)this.gl.deleteTexture(t);this.entries.delete(key);}if(this.entries.size>=3){const old=this.entries.keys().next().value;for(const t of this.entries.get(old).textures)this.gl.deleteTexture(t);this.entries.delete(old);}this.entries.set(key,entry);this.bakes++;}
 composite(entry,width,height,unit,panX,panY,dark,light){const g=this.gl,p=this.program;g.bindFramebuffer(g.FRAMEBUFFER,null);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.screen);if(this.screenWidth===g.canvas.width&&this.screenHeight===g.canvas.height)g.copyTexSubImage2D(g.TEXTURE_2D,0,0,0,0,0,g.canvas.width,g.canvas.height);else{g.copyTexImage2D(g.TEXTURE_2D,0,g.RGB,0,0,g.canvas.width,g.canvas.height,0);this.screenWidth=g.canvas.width;this.screenHeight=g.canvas.height;}g.useProgram(p);g.disable(g.BLEND);g.viewport(0,0,g.canvas.width,g.canvas.height);for(const [i,name,t] of [[0,'source',this.screen],[1,'gainMap',entry.textures[0]],[2,'lightMap',entry.textures[1]]]){g.activeTexture(g.TEXTURE0+i);g.bindTexture(g.TEXTURE_2D,t);g.uniform1i(g.getUniformLocation(p,name),i);}g.uniform2f(g.getUniformLocation(p,'size'),width,height);g.uniform3f(g.getUniformLocation(p,'view'),unit,panX,panY);g.uniform4fv(g.getUniformLocation(p,'rect'),entry.rect);g.uniform2f(g.getUniformLocation(p,'opacity'),dark,light);g.uniform1i(g.getUniformLocation(p,'repeatLayer'),entry.repeat?1:0);g.uniform1f(g.getUniformLocation(p,'angle'),entry.angle||0);for(let i=0;i<g.getParameter(g.MAX_VERTEX_ATTRIBS);i++)g.disableVertexAttribArray(i);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);const a=g.getAttribLocation(p,'position');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);g.drawArrays(g.TRIANGLES,0,6);g.activeTexture(g.TEXTURE0);}
}
