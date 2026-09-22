// Small additive image release; never rebuild/upload the global 5 GB atlas for
// story-only changes. No network activity and no changes to asset-release.json.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {tourPages} from '../dist/tour-pages.mjs';
import {historyPages} from '../dist/history-routes.mjs';
import layers from '../dist/maps/default-layers/manifest.mjs';
const output=resolve('_asset-release/tours'),paths=[...tourPages.map(t=>t.image.slice(1)),...historyPages.map(p=>p.image.slice(1))];
async function visit(dir){for(const entry of await readdir('dist/'+dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())await visit(path);else if(path.endsWith('.png'))paths.push(path);}}
// Lit per-piece sets for the Spaceship Earth dance (one per rotation class).
for(const [key,entry] of Object.entries(layers.entries))if(entry.lit)await visit('maps/default-layers/'+entry.path+'/lit');
const files=[];
for(const path of paths.sort()){
 const bytes=await readFile('dist/'+path);files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const release='maps-'+createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
const manifest={version:1,release,bytes:files.reduce((sum,f)=>sum+f.bytes,0),files};
await mkdir(output,{recursive:true});await writeFile(output+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({release,files:files.length,bytes:manifest.bytes,output},null,2));
