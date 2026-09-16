// Browser regressions for image/live transitions, limited GPUs, and exports.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright'),ff=process.env.TEST_BROWSER==='firefox';
const browser=await (ff?pw.firefox:pw.chromium).launch({headless:true,executablePath:ff?process.env.FIREFOX_PATH:process.env.CHROME_PATH,...(!ff?{args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']}:{})});
const origin=process.env.SURFACE_URL||'http://localhost:4173';
try{
 for(const limited of [false,true]){
  const page=await browser.newPage({viewport:limited?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:limited?3:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(limited=>{
   window.health={created:0,deleted:0,oversize:0};const p=WebGLRenderingContext.prototype,create=p.createFramebuffer,remove=p.deleteFramebuffer,param=p.getParameter,upload=p.texImage2D;
   p.createFramebuffer=function(){window.health.created++;return create.call(this)};p.deleteFramebuffer=function(f){if(f)window.health.deleted++;return remove.call(this,f)};
   if(limited)p.getParameter=function(key){return key===this.MAX_TEXTURE_SIZE||key===this.MAX_RENDERBUFFER_SIZE?2048:param.call(this,key)};
   p.texImage2D=function(...a){const width=a.length===9?a[3]:a[5]?.width,height=a.length===9?a[4]:a[5]?.height;if(limited&&(width>2048||height>2048))window.health.oversize++;return upload.apply(this,a)};
  },limited);
  const settle=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>{const d=document.querySelector('#map').dataset;return d.renderPath==='images'&&d.layerPending==='0'&&d.layerFailures==='0'&&+d.surfaceTiles>0;},{},{timeout:60000})};
  const click=async selector=>page.locator(selector).first().evaluate(el=>el.click());
  await page.goto(origin+'/satellite/spaceship-earth/');await settle();assert.equal(await page.evaluate(()=>window.health.created),0);
  await click('#zoom-in');await click('#zoom-in');await click('#zoom-in');await settle();
  assert.equal(await page.evaluate(()=>window.health.created),0,'Zooming a default never bakes lighting');
  await page.locator('#shadowOpacity').evaluate(el=>{el.value=.4;el.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForFunction(()=>document.querySelector('#map').dataset.renderPath==='live'&&document.querySelector('#relief-status').textContent.includes('Lighting layers ready'),{},{timeout:60000});assert(await page.evaluate(()=>window.health.created)>0,'Customized opacity uses live lighting after finite defaults are fused');
  // Change geography, which must invalidate all baked layers.
  await page.locator('#lon').evaluate(el=>{el.value=12;el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.waitForFunction(()=>document.querySelector('#map').dataset.renderPath==='live'&&document.querySelector('#relief-status').textContent.includes('Lighting layers ready'),{},{timeout:60000});
  assert(await page.evaluate(()=>window.health.created)>0,'Customized geometry uses its actual lighting');
  await page.locator('#shadowOpacity').evaluate(el=>{el.value=1;el.dispatchEvent(new Event('input',{bubbles:true}))});
  await click('[data-arrangement="dymaxion"]');await click('[data-style="lifezones"]');await settle();
  assert.deepEqual(await page.evaluate(()=>[window.health.created,window.health.deleted]),await page.evaluate(()=>[window.health.created,window.health.created]),'Returning to defaults releases every terrain framebuffer');
  assert.equal(await page.evaluate(()=>window.health.oversize),0,'Every texture fits a 2048-pixel device');
  // Rapid style switches must cancel obsolete work and settle on the final look.
  for(const style of ['elevation','satellite','ivory','political','lifezones'])await click(`[data-style="${style}"]`);await settle();
  assert.equal(await page.locator('#map-source').inputValue(),'ecology');
  // Capture exports without downloading files to the user’s computer.
  await page.evaluate(()=>{window.savedExport=null;const create=URL.createObjectURL;URL.createObjectURL=function(blob){window.savedExport=blob;return create.call(this,blob)};HTMLAnchorElement.prototype.click=function(){};});
  await page.waitForTimeout(300);const before=await page.evaluate(()=>({url:location.href,width:document.querySelector('#map').width,height:document.querySelector('#map').height}));
  for(const format of ['2','pdf-2']){
   await page.locator('#export-scale').evaluate((el,value)=>el.value=value,format);await page.evaluate(()=>window.savedExport=null);await click('#export');
   await page.waitForFunction(()=>window.savedExport&&!document.querySelector('#export').disabled,{},{timeout:120000});
   const result=await page.evaluate(()=>({url:location.href,width:document.querySelector('#map').width,height:document.querySelector('#map').height,type:window.savedExport.type,size:window.savedExport.size,error:document.querySelector('#map').getContext('webgl').getError()}));
   assert.equal(result.type,format==='2'?'image/png':'application/pdf');assert(result.size>1000);assert.equal(result.error,0);assert.deepEqual({url:result.url,width:result.width,height:result.height},before,'Export restores viewport and saved URL');
  }
  assert.deepEqual(errors,[]);console.log(limited?'Phone / 2048-pixel GPU':'Desktop',': image zoom, live customization, memory release, rapid switches, PNG and PDF exports pass.');await page.close();
 }
}finally{await browser.close();}
