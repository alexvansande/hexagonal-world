import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 const wait=async()=>{await page.waitForFunction(()=>document.querySelector('#map').dataset.surface==='precomputed'&&document.querySelector('#map').dataset.surfacePending==='0');};
 await page.goto('http://127.0.0.1:4173/political/spaceship-earth/?surfaces=1');await wait();
 await page.screenshot({path:'/tmp/surface-political.png'});
 console.log('Default',await page.locator('#map').evaluate(c=>({...c.dataset})));
 assert(!requests.some(u=>u.includes('maps/countries.png')),'Default must not download live source');
 await page.locator('#zoom-in').click({clickCount:11,delay:30});await wait();
 await page.screenshot({path:'/tmp/surface-political-zoom.png'});
 assert.equal(await page.locator('#map').getAttribute('data-surface-level'),'4');
 assert.equal(await page.locator('#map').getAttribute('data-surface-failures'),'0');
 // Change orientation using the actual input event, then restore it.
 await page.locator('#lon').evaluate(el=>{el.value=+el.value+1;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#map').dataset.surface==='live'&&!document.querySelector('#map-loading').textContent);
 assert(requests.some(u=>u.includes('maps/countries.png')),'Custom orientation loads live source');
 await page.locator('#lon').evaluate(el=>{el.value=-170.01889457926154;el.dispatchEvent(new Event('input',{bubbles:true}));});
 // Slider step rounds fractional presets, so select the layout to restore exact orientation.
 await page.locator('[data-arrangement="dymaxion"]').count().then(async n=>{if(n)await page.locator('[data-arrangement="dymaxion"]').first().click();});
 await wait();
 for(const style of ['lifezones','satellite','elevation','topographic','gray-neutral','ivory','distortion-analysis']){
  await page.goto(`http://127.0.0.1:4173/${style}/spaceship-earth/?surfaces=1`);await wait();
  assert.equal(await page.locator('#map').getAttribute('data-surface-failures'),'0');
 }
 for(const mode of ['tiles','live']){
  await page.goto(`http://127.0.0.1:4173/lifezones/spaceship-earth/?surface=${mode}`);
  if(mode==='tiles')await wait();else await page.waitForFunction(()=>document.querySelector('#map').dataset.surface==='live'&&!document.querySelector('#map-loading').textContent);
  await page.evaluate(()=>{for(const id of ['rivers-visible','relief-enabled']){const el=document.getElementById(id);el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));}});
  await page.locator('#zoom-in').click({clickCount:5,delay:30});if(mode==='tiles')await wait();await page.waitForTimeout(500);
  const data=await page.locator('#map').evaluate(c=>c.toDataURL().split(',')[1]);writeFileSync(`/tmp/surface-compare-${mode}.png`,Buffer.from(data,'base64'));
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4173/political/spaceship-earth/');
 await mobile.waitForFunction(()=>document.querySelector('#map').dataset.surfacePending==='0');
 await mobile.locator('#zoom-in').evaluate(el=>{for(let i=0;i<25;i++)el.click();});
 await mobile.waitForFunction(()=>document.querySelector('#map').dataset.surfaceLevel==='4'&&document.querySelector('#map').dataset.surfacePending==='0');
 assert(parseInt(await mobile.locator('#zoom-value').textContent())>1200,'Mobile reaches beyond the old 12× limit');
 await mobile.screenshot({path:'/tmp/surface-mobile.png'});
 await page.goto('http://127.0.0.1:4173/political/spaceship-earth/');await wait();
 await page.locator('#export-scale').evaluate(el=>{el.value='2';});
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').evaluate(el=>el.click());
 const download=await downloadPromise;await download.saveAs('/tmp/surface-export-2x.png');assert.equal(await download.failure(),null);
 assert.deepEqual(errors,[]);console.log('All styles, desktop/mobile zoom, lazy live fallback and default restoration: pass');
}finally{await browser.close();}
