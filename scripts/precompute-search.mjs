import {readFileSync,writeFileSync} from 'node:fs';
import {isMainThread,parentPort,workerData,Worker} from 'node:worker_threads';
import {optimize} from '../dist/optimizer.mjs';
import {clearanceField,clearanceMask} from '../dist/clearance.mjs';
import {makeGeometry,layouts} from '../dist/geometry.mjs';
import {makeArrangement} from '../dist/arrangements.mjs';
import {searchPresets as previous} from '../dist/search-presets.mjs';
import {layoutOptions} from '../dist/map-options.mjs';
// Generate the source mask from continents.png (grayscale <128 = land).
// The optional first argument is the raw 4320x2160 byte mask path.
const methods=['tetra','octa','rhombic','tetrakis'];
const names=['infinite','flower','dymaxion','bighex','felv'];
if(isMainThread){
 const maskPath=process.argv[2]||'/tmp/hex-land-mask.bin';
 const jobs=methods.flatMap(method=>names.map(name=>({method,name,maskPath}))),presets=Object.fromEntries(methods.map(m=>[m,{}]));
 const run=async()=>{while(jobs.length){const job=jobs.shift();await new Promise((resolve,reject)=>{
  const worker=new Worker(new URL(import.meta.url),{workerData:job});let received=false;
  worker.on('message',preset=>{received=true;presets[job.method][job.name]=preset;console.log(`${job.method}/${job.name}: 10 validated presets (${preset.objective})`);});
  worker.on('error',reject);worker.on('exit',code=>code||!received?reject(Error(`Worker failed: ${job.method}/${job.name} (${code})`)):resolve());
 });}};
 await Promise.all(Array.from({length:4},run));
 const ordered=Object.fromEntries(methods.map(m=>[m,Object.fromEntries(names.map(n=>[n,presets[m][n]]))]));
 writeFileSync('dist/search-presets.mjs','// Deterministic search of continents.png: 1,500 initial rotations per distance, then dense validation on the same objective.\nexport const searchPresets = '+JSON.stringify(ordered,null,2)+';\n');
}else{
 const {method,name,maskPath}=workerData,mask=new Uint8Array(readFileSync(maskPath)),width=4320,height=2160;
 if(mask.length!==width*height)throw Error('Expected a 4320 × 2160 byte land mask');
 const field=clearanceField(mask,width,height),config={method,height:1.5,bias:1,blend:0},tiles=makeGeometry(method,1.5);
 const arrangement=makeArrangement(tiles,name,layouts(tiles)),results=[];
 const selected=layoutOptions.find(o=>o.arrangement===name&&o.state.method===method);
 for(let distance=0;distance<=9;distance++){
  const metric=distance===0?{mask,width,height}:{mask:clearanceMask(field.distance,distance),width:field.width,height:field.height};
  const start=previous[method]?.[name]?.results[distance]?.angles|| (selected?Object.fromEntries(['lon','lat','roll'].map(k=>[k,selected.state[k]])):{lon:0,lat:0,roll:0});
  const result=optimize({config,arrangement,start,...metric,budget:1500,seed:17931});
  if(result.after>result.before)throw Error(`${method}/${name}: score regression`);
  results.push({distance,...result});
 }
 parentPort.postMessage({config,objective:arrangement.tiling?'all-hex-edges':'outer-and-red-seams',results});
}
