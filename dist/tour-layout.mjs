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

// Endless band. Kept at their fixed rotations, the four Spaceship Earth pieces
// repeat by pure translation along one period P with every join exact (Bering
// and South Pacific to Asia, Central America, North Atlantic, Eurasia). Parallel
// bands stack by Q; that leaves two empty slots per six-hex cell which are filled
// with out-of-order copies (flagged `exact:false`, drawn but never joined to).
// No rotated pieces, so no artwork or lighting bake is ever needed.
const slotKey=(x,y)=>`${x.toFixed(2)},${y.toFixed(2)}`;
export function endlessLattice(tiles,net,{fillers=null}={}){
 const fixed=Object.fromEntries(net.map(t=>[t.id,t.r]));
 const placed=(anchor,edge)=>{const pair=matching(tiles,anchor.id,edge),w=(edge+anchor.r)%6,angle=(w+.5)*Math.PI/3;return {id:pair.id,r:(w+3-pair.e+12)%6,x:anchor.x+Math.sqrt(3)*Math.cos(angle),y:anchor.y+Math.sqrt(3)*Math.sin(angle)};};
 // Translation closure from the base net; the first displaced copy of a base tile gives the period.
 const seen=new Map(net.map(t=>[slotKey(t.x,t.y),{id:t.id,r:t.r,x:t.x,y:t.y}])),queue=[...seen.values()];let period=null;
 while(queue.length&&!period){const t=queue.shift();
  for(let e=0;e<6;e++){const p=placed(t,e);if(p.r!==fixed[p.id])continue;const key=slotKey(p.x,p.y);if(seen.has(key))continue;seen.set(key,p);queue.push(p);
   const base=net.find(b=>b.id===p.id),d=[p.x-base.x,p.y-base.y];if(Math.hypot(...d)>1e-9&&(d[0]>1e-9||(Math.abs(d[0])<1e-9&&d[1]>0))){period=d;break;}}}
 if(!period)return null;
 const P=period,occupied=(x,y)=>slotKey(x,y);
 // Stacking vector: shortest lattice translation that never lands a different tile on a band slot.
 let Q=null;
 for(let radius=1;radius<=8&&!Q;radius++)for(let i=-radius;i<=radius;i++)for(let j=-radius*2;j<=radius*2;j++){
  if((i+j)%2||(Math.abs(i)!==radius&&Math.abs(j)!==radius*2&&false))continue;const c=[1.5*i,Math.sqrt(3)/2*j];if(Math.hypot(...c)<1||Math.abs(c[0]*P[1]-c[1]*P[0])<1e-6)continue;
  const slots=new Map();let conflict=false;
  for(let k=-3;k<=3&&!conflict;k++)for(let m=-3;m<=3&&!conflict;m++)for(const t of net){const key=occupied(t.x+k*P[0]+m*c[0],t.y+k*P[1]+m*c[1]);const other=slots.get(key);if(other!==undefined&&other!==t.id)conflict=true;slots.set(key,t.id);}
  if(!conflict&&(!Q||Math.hypot(...c)<Math.hypot(...Q)-1e-9||(Math.abs(Math.hypot(...c)-Math.hypot(...Q))<1e-9&&c[1]>Q[1])))Q=c;
 }
 if(!Q)return null;
 // Empty slots of the fundamental cell, expressed relative to the base net.
 const filled=new Set();for(let k=-2;k<=2;k++)for(let m=-2;m<=2;m++)for(const t of net)filled.add(occupied(t.x+k*P[0]+m*Q[0],t.y+k*P[1]+m*Q[1]));
 const inverse=([x,y])=>{const det=P[0]*Q[1]-P[1]*Q[0];return [(x*Q[1]-y*Q[0])/det,(P[0]*y-P[1]*x)/det];};
 const empty=[];
 for(let i=-8;i<=8;i++)for(let j=-12;j<=12;j++){if((i+j)%2)continue;const x=1.5*i,y=Math.sqrt(3)/2*j;if(filled.has(occupied(x,y)))continue;const [k,m]=inverse([x,y]);if(k>=-1e-9&&k<1-1e-9&&m>=-1e-9&&m<1-1e-9)empty.push([x,y]);}
 const ids=fillers||empty.map((_,i)=>net[i%net.length].id);
 const filler=empty.map(([x,y],i)=>{const id=ids[i%ids.length];return Object.freeze({id,r:fixed[id],x,y,exact:false});});
 return Object.freeze({period:Object.freeze(P),stack:Object.freeze(Q),exact:Object.freeze(net.map(t=>Object.freeze({id:t.id,r:t.r,x:t.x,y:t.y,exact:true}))),fillers:Object.freeze(filler),inverse});
}
export const latticeOffset=(lattice,k,m)=>[k*lattice.period[0]+m*lattice.stack[0],k*lattice.period[1]+m*lattice.stack[1]];
// Copies whose cells touch a world-space rectangle (unrotated canvas units), with one cell of margin.
export function endlessCopies(lattice,corners,margin=1){
 const km=corners.map(lattice.inverse);
 const k0=Math.floor(Math.min(...km.map(v=>v[0])))-margin,k1=Math.ceil(Math.max(...km.map(v=>v[0])))+margin;
 const m0=Math.floor(Math.min(...km.map(v=>v[1])))-margin,m1=Math.ceil(Math.max(...km.map(v=>v[1])))+margin;
 const copies=[];
 for(let k=k0;k<=k1;k++)for(let m=m0;m<=m1;m++){const [dx,dy]=latticeOffset(lattice,k,m);for(const t of [...lattice.exact,...lattice.fillers])copies.push({id:t.id,r:t.r,x:t.x+dx,y:t.y+dy,k,m,exact:t.exact,base:t});}
 return copies;
}
// Choose, for each anchor of one strand, the exact copy that keeps the strand
// continuous: same copy while the tile is unchanged, nearest neighbouring copy
// when it changes, and the copy nearest `centre` for the first anchor. `basis`
// gives an anchor's position in screen-world units and `P`,`Q` the lattice in the
// same frame. Offsets are written in place so cached projections stay reusable.
export function unwrapStrand(anchors,basis,P,Q,centre){
 const det=P[0]*Q[1]-P[1]*Q[0];
 const coords=([x,y])=>[(x*Q[1]-y*Q[0])/det,(P[0]*y-P[1]*x)/det];
 const shift=(k,m)=>[k*P[0]+m*Q[0],k*P[1]+m*Q[1]];
 let k=0,m=0,previous=null,tile=null;
 anchors.forEach((anchor,i)=>{
  const b=basis(anchor);
  if(!i){const [ck,cm]=coords([centre[0]-b[0],centre[1]-b[1]]);k=Math.round(ck);m=Math.round(cm);}
  else if(anchor.tile!==tile){let best=Infinity,bk=k,bm=m;for(let dk=-1;dk<=1;dk++)for(let dm=-1;dm<=1;dm++){const s=shift(k+dk,m+dm),d=Math.hypot(b[0]+s[0]-previous[0],b[1]+s[1]-previous[1]);if(d<best){best=d;bk=k+dk;bm=m+dm;}}k=bk;m=bm;}
  const s=shift(k,m);anchor.offset=s;previous=[b[0]+s[0],b[1]+s[1]];tile=anchor.tile;
 });
 return anchors;
}
