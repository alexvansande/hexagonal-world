import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {layoutOptions,styleOptions} from '../dist/map-options.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=fileURLToPath(new URL('../dist/maps/default-layers/v1/',import.meta.url));
const b=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});const p=await b.newPage({viewport:{width:1100,height:800}});
try{await p.goto(`${process.env.SURFACE_URL||'http://localhost:4173'}/?bake-layers=1`);await p.waitForFunction(()=>window.prepareDefaultLayers);await p.waitForTimeout(1500);
for(let l=0;l<layoutOptions.length;l++)for(let s=0;s<styleOptions.length;s++){
 const key=layoutOptions[l].arrangement+'/'+styleOptions[s].id;if(process.env.LAYER_FILTER&&!key.includes(process.env.LAYER_FILTER))continue;
 const out=root+key,entry=JSON.parse(await readFile(out+'/entry.json'));if(!entry.lighting)continue;
 const base=entry.lighting,edge=Math.max(base.rect[2],base.rect[3]);
 await p.evaluate(a=>window.prepareDefaultLayers(...a),[l,s]);
 for(let level=1;level<=Number(process.env.LIGHT_LEVEL||3);level++){
  try{await stat(`${out}/detail/complete-${level}.json`);entry.lighting.detailLevel=Math.max(entry.lighting.detailLevel||0,level);await writeFile(out+'/entry.json',JSON.stringify(entry));continue;}catch{}
  const density=2200/edge*2**level,span=2200/density,width=Math.round(base.rect[2]*density),height=Math.round(base.rect[3]*density),tmp=`/tmp/hex-light-detail-${process.pid}`;await mkdir(tmp,{recursive:true});await writeFile(tmp+'/layout.json',JSON.stringify({width,height}));
  for(let y=0;y<Math.ceil(height/2200);y++)for(let x=0;x<Math.ceil(width/2200);x++){
   console.log('Lighting',key,level,x,y);
   const plan={level,density,rect:[base.rect[0]+x*span,base.rect[1]+y*span,span,span],repeat:base.repeat};
   // Finite windows of an infinite map still use the repeating map's unrotated
   // coordinate frame and light direction; the baked tile is repeated at display.
   const result=await p.evaluate(plan=>window.bakeDefaultLighting(plan),plan);
   for(let i=0;i<2;i++)await writeFile(`${tmp}/${x}-${y}-${i}.png`,Buffer.from(result.images[i],'base64'));
  }
  execFileSync(process.env.SURFACE_PYTHON||'python3',[fileURLToPath(new URL('./tile-light-detail.py',import.meta.url)),tmp,out+'/detail',String(level)]);await rm(tmp,{recursive:true});
  entry.lighting.detailLevel=level;await writeFile(out+'/entry.json',JSON.stringify(entry));
 }
}
const entries={};for(const layout of layoutOptions)for(const style of styleOptions){const key=layout.arrangement+'/'+style.id;entries[key]=JSON.parse(await readFile(root+key+'/entry.json'));}
await writeFile(root+'../manifest.mjs','export default '+JSON.stringify({version:1,entries})+';\n');
}finally{await b.close();}
