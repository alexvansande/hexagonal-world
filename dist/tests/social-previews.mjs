import {layoutOptions,styleOptions,layoutPolygons} from '../map-options.mjs';
import {sharePair} from '../share-routes.mjs';
import {encodeMapState} from '../map-state.mjs';
const frame=document.querySelector('iframe'),result=document.querySelector('#result'),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label){for(let i=0;i<900;i++){if(test())return;await delay(100);}throw Error('Timed out: '+label);}
try{
 let count=0;
 for(const layout of layoutOptions){
  const polygons=layoutPolygons(layout),points=polygons.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys);
  const scale=layout.arrangement==='infinite'?150:Math.min(970/(r-l),438/(b-t));
  const view={scale,zoom:1,panX:layout.arrangement==='infinite'?0:-(l+r)*scale/2,panY:layout.arrangement==='infinite'?0:58-(t+b)*scale/2};
  const initial=styleOptions[0];
  const loaded=new Promise(resolve=>frame.onload=resolve);
  frame.src='../index.html?artwork=1#m='+encodeMapState({state:{...layout.state,...initial.state},controls:{...layout.controls,...initial.controls},view,details:{}});
  await loaded;await until(()=>frame.contentDocument?.querySelector('.style-preset-card'),'startup');
  const doc=frame.contentDocument,$=id=>doc.getElementById(id);
  await until(()=>$('relief-status').textContent.startsWith('Elevation ready'),'elevation');
  for(const style of styleOptions){
   result.textContent=`Rendering ${++count}/64 · ${style.name} / ${layout.name}`;
   doc.querySelector(`[data-style="${style.id}"]`).click();await until(()=>!$('map-loading').textContent,'map source');await delay(950);await until(()=>!$('indicatrix-status').textContent,'Tissot');
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const ctx=canvas.getContext('2d'),bg=$('background-color').value;ctx.fillStyle=bg;ctx.fillRect(0,0,1200,630);
   // Reserve the same quiet title band even for the infinite honeycomb.
   ctx.save();ctx.beginPath();ctx.rect(0,148,1200,482);ctx.clip();for(const id of ['map','overlay'])ctx.drawImage($(id),0,0,1200,630);ctx.restore();
   const rgb=[1,3,5].map(i=>parseInt(bg.slice(i,i+2),16));ctx.fillStyle=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)<125?'#e5f0f2':'#234b59';
   ctx.font='italic 62px Baskerville, Georgia, serif';ctx.fillText('Hexagonal World',46,72);ctx.font='bold 12px Gotham, Arial, sans-serif';ctx.letterSpacing='1.8px';ctx.fillText('A COLLECTION OF HEXAGON BASED MAPS.',50,101);ctx.letterSpacing='0px';ctx.font='17px Baskerville, Georgia, serif';ctx.fillText(`${style.name} · ${layout.name}`,50,129);ctx.font='15px Baskerville, Georgia, serif';ctx.textAlign='right';ctx.fillText('hexagonal.earth',1150,129);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9)),pair=sharePair(style.id,layout.arrangement),image=document.createElement('img'),figure=document.createElement('figure'),caption=document.createElement('figcaption');image.src=URL.createObjectURL(blob);image.alt=`${style.name} / ${layout.name}`;caption.textContent=image.alt;figure.append(image,caption);document.querySelector('#previews').append(figure);
   if(new URLSearchParams(location.search).has('save')){const response=await fetch('http://127.0.0.1:4176'+pair.image,{method:'POST',body:blob});if(!response.ok)throw Error('Could not save '+pair.image);}
  }
 }
 result.textContent='Ready · 64 social previews';result.dataset.status='passed';
}catch(error){result.textContent=error.message;result.dataset.status='failed';console.error(error);}
