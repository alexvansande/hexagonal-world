import {chromium} from '/opt/node-tools/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'],proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
const p=await b.newPage({viewport:{width:1600,height:1000},ignoreHTTPSErrors:true});
p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto(process.argv[2]||'https://hexagonal.earth/spaceship-earth/',{waitUntil:'networkidle',timeout:120000});
await p.waitForTimeout(4000);
await p.screenshot({path:'def-sat.png'});

await p.waitForTimeout(8000);
await p.screenshot({path:'def-sat2.png'});
console.log(await p.evaluate(()=>location.href));
console.log(await p.evaluate(()=>['lon-value','lat-value','roll-value'].map(k=>document.getElementById(k).value)));// ,'lat','roll'].map(k=>document.getElementById(k).value)));
await b.close();
