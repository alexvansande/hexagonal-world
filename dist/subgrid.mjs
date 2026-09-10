// Shared by the visible subhex grid, its dots, and the Tissot sampling centers.
export const gosperScale=1/Math.sqrt(7);
const gosperAngle=Math.atan(Math.sqrt(3)/5);
const ring=Array.from({length:6},(_,i)=>{const a=(i+.5)*Math.PI/3;return [Math.cos(a),Math.sin(a)];});
export function rotateLocal([x,y],angle){const c=Math.cos(angle),s=Math.sin(angle);return [c*x-s*y,s*x+c*y];}
export function nestedHexLevels(depth){
 const levels=[[{center:[0,0],scale:1,angle:0}]];
 for(let level=0;level<depth;level++)levels.push(levels[level].flatMap(parent=>{
  const scale=parent.scale*gosperScale,angle=parent.angle+(level%2===0?gosperAngle:-gosperAngle);
  return [[0,0],...ring].map(direction=>{
   const offset=rotateLocal(direction.map(v=>v*Math.sqrt(3)*scale),angle);
   return {center:parent.center.map((v,i)=>v+offset[i]),scale,angle};
  });
 }));
 return levels;
}
export const subgridLevels=nestedHexLevels(3);
