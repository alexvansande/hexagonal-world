import {ReliefRenderer,reliefDefaults} from '../relief.mjs?v=export-2';

const results=document.querySelector('#results'),images=document.querySelector('#images');
const lines=[];let failures=0;
function check(condition,label){lines.push(`${condition?'PASS':'FAIL'} · ${label}`);if(!condition)failures++;results.textContent=lines.join('\n');}
try{
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=360;
 const gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,antialias:false});
 if(!gl)throw Error('WebGL unavailable');
 const vs=`attribute vec2 position;uniform vec2 size;uniform vec3 view;uniform float gridRotation;
 varying vec2 localPosition;varying float regionIndex;varying vec2 flatPosition;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;
 void main(){localPosition=position;regionIndex=0.;flatPosition=position;weights=vec3(1.,0.,0.);a=vec3(1.,position.x*.45,-position.y*.45);b=a;c=a;
 float co=cos(gridRotation),si=sin(gridRotation);vec2 p=vec2(co*position.x-si*position.y,si*position.x+co*position.y);
 p=(p*view.x+view.yz)/size*2.;gl_Position=vec4(p.x,-p.y,0.,1.);}`;
 const r=new ReliefRenderer(gl,vs,()=>{},()=>{});
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-.7,1,-.7,-1,.7,-1,.7,1,-.7,1,.7]),gl.STATIC_DRAW);
 function draw(p){for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const loc=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,6);}
 const cp=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,'precision mediump float;void main(){gl_FragColor=vec4(.85,.82,.72,1.); }']]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);gl.attachShader(cp,s);gl.deleteShader(s);}
 gl.linkProgram(cp);
 const state={...reliefDefaults,lon:0,lat:0,roll:0,bias:1,gridRotation:0,panX:0,panY:0,reliefAzimuth:270,reliefAltitude:25,reliefSoftness:.5};
 const width=512,height=256;const pixels=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels[y*width+x]=Math.min(255,Math.round(110+145*Math.exp(-(((x/width-.5)/.009)**2)-((y/height-.5)/.12)**2)));
 r.bindTexture(r.heightTextures[0],0);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,width,height,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,pixels);r.ready=true;
 const rect={left:130,right:350,bottom:103,top:257};
 function render(overrides={},label){
  const s={...state,...overrides};const start=performance.now();
  r.render({width:480,height:360,dpr:1,unit:110,state:s,blend:0,clip:null,material:'ivory',treatment:'atlas',tone:'warm',background:s.background,signature:JSON.stringify([s.panX,s.panY]),seams:[],refined:true,
    drawColor:(w,h)=>{gl.useProgram(cp);gl.uniform2f(gl.getUniformLocation(cp,'size'),w,h);gl.uniform3f(gl.getUniformLocation(cp,'view'),110,s.panX,s.panY);gl.uniform1f(gl.getUniformLocation(cp,'gridRotation'),0);draw(cp);},drawGeometry:draw});
  const data=new Uint8Array(480*360*4);gl.readPixels(0,0,480,360,gl.RGBA,gl.UNSIGNED_BYTE,data);
  check(gl.getError()===gl.NO_ERROR,`${label}: no GPU errors`);
  const snapshot=document.createElement('canvas');snapshot.width=480;snapshot.height=360;snapshot.getContext('2d').drawImage(canvas,0,0);
  const article=document.createElement('article'),caption=document.createElement('p');caption.textContent=label;article.append(snapshot,caption);images.append(article);
  lines.push(`  ${label}: ${(performance.now()-start).toFixed(1)} ms including GPU readback`);return data;
 }
 const flat=render({reliefHeight:0,reliefThickness:0,reliefShadows:0},'Flat surface');
 const panel=render({reliefHeight:0,reliefThickness:1.5},'Panel lit from west');
 const east=render({reliefHeight:0,reliefThickness:1.5,reliefAzimuth:90},'Panel lit from east');
 const unshadowed=render({reliefHeight:1.7,reliefShadows:0},'Ridge without cast shadows');
 const shaded=render({reliefHeight:1.7,reliefShadows:.85},'Ridge with cast shadows');
 function difference(a,b,box){let sum=0,n=0;for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){const i=(y*480+x)*4;sum+=a[i]+a[i+1]+a[i+2]-b[i]-b[i+1]-b[i+2];n+=3;}return sum/n;}
 check(difference(flat,panel,[354,125,375,235])>10,'Panel casts onto table beyond the map outline');
 check(difference(east,panel,[354,125,375,235])>10,'Reversing light moves the exterior shadow to the opposite side');
 check(difference(unshadowed,shaded,[250,125,285,235])>2,'Terrain casts a shadow onto other terrain, independently of slope lighting');
 const zero=render({reliefHeight:0,reliefThickness:0},'No terrain and no panel thickness');
 check(Math.abs(difference(flat,zero,[357,125,390,235]))<1,'Zero height and thickness remove the exterior shadow');
 const pan=render({reliefHeight:1.7,reliefShadows:.85,panX:25},'Translated ridge');
 let shiftError=0,count=0;for(let y=120;y<240;y++)for(let x=145;x<315;x++){const i=(y*480+x)*4,j=(y*480+x+25)*4;for(let c=0;c<3;c++){shiftError+=Math.abs(shaded[i+c]-pan[j+c]);count++;}}
 check(shiftError/count<3,'Panning translates terrain and shadows together');
 const colored=render({reliefHeight:0,reliefThickness:1.5,background:'#123456'},'Custom background');
 check([18,52,86].every((value,i)=>Math.abs(colored[i]-value)<=1),'Background color reaches the relief canvas');
 const coloredFlat=render({reliefHeight:0,reliefThickness:0,background:'#123456'},'Custom background without shadow');
 check(difference(coloredFlat,colored,[354,125,375,235])>2,'Exterior shadows retain the chosen background color');
 const img=new Image();img.src=canvas.toDataURL('image/png');await img.decode();check(img.width===480&&img.height===360,'Rendered relief can be exported to PNG');
 lines.push(`\n${failures?`${failures} FAILURES`:'ALL GPU CHECKS PASSED'}`);results.textContent=lines.join('\n');document.title=failures?'FAIL — Relief checks':'PASS — Relief checks';
}catch(error){results.textContent+='\nERROR: '+error.stack;document.title='FAIL — Relief checks';console.error(error);}
