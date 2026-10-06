// Dancing smaller hexagons on Spaceship Earth: the level-1 (7 per region) or
// level-2 (49 per region) cells of the shared Gosper hierarchy move one by one.
// A piece that leaves the view goes to the free cell nearest the centre of the
// screen where it is the true spherical neighbour of a piece already there, at
// the turn that join demands, so geography stays continuous across every join
// it makes. Pieces in view never move.
import {hex,world} from './geometry.mjs';
import {subgridLevels} from './subgrid.mjs';
import {cellPolygon} from './fractal-grid.mjs';
import {neighbor} from './puzzle-grid.mjs';
import {clip,area} from './felv.mjs';
const EPS=1e-6;
const local=(p,t)=>{const a=-t.r*Math.PI/3,x=p[0]-t.x,y=p[1]-t.y;return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];};
// A frame placed inside another: `inner` is given in the coordinates of `outer`.
export const compose=(outer,inner)=>{const [x,y]=world([inner.x,inner.y],outer);return {x,y,r:outer.r+inner.r};};
const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<EPS;
const cache=new WeakMap();
// Pieces in their parent region's frame. Each whole cell can bulge past the
// parent's straight edge, so its artwork comes from up to three regions: the
// parent and the correctly turned neighbours it overlaps (as puzzle pieces do).
export function smallPieces(tiles,level){
 let byLevel=cache.get(tiles);if(!byLevel){byLevel=new Map();cache.set(tiles,byLevel);}
 if(byLevel.has(level))return byLevel.get(level);
 const frames=id=>[{id,x:0,y:0,r:0},...hex.map((_,e)=>neighbor(tiles,id,e))];
 const pieces=[];
 for(const {id} of tiles)subgridLevels[level].forEach((cell,index)=>{
  const polygon=cellPolygon(cell),parts=[];
  for(const rel of frames(id)){
   const inner=polygon.map(p=>local(p,rel)),drawPatches=[];
   for(const patch of tiles[rel.id].patches){
    const clipped=clip(patch.xy.map((p,i)=>[...p,...[0,1,2].map(j=>i===j?1:0)]),inner);
    for(let i=1;i+1<clipped.length;i++){const tri=[clipped[0],clipped[i],clipped[i+1]];if(area(tri)>1e-12)drawPatches.push({xy:tri.map(p=>p.slice(0,2)),weights:tri.map(p=>p.slice(2)),v:patch.v});}
   }
   if(drawPatches.length)parts.push({id:rel.id,rel:{x:rel.x,y:rel.y,r:rel.r},polygon:inner,drawPatches});
  }
  pieces.push({key:pieces.length,id,index,center:cell.center,polygon,parts});
 });
 // Edge partners: across edge d of piece p lies edge d' of piece q, reversed,
 // once q's region is placed at the join that edge crosses (or p's own frame).
 // `rel` places q's region frame in p's region frame.
 for(const p of pieces){
  p.joins=p.polygon.map((a,d)=>{const b=p.polygon[(d+1)%6],found=[];
   for(const rel of frames(p.id))for(const q of pieces){if(q.id!==rel.id||q===p&&rel.r===0&&!rel.x&&!rel.y)continue;
    const poly=q.polygon.map(v=>world(v,rel));
    for(let e=0;e<6;e++)if(near(poly[e],b)&&near(poly[(e+1)%6],a))found.push({key:q.key,edge:e,rel:{x:rel.x,y:rel.y,r:rel.r}});
   }
   return found;
  });
 }
 byLevel.set(level,pieces);return pieces;
}
// One cell of the planar lattice, keyed by its centre.
export const cellKey=c=>`${Math.round(c[0]*1e4)},${Math.round(c[1]*1e4)}`;
export const pieceCentre=(piece,frame)=>world(piece.center,frame);
// Move every piece that left the view, nearest-centre cell first. `frames` maps
// piece key to its region frame {x,y,r}; `inView(centre)` says whether a cell
// centre counts as on screen; `centre` is where the eye rests. Returns the new
// frames of the pieces that moved.
export function smallFill(pieces,frames,inView,centre){
 const placed=new Map(),free=new Set(),moves=new Map();
 for(const p of pieces){const f=frames.get(p.key),c=pieceCentre(p,f);if(inView(c))placed.set(cellKey(c),p.key);else free.add(p.key);}
 if(!free.size||!placed.size)return moves;
 const candidates=[];
 const offer=key=>{const p=pieces[key],f=moves.get(key)||frames.get(key);
  for(const joins of p.joins)for(const j of joins){if(!free.has(j.key))continue;
   const frame=compose(f,j.rel),c=pieceCentre(pieces[j.key],frame);
   if(inView(c))candidates.push({key:j.key,frame,cell:cellKey(c),d:Math.hypot(c[0]-centre[0],c[1]-centre[1])});
  }
 };
 for(const key of placed.values())offer(key);
 while(candidates.length&&free.size){
  let best=-1;for(let i=0;i<candidates.length;i++){const c=candidates[i];if(!free.has(c.key)||placed.has(c.cell))continue;if(best<0||c.d<candidates[best].d)best=i;}
  if(best<0)break;
  const c=candidates[best];moves.set(c.key,c.frame);free.delete(c.key);placed.set(c.cell,c.key);offer(c.key);
 }
 return moves;
}
// One persistent object per piece part, placed in place (like the big pieces), so
// projections cached against them (history routes, markers) follow the dance.
export function smallParts(pieces){return pieces.flatMap(p=>p.parts.map(part=>({id:part.id,x:0,y:0,r:0,polygon:part.polygon,piece:p.key,part})));}
export function placeParts(parts,frames){for(const t of parts){const f=compose(frames.get(t.piece),t.part.rel);t.x=f.x;t.y=f.y;t.r=f.r;}return parts;}
// Drawable tiles: parts sharing a source region and a placement merge into one
// tile (one mesh, one texture lookup); `polygons` lists their outlines in that
// region's frame and `members` names the pieces, for cache keys.
export function smallTiles(parts){
 const groups=new Map();
 for(const t of parts){const r=((Math.round(t.r*1e6)/1e6)%6+6)%6,key=`${t.id}:${t.x.toFixed(5)},${t.y.toFixed(5)},${r.toFixed(4)}`;
  let g=groups.get(key);if(!g){g={id:t.id,x:t.x,y:t.y,r:t.r,opacity:1,bad:Array(6).fill(false),small:key,members:'',polygons:[],drawPatches:[]};groups.set(key,g);}
  g.polygons.push(t.polygon);g.drawPatches.push(...t.part.drawPatches);g.members+=t.piece+',';
 }
 return [...groups.values()];
}
