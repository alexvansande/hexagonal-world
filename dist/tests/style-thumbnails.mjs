import {layoutOptions,styleOptions} from '../map-options.mjs?v=grid-styling-1';
import {encodeMapState} from '../map-state.mjs?v=grid-styling-1';
import {makeGeometry,layouts,hex,canvasWorld} from '../geometry.mjs';
import {makeArrangement} from '../arrangements.mjs';
const frame=document.querySelector('iframe'),result=document.querySelector('#result');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,label){for(let i=0;i<300;i++){if(test())return;await delay(100);}throw Error('Timed out: '+label);}
try{
 // Keep the source crop stable across interface redesigns.
 const layout=layoutOptions.find(o=>o.arrangement==='bighex'),tiles=makeGeometry(layout.state.method,layout.state.height),net=makeArrangement(tiles,'bighex',layouts(tiles)).net;
 const angle=layout.state.gridRotation*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle);
 const points=net.flatMap(t=>hex.map(p=>{const [x,y]=canvasWorld(p,t);return [c*x-sn*y,sn*x+c*y];}));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const scale=Math.min(702/(right-left),656/(bottom-top)),view={scale,zoom:1,panX:175-(left+right)*scale/2,panY:-28-(top+bottom)*scale/2};
 const selected=styleOptions.filter(style=>!new URLSearchParams(location.search).has('only')||style.id===new URLSearchParams(location.search).get('only'));
 frame.src='../index.html?v=grid-styling-1#m='+encodeMapState({state:layout.state,controls:layout.controls,view,details:{}});
 await until(()=>frame.contentDocument?.querySelector('.style-preset-card'),'startup');
 const doc=frame.contentDocument,$=id=>doc.getElementById(id);
 await until(()=>$('relief-status').textContent.startsWith('Elevation ready'),'elevation');
 for(const style of selected){
  result.textContent='Rendering '+style.name+'…';doc.querySelector(`[data-source="${style.source}"]`).click();
  await until(()=>!$('map-loading').textContent,'map source');await delay(700);
  const canvas=$('map'),overlay=$('overlay'),out=document.createElement('canvas');out.width=480;out.height=272;
  const ctx=out.getContext('2d'),ratio=canvas.width/1100,crop={x:525,y:233,w:400,h:400*272/480};
  ctx.fillStyle='#e9f0f2';ctx.fillRect(0,0,out.width,out.height);
  for(const source of [canvas,overlay])ctx.drawImage(source,crop.x*ratio,crop.y*ratio,crop.w*ratio,crop.h*ratio,0,0,out.width,out.height);
  const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');image.src=out.toDataURL();caption.textContent=style.name;figure.append(image,caption);document.querySelector('#previews').append(figure);
  if(new URLSearchParams(location.search).has('save')){
   const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));
   const response=await fetch(`http://127.0.0.1:4174/${style.id}.png`,{method:'POST',headers:{'Content-Type':'image/png'},body:blob});if(!response.ok)throw Error('Could not save '+style.name);
  }
 }
 result.textContent='Ready · '+selected.length+' rendered thumbnails';result.dataset.status='passed';
}catch(error){result.textContent=error.message;result.dataset.status='failed';console.error(error);}
