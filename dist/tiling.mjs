import {matching} from './geometry.mjs';
export const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const mod=(x,n)=>((x%n)+n)%n;
export const axial=(x,y)=>{const q=Math.round(x/1.5);return [q,Math.round(y/Math.sqrt(3)-q/2)];};
export function makeTiling(tiles,net){
 const seeds=net.map(t=>({...t,qr:axial(t.x,t.y)}));
 const size=Math.max(6,...[0,1].map(i=>Math.max(...seeds.map(t=>t.qr[i]))-Math.min(...seeds.map(t=>t.qr[i]))+4));
 const cells=Array(size*size).fill(null),fixed=new Set(),index=(q,r)=>mod(r,size)*size+mod(q,size);
 const pairs=tiles.map(t=>Array.from({length:6},(_,e)=>matching(tiles,t.id,e)));
 const agrees=(a,b,e)=>{const local=mod(e-a.r,6),pair=pairs[a.id][local];return pair.id===b.id&&mod(pair.e+b.r,6)===mod(e+3,6);};
 for(const s of seeds){const i=index(...s.qr);cells[i]={id:s.id,r:s.r};fixed.add(i);}
 const candidates=tiles.flatMap(t=>Array.from({length:6},(_,r)=>({id:t.id,r})));
 const score=(candidate,q,r)=>directions.reduce((sum,[dq,dr],e)=>{const other=cells[index(q+dq,r+dr)];return sum+(other&&agrees(candidate,other,e)?1:0);},0);
 // Grow from the chosen four-region net, then improve the periodic boundary joins.
 while(cells.some(c=>!c)){
  let target=-1,most=-1;for(let i=0;i<cells.length;i++)if(!cells[i]){const q=i%size,r=Math.floor(i/size),n=directions.filter(([dq,dr])=>cells[index(q+dq,r+dr)]).length;if(n>most){target=i;most=n;}}
  const q=target%size,r=Math.floor(target/size);let best=candidates[0],bestScore=-1;for(const c of candidates){const s=score(c,q,r);if(s>bestScore){best=c;bestScore=s;}}cells[target]={...best};
 }
 for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<cells.length;i++)if(!fixed.has(i)){const q=i%size,r=Math.floor(i/size);let best=cells[i],bestScore=score(best,q,r);for(const c of candidates){const s=score(c,q,r);if(s>bestScore){best=c;bestScore=s;}}if(best!==cells[i]){cells[i]={...best};changed=true;}}if(!changed)break;}
 for(let i=0;i<cells.length;i++){const q=i%size,r=Math.floor(i/size),c=cells[i];c.bad=directions.map(([dq,dr],e)=>!agrees(c,cells[index(q+dq,r+dr)],e));c.opacity=1;}
 return {size,cells,at:(q,r)=>cells[index(q,r)],agrees};
}
export function visibleTiles(tiling,{left,right,bottom,top}){
 const result=[];for(let q=Math.floor((left-1)/1.5);q<=Math.ceil((right+1)/1.5);q++){
  for(let r=Math.floor((bottom-1)/Math.sqrt(3)-q/2);r<=Math.ceil((top+1)/Math.sqrt(3)-q/2);r++){
   result.push({...tiling.at(q,r),q,s:r,x:q*1.5,y:Math.sqrt(3)*(r+q/2)});
  }
 }return result;
}
