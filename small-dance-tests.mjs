import assert from 'node:assert/strict';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {smallPieces,smallFill,smallTiles,smallParts,placeParts,compose,pieceCentre,cellKey} from './dist/small-dance.mjs';
import {area} from './dist/felv.mjs';
const tiles=makeGeometry('rhombic',1.5),net=makeArrangement(tiles,'dymaxion',layouts(tiles)).net;
const near=(a,b,e=1e-6)=>Math.hypot(a[0]-b[0],a[1]-b[1])<e;
for(const level of [1,2]){
 const pieces=smallPieces(tiles,level),count=4*7**level;
 assert.equal(pieces.length,count,`level ${level} has ${count} pieces`);
 for(const p of pieces){
  // Whole cells: the artwork of all parts covers exactly the regular hexagon.
  const hexArea=area(p.polygon),artwork=p.parts.reduce((s,part)=>s+part.drawPatches.reduce((t,q)=>t+area(q.xy),0),0);
  assert(Math.abs(artwork-hexArea)<1e-9*Math.max(1,hexArea)+1e-12,`piece ${p.key} artwork covers its cell`);
  for(let d=0;d<6;d++){
   assert.equal(p.joins[d].length,1,`level ${level} piece ${p.key} edge ${d} has exactly one partner`);
   const j=p.joins[d][0],q=pieces[j.key],back=q.joins[j.edge][0];
   assert.equal(back.key,p.key,'joins are symmetric');assert.equal(back.edge,d,'joins pair the same two edges');
   // Placing q at the join, then p at q's join back, returns p to its own frame.
   const again=compose(compose({x:0,y:0,r:0},j.rel),back.rel);
   assert(near([again.x,again.y],[0,0])&&Math.abs(((again.r%6)+6)%6)<1e-9||Math.abs(((again.r%6)+6)%6-6)<1e-9,'round trip is the identity');
  }
 }
 // The base net: every two pieces that touch along a full edge are partners.
 const base=new Map(pieces.map(p=>[p.key,net.find(t=>t.id===p.id)]));
 let touching=0;
 for(const p of pieces)for(let d=0;d<6;d++){
  const a=world(p.polygon[d],base.get(p.key)),b=world(p.polygon[(d+1)%6],base.get(p.key));
  for(const q of pieces){if(q===p)continue;const poly=q.polygon.map(v=>world(v,base.get(q.key)));
   for(let e=0;e<6;e++)if(near(poly[e],b)&&near(poly[(e+1)%6],a)){touching++;assert.equal(p.joins[d][0].key,q.key,'base net contacts are true joins');}}
 }
 assert(touching>count*3,'the base net is joined');
 // Fill: with half the map off screen, moved pieces land in free on-screen cells,
 // each next to the piece it joins, and pieces in view stay.
 const frames=new Map(pieces.map(p=>[p.key,{...base.get(p.key)}]));
 const inView=c=>c[0]<0.5,centre=[-0.5,0];
 const moves=smallFill(pieces,frames,inView,centre);
 assert(moves.size>0,'off-screen pieces move');
 const after=new Map([...frames,...moves]),cells=new Set();
 for(const p of pieces){const c=pieceCentre(p,after.get(p.key));if(!inView(c))continue;const k=cellKey(c);assert(!cells.has(k),'no two pieces share a cell');cells.add(k);}
 for(const [key,frame] of moves){
  assert(!inView(pieceCentre(pieces[key],frames.get(key))),'only off-screen pieces move');
  assert(inView(pieceCentre(pieces[key],frame)),'moved pieces land on screen');
  const ok=pieces[key].joins.some(([j])=>{const f=after.get(j.key),c=pieceCentre(pieces[j.key],f),expect=compose(frame,j.rel);return inView(c)&&near(pieceCentre(pieces[j.key],expect),c)&&Math.abs((((f.r-expect.r)%6)+6)%6%6)<1e-9;});
  assert(ok,`moved piece ${key} touches a placed piece along a true join`);
 }
 const parts=placeParts(smallParts(pieces),after),drawn=smallTiles(parts);
 assert(drawn.length<parts.length,'parts sharing a placement merge');
 assert.equal(drawn.reduce((s,t)=>s+t.polygons.length,0),parts.length);
 // Parts are placed in place: the same objects follow a later move.
 const first=parts[0],moved=new Map(after);moved.set(first.piece,{x:10,y:0,r:0});placeParts(parts,moved);
 assert(Math.abs(first.x-10-first.part.rel.x)<1e-9||first.part.rel.r!==0,'parts follow their piece');
}
console.log('small dance tests passed');
