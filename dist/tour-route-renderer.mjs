import {projectTourLocations} from './tour-markers.mjs?v=history-4';
import {hex} from './geometry.mjs';

export function sampleRoute(route,step=.18){
 const points=[];
 const vector=([lat,lon])=>{lat*=Math.PI/180;lon*=Math.PI/180;return [Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];};
 for(let i=1;i<route.coordinates.length;i++){
  const a=route.coordinates[i-1],b=route.coordinates[i],deltaLon=((b[1]-a[1]+540)%360)-180;
  const n=Math.ceil(Math.hypot(b[0]-a[0],deltaLon)/step),va=vector(a),vb=vector(b),angle=Math.acos(Math.max(-1,Math.min(1,va.reduce((sum,v,k)=>sum+v*vb[k],0))));
  for(let j=0;j<n;j++){
   if(route.geodesic&&angle>1e-9){const t=j/n,v=va.map((x,k)=>(x*Math.sin((1-t)*angle)+vb[k]*Math.sin(t*angle))/Math.sin(angle));points.push({latitude:Math.asin(v[2])*180/Math.PI,longitude:Math.atan2(v[1],v[0])*180/Math.PI});}
   else points.push({latitude:a[0]+(b[0]-a[0])*j/n,longitude:a[1]+deltaLon*j/n});
  }
 }
 const last=route.coordinates.at(-1);points.push({latitude:last[0],longitude:last[1]});return points;
}
// A route may carry several relaxed strands (same stops, different courses).
export const routeStrands=route=>route.strands?route.strands.map(coordinates=>({...route,coordinates,geodesic:false})):[route];
export function projectTourRoutes(tiles,net,angles,routes=[]){
 return routes.map(route=>{
  const strandAnchors=routeStrands(route).map(strand=>projectTourLocations(tiles,net,angles,sampleRoute(strand)));
  return {...route,anchors:strandAnchors.flat(),strandAnchors};
 });
}
// Drawn as lines, a route is one course: its first strand, and a two-way route's
// return leg (the same coordinates reversed) adds nothing. The strands' jiggle
// and the return traffic are for the comets.
export const lineCourses=routes=>routes.filter(route=>!route.returnOf).map(route=>({...route,anchors:(route.strandAnchors||[route.anchors])[0]}));
// A still line keeps one point in four of the relaxed course (and both ends), so the
// strand's jiggle, made for the comets, does not read as a wobble in the line.
export function straightenPoints(points,step=4){
 if(points.length<=2*step+2)return points;
 const out=[];for(let i=0;i<points.length-2;i+=2*step)out.push(points[i],points[i+1]);
 out.push(points[points.length-2],points[points.length-1]);return out;
}
// Never bridge a cut between separate map pieces. Split at tile changes; samples
// on either side approach the seam within a fraction of a geographic degree.
function routePositions(anchors,point,lane=0){
 const positions=anchors.map(anchor=>point(anchor.local,anchor.tile,anchor.offset));
 return anchors.map((anchor,i)=>{
  let [x,y]=positions[i];
  if(lane){
   const before=anchors[i-1]?.tile===anchor.tile?positions[i-1]:positions[i],after=anchors[i+1]?.tile===anchor.tile?positions[i+1]:positions[i];
   const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy);
   if(length){x-=dy/length*lane;y+=dx/length*lane;}
  }
  return [x,y];
 });
}
export function routePath(anchors,point,lane=0){
 return routePositions(anchors,point,lane).map(([x,y],i)=>`${i&&anchors[i-1].tile===anchors[i].tile?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}
// Carry the dot phase across separate hexagons without drawing the intervening
// gap. Otherwise each piece would restart the same cluster at every cut.
// Each fragment keeps its screen points and the travelled distance at each
// point (`at`), so a dot at route distance p is found by one binary search.
export function routeFragments(anchors,point,lane=0){
 const positions=routePositions(anchors,point,lane),parts=[];let distance=0;
 for(let i=0;i<positions.length;i++){
  const [x,y]=positions[i],start=!i||anchors[i-1].tile!==anchors[i].tile;
  if(start)parts.push({d:'',start:distance,points:[],at:[]});
  else distance+=Math.hypot(x-positions[i-1][0],y-positions[i-1][1]);
  const part=parts.at(-1);part.d+=`${start?'M':'L'}${x.toFixed(2)},${y.toFixed(2)} `;part.points.push(x,y);part.at.push(distance);
 }
 for(const part of parts)part.length=part.at.at(-1)-part.start;
 return parts;
}
// The dot pattern as loop distances: where each dot sits in one repeat of the
// traffic pattern (`.1 gap .1 gap …`), so the dots on a strand at time t lie at
// (offset − phase + speed·t) mod loop length, counted from the strand's start.
const dotOffsets=new WeakMap();
export function trafficDots(traffic){
 if(dotOffsets.has(traffic))return dotOffsets.get(traffic);
 const v=traffic.dasharray.split(' ').map(Number),out=[];let d=0;
 for(let i=0;i<v.length;i+=2){out.push(d+v[i]/2);d+=v[i]+v[i+1];}
 dotOffsets.set(traffic,out);return out;
}
// The comet: a head on a dark halo, then a tail drawn as steps of falling
// opacity. Each step is a stroke of the route behind the head, so the tail
// bends along the course instead of pointing straight back.
export const comet={head:3.2,halo:5.6,tail:[[.5,8],[.25,8],[.1,8]]};
// Position on a fragment at distance p from its start; from a binary search on
// the cumulative distances, interpolated within the segment found.
function along(part,p,out){
 const at=part.at,n=at.length;let lo=0,hi=n-1;
 const target=part.start+p;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(at[mid]<=target)lo=mid;else hi=mid;}
 const span=at[hi]-at[lo],t=span?Math.max(0,Math.min(1,(target-at[lo])/span)):0;
 out[0]=part.points[2*lo]+(part.points[2*hi]-part.points[2*lo])*t;out[1]=part.points[2*lo+1]+(part.points[2*hi+1]-part.points[2*lo+1])*t;
 return lo;
}
export function createTourRoutes(stage){
 const canvas=document.createElement('canvas');canvas.classList.add('tour-routes');canvas.setAttribute('aria-hidden','true');canvas.style.display='none';stage.prepend(canvas);
 const ctx=canvas.getContext('2d');
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 let drawn=[],width=0,height=0,dpr=1,paused=false,frame=0,clipPolygons=[];
 // Animation settings: comets or lines, moving or still, dot size and tail length (px).
 const options={style:'comets',motion:true,dotSize:comet.head,tail:comet.tail.reduce((sum,[,length])=>sum+length,0),lineWidth:2};
 const fadeRadius=30,started=performance.now();
 const fadeAt=(x,y,ends)=>{let f=1;for(let i=0;i<ends.length;i+=2){const d=Math.hypot(x-ends[i],y-ends[i+1]);if(d<fadeRadius)f=Math.min(f,d/fadeRadius);}return f;};
 const pos=[0,0],from=[0,0];
 // `corridor` draws a dot every 8 px with no tails: previews at thumbnail size
 // would lose the sparse packets, so they show the whole course instead.
 function render(corridor=false){
  frame=0;if(canvas.style.display==='none')return;
  const ratio=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);dpr=ratio;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.lineCap='round';ctx.lineJoin='round';
  const still=reduced||!options.motion,lines=options.style==='lines';
  const t=still?0:(performance.now()-started)/1000;
  const head=options.dotSize,halo=head*1.75,tailSteps=options.tail>0?comet.tail.map(([opacity])=>[opacity,options.tail/comet.tail.length]):[];
  // Layers keep halo under every head: halos first, then tails, then heads.
  for(const item of drawn){
   const {color,fragments,traffic,ends,uncertain,lane}=item,alpha=uncertain?.65:1;
   if(lines&&!item.course){item.dots=0;continue;}
   ctx.save();
   if(lane&&clipPolygons.length){ctx.beginPath();for(const poly of clipPolygons){ctx.moveTo(poly[0],poly[1]);for(let i=2;i<poly.length;i+=2)ctx.lineTo(poly[i],poly[i+1]);ctx.closePath();}ctx.clip();}
   if(lines){
    // The whole course as a still line: a dark halo under the wave colour keeps every hue readable.
    for(const pass of [0,1]){ctx.globalAlpha=pass?alpha:alpha*.45;ctx.strokeStyle=pass?color:'#213e46';ctx.lineWidth=pass?options.lineWidth:options.lineWidth+1.4;
     for(const part of fragments){if(part.points.length<4)continue;const pts=straightenPoints(part.points);ctx.beginPath();ctx.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);ctx.stroke();}
     // A one-way route ends in an arrowhead along its last segment.
     const end=item.twoWay?null:fragments.findLast(part=>part.points.length>=4);
     if(end){const pts=straightenPoints(end.points),n=pts.length,tx=pts[n-2],ty=pts[n-1],a=Math.atan2(ty-pts[n-3],tx-pts[n-4]),c=Math.cos(a),si=Math.sin(a),size=options.lineWidth*3+(pass?3:4);
      ctx.fillStyle=pass?color:'#213e46';ctx.beginPath();ctx.moveTo(tx+c*size*.6,ty+si*size*.6);ctx.lineTo(tx-c*size*.7-si*size*.55,ty-si*size*.7+c*size*.55);ctx.lineTo(tx-c*size*.7+si*size*.55,ty-si*size*.7-c*size*.55);ctx.closePath();ctx.fill();}}
    item.dots=0;ctx.restore();continue;
   }
   const offsets=corridor?[0]:trafficDots(traffic),loop=corridor?8:traffic.length,shift=corridor?0:((traffic.speed*t-traffic.phase)%loop+loop)%loop,tail=corridor?[]:tailSteps;
   const heads=[];
   for(const part of fragments){
    if(part.length<=0)continue;
    // Every dot whose loop position lands inside this fragment's stretch of the strand.
    const first=part.start,last=part.start+part.length;
    for(const o of offsets){
     // Loop positions p = o + shift + k·loop for integers k, within [first,last].
     let p=((o+shift-first)%loop+loop)%loop+first;
     for(;p<=last;p+=loop){
      const local=p-part.start;
      along(part,local,pos);
      const x=pos[0],y=pos[1];
      if(x<-20||y<-20||x>width+20||y>height+20)continue;
      const f=fadeAt(x,y,ends)*alpha;if(f<=.02)continue;
      heads.push(x,y,f);
      // Tail steps: strokes of the route behind the head, each step one fixed length.
      let back=local;
      for(const [opacity,length] of tail){
       const end=Math.max(0,back-length);if(end>=back)break;
       ctx.globalAlpha=opacity*f;ctx.strokeStyle=color;ctx.lineWidth=head;ctx.beginPath();
       // Walk the polyline between end and back so the tail bends with the course.
       const hiBack=along(part,back,pos);ctx.moveTo(pos[0],pos[1]);
       const loEnd=along(part,end,from);
       for(let i=hiBack;i>loEnd;i--)ctx.lineTo(part.points[2*i],part.points[2*i+1]);
       ctx.lineTo(from[0],from[1]);ctx.stroke();
       back=end;
      }
     }
    }
   }
   item.dots=heads.length/3;
   ctx.globalAlpha=1;
   // Halo under the heads, then the heads.
   ctx.fillStyle='#213e46';
   for(let i=0;i<heads.length;i+=3){ctx.globalAlpha=.8*heads[i+2];ctx.beginPath();ctx.arc(heads[i],heads[i+1],halo/2,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle=color;
   for(let i=0;i<heads.length;i+=3){ctx.globalAlpha=heads[i+2];ctx.beginPath();ctx.arc(heads[i],heads[i+1],head/2,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  canvas.dataset.dots=String(drawn.reduce((sum,item)=>sum+(item.dots||0),0));
  canvas.dataset.routeStyle=lines?'lines':still?'still':'comets';canvas.dataset.lines=String(lines?drawn.filter(item=>item.course).length:0);
  if(!paused&&!still&&!lines&&drawn.length)frame=requestAnimationFrame(loop);
 }
 const loop=()=>render(false);const schedule=()=>{if(!frame)frame=requestAnimationFrame(loop);};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
 const api={
  canvas,
  setPaused(value){paused=value;canvas.classList.toggle('flow-paused',paused);if(!paused)schedule();},
  // Animation pane settings; a change redraws at once (a still frame when nothing moves).
  configure(next){
   let changed=false;for(const [key,value] of Object.entries(next)){if(value!==undefined&&options[key]!==value){options[key]=value;changed=true;}}
   if(changed&&drawn.length){cancelAnimationFrame(frame);frame=0;render();}
   return options;
  },
  // Draw one frame now (previews and tests) and return the canvas.
  snapshot(corridor=false){cancelAnimationFrame(frame);frame=0;render(corridor);return canvas;},
  update(routes,point,w,h){
   width=w;height=h;canvas.style.display=routes.length?'block':'none';
   canvas.dataset.visibleRoutes=routes.map(route=>route.id).join(' ');canvas.dataset.routeCount=String(routes.length);
   // Parallel lanes must still end at the map silhouette, including its cuts.
   clipPolygons=[];
   if(routes.some(route=>route.lane)){const seen=new Set();for(const anchor of routes.flatMap(route=>route.anchors)){const key=anchor.tile.id+':'+(anchor.offset||[0,0]).map(v=>v.toFixed(2)).join();if(seen.has(key))continue;seen.add(key);
    clipPolygons.push(hex.flatMap(p=>point(p,anchor.tile,anchor.offset)));}}
   drawn=routes.map(route=>{
    const strands=route.strandAnchors||[route.anchors],traffic=route.traffic;
    return strands.map((anchors,s)=>{const t=Array.isArray(traffic)?traffic[s]:traffic;if(!t||!anchors.length)return null;
     const ends=[anchors[0],anchors.at(-1)].flatMap(anchor=>point(anchor.local,anchor.tile,anchor.offset));
     return {id:route.id,color:route.color||'#fff3c9',uncertain:!!route.uncertain,lane:route.lane,traffic:t,ends,course:s===0&&!route.returnOf,twoWay:!!route.twoWay,fragments:routeFragments(anchors,point,route.lane)};}).filter(Boolean);
   }).flat();
   if(routes.length){cancelAnimationFrame(frame);frame=0;render();}else{cancelAnimationFrame(frame);frame=0;canvas.dataset.dots='0';}
  } };
 canvas.renderer=api;return api;
}
