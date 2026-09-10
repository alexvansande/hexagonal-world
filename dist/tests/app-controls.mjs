import {decodeMapState} from '../map-state.mjs';
import {layoutOptions,styleOptions} from '../map-options.mjs';
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
 await until(()=>$('status').textContent.startsWith('Infinite ·'),'first render');
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
 pass('Startup renders and retains status / research controls');
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
 doc.querySelector('[data-source="countries"]').click();await settle();assert($('graticule').checked,'Political graticule missing');
 doc.querySelector('[data-source="elevation"]').click();await settle();assert(+$('reliefSeaLevel').value===105,'Elevation sea level did not reset');pass('Political and Elevation corrections apply');
 doc.querySelector('[data-source="continents"]').click();await settle();
 assert($('relief-treatment').value==='land','Gray neutral treatment is wrong');
 doc.querySelector('[data-source="ivory"]').click();await settle();assert($('relief-treatment').value==='atlas','Land cutout leaked into Ivory');
 pass('Styles restore their own surface treatment');
 for(const source of ['marble','ecology','countries','continents'])doc.querySelector(`[data-source="${source}"]`).click();
 await settle();assert($('source-name').textContent==='continents.png','A stale source request won');pass('Rapid style changes retain the final source');
 $('zoom-out').click();await settle();assert($('zoom-value').textContent==='80%','Zoom did not update');
 pass('Infinite mode remains rendered after zoom');

 const change=(id,value)=>{const el=$(id);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new win.Event(el.type==='range'?'input':'change',{bubbles:true}));};
 const overlayInk=()=>{const c=$('overlay'),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<rgba.length;i+=4)if(rgba[i])return true;return false;};
 change('line',0);await settle();assert(!overlayInk(),'Zero border weight still draws normal or red borders');pass('Zero border weight removes normal and red edges');
 change('line',.8);await settle();assert(overlayInk(),'Borders do not return after increasing weight');pass('Increasing border weight restores edges');
 change('relief-enabled',false);await settle();const plain=$('map').toDataURL();
 assert($('distortion').type==='checkbox','Distortion is not a toggle');change('distortionOpacity',0);change('distortion',true);await settle();
 assert(!$('distortion-controls').hidden,'Opacity control is hidden while distortion is on');
 assert($('map').toDataURL()===plain,'Zero-opacity distortion changes the map');
 change('distortionOpacity',.7);await settle();assert($('map').toDataURL()!==plain,'Distortion toggle has no visible effect');pass('Combined distortion toggle and opacity render correctly');
 change('distortion',false);change('line',0);change('indicatrix','4x49');
 await until(()=>$('indicatrix-status').textContent===''&&overlayInk(),'projected Tissot circles');await settle();
 pass('Projected Tissot circles render at the subhex centers');
 change('indicatrix','off');await settle();assert(!overlayInk(),'Tissot outlines remain after disabling');pass('Tissot toggle clears its projected outlines');
 // URL persistence must restore final panel ordering, including the dynamically installed source panel.
 $('relief-panel').open=true;$('map-source-panel').open=true;
 await delay(300);
 win.location.reload();await until(()=>frame.contentDocument!==doc&&frame.contentDocument?.querySelector('.layout-preset-card'),'reload');
 win=frame.contentWindow;doc=frame.contentDocument;
 win.addEventListener('error',event=>errors.push(event.message));
 win.addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));
 await until(()=>$('status').textContent.startsWith('Infinite ·'),'restored render');
 assert($('relief-panel').open&&$('map-source-panel').open,'Expanded panels were not restored');pass('Shared URL restores expanded panels');
 frame.style.width='390px';frame.style.height='844px';await delay(200);$('fit').click();await settle();
 assert(doc.querySelector('aside').getBoundingClientRect().bottom<844*.5,'Mobile controls cover the map');pass('Mobile view leaves space for map interaction');
 assert($('map').toDataURL('image/png').startsWith('data:image/png;base64,'),'Canvas PNG encoding failed');pass('Rendered map can be encoded as PNG');
 result.textContent=`PASS · ${checks} checks`;result.dataset.status='passed';
}catch(error){result.textContent='FAIL · '+error.message;result.className='fail';result.dataset.status='failed';console.error(error);}
