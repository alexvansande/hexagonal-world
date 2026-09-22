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
  for(const [kind,source] of [[gl.VERTEX_SHADER,`attribute vec2 point;uniform vec4 rect;uniform vec2 size;uniform vec3 view;uniform vec4 frames;uniform float turn;varying vec2 uv;varying vec2 sourcePosition;void main(){uv=point;sourcePosition=rect.xy+point*rect.zw;vec2 q=sourcePosition-frames.xy;float c=cos(turn),s=sin(turn);q=vec2(c*q.x-s*q.y,s*q.x+c*q.y)+frames.zw;vec2 p=(q*view.x+view.yz)*2./size;gl_Position=vec4(p.x,-p.y,0.,1.);}`],[gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D map;uniform vec2 pixels;uniform vec4 frames;uniform float sourceAngle;uniform bool clipPiece;varying vec2 sourcePosition;void main(){if(clipPiece){vec2 q=sourcePosition-frames.xy;float c=cos(sourceAngle),s=sin(sourceAngle);q=abs(vec2(c*q.x+s*q.y,-s*q.x+c*q.y));if(q.y>.866025404||.866025404*q.x+.5*q.y>.866025404)discard;}gl_FragColor=vec4(texture2D(map,(1.+uv*(pixels-2.))/pixels).rgb,1.);}`]]){
   const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
   gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  this.program=program;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
  this.point=gl.getAttribLocation(program,'point');this.uniforms=Object.fromEntries(['rect','size','view','map','pixels','frames','turn','sourceAngle','clipPiece'].map(k=>[k,gl.getUniformLocation(program,k)]));
 }
 hasOverview(meta){return meta.levels[0].tiles.every(key=>this.cache.cache.has(`${meta.path}/0/${key}`));}
 draw(meta,view,pieces=null,preload=[]){
  const {gl:g,cache,uniforms:u}=this;
  // Translated copies of one piece (the endless band) share a source window, so
  // their tile plans are computed once per source and drawn per target.
  const shared=new Map();
  const plans=(pieces||[null]).map(piece=>{
   if(!piece)return {...mergedPlan(meta,view),piece};
   const c=Math.cos(piece.angle),s=Math.sin(piece.angle),unit=view.unit;
   const key=`${piece.meta?.path||''}|${piece.source.join()}|${piece.angle}`;
   if(piece.angle===0&&shared.has(key))return {...shared.get(key),piece};
   const center=[-view.panX/unit-piece.target[0],-view.panY/unit-piece.target[1]];
   const sourceCenter=[c*center[0]+s*center[1]+piece.source[0],-s*center[0]+c*center[1]+piece.source[1]];
   // Unrotated copies plan the whole source hexagon so the plan is target-independent.
   const window=piece.angle===0?{width:4*unit,height:4*unit,panX:-piece.source[0]*unit,panY:-piece.source[1]*unit}:{width:Math.abs(c)*view.width+Math.abs(s)*view.height,height:Math.abs(s)*view.width+Math.abs(c)*view.height,panX:-sourceCenter[0]*unit,panY:-sourceCenter[1]*unit};
   const plan=mergedPlan(piece.meta||meta,{...view,...window},piece.angle===0?60:40);
   // Cull image tiles outside this source hexagon's bounding circle.
   const touches=t=>{const [x,y,w,h]=t.rect;return x<=piece.source[0]+1&&x+w>=piece.source[0]-1&&y<=piece.source[1]+1&&y+h>=piece.source[1]-1;};
   const result={...plan,coarse:plan.coarse.filter(touches),tiles:plan.tiles.filter(touches)};
   if(piece.angle===0)shared.set(key,result);
   return {...result,piece};
  });
  const preloadKeys=preload.flatMap(m=>m.levels[0].tiles.map(key=>`${m.path}/0/${key}`));
  cache.setRequired(new Set([...preloadKeys,...plans.flatMap(p=>[...p.coarse,...p.tiles].map(t=>t.key))]));
  for(const key of preloadKeys)cache.request(key,true);
  const ready=plans.flatMap(p=>p.coarse.map(t=>cache.request(t.key,true))).every(Boolean);
  g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);
  for(let i=0;i<g.getParameter(g.MAX_VERTEX_ATTRIBS);i++)g.disableVertexAttribArray(i);
  g.enableVertexAttribArray(this.point);g.vertexAttribPointer(this.point,2,g.FLOAT,false,0,0);
  g.uniform2f(u.size,view.width,view.height);g.uniform3f(u.view,view.unit,view.panX,view.panY);g.uniform1i(u.map,0);g.activeTexture(g.TEXTURE0);g.disable(g.BLEND);
  for(const plan of plans){
   const piece=plan.piece;g.uniform1i(u.clipPiece,piece?1:0);
   g.uniform4fv(u.frames,piece?[...piece.source,...piece.target]:[0,0,0,0]);g.uniform1f(u.turn,piece?.angle||0);g.uniform1f(u.sourceAngle,piece?.sourceAngle||0);
   for(const tile of [...plan.coarse,...(ready?plan.tiles:[])]){
    const image=cache.request(tile.key);if(!image)continue;
    g.bindTexture(g.TEXTURE_2D,image.texture);g.uniform4fv(u.rect,tile.rect);g.uniform2f(u.pixels,image.width,image.height);g.drawArrays(g.TRIANGLES,0,6);
   }
  }
  return {level:Math.max(...plans.map(p=>p.level)),ready};
 }

 dispose(){this.cache.dispose();this.gl.deleteProgram(this.program);this.gl.deleteBuffer(this.buffer);}
}
