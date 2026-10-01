// Browser checks for /lifezone-presentation/ (run `npm start` first):
// Rearrange lands every hexagon, and the geography inside it, exactly on the live map;
// the pan slide comes back to the opening view; every slide opens without errors.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await pw.chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const origin=process.env.SURFACE_URL||'http://localhost:4173';
const screen=dataset=>Object.fromEntries(dataset.split(' ').map(e=>{const [id,xy]=e.split(':');return [id,xy.split(',').map(Number)];}));
try{
 for(const [width,height] of [[1600,900],[1280,1024]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/lifezone-presentation/#6`);
  await page.waitForFunction(()=>window.presentation?.index===5&&document.getElementById('map').dataset.danceScreen,null,{timeout:30000});
  await page.waitForTimeout(1500);
  const {centres,map}=await page.evaluate(()=>({centres:window.presentation.rearrangedCentres(),map:document.getElementById('map').dataset.danceScreen}));
  for(const [id,[x,y]] of Object.entries(screen(map)))assert(Math.hypot(centres[id][0]-x,centres[id][1]-y)<1.5,`${width}×${height}: hexagon ${id} lands on the map's own`);
  // The app's coordinate readout under each rearranged sample names the same place.
  for(const s of await page.evaluate(()=>window.presentation.rearrangedSamples(16))){
   const previous=await page.evaluate(()=>document.getElementById('map-coordinates').textContent);
   await page.mouse.move(s.x,s.y);
   await page.waitForFunction(previous=>document.getElementById('map-coordinates').textContent!==previous,previous,{timeout:5000});
   const [lat,lon]=(await page.evaluate(()=>document.getElementById('map-coordinates').textContent)).match(/-?[\d.]+/g).map(Number);
   assert(Math.abs(lat-s.lat)<.05&&Math.abs(((lon-s.lon+540)%360)-180)<.05,`${width}×${height}: geography at ${s.x.toFixed(0)},${s.y.toFixed(0)}: ${lat},${lon} vs ${s.lat.toFixed(3)},${s.lon.toFixed(3)}`);
  }
  // Recentre: the pieces re-form while the map moves, then the opening view returns.
  const before=await page.evaluate(()=>document.getElementById('map').dataset.danceScreen);
  await page.keyboard.press('ArrowRight');
  let reformed=false;
  for(let i=0;i<120;i++){await page.waitForTimeout(250);const d=await page.evaluate(()=>document.getElementById('map').dataset.dancePositions);if(!d.startsWith('0:0.00,0.00,1.00 3:-1.50,0.87'))reformed=true;if(reformed&&d==='0:0.00,0.00,1.00 3:-1.50,0.87,5.00 2:1.50,0.87,2.00 1:-1.50,-0.87,0.00')break;}
  assert(reformed,'The pieces re-form during the pan');
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>document.getElementById('map').dataset.danceScreen),before,'The pan ends on the opening view');
  assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${origin}/lifezone-presentation/`);await page.waitForFunction(()=>window.presentation?.index===0,null,{timeout:30000});
 const count=await page.evaluate(()=>window.presentation.slides.length);
 for(let i=1;i<count;i++){await page.keyboard.press(i%2?'ArrowRight':' ');await page.waitForTimeout(i%5?250:2500);}
 // Software GL can lag the keys by seconds; wait for the last slide to settle.
 await page.waitForFunction(count=>window.presentation.index===count-1&&document.body.classList.contains('history-focus')&&!document.body.classList.contains('pres-quiet'),count,{timeout:30000}).catch(()=>{});
 const end=await page.evaluate(()=>({index:window.presentation.index,focus:document.body.classList.contains('history-focus'),quiet:document.body.classList.contains('pres-quiet'),hash:location.hash}));
 assert.deepEqual(end,{index:count-1,focus:true,quiet:false,hash:'#'+count},'Fast stepping ends on the last spot, zoomed in with its routes: '+JSON.stringify(end));
 await page.keyboard.press('Home');await page.waitForTimeout(1500);
 assert.equal(await page.evaluate(()=>window.presentation.index),0);
 assert(await page.evaluate(()=>document.body.classList.contains('pres-construction')),'Home returns to the globe');
 assert.deepEqual(errors,[]);
 console.log(`Presentation browser checks: exact Rearrange landing and geography at two sizes, pan round trip, ${count} slides stepped.`);
}finally{await browser.close();}
