// The history poster: the period's routes drawn as still lines, its site and
// area labels on the map, and one text box per spot standing outside the map
// with a straight-then-diagonal leader to the spot. Boxes have no background,
// only a rule on the side the leader leaves from. Sizes are pixels for a map
// 800 px wide and scale with the map, so posters look alike at any zoom.
export const posterType=Object.freeze({body:8,title:13.5,legend:7.4,note:7.2,heading:26,date:9,site:9.5,area:19,lineHeight:1.35});
export const posterFonts=Object.freeze({
 serif:'Baskerville,"Libre Baskerville","Baskerville Old Face",Georgia,"Times New Roman",serif',
 sans:'Gotham,"Gotham SSm",Montserrat,"Proxima Nova","Avenir Next",Avenir,"Helvetica Neue",Arial,sans-serif',
});
export const posterInk='#193c49';
const fontFor=(style,k)=>`${style.italic?'italic ':''}${style.bold?'700 ':''}${(style.size*k).toFixed(2)}px ${posterFonts[style.face]}`;
// The limited Markdown of the period texts as styled runs; links keep their text.
export function markdownRuns(text){
 return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g).filter(Boolean).map(token=>{
  const link=token.match(/^\[([^\]]+)\]\(https:\/\/[^\s)]+\)$/);if(link)return {text:link[1]};
  if(token.startsWith('**')&&token.endsWith('**')&&token.length>4)return {text:token.slice(2,-2),bold:true};
  if(token.startsWith('*')&&token.endsWith('*')&&token.length>2)return {text:token.slice(1,-1),italic:true};
  return {text:token};
 });
}
// Greedy word wrap across styled runs; `measure(text,run)` gives a width.
export function wrapRuns(runs,maxWidth,measure){
 const words=[];
 for(const run of runs)for(const part of run.text.split(/(\s+)/))if(part)words.push({text:part,run,space:/^\s+$/.test(part)});
 const lines=[];let line=[],width=0;
 const trim=()=>{while(line.length&&line.at(-1).space){width-=measure(line.at(-1).text,line.at(-1).run);line.pop();}};
 for(const word of words){
  const wordWidth=measure(word.text,word.run);
  if(word.space){if(line.length){line.push(word);width+=wordWidth;}continue;}
  if(line.length&&width+wordWidth>maxWidth){trim();lines.push(line);line=[];width=0;}
  line.push(word);width+=wordWidth;
 }
 trim();if(line.length)lines.push(line);
 return lines.map(items=>items.map(({text,run})=>({text,run})));
}
// A straight-then-diagonal leader from the rule to the anchor: horizontal out of
// the box then 45° to the point, or 45° then vertical when the point is more
// above or below than beside.
export function leaderPath(from,to,leave='horizontal'){
 const dx=to[0]-from[0],dy=to[1]-from[1],sx=Math.sign(dx)||1,sy=Math.sign(dy)||1;
 if(leave==='vertical'){
  // Out of the top of a box: straight up then 45°, or 45° then level when the point is more beside than above.
  if(Math.abs(dx)<=Math.abs(dy))return [from,[from[0],to[1]-sy*Math.abs(dx)],to];
  return [from,[from[0]+sx*Math.abs(dy),to[1]],to];
 }
 if(Math.abs(dy)<=Math.abs(dx))return [from,[to[0]-sx*Math.abs(dy),from[1]],to];
 return [from,[to[0],from[1]+sy*Math.abs(dx)],to];
}
// Every story's place names share the poster, so they are placed greedily: a
// site keeps its dot and tries its name to the right, left, above or below;
// an area name may slide up or down a little; what still collides is dropped.
export function placeLabels(labels,{scale=1,labelScale=1,measure}){
 const k=scale*labelScale,T=posterType,placed=[],boxes=[];
 const overlaps=box=>boxes.some(b=>box[0]<b[2]&&b[0]<box[2]&&box[1]<b[3]&&b[1]<box[3]);
 const site=labels.filter(l=>l.kind==='site'),area=labels.filter(l=>l.kind!=='site');
 for(const label of site){
  const dot=[label.x-7*k,label.y-7*k,label.x+7*k,label.y+7*k],text=label.text.toUpperCase(),font=`700 ${(T.site*k).toFixed(2)}px ${posterFonts.sans}`;
  const width=measure(text,font)+.09*T.site*k*text.length,height=14*k,gap=11*k;
  boxes.push(dot);
  const tries=[{align:'left',tx:label.x+gap,ty:label.y},{align:'right',tx:label.x-gap,ty:label.y},{align:'left',tx:label.x+gap*.6,ty:label.y-height},{align:'left',tx:label.x+gap*.6,ty:label.y+height}];
  const fit=tries.find(t=>!overlaps(t.align==='left'?[t.tx,t.ty-height/2,t.tx+width,t.ty+height/2]:[t.tx-width,t.ty-height/2,t.tx,t.ty+height/2]));
  if(fit)boxes.push(fit.align==='left'?[fit.tx,fit.ty-height/2,fit.tx+width,fit.ty+height/2]:[fit.tx-width,fit.ty-height/2,fit.tx,fit.ty+height/2]);
  placed.push({...label,text,...(fit||{tx:null,ty:null,align:'left'})});
 }
 for(const label of area){
  const font=`italic 500 ${(T.area*k).toFixed(2)}px ${posterFonts.serif}`,width=measure(label.text,font)+.02*T.area*k*label.text.length,height=T.area*k*1.1;
  const fit=[0,-1,1,-2,2].map(step=>label.y+step*height*1.1).find(ty=>!overlaps([label.x-width/2,ty-height/2,label.x+width/2,ty+height/2]));
  if(fit===undefined)continue;
  boxes.push([label.x-width/2,fit-height/2,label.x+width/2,fit+height/2]);placed.push({...label,tx:label.x,ty:fit,align:'center'});
 }
 return placed;
}
// Lay the boxes out around the map. `map` is its bounding rectangle in poster
// units, each spot has its anchor in the same units and its texts, `measure`
// returns the width of a text in a font string, `scale` is map width / 800.
export function posterLayout({map,spots,labels=[],scale=1,measure,heading=null,reservedRight=0,labelScale=1,aspect=null,bandColumns=3}){
 const k=scale,T=posterType,mapWidth=map.right-map.left;
 const gap=mapWidth*.05,margin=mapWidth*.04,lead=T.lineHeight;
 const headBand=heading?T.heading*k*1.15+T.date*k*1.6+margin:margin;
 const styles={title:{face:'serif',size:T.title},body:{face:'serif',size:T.body},legend:{face:'sans',size:T.legend},note:{face:'serif',size:T.note,italic:true,color:'#5d727a'}};
 const rulePad=T.body*k,swatch=T.legend*k*2.2,spacing=T.body*k*2.2;
 const textMeasure=(base)=>(text,run)=>measure(text,fontFor({...base,bold:run.bold,italic:run.italic||base.italic},k));
 // The text of every story wrapped to a column width; the band below the map starts a little under its rule.
 const build=(column,band)=>spots.map(spot=>{
  const textWidth=band?column:column-rulePad,lines=[];let y=band?rulePad*.9:0;
  const push=(items,style,extra={})=>{const size=style.size*k;y+=size;lines.push({y,items,style,...extra});y+=size*(lead-1);};
  for(const line of wrapRuns([{text:spot.title,bold:false}],textWidth,textMeasure(styles.title)))push(line,styles.title);
  y+=T.body*k*.35;
  for(const paragraph of spot.paragraphs||[]){
   for(const line of wrapRuns(markdownRuns(paragraph),textWidth,textMeasure(styles.body)))push(line,styles.body);
   y+=T.body*k*.45;
  }
  for(const entry of spot.legend||[]){
   const wrapped=wrapRuns(markdownRuns(entry.text),textWidth-swatch-T.legend*k*.6,textMeasure(styles.legend));
   wrapped.forEach((line,i)=>push(line,styles.legend,{indent:swatch+T.legend*k*.6,swatch:i===0?entry.color:null}));
  }
  if(spot.note){y+=T.body*k*.35;for(const line of wrapRuns(markdownRuns(spot.note),textWidth,textMeasure(styles.note)))push(line,styles.note);}
  return {id:spot.id,anchor:[spot.x,spot.y],height:y,lines,width:column};
 });
 const top=map.top-headBand;
 const finish=(boxes,left,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top,map,scale:k,labels:placeLabels(labels,{scale:k,labelScale,measure}),heading:heading?{x:left+margin,y:top+margin+T.heading*k,label:heading.label,date:heading.date}:null,boxes,labelScale});
 // Side layout: two columns beside the map, each box on the side of its spot.
 const side=()=>{
  const column=mapWidth*.3,boxes=build(column,false),bottom=map.bottom+margin;
  for(const b of boxes)b.side=b.anchor[0]<(map.left+map.right)/2?'left':'right';
  const columnTop=side=>top+headBand-(heading?margin*.5:0)+(side==='right'?reservedRight:0);
  // Balance the sides: a full column hands its box nearest the middle to the other side.
  const available=bottom-top-headBand;
  const tall=side=>boxes.filter(b=>b.side===side).reduce((sum,b)=>sum+b.height+spacing,0);
  for(let i=0;i<boxes.length;i++){
   const over=['left','right'].find(side=>tall(side)>available&&tall(side==='left'?'right':'left')<tall(side)-spacing);
   if(!over)break;
   const other=over==='left'?'right':'left',candidates=boxes.filter(b=>b.side===over).sort((a,b)=>Math.abs(a.anchor[0]-(map.left+map.right)/2)-Math.abs(b.anchor[0]-(map.left+map.right)/2));
   if(tall(other)+candidates[0].height+spacing>tall(over))break;
   candidates[0].side=other;
  }
  // Stack each column near its anchors; a column taller than the map lengthens the poster.
  let posterBottom=bottom;
  for(const side of ['left','right']){
   const list=boxes.filter(b=>b.side===side).sort((a,b)=>a.anchor[1]-b.anchor[1]);
   const start=columnTop(side);
   for(const b of list)b.y=Math.max(start,b.anchor[1]-b.height/2);
   for(let i=1;i<list.length;i++)list[i].y=Math.max(list[i].y,list[i-1].y+list[i-1].height+spacing);
   const end=list.length?list.at(-1).y+list.at(-1).height:start;
   if(end>bottom-margin){
    for(let i=list.length-1;i>=0;i--)list[i].y=Math.min(list[i].y,(i+1<list.length?list[i+1].y-spacing:bottom-margin)-list[i].height);
    for(let i=1;i<list.length;i++)list[i].y=Math.max(list[i].y,list[i-1].y+list[i-1].height+spacing);
    if(list.length&&list[0].y<start){const shift=start-list[0].y;for(const b of list)b.y+=shift;}
    posterBottom=Math.max(posterBottom,(list.length?list.at(-1).y+list.at(-1).height:bottom)+margin);
   }
  }
  // A side without boxes keeps only the margin, so a poster with all its stories on one side is not lopsided.
  const used=side=>boxes.some(b=>b.side===side);
  const left=used('left')?map.left-gap-column-margin:map.left-margin,right=used('right')?map.right+gap+column+margin:map.right+margin;
  for(const b of boxes){
   b.x=b.side==='left'?map.left-gap-column:map.right+gap;
   b.rule=b.side==='left'?b.x+column:b.x;
   b.textX=b.side==='left'?b.rule-rulePad:b.rule+rulePad;
   b.align=b.side==='left'?'right':'left';
   b.leader=leaderPath([b.rule,b.y+Math.min(b.height/2,T.title*k*lead*1.5)],b.anchor);
  }
  return finish(boxes,left,right,posterBottom);
 };
 // Band layout: the boxes in columns under the map, each with a rule along its top and a
 // leader rising to its spot; boxes are dealt to the columns in the order of their spots.
 const band=()=>{
  const n=Math.max(1,Math.min(bandColumns,spots.length||1)),column=(mapWidth-(n-1)*gap)/n,boxes=build(column,true);
  // Deal the boxes, in the order of their spots, to the column that stays shortest, leaning
  // toward the column under the spot so the leaders stay short.
  const columns=Array.from({length:n},()=>[]),heights=Array(n).fill(0),centre=c=>map.left+c*(column+gap)+column/2;
  for(const b of [...boxes].sort((a,b)=>a.anchor[0]-b.anchor[0])){
   const shortest=Math.min(...heights),near=[...heights.keys()].filter(c=>heights[c]<=shortest+b.height/2);
   const best=near.reduce((a,c)=>Math.abs(centre(c)-b.anchor[0])<Math.abs(centre(a)-b.anchor[0])?c:a,near[0]);
   columns[best].push(b);heights[best]+=b.height+spacing;
  }
  const bandTop=map.bottom+gap;let posterBottom=bandTop;
  columns.forEach((list,c)=>{
   let y=bandTop;
   list.forEach((b,row)=>{
    b.x=map.left+c*(column+gap);b.y=y;b.side='below';b.rule=b.y;b.textX=b.x;b.align='left';y+=b.height+spacing;
    if(!row)b.leader=leaderPath([b.x+column/2,b.y],b.anchor,'vertical');
    else{
     // A lower box's leader leaves the end of its rule at 45° into the gutter beside it, climbs the
     // gutter past the boxes above (one lane per row), and continues to the spot from above the band.
     const right=b.anchor[0]>b.x+column/2,x0=right?b.x+column:b.x,lane=gap/2+(row-1)*2.2*k,xg=right?x0+lane:x0-lane;
     const up=[xg,b.y-lane],top=[xg,bandTop-gap/2];
     b.leader=[[x0,b.y],up,top,...leaderPath(top,b.anchor,'vertical').slice(1)];
    }
   });
   posterBottom=Math.max(posterBottom,y-spacing);
  });
  return finish(boxes,map.left-margin,map.right+margin,(boxes.length?posterBottom:map.bottom)+margin);
 };
 if(!aspect||!spots.length)return side();
 const wide=side(),stacked=band(),fit=layout=>Math.abs(Math.log((layout.width/layout.height)/aspect));
 return fit(stacked)<fit(wide)?stacked:wide;
}
// Draw the poster in poster units on a context whose transform already maps them.
export function drawPoster(ctx,layout,{routes=[],labels=[],clip=[],ink=posterInk}={}){
 const k=layout.scale,T=posterType;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 // Routes stay inside the map pieces (parallel lanes must end at the cuts).
 if(clip.length){ctx.save();ctx.beginPath();for(const polygon of clip){polygon.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}ctx.clip();}
 // Routes as still lines: a dark halo keeps every colour readable on the map.
 for(const route of routes){
  if(route.points.length<2)continue;
  ctx.globalAlpha=(route.alpha??1)*.45;ctx.strokeStyle='#213e46';ctx.lineWidth=route.width+1.4*k;
  ctx.beginPath();route.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
 }
 for(const route of routes){
  if(route.points.length<2)continue;
  ctx.globalAlpha=route.alpha??1;ctx.strokeStyle=route.color;ctx.lineWidth=route.width;
  ctx.beginPath();route.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
 }
 ctx.globalAlpha=1;if(clip.length)ctx.restore();
 // Site and area labels as on screen: outlined text at half-transparent white.
 const ls=layout.labelScale||1;
 for(const label of layout.labels||labels){
  ctx.lineWidth=3*k*ls;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.fillStyle='#000';
  if(label.kind==='site'){
   ctx.beginPath();ctx.arc(label.x,label.y,7*k*ls,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();
   ctx.beginPath();ctx.arc(label.x,label.y,5*k*ls,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();
   if(label.tx===null)continue;
   ctx.font=`700 ${(T.site*k*ls).toFixed(2)}px ${posterFonts.sans}`;ctx.textAlign=label.align||'left';ctx.textBaseline='middle';ctx.letterSpacing=`${(.09*T.site*k*ls).toFixed(2)}px`;
   const text=label.text.toUpperCase(),tx=label.tx??label.x+11*k*ls,ty=label.ty??label.y;ctx.strokeText(text,tx,ty);ctx.fillText(text,tx,ty);ctx.letterSpacing='0px';
  }else{
   ctx.font=`italic 500 ${(T.area*k*ls).toFixed(2)}px ${posterFonts.serif}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.letterSpacing=`${(.02*T.area*k*ls).toFixed(2)}px`;
   const tx=label.tx??label.x,ty=label.ty??label.y;ctx.strokeText(label.text,tx,ty);ctx.fillText(label.text,tx,ty);ctx.letterSpacing='0px';
  }
 }
 if(layout.heading){
  ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.font=`${(T.heading*k).toFixed(2)}px ${posterFonts.serif}`;ctx.letterSpacing=`${(-.04*T.heading*k).toFixed(2)}px`;ctx.fillText(layout.heading.label,layout.heading.x,layout.heading.y);
  ctx.font=`700 ${(T.date*k).toFixed(2)}px ${posterFonts.sans}`;ctx.letterSpacing=`${(.16*T.date*k).toFixed(2)}px`;ctx.fillText(layout.heading.date.toUpperCase(),layout.heading.x,layout.heading.y+T.date*k*1.7);ctx.letterSpacing='0px';
 }
 for(const box of layout.boxes){
  // Leader with a pale halo where it crosses the map, then the anchor dot.
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3*k;ctx.beginPath();box.leader.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.strokeStyle=ink;ctx.lineWidth=.9*k;ctx.beginPath();box.leader.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.beginPath();ctx.arc(box.anchor[0],box.anchor[1],4.4*k,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();
  ctx.beginPath();ctx.arc(box.anchor[0],box.anchor[1],2.8*k,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
  // The rule: along the box's inner side, or across its top when it stands under the map.
  ctx.strokeStyle=ink;ctx.lineWidth=1.1*k;ctx.lineCap='butt';ctx.beginPath();
  if(box.side==='below'){ctx.moveTo(box.x,box.y);ctx.lineTo(box.x+box.width,box.y);}else{ctx.moveTo(box.rule,box.y);ctx.lineTo(box.rule,box.y+box.height);}
  ctx.stroke();ctx.lineCap='round';
  ctx.textBaseline='alphabetic';
  for(const line of box.lines){
   const y=box.y+line.y,indent=line.indent||0;
   if(line.swatch){
    const x0=box.align==='left'?box.textX:box.x+T.legend*k*.3,x1=x0+T.legend*k*2.2,sy=y-line.style.size*k*.35;
    ctx.lineWidth=2.4*k;ctx.strokeStyle='#213e46';ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();ctx.globalAlpha=1;
    ctx.lineWidth=1.6*k;ctx.strokeStyle=line.swatch;ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();
   }
   const pieces=line.items.map(({text,run})=>({text,font:fontFor({...line.style,bold:run.bold,italic:run.italic||line.style.italic},k)}));
   let width=0;for(const piece of pieces){ctx.font=piece.font;piece.width=ctx.measureText(piece.text).width;width+=piece.width;}
   let x=box.align==='left'?box.textX+indent:box.textX-width;
   ctx.textAlign='left';ctx.fillStyle=line.style.color||ink;
   for(const piece of pieces){ctx.font=piece.font;ctx.fillText(piece.text,x,y);x+=piece.width;}
  }
 }
 ctx.restore();
}
