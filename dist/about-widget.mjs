import {assetURL} from './asset-url.mjs';
import {projectionChoices,otherConstruction} from './about-projections.mjs?v=about-shapes-1';
import {initAboutRoute} from './about-route.mjs?v=about-shapes-1';
import {construction,constructionMesh,rearrangementFrame,mix,sub,rotate} from './about-geometry.mjs?v=turn-30';
import {norm} from './geometry.mjs?v=tetra-area-2';
const rhombicNames=['Sphere','Project','Unfold','Adjust','Rearrange'];
const rhombicCaptions=['Earth, divided by twelve spherical rhombi.','The same continents, projected onto twelve flat rhombi.','The faces hinge open into the Spaceship Earth net.','A gentle stretch brings the rhombi into four regular hexagons.','Cut and turn the pieces to form the Felv map.'];
export function initAboutWidget(){
 const dialog=document.getElementById('research-dialog'),host=document.getElementById('about-construction');
 let started=false,choose;
 const show=method=>{if(!dialog.open){dialog.showModal();dialog.scrollTop=0;}if(!started){started=true;choose=start(host,dialog,id=>open.setProjection(id));}choose?.(method);};
 const open=initAboutRoute({dialog,show});
 document.getElementById('research').onclick=open;
 document.getElementById('learn-more').onclick=e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open();};
}
function start(host,dialog,onProjection){
 let names=rhombicNames,captions=rhombicCaptions;
 host.innerHTML=`<div class="construction-toolbar"><select aria-label="Projection to explain">${projectionChoices.map(([id,label])=>`<option value="${id}" ${id==='rhombic'?'selected':''}>${label}</option>`).join('')}</select></div><div class="construction-view"><canvas aria-label="Earth transforming from a sphere through four hexagons into the Felv map. Drag to rotate." tabindex="0"></canvas><button class="construction-motion" aria-label="Pause rotation">Pause</button></div><input class="construction-range" type="range" min="0" max="4" step="0.001" value="0" aria-label="Projection construction" aria-valuetext="Sphere"><div class="construction-stops">${names.map((n,i)=>`<button data-stage="${i}" aria-pressed="${i===0}">${n}</button>`).join('')}</div><p class="construction-caption" aria-live="polite">${captions[0]}</p><p class="construction-hint">Drag to turn · Slide to unfold</p>`;
 const canvas=host.querySelector('canvas'),slider=host.querySelector('input'),caption=host.querySelector('.construction-caption'),motion=host.querySelector('.construction-motion'),gl=canvas.getContext('webgl',{alpha:true,antialias:true});
 if(!gl){host.innerHTML='<p>The interactive globe needs WebGL. Earth is projected onto twelve rhombi, unfolded, then stretched into four hexagons and cut and rearranged into the Felv map.</p>';return;}
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 position;attribute vec3 globe;uniform float aspect;uniform float pointSize;varying vec3 earth;void main(){gl_PointSize=pointSize;earth=globe;gl_Position=vec4(position.x/aspect,position.y,-position.z*.15,1.);}`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 earth;uniform sampler2D map;uniform float line;uniform float opacity;uniform float dots;void main(){if(dots>.5&&length(gl_PointCoord-vec2(.5))>.5)discard;vec3 p=normalize(earth);vec2 uv=vec2(fract(atan(p.y,p.x)/6.2831853+.5),.5-asin(clamp(p.z,-1.,1.))/3.14159265);float sea=smoothstep(.3,.7,texture2D(map,uv).r);vec3 color=mix(vec3(.12,.26,.28),vec3(.51,.65,.66),sea);gl_FragColor=vec4(mix(color,dots>.5?vec3(.06,.20,.31):vec3(.96,.99,1.),line),opacity);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [name,offset] of [['position',0],['globe',12]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,offset);}
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([200,200,200,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);dirty=true;};image.onerror=()=>{caption.textContent='The continent image could not load. Reopen this page to try again.';};image.crossOrigin='anonymous';image.src=assetURL('continents.png');
 const model=construction(),rhombicMesh=constructionMesh(model),fixedFrame=rearrangementFrame(model),cache=new Map();
 let {samples,edges,cuts}=rhombicMesh,markers=[],alternative=null,activeMethod='rhombic';
 let value=0,target=0,yaw=.4,pitch=-.3,userYaw=0,userPitch=0,dirty=true,last=0,drag=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const updateMotion=()=>{motion.disabled=target>=(alternative?.rotationEnd??2);motion.textContent=paused?'Rotate':'Pause';motion.setAttribute('aria-label',paused?'Resume rotation':'Pause rotation');};updateMotion();
 motion.onclick=()=>{paused=!paused;updateMotion();dirty=true;};
 const select=v=>{target=Math.max(0,Math.min(names.length-1,Math.round(v)));userYaw=0;userPitch=0;const i=target;slider.value=value;slider.setAttribute('aria-valuetext',names[i]);caption.textContent=captions[i];host.querySelectorAll('[data-stage]').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));updateMotion();dirty=true;};
 // The range chooses a destination; only the animation loop changes the displayed stage.
 slider.oninput=()=>select(+slider.value);
 slider.onkeydown=e=>{
  const destinations={ArrowLeft:target-1,ArrowDown:target-1,ArrowRight:target+1,ArrowUp:target+1,PageDown:target-1,PageUp:target+1,Home:0,End:names.length-1};
  if(!(e.key in destinations))return;
  e.preventDefault();select(destinations[e.key]);
 };host.querySelector('.construction-stops').onclick=e=>{const button=e.target.closest('[data-stage]');if(button)select(+button.dataset.stage);};
 const dropdown=host.querySelector('.construction-toolbar select');
 const choose=method=>{
  if(method===activeMethod)return;
  dropdown.value=method;
  const previousLabel=names[target];
  const comparison=['rhombic','tetrakis'].includes(method)&&['rhombic','tetrakis'].includes(activeMethod),previousStage=target;
  activeMethod=method;
  if(method!=='rhombic'&&!cache.has(method))cache.set(method,otherConstruction(method));
  alternative=method==='rhombic'?null:cache.get(method);
  ({samples,edges,cuts}=alternative?alternative.mesh:rhombicMesh);markers=alternative?.mesh.markers||[];
  names=alternative?alternative.names:rhombicNames;captions=alternative?alternative.captions:rhombicCaptions;
  value=target=comparison?(previousLabel==='Adjust'||previousLabel==='Rearrange'?names.length-1:Math.max(0,names.indexOf(previousLabel))):0;yaw=.4;pitch=-.3;userYaw=userPitch=0;
  slider.max=names.length-1;slider.style.width=`${100-100/names.length}%`;slider.style.marginLeft=slider.style.marginRight=`${50/names.length}%`;
  const stops=host.querySelector('.construction-stops');stops.style.gridTemplateColumns=`repeat(${names.length},minmax(0,1fr))`;
  stops.innerHTML=names.map((n,i)=>`<button data-stage="${i}" aria-pressed="${i===0}">${n}</button>`).join('');
  canvas.setAttribute('aria-label',`${projectionChoices.find(p=>p[0]===method)[1]} construction. Drag to rotate.`);select(target);
 };
 dropdown.onchange=e=>{choose(e.target.value);onProjection(e.target.value);};
 canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);paused=true;updateMotion();};
 canvas.onpointermove=e=>{if(!drag)return;userYaw+=(e.clientX-drag[0])*.008;userPitch+=(e.clientY-drag[1])*.008;drag=[e.clientX,e.clientY];dirty=true;};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
 canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();userYaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;userPitch+=e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0;paused=true;updateMotion();dirty=true;};
 new ResizeObserver(()=>dirty=true).observe(canvas);
 new MutationObserver(()=>dirty=true).observe(dialog,{attributes:true,attributeFilter:['open']});
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 function draw(now){requestAnimationFrame(draw);if(!dialog.open||document.hidden){last=now;return;}if(now-last<32)return;const dt=Math.min(50,now-last);last=now;
  if(Math.abs(target-value)>.0001){value+=Math.sign(target-value)*Math.min(Math.abs(target-value),dt*.002);slider.value=value;dirty=true;}
  if(!paused&&value<((alternative?.rotationEnd??2)-.05)){yaw+=dt*.00016;dirty=true;}if(!dirty)return;dirty=false;
  const rect=canvas.getBoundingClientRect(),aspect=rect.width/rect.height,dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);
  let point,view,cutOpacity=0;
  if(alternative){
   const frame=alternative.frame(value),aspect=rect.width/rect.height,scale=1.65*Math.min(1,aspect)/frame.extent;
   point=frame.point;cutOpacity=frame.cutOpacity;
   view=p=>rotate(rotate(sub(p,frame.center),[0,1,0],yaw*(1-frame.settle)+userYaw),[1,0,0],pitch*(1-frame.settle)+userPitch).map(x=>x*scale);
  }else{
  const unfold=smooth(value-1),adjust=smooth(value-2),project=smooth(value),transforms=model.transforms(unfold);
  const corners=model.faces.map((f,i)=>f.v.map((p,j)=>{let q=value<=1?mix(norm(p).map(x=>x*2),p,project):transforms[i](p);q=model.frame(q);if(value>2)q=mix(q,f.adjusted[j],adjust);return q;}));
  // Reveal the cut lines first, then move each fragment rigidly into its final placement.
  const rearrange=Math.max(0,value-3),pieceTimes=model.pieces.map((p,i)=>smooth((rearrange-.12-(p.moving?i*.012:0))/(.88-(p.moving?i*.012:0))));
  const orient=p=>rotate(p,[0,0,1],unfold*2*Math.PI/3);
  const all=corners.flat().map(orient);
  const naturalCenter=[0,1,2].map(i=>(Math.min(...all.map(p=>p[i]))+Math.max(...all.map(p=>p[i])))/2);
  const naturalExtent=Math.max(4,...[0,1].map(i=>Math.max(...all.map(p=>p[i]))-Math.min(...all.map(p=>p[i]))));
  const center=mix(naturalCenter,fixedFrame.center,adjust),extent=naturalExtent+(fixedFrame.extent-naturalExtent)*adjust;
  const aspect=rect.width/rect.height,scale=1.65*Math.min(1,aspect)/extent;
  view=p=>rotate(rotate(sub(orient(p),center),[0,1,0],yaw*(1-unfold)+userYaw),[1,0,0],pitch*(1-unfold)+userPitch).map(x=>x*scale);
  point=s=>{if(value>3)return model.piecePoint(model.pieces[s.piece],s.xy,pieceTimes[s.piece]);if(value<=1)return model.frame(mix(norm(s.p).map(x=>x*2),s.p,project));const c=corners[s.f];return c[0].map((x,i)=>x+s.a*(c[1][i]-x)+s.b*(c[3][i]-x));};
  cutOpacity=smooth(rearrange/.12);
  }
  const data=list=>new Float32Array(list.flatMap(s=>[...view(point(s)),...s.earth]));
  gl.uniform1f(gl.getUniformLocation(program,'dots'),0);gl.uniform1f(gl.getUniformLocation(program,'pointSize'),5*dpr);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(gl.getUniformLocation(program,'aspect'),aspect);gl.uniform1f(gl.getUniformLocation(program,'line'),0);gl.uniform1f(gl.getUniformLocation(program,'opacity'),1);
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);gl.bufferData(gl.ARRAY_BUFFER,data(samples),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,samples.length);gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.uniform1f(gl.getUniformLocation(program,'line'),1);gl.bufferData(gl.ARRAY_BUFFER,data(edges),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,edges.length);
  if(cutOpacity>0){gl.uniform1f(gl.getUniformLocation(program,'opacity'),cutOpacity);gl.bufferData(gl.ARRAY_BUFFER,data(cuts),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,cuts.length);}
  if(markers.length){gl.uniform1f(gl.getUniformLocation(program,'dots'),1);gl.uniform1f(gl.getUniformLocation(program,'opacity'),1);gl.bufferData(gl.ARRAY_BUFFER,data(markers),gl.DYNAMIC_DRAW);gl.drawArrays(gl.POINTS,0,markers.length);}
 }
 requestAnimationFrame(draw);
 return choose;
}
