import {renderLifezonesLegend} from './lifezones-legend.mjs?v=waves-1';
import {fadedLegendColor} from './legend-colors.mjs';
import {ProjectedLighting,lightingSettings,lightingKey,lightingPlan,lightingCovers} from './projected-lighting.mjs?v=zoom-layers-1';
import {compactDevice,mobileFitRect} from './device-profile.mjs';
import {readSharePath,sharePair,inferSharePair,presetSettings} from './share-routes.mjs?v=lifezones-bg-1';
import {initAnalytics,trackEvent} from './analytics.mjs';
import {pngFromTiles,printPDF} from './map-export.mjs?v=pdf-resolution-1';
import {fractalRegion,fractalOpacities,edgeKey} from './fractal-grid.mjs';
import {pointInLoops} from './gosper-fractal.mjs';
import {circularMode} from './circular-projections.mjs';
import {polygonOverlapsRect} from './interface-layout.mjs';
import {ecologyGridGLSL,ecologyBridgeGLSL} from './ecology-grid.mjs?v=bridges-13';
import {gosperScale,rotateLocal,subgridLevels} from './subgrid.mjs';
import {decodeMapState,encodeMapState,distortionEnabled,restorePanelStates} from './map-state.mjs?v=layers-1';
import {sphereAt,followPoint,geographicPoint} from './globe-drag.mjs?v=circular-2';
import {makeArrangement,arrangementNames} from './arrangements.mjs?v=gosper-1';
import {mapSource,landLegends,oceanLegend,missing,riverMask} from './map-layers.mjs?v=antarctic-polar-1-waves-1';
import {searchPresets} from './search-presets.mjs?v=rus-search-1';
import {visibleTiles} from './tiling.mjs';
import {makeGeometry,layouts,matching,canvasWorld,hex,world} from './geometry.mjs?v=circular-2';
import {projectionGLSL} from './projection-shader.mjs?v=circular-2';
import {ReliefRenderer,reliefRanges,reliefDefaults,reliefLooks} from './relief.mjs?v=layers-4';
import {layoutOptions,styleOptions,layoutIcon} from './map-options.mjs?v=lifezones-bg-1';
const $=id=>document.getElementById(id), canvas=$('map'),overlay=$('overlay'),ctx=overlay.getContext('2d');
const classOptions=[3,6,10,15];
const classCount=id=>classOptions[Math.max(0,Math.min(3,Math.round(+$(id).value)))];
function syncClassControl(id,count){const el=$(id);if(!el)return;const index=classOptions.indexOf(+count);if(index>=0)el.value=index;$(id+'-value').value=classOptions[+el.value];}
const rangeSuffixes={riverWidth:'×',subgridWidth:'×',graticuleWidth:'×'};
const state={method:'tetra',lon:0,lat:0,roll:0,bias:1,height:1.5,grid:30,line:0.8,subgridWidth:1,graticuleWidth:1,shadowOpacity:1,lightOpacity:1,distortionOpacity:.7,clearance:0,riverWidth:1,riverLevels:6,layout:0,gridRotation:0,zoom:1,panX:0,panY:0,mode:'pan',arrangement:'infinite',sidebarExpanded:false,interpolation:0,...reliefDefaults};
let exporting=false;
let shareSelection=readSharePath(location.pathname)||inferSharePair(readMapStateFromUrl());
let persistenceReady=false,saveTimer=null,restoredView=null,headingBounds=null;
let displayedSource='continents',mapRequest=0;
let arrangement,tiling,visible=[],meshSignature=null,geometryKey=null,edgeLabels=[];
const arrangementCache=new Map();
let ecologyVertices,tiles,nets,net,scale=1,w=1,h=1,dpr=1,ready=false,queued=false,buffer,count=0,texture,heightTexture,riverTexture;
let projectedLighting=null,customApplied=null,lightingRefineTimer=null,lightingRefineKey=null,lightingReadyKey=null;
let relief=null,riverGeneration=0,riverRequest=0,riverTimer=null,uploadedRiverKey=null;

const notes={'lambert-one':'The whole world in one equal-area hexagon: a Lambert disk reshaped without changing area. The entire perimeter is the opposite pole. Inspired by Rus’s minimal hexagonal maps; this is not his triangular fold.', 'lambert-two':'Two equal-area hemispheres, each reshaped from a Lambert disk into a hexagon. All six boundary edges have matching counterparts. Rotate the globe to move the hemispheres.',tetra:'Four spherical triangles, each expanded into a six-sided region. Alternating corners preserve the original vertices and edge midpoints.',octa:'Four intact octants. Four divided octants. Each hexagon combines one central triangle with three neighboring pieces.',rhombic:'Twelve rhombi become four groups of three. Each diamond is stretched into a pair of equilateral triangles.',tetrakis:'Six pyramids on a cube create 24 triangles. Six triangles meet inside each hexagon; adjust the pyramid tips below.'};
function range(parent,id,label,min,max,step,value,suffix=''){
 const el=document.createElement('label');el.className='range';el.innerHTML=`<span class="range-head"><span>${label}</span><output id="${id}-value">${value}${suffix}</output></span><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;$(parent).append(el);$(id).addEventListener('input',()=>{if(id==='gridRotation'){const a=(+$(id).value-state[id])*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);[state.panX,state.panY]=[c*state.panX-sn*state.panY,sn*state.panX+c*state.panY];}state[id]=+$(id).value;$(id+'-value').value=Number(state[id].toFixed(2))+suffix;if(id==='height')rebuild(false);if(id.startsWith('relief'))updateRelief();draw();});
}
range('distortion-controls','distortionOpacity','Opacity',0,1,.05,.7);
range('clearance-control','clearance','Minimum distance from land',0,9,1,0,'°');$('clearance').setAttribute('aria-label','Minimum distance from land');$('clearance-control').querySelector('.range-head').hidden=true;
range('orientation','lon','Longitude',-180,180,1,0,'°');range('orientation','lat','Latitude',-90,90,1,0,'°');range('orientation','roll','Roll',-180,180,1,0,'°');range('shape-controls','bias','Shape bias',.4,2.5,.01,1);range('shape-controls','height','Pyramid tip distance',1.01,2,.01,1.5);range('display-controls','gridRotation','Grid rotation',-180,180,1,0,'°');range('graticule-controls','grid','Grid interval',10,60,5,30,'°');range('border-controls','line','Border weight',0,2,.1,.8);
range('hex-grid-controls','subgridWidth','Hex grid thickness',0,5,.1,1,'×');range('graticule-controls','graticuleWidth','Latitude / longitude thickness',0,5,.1,1,'×');
range('river-controls','riverWidth','River width',.5,3,.25,1,'×');range('river-controls','riverLevels','Tributary levels',1,12,1,6);
for(const spec of reliefRanges){const id=spec[0];range(id==='reliefColorFade'?'lighting-opacity-controls':['reliefHeight','reliefAzimuth','reliefAltitude','reliefThickness'].includes(id)?'relief-main-controls':'relief-fine-controls',...spec);}
range('lighting-opacity-controls','shadowOpacity','Dark opacity',0,1,.01,1);
range('lighting-opacity-controls','lightOpacity','Light opacity',0,1,.01,1);
const customOption=$('lighting-preset').querySelector('[value=custom]');if(compactDevice)customOption.remove();
const hexBridgeMode=new URLSearchParams(location.search).get('hex-bridges');
const hexBridgesEnabled=hexBridgeMode==='0'?0:hexBridgeMode==='5'?5:hexBridgeMode==='4'?4:hexBridgeMode==='3'?3:hexBridgeMode==='2'?2:hexBridgeMode==='1'?1:5;
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});
function fail(message){$('error').hidden=false;$('error').textContent=message;$('status').textContent='Rendering unavailable';}
const vs=`attribute vec2 regionPosition;attribute float region;varying vec2 localPosition;varying float regionIndex;varying vec2 flatPosition;attribute float opacity;varying float tileAlpha;attribute vec2 position;attribute vec3 bary;attribute vec3 va;attribute vec3 vb;attribute vec3 vc;uniform vec2 size;uniform vec3 view;uniform float gridRotation;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;void main(){localPosition=regionPosition;regionIndex=region;flatPosition=position;float cr=cos(gridRotation),sr=sin(gridRotation);vec2 rotated=vec2(cr*position.x-sr*position.y,sr*position.x+cr*position.y);vec2 p=(rotated*view.x+view.yz)/size*2.0;gl_Position=vec4(p.x,-p.y,0.,1.);tileAlpha=opacity;weights=bary;a=va;b=vb;c=vc;}`;
const derivativeSupport=!!gl?.getExtension('OES_standard_derivatives');
const fs=`${derivativeSupport?'#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES 1\n':'#define HAS_DERIVATIVES 0\n'}precision highp float;varying vec2 flatPosition;uniform int felvClip;varying float tileAlpha;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;uniform sampler2D map;uniform sampler2D heightMap;uniform float colorFade;uniform int landCutout;uniform vec3 background;uniform sampler2D riverMap;uniform vec3 angles;uniform float bias;uniform float blend;uniform float grid;uniform float gridWidth;uniform vec3 gridColor;uniform int palette;uniform int material;uniform float materialSea;uniform int riversVisible;uniform int distortion;uniform float distortionOpacity;uniform float pixelScale;const float PI=3.141592653589793;
${projectionGLSL}
${ecologyGridGLSL}
${ecologyBridgeGLSL}
uniform int overlayOnly;
void main(){if(felvClip==1){float fy=-flatPosition.y;float fx=flatPosition.x-sqrt(3.)*fy;if(fy<0.||fy>sqrt(3.)||fx< -1.||fx>5.)discard;}vec3 p=mapSphere(localPosition,regionIndex,weights,a,b,c,bias,blend);
 vec3 distortionColor=vec3(1.);
 #if HAS_DERIVATIVES
 vec3 dx=dFdx(p)*pixelScale,dy=dFdy(p)*pixelScale;
 float E=dot(dx,dx),G=dot(dy,dy),F=dot(dx,dy);
 float areaElement=max(length(cross(dx,dy)),1.e-12);
 float major=sqrt(max(.5*(E+G+sqrt(max((E-G)*(E-G)+4.*F*F,0.))),1.e-12));
 float minor=areaElement/major;
 float angular=2.*asin(clamp((major-minor)/max(major+minor,1.e-12),0.,1.))*180./PI;
 float areaLog=clamp(log((8.*PI/(3.*sqrt(3.)*(circularMode==1?1.:circularMode==2?2.:4.)))/areaElement)/log(2.)/2.,-1.,1.);
 vec3 areaColor=mix(vec3(.96,.97,.97),areaLog<0.?vec3(.10,.40,.91):vec3(1.,.57,.08),abs(areaLog));
 distortionColor=mix(areaColor,vec3(.69,.12,.79),clamp(angular/90.,0.,1.)*.85);
 #endif
 vec2 uv=geographicUV(p,angles);float lon=(uv.x-.5)*2.*PI;float lat=(.5-uv.y)*PI;
 vec2 sourceUV=ecologyHex==1?geographicUV(ecologySphere(ecologyCenter(localPosition)),angles):uv;
 vec3 source=texture2D(map,sourceUV).rgb;
 if(ecologyHex==1&&ecologyBridges>0)source=ecologyBridgedColor(localPosition,ecologyCenter(localPosition),source);
 float sea=smoothstep(.17,.8,source.r);vec3 color=source;
 if(palette==0)color=mix(vec3(.14,.30,.35),vec3(.75,.86,.89),sea);
 if(palette==2)color=mix(vec3(.30,.64,.72),vec3(.075,.14,.20),sea);
 float surfaceHeight=texture2D(heightMap,uv).r;
 if(material==1)color=mix(vec3(.65,.75,.77),vec3(.88,.865,.80),smoothstep(materialSea-.003,materialSea+.003,surfaceHeight));
 if(material==2){float h=surfaceHeight;float land=smoothstep(materialSea-.003,materialSea+.003,h);float altitude=clamp((h-materialSea)/max(1.-materialSea,.01),0.,1.);vec3 low=mix(vec3(.49,.61,.46),vec3(.80,.76,.56),smoothstep(0.,.35,altitude));vec3 high=mix(vec3(.77,.70,.57),vec3(.97,.95,.88),smoothstep(.45,.95,altitude));vec3 earth=mix(low,high,smoothstep(.2,.65,altitude));color=mix(mix(vec3(.22,.43,.52),vec3(.65,.79,.78),clamp(h/max(materialSea,.01),0.,1.)),earth,land);}

 if(riversVisible==1){float river=texture2D(riverMap,uv).a;color=mix(color,vec3(.08,.34,.47),river*.78);}
 if(material==0){float luma=dot(color,vec3(.299,.587,.114));color=mix(color,mix(vec3(luma),vec3(.78,.77,.72),.55),colorFade);}
 if(landCutout==1)color=mix(background,color,smoothstep(materialSea-.002,materialSea+.002,surfaceHeight));
 if(distortion>0)color=mix(color,distortionColor,distortionOpacity);
 float lineAlpha=0.;vec3 lineColor=gridColor;
 if(grid>0.&&gridWidth>0.){float lo=abs(mod(lon+grid*.5,grid)-grid*.5)*max(.12,cos(lat));float la=abs(mod(lat+grid*.5,grid)-grid*.5);lineAlpha=(1.-smoothstep(gridWidth*.4,gridWidth,min(lo,la)))*.35;color=mix(color,lineColor,lineAlpha);}
 if(overlayOnly==1){
  float coverage=landCutout==1?smoothstep(materialSea-.002,materialSea+.002,surfaceHeight):1.;
  float da=distortion>0?distortionOpacity:0.;float alpha=da+lineAlpha*(1.-da);
  vec3 ink=(distortionColor*da*(1.-lineAlpha)+lineColor*lineAlpha)/max(alpha,.0001);
  gl_FragColor=vec4(ink,alpha*coverage);
 }else gl_FragColor=vec4(color*tileAlpha,tileAlpha);
}`;
let program,uniforms={};
if(gl){try{function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);for(const u of ['size','view','gridRotation','angles','bias','blend','grid','gridWidth','gridColor','palette','map','heightMap','colorFade','landCutout','background','material','materialSea','riverMap','riversVisible','distortion','distortionOpacity','pixelScale','felvClip','overlayOnly','circularMode','ecologyHex','ecologyBridges','ecologyOcta','ecologyVertices[0]'])uniforms[u]=gl.getUniformLocation(program,u);buffer=gl.createBuffer();heightTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,heightTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([105]));riverTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([0]));gl.activeTexture(gl.TEXTURE0);}catch(e){fail('The map renderer could not start: '+e.message);}}else fail('WebGL is unavailable. Enable hardware acceleration or open this app in a WebGL-capable browser.');
function rebuild(fit=true){
 const cm=circularMode(state.method);
 if(cm)state.arrangement=cm===1?'single':'double';
 else if(['single','double'].includes(state.arrangement))state.arrangement='flower';
 $('bias').closest('label').hidden=!!cm;$('interpolation').closest('label').hidden=!!cm;
 for(const option of $('indicatrix').options)if(option.value!=='off')option.textContent=`${cm||4} × ${option.value==='4x7'?7:option.value==='4x49'?49:343} circles`;

 const nextKey=state.method+'/'+(state.method==='tetrakis'?state.height:0);
 if(nextKey!==geometryKey){
  geometryKey=nextKey;tiles=makeGeometry(state.method,state.height);ecologyVertices=new Float32Array(tiles.flatMap(t=>[t.center,...t.ring]).flat());nets=layouts(tiles);arrangementCache.clear();
  const ids=tiles.flatMap(t=>hex.map((_,e)=>{const m=matching(tiles,t.id,e);return [`${t.id}:${e}`,`${m.id}:${m.e}`].sort().join('|');}));
  const unique=[...new Set(ids)].sort();edgeLabels=tiles.map(t=>hex.map((_,e)=>cm===1?'P':String.fromCharCode(97+unique.indexOf(ids[t.id*6+e]))));
 }
 if(!arrangementCache.has(state.arrangement))arrangementCache.set(state.arrangement,makeArrangement(tiles,state.arrangement,nets));
 arrangement=arrangementCache.get(state.arrangement);net=arrangement.net;$('layout').innerHTML=Object.entries(arrangementNames).filter(([key])=>cm?key===state.arrangement:! ['single','double'].includes(key)).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');$('layout').value=state.arrangement;$('method-note').textContent=notes[state.method];$('height').closest('label').hidden=state.method!=='tetrakis';updateOptimizerUI();
 tiling=arrangement.tiling;meshSignature=null;
 if(fit)fitView();else draw();
}
function rotateScreen(p,angle=state.gridRotation*Math.PI/180){const c=Math.cos(angle),s=Math.sin(angle);return [c*p[0]-s*p[1],s*p[0]+c*p[1]];}
function viewBounds(padding=0){
 const unit=scale*state.zoom,corners=[];
 for(const x of [-w/2-padding,w/2+padding])for(const y of [-h/2-padding,h/2+padding]){const p=rotateScreen([(x-state.panX)/unit,(y-state.panY)/unit],-state.gridRotation*Math.PI/180);corners.push([p[0],-p[1]]);}
 return {left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),bottom:Math.min(...corners.map(p=>p[1])),top:Math.max(...corners.map(p=>p[1]))};
}
function updateVisibleMesh(){
 const unit=scale*state.zoom;
 const bounds=viewBounds(relief?.ready&&$('relief-enabled').checked?relief.padding(appliedLighting(),unit):0);
 const next=tiling?visibleTiles(tiling,bounds):net,signature=state.arrangement+next.map(t=>`${t.id},${t.r},${t.x},${t.y}`).join(';');
 if(signature===meshSignature)return;meshSignature=signature;visible=next;
 const verts=[];for(const t of visible)for(const p of (t.drawPatches||tiles[t.id].patches))for(let i=0;i<3;i++)verts.push(...canvasWorld(p.xy[i],t),...(p.weights?p.weights[i]:[0,1,2].map(j=>j===i?1:0)),...p.v.flat(),t.opacity,...p.xy[i],t.id);
 count=verts.length/18;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
}
const attributeLayouts=new WeakMap();
function drawGeometry(p){
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 let layout=attributeLayouts.get(p);
 if(!layout){
  let off=0;const attributes=[];
  for(const [name,n] of [['position',2],['bary',3],['va',3],['vb',3],['vc',3],['opacity',1],['regionPosition',2],['region',1]]){const loc=gl.getAttribLocation(p,name);if(loc>=0)attributes.push({loc,n,off});off+=n;}
  layout={attributes,max:gl.getParameter(gl.MAX_VERTEX_ATTRIBS)};attributeLayouts.set(p,layout);
 }
 for(let i=0;i<layout.max;i++)gl.disableVertexAttribArray(i);
 for(const {loc,n,off} of layout.attributes){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,72,off*4);}
 gl.drawArrays(gl.TRIANGLES,0,count);
}
function bounds(){const all=arrangement.outline?arrangement.outline.flat().map(([x,y])=>{const v=rotateScreen([x,-y]);return [v[0],-v[1]];}):arrangement.clip?arrangement.clip.map(([x,y])=>{const v=rotateScreen([x,-y]);return [v[0],-v[1]];}):net.flatMap(t=>(t.polygon||hex).map(p=>{const v=rotateScreen(canvasWorld(p,t));return [v[0],-v[1]];}));return [Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>p[1]))];}
function fitView(){
 const b=bounds(),panel=document.querySelector('aside').getBoundingClientRect();
 const wide=w>700||w>h;
 let left=wide?Math.min(w-100,panel.right+28):24;
 let top=state.sidebarExpanded&&!wide?Math.min(h-100,panel.bottom+20):!state.sidebarExpanded&&wide?24:Math.min(h*.25,156);
 let right=w-24,bottom=state.sidebarExpanded||wide?h-84:Math.max(top+80,panel.top-24);
 if(compactDevice&&!state.sidebarExpanded){({left,right,top,bottom}=mobileFitRect(w,h,$('map-heading').getBoundingClientRect().bottom,panel.top,panel.right));}
 scale=Math.max(1,Math.min(Math.max(40,right-left)/(b[2]-b[0]),Math.max(40,bottom-top)/(b[3]-b[1])));
 state.zoom=1;state.panX=(left+right-w)/2-(b[0]+b[2])/2*scale;state.panY=(top+bottom-h)/2+(b[1]+b[3])/2*scale;draw();
}
function resize(){if(exporting)return;headingBounds=null;const rect=$('stage').getBoundingClientRect(),rotated=compactDevice&&persistenceReady&&(w>h)!==(rect.width>rect.height);w=rect.width;h=rect.height;dpr=Math.min(window.devicePixelRatio||1,+$('quality').value,compactDevice?1.5:3);const pixelWidth=Math.round(w*dpr),pixelHeight=Math.round(h*dpr);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;overlay.width=pixelWidth;overlay.height=pixelHeight;}
 if(!persistenceReady){if(restoredView&&!compactDevice){scale=restoredView.scale;state.zoom=restoredView.zoom;state.panX=restoredView.panX;state.panY=restoredView.panY;}else{fitView();const offset=shareSelection.layout.viewOffset;if(offset&&!compactDevice){state.panX=offset[0]*scale;state.panY=offset[1]*scale;}}persistenceReady=true;}else if(rotated&&!state.sidebarExpanded)fitView();draw();}
function point(p,t){const v=rotateScreen(canvasWorld(p,t));return [w/2+v[0]*scale*state.zoom+state.panX,h/2+v[1]*scale*state.zoom+state.panY];}
function draw(){if(exporting)return;scheduleSave();if(queued)return;queued=true;requestAnimationFrame(render);}
let fractalGridKey=null,fractalPaths=[];
function drawFractalGrid(){
 if(!$('fractalgrid').checked||state.subgridWidth<=0)return;
 if(fractalGridKey!==meshSignature){
  fractalGridKey=meshSignature;const strongest=new Map();
  for(const t of arrangement.gridParents||visible)fractalRegion().lines.forEach((edges,level)=>{
   for(const [a,b] of edges){const p=world(a,t),q=world(b,t),id=edgeKey(p,q),old=strongest.get(id);if(!old||level>old.level)strongest.set(id,{p,q,level});}
  });
  for(const [p,q] of arrangement.outlineEdges||[])strongest.set(edgeKey(p,q),{p,q,level:4});
  fractalPaths=fractalOpacities.map(()=>new Path2D());
  for(const {p,q,level} of strongest.values()){fractalPaths[level].moveTo(...p);fractalPaths[level].lineTo(...q);}
 }
 const unit=scale*state.zoom;
 ctx.save();ctx.translate(w/2+state.panX,h/2+state.panY);ctx.rotate(state.gridRotation*Math.PI/180);ctx.scale(unit,-unit);
 ctx.strokeStyle=$('hex-grid-color').value;ctx.lineWidth=state.subgridWidth*Math.max(.65,unit*.0025)/unit;
 fractalPaths.forEach((path,level)=>{ctx.globalAlpha=fractalOpacities[level];ctx.stroke(path);});ctx.restore();
}
function traceOutline(){ctx.beginPath();for(const loop of arrangement.outline){loop.forEach((p,i)=>i?ctx.lineTo(...point(p,{x:0,y:0,r:0})):ctx.moveTo(...point(p,{x:0,y:0,r:0})));ctx.closePath();}}
function drawSubgrid(){
 if(!$('subgrid').checked&&!$('dotgrid').checked)return;
 const color=$('hex-grid-color').value,levels=subgridLevels;
 for(const t of visible){
  const parentPolygon=t.polygon||hex;
  ctx.save();ctx.beginPath();parentPolygon.forEach((p,i)=>{const xy=point(p,t);i?ctx.lineTo(...xy):ctx.moveTo(...xy);});ctx.closePath();ctx.clip();
  if($('subgrid').checked&&state.subgridWidth>0){
   for(const [index,cells] of levels.slice(1,3).entries()){
   ctx.beginPath();ctx.strokeStyle=color;ctx.globalAlpha=index===0?.14:.72;ctx.lineWidth=state.subgridWidth*(index===0?Math.max(.5,scale*state.zoom*.002):Math.max(.8,scale*state.zoom*.0038));
    for(const cell of cells){const corners=hex.map(([x,y])=>point(rotateLocal([x*cell.scale,y*cell.scale],cell.angle).map((v,i)=>v+cell.center[i]),t));for(let e=0;e<6;e++){ctx.moveTo(...corners[e]);ctx.lineTo(...corners[(e+1)%6]);}}
    ctx.stroke();
   }
  }
  if($('dotgrid').checked){
   ctx.beginPath();ctx.fillStyle='#fff';ctx.globalAlpha=.2;const dots=levels[3],radius=Math.max(1.4,Math.min(3.2,scale*state.zoom*gosperScale*gosperScale*gosperScale*.11));
   for(const dot of dots){const [x,y]=point(dot.center,t);ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);}ctx.fill();
  }
  ctx.restore();
 }
}

let indicatrixKey=null,indicatrixPaths=[],indicatrixWorker=null,indicatrixBusy=false,indicatrixJob=null;
function prepareIndicatrix(job){
 indicatrixJob=job;
 if(indicatrixBusy)return;
 if(!indicatrixWorker){
  indicatrixWorker=new Worker(new URL('./indicatrix-worker.mjs?v=circular-2',import.meta.url),{type:'module'});
  indicatrixWorker.onmessage=({data})=>{
   indicatrixBusy=false;
   if(data.key!==indicatrixJob.key){prepareIndicatrix(indicatrixJob);return;}
   if(data.error){$('indicatrix-status').textContent='Circles could not be prepared. Try another density.';return;}
   indicatrixPaths=data.regions.map(points=>{const path=new Path2D();for(let i=0;i<points.length;i+=4){path.moveTo(points[i],points[i+1]);path.lineTo(points[i+2],points[i+3]);}return path;});
   $('indicatrix-status').textContent='';draw();
  };
  indicatrixWorker.onerror=()=>{
   indicatrixBusy=false;indicatrixWorker.terminate();indicatrixWorker=null;
   $('indicatrix-status').textContent='Circles could not be prepared. Try another density.';
  };
 }
 indicatrixBusy=true;indicatrixWorker.postMessage(job);
}
function drawIndicatrixes(){
 const mode=$('indicatrix').value;if(mode==='off'||!ready){$('indicatrix-status').textContent='';return;}
 const level=mode==='4x7'?1:mode==='4x49'?2:3;
 const key=[geometryKey,level,state.bias,$('interpolation').value].join('/');
 if(key!==indicatrixKey){
  indicatrixKey=key;indicatrixPaths=[];$('indicatrix-status').textContent='Preparing circles…';
  prepareIndicatrix({key,method:state.method,height:state.height,level,bias:state.bias,blend:+$('interpolation').value});
 }
 if(!indicatrixPaths.length)return;
 const unit=scale*state.zoom;
 for(const tile of visible){
  ctx.save();ctx.beginPath();(tile.polygon||hex).forEach((p,i)=>i?ctx.lineTo(...point(p,tile)):ctx.moveTo(...point(p,tile)));ctx.closePath();ctx.clip();
  const origin=point([0,0],tile),x=point([1,0],tile),y=point([0,1],tile);
  ctx.transform(x[0]-origin[0],x[1]-origin[1],y[0]-origin[0],y[1]-origin[1],origin[0],origin[1]);
  ctx.globalAlpha=.8;ctx.strokeStyle='#fff';ctx.lineWidth=2.5/unit;ctx.stroke(indicatrixPaths[tile.id]);
  ctx.strokeStyle='#243f49';ctx.lineWidth=1.2/unit;ctx.stroke(indicatrixPaths[tile.id]);ctx.restore();
 }
}
function materialMode(){return displayedSource==='ivory'?'ivory':displayedSource==='elevation'?'elevation':'source';}
function bindMaterialUniforms(){
 gl.uniform1i(uniforms.circularMode,circularMode(state.method));gl.uniform1i(uniforms.ecologyHex,displayedSource==='ecology'?1:0);gl.uniform1i(uniforms.ecologyBridges,hexBridgesEnabled);gl.uniform1i(uniforms.ecologyOcta,state.method==='octa'?1:0);gl.uniform3fv(uniforms['ecologyVertices[0]'],ecologyVertices);
 gl.uniform1f(uniforms.colorFade,legendFade());gl.uniform1i(uniforms.landCutout,$('relief-enabled').checked&&lightingControls().treatment==='land'&&relief?.ready?1:0);
 gl.uniform3fv(uniforms.background,[1,3,5].map(i=>parseInt($('background-color').value.slice(i,i+2),16)/255));
 gl.uniform1i(uniforms.material,['source','ivory','elevation'].indexOf(relief?.ready?materialMode():'source'));gl.uniform1f(uniforms.materialSea,appliedLighting().reliefSeaLevel/255);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,heightTexture);gl.uniform1i(uniforms.heightMap,3);gl.activeTexture(gl.TEXTURE0);
}
function bindRiverUniforms(){gl.uniform1i(uniforms.riversVisible,$('rivers-visible').checked?1:0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.uniform1i(uniforms.riverMap,1);gl.activeTexture(gl.TEXTURE0);}
function render(refined=false,exportMode=false){if(exporting&&!exportMode)return;queued=false;document.documentElement.style.setProperty('--map-background',$('background-color').value);const background=$('background-color').value,brightness=[1,3,5].reduce((sum,i,k)=>sum+parseInt(background.slice(i,i+2),16)*[.299,.587,.114][k],0);document.documentElement.style.setProperty('--heading-ink',brightness>145?'#193c49':'#f6f4ed');for(const id of ['background-color','border-color','hex-grid-color','graticule-color'])$(id+'-value').value=$(id).value;syncOptionCards();updateDistortionLegend();$('zoom-value').textContent=Math.round(state.zoom*100)+'%';if(!ready||!gl||!program)return;const lighting=$('relief-enabled').checked&&relief?.ready?cachedLighting():null;updateVisibleMesh();if(!exportMode)updateHeadingVisibility();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(...[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)/255),1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform1f(uniforms.gridRotation,state.gridRotation*Math.PI/180);gl.uniform2f(uniforms.size,w,h);gl.uniform3f(uniforms.view,scale*state.zoom,state.panX,state.panY);gl.uniform3f(uniforms.angles,state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);gl.uniform1f(uniforms.bias,state.bias);gl.uniform1f(uniforms.blend,+$('interpolation').value);gl.uniform1f(uniforms.grid,$('graticule').checked?state.grid*Math.PI/180:0);gl.uniform1f(uniforms.gridWidth,.6*state.graticuleWidth/(scale*state.zoom));gl.uniform3fv(uniforms.gridColor,[1,3,5].map(i=>parseInt($('graticule-color').value.slice(i,i+2),16)/255));gl.uniform1i(uniforms.palette,displayedSource==='continents'?['atlas','original','night'].indexOf($('palette').value):1);gl.uniform1i(uniforms.distortion,derivativeSupport?($('distortion').checked?3:0):0);gl.uniform1f(uniforms.distortionOpacity,state.distortionOpacity);gl.uniform1f(uniforms.pixelScale,scale*state.zoom*dpr);gl.uniform1i(uniforms.map,0);gl.uniform1i(uniforms.felvClip,arrangement.clip?1:0);
 const drawColor=(width=w,height=h,baseOnly=false,overlayOnly=false)=>{gl.useProgram(program);gl.uniform1i(uniforms.overlayOnly,overlayOnly?1:0);gl.uniform1f(uniforms.grid,!baseOnly&&$('graticule').checked?state.grid*Math.PI/180:0);gl.uniform1i(uniforms.distortion,!baseOnly&&derivativeSupport?($('distortion').checked?3:0):0);gl.uniform2f(uniforms.size,width,height);bindMaterialUniforms();bindRiverUniforms();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);drawGeometry(program);};
 drawColor(w,h,!!lighting);
 if(lighting){projectedLighting.composite(lighting,w,h,scale*state.zoom,state.panX,state.panY,state.shadowOpacity,state.lightOpacity);
  if($('graticule').checked||$('distortion').checked){gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);drawColor(w,h,false,true);gl.disable(gl.BLEND);}
 }

 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.lineJoin='round';
 ctx.save();
 if(arrangement.outline){traceOutline();ctx.clip();}
 else if(!tiling){ctx.beginPath();for(const t of visible){(t.polygon||hex).forEach((p,i)=>i?ctx.lineTo(...point(p,t)):ctx.moveTo(...point(p,t)));ctx.closePath();}ctx.clip();}
 if(arrangement.clip){ctx.beginPath();arrangement.clip.forEach((p,i)=>i?ctx.lineTo(...point(p,{x:0,y:0,r:0})):ctx.moveTo(...point(p,{x:0,y:0,r:0})));ctx.closePath();ctx.clip();}
 drawSubgrid();drawFractalGrid();drawIndicatrixes();
 for(const t of visible){ctx.globalAlpha=t.opacity;ctx.beginPath();(t.polygon||hex).forEach((p,i)=>{const xy=point(p,t);i?ctx.lineTo(...xy):ctx.moveTo(...xy);});ctx.closePath();ctx.strokeStyle=$('border-color').value;if(state.line>0&&!arrangement.outline){ctx.lineWidth=state.line;ctx.stroke();}
 if($('construction').checked){ctx.strokeStyle='#cb6d3199';ctx.lineWidth=1;ctx.setLineDash([4,4]);for(const p of (t.drawPatches||tiles[t.id].patches)){ctx.beginPath();p.xy.forEach((v,i)=>i?ctx.lineTo(...point(v,t)):ctx.moveTo(...point(v,t)));ctx.closePath();ctx.stroke();}ctx.setLineDash([]);}
 if($('labels').checked){const c=point(t.polygon?t.polygon.reduce((s,p)=>s.map((v,i)=>v+p[i]/t.polygon.length),[0,0]):[0,0],t);ctx.beginPath();ctx.arc(...c,14,0,Math.PI*2);ctx.fillStyle='#f6fbfbea';ctx.fill();ctx.fillStyle='#214754';ctx.font='600 12px "DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ABCD'[t.id],...c);
 for(let e=0;e<(t.polygon?0:6);e++){const mid=hex[e].map((v,i)=>(v+hex[(e+1)%6][i])*.46);const xy=point(mid,t);ctx.font='10px "Space Grotesk",sans-serif';ctx.fillStyle='#f6fbfbde';ctx.fillRect(xy[0]-8,xy[1]-7,16,14);ctx.fillStyle='#3d6774';ctx.fillText(edgeLabels[t.id][e],...xy);}}
 }
 ctx.globalAlpha=1;
 if(arrangement.outline&&state.line>0){traceOutline();ctx.strokeStyle=$('border-color').value;ctx.lineWidth=state.line;ctx.stroke();}
 if(state.line>0){ctx.strokeStyle='#d33d42';ctx.lineWidth=state.line*2.5;
 for(const t of visible)for(let e=0;e<6;e++)if(t.bad[e]){const local=(e-t.r+6)%6;ctx.beginPath();ctx.moveTo(...point(hex[local],t));ctx.lineTo(...point(hex[(local+1)%6],t));ctx.stroke();}
 for(const edge of arrangement.seams||[])if(edge.error>1e-6){ctx.beginPath();ctx.moveTo(...point(edge.a,{x:0,y:0,r:0}));ctx.lineTo(...point(edge.b,{x:0,y:0,r:0}));ctx.stroke();}
 }
 ctx.restore();$('status').textContent=arrangementNames[state.arrangement]+(state.line>0?' · red edges mark mismatched joins':' · borders hidden');
}
for(const b of document.querySelectorAll('.method'))b.onclick=()=>{state.method=b.dataset.method;state.layout=0;document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el===b));rebuild();};
$('layout').onchange=()=>{state.arrangement=$('layout').value;rebuild();if($('optimize').checked)applySearch();};for(const id of ['interpolation','graticule','construction','subgrid','dotgrid','fractalgrid','labels','palette','distortion','indicatrix'])$(id).onchange=draw;$('quality').onchange=resize;
$('fractalgrid').addEventListener('change',()=>{if($('fractalgrid').checked){$('subgrid').checked=false;$('dotgrid').checked=false;}draw();});
for(const id of ['subgrid','dotgrid'])$(id).addEventListener('change',()=>{if($(id).checked)$('fractalgrid').checked=false;draw();});
function ensureRelief(){if(!gl||!program)return;if(!relief){relief=new ReliefRenderer(gl,vs,draw,message=>$('relief-status').textContent=message);relief.maxSourceWidth=compactDevice?1536:4096;heightTexture=relief.heightTextures[0];}relief.load();}
function lightingControls(){return $('lighting-preset').value==='custom'&&customApplied?customApplied:{treatment:$('relief-treatment').value,tone:$('relief-tone').value};}
function appliedLighting(){return lightingSettings($('lighting-preset').value,{...state,...($('lighting-preset').value==='custom'?customApplied:null)});}
function cachedLighting(){
 const settings=appliedLighting(),preset=$('lighting-preset').value,controls=lightingControls();
 if(preset==='none')return null;
 if(!projectedLighting)projectedLighting=new ProjectedLighting(gl);
 // The overview covers finite maps or one repeating honeycomb period.
 // Close-ups use bounded, non-repeating image windows at higher density.
 let b=bounds(),patch=[];
 if(tiling){b=[0,0,3*tiling.size,Math.sqrt(3)*tiling.size];patch=b;}

 const baseKey=lightingKey(settings,preset,[$('interpolation').value,controls.treatment,controls.tone,$('rivers-visible').checked,riverGeneration,...patch]);
 const pad=tiling?0:relief.padding(settings,100)/100+.15;
 const baseRect=[b[0]-pad,-b[3]-pad,b[2]-b[0]+pad*2,b[3]-b[1]+pad*2];
 const view={unit:scale*state.zoom,width:w,height:h,dpr,panX:state.panX,panY:state.panY};
 let plan=lightingPlan(baseRect,{...view,compact:compactDevice,maxSize:Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)),repeat:!!tiling});
 const planKey=p=>baseKey+'/'+JSON.stringify([p.level,...p.rect]);
 let key=planKey(plan);
 const cached=projectedLighting.get(key);if(cached){canvas.dataset.lightingLevel=plan.level;return cached;}
 const overviewKey=planKey({...plan,level:0,rect:baseRect});
 const overview=projectedLighting.get(overviewKey);
 const fallback=[...projectedLighting.entries.values()].filter(e=>e.baseKey===baseKey&&lightingCovers(e,view)).sort((a,b)=>b.level-a.level)[0]||overview;
 if(dragging)return fallback||null;
 // Keep the overview visible until zooming settles, then bake only the new view.
 if(plan.level>0&&!exporting&&lightingReadyKey!==key){
  if(lightingRefineKey!==key){clearTimeout(lightingRefineTimer);const requestedKey=key;lightingRefineKey=key;lightingRefineTimer=setTimeout(()=>{lightingReadyKey=requestedKey;lightingRefineKey=null;draw();},180);}
  if(fallback)return fallback;
  plan={level:0,density:Math.min(compactDevice?1000:2200,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))/Math.max(baseRect[2],baseRect[3]),rect:baseRect,repeat:!!tiling};key=overviewKey;
 }
 const saved={w,h,scale,dpr,zoom:state.zoom,panX:state.panX,panY:state.panY,cw:canvas.width,ch:canvas.height,gridRotation:state.gridRotation};
 let entry;
 try{
  if(plan.repeat){settings.reliefAzimuth+=state.gridRotation;settings.gridRotation=0;state.gridRotation=0;}
  const rect=[...plan.rect];
  scale=plan.density;state.zoom=1;dpr=1;w=Math.ceil(rect[2]*scale);h=Math.ceil(rect[3]*scale);
  rect[2]=w/scale;rect[3]=h/scale;state.panX=-rect[0]*scale-w/2;state.panY=-rect[1]*scale-h/2;canvas.width=w;canvas.height=h;meshSignature=null;updateVisibleMesh();
  const seams=[];for(const t of visible)for(let e=0;e<6;e++)if(t.bad[e]){const local=(e-t.r+6)%6;seams.push([canvasWorld(hex[local],t),canvasWorld(hex[(local+1)%6],t)]);}
  for(const edge of arrangement.seams||[])if(edge.error>1e-6)seams.push([[edge.a[0],-edge.a[1]],[edge.b[0],-edge.b[1]]]);
  entry={rect,textures:[],repeat:plan.repeat,level:plan.level,baseKey,angle:saved.gridRotation*Math.PI/180};
  for(const lightingPass of [1,2]){
   relief.render({width:w,height:h,dpr:1,unit:scale,state:{...settings,panX:state.panX,panY:state.panY},blend:+$('interpolation').value,clip:arrangement.clip,material:'source',treatment:controls.treatment,tone:controls.tone,signature:key,drawColor:()=>{},drawGeometry,seams,riverTexture,riverVisible:$('rivers-visible').checked,riverDepth:settings.reliefRiverDepth,pixelBudget:compactDevice?1200000:5500000,refined:true,lightingPass});
   entry.textures.push(projectedLighting.snapshot());
  }
  projectedLighting.store(key,entry);canvas.dataset.lightingBakes=projectedLighting.bakes;canvas.dataset.lightingLevel=plan.level;canvas.dataset.lightingResolution=w+'×'+h;$('relief-status').textContent=plan.level?'Close-up lighting layers ready':'Lighting layers ready';
  return entry;
 }catch(error){for(const t of entry?.textures||[])gl.deleteTexture(t);$('relief-enabled').checked=false;$('relief-status').textContent='Lighting could not be prepared on this device.';console.warn('Lighting layers:',error);return null;}
 finally{w=saved.w;h=saved.h;scale=saved.scale;dpr=saved.dpr;state.zoom=saved.zoom;state.panX=saved.panX;state.panY=saved.panY;state.gridRotation=saved.gridRotation;canvas.width=saved.cw;canvas.height=saved.ch;meshSignature=null;relief.releaseDetail();}
}
function updateRelief(){
 if(compactDevice&&!$('relief-enabled').checked)$('lighting-preset').value='none';
 const enabled=$('relief-enabled').checked,preset=$('lighting-preset').value;
 if(preset==='custom'&&!customApplied)customApplied={...Object.fromEntries(Object.keys(reliefDefaults).filter(k=>k!=='reliefColorFade').map(k=>[k,state[k]])),treatment:$('relief-treatment').value,tone:$('relief-tone').value};
 $('relief-custom').hidden=compactDevice||preset!=='custom';$('lighting-opacity-controls').hidden=!enabled;
 canvas.style.filter='none';updateLegendFade();
 if(enabled||['ivory','elevation'].includes($('map-source').value))ensureRelief();
 $('relief-source-note').hidden=!enabled||!['terrain','marble'].includes($('map-source').value);
 $('relief-panel-note').textContent='Opacity adjusts the saved lighting layers. Custom lighting changes take effect when you press Apply.';
 draw();
}
$('lighting-preset').onchange=()=>{$('relief-enabled').checked=$('lighting-preset').value!=='none';if($('lighting-preset').value==='custom')customApplied=null;updateRelief();};
$('apply-lighting').onclick=()=>{customApplied=null;updateRelief();scheduleSave();};
$('relief-enabled').onchange=updateRelief;
for(const id of ['relief-treatment','relief-tone'])$(id).onchange=()=>{if($('lighting-preset').value==='custom')$('relief-status').textContent='Apply lighting to update the layers.';else updateRelief();};

function mode(value){state.mode=value;$('pan').classList.toggle('selected',value==='pan');$('rotate').classList.toggle('selected',value==='rotate');scheduleSave();} $('pan').onclick=()=>mode('pan');$('rotate').onclick=()=>mode('rotate');$('fit').onclick=fitView;
function zoom(factor,x=w/2,y=h/2){const old=state.zoom;state.zoom=Math.min(12,Math.max(.25,old*factor));const r=state.zoom/old;state.panX=(state.panX-(x-w/2))*r+(x-w/2);state.panY=(state.panY-(y-h/2))*r+(y-h/2);draw();}
$('zoom-in').onclick=()=>zoom(1.25);$('zoom-out').onclick=()=>zoom(.8);canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
let dragging=null;const pointers=new Map();let pinchDistance=0,grabbed=null;
function cursorSphere(e){
 const rect=canvas.getBoundingClientRect(),unit=scale*state.zoom;
 const p=rotateScreen([(e.clientX-rect.left-w/2-state.panX)/unit,(e.clientY-rect.top-h/2-state.panY)/unit],-state.gridRotation*Math.PI/180);
 const xy=[p[0],-p[1]];
 if(arrangement.outline&&!pointInLoops(xy,arrangement.outline))return null;
 if(arrangement.clip){const fy=xy[1],fx=xy[0]-Math.sqrt(3)*fy;if(fy<0||fy>Math.sqrt(3)||fx< -1||fx>5)return null;}
 // In a repeated net each displayed hexagon has its own orientation.
 const candidates=tiling?visibleTiles(tiling,{left:xy[0],right:xy[0],bottom:xy[1],top:xy[1]}):net;
 for(const t of candidates){const sample=sphereAt(xy,t,tiles[t.id],state.bias,+$('interpolation').value);if(sample)return sample;}
 return null;
}
canvas.onpointerdown=e=>{
 canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);dragging={x:e.clientX,y:e.clientY};
 const sample=state.mode==='rotate'?cursorSphere(e):null;
 if(pointers.size===1&&state.mode==='rotate'&&!sample)mode('pan');
 grabbed=sample?geographicPoint(state,sample):null;
 if(pointers.size===2){grabbed=null;const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);}
};
canvas.onpointermove=e=>{
 if(!pointers.has(e.pointerId)||!dragging)return;
 pointers.set(e.pointerId,[e.clientX,e.clientY]);
 if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),r=canvas.getBoundingClientRect();if(pinchDistance)zoom(d/pinchDistance,(p[0][0]+p[1][0])/2-r.left,(p[0][1]+p[1][1])/2-r.top);pinchDistance=d;dragging={x:e.clientX,y:e.clientY};return;}
 const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;dragging={x:e.clientX,y:e.clientY};
 if(state.mode==='rotate'){
  const sample=cursorSphere(e);if(!sample)return;
  if(!grabbed){grabbed=geographicPoint(state,sample);return;}
  leaveSearch();setRotation(followPoint(state,sample,grabbed));
 }else{grabbed=null;state.panX+=dx;state.panY+=dy;draw();}
};
function end(e){draw();pointers.delete(e.pointerId);pinchDistance=0;grabbed=null;dragging=pointers.size?{x:[...pointers.values()][0][0],y:[...pointers.values()][0][1]}:null;}
canvas.onpointerup=end;canvas.onpointercancel=end;

$('reset').onclick=()=>{for(const [id,value] of Object.entries({lon:0,lat:0,roll:0,bias:1,height:1.5})){state[id]=value;$(id).value=value;$(id+'-value').value=value+(['lon','lat','roll'].includes(id)?'°':'');}$('interpolation').value='0';rebuild();};
$('research').onclick=()=>$('research-dialog').showModal();$('close-dialog').onclick=()=>$('research-dialog').close();$('research-dialog').onclick=e=>{if(e.target===$('research-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
async function exportMap(){
 if(exporting||!ready||!gl||!program)return;
 const button=$('export'),format=$('export-scale').value,isPDF=format.startsWith('pdf-'),factor=Number(isPDF?format.slice(4):format),saved={w,h,dpr,panX:state.panX,panY:state.panY};
 const crop={x:0,y:0,width:saved.w,height:saved.h};
 const control=new AbortController(),dialog=$('export-progress'),progress=$('export-progress-text'),main=document.querySelector('main');
 const out=document.createElement('canvas'),context=out.getContext('2d',{willReadFrequently:true});
 const cancel=()=>control.abort(new DOMException('Export cancelled','AbortError'));
 $('export-cancel').onclick=cancel;dialog.oncancel=event=>{event.preventDefault();cancel();};
 updateMapUrl();clearTimeout(saveTimer);exporting=true;button.disabled=true;main.inert=true;dialog.showModal();progress.textContent='Preparing…';
 try{
  const deadline=performance.now()+120000;
  if(relief&&$('relief-enabled').checked)await relief.load(false,control.signal);
  if($('relief-enabled').checked&&relief?.ready)cachedLighting();
  while($('map-loading').textContent==='Loading map…'||($('relief-enabled').checked&&relief?.loading)||$('indicatrix-status').textContent==='Preparing circles…'){control.signal.throwIfAborted();if(performance.now()>deadline)throw Error('Map assets are still loading; please retry when they finish');await new Promise(resolve=>setTimeout(resolve,100));}
 if(isPDF&&!tiling){const b=bounds(),unit=scale*state.zoom,pad=($('relief-enabled').checked&&relief?.ready?relief.padding(appliedLighting(),unit):0)+12;crop.x=saved.w/2+saved.panX+b[0]*unit-pad;crop.y=saved.h/2+saved.panY-b[3]*unit-pad;crop.topInset=pad;crop.width=(b[2]-b[0])*unit+2*pad;crop.height=(b[3]-b[1])*unit+2*pad;}
  const renderTile=async(x,y,width,height,ratio=factor)=>{
   control.signal.throwIfAborted();
   // Overlap tiles enough to include antialiasing and the relief shadow blur.
   const bleed=4;
   const maxDimension=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
   if(Math.max(width,height)+2*bleed>maxDimension)throw Error('Shadow softness at this zoom exceeds the device tile limit; reduce zoom or softness and retry');
   w=(width+2*bleed)/ratio;h=(height+2*bleed)/ratio;dpr=ratio;
   state.panX=saved.w/2+saved.panX-crop.x-(x-bleed)/ratio-w/2;state.panY=saved.h/2+saved.panY-crop.y-(y-bleed)/ratio-h/2;
   canvas.width=width+2*bleed;canvas.height=height+2*bleed;overlay.width=canvas.width;overlay.height=canvas.height;
   if(gl.drawingBufferWidth!==canvas.width||gl.drawingBufferHeight!==canvas.height)throw Error('This device could not allocate an export tile');
   render(true,true);
   out.width=width;out.height=height;context.fillStyle=$('background-color').value;context.fillRect(0,0,width,height);
   context.drawImage(canvas,-bleed,-bleed);context.drawImage(overlay,-bleed,-bleed);
   return context.getImageData(0,0,width,height).data;
  };
  const onProgress=value=>progress.textContent=`Rendering ${isPDF?'PDF':'PNG'} ${factor}× · ${Math.round(value*100)}%`;
  const blob=isPDF?await printPDF({rasterScale:factor,width:crop.width,height:crop.height,mapInsetTop:crop.topInset||0,renderTile,signal:control.signal,onProgress,background:$('background-color').value,lifezones:displayedSource==='ecology'?{colorFade:legendFade(),landCount:classCount('land-classes'),oceanCount:classCount('ocean-classes')}:null}):await pngFromTiles({width:Math.round(saved.w*factor),height:Math.round(saved.h*factor),renderTile,signal:control.signal,onProgress});
  control.signal.throwIfAborted();
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hexagonal-world-${state.method}-${factor}x.${isPDF?'pdf':'png'}`;a.click();trackEvent('download',factor+'x-'+(isPDF?'pdf':'png'));setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(error){if(error.name!=='AbortError'){console.warn('Map export:',error);$('relief-status').textContent='Export failed: '+error.message;}}
 finally{w=saved.w;h=saved.h;dpr=saved.dpr;state.panX=saved.panX;state.panY=saved.panY;out.width=out.height=1;relief?.releaseDetail();exporting=false;main.inert=false;dialog.close();button.disabled=false;meshSignature=null;resize();}
}
$('export').onclick=exportMap;
const img=new Image();img.onload=()=>{if(!gl||!program)return;texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);let source=img;const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(img.width>max){source=document.createElement('canvas');source.width=max;source.height=Math.round(img.height*max/img.width);source.getContext('2d').drawImage(img,0,0,source.width,source.height);}gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);ready=true;updateOptimizerUI();if($('optimize').checked)applySearch();updateRiverLayer();updateMapSource();draw();};img.onerror=()=>fail('The continent texture could not be loaded. Reload the app to try again.');img.src=compactDevice?'maps/mobile/continents.png':'continents.png';
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;fail('Graphics were interrupted. Your map settings are saved.');const retry=document.createElement('button');retry.textContent='Restore map';retry.onclick=()=>location.reload();$('error').append(retry);});

function setRotation(angles){for(const id of ['lon','lat','roll']){state[id]=angles[id];$(id).value=angles[id];$(id+'-value').value=angles[id].toFixed(2)+'°';}draw();}
function updateOptimizerUI(){
 const rus=Boolean(circularMode(state.method)),preset=searchPresets[state.method]?.[state.arrangement],available=!rus&&Boolean(preset?.results?.length);
 $('optimize').closest('.optimizer').hidden=rus;$('optimize').disabled=!ready||!available;$('clearance').disabled=!ready||!available;
 if(!available)$('optimize').checked=false;
 $('optimizer-note').textContent=available?(preset.objective==='all-hex-edges'?'Every distinct hexagon border is scored across the repeating map.':'Outer boundaries and both sides of red seams are scored.'):'No cut-search preset is available for this projection and format.';
}
function applySearch(){
 if(!$('optimize').checked)return;
 const preset=searchPresets[state.method]?.[state.arrangement];
 if(circularMode(state.method)||!preset?.results?.length){$('optimize').checked=false;updateOptimizerUI();return;}
 // Each saved rotation belongs to the geometry it was optimized for.
 state.bias=preset.config.bias;$('bias').value=state.bias;$('bias-value').value=state.bias;
 $('interpolation').value=String(preset.config.blend);
 if(state.method==='tetrakis'&&state.height!==preset.config.height){state.height=preset.config.height;$('height').value=state.height;$('height-value').value=state.height;rebuild(false);}
 setRotation(preset.results[Math.min(preset.results.length-1,Math.round(state.clearance))].angles);
}
$('optimize').onchange=()=>{applySearch();scheduleSave();};
function leaveSearch(){$('optimize').checked=false;scheduleSave();}
for(const id of ['lon','lat','roll','height','bias','interpolation'])$(id).addEventListener('input',leaveSearch);
for(const el of document.querySelectorAll('.method,#reset'))el.addEventListener('click',leaveSearch);

function restoreSettings(provided){
 try{
  const saved=provided||readMapStateFromUrl();if(!saved||saved.version!==1)return;
  const ss=saved.state||{};
  if(typeof ss.sidebarExpanded==='boolean')state.sidebarExpanded=ss.sidebarExpanded;
  if(Object.hasOwn(arrangementNames,ss.arrangement))state.arrangement=ss.arrangement;
  if(['tetra','octa','rhombic','tetrakis','lambert-one','lambert-two'].includes(ss.method))state.method=ss.method;
  for(const id of ['lon','lat','roll','bias','height','gridRotation','grid','line','clearance','distortionOpacity','riverWidth','riverLevels','subgridWidth','graticuleWidth','shadowOpacity','lightOpacity',...reliefRanges.map(s=>s[0])]){
   const el=$(id),value=ss[id];if(typeof value!=='number'||!Number.isFinite(value))continue;
   state[id]=Math.max(+el.min,Math.min(+el.max,id==='clearance'?Math.round(value):value));el.value=state[id];
   $(id+'-value').value=Number(state[id].toFixed(2))+(reliefRanges.find(s=>s[0]===id)?.[6]??rangeSuffixes[id]??(['lon','lat','roll','gridRotation','grid','clearance'].includes(id)?'°':''));
  }
  if(Number.isInteger(ss.layout)&&ss.layout>=0&&ss.layout<81)state.layout=ss.layout;
  // Drag mode is a local choice, never restored from a shared map.
  mode('pan');
  const legacyMaterial=saved.controls?.['relief-material'];
  if(['ivory','elevation'].includes(legacyMaterial))saved.controls={...saved.controls,'map-source':legacyMaterial};
  if(saved.controls?.['map-source']==='rivers')saved.controls={...saved.controls,'map-source':'continents','rivers-visible':true};
  for(const [id,value] of Object.entries(saved.controls||{})){
   const el=$(id);if(!el)continue;
   if(el.type==='color'&&typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))el.value=value;
   if(el.matches('input[type=checkbox]')){if(id==='distortion')el.checked=distortionEnabled(value);else if(typeof value==='boolean')el.checked=value;}
   if(el.matches('input[type=range]')&&['land-classes','ocean-classes'].includes(id)){
    const numeric=+value;
    // Presets and browser storage use the visible class count, so old
    // dropdown-based links remain compatible with the new sliders.
    syncClassControl(id,numeric);
    $(id+'-value').value=classOptions[+el.value];
   }
   if(el.matches('select')&&id!=='layout'&&[...el.options].some(o=>o.value===value))el.value=value;
  }
  // A shared map records its exact rotation, even if search presets later change.
  $('optimize').checked=false;
  document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el.dataset.method===state.method));
  restorePanelStates(document.querySelectorAll('aside > details'),saved.details);
  const v=saved.view;
  if(v&&['scale','zoom','panX','panY'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]))&&v.scale>0&&v.zoom>=.25&&v.zoom<=12)restoredView=v;
 }catch{/* Missing or damaged map links fall back to defaults. */}
}
function captureSettings(){
 const controls={};document.querySelectorAll('aside input[type=checkbox],aside select,aside input[type=range],aside input[type=color]').forEach(el=>{controls[el.id]=el.type==='checkbox'?el.checked:['land-classes','ocean-classes'].includes(el.id)?classCount(el.id):el.value;});
 const applied=$('lighting-preset').value==='custom'?customApplied:null;if(applied){controls['relief-treatment']=applied.treatment;controls['relief-tone']=applied.tone;}
 return {version:1,state:{...state,...applied},controls,view:{scale,zoom:state.zoom,panX:state.panX,panY:state.panY},details:Object.fromEntries([...document.querySelectorAll('aside > details')].map(el=>[el.id,el.open]))};
}
function readMapStateFromUrl(){const hash=location.hash;if(!hash.startsWith('#m=')&&!hash.startsWith('#p='))return null;try{return decodeMapState(hash.slice(3));}catch{return null;}}
function updateMapUrl(){if(!persistenceReady||exporting)return;clearTimeout(saveTimer);try{const url=new URL(location.href);if(!location.pathname.startsWith('/tests/'))url.pathname=shareSelection.path;url.hash='m='+encodeMapState(captureSettings());history.replaceState(null,'',url);}catch{}}
function scheduleSave(){if(!persistenceReady)return;clearTimeout(saveTimer);saveTimer=setTimeout(updateMapUrl,180);}
document.addEventListener('input',scheduleSave);document.addEventListener('change',scheduleSave);

window.addEventListener('pagehide',updateMapUrl);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')updateMapUrl();});

$('clearance').addEventListener('input',()=>{$('optimize').checked=true;applySearch();});

function updateDistortionLegend(){
 if(!derivativeSupport){$('distortion').disabled=true;$('distortion').title='This browser lacks GPU derivative support.';$('distortion-legend').hidden=true;$('distortion-controls').hidden=true;return;}
 const enabled=$('distortion').checked;
 $('distortion-legend').hidden=!enabled;$('distortion-controls').hidden=!enabled;
}

function hexLegend(container,items){
 $(container).replaceChildren(...items.map(item=>{const row=document.createElement('div');row.className='hex-legend-item';row.title=item.detail;const swatch=document.createElement('span');swatch.className='hex-swatch';swatch.style.backgroundColor=item.color;swatch.dataset.legendColor=item.color;swatch.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=item.name;row.append(swatch,label);return row;}));
}
async function updateRiverLayer(){
 if(!gl||!riverTexture)return;const request=++riverRequest;
 if(!$('rivers-visible').checked)return;
 const riverKey=state.riverLevels+'/'+state.riverWidth;if(riverKey===uploadedRiverKey)return;
 try{const source=await riverMask(state.riverLevels,state.riverWidth);if(request!==riverRequest)return;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.activeTexture(gl.TEXTURE0);riverGeneration++;uploadedRiverKey=riverKey;draw();}
 catch(error){console.warn('River layer:',error);$('status').textContent='River data could not load; the map remains available.';}
}
for(const id of ['riverWidth','riverLevels'])$(id).addEventListener('input',()=>{++riverRequest;clearTimeout(riverTimer);riverTimer=setTimeout(updateRiverLayer,100);});$('rivers-visible').addEventListener('change',()=>{updateRiverLayer();draw();});
function legendFade(){return $('relief-enabled').checked?state.reliefColorFade:0;}
function updateLegendFade(){
 const amount=legendFade();
 for(const swatch of document.querySelectorAll('#floating-legend [data-legend-color],#ecology-controls [data-legend-color]')){
  const color=fadedLegendColor(swatch.dataset.legendColor,amount);
  if(swatch.tagName.toLowerCase()==='polygon')swatch.setAttribute('fill',color);else swatch.style.backgroundColor=color;
 }
 syncMobileLegend();
}
function syncMobileLegend(){
 $('legend-toggle').hidden=!compactDevice||$('map-source').value!=='ecology';
 if($('mobile-legend-dialog').open){const content=$('floating-legend').querySelector('.floating-legend-clusters').cloneNode(true);for(const el of content.querySelectorAll('[id],[tabindex]')){el.removeAttribute('id');el.removeAttribute('tabindex');}$('mobile-legend-content').replaceChildren(content);}
}
$('legend-toggle').onclick=()=>{$('mobile-legend-dialog').showModal();syncMobileLegend();};
$('close-legend').onclick=()=>$('mobile-legend-dialog').close();
$('mobile-legend-dialog').onclick=e=>{if(e.target===$('mobile-legend-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};

function updateMapUI(){
 const type=$('map-source').value;$('floating-legend').hidden=type!=='ecology';$('floating-legend-tip').hidden=true;$('ecology-controls').hidden=type!=='ecology';$('palette').closest('label').hidden=!['continents'].includes(type);
 if(type==='ecology'){const landCount=classCount('land-classes'),oceanCount=classCount('ocean-classes');syncClassControl('land-classes',landCount);syncClassControl('ocean-classes',oceanCount);renderLifezonesLegend($('floating-legend').querySelector('.floating-legend-clusters'),landCount,oceanCount);hexLegend('land-legend',landLegends[landCount]);hexLegend('ocean-legend',oceanLegend(oceanCount));hexLegend('missing-legend',[missing]);}
 updateLegendFade();
 const credits={terrain:'Supplied shaded topographic map · baked-in terrain and seafloor relief; lighting is fixed.',ivory:'Generated sculpted-paper finish from the supplied heightfield.',elevation:'Generated earth-and-sea finish from the supplied heightfield.',continents:'Supplied silhouette. Cut-search mask is shared across all layers.',marble:'Supplied Blue Marble · brighter oceans and visible seafloor detail.',countries:'Natural Earth · 1:50m · de facto country boundaries.',ecology:'Leemans / UNEP-WCMC Holdridge (1992); NOAA OISST 1991–2020; Copernicus WAVERYS 2015–2024. Natural Earth 1:10m rivers. Hover swatches for class definitions.'};
 $('map-credit').textContent=credits[type];
 $('relief-source-note').hidden=!$('relief-enabled').checked||!['terrain','marble'].includes(type);
}
async function updateMapSource(){
 updateRelief();
 updateMapUI();scheduleSave();if(!ready)return;
 const request=++mapRequest,type=$('map-source').value;$('map-loading').textContent='Loading map…';
 try{let source=await mapSource(type,classCount('land-classes'),classCount('ocean-classes'));if(request!==mapRequest)return;
  const originalWidth=source.width,originalHeight=source.height,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(source.width>max){const resized=document.createElement('canvas');resized.width=max;resized.height=Math.round(source.height*max/source.width);const c=resized.getContext('2d');c.imageSmoothingEnabled=type!=='ecology';c.drawImage(source,0,0,resized.width,resized.height);source=resized;}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);const filter=type==='ecology'?gl.NEAREST:gl.LINEAR;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
  displayedSource=type;$('map-loading').textContent='';$('source-name').textContent={continents:'continents.png',marble:'Blue Marble · bluemarble-high.jpg',countries:'Natural Earth · 1:50m · de facto country boundaries.',terrain:'Shaded topographic map',ivory:'Ivory · sculpted paper',elevation:'Elevation · earth & sea',ecology:'Holdridge + marine zones'}[type];$('source-detail').textContent=type==='ecology'?'0.5° land · 1° ocean temperature · 0.8° wave exposure':['ivory','elevation'].includes(type)?'Derived from supplied heightfield':`${originalWidth.toLocaleString()} × ${originalHeight.toLocaleString()} · equirectangular`;
  draw();
 }catch(error){if(request!==mapRequest)return;$('map-source').value=displayedSource;updateMapUI();updateRelief();$('map-loading').textContent='Map could not load. Previous layer retained; select again to retry.';scheduleSave();}
}
for(const id of ['background-color','border-color','hex-grid-color','graticule-color'])$(id).addEventListener('input',draw);
$('map-source').addEventListener('change',()=>{updateMapSource();updateRelief();});
for(const id of ['land-classes','ocean-classes'])$(id).addEventListener('input',()=>{syncClassControl(id,classCount(id));updateMapSource();});
updateMapUI();

function setOptionRange(id,value){
  const el=$(id);if(!el||typeof value!=='number'||!Number.isFinite(value))return;
  const next=Math.max(+el.min,Math.min(+el.max,value));state[id]=next;el.value=next;
  const spec=reliefRanges.find(s=>s[0]===id),suffix=spec?.[6]??rangeSuffixes[id]??(['lon','lat','roll','gridRotation','grid','clearance'].includes(id)?'°':'');
  $(id+'-value')?.replaceChildren(`${Number(next.toFixed(2))}${suffix}`);
}
function setOptionControl(id,value){
  const el=$(id);if(!el||value===undefined||value===null)return;
  if(el.matches('input[type=checkbox]'))el.checked=id==='distortion'?distortionEnabled(value):Boolean(value);
  else if(el.type==='color'&&/^#[0-9a-f]{6}$/i.test(value))el.value=value;
  else if(el.matches('input[type=range]')&&['land-classes','ocean-classes'].includes(id))syncClassControl(id,+value);
  else if(el.matches('input[type=range]'))setOptionRange(id,+value);
  else if(el.matches('select')&&[...el.options].some(option=>option.value===String(value)))el.value=String(value);
}
function applyMapOption(option,type){
  shareSelection=type==='layout'?sharePair(shareSelection.style.id,option.arrangement):sharePair(option.id,state.arrangement);
  trackEvent(type==='layout'?'format':'style',type==='layout'?shareSelection.layout.arrangement:option.id);
  if(type==='layout'){
    for(const id of ['method','arrangement','lon','lat','roll','bias','height','clearance','gridRotation'])if(option.state[id]!==undefined){if(['method','arrangement'].includes(id))state[id]=option.state[id];else setOptionRange(id,option.state[id]);}
    for(const id of ['interpolation','optimize'])if(option.controls[id]!==undefined)setOptionControl(id,option.controls[id]);
    state.layout=0;document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el.dataset.method===state.method));
    rebuild();resize();if(option.viewOffset&&!compactDevice){state.panX=option.viewOffset[0]*scale;state.panY=option.viewOffset[1]*scale;draw();}updateRelief();
  }else{
    for(const [id,value] of Object.entries(option.state))setOptionRange(id,value);
    for(const [id,value] of Object.entries(option.controls))setOptionControl(id,value);
    customApplied=null;
    updateMapSource();updateRelief();updateRiverLayer();draw();
  }
  syncOptionCards();
  scheduleSave();
}
function installColumnOptions(){
  const intro=document.querySelector('.welcome-copy');
  const layoutHeading=document.createElement('div');layoutHeading.className='preset-heading';layoutHeading.textContent='Map format';
  const styleHeading=document.createElement('div');styleHeading.className='preset-heading';styleHeading.textContent='Map style';
  const layoutBox=document.createElement('div');layoutBox.className='layout-presets';layoutBox.setAttribute('aria-label','Map format options');
  const styleBox=document.createElement('div');styleBox.className='style-presets';styleBox.setAttribute('aria-label','Map style options');
  for(const option of layoutOptions){const card=document.createElement('button');card.type='button';card.className='layout-preset-card';card.title='Use '+option.name+' format';card.dataset.arrangement=option.arrangement;card.setAttribute('aria-label',option.name);card.append(layoutIcon(option));const label=document.createElement('b');label.textContent=option.name;card.append(label);card.onclick=()=>applyMapOption(option,'layout');layoutBox.append(card);}
  for(const option of styleOptions){const card=document.createElement('button');card.type='button';card.className='style-preset-card';card.title='Use '+option.name+' style';card.dataset.source=option.source;card.dataset.style=option.id;card.setAttribute('aria-label',option.name);const thumb=document.createElement('img');thumb.className='style-thumb';thumb.src=option.thumbnail+(option.id==='lifezones'?'?v=waves-2':'?v=triangular-1');thumb.alt='';thumb.loading='lazy';thumb.width=240;thumb.height=136;const label=document.createElement('b');label.textContent=option.name;card.append(thumb,label);card.onclick=()=>applyMapOption(option,'style');styleBox.append(card);}
  intro.after(layoutHeading,layoutBox,styleHeading,styleBox);
  document.querySelectorAll('aside details').forEach(el=>{el.open=false;});
}
installColumnOptions();

restoreSettings(readMapStateFromUrl()||presetSettings(shareSelection));
initAnalytics(shareSelection.path);setSidebarExpanded(state.sidebarExpanded,false);rebuild(false);
document.querySelectorAll('aside details').forEach(el=>el.addEventListener('toggle',scheduleSave));
new ResizeObserver(resize).observe($('stage'));
updateRelief();
$('layout').addEventListener('change',updateRelief);

function syncOptionCards(){
 for(const card of document.querySelectorAll('.layout-preset-card')){
  const selected=card.dataset.arrangement===state.arrangement;card.classList.toggle('selected',selected);card.setAttribute('aria-pressed',String(selected));
 }
 for(const card of document.querySelectorAll('.style-preset-card')){
  const option=styleOptions.find(o=>o.id===card.dataset.style);
  const selected=Object.entries(option.controls).every(([id,value])=>{const el=$(id);return el.type==='checkbox'?el.checked===value:['land-classes','ocean-classes'].includes(id)?classCount(id)===value:el.value===String(value);})&&Object.entries(option.state).every(([id,value])=>Math.abs(state[id]-value)<1e-6);
  card.classList.toggle('selected',selected);card.setAttribute('aria-pressed',String(selected));
 }
}

function setSidebarExpanded(expanded,focus=true){
 state.sidebarExpanded=expanded;document.body.classList.toggle('customizing',expanded);
 $('customize').setAttribute('aria-expanded',String(expanded));headingBounds=null;
 if(focus){$(expanded?'collapse-customize':'customize').focus();draw();}
}
$('customize').onclick=()=>setSidebarExpanded(true);
$('collapse-customize').onclick=()=>setSidebarExpanded(false);
new ResizeObserver(()=>{headingBounds=null;draw();}).observe($('map-heading'));
function updateHeadingVisibility(){
 const title=$('map-heading');
 if(!headingBounds){const r=title.getBoundingClientRect();headingBounds={left:r.left-10,top:r.top-8,right:r.right+10,bottom:r.bottom+10};}
 const r=headingBounds;
 const unavailable=r.right>w||r.bottom>h||(state.sidebarExpanded&&w<=700);
 const origin={x:0,y:0,r:0};
 const bounds=arrangement?.bounds;
 const fractalOverlap=arrangement?.leaves&&bounds&&polygonOverlapsRect([[bounds.left,bounds.bottom],[bounds.right,bounds.bottom],[bounds.right,bounds.top],[bounds.left,bounds.top]].map(p=>point(p,origin)),r)&&arrangement.leaves.some(poly=>polygonOverlapsRect(poly.map(p=>point(p,origin)),r));
 const overlaps=!unavailable&&(tiling||(arrangement?.leaves?fractalOverlap:visible.some(tile=>polygonOverlapsRect((tile.polygon||hex).map(p=>point(p,tile)),r))));
 const obscured=Boolean(unavailable||overlaps);
 if(compactDevice&&tiling&&!state.sidebarExpanded){title.dataset.obscured='false';title.setAttribute('aria-hidden','false');title.classList.add('over-infinite');$('sidebar-title').hidden=true;return;}
 title.classList.remove('over-infinite');
 title.dataset.obscured=String(obscured);title.setAttribute('aria-hidden',String(obscured));
 $('sidebar-title').hidden=!state.sidebarExpanded||!obscured;
}
