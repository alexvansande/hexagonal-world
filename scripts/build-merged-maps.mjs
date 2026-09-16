// Experimental assets only. Existing maps and the production manifest stay intact.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import manifest from '../dist/maps/default-layers/manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=root+'dist/maps/merged-experiment/';
const python=process.env.SURFACE_PYTHON||'python3';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const scratch='/tmp/hex-merged-maps-'+process.pid;await mkdir(scratch,{recursive:true});await mkdir(out,{recursive:true});
const run=(...args)=>{const p=spawnSync(python,[root+'scripts/merge-map-images.py',...args],{stdio:'inherit'});if(p.status!==0)throw Error('Image processing failed: '+(p.signal||p.error||p.status));};
const page=await browser.newPage();
await page.route('**/__merged-baker',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><canvas id="bake"></canvas>'}));
await page.route('**/__merged-base/*',async r=>r.fulfill({contentType:'image/png',body:await readFile(scratch+'/'+r.request().url().split('/').pop())}));
await page.goto((process.env.SURFACE_URL||'http://[::1]:4173')+'/__merged-baker');
const entries={};
try{
 for(const [key,entry] of Object.entries(manifest.entries)){
  if(process.env.LAYER_FILTER&&!key.includes(process.env.LAYER_FILTER))continue;
  if(!entry.lighting){entries[key]={reuse:entry.path,reason:'No additional lighting'};continue;}
  const folder=out+key;await mkdir(folder,{recursive:true});
  try{const saved=JSON.parse(await readFile(folder+'/entry.json'));if(saved.source!==entry.path)throw Error('Source mismatch');entries[key]=saved;console.log('Reuse',key);continue;}catch{}
  console.log('Prepare',key);await writeFile(scratch+'/entry.json',JSON.stringify(entry));run('prepare',scratch);
  const meta=await page.evaluate(async entry=>{
   const {makeGeometry,layouts,canvasWorld}=await import('/geometry.mjs');
   const {makeArrangement}=await import('/arrangements.mjs');
   const {visibleTiles}=await import('/tiling.mjs');
   const state=entry.signature.state,info=entry.lighting;
   const density=128*2**entry.maxLevel,rect=[...info.rect];
   const geometry=makeGeometry(state.method,state.height),arr=makeArrangement(geometry,state.arrangement,layouts(geometry));
   if(arr.tiling)rect[3]=Math.sqrt(3)*arr.tiling.size;
   const width=Math.ceil(rect[2]*density),height=Math.ceil(rect[3]*density);
   const net=arr.tiling?visibleTiles(arr.tiling,{left:rect[0],right:rect[0]+rect[2],bottom:-rect[1]-rect[3],top:-rect[1]}):arr.net;
   const angle=arr.tiling?0:state.gridRotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
   const groups=geometry.map(()=>[]);
   for(const t of net)for(const p of (t.drawPatches||geometry[t.id].patches))for(let i=0;i<3;i++){
    const [x,y]=canvasWorld(p.xy[i],t);groups[t.id].push(c*x-s*y,s*x+c*y,...p.xy[i],t.opacity,x,y);
   }
   const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,antialias:false});
   if(window.cleanup)window.cleanup();
   const program=gl.createProgram();
   const sources=[`attribute vec2 p;attribute vec2 uv;attribute float alpha;attribute vec2 flatPoint;uniform vec4 box;varying vec2 at;varying float opacity;varying vec2 flatAt;void main(){vec2 q=(p-box.xy)/box.zw;gl_Position=vec4(q.x*2.-1.,1.-q.y*2.,0.,1.);at=vec2((uv.x+1.)/2.,(1.-uv.y)/2.);opacity=alpha;flatAt=flatPoint;}`,
    `precision highp float;varying vec2 at;varying float opacity;varying vec2 flatAt;uniform sampler2D image;uniform int clip;void main(){if(clip==1){float y=-flatAt.y;float x=flatAt.x-sqrt(3.)*y;if(y<0.||y>sqrt(3.)||x< -1.||x>5.)discard;}gl_FragColor=vec4(texture2D(image,at).rgb*opacity,opacity);}`];
   sources.forEach((source,i)=>{const shader=gl.createShader(i?gl.FRAGMENT_SHADER:gl.VERTEX_SHADER);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);});gl.linkProgram(program);gl.useProgram(program);
   const buffers=[],textures=[];
   for(let r=0;r<groups.length;r++){
    const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(groups[r]),gl.STATIC_DRAW);
    const image=await createImageBitmap(await (await fetch('/__merged-base/'+r+'.png',{cache:'no-store'})).blob());
    const t=gl.createTexture();textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);image.close();
   }
   const color=entry.signature.controls['background-color'];const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
   window.cleanup=()=>{textures.forEach(t=>gl.deleteTexture(t));buffers.forEach(b=>gl.deleteBuffer(b));gl.deleteProgram(program);};
   window.bakeChunk=(x,y)=>{
    const w=Math.min(1024,width-x),h=Math.min(1024,height-y);canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);gl.clearColor(...rgb,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(gl.getUniformLocation(program,'box'),rect[0]+x/density,rect[1]+y/density,w/density,h/density);gl.uniform1i(gl.getUniformLocation(program,'clip'),arr.clip?1:0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    groups.forEach((vertices,r)=>{gl.bindTexture(gl.TEXTURE_2D,textures[r]);gl.bindBuffer(gl.ARRAY_BUFFER,buffers[r]);for(const [name,n,offset] of [['p',2,0],['uv',2,2],['alpha',1,4],['flatPoint',2,5]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,28,offset*4);}gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);});
    return canvas.toDataURL().split(',')[1];
   };
   return {rect,density,width,height,repeat:info.repeat,angle:info.angle,background:color,source:entry.path};
  },entry);
  await writeFile(scratch+'/meta.json',JSON.stringify(meta));
  for(let y=0;y<meta.height;y+=1024){for(let x=0;x<meta.width;x+=1024){const data=await page.evaluate(([x,y])=>window.bakeChunk(x,y),[x,y]);await writeFile(`${scratch}/base-${x}-${y}.png`,Buffer.from(data,'base64'));}console.log('Base row',key,y,meta.height);}
  run('merge',scratch,folder);entries[key]=JSON.parse(await readFile(folder+'/entry.json'));console.log('Complete',key);
 }
 // Include already completed entries when resuming a filtered build.
 for(const [key,entry] of Object.entries(manifest.entries)){if(!entry.lighting)entries[key]={reuse:entry.path,reason:'No additional lighting'};else try{entries[key]=JSON.parse(await readFile(out+key+'/entry.json'));}catch{}}
 await writeFile(out+'manifest.json',JSON.stringify({version:1,experimental:true,entries}));
}finally{await browser.close();}
