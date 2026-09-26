import {projectionChoices,otherConstruction} from './about-projections.mjs?v=about-shapes-1';
import {initAboutRoute} from './about-route.mjs?v=about-shapes-1';
import {construction,constructionMesh,rearrangementFrame,sub,rotate} from './about-geometry.mjs?v=turn-30';
import {createConstructionScene,rhombicPose} from './about-scene.mjs?v=presentation-1';
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
 const canvas=host.querySelector('canvas'),slider=host.querySelector('input'),caption=host.querySelector('.construction-caption'),motion=host.querySelector('.construction-motion');
 const scene=createConstructionScene(canvas,{onTexture:()=>{dirty=true;},onTextureError:()=>{caption.textContent='The continent image could not load. Reopen this page to try again.';}});
 if(!scene){host.innerHTML='<p>The interactive globe needs WebGL. Earth is projected onto twelve rhombi, unfolded, then stretched into four hexagons and cut and rearranged into the Felv map.</p>';return;}
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
 function draw(now){requestAnimationFrame(draw);if(!dialog.open||document.hidden){last=now;return;}if(now-last<32)return;const dt=Math.min(50,now-last);last=now;
  if(Math.abs(target-value)>.0001){value+=Math.sign(target-value)*Math.min(Math.abs(target-value),dt*.002);slider.value=value;dirty=true;}
  if(!paused&&value<((alternative?.rotationEnd??2)-.05)){yaw+=dt*.00016;dirty=true;}if(!dirty)return;dirty=false;
  const {aspect,dpr}=scene.resize();
  let point,view,cutOpacity=0;
  if(alternative){
   const frame=alternative.frame(value),scale=1.65*Math.min(1,aspect)/frame.extent;
   point=frame.point;cutOpacity=frame.cutOpacity;
   view=p=>rotate(rotate(sub(p,frame.center),[0,1,0],yaw*(1-frame.settle)+userYaw),[1,0,0],pitch*(1-frame.settle)+userPitch).map(x=>x*scale);
  }else ({view,point,cutOpacity}=rhombicPose(model,fixedFrame,value,{yaw,pitch,userYaw,userPitch,aspect}));
  scene.render({samples,edges,cuts,markers},view,point,cutOpacity,{aspect,dpr});
 }
 requestAnimationFrame(draw);
 return choose;
}
