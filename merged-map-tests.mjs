import assert from 'node:assert/strict';
import {existsSync} from './test-asset-index.mjs';
import defaults from './dist/maps/default-layers/manifest.mjs';
import {mergedEntry,mergedCompatible,mergedPlan} from './dist/merged-maps.mjs';
import {assetURL} from './dist/asset-url.mjs';
let count=0;
for(const entry of Object.values(defaults.entries)){
 const meta=mergedEntry(entry);if(!meta)continue;count++;
 assert(!meta.repeat,'Do not adopt the duplicated infinite period');
 assert(mergedCompatible(entry,entry.signature.state,meta.background));
 assert(!mergedCompatible(entry,{...entry.signature.state,lightOpacity:.123},meta.background));
 assert(!mergedCompatible(entry,entry.signature.state,'#123456'));
 for(const [z,level] of Object.entries(meta.levels))for(const tile of level.tiles)assert(existsSync(`dist/${meta.path}/${z}/${tile}.png`));
 for(const unit of [20,200,1000,3000]){
  const plan=mergedPlan(meta,{width:2560,height:1440,unit,dpr:2,panX:0,panY:0});
  assert(new Set([...plan.tiles,...plan.coarse].map(t=>t.key)).size<=120);
  assert(plan.tiles.every(t=>t.rect.every(Number.isFinite)));
 }
}
assert.equal(count,42);
assert.equal(assetURL('maps/test.png','https://assets.example/maps-abc'),'https://assets.example/maps-abc/maps/test.png');
assert.equal(assetURL('maps/test.png',''),'maps/test.png');
assert.equal(assetURL('data:image/png;base64,a','https://assets.example'),'data:image/png;base64,a');
console.log('42 finite merged maps: complete pyramids, customization fallback, bounded visible tiles, asset URLs pass.');
