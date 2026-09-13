import {makeGeometry,layouts,world,add,mul,dot,norm} from './geometry.mjs?v=circular-2';
import {makeArrangement} from './arrangements.mjs?v=gosper-1';
import {hexSphere} from './circular-projections.mjs';
import {construction,rearrangementFrame,sub,cross,mix,rotate} from './about-geometry.mjs?v=felv-paths-2';
export const projectionChoices=[['lambert-one','One hex'],['lambert-two','Two hexes'],['tetra','Tetrahedron'],['octa','Octahedron'],['rhombic','Rhombic dodecahedron'],['tetrakis','Tetrakis hexahedron']];
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const near=(a,b)=>Math.hypot(...sub(a,b))<1e-7;
const bounds=points=>{const center=[0,1,2].map(i=>(Math.min(...points.map(p=>p[i]))+Math.max(...points.map(p=>p[i])))/2);return {center,extent:Math.max(3.5,...[0,1].map(i=>Math.max(...points.map(p=>p[i]))-Math.min(...points.map(p=>p[i]))))};};
function subdivide(at,steps,list){for(let y=0;y<steps;y++)for(let x=0;x<steps-y;x++){const p=(i,j)=>at([1-(i+j)/steps,i/steps,j/steps]);list.push(p(x,y),p(x+1,y),p(x,y+1));if(x+y<steps-1)list.push(p(x+1,y),p(x+1,y+1),p(x,y+1));}}
const weighted=(p,w)=>p[0].map((_,j)=>w.reduce((s,x,i)=>s+x*p[i][j],0));
export function otherConstruction(method){
 if(method.startsWith('lambert-'))return circularConstruction(method);
 const rhombicReference=method==='tetrakis'?construction():null,comparisonFrame=rhombicReference?rearrangementFrame(rhombicReference):null;
 const tiles=makeGeometry(method,method==='tetrakis'?1+Math.sqrt(2):1.5),net=makeArrangement(tiles,'dymaxion',layouts(tiles)).net,faces=[];
 // Six equilateral triangles around each cube corner: Rus's non-convex solid.
 if(method==='tetrakis')for(const tile of tiles)for(const patch of tile.patches)patch.v=patch.v.map(p=>mul(p,Math.sqrt(3)/2));
 for(const tile of tiles)for(const patch of tile.patches){
  let n=norm(cross(sub(patch.v[1],patch.v[0]),sub(patch.v[2],patch.v[0])));if(dot(n,patch.v[0])<0)n=mul(n,-1);
  faces.push({v:patch.v,xy:patch.xy.map(p=>[...world(p,net.find(t=>t.id===tile.id)),0]),n,tile:tile.id});
 }
 const links=faces.map(()=>[]),physical=faces.map(()=>[]);
 for(let i=0;i<faces.length;i++)for(let j=0;j<i;j++){
  const shared=faces[i].v.flatMap((p,a)=>faces[j].v.flatMap((q,b)=>near(p,q)?[[a,b]]:[]));
  if(shared.length!==2)continue;
  physical[i].push({other:j,edge:shared.map(p=>p[0])});physical[j].push({other:i,edge:shared.map(p=>p[1])});
  if(shared.every(([a,b])=>near(faces[i].xy[a],faces[j].xy[b]))){links[i].push(j);links[j].push(i);}
 }
 const order=[0];faces[0].parent=-1;
 // Fully connect each region first; then cross its retained border into the next region.
 function visit(i){for(const j of [...links[i]].sort((a,b)=>Number(faces[b].tile===faces[i].tile)-Number(faces[a].tile===faces[i].tile)))if(faces[j].parent===undefined){faces[j].parent=i;order.push(j);visit(j);}}
 visit(0);if(order.length!==faces.length)throw Error('Disconnected construction');
 const origin=faces[0].v[0],u=norm(sub(faces[0].v[1],origin)),n=faces[0].n,v=cross(n,u),d=sub(faces[0].xy[1],faces[0].xy[0]),angle=Math.atan2(d[1],d[0]);
 const frame=p=>{const q=sub(p,origin);return rotate([dot(q,u),dot(q,v),dot(q,n)],[0,0,1],angle);};
 const transforms=t=>{
  const result=[p=>p];for(const i of order.slice(1)){const f=faces[i],parent=faces[f.parent],base=result[f.parent],edge=f.v.filter(p=>parent.v.some(q=>near(p,q))),axis=norm(sub(edge[1],edge[0])),angle=Math.atan2(dot(axis,cross(f.n,parent.n)),dot(f.n,parent.n));result[i]=p=>base(add(edge[0],rotate(sub(p,edge[0]),axis,angle*t)));}return result;
 };
 const scale=method==='tetra'?1.7:method==='octa'?Math.sqrt(2/3):Math.sqrt(3),offset=faces[0].xy[0];
 faces.forEach(f=>f.adjusted=f.xy.map(p=>mul(sub(p,offset),scale)));
 const samples=[],edges=[],cuts=[],markers=[],marked=new Set();
 faces.forEach((f,id)=>{
  const at=w=>{const p=weighted(f.v,w);return {f:id,w,p,earth:rhombicReference?rhombicReference.geography(p):p};};subdivide(at,16,samples);
  if(method==='tetra')f.v.forEach((p,j)=>{const key=f.tile+':'+p.join(',');if(Math.abs(Math.hypot(...p)-1)<1e-8&&!marked.has(key)){marked.add(key);markers.push(at([0,1,2].map(i=>i===j?1:0)));}});
  for(let e=0;e<3;e++){
   const partner=physical[id].find(p=>p.edge.includes(e)&&p.edge.includes((e+1)%3));
   const coplanar=partner&&dot(f.n,faces[partner.other].n)>1-1e-7;
   if(coplanar&&links[id].includes(partner.other))continue;
   const list=coplanar?cuts:edges;
   for(let j=0;j<16;j++)for(const t of [j/16,(j+1)/16])list.push(at([0,1,2].map(i=>i===e?1-t:i===(e+1)%3?t:0)));
  }
 });
 const tetra=method==='tetra';
 const names=tetra?['Sphere','Unfold']:['Sphere','Project','Unfold'];
 const captions=tetra?['Dots mark the three edge midpoints of each spherical tetrahedral region.','Each curved region opens directly into a hexagon; its edge midpoints become three of the corners.']:method==='octa'?['Earth divided along eight triangular faces.','Project the continents onto an octahedron.','The cut faces unfold directly into four regular hexagons.']:['Earth divided along 24 triangular faces.','Project onto a non-convex tetrakis hexahedron with equilateral faces.','Six equilateral triangles unfold into each hexagon, without stretching.'];
 return {names,captions,rotationEnd:tetra?1:2,mesh:{samples,edges,cuts,markers},faces,transforms,
  frame(value){const unfold=smooth(value-(tetra?0:1)),project=smooth(value),tr=transforms(unfold),corners=faces.map((f,i)=>f.v.map(p=>frame(tr[i](p))));
   const orient=p=>rhombicReference?rotate(p,[0,0,1],unfold*2*Math.PI/3):p;
   const point=s=>tetra?mix(frame(mul(norm(s.p),1.75)),weighted(faces[s.f].adjusted,s.w),unfold):orient(value<=1?frame(mix(mul(norm(s.p),rhombicReference?2:1.75),s.p,project)):weighted(corners[s.f],s.w));
   let framing=bounds(tetra?samples.map(point):value<=1?faces.flatMap((f,i)=>f.v.map((p,j)=>point({p,f:i,w:[0,1,2].map(k=>k===j?1:0)}))):corners.flat().map(orient));
   if(comparisonFrame)framing={center:mix(framing.center,comparisonFrame.center,unfold),extent:framing.extent+(comparisonFrame.extent-framing.extent)*unfold};
   return {point,...framing,settle:unfold,cutOpacity:tetra?0:unfold};
  }};
}

function circularConstruction(method){
 const diskRadius=2*Math.sqrt(3*Math.sqrt(3)/(2*Math.PI));
 const mode=method==='lambert-one'?1:2,tiles=makeGeometry(method),net=layouts(tiles)[0],samples=[],edges=[];
 for(const tile of tiles)for(const patch of tile.patches){
  const placement=net.find(t=>t.id===tile.id);
  const at=w=>{const xy=weighted(patch.xy,w),p=hexSphere(xy,mode,tile.id),u=Math.sqrt(Math.max(0,(1-(tile.id?-p[2]:p[2]))/(mode===1?2:1))),phi=Math.atan2(tile.id?-p[1]:p[1],p[0]);
   const diskLocal=[diskRadius*u*Math.cos(phi),diskRadius*u*Math.sin(phi)],disk=world(diskLocal,{...placement,x:placement.x*2.5,y:placement.y*2.5}),adjusted=world(xy,{...placement,x:placement.x,y:placement.y});
   // At the full-sphere antipode phi is undefined; recover it from the hexagonal wedge.
   if(mode===1&&u>.999999){const theta=Math.atan2(xy[1],xy[0]),beta=(Math.floor(theta/(Math.PI/3))+.5)*Math.PI/3,phi=beta+Math.PI/(2*Math.sqrt(3))*Math.tan(theta-beta),q=world([diskRadius*Math.cos(phi),diskRadius*Math.sin(phi)],placement);disk[0]=q[0];disk[1]=q[1];}
   return {p,earth:p,disk:[...disk,0],adjusted:[...mul(adjusted,2),0]};};
  subdivide(at,32,samples);
  for(let j=0;j<32;j++)for(const t of [j/32,(j+1)/32])edges.push(at([0,1-t,t]));
 }
 return {rotationEnd:1,names:['Sphere','Project','Adjust'],captions:[mode===1?'The whole Earth, centered on the north pole.':'Earth divided into northern and southern hemispheres.',mode===1?'Lambert equal-area projection opens the sphere into a disk.':'Lambert equal-area projection opens each hemisphere into a disk.',mode===1?'An area-preserving transformation reshapes the disk into one hexagon.':'An area-preserving transformation reshapes the disks into two joined hexagons.'],mesh:{samples,edges,cuts:[]},frame(value){const project=smooth(value),adjust=smooth(value-1),point=s=>value<=1?mix(mul(s.p,1.75),s.disk,project):mix(s.disk,s.adjusted,adjust);return {point,...bounds(samples.map(point)),settle:project,cutOpacity:0};}};
}
