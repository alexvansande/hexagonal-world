import {rotation} from './optimizer.mjs?v=tetra-area-2';
import {patchProjector,projectCircle} from './indicatrix.mjs?v=tetra-area-2';

// Clip a spherical ring against the three planes of a renderer patch, in its
// ray coefficients. Even/odd filling preserves holes and disconnected concave
// fragments. Artificial clip edges are used only for filling, never stroked.
export function clipRing(coefficients){
 let ring=coefficients;
 for(let axis=0;axis<3&&ring.length;axis++){
  const next=[];
  for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length],insideA=a[axis]>=0,insideB=b[axis]>=0;
   if(insideA)next.push(a);
   if(insideA!==insideB){const t=a[axis]/(a[axis]-b[axis]);next.push(a.map((v,k)=>v+(b[k]-v)*t));}
  }
  ring=next;
 }
 return ring;
}

function sphereRing(ring,matrix){
 const points=[];
 for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],dx=((b[0]-a[0]+540)%360)-180,dy=b[1]-a[1];
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.18));
  for(let j=0;j<steps;j++){
   const lon=(a[0]+dx*j/steps)*Math.PI/180,lat=(a[1]+dy*j/steps)*Math.PI/180;
   const p=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
   points.push([0,1,2].map(k=>p.reduce((sum,v,l)=>sum+matrix[l*3+k]*v,0)));
  }
 }
 return points;
}

export function projectTourAreas(tiles,net,angles,areas=[]){
 const matrix=rotation(angles);
 const patches=net.flatMap(tile=>tiles[tile.id].patches.map(patch=>({tile,projector:patchProjector(patch)})));
 return areas.map(area=>{
  const polygons=area.geometry.type==='Polygon'?[area.geometry.coordinates]:area.geometry.coordinates;
  const rings=polygons.flatMap(polygon=>polygon.map(ring=>sphereRing(ring,matrix)));
  const fills=[],segments=[],anchors=[];
  for(const {tile,projector} of patches)for(const ring of rings){
   const clipped=clipRing(ring.map(projector.coefficients));
   if(clipped.length>=3){
    const local=clipped.map(projector.point);
    if(local.every(p=>p.every(Number.isFinite))){fills.push({tile,local});anchors.push(...local.map(p=>({tile,local:p})));}
   }
   for(const [a,b] of projectCircle(ring,projector))segments.push({tile,a,b});
  }
  return {...area,fills,segments,anchors};
 });
}

export function areaPaths(area,point){
 const xy=(p,tile)=>point(p,tile).map(v=>v.toFixed(3)).join(',');
 return {
  fill:area.fills.map(({tile,local})=>local.map((p,i)=>(i?'L':'M')+xy(p,tile)).join(' ')+'Z').join(' '),
  border:area.segments.map(({tile,a,b})=>'M'+xy(a,tile)+'L'+xy(b,tile)).join(' '),
 };
}

export function createTourAreas(stage){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.classList.add('tour-areas');svg.setAttribute('aria-hidden','true');svg.style.display='none';stage.prepend(svg);
 const paths=new Map();
 return {update(areas,point,width,height){
  svg.style.display=areas.length?'block':'none';svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const {group} of paths.values())group.style.display='none';
  for(const area of areas){
   let entry=paths.get(area.id);
   if(!entry){
    const group=document.createElementNS(ns,'g');group.dataset.areaId=area.id;group.dataset.kind=area.kind;
    const fill=document.createElementNS(ns,'path'),halo=document.createElementNS(ns,'path'),border=document.createElementNS(ns,'path');
    fill.classList.add('area-fill');fill.setAttribute('fill-rule','evenodd');halo.classList.add('area-halo');border.classList.add('area-border');
    group.append(fill,halo,border);svg.append(group);entry={group,fill,halo,border};paths.set(area.id,entry);
   }
   const d=areaPaths(area,point);entry.group.style.display='';entry.fill.setAttribute('d',d.fill);entry.halo.setAttribute('d',d.border);entry.border.setAttribute('d',d.border);
  }
 }};
}
