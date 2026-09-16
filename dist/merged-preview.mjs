// Local-only comparison. The normal renderer and its overlays remain available.
export async function createMergedPreview(redraw){
 const manifest=await (await fetch('/maps/merged-experiment/manifest.json')).json();
 const original=document.querySelector('#map'),canvas=document.createElement('canvas');canvas.id='merged-preview';canvas.style.display='none';original.after(canvas);
 const ctx=canvas.getContext('2d'),cache=new Map(),pending=new Set(),failed=new Set();let active=0,queue=[],required=new Set();
 const bar=document.createElement('div');bar.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100;background:white;padding:10px 14px;border-radius:8px;box-shadow:0 2px 14px #0003;font:13px sans-serif;max-width:65vw';
 bar.innerHTML='<label><input type="checkbox" checked> Novas imagens com iluminação incorporada</label><div role="status" style="font-size:11px;margin-top:4px"></div>';document.body.append(bar);
 const toggle=bar.querySelector('input'),status=bar.querySelector('[role=status]');toggle.id='merged-preview-toggle';toggle.onchange=redraw;
 function pump(){while(active<4&&queue.length){const key=queue.shift();if(!required.has(key)){pending.delete(key);continue;}active++;fetch('/'+key).then(r=>{if(!r.ok)throw Error(r.status);return r.blob();}).then(createImageBitmap).then(image=>{cache.set(key,image);while(cache.size>160){const old=[...cache.keys()].find(k=>!required.has(k));if(!old)break;cache.get(old).close();cache.delete(old);}}).catch(()=>failed.add(key)).finally(()=>{active--;pending.delete(key);pump();redraw();});}}
 function image(key){if(cache.has(key))return cache.get(key);if(!pending.has(key)&&!failed.has(key)){pending.add(key);queue.push(key);}return null;}
 let blit;
 return ({entry,w,h,dpr,unit,panX,panY,gl})=>{
  const key=entry?.path?.replace(/^v1\//,''),meta=manifest.entries[key];
  canvas.hidden=!toggle.checked||!meta||!!meta.reuse;
  if(canvas.hidden){status.textContent=meta?.reuse?'Este estilo já não tem iluminação separada.':!meta?'Escolha um mapa padrão para comparar.':'Camadas atuais';return;}
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=meta.background;ctx.fillRect(0,0,w,h);ctx.translate(w/2+panX,h/2+panY);ctx.scale(unit,unit);
  const angle=meta.repeat?meta.angle:0;ctx.rotate(angle);
  const c=Math.cos(angle),s=Math.sin(angle),corners=[];
  for(const x of [-w/2-panX,w/2-panX])for(const y of [-h/2-panY,h/2-panY])corners.push([(c*x+s*y)/unit,(-s*x+c*y)/unit]);
  const bounds=[Math.min(...corners.map(p=>p[0])),Math.min(...corners.map(p=>p[1])),Math.max(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[1]))];
  const [left,top,rw,rh]=meta.rect;
  const qx=meta.repeat?[Math.floor((bounds[0]-left)/rw),Math.floor((bounds[2]-left)/rw)]:[0,0],qy=meta.repeat?[Math.floor((bounds[1]-top)/rh),Math.floor((bounds[3]-top)/rh)]:[0,0];
  function collect(z){const level=meta.levels[z],density=meta.density/2**(meta.maxLevel-z),tiles=[],present=new Set(level.tiles);
   for(let q=qx[0];q<=qx[1];q++)for(let r=qy[0];r<=qy[1];r++){
    const x0=Math.max(0,Math.floor((bounds[0]-left-q*rw)*density/256)),x1=Math.min(Math.ceil(level.width/256)-1,Math.floor((bounds[2]-left-q*rw)*density/256));
    const y0=Math.max(0,Math.floor((bounds[1]-top-r*rh)*density/256)),y1=Math.min(Math.ceil(level.height/256)-1,Math.floor((bounds[3]-top-r*rh)*density/256));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(present.has(x+'-'+y))tiles.push({key:meta.path+'/'+z+'/'+x+'-'+y+'.png',x:left+q*rw+x*256/density,y:top+r*rh+y*256/density,width:Math.min(256,level.width-x*256)/density,height:Math.min(256,level.height-y*256)/density});
   }return tiles;
  }
  let z=Math.max(0,Math.min(meta.maxLevel,Math.ceil(Math.log2(unit*dpr/meta.density))+meta.maxLevel)),tiles=collect(z);
  while(z>0&&new Set(tiles.map(t=>t.key)).size>120)tiles=collect(--z);
  const coarse=collect(0);required=new Set([...coarse,...tiles].map(t=>t.key));
  for(const t of [...coarse,...tiles]){const im=image(t.key);if(im)ctx.drawImage(im,1,1,im.width-2,im.height-2,t.x,t.y,t.width,t.height);}
  pump();const missing=[...required].filter(k=>!cache.has(k));status.textContent=missing.some(k=>failed.has(k))?'Falha ao carregar — recarregue a página.':missing.length?'Carregando novas imagens…':'Novas imagens prontas · teste local · arquivos antigos preservados';canvas.dataset.pending=String(missing.length);canvas.dataset.level=String(z);
  // Put only the combined base image back into the existing canvas. The app
  // draws graticules and all other overlays afterwards, with their usual widths.
  if(!blit){const program=gl.createProgram();for(const [kind,source] of [[gl.VERTEX_SHADER,'attribute vec2 point;varying vec2 uv;void main(){gl_Position=vec4(point,0.,1.);uv=vec2(point.x*.5+.5,.5-point.y*.5);}'],[gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D image;void main(){gl_FragColor=texture2D(image,uv);}']]){const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);blit={program,buffer,texture,point:gl.getAttribLocation(program,'point')};}
  gl.useProgram(blit.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,blit.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.bindBuffer(gl.ARRAY_BUFFER,blit.buffer);for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);gl.enableVertexAttribArray(blit.point);gl.vertexAttribPointer(blit.point,2,gl.FLOAT,false,0,0);gl.disable(gl.BLEND);gl.drawArrays(gl.TRIANGLES,0,6);
 };
}
