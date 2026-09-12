import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:800}});await page.goto('http://127.0.0.1:4173/');await page.waitForTimeout(1200);
 const click=async selector=>{await page.locator(selector).first().evaluate(el=>el.click());await page.waitForTimeout(450);assert.equal(new URL(page.url()).hash,'',page.url());};
 await click('[data-arrangement="felv"]');await click('[data-arrangement="bighex"]');await click('[data-style="elevation"]');
 console.log('Reported sequence:',page.url());
 for(const style of ['political','satellite','ivory','lifezones','distortion-analysis','topographic','gray-neutral','elevation'])await click(`[data-style="${style}"]`);
 for(const layout of ['single','flower','gosper','double','infinite','dymaxion','felv','bighex'])await click(`[data-arrangement="${layout}"]`);
 const before=await page.locator('#background-color').inputValue();await page.reload();await page.waitForTimeout(800);assert.equal(await page.locator('#background-color').inputValue(),before);assert.equal(new URL(page.url()).hash,'');
 console.log('All style and format click sequences produce fragment-free URLs; reload matches.');
}finally{await browser.close();}
