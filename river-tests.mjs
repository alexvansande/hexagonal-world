import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RiverFields,paintRiverMask,riverDischargeThresholds} from './dist/river-layers.mjs';
const distances=new Uint8Array([0,32,64,96,128,192,255]);
const alpha=width=>Array.from(paintRiverMask(distances,width)).filter((_,i)=>i%4===3);
assert.deepEqual(alpha(.5),[255,255,0,0,0,0,0]);
assert.deepEqual(alpha(1),[255,255,255,0,0,0,0]);
assert.deepEqual(alpha(3),[255,255,255,255,255,255,0]);
const jobs=[];
const loader=new RiverFields({load:(url,{signal})=>new Promise((resolve,reject)=>{
 const job={url,signal,resolve};jobs.push(job);
 signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')));
})});
const first=loader.get(2),same=loader.get(2);assert.equal(jobs.length,1);
jobs[0].resolve({width:7,height:1,distances});assert.equal(await first,await same);
await loader.get(2);assert.equal(jobs.length,1,'Width/color changes reuse the current field');
const obsolete=loader.get(3);const cancelled=assert.rejects(obsolete,{name:'AbortError'});
const current=loader.get(4);assert(jobs[1].signal.aborted);jobs[2].resolve({width:7,height:1,distances});
await cancelled;assert.equal((await current).level,4);assert.equal(loader.cached.level,4);
const unused=loader.get(5);const unusedCancelled=assert.rejects(unused,{name:'AbortError'});
assert.equal((await loader.get(4)).level,4);await unusedCancelled;
assert.equal(loader.pending,null);
let attempts=0;
const retry=new RiverFields({mobile:true,load:async url=>{
 assert(url.endsWith('/mobile/level-12.png'));if(attempts++===0)throw Error('offline');return {distances};
}});
await assert.rejects(retry.get(12));assert.equal((await retry.get(12)).level,12);
const manifest=JSON.parse(await readFile('dist/maps/hydrorivers/v1/manifest.json','utf8'));
assert.deepEqual(manifest.minimumDischargeM3s,riverDischargeThresholds);
assert.equal(manifest.records,8477883);
assert.equal(manifest.cumulativeRecords.at(-1),manifest.includedRecords);
assert(manifest.includedRecords>100000);
assert(manifest.cumulativeRecords.every((n,i,a)=>i===0||n>a[i-1]));
for(const device of ['desktop','mobile']){
 const files=manifest.files.filter(f=>f.path.includes('/'+device+'/'));
 assert.equal(files.length,12);
 for(const [i,file] of files.entries()){
  const png=await readFile('dist/'+file.path);assert.equal(png.readUInt32BE(16),file.width);assert.equal(png.readUInt32BE(20),file.height);
  assert.equal(png.length,file.bytes);assert(file.bytes<4_000_000,'Only a small raster downloads per selection');
  assert(i===0||file.pixelsAtWidth1>files[i-1].pixelsAtWidth1,'Every step adds visible river pixels');
 }
}
console.log('HydroRIVERS: all 12 progressive levels, filtered global network, width masks, bounded downloads, cancellation, cache and retry pass.');
