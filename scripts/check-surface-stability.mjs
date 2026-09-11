// Regression: large Retina views used to request more tiles than the cache
// could retain, continuously evicting and downloading visible hex images.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const [width,height] of [[1920,1200],[2560,1440]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2}),requests=[],errors=[];
  page.on('request',request=>{if(request.url().includes('/maps/surfaces/')&&request.url().endsWith('.webp'))requests.push(request.url());});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const settled=async()=>{
   // Controls schedule their next render; don't mistake the previous view's
   // zero pending count for completion of a newly requested zoom or Fit.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.waitForFunction(()=>{const data=document.getElementById('map').dataset;return data.surface==='precomputed'&&data.surfacePreview==='false'&&data.surfacePending==='0';});
  };
  await settled();
  const repaint=()=>page.evaluate(async()=>{
   document.getElementById('background-color').dispatchEvent(new Event('input',{bubbles:true}));
   await new Promise(requestAnimationFrame);
   const source=document.getElementById('map'),sample=document.createElement('canvas');sample.width=128;sample.height=80;
   const context=sample.getContext('2d');context.drawImage(source,0,0,128,80);
   let hash=2166136261;for(const byte of context.getImageData(0,0,128,80).data)hash=Math.imul(hash^byte,16777619);
   return {hash,tiles:Number(source.dataset.surfaceTiles),pending:Number(source.dataset.surfacePending),preview:source.dataset.surfacePreview};
  });
  const first=await repaint(),requestCount=requests.length;
  for(let i=0;i<12;i++){
   await page.waitForTimeout(150);const frame=await repaint();
   assert.equal(frame.hash,first.hash,'Unchanged map pixels must not blink between repaints');
   assert.equal(frame.pending,0);assert.equal(frame.preview,'false');assert(frame.tiles<=120);
  }
  assert.equal(requests.length,requestCount,'An unchanged view must stop requesting tiles');
  assert.equal(new Set(requests).size,requests.length,'Initial visible images must not be repeatedly downloaded');
  // Zoom changes must settle too, while retaining high detail for close-ups.
  await page.locator('#zoom-in').click({clickCount:8,delay:30});await settled();
  const zoomed=await repaint();assert(zoomed.tiles<=120);assert.equal(zoomed.pending,0);
  await page.locator('#fit').click();await settled();
  const fitted=await repaint(),fitRequests=requests.length;
  // Initial presets can apply a framing offset that Fit deliberately removes.
  // Compare repeated frames of the fitted view rather than the preset framing.
  for(let i=0;i<5;i++){await page.waitForTimeout(150);assert.equal((await repaint()).hash,fitted.hash,'Fitted image remains stable');}
  assert.equal(requests.length,fitRequests,'Fit must also stop loading once complete');
  assert.deepEqual(errors,[]);
  console.log(`${width}×${height} at 2×: stable pixels, bounded cache, no reload loop, zoom and Fit pass (${requestCount} initial tiles).`);
  await page.close();
 }
}finally{await browser.close();}
