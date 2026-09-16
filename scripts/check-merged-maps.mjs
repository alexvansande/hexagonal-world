import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),pw=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ff=process.env.TEST_BROWSER==='firefox';
const browser=await (ff?pw.firefox:pw.chromium).launch({headless:true,executablePath:ff?process.env.FIREFOX_PATH:process.env.CHROME_PATH});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const hash=Buffer.from(JSON.stringify([2,[29,true],[],[216.1980310905271,12.211027023158092,-5028.837220644866,-366.8621965065557],[9,true]])).toString('base64url');
 const styles=(process.env.MERGED_STYLES||'topographic').split(',');
 for(const format of (process.env.MERGED_FORMATS||'spaceship-earth').split(','))for(const style of styles){
  await page.goto(`http://[::1]:4173/${style}/${format}/?merged-preview=1${process.env.MERGED_FIT?'':'#m='+hash}`);
  await page.waitForSelector('#merged-preview',{state:'attached'});
  await page.waitForFunction(()=>document.querySelector('#merged-preview').dataset.pending==='0'&&document.querySelector('#map').dataset.layerPending==='0',null,{timeout:90000});
  const capture=async(name,merged)=>{const result=await page.evaluate(merged=>{const map=document.querySelector(merged?'#merged-preview':'#map'),out=document.createElement('canvas');out.width=map.width;out.height=map.height;const c=out.getContext('2d');c.drawImage(map,0,0);c.drawImage(document.querySelector('#overlay'),0,0);return out.toDataURL().split(',')[1];},merged);await writeFile(`/tmp/hex-merged-${ff?'firefox':'chrome'}-${style}-${name}.png`,Buffer.from(result,'base64'));return result;};
  const newPixels=await capture('new',false);
  await page.locator('#merged-preview-toggle').uncheck();
  if(await page.locator('#lighting-resolution-test').isEnabled())await page.locator('#lighting-resolution-test').selectOption('map',{force:true});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.waitForFunction(()=>document.querySelector('#map').dataset.layerPending==='0',null,{timeout:90000});
  const reference=await capture('reference',false);
  assert.notEqual(newPixels,reference,'Comparison must switch actual rendered pixels');
  assert(newPixels.length>10000);assert.equal(await page.locator('#map').getAttribute('data-render-path'),'images');
  console.log('Verified',format,style,process.env.MERGED_FIT?'overview':'close-up','PNG view and existing renderer');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
