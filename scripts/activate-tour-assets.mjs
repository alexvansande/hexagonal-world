// Run only after the explicitly approved additive upload. Public verification
// precedes writing the production pointer; no website publication occurs here.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tourPages} from '../dist/tour-pages.mjs';
import {historyPages} from '../dist/history-routes.mjs';
import layers from '../dist/maps/default-layers/manifest.mjs';
const directory='_asset-release/tours',result=JSON.parse(await readFile(directory+'/upload-result.json','utf8'));
if(!result.verified)throw Error('Tour upload has not been verified.');
const bytes=await readFile(directory+'/manifest.json'),manifest=JSON.parse(bytes);
if(result.release!==manifest.release||result.verifiedImages!==manifest.files.length)throw Error('Upload and manifest do not match.');
const baseURL='https://assets.hexagonal.earth/'+manifest.release;
const remote=await fetch(baseURL+'/manifest.json');if(!remote.ok)throw Error('Public tour inventory unavailable.');
const sha=data=>createHash('sha256').update(data).digest('hex');
if(sha(Buffer.from(await remote.arrayBuffer()))!==sha(bytes))throw Error('Public inventory checksum mismatch.');
const required=[...tourPages.map(t=>t.image.slice(1)),...historyPages.map(p=>p.image.slice(1)),...Object.values(layers.entries).filter(e=>e.lit).flatMap(e=>Array.from({length:e.lit},(_,k)=>`maps/default-layers/${e.path}/lit/${k}/0/0/0-0.png`))];
for(const path of required){
 const entry=manifest.files.find(f=>f.path===path),r=await fetch(baseURL+'/'+path);if(!entry||!r.ok)throw Error('Public asset missing: '+path);
 const data=Buffer.from(await r.arrayBuffer());if(data.length!==entry.bytes||sha(data)!==entry.sha256)throw Error('Public image checksum mismatch: '+path);
}
const record={release:manifest.release,baseURL,manifestSHA256:sha(bytes),imageCount:manifest.files.length,imageBytes:manifest.bytes};
await writeFile('tour-asset-release.json',JSON.stringify(record,null,2)+'\n');
console.log('Verified tour and history previews and the lit Spaceship Earth sets; wrote tour-asset-release.json. Website not published.');
