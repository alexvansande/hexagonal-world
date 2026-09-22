// Offline only: drive /tests/history-social.html?save=1 in headless Chrome so
// every age and pane gets its 1200×630 preview. Run scripts/save-social-previews.py
// first (it writes dist/social/history-*.jpg) and serve dist on 127.0.0.1:4173.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright-core');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-gl=angle',process.platform==='darwin'?'--use-angle=metal':'--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1300,height:900}});
page.on('pageerror',e=>console.error('page error',e.message));
try{
 await page.goto(`http://127.0.0.1:4173/tests/history-social.html?save=1${process.env.SOCIAL_ONLY?'&only='+process.env.SOCIAL_ONLY:''}`);
 await page.waitForFunction(()=>document.querySelector('#result').dataset.status,null,{timeout:0,polling:1000});
 console.log(await page.evaluate(()=>document.querySelector('#result').textContent));
 if(await page.evaluate(()=>document.querySelector('#result').dataset.status)!=='passed')process.exitCode=1;
}finally{await browser.close();}
