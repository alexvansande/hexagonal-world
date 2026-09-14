import assert from 'node:assert/strict';
import {makeGeometry,matching,world} from './dist/geometry.mjs';
import {puzzleCells,puzzleRegion,puzzleArtwork,neighbor,triangulate} from './dist/puzzle-grid.mjs';
import {area} from './dist/felv.mjs';
import {edgeKey} from './dist/fractal-grid.mjs';
for(const method of ['tetra','octa','rhombic','tetrakis'])for(const count of [28,196]){
 const tiles=makeGeometry(method,1.5),regions=tiles.map(t=>puzzleRegion(tiles,t.id,count));
 assert.equal(puzzleCells(count).length*4,count);
 for(const [id,region] of regions.entries()){
  assert.equal(region.polygons.length,count/4);
  assert.ok(Math.abs(region.polygons.reduce((s,p)=>s+area(p),0)-area(region.outline))<1e-8,'Pieces partition the silhouette');
  assert.ok(Math.abs(triangulate(region.outline).reduce((s,p)=>s+area(p),0)-area(region.outline))<1e-8,'Sockets stay empty');
  const art=puzzleArtwork(tiles,id,region);
  assert.ok(Math.abs(art.reduce((s,p)=>s+area(p.xy),0)-area(region.outline))<1e-8,'Every tab has artwork, without overlapping patches');
  for(const p of art)for(const w of p.weights){assert.ok(Math.abs(w.reduce((s,x)=>s+x,0)-1)<1e-7);assert.ok(w.every(x=>x>=-1e-7&&x<=1+1e-7),'Artwork uses actual source triangles');}
  for(let e=0;e<6;e++){
   const n=neighbor(tiles,id,e),other=regions[n.id],transformed=other.edges.filter(x=>x.boundary).map(x=>x.points.map(p=>world(p,n)));
   for(const edge of region.edges.filter(x=>x.boundary)){
    const partner=transformed.find(p=>edgeKey(p[0],p.at(-1))===edgeKey(edge.a,edge.b));
    if(!partner)continue;
    assert.ok(edge.points.every(p=>partner.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-7)),'Mating edge connectors coincide');
   }
   const a=region.edges.filter(x=>x.boundary&&transformed.some(q=>edgeKey(q[0],q.at(-1))===edgeKey(x.a,x.b)));
   assert.ok(a.length>0,'Every topological neighbor has matching boundary segments');
   assert.equal(n.id,matching(tiles,id,e).id);
  }
 }
 console.log(`${method}: ${count} pieces, paired connectors, concave silhouettes, and complete source artwork pass.`);
}
const {encodeMapState,decodeMapState}=await import('./dist/map-state.mjs');
const saved={state:{puzzleWidth:2.4},controls:{puzzlegrid:true,'puzzle-count':'196','puzzle-color':'#ff6600'},view:{scale:100,zoom:1,panX:0,panY:0},details:{}};
const roundtrip=decodeMapState(encodeMapState(saved,{state:{},controls:{},view:saved.view,details:{}}));
assert.equal(roundtrip.state.puzzleWidth,2.4);assert.deepEqual(roundtrip.controls,saved.controls);
console.log('Puzzle settings survive compact share links.');
