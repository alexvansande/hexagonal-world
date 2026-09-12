// Offline GPU bake. Requires Playwright and Pillow; no browser-side baking in
// production. Run against the local preview: node scripts/build-surface-tiles.mjs
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {mkdir,writeFile,stat,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {layoutOptions} from '../dist/map-options.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const python=process.env.SURFACE_PYTHON||'python3';
const root=fileURLToPath(new URL('../dist/maps/surfaces/',import.meta.url));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800}});
page.on('pageerror',error=>console.error(error.message));
await page.goto('http://127.0.0.1:4173/index.html?bake-surfaces=1');
await page.waitForFunction(()=>typeof window.bakeSurface==='function'&&document.querySelector('#map-loading').textContent==='');
await page.waitForTimeout(1000);
const entries={},seen=new Map();
try{
 for(let i=0;i<layoutOptions.length;i++){
  const layout=layoutOptions[i],signature=JSON.stringify(['method','lon','lat','roll','bias','height'].map(k=>layout.state[k]));
  if(seen.has(signature)){for(const source of ['ecology','countries','continents','marble','terrain'])entries[`${layout.arrangement}/${source}`]=entries[`${seen.get(signature)}/${source}`];continue;}
  seen.set(signature,layout.arrangement);
  for(const source of ['ecology','countries','continents','marble','terrain']){
   const maxLevel=['ecology','countries','continents'].includes(source)?4:3;
   const regions=layout.state.method==='lambert-one'?1:layout.state.method==='lambert-two'?2:4;
   const path=`${layout.arrangement==='felv'?'v3':'v1'}/${layout.arrangement}/${source}`;
   for(let region=0;region<regions;region++){
    const out=`${root}${path}/${region}`,marker=`${out}/complete.json`;
    try{await stat(marker);console.log('Reuse',path,region);continue;}catch{}
    console.log('Bake',path,region,256*2**maxLevel);
    const data=await page.evaluate(async args=>window.bakeSurface(...args),[i,source,region,256*2**maxLevel]);
    await mkdir(out,{recursive:true});const png=`/tmp/hex-surface-bake-${process.pid}.png`;await writeFile(png,Buffer.from(data,'base64'));
    execFileSync(python,[fileURLToPath(new URL('./tile-surfaces.py',import.meta.url)),png,out,String(maxLevel)],{stdio:'inherit'});
    await unlink(png);await writeFile(marker,JSON.stringify({maxLevel}));
   }
   entries[`${layout.arrangement}/${source}`]={path,maxLevel,regions,signature};
  }
 }
 await writeFile(`${root}manifest.mjs`,'export default '+JSON.stringify({version:1,entries})+';\n');
 console.log('Complete:',Object.keys(entries).length,'default surface/layout combinations');
}finally{await browser.close();}
