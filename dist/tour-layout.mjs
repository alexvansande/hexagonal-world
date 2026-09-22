import {matching,canvasWorld} from './geometry.mjs?v=tetra-area-2';
const rotate=([x,y],angle)=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
// Keep Asia/Pacific and Africa fixed. Bring the American pieces across the two
// Pacific edges, using the exact oriented spherical edge identities.
// With `atlantic`, the Europe–Africa piece also moves to South America's
// Atlantic edge, so the Pacific and the Atlantic both read as continuous seas.
// Only an unrotated placement is accepted: a translation keeps the piece's baked
// lighting valid, while a rotated Africa would need relit artwork like the Americas.
export function pacificTourNet(tiles,net,{atlantic=false}={}){
 const pacific=net.find(t=>t.id===1),placements=new Map();
 const attach=(anchor,edge)=>{
  const pair=matching(tiles,anchor.id,edge),worldEdge=(edge+anchor.r)%6,angle=(worldEdge+.5)*Math.PI/3;
  return {...net.find(t=>t.id===pair.id),r:(worldEdge+3-pair.e+12)%6,x:anchor.x+Math.sqrt(3)*Math.cos(angle),y:anchor.y+Math.sqrt(3)*Math.sin(angle)};
 };
 for(const edge of [4,5]){const placed=attach(pacific,edge);placements.set(placed.id,placed);}
 if(atlantic){
  const southAmerica=placements.get(2),africa=net.find(t=>t.id===3);
  for(let edge=0;edge<6;edge++){
   if(matching(tiles,2,edge).id!==3)continue;
   const placed=attach(southAmerica,edge);if(placed.r!==africa.r)continue;
   placements.set(3,placed);break;
  }
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
