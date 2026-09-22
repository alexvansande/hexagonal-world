import {projectTourLocations} from './tour-markers.mjs?v=stories-7';
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
// Never bridge a cut between separate map pieces. Split at tile changes; samples
// on either side approach the seam within a fraction of a geographic degree.
function routePositions(anchors,point,lane=0){
 const positions=anchors.map(anchor=>point(anchor.local,anchor.tile));
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
// Carry the dash phase across separate hexagons without drawing the intervening
// gap. Otherwise each SVG subpath would restart the same cluster at every cut.
export function routeFragments(anchors,point,lane=0){
 const positions=routePositions(anchors,point,lane),parts=[];let distance=0;
 for(let i=0;i<positions.length;i++){
  const [x,y]=positions[i],start=!i||anchors[i-1].tile!==anchors[i].tile;
  if(start)parts.push({d:'',start:distance});
  else distance+=Math.hypot(x-positions[i-1][0],y-positions[i-1][1]);
  parts.at(-1).d+=`${start?'M':'L'}${x.toFixed(2)},${y.toFixed(2)} `;
 }
 return parts;
}
export function createTourRoutes(stage){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.classList.add('tour-routes');svg.setAttribute('aria-hidden','true');svg.style.display='none';stage.prepend(svg);
 const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath');clip.id='tour-route-map-clip';defs.append(clip);svg.append(defs);
 // Dots fade in at a route's first stop and out at its last instead of popping:
 // a luminance mask with a dark-centred radial gradient at each terminus.
 const fade=document.createElementNS(ns,'radialGradient');fade.id='tour-route-fade';
 for(const [offset,color] of [['0','#000'],['1','#fff']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);fade.append(stop);}
 defs.append(fade);const fadeRadius=30;
 const paths=new Map();
 const pathFor=route=>{
  if(paths.has(route.id))return paths.get(route.id);
  const group=document.createElementNS(ns,'g');group.dataset.routeId=route.id;
  const halo=document.createElementNS(ns,'path'),line=document.createElementNS(ns,'path');halo.classList.add('route-halo');line.classList.add('route-line');
  const mask=document.createElementNS(ns,'mask');mask.id=`tour-route-fade-${paths.size}`;mask.setAttribute('maskUnits','userSpaceOnUse');
  const cover=document.createElementNS(ns,'rect');cover.setAttribute('fill','#fff');mask.append(cover);defs.append(mask);
  group.setAttribute('mask',`url(#${mask.id})`);
  group.append(halo,line);svg.append(group);const value={group,halo,line,mask,cover,ends:[],segments:[{halo,line}]};paths.set(route.id,value);return value;
 };
 return {setPaused(paused){svg.classList.toggle('flow-paused',paused);},update(routes,point,width,height){
  svg.style.display=routes.length?'block':'none';svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  // Parallel lanes must still end at the map silhouette, including its cuts.
  clip.replaceChildren();
  if(routes.some(route=>route.lane))for(const tile of new Set(routes.flatMap(route=>route.anchors.map(anchor=>anchor.tile)))){
   const polygon=document.createElementNS(ns,'polygon');polygon.setAttribute('points',hex.map(p=>point(p,tile).join(',')).join(' '));clip.append(polygon);
  }
  // Scrubbing the timeline visits hundreds of routes; drop groups that are no
  // longer drawn once the cache grows well beyond the current set.
  const wanted=new Set(routes.map(route=>route.id));
  if(paths.size>wanted.size+120)for(const [id,{group,mask}] of paths)if(!wanted.has(id)){group.remove();mask.remove();paths.delete(id);}
  for(const {group} of paths.values())group.style.display='none';
  routes.forEach(route=>{
   const value=pathFor(route),{group,segments}=value,traffic=route.traffic;
   group.style.display='';group.classList.toggle('route-flow',!!route.animated);group.classList.toggle('route-sporadic',!!traffic);group.classList.toggle('route-uncertain',!!route.uncertain);group.dataset.wave=route.wave||'';
   if(route.lane)group.setAttribute('clip-path','url(#tour-route-map-clip)');else group.removeAttribute('clip-path');
   const strands=route.strandAnchors||[route.anchors];
   const fragments=strands.flatMap((anchors,s)=>{const t=Array.isArray(traffic)?traffic[s]:traffic;
    return t?routeFragments(anchors,point,route.lane).map(f=>({...f,traffic:t})):[{d:routePath(anchors,point,route.lane),start:0,traffic:null}];});
   // Terminus fades follow the camera; cuts inside a route keep full strength.
   const {mask,cover,ends}=value;cover.setAttribute('width',width);cover.setAttribute('height',height);
   const termini=traffic?strands.flatMap(anchors=>anchors.length?[anchors[0],anchors.at(-1)]:[]):[];
   while(ends.length>termini.length)ends.pop().remove();
   termini.forEach((anchor,i)=>{
    if(!ends[i]){const circle=document.createElementNS(ns,'circle');circle.setAttribute('r',fadeRadius);circle.setAttribute('fill','url(#tour-route-fade)');mask.append(circle);ends.push(circle);}
    const [x,y]=point(anchor.local,anchor.tile);ends[i].setAttribute('cx',x.toFixed(1));ends[i].setAttribute('cy',y.toFixed(1));
   });
   while(segments.length>fragments.length){const {halo,line}=segments.pop();halo.remove();line.remove();}
   fragments.forEach(({d,start,traffic},i)=>{
    if(!segments[i]){const halo=document.createElementNS(ns,'path'),line=document.createElementNS(ns,'path');halo.classList.add('route-halo');line.classList.add('route-line');group.append(halo,line);segments.push({halo,line});}
    for(const path of Object.values(segments[i])){
     path.setAttribute('d',d);
     if(traffic){path.style.strokeDasharray=traffic.dasharray;path.style.setProperty('--traffic-from',String(traffic.phase+start));path.style.setProperty('--traffic-to',String(traffic.phase+start-traffic.length));path.style.setProperty('--traffic-duration',`${traffic.length/traffic.speed}s`);}
     else {path.style.strokeDasharray='';path.style.removeProperty('--traffic-from');path.style.removeProperty('--traffic-to');path.style.removeProperty('--traffic-duration');}
    }
   });
  });
 }};
}
