// Approximate spherical coastline clearance on a wrapped latitude/longitude grid.
// Eight-neighbor shortest paths use latitude-adjusted angular edge lengths.
export function clearanceField(mask,width,height,w=720,h=360){
 const land=new Uint8Array(w*h),distance=new Float64Array(w*h).fill(Infinity);
 // Conservative downsampling retains small islands from the source image.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x])land[Math.floor(y*h/height)*w+Math.floor(x*w/width)]=1;
 const heap=[];
 function push(i,d){let j=heap.length;heap.push([i,d]);while(j){const p=(j-1)>>1;if(heap[p][1]<=d)break;heap[j]=heap[p];j=p;}heap[j]=[i,d];}
 function pop(){const result=heap[0],last=heap.pop();if(heap.length){let j=0;while(j*2+1<heap.length){let c=j*2+1;if(c+1<heap.length&&heap[c+1][1]<heap[c][1])c++;if(heap[c][1]>=last[1])break;heap[j]=heap[c];j=c;}heap[j]=last;}return result;}
 const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
 for(let i=0;i<land.length;i++)if(land[i]){distance[i]=0;const x=i%w,y=Math.floor(i/w);if(dirs.some(([dx,dy])=>y+dy>=0&&y+dy<h&&!land[(y+dy)*w+(x+dx+w)%w]))push(i,0);}
 while(heap.length){const [i,d]=pop();if(d>distance[i])continue;const x=i%w,y=Math.floor(i/w);
  for(const [dx,dy] of dirs){const yy=y+dy;if(yy<0||yy>=h)continue;const j=yy*w+(x+dx+w)%w;
   const latitude=(90-(y+yy+1)*90/h)*Math.PI/180;
   const cost=Math.hypot(dy*180/h,dx*360/w*Math.cos(latitude)),next=d+cost;
   if(next<distance[j]){distance[j]=next;push(j,next);}
  }
 }
 return {distance,width:w,height:h};
}
export function clearanceMask(distance,degrees){return Uint8Array.from(distance,d=>d<=degrees?1:0);}
