const ns='http://www.w3.org/2000/svg',root=Math.sqrt(3),directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],colors=['#66867b','#d9e4df'],tints=['#88a696','#bbcfca'];
const key=([q,r])=>`${q},${r}`,add=(a,b)=>a.map((v,i)=>v+b[i]),position=([q,r])=>[root*(q+r/2),1.5*r],offset=(col,row)=>[col-Math.floor(row/2),row];
const corners=Array.from({length:6},(_,i)=>[Math.cos((i-.5)*Math.PI/3),Math.sin((i-.5)*Math.PI/3)]),mid=i=>corners[i%6].map((v,k)=>(v+corners[(i+1)%6][k])/2);
const triples=[offset(3,2),add(offset(3,2),[1,0]),add(offset(3,2),[0,1])],small=offset(6,3),pair=[offset(10,3),offset(11,3)],lake=offset(15,3),island=offset(12,10),pale=new Set([...triples,...pair,small,lake,...directions.map(d=>add(lake,d))].map(key));
function classification(axial){const [q,r]=axial,col=q+Math.floor(r/2);if(col<0||col>19||r<0||r>12)return 0;if(key(axial)===key(island))return 0;if(pale.has(key(axial)))return 1;return +(r>=7&&col>=6||r>=9&&r<=11&&col>=3&&col<=6||r===8&&col===4);}
function patches(axial){const own=classification(axial),ring=directions.map(d=>classification(add(axial,d))),runs=ring.map((color,start)=>{let length=0;while(color!==own&&length<6&&ring[(start+length)%6]===color)length++;return {color,start,length};}),longest=Math.max(...runs.map(r=>r.length));return runs.filter(r=>r.length>=2&&r.length===longest).slice(0,longest===6?1:6);}
const cells=[];for(let row=0;row<=13;row++)for(let col=-1;col<=20;col++)cells.push(offset(col,row));
let selected=triples[0];const scene=document.querySelector('#scene'),detail=document.querySelector('#detail'),view=document.querySelector('#view');
function element(name,attrs={}){const el=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
function polygon(parent,points,attrs){const el=element('polygon',{points:points.map(p=>p.join(',')).join(' '),...attrs});parent.append(el);return el;}
function patchPolygon(run){const {start,length}=run;return length===6?corners:[...(length>=4?[[0,0]]:[]),mid(start),...Array.from({length:length-1},(_,i)=>corners[(start+i+1)%6]),mid(start+length-1)];}
function enabled(n){return document.querySelector(`[data-rule="${n}"]`).checked;}
function drawCell(parent,axial,at,{interactive=false,baseOnly=false,outline=false}={}){
 const own=classification(axial),g=element('g',{transform:`translate(${at.join(' ')})`});parent.append(g);
 polygon(g,corners,{fill:colors[own]});
 const runs=patches(axial);
 if(!baseOnly&&view.value!=='original')for(const run of runs)if(enabled(run.length)){
  polygon(g,patchPolygon(run),{fill:view.value==='patches'?tints[run.color]:colors[run.color],'data-patch':run.length});
  if(run.length===6&&document.querySelector('#circles').checked)g.append(element('circle',{r:2/3,fill:colors[own],'data-circle':'true'}));
 }
 if(outline)polygon(g,corners,{class:'hex-outline'});
 if(interactive){const hit=polygon(g,corners,{class:'cell',fill:'transparent',tabindex:0,role:'button','aria-label':`Hex ${key(axial)}: ${own?'pale':'green'}, ${runs[0]?.length??0}-neighbor patch`});hit.addEventListener('click',()=>{selected=axial;render();});hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selected=axial;render();}});}
 return g;
}
const features=[['Three-hex lake',triples[0]],['Detached patch',add(triples[0],[-1,1])],['Two-hex lake',pair[0]],['Single-hex lake',small],['Seven-hex lake',lake],['Vertical run',offset(6,8)],['Horizontal run',offset(11,7)],['Right boundary',offset(19,10)],['Bottom boundary',offset(14,12)],['Island',island]];
for(const [name,axial] of features){const button=document.createElement('button');button.textContent=name;button.addEventListener('click',()=>{selected=axial;render();});document.querySelector('#features').append(button);}
function render(){
 scene.replaceChildren();const totals={};
 for(const axial of cells){drawCell(scene,axial,position(axial),{interactive:true,outline:document.querySelector('#outlines').checked});const n=patches(axial)[0]?.length;if(n)totals[n]=(totals[n]??0)+1;}
 polygon(scene,corners.map(p=>add(p,position(selected))),{class:'selected'});
 for(const [text,at] of [['3-hex lake',[5.2,1.2]],['Single hex',[10.2,3.1]],['2-hex lake',[17.6,2.8]],['7-hex lake',[24.6,.7]],['Horizontal run',[18,9.4]],['Vertical run',[5.4,12]],['Island',[21.7,17.8]]]){const label=element('text',{x:at[0],y:at[1],class:'scene-label'});label.textContent=text;scene.append(label);}
 detail.replaceChildren();for(const d of directions)drawCell(detail,add(selected,d),position(d),{baseOnly:true,outline:true});drawCell(detail,selected,[0,0],{outline:true});polygon(detail,corners,{class:'selected'});
 const own=classification(selected),runs=patches(selected),n=runs[0]?.length??0;
 document.querySelector('#description').textContent=`Hex ${key(selected)} is originally ${own?'pale':'green'}. `+(n?`${n} consecutive ${runs[0].color?'pale':'green'} neighbors select ${n===6?'the full fill and circle':n===2?'the midpoint triangle':n===3?'the midpoint trapezoid':n===4?'the midpoint half-hex patch':'the midpoint notch patch'}.`:'No matching run of two or more: it remains an original hex.');
 if(triples.some(a=>key(a)===key(selected)))document.querySelector('#description').textContent+=' Each cell in this three-hex lake gets a green four-neighbor patch. The surrounding pale triangles are separate two-neighbor patches in green cells.';
 document.querySelector('#counts').textContent='Fixture: '+Object.entries(totals).map(([n,total])=>`${total} cells with rule ${n}`).join(' · ');
}
for(const input of document.querySelectorAll('input,select'))input.addEventListener('change',render);
document.querySelector('#reset').addEventListener('click',()=>{for(const input of document.querySelectorAll('input'))input.checked=true;view.value='patches';selected=triples[0];render();});render();
