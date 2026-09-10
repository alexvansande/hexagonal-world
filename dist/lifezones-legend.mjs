import {landRows,oceanRows} from './map-layers.mjs?v=waves-1';

// Both renderers consume the same layout, so print and web keep identical axes.
export function lifezoneLegendLayout(landCount,oceanCount){
 const land=landRows(landCount),ocean=oceanRows(oceanCount),labels=(land.length>=ocean.length?land:ocean).map(r=>r.label);
 const height=75+(labels.length-1)*19,width=440,hexes=[],texts=[];
 texts.push({value:'Land',x:85,y:23,size:24},{value:'Ocean',x:355,y:23,size:24});
 labels.forEach((value,i)=>texts.push({value,x:220,y:47+i*19,size:16,italic:true}));
 for(const [rows,cx] of [[land,85],[ocean,355]])rows.forEach((row,i)=>{
  // Keep hex spacing consistent; fewer climate bands sit between shared labels.
  const cy=42+((labels.length-rows.length)/2+i)*19;
  row.cells.forEach((cell,j)=>hexes.push({...cell,x:cx+(j-i/2)*20,y:cy,r:11}));
 });
 texts.push({value:'Arid ↔ Humid',x:85,y:height-4,size:16,italic:true},{value:'Gentle ↔ Rough',x:355,y:height-4,size:14,italic:true});
 return {width,height,hexes,texts};
}
export function renderLifezonesLegend(container,landCount,oceanCount){
 const layout=lifezoneLegendLayout(landCount,oceanCount),ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${layout.width} ${layout.height}`);svg.setAttribute('role','group');svg.setAttribute('aria-label','Land and ocean: shared temperature axis, cold above warm');
 svg.style.cssText='width:100%;height:auto;display:block';
 for(const h of layout.hexes){const p=document.createElementNS(ns,'polygon');p.setAttribute('points',Array.from({length:6},(_,k)=>{const a=(k*60-90)*Math.PI/180;return `${h.x+Math.cos(a)*h.r},${h.y+Math.sin(a)*h.r}`;}).join(' '));p.setAttribute('fill',h.color);p.dataset.legendColor=h.color;p.setAttribute('aria-label',h.name);p.setAttribute('tabindex','0');const title=document.createElementNS(ns,'title');title.textContent=h.name+' — '+h.detail;p.append(title);svg.append(p);}
 for(const t of layout.texts){const el=document.createElementNS(ns,'text');el.setAttribute('x',t.x);el.setAttribute('y',t.y);el.setAttribute('text-anchor','middle');el.setAttribute('fill','#173d48');el.style.font=`${t.italic?'italic ':''}${t.size}px Baskerville,Georgia,serif`;el.textContent=t.value;svg.append(el);}
 container.replaceChildren(svg);container.classList.add('lifezones-legend');
}
