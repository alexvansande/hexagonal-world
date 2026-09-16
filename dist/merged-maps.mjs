import entries from './maps/merged-manifest.mjs';
import {PrecomputedSurfaces} from './precomputed-surfaces.mjs?v=cloud-assets-1';

export function mergedEntry(entry){return entries[entry?.path?.replace(/^v1\//,'')]||null;}
export function mergedCompatible(entry,state,background){
 return !!mergedEntry(entry)&&background===entry.signature.controls['background-color']&&
  state.shadowOpacity===entry.signature.state.shadowOpacity&&state.lightOpacity===entry.signature.state.lightOpacity;
}
const sets=new WeakMap();
export function mergedPlan(meta,{width,height,unit,dpr,panX,panY},budget=120){
 let present=sets.get(meta);if(!present){present=Object.fromEntries(Object.entries(meta.levels).map(([z,l])=>[z,new Set(l.tiles)]));sets.set(meta,present);}
 const [left,top]=meta.rect;
 const collect=z=>{
  const level=meta.levels[z],density=meta.density/2**(meta.maxLevel-z),result=[];
  const x0=Math.max(0,Math.floor(((-width/2-panX)/unit-left)*density/256));
  const y0=Math.max(0,Math.floor(((-height/2-panY)/unit-top)*density/256));
  const x1=Math.min(Math.ceil(level.width/256)-1,Math.floor(((width/2-panX)/unit-left)*density/256));
  const y1=Math.min(Math.ceil(level.height/256)-1,Math.floor(((height/2-panY)/unit-top)*density/256));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(present[z].has(`${x}-${y}`))result.push({
   key:`${meta.path}/${z}/${x}-${y}`,rect:[left+x*256/density,top+y*256/density,Math.min(256,level.width-x*256)/density,Math.min(256,level.height-y*256)/density]
  });
  return result;
 };
 const coarse=collect(0);
 let level=Math.max(0,Math.min(meta.maxLevel,Math.ceil(Math.log2(unit*dpr/meta.density))+meta.maxLevel)),tiles=collect(level);
 while(level>0&&tiles.length+coarse.length>budget)tiles=collect(--level);
 return {level,coarse,tiles};
}

// Draw PNG tiles directly. No intermediate full-screen canvas or lighting pass.
export class MergedMaps{
 constructor(gl,redraw){
  this.gl=gl;this.cache=new PrecomputedSurfaces(gl,redraw,{root:'.',extension:'png'});
  const program=gl.createProgram();
  for(const [kind,source] of [[gl.VERTEX_SHADER,`attribute vec2 point;uniform vec4 rect;uniform vec2 size;uniform vec3 view;varying vec2 uv;void main(){uv=point;vec2 p=((rect.xy+point*rect.zw)*view.x+view.yz)*2./size;gl_Position=vec4(p.x,-p.y,0.,1.);}`],[gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D map;uniform vec2 pixels;void main(){gl_FragColor=vec4(texture2D(map,(1.+uv*(pixels-2.))/pixels).rgb,1.);}`]]){
   const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
   gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  this.program=program;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
  this.point=gl.getAttribLocation(program,'point');this.uniforms=Object.fromEntries(['rect','size','view','map','pixels'].map(k=>[k,gl.getUniformLocation(program,k)]));
 }
 draw(meta,view){
  const {gl:g,cache,uniforms:u}=this,plan=mergedPlan(meta,view);
  cache.setRequired(new Set([...plan.coarse,...plan.tiles].map(t=>t.key)));
  // Start the tiny overview before detail, including on slow connections.
  const previews=plan.coarse.map(t=>cache.request(t.key,true));
  const ready=previews.every(Boolean);
  g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);
  for(let i=0;i<g.getParameter(g.MAX_VERTEX_ATTRIBS);i++)g.disableVertexAttribArray(i);
  g.enableVertexAttribArray(this.point);g.vertexAttribPointer(this.point,2,g.FLOAT,false,0,0);
  g.uniform2f(u.size,view.width,view.height);g.uniform3f(u.view,view.unit,view.panX,view.panY);g.uniform1i(u.map,0);g.activeTexture(g.TEXTURE0);g.disable(g.BLEND);
  for(const tile of [...plan.coarse,...(ready?plan.tiles:[])]){
   const image=cache.request(tile.key);if(!image)continue;
   g.bindTexture(g.TEXTURE_2D,image.texture);g.uniform4fv(u.rect,tile.rect);g.uniform2f(u.pixels,image.width,image.height);g.drawArrays(g.TRIANGLES,0,6);
  }
  return {...plan,ready};
 }
 dispose(){this.cache.dispose();this.gl.deleteProgram(this.program);this.gl.deleteBuffer(this.buffer);}
}
