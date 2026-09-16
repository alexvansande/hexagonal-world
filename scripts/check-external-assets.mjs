// Real second HTTP origin, without touching Cloudflare or production config.
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=resolve('dist'),served=[];
const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}
 try{const data=await readFile(path);served.push(path);res.writeHead(200,{'Access-Control-Allow-Origin':'*','Content-Type':path.endsWith('.svg')?'image/svg+xml':'image/png'});res.end(data);}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const remote=process.env.ASSET_TEST_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright'),ff=process.env.TEST_BROWSER==='firefox';
let browser;
try{
 browser=await (ff?pw.firefox:pw.chromium).launch({headless:true,executablePath:ff?process.env.FIREFOX_PATH:process.env.CHROME_PATH});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],localImages=[],remoteImages=[],failedImages=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(remote+'/')){remoteImages.push(r.url());if(r.status()>=400)failedImages.push({url:r.url(),status:r.status()});}});
 page.on('request',r=>{if(r.url().startsWith('http://[::1]:4173/maps/')&&/\.(png|webp|jpg|svg)(\?|$)/.test(r.url()))localImages.push(r.url());});
 await page.route('**/asset-config.mjs',r=>r.fulfill({contentType:'text/javascript',body:`export const assetBaseURL=${JSON.stringify(remote)};`}));
 const settled=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>{const d=document.querySelector('#map').dataset;return d.renderPath==='images'&&d.layerPending==='0'&&d.layerFailures==='0'&&+d.surfaceTiles>0;},null,{timeout:60000});};
 const hash='WzIsWzI5LHRydWVdLFtdLFsyMTYuMTk4MDMxMDkwNTI3MSwxMi4yMTEwMjcwMjMxNTgwOTIsLTUwMjguODM3MjIwNjQ0ODY2LC0zNjYuODYyMTk2NTA2NTU1N10sWzksdHJ1ZV1d';
 for(const route of ['lifezones/spaceship-earth/','satellite/infinite-honeycomb/','ivory/felv/','topographic/spaceship-earth/#m='+hash]){
  await page.goto('http://[::1]:4173/'+route);await settled();
  assert.equal(await page.locator('#map').getAttribute('data-merged'),String(!route.includes('infinite')));
  // Reading exported pixels is what fails if cross-origin images taint a canvas.
  assert((await page.locator('#map').evaluate(c=>c.toDataURL())).length>10000);
  if(route.startsWith('topographic'))await page.screenshot({path:`/tmp/hex-cloud-${ff?'firefox':'chrome'}-closeup.png`});
 }
 await page.goto('http://[::1]:4173/lifezones/spaceship-earth/');await settled();
 await page.evaluate(()=>{window.savedExport=null;const create=URL.createObjectURL;URL.createObjectURL=function(blob){window.savedExport=blob;return create.call(this,blob);};HTMLAnchorElement.prototype.click=function(){};});
 for(const value of ['2','pdf-2']){
  await page.locator('#export-scale').evaluate((el,value)=>el.value=value,value);
  await page.evaluate(()=>{window.savedExport=null;document.querySelector('#export').click();});
  await page.waitForFunction(()=>window.savedExport&&!document.querySelector('#export').disabled,null,{timeout:120000});
  assert((await page.evaluate(()=>window.savedExport.size))>1000);
 }
 assert.equal(localImages.length,0,'Map images must all use the configured origin');assert(remoteImages.some(p=>p.includes('/merged-experiment/')));assert(remoteImages.some(p=>p.includes('/default-layers/')));assert.deepEqual(failedImages,[]);assert.deepEqual(errors,[]);
 console.log('Cross-origin finite/infinite maps, saved close-up, CORS canvas readback, PNG/PDF exports pass. Images received:',remoteImages.length);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
