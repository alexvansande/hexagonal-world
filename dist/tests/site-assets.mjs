import {layoutOptions,styleOptions,layoutPolygons} from '../map-options.mjs';
import {encodeMapState} from '../map-state.mjs';
const frame=document.querySelector('iframe'),result=document.querySelector('#result');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,label){for(let i=0;i<600;i++){if(test())return;await delay(100);}throw Error('Timed out: '+label);}
async function save(name,blob){
 if(new URLSearchParams(location.search).get('only')==='favicon'&&!name.startsWith('favicon'))return;
 const image=document.createElement('img');image.src=URL.createObjectURL(blob);image.alt=name;document.querySelector('#previews').append(image);
 if(new URLSearchParams(location.search).has('save')){const response=await fetch('http://127.0.0.1:4175/'+name,{method:'POST',body:blob});if(!response.ok)throw Error('Saving '+name+' failed');}
}
const png=canvas=>new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
try{
 const layout=layoutOptions.find(o=>o.arrangement==='dymaxion'),style=styleOptions.find(o=>o.id==='lifezones');
 const polygons=layoutPolygons(layout),pts=polygons.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),bw=right-left,bh=bottom-top;
 const scale=Math.min(840/bw,445/bh),view={scale,zoom:1,panX:90-(left+right)*scale/2,panY:55-(top+bottom)*scale/2};
 frame.src='../index.html#m='+encodeMapState({state:{...layout.state,...style.state},controls:{...layout.controls,...style.controls},view,details:{}});
 await until(()=>frame.contentDocument?.querySelector('.style-preset-card'),'startup');
 const doc=frame.contentDocument,$=id=>doc.getElementById(id);
 await until(()=>$('relief-status').textContent.startsWith('Elevation ready'),'elevation');
 await until(()=>!$('map-loading').textContent,'map source');await delay(2500);
 const social=document.createElement('canvas');social.width=1200;social.height=630;const ctx=social.getContext('2d');
 ctx.fillStyle=style.controls['background-color'];ctx.fillRect(0,0,1200,630);
 for(const id of ['map','overlay'])ctx.drawImage($(id),0,0,1200,630);
 ctx.fillStyle='#234b59';ctx.font='italic 66px Baskerville, Georgia, serif';ctx.fillText('Hexagonal World',54,90);
 ctx.font='bold 12px Gotham, Arial, sans-serif';ctx.letterSpacing='2px';ctx.fillText('A COLLECTION OF HEXAGON BASED MAPS.',58,121);
 ctx.font='19px Baskerville, Georgia, serif';ctx.letterSpacing='0px';ctx.fillText('hexagonal.earth',58,579);
 await save('social-preview.png',await png(social));
 // A bold silhouette retains the four-hexagon identity even at 16 px.
 // Keep the complete mark within the circular mask-safe area of home-screen icons.
 const s=Math.min(64/bw,60/bh),paths=polygons.map(poly=>'M'+poly.map(([x,y])=>[(50+(x-(left+right)/2)*s).toFixed(3),(50+(y-(top+bottom)/2)*s).toFixed(3)].join(',')).join('L')+'Z');
 // Separate the favicon cells, then fit the mark almost edge-to-edge.
 const separated=polygons.map(poly=>{const cx=poly.reduce((sum,p)=>sum+p[0],0)/poly.length,cy=poly.reduce((sum,p)=>sum+p[1],0)/poly.length;return poly.map(([x,y])=>[cx+(x-cx)*.84,cy+(y-cy)*.84]);});
 const iconPoints=separated.flat(),ix=iconPoints.map(p=>p[0]),iy=iconPoints.map(p=>p[1]),il=Math.min(...ix),ir=Math.max(...ix),it=Math.min(...iy),ib=Math.max(...iy),is=Math.min(96/(ir-il),94/(ib-it));
 const faviconPaths=separated.map(poly=>'M'+poly.map(([x,y])=>[(50+(x-(il+ir)/2)*is).toFixed(3),(50+(y-(it+ib)/2)*is).toFixed(3)].join(',')).join('L')+'Z');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#234b59">'+faviconPaths.map(d=>'<path d="'+d+'"/>').join('')+'</g></svg>';
 await save('favicon.svg',new Blob([svg],{type:'image/svg+xml'}));
 for(const [name,size] of [['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');if(size!==32){c.fillStyle='#234b59';c.fillRect(0,0,size,size);}c.scale(size/100,size/100);c.fillStyle=c.strokeStyle=size===32?'#234b59':'#bfdce4';c.lineWidth=.3;for(const d of size===32?faviconPaths:paths){const path=new Path2D(d);c.fill(path);if(size!==32)c.stroke(path);}if(size>=180){c.strokeStyle='#234b59';c.lineWidth=1;for(const d of paths)c.stroke(new Path2D(d));}await save(name,await png(canvas));
 }
 result.textContent=new URLSearchParams(location.search).get('only')==='favicon'?'Ready · transparent dark-blue favicons':'Ready · social preview and five icons';result.dataset.status='passed';
}catch(error){result.textContent=error.message;result.dataset.status='failed';console.error(error);}
