import {rotation} from './optimizer.mjs?v=tetra-area-2';
import {patchProjector} from './indicatrix.mjs?v=tetra-area-2';

// Representative discovery anchors, not boundaries or claims of geographic extent.
// Five entry points (September 21 decision); each opens a dated, animated story.
// Overlays are resolved by the story controller through tour-data.mjs.
export const tourLocations=Object.freeze([
 {id:'origin-of-mankind',title:'Origin of mankind',latitude:3.5,longitude:36,overlay:'human-migrations'},
 {id:'silk-road',title:'Silk Road',latitude:45.4,longitude:82.4,overlay:'silk-road'},
 {id:'iceland-to-vinland',title:'Iceland to Vinland',latitude:64.8,longitude:-18.5,overlay:'norse-voyages'},
 {id:'french-polynesia',title:'French Polynesia',latitude:-17.65,longitude:-149.43,overlay:'polynesia'},
 {id:'americas-exchange',title:'Americas exchange',latitude:-13.5,longitude:-72,overlay:'americas-exchange'},
].map(Object.freeze));

export const tourEnabled=entry=>!!entry?.path?.endsWith('/dymaxion/lifezones');

// Reuse the inverse of the renderer's patch interpolation, then let the app's
// point() apply the same tile placement, grid rotation, zoom and pan as the map.
export function projectTourLocations(tiles,net,angles,locations=tourLocations){
 const matrix=rotation(angles);
 const patches=net.flatMap(tile=>tiles[tile.id].patches.map(patch=>({tile,projector:patchProjector(patch)})));
 return locations.map(location=>{
  const lat=location.latitude*Math.PI/180,lon=location.longitude*Math.PI/180;
  const geographic=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
  const sphere=[0,1,2].map(i=>geographic.reduce((sum,v,j)=>sum+matrix[j*3+i]*v,0));
  for(const {tile,projector} of patches){
   const weights=projector.coefficients(sphere);
   if(weights.every(v=>v>=-1e-9))return {location,tile,local:projector.point(weights)};
  }
  return null;
 }).filter(Boolean);
}

export function createTourMarkers(stage,canvas){
 const layer=document.createElement('div');layer.className='tour-markers';layer.hidden=true;
 layer.setAttribute('role','group');layer.setAttribute('aria-label','Explore locations');stage.append(layer);
 const buttons=new Map();let pending=null;
 const select=location=>{
  const button=buttons.get(location.id);
  if(layer.hidden||button.hidden)return;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)button.querySelector('.tour-center').animate([{transform:'scale(1.7)'},{transform:'scale(1)'}],{duration:350});
  // A single integration point for the future story/route/area controller.
  layer.dispatchEvent(new CustomEvent('tourselect',{bubbles:true,detail:location}));
 };
 for(const [index,location] of tourLocations.entries()){
  const button=document.createElement('button');button.type='button';button.className='tour-marker';
  button.dataset.tourId=location.id;button.setAttribute('aria-label',location.title);
  for(let ring=0;ring<3;ring++){
   const pulse=document.createElement('span');pulse.className='tour-ripple';pulse.setAttribute('aria-hidden','true');
   pulse.style.animationDelay=`${-ring*1.2-index*.37}s`;button.append(pulse);
  }
  const center=document.createElement('span');center.className='tour-center';center.setAttribute('aria-hidden','true');button.append(center);
  button.addEventListener('click',event=>{if(event.detail===0)select(location);});
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   // Nearby anchors can share a touch target at a small fitted zoom. Resolve
   // to the nearest center, not whichever button happens to be last in the DOM.
   let nearest=location,distance=Infinity;
   for(const candidate of tourLocations){
    const element=buttons.get(candidate.id);if(element.hidden)continue;
    const rect=element.getBoundingClientRect();
    const d=Math.hypot(event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2);
    if(d<distance){distance=d;nearest=candidate;}
   }
   if(event.isPrimary)pending={location:nearest,id:event.pointerId,x:event.clientX,y:event.clientY};
   // Keep the existing pan/pinch behavior even when a gesture starts on a dot.
   canvas.dispatchEvent(new PointerEvent('pointerdown',event));
  });
  button.addEventListener('wheel',event=>{event.preventDefault();canvas.dispatchEvent(new WheelEvent('wheel',event));},{passive:false});
  buttons.set(location.id,button);layer.append(button);
 }
 stage.addEventListener('pointerdown',event=>{if(!event.isPrimary)pending=null;},true);
 stage.addEventListener('pointermove',event=>{
  if(pending&&event.pointerId===pending.id&&Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>6)pending=null;
 },true);
 stage.addEventListener('pointerup',event=>{
  const target=pending;pending=null;
  if(target&&event.pointerId===target.id&&Math.hypot(event.clientX-target.x,event.clientY-target.y)<=6)select(target.location);
 },true);
 stage.addEventListener('pointercancel',()=>{pending=null;},true);
 return {
  update(anchors,point,width,height){
   layer.hidden=!anchors.length;
   const present=new Set(anchors.map(anchor=>anchor.location.id));
   for(const [id,button] of buttons)if(!present.has(id))button.hidden=true;
   for(const {location,local,tile} of anchors){
    const [x,y]=point(local,tile),button=buttons.get(location.id);
    button.hidden=x<0||y<0||x>width||y>height;
    button.style.left=`${x}px`;button.style.top=`${y}px`;
   }
   if(layer.hidden)pending=null;
  },
 };
}
