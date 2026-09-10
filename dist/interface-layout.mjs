// Separating-axis test against the actual convex map pieces, not their bounds.
// This keeps a title visible in the open corners around hexagonal silhouettes.
export function polygonOverlapsRect(polygon,rect){
 const box=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];
 const axes=[[1,0],[0,1],...polygon.map((p,i)=>{const q=polygon[(i+1)%polygon.length];return [p[1]-q[1],q[0]-p[0]];})];
 for(const [x,y] of axes){
  const a=polygon.map(p=>p[0]*x+p[1]*y),b=box.map(p=>p[0]*x+p[1]*y);
  if(Math.max(...a)<Math.min(...b)||Math.max(...b)<Math.min(...a))return false;
 }
 return polygon.length>2;
}
