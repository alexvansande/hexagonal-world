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

// Nominal area per smallest outlined subhex, using Earth's mean radius in km.
// Polyhedral projections are not equal-area; clipped edge cells may be partial.
export function subgridArea(method){
 const parents=method==='lambert-one'?1:method==='lambert-two'?2:4;
 const km2=4*Math.PI*6371.0088**2/(parents*49);
 return {km2,mi2:km2/2.589988110336};
}

export function dotGridArea(method){const {km2,mi2}=subgridArea(method);return {km2:km2/7,mi2:mi2/7};}
