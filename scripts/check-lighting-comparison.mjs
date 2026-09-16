import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright'),ff=process.env.TEST_BROWSER==='firefox';
const browser=await (ff?pw.firefox:pw.chromium).launch({headless:true,executablePath:ff?process.env.FIREFOX_PATH:process.env.CHROME_PATH});
try{
 const page=await browser.newPage({viewport:{width:2560,height:1440},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.addInitScript(()=>{window.terrainPasses=0;const create=WebGLRenderingContext.prototype.createFramebuffer;WebGLRenderingContext.prototype.createFramebuffer=function(){window.terrainPasses++;return create.call(this)};});
 const origin=process.env.SURFACE_URL||'http://[::1]:4173';
 const view=[216.1980310905271,12.211027023158092,-5681.735715876356,120.90135521792286];
 const saved=Buffer.from(JSON.stringify([2,[29,true],[],view,[9,true]])).toString('base64url');
 const settle=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>{const d=document.querySelector('#map')?.dataset;return d?.renderPath==='images'&&d.layerPending==='0'&&d.layerFailures==='0'},{},{timeout:60000});};
 const capture=async(name)=>{
  const data=await page.evaluate(()=>{const map=document.querySelector('#map'),out=document.createElement('canvas');out.width=map.width;out.height=map.height;const c=out.getContext('2d');c.drawImage(map,0,0);c.drawImage(document.querySelector('#overlay'),0,0);return out.toDataURL().split(',')[1];});
  await writeFile(`/tmp/hex-comparison-${ff?'firefox':'chrome'}-${name}.png`,Buffer.from(data,'base64'));
  return data;
 };
 for(const style of ['satellite','elevation','lifezones','topographic','gray-neutral','ivory']){
  await page.goto(`${origin}/${style}/spaceship-earth/#m=${saved}`);await settle();
  const toggle=page.locator('#lighting-resolution-test');assert(!(await toggle.isDisabled()));
  await toggle.selectOption('high');await settle();
  const originalURL=page.url();const original=await page.locator('#map').evaluate(e=>({...e.dataset}));
  const originalPixels=await capture(style+'-original');await toggle.selectOption('map');await settle();
  const capped=await page.locator('#map').evaluate(e=>({...e.dataset}));const cappedPixels=await capture(style+'-capped');
  assert.notEqual(cappedPixels,originalPixels,'The comparison must actually change the rendered image');
  assert.equal(capped.lightingComparison,'capped');assert(+capped.lightingDensity<+original.lightingDensity);
  assert.equal(+capped.lightingDensity,+capped.mapMaximumDensity,'Cap matches physical map density, not a lighting level number');
  await toggle.selectOption('high');await settle();assert.equal(await page.locator('#map').getAttribute('data-lighting-density'),original.lightingDensity);
  assert.equal(await capture(style+'-restored'),originalPixels,'Turning the comparison off restores every original pixel');assert.equal(page.url(),originalURL,'Comparison does not change the saved view');
  assert.equal(await page.evaluate(()=>window.terrainPasses),0,'Comparison never calculates terrain lighting');
  console.log(style,original.lightingDensity,'→',capped.lightingDensity,'→',original.lightingDensity);
  // At normal fit the cap must report no difference rather than imply it is active.
  await toggle.selectOption('auto');await page.locator('#fit').click();await settle();
  assert.equal(await page.locator('#map').getAttribute('data-lighting-comparison'),'original');
  assert.match(await page.locator('#lighting-resolution-note').textContent(),/Normal rendering/);
 }
 assert(requests.some(url=>/\/detail\/[01]\/map\//.test(url)));
 assert(!requests.some(url=>/maps\/(height|hydrorivers)\//.test(url)));assert.deepEqual(errors,[]);
 await page.goto(origin+'/political/spaceship-earth/');await settle();assert(await page.locator('#lighting-resolution-test').isDisabled());assert.match(await page.locator('#lighting-resolution-note').textContent(),/no additional shadows/);
 console.log('All comparisons change physical resolution, restore exactly, preserve URLs, and keep image-only rendering. Unprepared views explicitly disabled.');
}finally{await browser.close()}
