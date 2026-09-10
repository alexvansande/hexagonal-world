const frame=document.querySelector('iframe'),result=document.querySelector('#result'),checks=document.querySelector('#checks');
const delay=ms=>new Promise(r=>setTimeout(r,ms)),until=async(fn,label)=>{for(let i=0;i<1800;i++){if(fn())return;await delay(100);}throw Error('Timed out: '+label);},assert=(v,m)=>{if(!v)throw Error(m);},pass=m=>{const li=document.createElement('li');li.textContent='PASS · '+m;checks.append(li);};
try{
 await until(()=>frame.contentDocument?.querySelector('.style-preset-card'),'startup');const win=frame.contentWindow,doc=frame.contentDocument,$=id=>doc.getElementById(id),errors=[];
 win.addEventListener('error',e=>errors.push(e.message));win.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
 await until(()=>$('relief-status').textContent.startsWith('Elevation ready')&&!$('map-loading').textContent,'assets');
 doc.querySelector('[data-arrangement="gosper"]').click();doc.querySelector('[data-style="topographic"]').click();await until(()=>!$('map-loading').textContent,'terrain');await delay(1000);
 assert([...$('export-scale').options].map(o=>o.textContent).join('|')==='PNG 2x|PNG 10x|PDF (print)','Export choices wrong');
 const before=win.location.hash,size=[$('map').width,$('map').height];let captured;
 const create=win.URL.createObjectURL,click=win.HTMLAnchorElement.prototype.click;
 win.URL.createObjectURL=b=>{captured=b;return create.call(win.URL,b);};win.HTMLAnchorElement.prototype.click=function(){};
 for(const value of ['2','10','pdf']){
  result.textContent='Exporting '+value+'…';captured=null;$('export-scale').value=value;$('export').click();
  await until(()=>captured&&!$('export').disabled,'export '+value);
  assert(win.location.hash===before,'Export changed saved map state');assert($('map').width===size[0]&&$('map').height===size[1],'Export did not restore live canvas');assert(!doc.querySelector('main').inert,'Controls remain locked');assert(!errors.length,errors.join('\n'));
  if(value!=='pdf'){const bitmap=await createImageBitmap(captured);assert(bitmap.width===800*+value&&bitmap.height===560*+value,'Export dimensions capped');bitmap.close();pass('PNG '+value+'x exact size, live view and URL restored');}
  else{assert(captured.type==='application/pdf','Wrong PDF type');pass('Print PDF generated and live view restored');}
  if(new URLSearchParams(location.search).has('save')){const response=await fetch('http://127.0.0.1:4175/'+(value==='pdf'?'print.pdf':value+'x.png'),{method:'POST',body:captured});assert(response.ok,'Could not save export artifact');}
 }
 captured=null;$('export-scale').value='10';$('export').click();await delay(100);$('export-cancel').click();await until(()=>!$('export').disabled,'cancel');assert(!captured,'Cancelled export downloaded');assert(win.location.hash===before&&!doc.querySelector('main').inert,'Cancel did not restore state');pass('Cancel restores the map without downloading');
 win.URL.createObjectURL=create;win.HTMLAnchorElement.prototype.click=click;result.textContent='PASS · '+checks.children.length+' checks';
}catch(error){result.textContent='FAIL · '+error.message;console.error(error);}
