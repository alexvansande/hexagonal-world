import {projectionGLSL} from './projection-shader.mjs';

export const reliefRanges = [
  ['reliefHeight','Terrain height',0,2.5,.05,1.1,'×'],
  ['reliefAzimuth','Light direction',0,360,1,315,'°'],
  ['reliefAltitude','Light elevation',8,85,1,32,'°'],
  ['reliefContrast','Contrast',.5,1.8,.05,1.05,''],
  ['reliefHighlights','Highlights',0,1.5,.05,.65,''],
  ['reliefAmbient','Ambient light',.15,1,.05,.5,''],
  ['reliefShadows','Shadow strength',0,1,.05,.65,''],
  ['reliefSoftness','Shadow softness',0,1,.05,.35,''],
  ['reliefAO','Valley shading',0,1,.05,.4,''],
  ['reliefColorFade','Map color fade',0,1,.05,.25,''],
  ['reliefThickness','Panel thickness',0,2,.05,.55,'×'],
  ['reliefOcean','Seafloor relief',0,1,.05,.45,'×'],
  ['reliefRiverDepth','River depth',0,1,.05,.35,'×'],
  ['reliefSeaLevel','Sea level',0,255,1,105,''],
];
export const reliefDefaults = Object.fromEntries(reliefRanges.map(([id,,,,,value])=>[id,value]));
export const reliefLooks = {
  sculpted:{reliefHeight:1.1,reliefAltitude:32,reliefContrast:1.05,reliefHighlights:.65,reliefAmbient:.5,reliefShadows:.65,reliefSoftness:.35,reliefAO:.4,reliefThickness:.55},
  dramatic:{reliefHeight:1.6,reliefAltitude:20,reliefContrast:1.15,reliefHighlights:.85,reliefAmbient:.35,reliefShadows:.8,reliefSoftness:.2,reliefAO:.55,reliefThickness:.8,reliefRiverDepth:.5},
  gentle:{reliefHeight:.65,reliefAltitude:48,reliefContrast:.9,reliefHighlights:.4,reliefAmbient:.7,reliefShadows:.45,reliefSoftness:.65,reliefAO:.25,reliefThickness:.4,reliefRiverDepth:.2},
};

// Heights are in flat-map units, never screen pixels: zoom and export preserve
// the model's proportions. Sea level is a visual datum, not meters.
export function reliefDimensions(state) {
  const depth=state.reliefHeight*.30, sea=state.reliefSeaLevel/255;
  const thickness=state.reliefThickness*.10;
  return {depth,sea,thickness,base:thickness+depth*sea*state.reliefOcean,
    maximum:thickness+depth*(1-sea+sea*state.reliefOcean)};
}
export function shadowReach(state) {
  return reliefDimensions(state).maximum/Math.tan(state.reliefAltitude*Math.PI/180);
}

const heightFragment=`precision highp float;
varying vec2 flatPosition;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;
uniform int felvClip;uniform vec3 angles;uniform float bias;uniform float blend;
uniform sampler2D overview;uniform sampler2D h0;uniform sampler2D h1;uniform sampler2D h2;
uniform sampler2D h3;uniform sampler2D h4;uniform sampler2D h5;uniform sampler2D riverMap;
uniform int riversVisible;uniform float riverDepth;
uniform float loaded;uniform vec2 tileSize;
${projectionGLSL}
float elevation(vec2 uv){
  if(loaded<.5)return texture2D(overview,uv).r;
  vec2 cell=floor(uv*vec2(3.,2.));
  vec2 local=(fract(uv*vec2(3.,2.))*tileSize+1.)/(tileSize+2.);
  if(cell.y<.5){if(cell.x<.5)return texture2D(h0,local).r;if(cell.x<1.5)return texture2D(h1,local).r;return texture2D(h2,local).r;}
  if(cell.x<.5)return texture2D(h3,local).r;if(cell.x<1.5)return texture2D(h4,local).r;return texture2D(h5,local).r;
}
void main(){
  if(felvClip==1){float fy=-flatPosition.y;float fx=flatPosition.x-sqrt(3.)*fy;if(fy<0.||fy>sqrt(3.)||fx< -1.||fx>5.)discard;}
  vec2 uv=geographicUV(atlasSphere(weights,a,b,c,bias,blend),angles);float h=elevation(uv);
  if(riversVisible==1)h=max(0.,h-texture2D(riverMap,uv).a*riverDepth*.08);
  // Linear two-channel encoding keeps sub-byte interpolation smooth, even on
  // devices that cannot render to floating point attachments.
  float v=h*255.;gl_FragColor=vec4(floor(v)/255.,fract(v),0.,1.);
}`;
const quadVertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
// Directional horizon scan. Each pass doubles the examined distance, carrying
// the maximum blocker height after subtracting the light ray's rise. Unlike
// sparse ray steps, this visits every interval and catches narrow islands.
const horizonFragment=`precision highp float;varying vec2 uv;
uniform sampler2D previous;uniform sampler2D field;uniform vec2 size;uniform vec2 direction;
uniform float distance;uniform float slope;uniform float maximum;uniform float depth;uniform float sea;uniform float ocean;uniform float base;uniform int treatment;uniform int seed;
float decode(vec4 f){return f.r+f.g/255.;}
vec4 encode(float h,float cut){float v=clamp(h,0.,1.)*255.;return vec4(floor(v)/255.,fract(v),cut,1.);}
void main(){
 if(seed==1){vec4 f=texture2D(field,uv);float raw=decode(f);float cover=f.a*(treatment==1?smoothstep(sea-.002,sea+.002,raw):1.);
  float r=raw-sea;float h=cover>.5?base+depth*(r<0.?r*ocean:r):0.;gl_FragColor=encode(h/maximum,f.b);return;}
 vec4 current=texture2D(previous,uv);vec2 next=uv+direction*distance/size;
 vec4 farther=any(lessThan(next,vec2(0.)))||any(greaterThan(next,vec2(1.)))?vec4(0.):texture2D(previous,next);
 float top=decode(current);
 if(current.b<.5)top=max(top,decode(farther)-slope*distance/maximum);
 gl_FragColor=encode(top,max(current.b,farther.b));
}`;
const lightingFragment=`precision highp float;
varying vec2 uv;uniform sampler2D colorMap;uniform sampler2D field;uniform sampler2D horizon;
uniform vec2 fieldSize;uniform vec2 outputSize;uniform vec2 offset;
uniform vec3 light;uniform float unit;uniform float depth;uniform float sea;uniform float ocean;
uniform float base;uniform float maximum;
uniform float contrast;uniform float highlights;uniform float ambient;uniform float strength;
uniform float softness;uniform float cavity;uniform float colorFade;uniform int material;uniform int treatment;uniform int tone;
float rawHeight(vec4 f){return f.r+f.g/255.;}
float coverage(vec4 f){return f.a* (treatment==1?smoothstep(sea-.002,sea+.002,rawHeight(f)):1.);}
float heightAt(vec4 f){float r=rawHeight(f)-sea;return coverage(f)>.5 ? base+depth*(r<0.?r*ocean:r):0.;}
vec4 sampleField(vec2 p){if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,fieldSize)))return vec4(0.);return texture2D(field,p/fieldSize);}
float neighbor(vec2 p,vec4 center){vec4 n=sampleField(p);return coverage(n)<.5||n.b>.5||center.b>.5?heightAt(center):heightAt(n);}
float occlusion(vec2 p,float z,vec2 direction,float radius){
  vec4 f=sampleField(p+direction*radius);if(coverage(f)<.5||f.b>.5)return 0.;
  return clamp((heightAt(f)-z)/(radius*.65+.01),0.,1.);
}
void main(){
  vec2 p=offset+uv*outputSize;vec4 f=sampleField(p);float mask=coverage(f);float z=heightAt(f);
  vec3 paper=tone==1?vec3(.89,.92,.93):tone==2?vec3(.77,.83,.88):vec3(.94,.92,.89);
  vec3 shadowTint=tone==1?vec3(.38,.44,.49):tone==2?vec3(.22,.32,.49):vec3(.40,.34,.49);
  vec3 sunlight=tone==1?vec3(1.):tone==2?vec3(.86,.94,1.06):vec3(1.08,1.015,.90);
  vec3 ground=paper;
  float visibility=1.;vec2 direction=normalize(light.xy);
  if(strength>.001){vec4 blocker=texture2D(horizon,p/fieldSize);float top=(blocker.r+blocker.g/255.)*max(maximum,1.);
    visibility=1.-smoothstep(.3,1.+softness*.7,top-z);}
  float shadow=(1.-visibility)*strength;
  if(mask<.01){
    // A soft contact shadow anchors the panel to the table as well as its long
    // directional shadow. It works around concave outlines and holes too.
    float contact=0.;float r=max(1.,unit*.016);
    contact+=coverage(sampleField(p+vec2(r,0.)));contact+=coverage(sampleField(p-vec2(r,0.)));
    contact+=coverage(sampleField(p+vec2(0.,r)));contact+=coverage(sampleField(p-vec2(0.,r)));
    ground=mix(ground,paper*shadowTint,clamp(shadow*.75+contact*.045*strength,0.,.85));
    gl_FragColor=vec4(ground,clamp(shadow*.75+contact*.045*strength,0.,.85));return;
  }
  float dx=(neighbor(p+vec2(1.,0.),f)-neighbor(p-vec2(1.,0.),f))*.5;
  float dy=(neighbor(p+vec2(0.,1.),f)-neighbor(p-vec2(0.,1.),f))*.5;
  vec3 normal=normalize(vec3(-dx,-dy,1.));
  float diffuse=max(0.,dot(normal,light));float flatLight=max(.15,light.z);
  float value=clamp(1.+(diffuse-flatLight)*1.6*contrast,.18,1.8);
  float ao=0.;
  if(cavity>.001&&f.b<.5){
    float r=max(2.,unit*.018);
    for(int j=0;j<8;j++){
      float angle=float(j)*.78539816339;vec2 dir=vec2(cos(angle),sin(angle));
      ao+=occlusion(p,z,dir,r)*.075+occlusion(p,z,dir,r*3.)*.05;
    }
  }
  vec3 source=texture2D(colorMap,p/fieldSize).rgb;
  float sourceLuma=dot(source,vec3(.299,.587,.114));
  vec3 subdued=mix(vec3(sourceLuma),vec3(.78,.77,.72),.55);
  source=mix(source,subdued,colorFade);
  float h=rawHeight(f);float land=smoothstep(sea-.003,sea+.003,h);
  if(material==1)source=mix(vec3(.65,.75,.77),vec3(.88,.865,.80),land);
  if(material==2){
    float altitude=clamp((h-sea)/max(1.-sea,.01),0.,1.);
    vec3 low=mix(vec3(.49,.61,.46),vec3(.80,.76,.56),smoothstep(0.,.35,altitude));
    vec3 high=mix(vec3(.77,.70,.57),vec3(.97,.95,.88),smoothstep(.45,.95,altitude));
    vec3 earth=mix(low,high,smoothstep(.2,.65,altitude));
    source=mix(mix(vec3(.22,.43,.52),vec3(.65,.79,.78),clamp(h/max(sea,.01),0.,1.)),earth,land);
  }
  vec3 shaded=source*mix(vec3(ambient),sunlight,value*(1.-ambient)+ambient*.35);
  shaded*=1.-ao*cavity*.75;
  shaded=mix(shaded,shaded*shadowTint,shadow*(1.-ambient*.45));
  float ridge=max(0.,diffuse-flatLight);
  shaded+=sunlight*ridge*highlights*.32*(1.-shadow);
  // A narrow rim follows the actual outer mask, not the internal hexagon edges.
  float edge=0.;vec2 lightEdge=direction*1.25;
  edge=1.-coverage(sampleField(p-lightEdge));
  shaded+=sunlight*edge*highlights*.035;
  shaded=clamp(shaded,0.,1.);
  ground=mix(ground,paper*shadowTint,shadow*.75);
  gl_FragColor=vec4(mix(ground,shaded,mask),shadow*.75);
}`;
const blitFragment=`precision highp float;varying vec2 uv;
uniform sampler2D image;uniform sampler2D field;uniform vec2 fieldSize;uniform vec2 outputSize;uniform vec2 offset;uniform vec2 texel;
uniform float blur;uniform float sea;uniform int treatment;uniform int tone;
void main(){
  vec4 f=texture2D(field,(offset+uv*outputSize)/fieldSize);
  float mask=f.a*(treatment==1?smoothstep(sea-.002,sea+.002,f.r+f.g/255.):1.);
  vec3 color=texture2D(image,uv).rgb;
  if(mask<1.){
    float shadow=0.,total=0.;
    for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){
      vec2 d=vec2(float(x),float(y));float weight=exp(-dot(d,d)*.65);
      shadow+=texture2D(image,uv+d*texel*blur).a*weight;total+=weight;
    }
    vec3 paper=tone==1?vec3(.89,.92,.93):tone==2?vec3(.77,.83,.88):vec3(.94,.92,.89);
    vec3 tint=tone==1?vec3(.38,.44,.49):tone==2?vec3(.22,.32,.49):vec3(.40,.34,.49);
    color=mix(mix(paper,paper*tint,shadow/total),color,mask);
  }
  gl_FragColor=vec4(color,1.);
}`;
const seamVertex=`attribute vec2 position;uniform vec2 size;uniform vec3 view;uniform float gridRotation;
void main(){float c=cos(gridRotation),s=sin(gridRotation);vec2 p=vec2(c*position.x-s*position.y,s*position.x+c*position.y);p=(p*view.x+view.yz)/size*2.;gl_Position=vec4(p.x,-p.y,0.,1.);}`;
const seamFragment=`precision mediump float;void main(){gl_FragColor=vec4(0.,0.,1.,1.);}`;

function program(gl,vs,fs){
  const p=gl.createProgram();
  for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);gl.deleteProgram(p);throw Error(message);}
    gl.attachShader(p,s);gl.deleteShader(s);
  }
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  return p;
}

export class ReliefRenderer {
  constructor(gl,vertexShader,onChange,onStatus){
    this.gl=gl;this.onChange=onChange;this.onStatus=onStatus;this.ready=false;this.detailed=false;this.generation=0;
    this.heightProgram=program(gl,vertexShader,heightFragment);
    this.lightProgram=program(gl,quadVertex,lightingFragment);
    this.horizonProgram=program(gl,quadVertex,horizonFragment);
    this.blitProgram=program(gl,quadVertex,blitFragment);
    this.seamProgram=program(gl,seamVertex,seamFragment);
    this.locations=new Map();this.targets=[];this.heightTextures=[];
    this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    this.seamBuffer=gl.createBuffer();
    // Every sampler must have a complete texture even before high-res loading.
    for(let i=0;i<7;i++){
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([105]));this.heightTextures.push(t);
    }
    this.riverTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.riverTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([0]));
  }
  loc(p,name){let l=this.locations.get(p);if(!l){l=new Map();this.locations.set(p,l);}if(!l.has(name))l.set(name,this.gl.getUniformLocation(p,name));return l.get(name);}
  f(p,name,value){this.gl.uniform1f(this.loc(p,name),value);}
  i(p,name,value){this.gl.uniform1i(this.loc(p,name),value);}
  v2(p,name,x,y){this.gl.uniform2f(this.loc(p,name),x,y);}
  v3(p,name,x,y,z){this.gl.uniform3f(this.loc(p,name),x,y,z);}
  bindTexture(texture,slot){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,texture);}
  async upload(url,slot){
    const response=await fetch(url);if(!response.ok)throw Error('Elevation image could not load');
    const bitmap=await createImageBitmap(await response.blob(),{colorSpaceConversion:'none',premultiplyAlpha:'none'});
    try{
      const gl=this.gl,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);let source=bitmap;
      if(bitmap.width>max||bitmap.height>max){
        const factor=Math.min(max/bitmap.width,max/bitmap.height),c=document.createElement('canvas');
        c.width=Math.floor(bitmap.width*factor);c.height=Math.floor(bitmap.height*factor);c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);source=c;this.reduced=true;
      }
      this.bindTexture(this.heightTextures[slot],slot);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,gl.LUMINANCE,gl.UNSIGNED_BYTE,source);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);gl.activeTexture(gl.TEXTURE0);
      const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('Elevation exceeds available graphics memory');
    }finally{bitmap.close();}
  }
  async load(){
    if(this.loading)return;this.loading=true;this.onStatus('Loading elevation…');
    try{
      await this.upload('maps/height/overview.png',0);this.ready=true;this.generation++;this.onChange();
      for(let row=0;row<2;row++)for(let col=0;col<3;col++){
        this.onStatus(`Refining elevation · ${row*3+col+1} / 6`);
        await this.upload(`maps/height/${row}-${col}.png`,1+row*3+col);
      }
      this.detailed=true;this.generation++;this.onStatus(this.reduced?'Elevation ready · adapted to this device':'Elevation ready · 21,600 × 10,800');this.onChange();
    }catch(error){
      this.onStatus(this.ready?'Overview elevation active · fine detail could not load':'Elevation unavailable · turn relief off and on to retry');
      this.loading=false;console.warn('Relief elevation:',error.message);this.onChange();
    }
  }
  padding(state,unit){return Math.min(650,Math.ceil(shadowReach(state)*unit+12));}
  target(index,w,h){
    const gl=this.gl;let t=this.targets[index];if(t&&t.width===w&&t.height===h)return t;
    if(t){gl.deleteFramebuffer(t.fbo);gl.deleteTexture(t.texture);}
    const texture=gl.createTexture();this.bindTexture(texture,0);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){gl.deleteFramebuffer(fbo);gl.deleteTexture(texture);throw Error('Relief render target unavailable');}
    t={texture,fbo,width:w,height:h};this.targets[index]=t;return t;
  }
  drawQuad(p){const gl=this.gl;for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,6);}
  bindOverlayMask(p){
    const f=this.lastFrame,gl=this.gl;this.bindTexture(this.targets[1].texture,1);this.i(p,'overlayMask',1);
    this.v2(p,'overlayFieldSize',f.fw,f.fh);this.v2(p,'overlayMapSize',f.mapWidth,f.mapHeight);this.v2(p,'overlayOffset',f.ox,f.oy);this.v2(p,'overlayViewport',gl.canvas.width,gl.canvas.height);
    this.i(p,'overlayLand',f.land?1:0);this.f(p,'overlaySea',f.sea);
  }
  buildHorizon(field,dimensions,pixelUnit,state,treatment,reach,key,refined){
    const gl=this.gl,horizonKey=JSON.stringify([key,dimensions,pixelUnit,state.reliefAzimuth,state.reliefAltitude,state.reliefOcean,treatment]);
    if(this.horizonKey===horizonKey&&(this.horizonRefined||!refined))return this.horizonTexture;
    const buffers=[this.target(3,field.width,field.height),this.target(4,field.width,field.height)];
    const p=this.horizonProgram;gl.useProgram(p);gl.viewport(0,0,field.width,field.height);
    this.bindTexture(field.texture,1);this.i(p,'field',1);this.i(p,'previous',0);
    this.v2(p,'size',field.width,field.height);const a=state.reliefAzimuth*Math.PI/180;
    this.v2(p,'direction',Math.sin(a),Math.cos(a));this.f(p,'slope',Math.tan(state.reliefAltitude*Math.PI/180));
    this.f(p,'maximum',Math.max(1,dimensions.maximum*pixelUnit));this.f(p,'depth',dimensions.depth*pixelUnit);
    this.f(p,'base',dimensions.base*pixelUnit);this.f(p,'sea',dimensions.sea);this.f(p,'ocean',state.reliefOcean);this.i(p,'treatment',treatment==='land'?1:0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,buffers[0].fbo);this.bindTexture(field.texture,0);this.i(p,'seed',1);this.drawQuad(p);
    this.i(p,'seed',0);let current=0,span=0;const limit=Math.ceil(reach),step=refined?1:2;
    while(span<limit){
      const distance=Math.min(span+step,limit-span),next=1-current;
      gl.bindFramebuffer(gl.FRAMEBUFFER,buffers[next].fbo);this.bindTexture(buffers[current].texture,0);this.f(p,'distance',distance);this.drawQuad(p);
      current=next;span+=distance;
    }
    this.horizonKey=horizonKey;this.horizonRefined=refined;this.horizonTexture=buffers[current].texture;return this.horizonTexture;
  }
  render({width,height,dpr,unit,state,blend,clip,material,treatment,tone,signature,drawColor,drawGeometry,seams,riverTexture=null,riverVisible=false,riverDepth=0,pixelBudget=3000000,refined=false}){
    const gl=this.gl,pad=this.padding(state,unit),cssWidth=width+pad*2,cssHeight=height+pad*2;
    const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const ratio=Math.min(dpr,Math.sqrt(pixelBudget/(cssWidth*cssHeight)),max/cssWidth,max/cssHeight);
    const fw=Math.ceil(cssWidth*ratio),fh=Math.ceil(cssHeight*ratio),ow=Math.ceil(width*ratio),oh=Math.ceil(height*ratio);
    const color=this.target(0,fw,fh),field=this.target(1,fw,fh),output=this.target(2,ow,oh);
    this.lastFrame={fw,fh,mapWidth:width/cssWidth*fw,mapHeight:height/cssHeight*fh,ox:pad/cssWidth*fw,oy:pad/cssHeight*fh,land:treatment==='land',sea:state.reliefSeaLevel/255};
    const cacheKey=signature+`/${fw}/${fh}/${pad}/${this.generation}`;
    gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.colorMask(true,true,true,true);
    if(this.cacheKey!==cacheKey){
      gl.bindFramebuffer(gl.FRAMEBUFFER,color.fbo);gl.viewport(0,0,fw,fh);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      drawColor(cssWidth,cssHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER,field.fbo);gl.clear(gl.COLOR_BUFFER_BIT);
      const hp=this.heightProgram;gl.useProgram(hp);
      this.v2(hp,'size',cssWidth,cssHeight);this.v3(hp,'view',unit,state.panX,state.panY);
      this.f(hp,'gridRotation',state.gridRotation*Math.PI/180);this.v3(hp,'angles',state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);
      this.f(hp,'bias',state.bias);this.f(hp,'blend',blend);this.i(hp,'felvClip',clip?1:0);
      this.f(hp,'loaded',this.detailed?1:0);this.v2(hp,'tileSize',7200,5400);
      ['overview','h0','h1','h2','h3','h4','h5'].forEach((name,i)=>{this.bindTexture(this.heightTextures[i],i);this.i(hp,name,i);});this.bindTexture(riverTexture||this.riverTexture,7);this.i(hp,'riverMap',7);this.i(hp,'riversVisible',riverVisible?1:0);this.f(hp,'riverDepth',riverDepth);
      drawGeometry(hp);
      if(seams.length){
        const sp=this.seamProgram;gl.useProgram(sp);this.v2(sp,'size',cssWidth,cssHeight);this.v3(sp,'view',unit,state.panX,state.panY);this.f(sp,'gridRotation',state.gridRotation*Math.PI/180);
        const verts=[];const half=2/(unit*ratio);
        for(const [a,b] of seams){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;const nx=-dy/len*half,ny=dx/len*half;
          const p=[a[0]+nx,a[1]+ny],q=[b[0]+nx,b[1]+ny],r=[a[0]-nx,a[1]-ny],s=[b[0]-nx,b[1]-ny];verts.push(...p,...q,...r,...r,...q,...s);
        }
        for(let i=0;i<gl.getParameter(gl.MAX_VERTEX_ATTRIBS);i++)gl.disableVertexAttribArray(i);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.seamBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
        const a=gl.getAttribLocation(sp,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
        gl.colorMask(false,false,true,false);gl.drawArrays(gl.TRIANGLES,0,verts.length/2);gl.colorMask(true,true,true,true);
      }
      this.cacheKey=cacheKey;
    }
    const dimensions=reliefDimensions(state),pixelUnit=unit*ratio,reach=Math.min(shadowReach(state)*unit,pad-8)*ratio;
    const horizon=state.reliefShadows>.001?this.buildHorizon(field,dimensions,pixelUnit,state,treatment,reach,cacheKey,refined):field.texture;
    const p=this.lightProgram;gl.bindFramebuffer(gl.FRAMEBUFFER,output.fbo);gl.viewport(0,0,ow,oh);gl.useProgram(p);
    this.bindTexture(color.texture,0);this.i(p,'colorMap',0);this.bindTexture(field.texture,1);this.i(p,'field',1);
    this.bindTexture(horizon,2);this.i(p,'horizon',2);
    this.v2(p,'fieldSize',fw,fh);this.v2(p,'outputSize',width/cssWidth*fw,height/cssHeight*fh);this.v2(p,'offset',pad/cssWidth*fw,pad/cssHeight*fh);
    const elevation=state.reliefAltitude*Math.PI/180,azimuth=state.reliefAzimuth*Math.PI/180;
    this.v3(p,'light',Math.sin(azimuth)*Math.cos(elevation),Math.cos(azimuth)*Math.cos(elevation),Math.sin(elevation));
    this.f(p,'unit',pixelUnit);this.f(p,'sea',dimensions.sea);this.f(p,'ocean',state.reliefOcean);
    for(const name of ['depth','base','maximum'])this.f(p,name,dimensions[name]*pixelUnit);
    for(const [name,key] of [['contrast','reliefContrast'],['highlights','reliefHighlights'],['ambient','reliefAmbient'],['strength','reliefShadows'],['softness','reliefSoftness'],['cavity','reliefAO'],['colorFade','reliefColorFade']])this.f(p,name,state[key]);
    this.i(p,'material',['source','ivory','elevation'].indexOf(material));this.i(p,'treatment',treatment==='land'?1:0);this.i(p,'tone',['warm','neutral','cool'].indexOf(tone));
    this.drawQuad(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.canvas.width,gl.canvas.height);gl.useProgram(this.blitProgram);
    const bp=this.blitProgram;this.bindTexture(output.texture,0);this.i(bp,'image',0);this.bindTexture(field.texture,1);this.i(bp,'field',1);
    this.v2(bp,'fieldSize',fw,fh);this.v2(bp,'outputSize',width/cssWidth*fw,height/cssHeight*fh);this.v2(bp,'offset',pad/cssWidth*fw,pad/cssHeight*fh);this.v2(bp,'texel',1/ow,1/oh);
    this.f(bp,'blur',state.reliefSoftness*(2+pixelUnit*.055));this.f(bp,'sea',dimensions.sea);this.i(bp,'treatment',treatment==='land'?1:0);this.i(bp,'tone',['warm','neutral','cool'].indexOf(tone));
    this.drawQuad(bp);gl.activeTexture(gl.TEXTURE0);
  }
}
