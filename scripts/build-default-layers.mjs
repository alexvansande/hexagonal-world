// Offline only. Each base PNG includes the original source, rivers, treatment
// and distortion; the lighting PNGs are snapshots of the original renderer.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,stat,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {layoutOptions,styleOptions} from '../dist/map-options.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=fileURLToPath(new URL('../dist/maps/default-layers/v1/',import.meta.url));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800}});
page.on('pageerror',e=>console.error(e.message));
const entries={};try{
 await page.goto(`${process.env.SURFACE_URL||'http://localhost:4173'}/?bake-layers=1`);
 await page.waitForFunction(()=>window.prepareDefaultLayers&&document.querySelector('#map-loading').textContent==='');
 await page.waitForTimeout(1000);
 for(let l=0;l<layoutOptions.length;l++)for(let s=0;s<styleOptions.length;s++){
  const key=`${layoutOptions[l].arrangement}/${styleOptions[s].id}`;
  if(process.env.LAYER_FILTER&&!key.includes(process.env.LAYER_FILTER))continue;
  const out=root+key,marker=out+'/entry.json';
  let previous;try{previous=JSON.parse(await readFile(marker));if(!process.env.REBAKE_BASE){entries[key]=previous;console.log('Reuse',key);continue;}}catch{}
  console.log('Prepare',key);const meta=await page.evaluate(async a=>window.prepareDefaultLayers(...a),[l,s]);
  const maxLevel=['marble','terrain'].includes(styleOptions[s].source)?3:4;
  await mkdir(out,{recursive:true});
  const bake=async(data,folder,level,kind)=>{const png=`/tmp/hex-default-${process.pid}.png`;await writeFile(png,Buffer.from(data,'base64'));execFileSync(process.env.SURFACE_PYTHON||'python3',[fileURLToPath(new URL('./tile-default-layers.py',import.meta.url)),png,folder,String(level),kind]);await unlink(png);};
  for(let r=0;r<meta.regions;r++){
   try{await stat(`${out}/base/${r}/complete.json`);if(!process.env.REBAKE_BASE)continue;}catch{}
   console.log('Base',key,r);const data=await page.evaluate(a=>window.bakeDefaultRegion(...a),[r,256*2**maxLevel]);
   await bake(data,`${out}/base/${r}`,maxLevel,'region');
  }
  const entry={path:`v1/${key}`,maxLevel,regions:meta.regions,signature:meta.signature};
  if(previous?.lighting&&process.env.REBAKE_BASE)entry.lighting=previous.lighting;
  else if(meta.lighting){console.log('Lighting',key);const light=await page.evaluate(()=>window.bakeDefaultLighting());entry.lighting={rect:light.rect,repeat:light.repeat,angle:light.angle};
   for(let i=0;i<2;i++){await bake(light.images[i],`${out}/light/${i}`,3,'light');}
   Object.assign(entry.lighting,JSON.parse(await readFile(`${out}/light/0/complete.json`)));
  }
  await writeFile(marker,JSON.stringify(entry));entries[key]=entry;
 }
 const manifest=fileURLToPath(new URL('../dist/maps/default-layers/manifest.mjs',import.meta.url));
 if(process.env.LAYER_FILTER){await writeFile(root+'partial-'+process.env.LAYER_FILTER.replaceAll('/','-')+'.json',JSON.stringify(entries));}
 else await writeFile(manifest,'export default '+JSON.stringify({version:1,entries})+';\n');
}finally{await browser.close();}
