import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {shareCombinations} from '../dist/share-routes.mjs';
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright'),firefox=process.env.TEST_BROWSER==='firefox';
const browser=await (firefox?pw.firefox:pw.chromium).launch({headless:true,executablePath:firefox?process.env.FIREFOX_PATH:process.env.CHROME_PATH,...(!firefox?{args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader','--disable-gpu-shader-disk-cache']}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});let requests=[],errors=[];
 if(process.env.ASSET_TEST_BASE_URL)await page.route('**/asset-config.mjs',route=>route.fulfill({contentType:'text/javascript',body:`export const assetBaseURL=${JSON.stringify(process.env.ASSET_TEST_BASE_URL)};`}));
 page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.defaultCheck={shaders:[],framebuffers:0};const p=WebGLRenderingContext.prototype,shader=p.shaderSource,fbo=p.createFramebuffer;p.shaderSource=function(s,text){window.defaultCheck.shaders.push(text);return shader.call(this,s,text)};p.createFramebuffer=function(){window.defaultCheck.framebuffers++;return fbo.call(this)};});
 for(const pair of shareCombinations){requests=[];errors=[];
  await page.goto((process.env.SURFACE_URL||'http://localhost:4173')+pair.path);
  await page.waitForFunction(()=>{const d=document.querySelector('#map').dataset;return d.renderPath==='images'&&d.layerPending==='0'&&d.layerFailures==='0'&&+d.surfaceTiles>0;},{},{timeout:30000});
  if(process.env.ZOOM_CHECK){await page.locator('#zoom-in').click({clickCount:8,delay:25});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>{const d=document.querySelector('#map').dataset;return d.layerPending==='0'&&d.layerFailures==='0';},{},{timeout:60000});}
  const result=await page.evaluate(()=>({...window.defaultCheck,error:document.querySelector('#error').textContent,glError:document.querySelector('#map').getContext('webgl').getError()}));
  assert.deepEqual(errors,[],pair.path);assert.equal(result.error,'',pair.path);assert.equal(result.glError,0,pair.path);assert.equal(result.framebuffers,0,'Defaults never run terrain/shadow render passes');assert(result.shaders.every(s=>!s.includes('ecologyBridgedColor')&&!s.includes('heightMap')),'Default programs cannot contain live surface/shading work');assert(!requests.some(s=>/maps\/(height|hydrorivers)\//.test(s)),'Defaults do not download elevation or global rivers');console.log('Images only:',pair.path);
 }
 // The original reported failure: a first visit with failed assets must recover.
 const url=(process.env.SURFACE_URL||'http://localhost:4173')+'/';let failing=true,attempts=0;
 await page.route(/\/maps\/(?:default-layers|merged-experiment)\/.*\.png/,route=>{attempts++;return failing?route.fulfill({status:503,body:'Temporary test failure'}):route.continue();});
 await page.goto(url);await page.waitForFunction(()=>+document.querySelector('#map').dataset.layerFailures>0);assert(await page.locator('#map-load-notice').isVisible());failing=false;await page.locator('#map-load-notice button').click();await page.waitForFunction(()=>{const d=document.querySelector('#map').dataset;return d.layerPending==='0'&&d.layerFailures==='0'&&+d.surfaceTiles>0;});assert(!(await page.locator('#map-load-notice').isVisible()));console.log('Temporary download failure recovered:',attempts,'requests');
}finally{await browser.close();}
