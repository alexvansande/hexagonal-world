import assert from 'node:assert/strict';
import {otherConstruction,projectionChoices} from './dist/about-projections.mjs';
import {sub} from './dist/about-geometry.mjs';
import {sphereArea} from './dist/geometry.mjs';
const distance=(a,b)=>Math.hypot(...sub(a,b));
assert.equal(projectionChoices.length,6);
for(const [method] of projectionChoices){
 if(method==='rhombic')continue;
 const m=otherConstruction(method),last=m.names.length-1;
 assert.ok(!m.names.includes('Rearrange'));
 for(const t of [0,.5,1,1.5,2,2.5,last].filter(t=>t<=last)){
  const frame=m.frame(t);assert.ok(Number.isFinite(frame.extent)&&frame.extent>0);
  for(const sample of m.mesh.samples)assert.ok(frame.point(sample).every(Number.isFinite),`${method}: finite surface at ${t}`);
 }
 let area=0;for(let i=0;i<m.mesh.samples.length;i+=3)area+=sphereArea(...m.mesh.samples.slice(i,i+3).map(s=>s.earth));
 assert.ok(Math.abs(area-4*Math.PI)<1e-6,`${method}: no missing globe area (${area})`);
 const final=m.frame(last);assert.ok(m.mesh.samples.every(s=>Math.abs(final.point(s)[2])<1e-7));
 if(m.faces){
  const unfolded=m.frame(2);assert.ok(m.mesh.samples.every(s=>Math.abs(unfolded.point(s)[2])<1e-7),'Unfolded faces are planar');
  for(const t of [0,.4,.8,1]){const tr=m.transforms(t);m.faces.forEach((f,i)=>{
   for(let j=0;j<3;j++)assert.ok(Math.abs(distance(tr[i](f.v[j]),tr[i](f.v[(j+1)%3]))-distance(f.v[j],f.v[(j+1)%3]))<1e-7,'Rigid face motion');
   if(f.parent>=0)for(const p of f.v.filter(p=>m.faces[f.parent].v.some(q=>distance(p,q)<1e-7)))assert.ok(distance(tr[i](p),tr[f.parent](p))<1e-7,'Shared hinge retained');
  });}
 }
 console.log(`${method}: stage geometry, full globe coverage, planar endpoint and hinge checks pass.`);
}

const {construction,rearrangementFrame,orientConstruction}=await import('./dist/about-geometry.mjs');
const {makeGeometry,norm}=await import('./dist/geometry.mjs');
const rhombi=construction(),tetrakis=otherConstruction('tetrakis'),aligned=tetrakis.frame(3),expectedFrame=rearrangementFrame(rhombi),rhombicTiles=makeGeometry('rhombic');
assert.ok(distance(aligned.center,expectedFrame.center)<1e-8);
assert.ok(Math.abs(aligned.extent-expectedFrame.extent)<1e-8,'Matching camera scale at Adjust');
let maxAngle=0;
for(const s of tetrakis.mesh.samples){
 const face=tetrakis.faces[s.f],xy=[0,1,2].map(i=>s.w.reduce((sum,w,j)=>sum+w*face.xy[j][i],0));
 const expected=orientConstruction(sub(xy,rhombi.faces[0].xy[0]).map(x=>x*Math.sqrt(3)));
 assert.ok(distance(aligned.point(s),expected)<1e-8,'Identical adjusted hexagon placement');
 const patch=rhombicTiles[face.tile].patches.find(p=>p.v.every((v,i)=>distance(norm(v),norm(face.v[i]))<1e-8));
 assert.ok(patch);
 const p=[0,1,2].map(i=>s.w.reduce((sum,w,j)=>sum+w*patch.v[j][i],0)),a=norm(s.earth),b=norm(rhombi.geography(p));
 maxAngle=Math.max(maxAngle,Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,v,i)=>sum+v*b[i],0))))*180/Math.PI);
}
assert.ok(maxAngle<9,'Only the actual solid-induced projection distortion differs');
console.log(`Tetrakis/rhombic comparison: identical layout and camera; maximum geographic difference ${maxAngle.toFixed(2)} degrees.`);

const directTetra=otherConstruction('tetra');
assert.deepEqual(directTetra.names,['Sphere','Unfold','Adjust']);
assert.equal(directTetra.mesh.markers.length,12,'One midpoint per edge per adjoining face');
assert.equal(new Set(directTetra.mesh.markers.map(s=>norm(s.p).map(x=>x.toFixed(6)).join(','))).size,6,'Six shared spherical edge midpoints');
for(const s of directTetra.mesh.markers){
 const halfway=directTetra.frame(.5).point(s),start=directTetra.frame(0).point(s),end=directTetra.frame(1).point(s);
 assert.ok(distance(halfway,start.map((x,i)=>(x+end[i])/2))<1e-8,'Midpoint dots follow the direct transformation');
}
for(const method of ['octa','tetrakis']){
 const m=otherConstruction(method),fr=m.frame(2);
 assert.deepEqual(m.names,['Sphere','Project','Unfold']);
 for(const s of m.mesh.samples){
  const f=m.faces[s.f],expected=f.adjusted[0].map((_,i)=>s.w.reduce((sum,w,j)=>sum+w*f.adjusted[j][i],0));
  assert.ok(distance(fr.point(s),method==='tetrakis'?orientConstruction(expected):expected)<1e-7,'Rigid unfolding already produces regular hexagons');
 }
 if(method==='tetrakis')for(const f of m.faces)for(let i=0;i<3;i++)assert.ok(Math.abs(distance(f.v[i],f.v[(i+1)%3])-Math.sqrt(3))<1e-8,'Tetrakis faces are equilateral');
}
console.log('Direct unfolding: tetrahedral midpoint markers and unstretched octahedral/tetrakis hexagons pass.');

// The intermediate boundary must bow away from its endpoint chord, and the
// last stage must still reproduce the map's exact hexagon coordinates.
const petalFrame=directTetra.frame(1),hexFrame=directTetra.frame(2);
for(const f of directTetra.faces){
 const all=directTetra.mesh.samples.filter(s=>directTetra.faces[s.f]===f);
 for(const s of all){
  assert.ok(Math.abs(petalFrame.point(s)[2])<1e-10);
  const expected=f.adjusted[0].map((_,i)=>s.w.reduce((sum,w,j)=>sum+w*f.adjusted[j][i],0));
  assert.ok(distance(hexFrame.point(s),expected)<1e-9);
 }
 const rim=all.filter(s=>s.w[0]===0),a=rim.find(s=>s.w[1]===1),b=rim.find(s=>s.w[2]===1),mid=rim.find(s=>s.w[1]===.5);
 const fr=petalFrame,chord=fr.point(a).map((x,i)=>(x+fr.point(b)[i])/2);
 assert.ok(distance(fr.point(mid),chord)>.015,'Petal edges remain curved');
}
console.log('Tetrahedron petals: planar curved boundaries and unchanged final hexagons pass.');
