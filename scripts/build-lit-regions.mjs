// Offline only. Bakes the lit per-piece sets for the Spaceship Earth dance: for
// every hexagon region and each of the twelve ways a piece can stand on screen
// (30° steps), the unlit base is fused with terrain
// lighting turned so the light always comes from the same side of the browser. Needs playwright-core and a local Chrome; PIL/numpy via SURFACE_PYTHON.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {layoutOptions,styleOptions} from '../dist/map-options.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const style=process.env.LIT_STYLE||'lifezones',layoutIndex=layoutOptions.findIndex(l=>l.arrangement==='dymaxion'),styleIndex=styleOptions.findIndex(s=>s.id===style);
const key=`dymaxion/${style}`,root=fileURLToPath(new URL('../dist/maps/default-layers/v1/',import.meta.url)),out=root+key,scratch=process.env.LIT_SCRATCH||`/tmp/hex-lit-${style}`;
const python=process.env.SURFACE_PYTHON||'python3',resolution=4096,window=1024,classes=12;
await mkdir(scratch,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800}});
page.on('pageerror',e=>console.error('page error',e.message));
try{
 await page.goto(`${process.env.SURFACE_URL||'http://localhost:4173'}/?bake-layers=1`);
 await page.waitForFunction(()=>window.prepareDefaultLayers&&document.querySelector('#map-loading').textContent==='');
 await page.waitForTimeout(1000);
 const meta=await page.evaluate(async a=>window.prepareDefaultLayers(...a),[layoutIndex,styleIndex]);
 if(!meta.lighting)throw Error('This style has no lighting to bake.');
 const only=process.env.LIT_ONLY?process.env.LIT_ONLY.split(',').map(Number):null;
 for(let r=0;r<meta.regions;r++){
  if(only&&!only.includes(r))continue;
  console.log('Base',key,r);
  await writeFile(`${scratch}/base-${r}.png`,Buffer.from(await page.evaluate(a=>window.bakeDefaultRegion(...a),[r,resolution]),'base64'));
  for(let k=0;k<classes;k++){
   for(let y=0;y<resolution;y+=window)for(let x=0;x<resolution;x+=window){
    const images=await page.evaluate(a=>window.bakeLitRegion(...a),[r,k,x,y,window,resolution]);
    for(let i=0;i<2;i++)await writeFile(`${scratch}/light-${r}-${k}-${i}-${x}-${y}.png`,Buffer.from(images[i],'base64'));
   }
   console.log('Fuse',key,r,'class',k);
   execFileSync(python,[fileURLToPath(new URL('./fuse-lit-region.py',import.meta.url)),scratch,String(r),String(k),String(resolution),String(window)],{stdio:'inherit'});
   execFileSync(python,[fileURLToPath(new URL('./tile-default-layers.py',import.meta.url)),`${scratch}/lit-${r}-${k}.png`,`${out}/lit/${k}/${r}`,'4','region'],{stdio:'inherit'});
  }
 }
 const entryPath=`${out}/entry.json`,entry=JSON.parse(await readFile(entryPath,'utf8'));entry.lit=classes;await writeFile(entryPath,JSON.stringify(entry));
 const manifestPath=fileURLToPath(new URL('../dist/maps/default-layers/manifest.mjs',import.meta.url));
 const manifest=(await import(manifestPath+'?t='+Date.now())).default;manifest.entries[key].lit=classes;
 await writeFile(manifestPath,'export default '+JSON.stringify(manifest)+';\n');
 console.log('Lit sets ready:',`${out}/lit`);
}finally{await browser.close();}
