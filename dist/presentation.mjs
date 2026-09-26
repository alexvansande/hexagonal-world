// Lifezones presentation (/lifezone-presentation/): arrow keys or the space bar step
// through slides that reuse the About construction, the live Spaceship Earth map and its
// dance, the Lifezones legend and the History timeline. The slides describe whole states,
// so any slide can be opened directly (#12) and stepping backwards restores its state.
import {construction,constructionMesh,rearrangementFrame} from './about-geometry.mjs?v=turn-30';
import {createConstructionScene,rhombicPose,smooth} from './about-scene.mjs?v=presentation-1';
import {geographicPoint} from './globe-drag.mjs?v=tetra-area-2';
import {layoutOptions} from './map-options.mjs?v=turn-30';
import {landRows,oceanRows} from './map-layers.mjs?v=cloud-assets-1';
import {parsePeriod} from './tour-content.mjs?v=history-3';
import {briefText} from './history-poster.mjs?v=poster-1';
import {periods} from './history/index.mjs?v=history-1';
import {loadWaves} from './history-loader.mjs?v=comet-2';

const plain=text=>text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\*\*?([^*]+)\*\*?/g,'$1').trim();
// At most two lines under a title: whole sentences up to about 140 characters. A longer
// first sentence ends at its last clause break (or word) before 150 characters, with an ellipsis.
export function slideLine(paragraph,limit=150){
 const text=briefText(plain(paragraph||''),140);if(text.length<=limit)return text;
 const head=text.slice(0,limit),clause=Math.max(...[': ','; ',' — ',', ',' – '].map(b=>head.lastIndexOf(b)));
 const end=clause>60?clause:head.lastIndexOf(' ');
 // Never end on a dangling connective (“… and on…”).
 let out=head.slice(0,end);for(let i=0;i<3;i++)out=out.replace(/[\s,;:—–]+$/,'').replace(/\s+(?:and|or|but|on|in|of|the|a|an|to|by|with|from|at|for|as|its|their)$/i,'');
 return out+'…';
}

// The fixed opening: the About stages, the map, its legend, then history.
export const openingSlides=Object.freeze([
 {id:'globe',title:'Hexagonal Earth',text:'Take the globe.',stage:0},
 {id:'project',title:'Hexagonal Earth',text:'Project it onto a rhombic dodecahedron: twelve faces.',stage:1},
 {id:'unfold',title:'Hexagonal Earth',text:'Unfold it.',stage:2},
 {id:'adapt',title:'Hexagonal Earth',text:'Adapt: a gentle stretch turns the rhombi into four regular hexagons.',stage:3},
 {id:'rearrange',title:'Hexagonal Earth',text:'Rearrange.',stage:4},
 {id:'island',title:'Spaceship Earth',text:'This arrangement shows all the world’s continents as one island.',map:true},
 {id:'recentre',title:'Spaceship Earth',text:'Moving the map recentres the hexagons.',map:true,pan:true},
 {id:'lifezones',title:'Life zones',text:'Colours represent life zones. Left to right is humidity; up and down, latitude and altitude.',map:true,legend:'land'},
 {id:'oceans',title:'Life zones',text:'Ocean colours represent sea temperature and sea roughness.',map:true,legend:'both'},
 {id:'history',title:'History',text:'Now for some history.',map:true,legend:'corner'},
]);
// Every era, then every spot of that era in the order its Markdown gives them.
export function historySlides(texts){
 return periods.flatMap(p=>{
  const text=texts[p.id];if(!text)return [];
  return [{id:p.id,title:p.label,text:p.date.replace(/^c\. /,'About ').replace(/^./,c=>c.toUpperCase()),map:true,legend:'corner',period:p.id,spot:null},
   ...Object.values(text.spots).map(spot=>({id:`${p.id}/${spot.id}`,title:spot.title,text:slideLine(spot.paragraphs[0]),map:true,legend:'corner',period:p.id,spot:spot.id,
    key:spot.legend.map((label,i)=>({wave:spot.waves[i],label:plain(label)}))}))];
 });
}

// Short names that fit inside the legend's hexagons.
const seaNames=[['Cold seas'],['Temperate · calm','Temperate · rough'],['Warm · calm','Warm · choppy','Warm · rough']];
const ink=color=>{const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);return .2126*r+.7152*g+.0722*b>.45?'#173d48':'#ffffff';};
function wrap(name,width=13){const lines=[];for(const word of name.split(' ')){const last=lines[lines.length-1];if(last&&(last+' '+word).length<=width)lines[lines.length-1]+=' '+word;else lines.push(word);}return lines;}
function legendSVG(){
 const ns='http://www.w3.org/2000/svg',R=100,dx=Math.sqrt(3)*R,svg=document.createElementNS(ns,'svg');
 const el=(name,attrs,parent)=>{const e=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
 const text=(parent,x,y,value,size,{italic=true,anchor='middle',fill='#173d48',weight=400,rotate=0}={})=>{const t=el('text',{x,y,'text-anchor':anchor,fill,'dominant-baseline':'middle',...(rotate?{transform:`rotate(${rotate} ${x} ${y})`}:{})},parent);t.style.font=`${italic?'italic ':''}${weight} ${size}px Baskerville,'Baskerville Old Face','Palatino Linotype',Georgia,serif`;t.textContent=value;return t;};
 svg.setAttribute('viewBox','-470 -170 1900 820');svg.setAttribute('role','img');svg.setAttribute('aria-label','Life zones legend: land by humidity and temperature, ocean by roughness and temperature');
 const land=landRows(10),sea=oceanRows(6);
 const triangle=(rows,names,cx,top,group)=>rows.forEach((row,i)=>row.cells.forEach((cell,j)=>{
  const x=cx+(j-i/2)*dx,y=top+i*1.5*R,g=el('g',{class:'pres-hex'},group);
  el('polygon',{points:Array.from({length:6},(_,k)=>{const a=(k*60-90)*Math.PI/180;return `${x+Math.cos(a)*(R-3)},${y+Math.sin(a)*(R-3)}`;}).join(' '),fill:cell.color},g);
  const lines=wrap(names?names[i][j]:cell.name),size=lines.length>3?19:22,label=el('g',{class:'pres-hex-name'},g);
  lines.forEach((line,k)=>text(label,x,y+(k-(lines.length-1)/2)*size*1.15,line,size,{italic:false,fill:ink(cell.color)}));
 }));
 // Land: temperature rows from polar at the top to warm at the bottom, arid to humid across.
 const landGroup=el('g',{class:'pres-legend-land'},svg);
 text(landGroup,0,-128,'Land',46);
 triangle(land,null,0,0,landGroup);
 land.forEach((row,i)=>text(landGroup,-(i/2)*dx-dx*.62,i*1.5*R,row.label,26,{anchor:'end'}));
 text(landGroup,0,4*1.5*R-24,'Arid  ↔  Humid',30);
 text(landGroup,-2.4*dx-40,2.25*R,'Latitude & altitude  →  warmer',24,{rotate:90});
 const seaGroup=el('g',{class:'pres-legend-sea'},svg);
 text(seaGroup,960,-128,'Ocean',46);
 triangle(sea,seaNames,960,0,seaGroup);
 sea.forEach((row,i)=>text(seaGroup,960+(i/2)*dx+dx*.62,i*1.5*R,row.label,26,{anchor:'start'}));
 text(seaGroup,960,3*1.5*R-24,'Calm  ↔  Rough',30);
 text(seaGroup,960+2*dx+10,1.5*R,'Sea temperature  →  warmer',24,{rotate:90});
 return svg;
}

const css=`
body.presenting aside,body.presenting .view-tools,body.presenting .history-tools,body.presenting #map-heading,body.presenting #legend-toggle,body.presenting #floating-legend,body.presenting #tour-story,body.presenting #tour-story-strip,body.presenting #map-coordinates{display:none!important}
body.presenting #map,body.presenting #overlay,body.presenting .tour-routes,body.presenting .tour-markers,body.presenting .tour-labels{transition:opacity 1.1s ease}
body.presenting.pres-construction #map,body.presenting.pres-construction #overlay{opacity:0}
body.presenting.pres-quiet .tour-routes,body.presenting.pres-quiet .tour-markers,body.presenting.pres-quiet .tour-labels,body.presenting.pres-construction .tour-markers{opacity:0;pointer-events:none}
#pres-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;opacity:0;transition:opacity 1.1s ease}
body.pres-construction #pres-canvas{opacity:1}
#pres-heading{position:fixed;z-index:20;left:4vw;top:4.5vh;width:62vw;pointer-events:none;color:#193c49}
#pres-heading h1{font-family:Baskerville,'Baskerville Old Face','Palatino Linotype',Georgia,serif;font-weight:400;font-size:clamp(40px,5.6vw,120px);letter-spacing:-.03em;line-height:1.02;margin:0 0 .28em}
#pres-heading p{font-family:Baskerville,'Baskerville Old Face','Palatino Linotype',Georgia,serif;font-size:clamp(20px,2.05vw,44px);line-height:1.3;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 0 12px #fff,0 0 4px #fff}
#pres-heading p.long{font-size:clamp(17px,1.65vw,36px)}
#pres-heading h1,#pres-heading p{transition:opacity .35s ease}
#pres-heading.changing h1,#pres-heading.changing p{opacity:0}
#pres-legend{position:fixed;z-index:15;left:50%;top:50%;width:min(94vw,166vh);pointer-events:none;transform-origin:0 0;transition:transform 1s cubic-bezier(.6,0,.2,1),opacity .8s ease;opacity:0;padding:1.4vw 1.8vw;box-sizing:border-box;border-radius:1.6vw;background:rgba(255,255,255,.88);box-shadow:0 1.4vw 4vw rgba(22,52,59,.16)}
#pres-legend svg{display:block;width:100%;height:auto;overflow:visible}
#pres-legend .pres-legend-land,#pres-legend .pres-legend-sea,#pres-legend .pres-hex-name{transition:transform 1s cubic-bezier(.6,0,.2,1),opacity .8s ease}
#pres-legend[data-mode=land] .pres-legend-land{transform:translateX(480px)}
#pres-legend[data-mode=land] .pres-legend-sea{opacity:0}
#pres-legend[data-mode=corner] .pres-hex-name{opacity:0}
#pres-legend:not([data-mode=hidden]){opacity:1}
#pres-key{position:fixed;z-index:15;left:4vw;bottom:5vh;max-width:40vw;padding:1vw 1.4vw;border-radius:1vw;background:rgba(255,255,255,.9);box-shadow:0 1vw 3vw rgba(22,52,59,.14);font:clamp(15px,1.3vw,28px)/1.35 Baskerville,'Baskerville Old Face','Palatino Linotype',Georgia,serif;color:#193c49;transition:opacity .5s ease}
#pres-key[hidden]{display:block!important;opacity:0}
#pres-key div{display:flex;align-items:center;gap:.7em;margin:.2em 0}
#pres-key i{flex:none;width:1.9em;height:.34em;border-radius:.2em;background:var(--route-color,#fff3c9);box-shadow:0 0 0 1px rgba(25,60,73,.35)}
#pres-progress{position:fixed;z-index:20;right:2.2vw;bottom:2vh;font:600 clamp(11px,.8vw,16px) Gotham,'Avenir Next',Arial,sans-serif;letter-spacing:.12em;color:rgba(25,60,73,.55);pointer-events:none}
`;

export async function startPresentation(api){
 document.body.classList.add('presenting','pres-construction','pres-quiet');
 const style=document.createElement('style');style.id='presentation-style';style.textContent=css;document.head.append(style);
 const workspace=document.querySelector('.workspace'),stage=document.getElementById('stage');
 const canvas=document.createElement('canvas');canvas.id='pres-canvas';canvas.setAttribute('aria-hidden','true');stage.after(canvas);
 const heading=document.createElement('div');heading.id='pres-heading';heading.setAttribute('aria-live','polite');heading.innerHTML='<h1></h1><p></p>';
 const legend=document.createElement('div');legend.id='pres-legend';legend.dataset.mode='hidden';legend.append(legendSVG());
 const key=document.createElement('div');key.id='pres-key';key.hidden=true;
 const progress=document.createElement('div');progress.id='pres-progress';
 document.body.append(heading,legend,key,progress);
 document.title='Life zones — a Hexagonal Earth presentation';

 // Slides: the fixed opening, then every era and spot from the period Markdown.
 const texts={};
 await Promise.all(periods.map(p=>fetch(new URL(`./history/${p.id}.md`,import.meta.url)).then(r=>r.ok?r.text():null).then(md=>{if(md)texts[p.id]=parsePeriod(md);}).catch(()=>{})));
 const slides=[...openingSlides,...historySlides(texts)];
 const waves=await loadWaves().catch(()=>({}));
 while(!api.ready())await new Promise(r=>setTimeout(r,50));

 // The map uses the screen under the title; the camera's home is that fit.
 let home=null;
 const frame=()=>{const w=workspace.clientWidth,h=workspace.clientHeight;return {left:w*.04,right:w*.96,top:h*.29,bottom:h*.96};};
 const refit=()=>{api.setFrame(frame());home=api.fit();};
 refit();

 // --- The construction, drawn by the About scene. Geography follows the Spaceship Earth
 // preset, so the hexagons land exactly on the map's own at the end of Rearrange.
 const preset=layoutOptions.find(o=>o.arrangement==='dymaxion').state;
 const model=construction(),mesh=constructionMesh(model),fixedFrame=rearrangementFrame(model);
 for(const list of [mesh.samples,mesh.edges])for(const s of list)s.earth=geographicPoint(preset,s.p);
 const faceTile=model.faces.map(f=>f.tile);
 let dirty=true;
 const scene=createConstructionScene(canvas,{onTexture:()=>{dirty=true;}});
 let value=0,target=0,yaw=.4,last=0;
 const base=new Map(api.net().map(t=>[t.id,{x:t.x,y:t.y,r:t.r}]));
 // Rearrange: each whole hexagon lifts and swings from the About framing to its place and
 // turn on the live map, one after another, as the About page moves its pieces.
 function rearrangePoint(adjusted,u){
  const {w,h,scale,zoom,panX,panY,gridRotation}=api.view(),S=scale*zoom,theta=gridRotation*Math.PI/180;
  const placed=new Map(api.net().map(t=>[t.id,t.target||t]));
  const about=adjusted.pose,fit=adjusted.fit;
  return s=>{
   const tile=faceTile[s.f],from=base.get(tile),to=placed.get(tile)||from,order=[...base.keys()].indexOf(tile);
   const t=smooth((u-order*.1)/.7),p=adjusted.point(s),xy=[p[0]/Math.sqrt(3),p[1]/Math.sqrt(3)];
   // Start: the About view of the adjusted net (a similarity of net coordinates).
   const a=fit.view(about.view([from.x*Math.sqrt(3),from.y*Math.sqrt(3),0])),aScale=about.scale*Math.sqrt(3)*fit.f,aTurn=about.turn;
   // End: the map's own placement of this piece on screen, in the same clip units.
   const turnTo=(to.r-from.r)*Math.PI/3-theta,c=Math.cos(-theta),sn=Math.sin(-theta);
   const b=[(S*(c*to.x-sn*to.y)+panX)/(h/2),(S*(sn*to.x+c*to.y)-panY)/(h/2),0],bScale=S/(h/2);
   let turn=turnTo-aTurn;turn=((turn+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
   const angle=aTurn+turn*t,k=aScale+(bScale-aScale)*t,q=[xy[0]-from.x,xy[1]-from.y];
   const lift=Math.sin(Math.PI*t);
   return [a[0]+(b[0]-a[0])*t+k*(q[0]*Math.cos(angle)-q[1]*Math.sin(angle)),a[1]+(b[1]-a[1])*t+k*(q[0]*Math.sin(angle)+q[1]*Math.cos(angle))+.08*lift,.4*lift];
  };
 }
 // The About poses fill the canvas height; here they sit in the space under the title.
 const framed=()=>{const {top,bottom}=frame(),h=workspace.clientHeight,f=(bottom-top)/h,oy=1-(top+bottom)/h;return {f,oy,view:v=>[v[0]*f,v[1]*f+oy,v[2]*f]};};
 function drawConstruction(now){
  requestAnimationFrame(drawConstruction);
  if(!scene||document.hidden){last=now;return;}
  const dt=Math.min(50,now-(last||now));last=now;
  if(Math.abs(target-value)>1e-4){value+=Math.sign(target-value)*Math.min(Math.abs(target-value),dt*.0008);dirty=true;if(Math.abs(target-value)<=1e-4)arrived();}
  if(value<1.95&&!reduced()){yaw+=dt*.00016;dirty=true;}
  if(!dirty)return;dirty=false;
  const size=scene.resize(),aspect=size.aspect;
  const fit=framed();
  if(value<=3){const pose=rhombicPose(model,fixedFrame,value,{yaw,pitch:-.3,aspect});scene.render(mesh,p=>fit.view(pose.view(p)),pose.point,0,size);}
  else{const pose=rhombicPose(model,fixedFrame,3,{yaw,pitch:-.3,aspect});scene.render(mesh,p=>p,rearrangePoint({pose,point:pose.point,fit},value-3),0,size);}
 }
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let onArrive=null;const arrived=()=>{const f=onArrive;onArrive=null;f?.();};
 const goStage=(stage,then)=>{onArrive=then||null;target=stage;dirty=true;if(reduced()||Math.abs(target-value)<=1e-4){value=target;dirty=true;arrived();}};
 new ResizeObserver(()=>{dirty=true;}).observe(canvas);
 requestAnimationFrame(drawConstruction);

 // --- Titles, the two lines, the legend and the route key.
 let shownTitle=null;
 function setText(slide){
  const h1=heading.querySelector('h1'),p=heading.querySelector('p');
  if(h1.textContent===slide.title&&p.textContent===slide.text)return;
  const titleChanges=h1.textContent!==slide.title;
  heading.classList.add('changing');clearTimeout(setText.timer);
  setText.timer=setTimeout(()=>{h1.textContent=slide.title;p.textContent=slide.text;p.classList.toggle('long',slide.text.length>105);heading.classList.remove('changing');},titleChanges||shownTitle===null?300:250);
  shownTitle=slide.title;
 }
 function placeLegend(mode){
  legend.dataset.mode=mode;
  const w=innerWidth,h=innerHeight,box=legend.getBoundingClientRect(),width=legend.offsetWidth,height=legend.offsetHeight;
  if(mode==='corner'){const s=Math.min(.24,(w*.3)/width);legend.style.transform=`translate(${w-w*.025-width*s}px,${h*.035}px) scale(${s})`;}
  else{const s=Math.min(1,(h*.68)/height);legend.style.transform=`translate(${(w-width*s)/2}px,${h*.29+Math.max(0,(h*.68-height*s)/2)}px) scale(${s})`;}
  return box;
 }
 legend.style.left=legend.style.top='0';
 function setKey(slide){
  const items=(slide.key||[]).filter(k=>k.label);
  if(!items.length){key.hidden=true;return;}
  key.replaceChildren(...items.map(item=>{const row=document.createElement('div'),swatch=document.createElement('i'),label=document.createElement('span');swatch.style.setProperty('--route-color',waves[item.wave]?.color||'#fff3c9');label.textContent=item.label;row.append(swatch,label);return row;}));
  key.hidden=false;
 }

 // --- Moving the map: pan left while the dance re-forms the pieces around the centre,
 // until the same arrangement comes round again; then the map is quietly back at home.
 let panning=0;
 // The pan covers one period of the net: the shortest whole number of cells that moves
 // the map straight across the screen, about three cells. The rule re-forms the pieces
 // on the way; at the end the pieces form the opening arrangement one period along, which
 // on screen is exactly the opening view, so the map returns home without a visible jump.
 function panPeriod(){
  const {gridRotation}=api.view(),th=gridRotation*Math.PI/180,c=Math.cos(-th),sn=Math.sin(-th);let best=null;
  for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){const d=[1.5*i,Math.sqrt(3)*(j+i/2)],sx=c*d[0]-sn*d[1],sy=sn*d[0]+c*d[1];if(sx>1e-6&&Math.abs(sy)<1e-6&&(!best||sx<best.sx))best={d,sx};}
  if(!best)return null;const k=Math.max(1,Math.round(3*Math.sqrt(3)/best.sx));return {d:best.d.map(x=>x*k),sx:best.sx*k};
 }
 function startPan(){
  stopPan();if(reduced())return;
  const period=panPeriod();if(!period)return;
  const v0=api.view(),S=v0.scale*v0.zoom,distance=period.sx*S,duration=Math.max(3500,distance/(v0.w*.11)*1000),start=performance.now();let formed=0;
  const step=now=>{
   const t=Math.min(1,(now-start)/duration),e=t<.5?2*t*t:1-2*(1-t)**2;
   api.setView({zoom:home.zoom,panX:home.panX-distance*e,panY:home.panY});
   if(t>=1&&!formed){formed=now;api.formDance([...base].map(([id,b])=>({id,x:b.x+period.d[0],y:b.y+period.d[1],r:b.r})));}
   if(formed&&now-formed>300&&!api.dance().moving){api.resetDance();api.setView(home);api.releaseDance();panning=0;return;}
   panning=requestAnimationFrame(step);
  };
  panning=requestAnimationFrame(step);
 }
 function stopPan(){if(panning){cancelAnimationFrame(panning);panning=0;api.releaseDance();}}

 // --- Applying a slide: every slide is a whole state; transitions animate what differs.
 let index=-1,historyShown=null,eraChange=null,token=0;
 async function show(next){
  next=Math.max(0,Math.min(slides.length-1,next));if(next===index)return;
  const slide=slides[next],previous=slides[index],forward=next>index,my=++token;index=next;
  try{history.replaceState(history.state,'',`${location.pathname}#${next+1}`);}catch{}
  progress.textContent=`${next+1} / ${slides.length}`;
  setText(slide);
  // Leaving the pan part-way: fly home while the pieces glide back to the opening net.
  if(panning){stopPan();api.formDance([...base].map(([id,b])=>({id,...b})));api.animateView(home);setTimeout(()=>{if(!panning){api.resetDance();api.releaseDance();}},1400);}
  if(slide.stage!==undefined){
   // The construction: fade the map away first when coming back from it.
   document.body.classList.add('pres-quiet');
   eraChange=null;if(historyShown){api.hideHistory();historyShown=null;}
   placeLegend('hidden');setKey({});
   const wasMap=!document.body.classList.contains('pres-construction');
   if(wasMap){api.resetDance();api.setView(home);value=4;dirty=true;}
   document.body.classList.add('pres-construction');
   if(slide.stage===4)goStage(4,()=>{if(my===token)document.body.classList.remove('pres-construction');});
   else goStage(slide.stage);
   return;
  }
  // The map slides.
  if(document.body.classList.contains('pres-construction')){value=target=4;dirty=true;document.body.classList.remove('pres-construction');}
  placeLegend(slide.legend||'hidden');setKey(slide);
  if(!slide.period){
   document.body.classList.add('pres-quiet');eraChange=null;
   if(historyShown){api.unfocusSpot();api.hideHistory();historyShown=null;api.resetDance();}
   api.animateView(home);
   if(slide.pan)setTimeout(()=>{if(my===token)startPan();},900);
   return;
  }
  // History: an era opens zoomed out and fades in; its spots zoom in one after another.
  // One era change runs at a time: stepping on while it loads waits for it, not a second fade.
  if(historyShown!==slide.period){
   if(eraChange?.id!==slide.period){
    const id=slide.period,fading=historyShown!==null||!document.body.classList.contains('pres-quiet');
    const change={id};eraChange=change;
    change.done=(async()=>{
     document.body.classList.add('pres-quiet');
     if(historyShown)api.unfocusSpot();
     api.animateView(home);
     if(fading)await new Promise(r=>setTimeout(r,1100));
     if(eraChange!==change)return false;
     await api.showPeriod(id);
     if(eraChange!==change)return false;
     historyShown=id;eraChange=null;return true;
    })();
   }
   const change=eraChange;
   if(!await change.done||my!==token)return;
   if(slide.spot){await new Promise(r=>setTimeout(r,600));if(my!==token)return;}
  }
  document.body.classList.remove('pres-quiet');
  if(slide.spot)api.focusSpot(slide.spot);
  else{api.unfocusSpot();api.animateView(home);}
 }
 const step=delta=>show(index+delta);
 window.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const moves={ArrowRight:1,ArrowDown:1,PageDown:1,' ':1,Enter:1,ArrowLeft:-1,ArrowUp:-1,PageUp:-1,Backspace:-1};
  if(e.key in moves){e.preventDefault();e.stopImmediatePropagation();step(e.shiftKey&&e.key===' '?-1:moves[e.key]);}
  else if(e.key==='Home'){e.preventDefault();e.stopImmediatePropagation();show(0);}
  else if(e.key==='End'){e.preventDefault();e.stopImmediatePropagation();show(slides.length-1);}
  else if(e.key==='f'){e.preventDefault();if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();}
 },true);
 // Clicks on the map still pan and zoom; a click on the title steps forward.
 heading.style.pointerEvents='auto';heading.onclick=()=>step(1);
 addEventListener('resize',()=>{stopPan();refit();if(historyShown&&slides[index]?.spot)api.focusSpot(slides[index].spot);placeLegend(legend.dataset.mode);dirty=true;});
 const initial=Math.max(1,Math.min(slides.length,parseInt(location.hash.slice(1))||1))-1;
 // For checks: where Rearrange puts each hexagon's centre on screen, in CSS pixels.
 const rearrangedCentres=()=>{const size=scene.resize(),pose=rhombicPose(model,fixedFrame,3,{yaw,pitch:-.3,aspect:size.aspect}),map=rearrangePoint({pose,point:pose.point,fit:framed()},1),{w,h}=api.view();
  return Object.fromEntries([...base.keys()].map(tile=>{const pts=mesh.samples.filter(s=>faceTile[s.f]===tile).map(map),c=[0,1].map(i=>(Math.min(...pts.map(p=>p[i]))+Math.max(...pts.map(p=>p[i])))/2);return [tile,[w/2+c[0]*h/2,h/2-c[1]*h/2]];}));};
 // Triangle centres, never on a hexagon's edge, with the geography the map should show there.
 const rearrangedSamples=n=>{const size=scene.resize(),pose=rhombicPose(model,fixedFrame,3,{yaw,pitch:-.3,aspect:size.aspect}),map=rearrangePoint({pose,point:pose.point,fit:framed()},1),{w,h}=api.view(),count=mesh.samples.length/3,out=[];
  for(let k=0;k<n;k++){const tri=mesh.samples.slice(3*Math.floor(k*count/n),3*Math.floor(k*count/n)+3),pts=tri.map(map),c=[0,1].map(i=>(pts[0][i]+pts[1][i]+pts[2][i])/3),e=geographicPoint(preset,[0,1,2].map(i=>(tri[0].p[i]+tri[1].p[i]+tri[2].p[i])/3)),r=Math.hypot(...e);
   out.push({x:w/2+c[0]*h/2,y:h/2-c[1]*h/2,lat:Math.asin(e[2]/r)*180/Math.PI,lon:Math.atan2(e[1],e[0])*180/Math.PI});}
  return out;};
 window.presentation={slides,show,rearrangedCentres,rearrangedSamples,get index(){return index;}};
 await show(initial);
}
