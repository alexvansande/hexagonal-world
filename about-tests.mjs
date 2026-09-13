import assert from 'node:assert/strict';
import {construction,sub} from './dist/about-geometry.mjs';
const c=construction(),distance=(a,b)=>Math.hypot(...sub(a,b));
assert.equal(c.faces.length,12);
for(const t of [0,.25,.5,.75,1]){
 const transforms=c.transforms(t);
 c.faces.forEach((f,i)=>{
  for(let a=0;a<4;a++)for(let b=0;b<a;b++)assert.ok(Math.abs(distance(transforms[i](f.v[a]),transforms[i](f.v[b]))-distance(f.v[a],f.v[b]))<1e-8,'Unfolding preserves each face');
  if(f.parent>=0)for(const p of f.v.filter(p=>c.faces[f.parent].v.some(q=>distance(p,q)<1e-8)))assert.ok(distance(transforms[i](p),transforms[f.parent](p))<1e-8,'Hinges stay joined');
 });
}
for(const f of c.faces){assert.ok(f.flat.every(p=>Math.abs(p[2])<1e-8),'Net lies in one plane');for(let i=0;i<4;i++)assert.ok(Math.abs(distance(f.adjusted[i],f.adjusted[(i+1)%4])-Math.sqrt(3))<1e-8,'Adjusted diamonds have regular hexagon edge lengths');}
console.log('About construction: 12 rigid faces, joined hinges throughout unfolding, planar net and regular adjusted diamonds pass.');

// The cut mesh covers the same surface before and after rearranging, without morphing geography.
const {constructionMesh}=await import('./dist/about-geometry.mjs');
const {area}=await import('./dist/felv.mjs');
const {world,norm}=await import('./dist/geometry.mjs?v=circular-2');
const {sphereAt}=await import('./dist/globe-drag.mjs?v=circular-2');
const {makeGeometry}=await import('./dist/geometry.mjs?v=circular-2');
const mesh=constructionMesh(c,4),tiles=makeGeometry('rhombic');
assert.equal(c.pieces.length,8);
assert.equal(c.pieces.filter(p=>p.moving).length,5);
assert.ok(distance(c.geography(c.polarFace.n),[0,0,1])<1e-8,'North pole is at a rhombus center');
let beforeArea=0,afterArea=0;
for(let i=0;i<mesh.samples.length;i+=3){
 const triangle=mesh.samples.slice(i,i+3);
 beforeArea+=area(triangle.map(s=>c.piecePoint(c.pieces[s.piece],s.xy,0)));
 afterArea+=area(triangle.map(s=>c.piecePoint(c.pieces[s.piece],s.xy,1)));
}
assert.ok(Math.abs(beforeArea-18*Math.sqrt(3))<1e-7,'All four hexagons are covered exactly');
assert.ok(Math.abs(afterArea-beforeArea)<1e-7,'Felv cuts preserve total map area');
for(const sample of [...mesh.samples,...mesh.edges,...mesh.cuts]){
 const f=c.faces[sample.f],p=c.pieces[sample.piece];
 const adjusted=f.adjusted[0].map((x,i)=>x+sample.a*(f.adjusted[1][i]-x)+sample.b*(f.adjusted[3][i]-x));
 assert.ok(distance(adjusted,c.piecePoint(p,sample.xy,0))<1e-8,'No jump at Adjust → Rearrange');
 const expected=world(sample.xy,p.destination),actual=c.piecePoint(p,sample.xy,1),offset=c.faces[0].xy[0];
 assert.ok(distance(actual,[(expected[0]-offset[0])*Math.sqrt(3),(expected[1]-offset[1])*Math.sqrt(3),0])<1e-8,'Final placement matches the actual Felv map');
 const sphere=sphereAt(expected,p.destination,tiles[p.destination.id]);
 assert.ok(sphere&&distance(norm(sample.earth),norm(c.geography(sphere)))<1e-8,'Continents stay attached to each cut');
}
for(const piece of c.pieces)for(const t of [.25,.5,.75]){
 const polygon=piece.destination.polygon;
 for(let i=0;i<polygon.length;i++)assert.ok(Math.abs(distance(c.piecePoint(piece,polygon[i],t),c.piecePoint(piece,polygon[(i+1)%polygon.length],t))-distance(polygon[i],polygon[(i+1)%polygon.length])*Math.sqrt(3))<1e-8,'Moving pieces stay rigid');
}
console.log('Felv widget: eight pieces, exact map placements, surface coverage, rigid motion, continuous geography and face-centered north pole pass.');

const {orientConstruction,rearrangementFrame}=await import('./dist/about-geometry.mjs');
const presentation=rearrangementFrame(c);
assert.ok(distance(orientConstruction([1,0,0]),[-.5,Math.sqrt(3)/2,0])<1e-8,'Planar stages rotate counterclockwise by 120 degrees');
for(const piece of c.pieces)for(const xy of piece.destination.polygon){
 const start=orientConstruction(c.piecePoint(piece,xy,0));
 for(let i=0;i<=100;i++){
  const p=orientConstruction(c.piecePoint(piece,xy,i/100));
  if(!piece.moving)assert.ok(distance(start,p)<1e-8,'Stationary continent pieces stay fixed in the presentation frame');
  for(let axis=0;axis<2;axis++)assert.ok(Math.abs(p[axis]-presentation.center[axis])<=presentation.extent/2+1e-8,'The fixed camera contains the full rearrangement');
 }
}
console.log('Planar orientation: 120 degrees, stationary pieces and fixed framing pass.');

// Verify the geographical meaning of the cuts, not just the polygons' area.
for(const [name,lon,lat,moves] of [['Africa',20,0,false],['India',78,23,false],['China',110,35,false],['North America',-100,40,true],['South America',-60,-20,true],['Antarctica',0,-88,true]]){
 const a=lon*Math.PI/180,b=lat*Math.PI/180,point=[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];
 const nearest=mesh.samples.reduce((a,b)=>distance(norm(a.earth),point)<distance(norm(b.earth),point)?a:b);
 assert.equal(c.pieces[nearest.piece].moving,moves,`${name} follows the sketched cut`);
}
// After the solid's symmetry relabeling, the final silhouette is the actual Felv layout,
// translated as a whole to leave the Africa/Asia pieces anchored.
let finalOffset;
for(const piece of c.pieces){
 const canonical=piece.destination.canonical;
 for(let i=0;i<canonical.polygon.length;i++){
  const expected=world(canonical.polygon[i],canonical).map(x=>x*Math.sqrt(3));
  const actual=orientConstruction(c.piecePoint(piece,piece.destination.polygon[i],1));
  const offset=sub(actual.slice(0,2),expected);
  finalOffset??=offset;
  assert.ok(distance(offset,finalOffset)<1e-8,'Final Felv silhouette retains its default orientation');
 }
}
console.log('Sketched Felv motion: Africa/Asia anchored, Americas and Antarctica moved, default final silhouette preserved.');
