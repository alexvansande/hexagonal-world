// Build an explicit upload inventory. Does not upload, delete, or change Git.
import {readdir,stat,readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import surfaces from '../dist/maps/surfaces/manifest.mjs';
import merged from '../dist/maps/merged-manifest.mjs';
const output=resolve(process.argv[2]||'_asset-release');
const source=resolve('dist'),files=[],excluded={count:0,bytes:0};
const surfacePaths=new Set(Object.values(surfaces.entries).map(e=>'maps/surfaces/'+e.path+'/'));
const mergedPaths=new Set(Object.values(merged).map(e=>e.path+'/'));
const imagePattern=/\.(png|webp|jpe?g|svg)$/i;
function include(path){
 if(path.startsWith('maps/merged-experiment/'))return [...mergedPaths].some(prefix=>path.startsWith(prefix));
 if(path.startsWith('maps/surfaces/'))return [...surfacePaths].some(prefix=>path.startsWith(prefix));
 if(/^maps\/default-layers\/v1\/[^/]+\/[^/]+\/(light|detail)\//.test(path))return path.startsWith('maps/default-layers/v1/infinite/')&&!path.includes('/map/');
 return true;
}
async function visit(dir=''){
 for(const item of await readdir(resolve(source,dir),{withFileTypes:true})){
  const path=dir+item.name;
  if(path.startsWith('tests/'))continue;
  if(item.isDirectory()){await visit(path+'/');continue;}
  if(!imagePattern.test(path))continue;
  const bytes=(await stat(resolve(source,path))).size;
  if(!include(path)){excluded.count++;excluded.bytes+=bytes;continue;}
  const sha256=createHash('sha256').update(await readFile(resolve(source,path))).digest('hex');
  files.push({path,bytes,sha256});
 }
}
await visit();files.sort((a,b)=>a.path.localeCompare(b.path));
const release='maps-'+createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
const manifest={version:1,release,bytes:files.reduce((s,f)=>s+f.bytes,0),files};
await mkdir(output,{recursive:true});
await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(output,'files.txt'),files.map(f=>f.path).join('\n')+'\n');
await writeFile(resolve(output,'cors.json'),JSON.stringify([{AllowedOrigins:['https://hexagonal.earth','https://www.hexagonal.earth','http://localhost:4173','http://[::1]:4173'],AllowedMethods:['GET','HEAD'],AllowedHeaders:['Range'],ExposeHeaders:['ETag','Content-Length','Content-Range'],MaxAgeSeconds:86400}],null,2)+'\n');
console.log(JSON.stringify({release,files:files.length,bytes:manifest.bytes,GB:manifest.bytes/1e9,excluded,output},null,2));
