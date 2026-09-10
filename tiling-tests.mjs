import assert from 'node:assert/strict';
import {makeGeometry,layouts,key} from './dist/geometry.mjs';
import {makeTiling,visibleTiles,directions,axial} from './dist/tiling.mjs';
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const tiles=makeGeometry(method),nets=layouts(tiles);
 for(const layout of [0,40,80]){
  const tiling=makeTiling(tiles,nets[layout]);let conflicts=0,opaque=0;
  for(const seed of nets[layout]){const t=tiling.at(...axial(seed.x,seed.y));assert.equal(t.id,seed.id);assert.equal(t.r,seed.r);}
  for(let q=0;q<tiling.size;q++)for(let r=0;r<tiling.size;r++){
   const a=tiling.at(q,r);assert.equal(a.opacity,1);if(a.opacity===1)opaque++;
   for(let e=0;e<6;e++){
    const [dq,dr]=directions[e],b=tiling.at(q+dq,r+dr),ea=(e-a.r+6)%6,eb=(e+3-b.r+12)%6;
    const same=key(tiles[a.id].ring[ea])===key(tiles[b.id].ring[(eb+1)%6])&&key(tiles[a.id].ring[(ea+1)%6])===key(tiles[b.id].ring[eb]);
    assert.equal(a.bad[e],!same,'red flags must correspond to actual spherical endpoint mismatches');
    assert.equal(a.bad[e],b.bad[(e+3)%6],'both sides must report the same conflict');if(a.bad[e])conflicts++;
   }
   assert.deepEqual(tiling.at(q+tiling.size*1000,r-tiling.size*1000),a);
  }
  assert(conflicts>0);assert(opaque>0);
  for(const center of [0,1000,-1000]){
   const view={left:center-4,right:center+4,bottom:center-3,top:center+3},visible=visibleTiles(tiling,view),keys=new Set(visible.map(t=>`${t.q},${t.s}`));assert.equal(keys.size,visible.length);assert(visible.length<150);
   for(let x=view.left;x<=view.right;x+=.3)for(let y=view.bottom;y<=view.top;y+=.3){
    assert(visible.some(t=>{const dx=Math.abs(x-t.x),dy=Math.abs(y-t.y);return dx<=1.000001&&dy<=Math.sqrt(3)/2+.000001&&Math.sqrt(3)*dx+dy<=Math.sqrt(3)+.000001;}),'viewport must contain no holes');
   }
  }
 }
 console.log(`${method}: stable infinite repetition, full viewport coverage, opacity and exact mismatch flags pass.`);
}
