import {matching,canvasWorld} from './geometry.mjs?v=tetra-area-2';
const rotate=([x,y],angle)=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
// Keep Asia/Pacific and Africa fixed. Bring the American pieces across the two
// Pacific edges, using the exact oriented spherical edge identities.
export function pacificTourNet(tiles,net){
 const pacific=net.find(t=>t.id===1),placements=new Map();
 for(const edge of [4,5]){
  const pair=matching(tiles,pacific.id,edge),worldEdge=(edge+pacific.r)%6,angle=(worldEdge+.5)*Math.PI/3;
  placements.set(pair.id,{...net.find(t=>t.id===pair.id),r:(worldEdge+3-pair.e+12)%6,x:pacific.x+Math.sqrt(3)*Math.cos(angle),y:pacific.y+Math.sqrt(3)*Math.sin(angle)});
 }
 return net.map(t=>placements.get(t.id)||{...t});
}
export function interpolateTourNet(from,to,progress){
 return from.map(a=>{const b=to.find(t=>t.id===a.id),turn=((b.r-a.r+9)%6)-3;
  return {...a,x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress,r:a.r+turn*progress};
 });
}
// Source and destination frames in the merged image's screen-space coordinates.
export function tourImagePieces(from,to,gridRotation,relit=null){
 const angle=gridRotation*Math.PI/180;
 return to.map(t=>{const meta=relit?.regions.includes(t.id)?relit:null,source=(meta?.net||from).find(a=>a.id===t.id);
  return {id:t.id,meta,source:rotate(canvasWorld([0,0],source),angle),target:rotate(canvasWorld([0,0],t),angle),angle:-(t.r-source.r)*Math.PI/3,sourceAngle:angle-source.r*Math.PI/3};
 });
}
