// The history poster: the period's routes drawn as still lines, its site and
// area labels on the map, and one text box per spot standing outside the map
// with a straight-then-diagonal leader to the spot. Boxes have no background,
// only a rule on the side the leader leaves from. Sizes are pixels for a map
// 800 px wide and scale with the map, so posters look alike at any zoom.
export const posterType=Object.freeze({body:8,title:13.5,legend:7.4,note:7.2,heading:26,date:9,appTitle:34,subtitle:8.2,credit:9.5,url:8,site:9.5,area:19,lineHeight:1.35});
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
export function placeLabels(labels,{scale=1,labelScale=1,measure,avoid={xs:[],ys:[]},obstacles=[]}){
 const k=scale*labelScale,T=posterType,placed=[],boxes=[...obstacles];
 // A name may not cover another, nor lie across a line it must avoid (the gutters of a wall of posts).
 const overlaps=box=>boxes.some(b=>box[0]<b[2]&&b[0]<box[2]&&box[1]<b[3]&&b[1]<box[3])||avoid.xs.some(x=>box[0]<x&&x<box[2])||avoid.ys.some(y=>box[1]<y&&y<box[3]);
 const site=labels.filter(l=>l.kind==='site'),area=labels.filter(l=>l.kind!=='site');
 // Every dot stands before any name is placed, so no later dot lands on an earlier name.
 for(const label of site)boxes.push([label.x-7*k,label.y-7*k,label.x+7*k,label.y+7*k]);
 for(const label of site){
  const text=label.text.toUpperCase(),font=`700 ${(T.site*k).toFixed(2)}px ${posterFonts.sans}`;
  const width=measure(text,font)+.09*T.site*k*text.length,height=14*k,gap=11*k;
  const tries=[{align:'left',tx:label.x+gap,ty:label.y},{align:'right',tx:label.x-gap,ty:label.y},{align:'left',tx:label.x+gap*.6,ty:label.y-height},{align:'left',tx:label.x+gap*.6,ty:label.y+height},{align:'right',tx:label.x-gap*.6,ty:label.y-height},{align:'right',tx:label.x-gap*.6,ty:label.y+height}];
  const fit=tries.find(t=>!overlaps(t.align==='left'?[t.tx,t.ty-height/2,t.tx+width,t.ty+height/2]:[t.tx-width,t.ty-height/2,t.tx,t.ty+height/2]));
  if(fit)boxes.push(fit.align==='left'?[fit.tx,fit.ty-height/2,fit.tx+width,fit.ty+height/2]:[fit.tx-width,fit.ty-height/2,fit.tx,fit.ty+height/2]);
  placed.push({...label,text,...(fit||{tx:null,ty:null,align:'left'})});
 }
 for(const label of area){
  const font=`italic 500 ${(T.area*k).toFixed(2)}px ${posterFonts.serif}`,width=measure(label.text,font)+.02*T.area*k*label.text.length,height=T.area*k*1.1;
  const fit=[0,-1,1,-2,2,-3,3].map(step=>label.y+step*height*1.1).find(ty=>!overlaps([label.x-width/2,ty-height/2,label.x+width/2,ty+height/2]));
  if(fit===undefined)continue;
  boxes.push([label.x-width/2,fit-height/2,label.x+width/2,fit+height/2]);placed.push({...label,tx:label.x,ty:fit,align:'center'});
 }
 return placed;
}
// Lay the boxes out around the map. `map` is its bounding rectangle in poster
// units, each spot has its anchor in the same units and its texts, `measure`
// returns the width of a text in a font string, `scale` is map width / 800.
// How much of each story a box carries: everything, the title with the first sentence, or titles only; the legend always.
export const posterTextLevels=Object.freeze(['full','brief','titles']);
// A sentence ends at . ! or ? followed by a space: never inside a number (2.8 million,
// the dot has no space after it) and never after an abbreviation such as c. 1400 or e.g.
const abbreviation=/(?:^|\s)(?:c|ca|cf|e\.g|i\.e|vs|St|Mt|no|fig)$/i;
export function sentences(text){
 const out=[];let start=0;const re=/[.!?]+(?=\s+\S|$)/g;let m;
 while((m=re.exec(text))){if(abbreviation.test(text.slice(0,m.index)))continue;const end=m.index+m[0].length;out.push(text.slice(start,end));start=end;}
 if(start<text.length)out.push(text.slice(start));
 return out;
}
export const firstSentence=text=>sentences(text)[0]?.trim()||text;
// The brief form: whole sentences from the start of the first paragraph until about 160 characters, two or three lines under the title.
export function briefText(text,limit=160){
 let out='';
 for(const sentence of sentences(text)){if(out&&(out+sentence).trim().length>limit)break;out+=sentence;}
 return out.trim()||text;
}
export function posterLayout({map,spots,labels=[],scale=1,measure,heading=null,credit=null,reservedRight=0,labelScale=1,aspect=null,text='full',wall=null,pieces=[]}){
 const k=scale,T=posterType,mapWidth=map.right-map.left;
 const gap=mapWidth*.05,margin=mapWidth*.04,lead=T.lineHeight;
 const headBand=heading?T.heading*k*1.15+T.date*k*1.6+margin:margin;
 const styles={title:{face:'serif',size:T.title},body:{face:'serif',size:T.body},legend:{face:'sans',size:T.legend},note:{face:'serif',size:T.note,italic:true,color:'#5d727a'}};
 const rulePad=T.body*k,swatch=T.legend*k*2.2,spacing=T.body*k*2.2;
 const textMeasure=(base)=>(text,run)=>measure(text,fontFor({...base,bold:run.bold,italic:run.italic||base.italic},k));
 // The text of every story wrapped to a column width; the band below the map starts a little under its rule.
 const build=(column,band)=>spots.map(spot=>{
  const textWidth=band==='wall'?column-rulePad:band?column:column-rulePad,lines=[];let y=band?rulePad*.9:0;
  const push=(items,style,extra={})=>{const size=style.size*k;y+=size;lines.push({y,items,style,...extra});y+=size*(lead-1);};
  for(const line of wrapRuns([{text:spot.title,bold:false}],textWidth,textMeasure(styles.title)))push(line,styles.title);
  y+=T.body*k*.35;
  const paragraphs=text==='titles'?[]:text==='brief'?(spot.paragraphs||[]).slice(0,1).map(p=>briefText(p)):spot.paragraphs||[];
  for(const paragraph of paragraphs){
   for(const line of wrapRuns(markdownRuns(paragraph),textWidth,textMeasure(styles.body)))push(line,styles.body);
   y+=T.body*k*.45;
  }
  for(const entry of spot.legend||[]){
   const wrapped=wrapRuns(markdownRuns(entry.text),textWidth-swatch-T.legend*k*.6,textMeasure(styles.legend));
   wrapped.forEach((line,i)=>push(line,styles.legend,{indent:swatch+T.legend*k*.6,swatch:i===0?entry.color:null}));
  }
  if(spot.note&&text==='full'){y+=T.body*k*.35;for(const line of wrapRuns(markdownRuns(spot.note),textWidth,textMeasure(styles.note)))push(line,styles.note);}
  return {id:spot.id,anchor:[spot.x,spot.y],height:band==='wall'?y+rulePad*.9:y,lines,width:column};
 });
 const top=map.top-headBand;
 const anchorDots=spots.map(s=>[s.x-5*k,s.y-5*k,s.x+5*k,s.y+5*k]);
 const finish=(boxes,left,right,bottom,posterTop=top,pad=margin,avoid={xs:[],ys:[]},headingAt=null,creditAt=null)=>({left,top:posterTop,right,bottom,width:right-left,height:bottom-posterTop,map,scale:k,labels:placeLabels(labels,{scale:k,labelScale,measure,avoid,obstacles:anchorDots}),heading:heading?{x:headingAt?headingAt[0]:left+pad,y:(headingAt?headingAt[1]:posterTop+pad)+(heading.title?T.appTitle:T.heading)*k,label:heading.label,date:heading.date,title:!!heading.title}:null,credit:credit&&creditAt?{x:creditAt[0],y:creditAt[1]+T.credit*k,name:credit.name,url:credit.url}:null,boxes,labelScale});
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
 // Free placement: on an Instagram wall (the poster is the wall itself) or on a page of a given
 // shape (one cell, five columns of candidate positions, narrower boxes). The map spans the wall's
 // width, centred, and every story box takes a free place: inside one post, clear of the map pieces, the heading,
 // the place names, the other boxes and their leaders, nearest its spot. The empty corners around
 // the net and the notches between pieces are used first by nearness; when nothing fits, the wall
 // grows around the map until it does. So no text is ever cut by the grid.
 const rectHit=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
 const segmentHitsRect=(p,q,r)=>{
  if(rectHit([Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1])],r)===false)return false;
  const inside=v=>v[0]>r[0]&&v[0]<r[2]&&v[1]>r[1]&&v[1]<r[3];if(inside(p)||inside(q))return true;
  const corners=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]],cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];if(cross(p,q,a)*cross(p,q,b)<0&&cross(a,b,p)*cross(a,b,q)<0)return true;}
  return false;
 };
 const polygonHitsRect=(polygon,r)=>{
  const box=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]],axes=[[1,0],[0,1],...polygon.map((p,i)=>{const q=polygon[(i+1)%polygon.length];return [p[1]-q[1],q[0]-p[0]];})];
  for(const [x,y] of axes){const a=polygon.map(p=>p[0]*x+p[1]*y),b=box.map(p=>p[0]*x+p[1]*y);if(Math.max(...a)<Math.min(...b)||Math.max(...b)<Math.min(...a))return false;}
  return polygon.length>2;
 };
 const wallLayout=wall=>{
  // A wall without stories keeps only a slim margin, so the map takes as much of the posts as it can.
  const W=wall.columns*wall.tile.width,H=wall.rows*wall.tile.height,padW=wall.tile.width*(spots.length?.05:.02),mapHeight=map.bottom-map.top;
  const obstaclesOf=pieces.length?pieces:[[[map.left,map.top],[map.right,map.top],[map.right,map.bottom],[map.left,map.bottom]]];
  // The map fills the wall's width, or its height when the map is the taller shape (a turned net, a 3 × 1 wall).
  let s=Math.min((W-2*padW)/mapWidth,(H-2*padW)/mapHeight),last=null;
  for(let attempt=0;attempt<16;attempt++,s*=.94){
   const tw=wall.tile.width/s,th=wall.tile.height/s,pad=padW/s,Wc=W/s,Hc=H/s;
   if(Hc<mapHeight+2*pad)continue;
   const originX=map.left-(Wc-mapWidth)/2,originY=map.top-(Hc-mapHeight)/2;
   const cells=[];for(let r=0;r<wall.rows;r++)for(let c=0;c<wall.columns;c++)cells.push([originX+c*tw+pad,originY+r*th+pad,originX+(c+1)*tw-pad,originY+(r+1)*th-pad]);
   // On a wall the gutters between posts are lines nothing may cross; a page has none.
   const avoid=wall.page?{xs:[],ys:[]}:{xs:Array.from({length:wall.columns-1},(_,i)=>originX+(i+1)*tw),ys:Array.from({length:wall.rows-1},(_,i)=>originY+(i+1)*th)};
   const clearOfMap=r=>!obstaclesOf.some(poly=>polygonHitsRect(poly,[r[0]-pad*.4,r[1]-pad*.4,r[2]+pad*.4,r[3]+pad*.4]));
   // `taken` keeps boxes off everything; `blocks` (the fixed blocks and the boxes) is what a leader may not cross.
   const taken=[],blocks=[];
   // Fixed blocks take a free corner of a corner cell: the heading from the top left, the credit from the bottom right.
   const corner=(cell,w,h,at)=>at==='tl'?[cell[0],cell[1],cell[0]+w,cell[1]+h]:at==='tr'?[cell[2]-w,cell[1],cell[2],cell[1]+h]:at==='bl'?[cell[0],cell[3]-h,cell[0]+w,cell[3]]:[cell[2]-w,cell[3]-h,cell[2],cell[3]];
   const cornerCells={tl:cells[0],tr:cells[wall.columns-1],bl:cells[cells.length-wall.columns],br:cells[cells.length-1]};
   const placeBlock=(w,h,order)=>{
    for(const at of order){const cell=cornerCells[at];for(const where of [at,...order.filter(o=>o!==at)]){const r=corner(cell,w,h,where);if(r[0]>=cell[0]-1e-6&&r[2]<=cell[2]+1e-6&&clearOfMap(r)&&!taken.some(t=>rectHit(r,t))){taken.push(r);blocks.push(r);return r;}}}
    const r=corner(cornerCells[order[0]],w,h,order[0]);taken.push(r);blocks.push(r);return r;
   };
   let headingRect=null,creditRect=null;
   if(heading){
    const hw=heading.title?Math.max(measure(heading.label,`${(T.appTitle*k).toFixed(2)}px ${posterFonts.serif}`),measure(heading.date.toUpperCase(),`700 ${(T.subtitle*k).toFixed(2)}px ${posterFonts.sans}`)*1.2):Math.max(measure(heading.label,`${(T.heading*k).toFixed(2)}px ${posterFonts.serif}`),measure(heading.date.toUpperCase(),`700 ${(T.date*k).toFixed(2)}px ${posterFonts.sans}`)*1.2);
    const hh=heading.title?T.appTitle*k*1.1+T.subtitle*k*1.8:T.heading*k*1.15+T.date*k*1.6;
    headingRect=placeBlock(hw,hh,['tl','tr','bl','br']);
   }
   if(credit){
    const cw=Math.max(measure(credit.name,`italic ${(T.credit*k).toFixed(2)}px ${posterFonts.serif}`),measure(credit.url.toUpperCase(),`700 ${(T.url*k).toFixed(2)}px ${posterFonts.sans}`)*1.2),ch=T.credit*k*1.2+T.url*k*1.6;
    creditRect=placeBlock(cw,ch,['br','bl','tr','tl']);
   }
   // Place names next, so boxes stay off them.
   const names=placeLabels(labels,{scale:k,labelScale,measure,avoid,obstacles:anchorDots});
   for(const l of names){const ls=labelScale;if(l.kind==='site'){taken.push([l.x-7*k*ls,l.y-7*k*ls,l.x+7*k*ls,l.y+7*k*ls]);if(l.tx!==null){const w=measure(l.text,`700 ${(T.site*k*ls).toFixed(2)}px ${posterFonts.sans}`)*1.1;taken.push(l.align==='left'?[l.tx,l.ty-7*k*ls,l.tx+w,l.ty+7*k*ls]:[l.tx-w,l.ty-7*k*ls,l.tx,l.ty+7*k*ls]);}}
    else{const w=measure(l.text,`italic 500 ${(T.area*k*ls).toFixed(2)}px ${posterFonts.serif}`);taken.push([l.tx-w/2,l.ty-T.area*k*ls*.55,l.tx+w/2,l.ty+T.area*k*ls*.55]);}}
   // Each story at two widths: the cell's width, or a narrower box that fits a corner or a notch.
   const wide=build(tw-2*pad,'wall'),narrow=build((tw-2*pad)*.62,'wall'),boxes=wide,leaders=[];let failed=false;
   // The box's rule faces its spot: on a side when the spot is beside it, along the top or bottom when above or below.
   const orient=(b,r)=>{
    const [x0,y0,x1,y1]=r,cx=(x0+x1)/2,ax=b.anchor[0],ay=b.anchor[1];
    if(ax<x0)return {side:'right',rule:x0,textX:x0+rulePad,align:'left',leader:leaderPath([x0,y0+Math.min((y1-y0)/2,T.title*k*lead*1.5)],b.anchor)};
    if(ax>x1)return {side:'left',rule:x1,textX:x1-rulePad,align:'right',leader:leaderPath([x1,y0+Math.min((y1-y0)/2,T.title*k*lead*1.5)],b.anchor)};
    if(ay<y0)return {side:'below',rule:y0,textX:x0,align:'left',leader:leaderPath([cx,y0],b.anchor,'vertical')};
    return {side:'above',rule:y1,textX:x0,align:'left',leader:leaderPath([cx,y1],b.anchor,'vertical')};
   };
   const leaderClear=path=>{for(let i=1;i<path.length;i++)for(const r of blocks)if(segmentHitsRect(path[i-1],path[i],r))return false;return true;};
   const leaderLength=path=>path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
   // The best free place for a story inside the given cells: nearest its spot, wide before narrow.
   const place=(index,cellList)=>{
    const b=boxes[index];let best=null;
    for(const variant of [b,narrow[index]])for(const [cellIndex,cell] of cellList){
     const w=variant.width;if(cell[2]-cell[0]<w-1e-6)continue;
     for(const x of [cell[0],cell[2]-w,(cell[0]+cell[2]-w)/2])for(let y=cell[1];y+variant.height<=cell[3]+1e-6;y+=th/24){
      const r=[x,y,x+w,y+variant.height];
      if(taken.some(t=>rectHit(r,t))||!clearOfMap(r))continue;
      const o=orient(variant,r);if(!leaderClear(o.leader))continue;
      if(leaders.some(path=>path.slice(1).some((p,i)=>segmentHitsRect(path[i],p,r))))continue;
      const cost=leaderLength(o.leader)+(variant===b?0:variant.height*.5);if(!best||cost<best.cost)best={cost,r,o,variant,cell:cellIndex};
     }
    }
    return best;
   };
   const commit=(index,best)=>{const b=boxes[index];Object.assign(b,{lines:best.variant.lines,height:best.variant.height,width:best.variant.width,x:best.r[0],y:best.r[1],cell:best.cell},best.o);taken.push(best.r);blocks.push(best.r);leaders.push(best.o.leader);};
   const unplaced=new Set(boxes.keys());
   // With at least as many stories as cells, every cell gets one. Every story is tried in every
   // cell on the empty wall, then the cheapest story-to-cell pairs are taken first, so the total
   // length of the leaders stays short rather than the first cell grabbing the nearest story.
   if(boxes.length>=cells.length){
    const pairs=[];for(const index of boxes.keys())for(const [cellIndex,cell] of cells.entries()){const best=place(index,[[cellIndex,cell]]);if(best)pairs.push({index,cellIndex,cost:best.cost});}
    pairs.sort((a,b)=>a.cost-b.cost);const filled=new Set();
    for(const pair of pairs){
     if(filled.has(pair.cellIndex)||!unplaced.has(pair.index))continue;
     const best=place(pair.index,[[pair.cellIndex,cells[pair.cellIndex]]]);if(!best)continue;
     commit(pair.index,best);unplaced.delete(pair.index);filled.add(pair.cellIndex);
    }
   }
   // The rest, tallest first, wherever they fit best.
   for(const index of [...unplaced].sort((a,b)=>boxes[b].height-boxes[a].height)){const best=place(index,[...cells.entries()]);if(!best){failed=true;continue;}commit(index,best);}
   const result=finish(boxes,originX,originX+Wc,originY+Hc,originY,pad,avoid,headingRect&&[headingRect[0],headingRect[1]],creditRect&&[creditRect[0],creditRect[1]]);
   result.cells=cells.map((cell,i)=>({rect:cell,boxes:boxes.filter(b=>b.cell===i).map(b=>b.id)}));
   if(!failed)return result;last=result;
  }
  // No attempt found room for every story: keep the boxes that found a place and name the rest,
  // rather than drawing boxes that have no place.
  if(last){last.dropped=last.boxes.filter(b=>b.x===undefined).map(b=>b.id);last.boxes=last.boxes.filter(b=>b.x!==undefined);}
  return last;
 };
 if(wall)return wallLayout(wall);
 if(!aspect||!spots.length)return side();
 // A page of a known shape (PDF, PNG) is laid out as a wall of three by two cells without gutters: the
 // same rule as the Instagram grid, so the text is spread across the space, one story per cell when
 // there are enough.
 return wallLayout({columns:3,rows:2,tile:{width:aspect*1000/3,height:500},page:true})||side();
}
// An arrowhead at the end of a one-way route: a filled triangle along the last segment.
const arrowhead=(ctx,points,size)=>{
 const n=points.length,[tx,ty]=points[n-1],[px,py]=points[n-2],a=Math.atan2(ty-py,tx-px),c=Math.cos(a),si=Math.sin(a);
 ctx.beginPath();ctx.moveTo(tx+c*size*.6,ty+si*size*.6);ctx.lineTo(tx-c*size*.7-si*size*.55,ty-si*size*.7+c*size*.55);ctx.lineTo(tx-c*size*.7+si*size*.55,ty-si*size*.7-c*size*.55);ctx.closePath();ctx.fill();
};
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
  if(route.arrow){ctx.fillStyle='#213e46';arrowhead(ctx,route.points,route.width*1.5+2*k);}
 }
 for(const route of routes){
  if(route.points.length<2)continue;
  ctx.globalAlpha=route.alpha??1;ctx.strokeStyle=route.color;ctx.lineWidth=route.width;
  ctx.beginPath();route.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  if(route.arrow){ctx.fillStyle=route.color;arrowhead(ctx,route.points,route.width*1.5+1.5*k);}
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
  const big=layout.heading.title,size=big?T.appTitle:T.heading,sub=big?T.subtitle:T.date;
  ctx.font=`${(size*k).toFixed(2)}px ${posterFonts.serif}`;ctx.letterSpacing=`${(-.04*size*k).toFixed(2)}px`;ctx.fillText(layout.heading.label,layout.heading.x,layout.heading.y);
  ctx.font=`700 ${(sub*k).toFixed(2)}px ${posterFonts.sans}`;ctx.letterSpacing=`${(.16*sub*k).toFixed(2)}px`;ctx.fillText(layout.heading.date.toUpperCase(),layout.heading.x,layout.heading.y+sub*k*(big?2:1.7));ctx.letterSpacing='0px';
 }
 if(layout.credit){
  // The signature and the address, as on the site's title band.
  ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.font=`italic ${(T.credit*k).toFixed(2)}px ${posterFonts.serif}`;ctx.letterSpacing='0px';ctx.fillText(layout.credit.name,layout.credit.x,layout.credit.y);
  ctx.font=`700 ${(T.url*k).toFixed(2)}px ${posterFonts.sans}`;ctx.letterSpacing=`${(.16*T.url*k).toFixed(2)}px`;ctx.fillText(layout.credit.url.toUpperCase(),layout.credit.x,layout.credit.y+T.url*k*1.6);ctx.letterSpacing='0px';
 }
 for(const box of layout.boxes){
  // Leader with a pale halo where it crosses the map, then the anchor dot.
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3*k;ctx.beginPath();box.leader.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.strokeStyle=ink;ctx.lineWidth=.9*k;ctx.beginPath();box.leader.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.beginPath();ctx.arc(box.anchor[0],box.anchor[1],4.4*k,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();
  ctx.beginPath();ctx.arc(box.anchor[0],box.anchor[1],2.8*k,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
  // The rule: along the box's inner side, or across its top when it stands under the map.
  ctx.strokeStyle=ink;ctx.lineWidth=1.1*k;ctx.lineCap='butt';ctx.beginPath();
  if(box.side==='below'){ctx.moveTo(box.x,box.y);ctx.lineTo(box.x+box.width,box.y);}else if(box.side==='above'){ctx.moveTo(box.x,box.y+box.height);ctx.lineTo(box.x+box.width,box.y+box.height);}else{ctx.moveTo(box.rule,box.y);ctx.lineTo(box.rule,box.y+box.height);}
  ctx.stroke();ctx.lineCap='round';
  ctx.textBaseline='alphabetic';
  for(const line of box.lines){
   const y=box.y+line.y,indent=line.indent||0;
   const pieces=line.items.map(({text,run})=>({text,font:fontFor({...line.style,bold:run.bold,italic:run.italic||line.style.italic},k)}));
   let width=0;for(const piece of pieces){ctx.font=piece.font;piece.width=ctx.measureText(piece.text).width;width+=piece.width;}
   if(line.swatch){
    // The swatch sits just before the text: at the indent for left-aligned text, before the line's start when right-aligned.
    const x0=box.align==='left'?box.textX:box.textX-width-indent+T.legend*k*.3,x1=x0+T.legend*k*2.2,sy=y-line.style.size*k*.35;
    ctx.lineWidth=2.4*k;ctx.strokeStyle='#213e46';ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();ctx.globalAlpha=1;
    ctx.lineWidth=1.6*k;ctx.strokeStyle=line.swatch;ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();
   }
   let x=box.align==='left'?box.textX+indent:box.textX-width;
   ctx.textAlign='left';ctx.fillStyle=line.style.color||ink;
   for(const piece of pieces){ctx.font=piece.font;ctx.fillText(piece.text,x,y);x+=piece.width;}
  }
 }
 ctx.restore();
}
