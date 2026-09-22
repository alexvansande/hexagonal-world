// Stage the website after a separately verified R2 upload. No publication.
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {buildSharePages} from './build-share-pages.mjs';
const base=process.env.MAP_ASSET_BASE_URL;
if(!base||!/^https:\/\/[^/]+\/maps-[a-f0-9]{16}$/.test(base))throw Error('Set MAP_ASSET_BASE_URL to the verified HTTPS asset domain and release prefix.');
const tourRelease=JSON.parse(await readFile('tour-asset-release.json','utf8').catch(()=>{throw Error('Tour images await upload approval. After the approved upload, run scripts/activate-tour-assets.mjs before staging the website.');}));
if(!/^https:\/\/assets\.hexagonal\.earth\/maps-[a-f0-9]{16}$/.test(tourRelease.baseURL)||!/^[a-f0-9]{64}$/.test(tourRelease.manifestSHA256))throw Error('Invalid tour image release.');
const overrides=['social/tour-','social/history-','maps/default-layers/v1/dymaxion/lifezones/lit/'].map(prefix=>({prefix,baseURL:tourRelease.baseURL}));
const output=resolve(process.argv[2]||'_site');
// Refuse to overlay an older staging tree that might still contain images.
try{await mkdir(output);}catch(e){if(e.code==='EEXIST')throw Error('Use a new empty output directory.');throw e;}
async function copy(dir=''){
 for(const item of await readdir(resolve('dist',dir),{withFileTypes:true})){
  const path=dir+item.name;
  if(path==='tests'||path.startsWith('maps/merged-experiment')||path.startsWith('maps/default-layers/v1')||/\.(png|webp|jpe?g|svg)$/i.test(path))continue;
  const target=resolve(output,path);
  if(item.isDirectory()){await mkdir(target,{recursive:true});await copy(path+'/');}
  else{await mkdir(dirname(target),{recursive:true});await copyFile(resolve('dist',path),target);}
 }
}
await copy();await copyFile('LICENSE',resolve(output,'LICENSE'));await buildSharePages(output);
await writeFile(resolve(output,'asset-config.mjs'),`export const assetBaseURL=${JSON.stringify(base)};\nexport const assetOverrides=${JSON.stringify(overrides)};\n`);
async function rewrite(dir=output){
 for(const item of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,item.name);if(item.isDirectory()){await rewrite(path);continue;}
  if(item.name.endsWith('.html')){
   let html=await readFile(path,'utf8');
   html=html.replace('<head>','<head>\n<link rel="preconnect" href="'+new URL(base).origin+'" crossorigin>');
   html=html.replace(/((?:href|src|content)=")((?:https?:\/\/hexagonal\.earth\/)?[^"<>]*\.(?:png|webp|jpe?g|svg)(?:\?[^"<>]*)?)(")/g,(all,prefix,value,end)=>{
    if(/^[a-z]+:/i.test(value)&&!/^https?:\/\/hexagonal\.earth\//.test(value))return all;
    const key=value.replace(/^https?:\/\/hexagonal\.earth\//,'').replace(/^\//,''),host=overrides.find(entry=>key.startsWith(entry.prefix))?.baseURL||base;
    return prefix+host+'/'+key+end;
   });await writeFile(path,html);
  }
 }
}
await rewrite();
const webmanifest=JSON.parse(await readFile(resolve(output,'site.webmanifest'),'utf8'));
for(const icon of webmanifest.icons)icon.src=base+'/'+icon.src;
await writeFile(resolve(output,'site.webmanifest'),JSON.stringify(webmanifest,null,2)+'\n');
console.log('Prepared image-free website at '+output+'; not published.');
