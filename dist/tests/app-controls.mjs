import {decodeMapState} from '../map-state.mjs';
import {layoutOptions,styleOptions} from '../map-options.mjs?v=grid-styling-1';
const frame=document.querySelector('iframe'),list=document.querySelector('#checks'),result=document.querySelector('#result');
const errors=[];let checks=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async(test,label)=>{for(let i=0;i<300;i++){if(test())return;await delay(100);}throw Error('Timed out: '+label);};
const assert=(value,message)=>{if(!value)throw Error(message);};
function pass(message){const li=document.createElement('li');li.textContent='PASS · '+message;list.append(li);checks++;}
try{
 await until(()=>frame.contentDocument?.querySelector('.layout-preset-card'),'app startup');
 let win=frame.contentWindow,doc=frame.contentDocument,$=id=>doc.getElementById(id);
 win.addEventListener('error',event=>errors.push(event.message));
 win.addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));
 await until(()=>$('status').textContent.startsWith('Fuller ·'),'first render');
 await until(()=>$('relief-status').textContent.startsWith('Elevation ready'),'height assets');
 function rendered(){
  const canvas=$('map'),gl=canvas.getContext('webgl');
  assert(gl&&gl.getError()===gl.NO_ERROR,'WebGL reported an error');
  const pixel=new Uint8Array(4);let covered=0;
  for(let y=1;y<5;y++)for(let x=1;x<5;x++){
   gl.readPixels(Math.floor(canvas.width*x/5),Math.floor(canvas.height*y/5),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);covered+=pixel[3]>0;
  }
  assert(covered>0,'Canvas is blank');assert(!errors.length,errors.join('\n'));
 }
 const settle=async()=>{await delay(300);await until(()=>!$('map-loading').textContent,'map source');rendered();};
 assert($('layout').value==='dymaxion'&&$('map-source').value==='ecology','New maps do not default to Lifezones + Spaceship Earth');
 assert(doc.querySelector('.layout-preset-card').dataset.arrangement==='dymaxion'&&doc.querySelector('.style-preset-card').dataset.source==='ecology','Default options are not listed first');
 pass('New maps start with Lifezones + Spaceship Earth, listed first');
 assert(!doc.body.classList.contains('customizing'),'New maps should use compact controls');
 for(const selector of ['.layout-presets','.style-presets']){const row=doc.querySelector(selector);assert(row.scrollWidth>row.clientWidth,'Compact thumbnails should overflow horizontally');assert(win.getComputedStyle(row.querySelector('b')).display==='none','Compact card titles should be hidden');}
 assert($('map-heading').dataset.obscured==='false','Default map hides the main title');pass('Compact controls scroll sideways and leave the masthead visible');
 $('customize').click();await settle();
 assert(doc.body.classList.contains('customizing'),'Customize did not expand the column');
 assert(doc.querySelectorAll('aside details details').length===0,'Settings contain nested collapsible sections');pass('All collapsible settings share one level');
 for(const option of layoutOptions){
  const source=$('map-source').value;
  doc.querySelector(`[data-arrangement="${option.arrangement}"]`).click();await settle();
  assert($('layout').value===option.arrangement,'Arrangement did not update');
  if(option.arrangement==='bighex')assert(+$('gridRotation').value===60,'Flower World rotation is not 60 degrees');
  assert($('map-source').value===source,'Format changed the chosen style');
  assert(doc.querySelectorAll('.layout-preset-card[aria-pressed="true"]').length===1,'Format selection is inconsistent');
  pass(option.name+' switches and renders');
 }
 assert($('map-heading').dataset.obscured==='true'&&!$('sidebar-title').hidden,'Infinite map should move the title into the expanded column');pass('Title moves to the expanded column when the map covers it');
 const geography=()=>{const saved=decodeMapState(win.location.hash.slice(3));return JSON.stringify([saved.view,...['method','arrangement','lon','lat','roll','bias','height','gridRotation','mode'].map(id=>saved.state[id])]);};
 for(const option of styleOptions){
  const before=geography();
  doc.querySelector(`[data-source="${option.source}"]`).click();await settle();
  assert($('map-source').value===option.source,'Source did not update');
  assert($('relief-enabled').checked===option.controls['relief-enabled'],'Relief state did not update');
  assert(geography()===before,'Style changed projection, arrangement or viewport');
  for(const [id,value] of Object.entries(option.state))assert(Math.abs(+$(id).value-value)<.001,'Style omitted '+id);
  assert(doc.querySelector(`[data-source="${option.source}"]`).getAttribute('aria-pressed')==='true','Style selection is inconsistent');
  pass(option.name+' switches and renders');
 }
 doc.querySelector('[data-source="ecology"]').click();await settle();
 assert($('subgrid').checked&&!$('dotgrid').checked,'Lifezones grid correction missing');
 for(const method of ['tetra','octa','rhombic','tetrakis']){doc.querySelector(`[data-method="${method}"]`).click();await settle();}pass('Hexagonal Lifezones renders through all four projections');
 doc.querySelector('[data-source="countries"]').click();await settle();assert(!$('graticule').checked&&!$('dotgrid').checked&&$('background-color').value==='#2b4b5f','Political style did not update');
 doc.querySelector('[data-source="elevation"]').click();await settle();assert(+$('reliefSeaLevel').value===105,'Elevation sea level did not reset');pass('Political and Elevation corrections apply');
 doc.querySelector('[data-source="continents"]').click();await settle();
 assert($('relief-treatment').value==='land','Gray neutral treatment is wrong');
 assert(+$('line').value===0&&$('dotgrid').checked&&$('background-color').value==='#a2bac1','Gray neutral saved look did not apply');
 doc.querySelector('[data-source="ivory"]').click();await settle();assert($('relief-treatment').value==='atlas','Land cutout leaked into Ivory');assert($('graticule').checked&&$('background-color').value==='#8b9992','Ivory saved look did not apply');
 pass('Styles restore their own surface treatment');
 for(const source of ['marble','ecology','countries','continents'])doc.querySelector(`[data-source="${source}"]`).click();
 await settle();assert($('source-name').textContent==='continents.png','A stale source request won');pass('Rapid style changes retain the final source');
 $('zoom-out').click();await settle();assert($('zoom-value').textContent==='80%','Zoom did not update');
 pass('Infinite mode remains rendered after zoom');

 const change=(id,value)=>{const el=$(id);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new win.Event(['range','color'].includes(el.type)?'input':'change',{bubbles:true}));};
 const overlayInk=()=>{const c=$('overlay'),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<rgba.length;i+=4)if(rgba[i])return true;return false;};
 change('dotgrid',false);change('line',0);await settle();assert(!overlayInk(),'Zero border weight still draws normal or red borders');pass('Zero border weight removes normal and red edges');
 change('line',.8);await settle();assert(overlayInk(),'Borders do not return after increasing weight');pass('Increasing border weight restores edges');
 change('border-color','#00ff00');await settle();
 const borderPixels=$('overlay').getContext('2d').getImageData(0,0,$('overlay').width,$('overlay').height).data;
 assert(borderPixels.some((v,i)=>i%4===1&&v>200&&borderPixels[i-1]<80&&borderPixels[i+1]<80),'Border color did not render');
 change('line',0);change('subgrid',true);change('subgridWidth',0);await settle();assert(!overlayInk(),'Zero hex grid thickness draws lines');
 change('subgridWidth',1);change('hex-grid-color','#ff0000');await settle();assert(overlayInk(),'Hex grid is blank');const thinHex=$('overlay').toDataURL();
 const coverage=()=>{const rgba=$('overlay').getContext('2d').getImageData(0,0,$('overlay').width,$('overlay').height).data;let sum=0;for(let i=3;i<rgba.length;i+=4)sum+=rgba[i];return sum;};const thinCoverage=coverage();
 change('hex-grid-color','#0000ff');await settle();assert($('overlay').toDataURL()!==thinHex,'Hex grid color does not change');
 change('subgridWidth',3);await settle();assert(coverage()>thinCoverage*1.2,'Hex grid thickness does not increase coverage');change('subgrid',false);
 pass('Hex border and subgrid colors, thickness, and zero visibility work');
 for(const reliefEnabled of [false,true]){
  change('relief-enabled',reliefEnabled);change('graticule',false);await settle();const unlined=$('map').toDataURL();
  change('graticule',true);change('graticuleWidth',0);await settle();assert($('map').toDataURL()===unlined,'Zero latitude/longitude width draws lines');
  change('graticuleWidth',1);change('graticule-color','#ff0000');await settle();const thin=$('map').toDataURL();assert(thin!==unlined,'Latitude/longitude lines are blank');
  change('graticule-color','#0000ff');await settle();const blue=$('map').toDataURL();assert(blue!==thin,'Latitude/longitude color does not change');
  change('graticuleWidth',3);await settle();assert($('map').toDataURL()!==blue,'Latitude/longitude thickness does not change');
 }
 pass('Latitude/longitude color and thickness work in flat and relief views');
 change('graticule',false);change('relief-enabled',false);await settle();const plain=$('map').toDataURL();
 assert($('distortion').type==='checkbox','Distortion is not a toggle');change('distortionOpacity',0);change('distortion',true);await settle();
 assert(!$('distortion-controls').hidden,'Opacity control is hidden while distortion is on');
 assert($('map').toDataURL()===plain,'Zero-opacity distortion changes the map');
 change('distortionOpacity',.7);await settle();assert($('map').toDataURL()!==plain,'Distortion toggle has no visible effect');pass('Combined distortion toggle and opacity render correctly');
 change('distortion',false);change('line',0);change('indicatrix','4x49');
 await until(()=>$('indicatrix-status').textContent===''&&overlayInk(),'projected Tissot circles');await settle();
 pass('Projected Tissot circles render at the subhex centers');
 change('indicatrix','off');await settle();assert(!overlayInk(),'Tissot outlines remain after disabling');pass('Tissot toggle clears its projected outlines');
 change('background-color','#123456');await settle();
 assert(win.getComputedStyle(doc.querySelector('.workspace')).backgroundColor==='rgb(18, 52, 86)','Background picker does not update the workspace');
 // URL persistence must restore final panel ordering, including the dynamically installed source panel.
 $('relief-panel').open=true;$('map-source-panel').open=true;
 await delay(300);
 win.location.reload();await until(()=>frame.contentDocument!==doc&&frame.contentDocument?.querySelector('.layout-preset-card'),'reload');
 win=frame.contentWindow;doc=frame.contentDocument;
 win.addEventListener('error',event=>errors.push(event.message));
 win.addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));
 await until(()=>$('status').textContent.startsWith('Infinite ·'),'restored render');
 assert($('background-color').value==='#123456','Background color was not restored');
 assert($('border-color').value==='#00ff00'&&$('hex-grid-color').value==='#0000ff'&&$('graticule-color').value==='#0000ff'&&+$('subgridWidth').value===3&&+$('graticuleWidth').value===3,'Grid appearance was not restored');pass('Background picker updates the workspace and survives reload');
 assert($('relief-panel').open&&$('map-source-panel').open,'Expanded panels were not restored');pass('Shared URL restores expanded panels');
 frame.style.width='390px';frame.style.height='844px';await delay(200);$('fit').click();await settle();
 assert(doc.querySelector('aside').getBoundingClientRect().bottom<844*.5,'Mobile controls cover the map');pass('Mobile view leaves space for map interaction');
 assert($('map').toDataURL('image/png').startsWith('data:image/png;base64,'),'Canvas PNG encoding failed');pass('Rendered map can be encoded as PNG');
 doc.querySelector('[data-arrangement="bighex"]').click();await settle();
 assert($('background-color').value==='#123456','Format reset the background');
 let exported;const originalURL=win.URL.createObjectURL,originalClick=win.HTMLAnchorElement.prototype.click;
 try{
  win.URL.createObjectURL=blob=>{exported=blob;return originalURL.call(win.URL,blob);};win.HTMLAnchorElement.prototype.click=function(){};
  $('export').click();await until(()=>exported&&!$('export').disabled,'PNG background export');
  const bitmap=await createImageBitmap(exported),out=document.createElement('canvas');out.width=bitmap.width;out.height=bitmap.height;const context=out.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
  const pixel=context.getImageData(0,0,1,1).data;assert([18,52,86,255].every((v,i)=>pixel[i]===v),'PNG does not contain the selected background');pass('PNG export includes the chosen background color');
 }finally{win.URL.createObjectURL=originalURL;win.HTMLAnchorElement.prototype.click=originalClick;}
 $('collapse-customize').click();$('fit').click();await settle();
 const controls=doc.querySelector('aside').getBoundingClientRect(),tools=doc.querySelector('.view-tools').getBoundingClientRect();
 assert(controls.bottom<tools.top,'Compact mobile controls overlap the map tools');assert(!doc.body.classList.contains('customizing'),'Sidebar did not collapse');
 assert($('map-heading').getBoundingClientRect().right<=390,'Mobile masthead extends beyond the screen');pass('Compact mobile controls and title fit the screen');
 result.textContent=`PASS · ${checks} checks`;result.dataset.status='passed';
}catch(error){result.textContent='FAIL · '+error.message;result.className='fail';result.dataset.status='failed';console.error(error);}
