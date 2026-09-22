import {rotation} from './optimizer.mjs?v=tetra-area-2';
import {patchProjector} from './indicatrix.mjs?v=tetra-area-2';

// Representative discovery anchors, not boundaries or claims of geographic extent.
// Seven entry points (September 21 decisions); each opens a dated, animated story.
// Overlays are resolved by the story controller through tour-data.mjs.
export const tourLocations=Object.freeze([
 {id:'origin-of-mankind',title:'Origin of mankind',latitude:3.5,longitude:36,overlay:'human-migrations'},
 {id:'silk-road',title:'Silk Road',latitude:45.4,longitude:82.4,overlay:'silk-road'},
 {id:'iceland-to-vinland',title:'Viking expansion',latitude:64.8,longitude:-18.5,overlay:'norse-voyages'},
 {id:'french-polynesia',title:'French Polynesia',latitude:-17.65,longitude:-149.43,overlay:'polynesia'},
 {id:'americas-exchange',title:'Americas exchange',latitude:-13.5,longitude:-72,overlay:'americas-exchange'},
 {id:'african-networks',title:'African networks',latitude:16.77,longitude:-3,overlay:'african-networks'},
 {id:'ocean-crossings',title:'Ocean crossings',latitude:2.2,longitude:102.25,overlay:'ocean-crossings'},
].map(Object.freeze));

// Stories and the history timeline exist on the Spaceship Earth and Felv
// arrangements, in any pre-rendered style except political borders and the
// distortion analysis (September 21 rule). Custom maps have no story layer.
export const tourArrangements=Object.freeze(['dymaxion','felv']);
export const tourStyleExclusions=Object.freeze(['political','distortion-analysis']);
export const tourEnabled=entry=>{const parts=(entry?.path||'').split('/'),style=parts.at(-1),arrangement=parts.at(-2);return tourArrangements.includes(arrangement)&&!!style&&!tourStyleExclusions.includes(style);};
// The Pacific-facing arrangement and its relit artwork are baked for one map.
export const pacificLayoutEnabled=entry=>!!entry?.path?.endsWith('/dymaxion/lifezones')||!!entry?.path?.includes('/dymaxion/');
export const pacificLightingEnabled=entry=>!!entry?.path?.endsWith('/dymaxion/lifezones');

// Reuse the inverse of the renderer's patch interpolation, then let the app's
// point() apply the same tile placement, grid rotation, zoom and pan as the map.
export function projectTourLocations(tiles,net,angles,locations=tourLocations){
 const matrix=rotation(angles);
 const patches=net.flatMap(tile=>tiles[tile.id].patches.map(patch=>({tile,projector:patchProjector(patch)})));
 // Re-cut arrangements (Felv) list several pieces of one hexagon, each with a
 // polygon in the hexagon's local frame; a point belongs to the piece that
 // contains it, not to the first piece of that hexagon.
 const inside=(p,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 return locations.map(location=>{
  const lat=location.latitude*Math.PI/180,lon=location.longitude*Math.PI/180;
  const geographic=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
  const sphere=[0,1,2].map(i=>geographic.reduce((sum,v,j)=>sum+matrix[j*3+i]*v,0));
  let fallback=null;
  for(const {tile,projector} of patches){
   const weights=projector.coefficients(sphere);
   if(!weights.every(v=>v>=-1e-9))continue;
   const local=projector.point(weights);
   if(!tile.polygon)return {location,tile,local};
   if(inside(local,tile.polygon))return {location,tile,local};
   fallback??={location,tile,local};
  }
  return fallback;
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
 const locations=new Map();
 // The seven entry dots exist from the start; a history period may add its own
 // highlight spots (hominin groups, the first towns), whose buttons are made on demand.
 const make=(location,index)=>{
  locations.set(location.id,location);
  const button=document.createElement('button');button.type='button';button.className='tour-marker';
  button.dataset.tourId=location.id;button.setAttribute('aria-label',location.title);
  for(let ring=0;ring<3;ring++){
   const pulse=document.createElement('span');pulse.className='tour-ripple';pulse.setAttribute('aria-hidden','true');
   pulse.style.animationDelay=`${-ring*1.2-index*.37}s`;button.append(pulse);
  }
  const center=document.createElement('span');center.className='tour-center';center.setAttribute('aria-hidden','true');button.append(center);
  button.addEventListener('click',event=>{if(event.detail===0)select(locations.get(location.id));});
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   // Nearby anchors can share a touch target at a small fitted zoom. Resolve
   // to the nearest center, not whichever button happens to be last in the DOM.
   let nearest=locations.get(location.id),distance=Infinity;
   for(const [id,element] of buttons){
    if(element.hidden)continue;
    const rect=element.getBoundingClientRect();
    const d=Math.hypot(event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2);
    if(d<distance){distance=d;nearest=locations.get(id);}
   }
   if(event.isPrimary)pending={location:nearest,id:event.pointerId,x:event.clientX,y:event.clientY};
   // Keep the existing pan/pinch behavior even when a gesture starts on a dot.
   canvas.dispatchEvent(new PointerEvent('pointerdown',event));
  });
  button.addEventListener('wheel',event=>{event.preventDefault();canvas.dispatchEvent(new WheelEvent('wheel',event));},{passive:false});
  buttons.set(location.id,button);layer.append(button);return button;
 };
 for(const [index,location] of tourLocations.entries())make(location,index);
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
   for(const {location,local,tile,offset} of anchors){
    const [x,y]=point(local,tile,offset),button=buttons.get(location.id)||make(location,buttons.size);
    locations.set(location.id,location);if(button.getAttribute('aria-label')!==location.title)button.setAttribute('aria-label',location.title);
    button.hidden=x<0||y<0||x>width||y>height;
    button.style.left=`${x}px`;button.style.top=`${y}px`;
   }
   if(layer.hidden)pending=null;
  },
 };
}
