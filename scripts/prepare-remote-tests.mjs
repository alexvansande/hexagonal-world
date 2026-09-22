import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {styleOptions} from '../dist/map-options.mjs';
import {shareCombinations} from '../dist/share-routes.mjs';
import {aboutShapes} from '../dist/about-route.mjs';
import {tourPages} from '../dist/tour-pages.mjs';
import {historyPages} from '../dist/history-routes.mjs';
const tourRelease=JSON.parse(await readFile('tour-asset-release.json','utf8').catch(()=>{throw Error('Tour image upload is awaiting approval; activate the verified tour release before publishing.');}));
const release=JSON.parse(await readFile('asset-release.json','utf8'));
const response=await fetch(release.baseURL+'/manifest.json');if(!response.ok)throw Error('Remote asset inventory unavailable');
const data=Buffer.from(await response.arrayBuffer());
if(createHash('sha256').update(data).digest('hex')!==release.manifestSHA256)throw Error('Remote inventory checksum mismatch');
const manifest=JSON.parse(data),files=new Map(manifest.files.map(f=>[f.path,f]));
if(manifest.release!==release.release)throw Error('Unexpected release');
await mkdir('_asset-release',{recursive:true});await writeFile('_asset-release/manifest.json',data);
const height=JSON.parse(await readFile('dist/maps/height/manifest.json'));
const rivers=JSON.parse(await readFile('dist/maps/hydrorivers/v2/manifest.json'));
const needed=new Set([...styleOptions.map(s=>s.thumbnail),...shareCombinations.map(p=>p.image.replace(/^\//,'')),...aboutShapes.map(([,slug])=>'social/about-'+slug+'.jpg'),...height.tiles.map(p=>'maps/height/'+p),...rivers.files.map(f=>f.path)]);
const queue=[...needed];
await Promise.all(Array.from({length:8},async()=>{
 while(queue.length){const path=queue.shift(),entry=files.get(path);if(!entry)throw Error('Required test asset absent: '+path);
  const r=await fetch(release.baseURL+'/'+path);if(!r.ok)throw Error('Asset unavailable: '+path);
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Asset checksum mismatch: '+path);
  await mkdir(dirname('dist/'+path),{recursive:true});await writeFile('dist/'+path,bytes);
 }
}));
console.log('Verified remote inventory and '+needed.size+' binary inputs for regression tests.');
const tourResponse=await fetch(tourRelease.baseURL+'/manifest.json');if(!tourResponse.ok)throw Error('Tour image inventory unavailable');
const tourBytes=Buffer.from(await tourResponse.arrayBuffer());
if(createHash('sha256').update(tourBytes).digest('hex')!==tourRelease.manifestSHA256)throw Error('Tour inventory checksum mismatch');
const tourManifest=JSON.parse(tourBytes);if(tourManifest.release!==tourRelease.release)throw Error('Unexpected tour release');
await mkdir('_asset-release/tours',{recursive:true});await writeFile('_asset-release/tours/manifest.json',tourBytes);
for(const tour of [...tourPages,...historyPages]){
 const path=tour.image.slice(1),entry=tourManifest.files.find(f=>f.path===path),r=await fetch(tourRelease.baseURL+'/'+path);
 if(!entry||!r.ok)throw Error('Required tour preview absent: '+path);
 const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Tour preview checksum mismatch: '+path);
 await mkdir(dirname('dist/'+path),{recursive:true});await writeFile('dist/'+path,bytes);
}
console.log(`Verified tour image inventory and ${tourPages.length+historyPages.length} preview JPEGs.`);
