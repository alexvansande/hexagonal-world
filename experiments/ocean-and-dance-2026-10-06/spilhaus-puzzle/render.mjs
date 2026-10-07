// Writes per-pixel lat/lon + piece index for a placement of pieces on the hex lattice.
import {readFileSync,writeFileSync} from 'node:fs';
import {localSphere,pieceLocal,geo,DEFAULT} from './core.mjs';
const FLIP=!!process.env.FLIP;const [level,which,out,size,turnDeg]=[+process.argv[2],process.argv[3],process.argv[4],+(process.argv[5]||2000),+(process.argv[6]??30)];
const {pieces}=JSON.parse(readFileSync(`edges${level}.json`));
const S3=Math.sqrt(3),e0=[S3*Math.cos(Math.PI/6),S3*Math.sin(Math.PI/6)],e1=[0,S3];
const phi=((pieces[0].netTurn%(Math.PI/3))+Math.PI/3)%(Math.PI/3);
const rot=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
let place; // [{p, a, b, k}]
if(which==='original'){
 place=pieces.map((pc,p)=>{const c=rot(pc.netCenter,-phi).map(v=>v/pc.scale);
  // solve c = a*e0 + b*e1
  const a=c[0]/e0[0],b=(c[1]-a*e0[1])/e1[1];return {p,a:Math.round(a),b:Math.round(b),k:0,err:Math.hypot(a-Math.round(a),b-Math.round(b))};});
 console.log('max lattice error',Math.max(...place.map(x=>x.err)).toFixed(6));
}else{const L=JSON.parse(readFileSync(which));place=L.pos.map(([a,b],i)=>({p:L.kept?L.kept[i]:i,a,b,k:L.rotations[i]}));}
const occ=new Map(place.map(x=>[x.a+','+x.b,x]));const pidOf=new Map(place.map((x,i)=>[x,x.p]));
const centres=place.map(x=>[x.a*e0[0]+x.b*e1[0],x.a*e0[1]+x.b*e1[1]]);
const xs=centres.map(c=>c[0]),ys=centres.map(c=>c[1]);
// bounds in screen frame after the turn
const turn=phi+turnDeg*Math.PI/180;const scr=centres.map(c=>rot(c,turn));
const minx=Math.min(...scr.map(c=>c[0]))-1.1,maxx=Math.max(...scr.map(c=>c[0]))+1.1,miny=Math.min(...scr.map(c=>c[1]))-1.1,maxy=Math.max(...scr.map(c=>c[1]))+1.1;
const scale=size/Math.max(maxx-minx,maxy-miny),W=Math.ceil((maxx-minx)*scale),H=Math.ceil((maxy-miny)*scale);
const lat=new Float32Array(W*H).fill(NaN),lon=new Float32Array(W*H),id=new Int16Array(W*H).fill(-1);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const s=[minx+(x+.5)/scale,FLIP?miny+(y+.5)/scale:maxy-(y+.5)/scale],w=rot(s,-turn); // y down on screen
 // nearest lattice centre
 const bf=w[0]/e0[0],af=(w[1]-bf*e0[1])/e1[1];let bestD=1e9,hit=null;
 for(let da=-1;da<=2;da++)for(let db=-1;db<=2;db++){const a=Math.floor(bf)+da,b=Math.floor(af)+db,c=[a*e0[0]+b*e1[0],a*e0[1]+b*e1[1]],d=Math.hypot(w[0]-c[0],w[1]-c[1]);if(d<bestD){bestD=d;hit=[a,b,c];}}
 const cell=occ.get(hit[0]+','+hit[1]);if(!cell)continue;
 const q=rot([w[0]-hit[2][0],w[1]-hit[2][1]],-cell.k*Math.PI/3),pc=pieces[cell.p],P=localSphere(pc.parent,pieceLocal(pc,q));if(!P)continue;
 const [la,lo]=geo(P,DEFAULT),i=y*W+x;lat[i]=la;lon[i]=lo;id[i]=cell.p;
}
writeFileSync(out,Buffer.concat([Buffer.from(new Int32Array([W,H]).buffer),Buffer.from(lat.buffer),Buffer.from(lon.buffer),Buffer.from(id.buffer)]));
console.log(out,W,H);
