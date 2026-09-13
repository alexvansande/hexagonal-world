// Offline previews from the actual widget. Requires the local server on 4173
// and Playwright; PLAYWRIGHT_PATH and CHROME_PATH may select installed runtimes.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage();
 page.on('pageerror',error=>console.error(error.message));
 await page.goto('http://localhost:4173/tests/about-social.html');
 // The fixture advances animation frames deterministically, so poll by timer.
 await page.waitForFunction(()=>document.querySelector('#result').textContent!=='Rendering',{}, {timeout:60000,polling:100});
 const result=await page.locator('#result').textContent();
 if(!result.startsWith('{'))throw Error(result);
 for(const [slug,data] of Object.entries(JSON.parse(result))){
  await writeFile(new URL(`../dist/social/about-${slug}.jpg`,import.meta.url),Buffer.from(data,'base64'));
  console.log('Rendered',slug);
 }
}finally{await browser.close();}
