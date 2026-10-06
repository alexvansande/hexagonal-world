import {readFileSync} from 'node:fs';
for(const level of [1,2]){const {pieces,ocean}=JSON.parse(readFileSync(`edges${level}.json`));
 const S3=Math.sqrt(3),e0=[S3*Math.cos(Math.PI/6),S3*Math.sin(Math.PI/6)],e1=[0,S3],phi=pieces[0].netTurn;
 const rot=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
 const cells=pieces.map(pc=>{const c=rot(pc.netCenter,-phi).map(v=>v/pc.scale),a=Math.round(c[0]/e0[0]);return [a,Math.round((c[1]-a*e0[1])/e1[1])];});
 const occ=new Set(cells.map(c=>c+'')),DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];let o=0,n=0;
 cells.forEach((c,p)=>DIR.forEach((d,k)=>{if(!occ.has([c[0]+d[0],c[1]+d[1]]+'')){n++;o+=ocean[p][k];}}));
 console.log('level',level,'default layout: exposed edges',n,'ocean',(100*o/n).toFixed(1)+'%');}
