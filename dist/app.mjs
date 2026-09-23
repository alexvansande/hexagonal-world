import {assetURL} from './asset-url.mjs';
import {readTourPath} from './tour-pages.mjs?v=history-2';
import {historyPath,readHistoryPath,readHashShare} from './history-routes.mjs?v=history-1';
import {createTourMarkers,createTourLabels,projectTourLocations,tourEnabled,tourLocations} from './tour-markers.mjs?v=history-3';
import {createTourRoutes,projectTourRoutes} from './tour-route-renderer.mjs?v=trail-2';
import {loadPeriod} from './history-loader.mjs?v=history-3';
import {pacificTourNet} from './tour-layout.mjs?v=dancing-2';
import pacificLighting from './maps/pacific-manifest.mjs?v=pacific-light-1';
import {createTourStory} from './tour-story.mjs?v=history-5';
import {periods,period as periodInfo} from './history/index.mjs?v=history-1';
import {MergedMaps,mergedEntry,mergedCompatible} from './merged-maps.mjs?v=turn-30';
import {riverFieldGLSL} from './river-layers.mjs?v=cloud-assets-1';
import {DefaultLayers,defaultLayerPreset,imageVertex,imageFragment,graticuleFragment} from './default-layers.mjs?v=turn-30';
import {puzzleRegion,puzzleArtwork} from './puzzle-grid.mjs?v=unique-3';
import {initSourcePicker} from './source-picker.mjs';
import {isAboutPath} from './about-route.mjs?v=about-shapes-1';
import {initAboutWidget} from './about-widget.mjs?v=cloud-assets-1';
import {referenceSources,sourceAttribution,mapLicense} from './reference-sources.mjs?v=licenses-1';
import {PrecomputedSurfaces,surfacePreset,surfaceLevel,surfacePlan,surfaceTileRect,clipSurfaceTriangle} from './precomputed-surfaces.mjs?v=turn-30';
import {renderLifezonesLegend} from './lifezones-legend.mjs?v=lifezones-shadows-3';
import {fadedLegendColor} from './legend-colors.mjs';
import {ProjectedLighting,lightingSettings,lightingKey,lightingPlan,lightingCovers} from './projected-lighting.mjs?v=performance-1';
import {compactDevice,mobileFitRect,maximumZoom,displayPixelRatio} from './device-profile.mjs?v=performance-1';
import {readSharePath,sharePair,inferSharePair,presetSettings} from './share-routes.mjs?v=turn-30';
import {initAnalytics,trackEvent} from './analytics.mjs';
import {fractalRegion,fractalEdgeOwners,visibleFractalLines,fractalDetailPlan,fineFractalTiles,fractalFineScale,fractalOpacities,edgeKey} from './fractal-grid.mjs?v=fractal-zoom-10';
import {pointInLoops} from './gosper-fractal.mjs';
import {circularMode} from './circular-projections.mjs';
import {polygonOverlapsRect} from './interface-layout.mjs';
import {ecologyGridGLSL,ecologyBridgeGLSL} from './ecology-grid.mjs?v=performance-1';
import {gosperScale,rotateLocal,subgridLevels,subgridArea,dotGridArea} from './subgrid.mjs?v=dot-area-1';
import {decodeMapState,encodeMapState,distortionEnabled,restorePanelStates} from './map-state.mjs?v=focus-2';
import {sphereAt,followPoint,geographicPoint} from './globe-drag.mjs?v=tetra-area-2';
import {makeArrangement,arrangementNames} from './arrangements.mjs?v=gosper-1';
import {experimentPaletteRevision,mapSource,landLegends,oceanLegend,missing,riverMask,riverTextureData,releaseRiverMask,releaseLiveMapData} from './map-layers.mjs?v=cloud-assets-1';
import {searchPresets} from './search-presets.mjs?v=rus-search-1';
import {visibleTiles} from './tiling.mjs';
import {makeGeometry,layouts,matching,canvasWorld,hex,world} from './geometry.mjs?v=tetra-area-2';
import {projectionGLSL} from './projection-shader.mjs?v=tetra-area-2';
import {ReliefRenderer,reliefRanges,reliefDefaults,reliefLooks} from './relief.mjs?v=cloud-assets-1';
import {layoutOptions,styleOptions,layoutIcon} from './map-options.mjs?v=turn-30';
const $=id=>document.getElementById(id), canvas=$('map'),overlay=$('overlay'),ctx=overlay.getContext('2d');
const tourMarkers=createTourMarkers($('stage'),canvas);
const tourLabels=createTourLabels($('stage'));
const tourRoutes=createTourRoutes($('stage'));
const tourStory=createTourStory($('controls'),()=>closeHistoryFocus(true));
// A story URL such as /silk-road/ opens the timeline focused on that story.
const initialTour=readTourPath(location.pathname),initialHistory=readHistoryPath(location.pathname);
let tourAnimation=0;
// History timeline: one period at a time from dist/history (see history-loader.mjs).
let historyOn=false,historyPeriodId=null,historyPeriod=null,historyLoad=0,historyProjection=null,historyProjectionKey='';
let historyFocus=initialTour?.id||initialHistory?.spot||null,historyFocusView=null,historyFocusPending=!!(initialTour||initialHistory?.spot);
const coordinateReadout=document.createElement('div');
coordinateReadout.id='map-coordinates';coordinateReadout.hidden=true;
coordinateReadout.setAttribute('aria-label','Coordinates under pointer');document.querySelector('.view-tools').prepend(coordinateReadout);
let coordinatePointer=null,coordinateHideTimer=null;
const classOptions=[3,6,10,15];
const classCount=id=>classOptions[Math.max(0,Math.min(3,Math.round(+$(id).value)))];
function syncClassControl(id,count){const el=$(id);if(!el)return;const index=classOptions.indexOf(+count);if(index>=0)el.value=index;$(id+'-value').value=classOptions[+el.value];}
const rangeSuffixes={puzzleWidth:'×',riverWidth:'×',subgridWidth:'×',graticuleWidth:'×',backdropWidth:'px',backdropOpacity:'%'};
const state={method:'tetra',lon:0,lat:0,roll:0,bias:1,height:1.5,grid:30,line:0.8,subgridWidth:1,puzzleWidth:1,graticuleWidth:1,backdropWidth:2,backdropOpacity:25,shadowOpacity:1,lightOpacity:1,distortionOpacity:.7,clearance:0,riverWidth:1,riverLevels:6,layout:0,gridRotation:0,zoom:1,panX:0,panY:0,mode:'pan',arrangement:'infinite',sidebarExpanded:false,interpolation:0,...reliefDefaults};
let mobileRepositioning=false;
let exporting=false;
let shareSelection=initialTour||initialHistory?readSharePath(readHashShare(location.hash)||'')||sharePair('lifezones','dymaxion'):readSharePath(location.pathname)||inferSharePair(readMapStateFromUrl());
let urlDefaults=null,defaultView=null;
let persistenceReady=false,saveTimer=null,restoredView=null,headingBounds=null;
let displayedSource='continents',mapRequest=0;
let arrangement,tiling,visible=[],meshSignature=null,geometryKey=null,edgeLabels=[];
const arrangementCache=new Map();
let ecologyVertices,tiles,nets,net,scale=1,w=1,h=1,dpr=1,ready=false,queued=false,buffer,count=0,texture,heightTexture,riverTexture;
let offlineLightingPlan=null;
let projectedLighting=null,customApplied=null,lightingRefineTimer=null,lightingRefineKey=null,lightingReadyKey=null;
let relief=null,riverGeneration=0,riverRequest=0,riverTimer=null,uploadedRiverKey=null,requestedRiverKey=null,riverFieldSize=null;

const notes={'lambert-one':'The whole world in one equal-area hexagon: a Lambert disk reshaped without changing area. The entire perimeter is the opposite pole. Inspired by Rus’s minimal hexagonal maps; this is not his triangular fold.', 'lambert-two':'Two equal-area hemispheres, each reshaped from a Lambert disk into a hexagon. All six boundary edges have matching counterparts. Rotate the globe to move the hemispheres.',tetra:'Four equal-area spherical regions open directly into hexagons. Vertices and edge midpoints anchor their shared boundaries.',octa:'Four intact octants. Four divided octants. Each hexagon combines one central triangle with three neighboring pieces.',rhombic:'Twelve rhombi become four groups of three. Each diamond is stretched into a pair of equilateral triangles.',tetrakis:'Six pyramids on a cube create 24 triangles. Six triangles meet inside each hexagon; adjust the pyramid tips below.'};
function range(parent,id,label,min,max,step,value,suffix=''){
 const el=document.createElement('label');el.className='range';el.innerHTML=`<span class="range-head"><span>${label}</span><output id="${id}-value">${value}${suffix}</output></span><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;$(parent).append(el);$(id).addEventListener('input',()=>{if(id==='gridRotation'){const a=(+$(id).value-state[id])*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);[state.panX,state.panY]=[c*state.panX-sn*state.panY,sn*state.panX+c*state.panY];}state[id]=+$(id).value;$(id+'-value').value=Number(state[id].toFixed(2))+suffix;if(id==='height')rebuild(false);if(id.startsWith('relief'))updateRelief();draw();});
}
range('distortion-controls','distortionOpacity','Opacity',0,1,.05,.7);
range('clearance-control','clearance','Minimum distance from land',0,9,1,0,'°');$('clearance').setAttribute('aria-label','Minimum distance from land');$('clearance-control').querySelector('.range-head').hidden=true;
range('orientation','lon','Longitude',-180,180,1,0,'°');range('orientation','lat','Latitude',-90,90,1,0,'°');range('orientation','roll','Roll',-180,180,1,0,'°');range('shape-controls','bias','Shape bias',.4,2.5,.01,1);range('shape-controls','height','Pyramid tip distance',1.01,2,.01,1.5);range('display-controls','gridRotation','Grid rotation',-180,180,1,0,'°');range('graticule-controls','grid','Grid interval',10,60,5,30,'°');range('border-controls','line','Border weight',0,2,.1,.8);
range('hex-grid-controls','subgridWidth','Hex grid thickness',0,5,.1,1,'×');range('backdrop-controls','backdropWidth','Back grid thickness',0,4,.5,2,'px');range('backdrop-controls','backdropOpacity','Back grid opacity',0,100,5,25,'%');range('graticule-controls','graticuleWidth','Latitude / longitude thickness',0,5,.1,1,'×');
range('puzzle-controls','puzzleWidth','Puzzle line width',0,5,.1,1,'×');
const syncSourceChoice=initSourcePicker({source:$('map-source'),palette:$('palette'),choice:$('map-source-choice')});
range('river-controls','riverWidth','River width',.5,3,.25,1,'×');range('river-controls','riverLevels','Tributary levels',1,12,1,6);
for(const spec of reliefRanges){const id=spec[0];range(id==='reliefColorFade'?'lighting-opacity-controls':['reliefHeight','reliefAzimuth','reliefAltitude','reliefThickness'].includes(id)?'relief-main-controls':'relief-fine-controls',...spec);}
range('lighting-opacity-controls','shadowOpacity','Dark opacity',0,1,.01,1);
range('lighting-opacity-controls','lightOpacity','Light opacity',0,1,.01,1);
const customOption=$('lighting-preset').querySelector('[value=custom]');if(compactDevice)customOption.remove();
const hexBridgeMode=new URLSearchParams(location.search).get('hex-bridges');
const hexBridgesEnabled=hexBridgeMode==='0'?0:hexBridgeMode==='5'?5:hexBridgeMode==='4'?4:hexBridgeMode==='3'?3:hexBridgeMode==='2'?2:hexBridgeMode==='1'?1:5;
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});
const graphicsLimit=gl?Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)):0;
const offlineBake=new URLSearchParams(location.search).has('bake-layers')||new URLSearchParams(location.search).has('bake-surfaces');
let mergedPreview=null;
if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).has('merged-preview'))import('./merged-preview.mjs').then(async module=>{mergedPreview=await module.createMergedPreview(draw);draw();}).catch(console.error);
let defaultLayers=null,renderDefault=null,mergedMaps=null,renderMerged=null;
const separateComparison=['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&['merged-preview','separate-layers'].some(key=>new URLSearchParams(location.search).has(key));
function activeDefault(){if(offlineBake||new URLSearchParams(location.search).has('palette-lab')||new URLSearchParams(location.search).get('surface')==='live')return null;
 // Spaceship Earth draws the unlit per-piece base, which does not depend on the map's turn: match its preset at any dial angle.
 const probe=state.arrangement==='dymaxion'?{...state,gridRotation:layoutOptions.find(l=>l.arrangement==='dymaxion')?.state.gridRotation??state.gridRotation}:state,controls=captureSettings().controls;
 let entry=defaultLayerPreset(probe,controls);
 // Show lighting only switches Spaceship Earth between its lit and unlit per-piece sets: keep the preset.
 if(!entry&&state.arrangement==='dymaxion')for(const style of styleOptions){entry=defaultLayerPreset(probe,{...controls,'relief-enabled':style.controls['relief-enabled'],'lighting-preset':style.controls['lighting-preset']});if(entry)break;}if(!separateComparison&&mergedEntry(entry)&&!mergedCompatible(entry,state,$('background-color').value))return null;return entry;}
function selectRenderPath(entry){
 const wasImages=!!renderDefault;renderDefault=entry;
 if(!!entry===wasImages)return;
 if(entry){
  ++mapRequest;++riverRequest;requestedRiverKey=uploadedRiverKey=null;clearTimeout(riverTimer);clearTimeout(lightingRefineTimer);lightingReadyKey=lightingRefineKey=null;
  projectedLighting?.dispose();projectedLighting=null;
  if(relief){relief.dispose();relief=null;heightTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,heightTexture);for(const n of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,n,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([105]));}
  for(const t of [texture,riverTexture])if(t){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));}
  liveSourceKey=null;riverFieldSize=null;releaseLiveMapData();
  if(surfaceCache&&surfaceCache!==defaultLayers?.base&&surfaceCache!==mergedMaps?.cache){surfaceCache.dispose();surfaceCache=null;}
  for(const [key,item] of programVariants)if(key!=='images'&&!key.startsWith('graticule/')){gl.deleteProgram(item.program);programVariants.delete(key);}
 }else{
  if(surfaceCache===defaultLayers?.base)surfaceCache=null;defaultLayers?.dispose();defaultLayers=null;
 }
}
function fail(message){$('error').hidden=false;$('error').textContent=message;$('status').textContent='Rendering unavailable';}
const vs=`attribute vec2 regionPosition;attribute float region;varying vec2 localPosition;varying float regionIndex;varying vec2 flatPosition;attribute float opacity;varying float tileAlpha;attribute vec2 position;attribute vec3 bary;attribute vec3 va;attribute vec3 vb;attribute vec3 vc;uniform vec2 size;uniform vec3 view;uniform float gridRotation;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;void main(){localPosition=regionPosition;regionIndex=region;flatPosition=position;float cr=cos(gridRotation),sr=sin(gridRotation);vec2 rotated=vec2(cr*position.x-sr*position.y,sr*position.x+cr*position.y);vec2 p=(rotated*view.x+view.yz)/size*2.0;gl_Position=vec4(p.x,-p.y,0.,1.);tileAlpha=opacity;weights=bary;a=va;b=vb;c=vc;}`;
const derivativeSupport=!!gl?.getExtension('OES_standard_derivatives');
const fs=`${derivativeSupport?'#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES 1\n':'#define HAS_DERIVATIVES 0\n'}precision highp float;varying vec2 flatPosition;uniform int felvClip;varying float tileAlpha;varying vec3 weights;varying vec3 a;varying vec3 b;varying vec3 c;uniform sampler2D map;uniform sampler2D heightMap;uniform float colorFade;uniform int landCutout;uniform vec3 background;uniform sampler2D riverMap;uniform vec3 angles;uniform float bias;uniform float blend;uniform float grid;uniform float gridWidth;uniform vec3 gridColor;uniform vec3 riverColor;uniform int palette;uniform int material;uniform float materialSea;uniform int riversVisible;uniform int distortion;uniform float distortionOpacity;uniform float pixelScale;const float PI=3.141592653589793;
${projectionGLSL}
${riverFieldGLSL}
${ecologyGridGLSL}
${ecologyBridgeGLSL}
uniform int overlayOnly;
uniform int hexCategorical;
uniform int bakedOn;uniform int bakeOnly;uniform vec4 bakedRect;
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
 bool useHex=ecologyHex==1||hexCategorical==1;
 vec3 source;
 if(bakedOn==1){vec2 at=(localPosition-bakedRect.xy)/bakedRect.zw;at.y=1.-at.y;source=texture2D(map,(at*256.+1.)/258.).rgb;}
 else{vec2 sourceUV=useHex?geographicUV(ecologySphere(ecologyCenter(localPosition)),angles):uv;source=texture2D(map,sourceUV).rgb;
 if(useHex&&ecologyBridges>0&&overlayOnly==0)source=ecologyBridgedColor(localPosition,ecologyCenter(localPosition),source);}
 if(bakeOnly==1){gl_FragColor=vec4(source,1.);return;}
 float sea=smoothstep(.17,.8,source.r);vec3 color=source;
 if(palette==0)color=mix(vec3(.14,.30,.35),vec3(.75,.86,.89),sea);
 if(palette==2)color=mix(vec3(.30,.64,.72),vec3(.075,.14,.20),sea);
 float surfaceHeight=texture2D(heightMap,uv).r;
 if(material==1)color=mix(vec3(.65,.75,.77),vec3(.88,.865,.80),smoothstep(materialSea-.003,materialSea+.003,surfaceHeight));
 if(material==2){float h=surfaceHeight;float land=smoothstep(materialSea-.003,materialSea+.003,h);float altitude=clamp((h-materialSea)/max(1.-materialSea,.01),0.,1.);vec3 low=mix(vec3(.49,.61,.46),vec3(.80,.76,.56),smoothstep(0.,.35,altitude));vec3 high=mix(vec3(.77,.70,.57),vec3(.97,.95,.88),smoothstep(.45,.95,altitude));vec3 earth=mix(low,high,smoothstep(.2,.65,altitude));color=mix(mix(vec3(.22,.43,.52),vec3(.65,.79,.78),clamp(h/max(materialSea,.01),0.,1.)),earth,land);}

 if(riversVisible==1){vec2 riverUV=useHex?geographicUV(ecologySphere(riverCenter(localPosition)),angles):uv;float river=riverCoverage(riverUV);color=mix(color,riverColor,river);}
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
let program,uniforms={};const programVariants=new Map();
function initializeProgram(imageOnly=false){
 const key=imageOnly==='graticule'?'graticule/'+state.method:imageOnly?'images':state.method+'/'+hexBridgesEnabled;const cached=programVariants.get(key);if(cached){({program,uniforms}=cached);return;}
 const fragment=(imageOnly==='graticule'?graticuleFragment(projectionGLSL):imageOnly?imageFragment:fs).replace('uniform int ecologyBridges;',`const int ecologyBridges=${hexBridgesEnabled};`).replace('uniform int tetraEqualArea;',`const int tetraEqualArea=${state.method==='tetra'?1:0};`).replace('uniform int circularMode;',`const int circularMode=${circularMode(state.method)};`).replace('uniform int ecologyOcta;',`const int ecologyOcta=${state.method==='octa'?1:0};`);
if(gl){try{uniforms={};function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}program=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,imageOnly===true?imageVertex:vs],[gl.FRAGMENT_SHADER,fragment]]){const compiled=shader(type,source);gl.attachShader(program,compiled);gl.deleteShader(compiled);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);for(const u of ['size','view','gridRotation','angles','bias','blend','grid','gridWidth','gridColor','riverColor','palette','map','heightMap','colorFade','landCutout','background','material','materialSea','riverMap','riverField','riverSize','riverWidthScale','riversVisible','distortion','distortionOpacity','pixelScale','felvClip','overlayOnly','hexCategorical','bakedOn','bakeOnly','bakedRect','circularMode','tetraEqualArea','ecologyHex','ecologyBridges','ecologyOcta','ecologyVertices[0]'])uniforms[u]=gl.getUniformLocation(program,u);programVariants.set(key,{program,uniforms:{...uniforms}});if(buffer)return;buffer=gl.createBuffer();heightTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,heightTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([105]));riverTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));gl.activeTexture(gl.TEXTURE0);}catch(e){fail('The map renderer could not start: '+e.message);}}else fail('WebGL is unavailable. Enable hardware acceleration or open this app in a WebGL-capable browser.');
}
function rebuild(fit=true){
 const cm=circularMode(state.method);
 if(cm)state.arrangement=cm===1?'single':'double';
 else if(['single','double'].includes(state.arrangement))state.arrangement='flower';
 $('bias').closest('label').hidden=!!cm||state.method==='tetra';$('interpolation').closest('label').hidden=!!cm||state.method==='tetra';
 for(const option of $('indicatrix').options)if(option.value!=='off')option.textContent=`${cm||4} × ${option.value==='4x7'?7:option.value==='4x49'?49:343} circles`;

 const nextKey=state.method+'/'+(state.method==='tetrakis'?state.height:0);
 if(nextKey!==geometryKey){
  geometryKey=nextKey;tiles=makeGeometry(state.method,state.height);ecologyVertices=new Float32Array(tiles.flatMap(t=>[t.center,...t.ring]).flat());nets=layouts(tiles);arrangementCache.clear();puzzleCache.clear();
  const ids=tiles.flatMap(t=>hex.map((_,e)=>{const m=matching(tiles,t.id,e);return [`${t.id}:${e}`,`${m.id}:${m.e}`].sort().join('|');}));
  const unique=[...new Set(ids)].sort();edgeLabels=tiles.map(t=>hex.map((_,e)=>cm===1?'P':String.fromCharCode(97+unique.indexOf(ids[t.id*6+e]))));
 }
 if(!arrangementCache.has(state.arrangement))arrangementCache.set(state.arrangement,makeArrangement(tiles,state.arrangement,nets));
 arrangement=arrangementCache.get(state.arrangement);net=arrangement.net;$('layout').innerHTML=Object.entries(arrangementNames).filter(([key])=>cm?key===state.arrangement:! ['single','double'].includes(key)).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');$('layout').value=state.arrangement;$('method-note').textContent=notes[state.method];$('height').closest('label').hidden=state.method!=='tetrakis';updateOptimizerUI();
 if($('puzzlegrid').checked&&(!['flower','dymaxion'].includes(state.arrangement)||tiles.length!==4))$('puzzlegrid').checked=false;
 tiling=arrangement.tiling;meshSignature=null;
 if(fit)fitView();else draw();
}
function rotateScreen(p,angle=state.gridRotation*Math.PI/180){const c=Math.cos(angle),s=Math.sin(angle);return [c*p[0]-s*p[1],s*p[0]+c*p[1]];}
function viewBounds(padding=0){
 const unit=scale*state.zoom,corners=[];
 for(const x of [-w/2-padding,w/2+padding])for(const y of [-h/2-padding,h/2+padding]){const p=rotateScreen([(x-state.panX)/unit,(y-state.panY)/unit],-state.gridRotation*Math.PI/180);corners.push([p[0],-p[1]]);}
 return {left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),bottom:Math.min(...corners.map(p=>p[1])),top:Math.max(...corners.map(p=>p[1]))};
}
const puzzleCache=new Map();
function puzzleFor(id){const key=id+':'+$('puzzle-count').value;if(!puzzleCache.has(key)){const region=puzzleRegion(tiles,id,+$('puzzle-count').value);puzzleCache.set(key,{...region,drawPatches:puzzleArtwork(tiles,id,region)});}return puzzleCache.get(key);}
function updateVisibleMesh(){
 const unit=scale*state.zoom;
 const bounds=viewBounds((activeDefault()?.lighting||relief?.ready)&&$('relief-enabled').checked?ReliefRenderer.prototype.padding(appliedLighting(),unit):0);
 const next=tiling?visibleTiles(tiling,bounds):net,signature=state.arrangement+':'+$('puzzlegrid').checked+':'+$('puzzle-count').value+next.map(t=>`${t.id},${t.r},${t.x},${t.y}`).join(';');
 if(signature===meshSignature)return;meshSignature=signature;visible=next;
 const verts=[];for(const t of visible)for(const p of ($('puzzlegrid').checked?puzzleFor(t.id).drawPatches:t.drawPatches||tiles[t.id].patches))for(let i=0;i<3;i++)verts.push(...canvasWorld(p.xy[i],t),...(p.weights?p.weights[i]:[0,1,2].map(j=>j===i?1:0)),...p.v.flat(),t.opacity,...(p.regionXY?.[i]||p.xy[i]),p.regionId??t.id);
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
function bounds(){const all=arrangement.outline?arrangement.outline.flat().map(([x,y])=>{const v=rotateScreen([x,-y]);return [v[0],-v[1]];}):arrangement.clip?arrangement.clip.map(([x,y])=>{const v=rotateScreen([x,-y]);return [v[0],-v[1]];}):net.flatMap(t=>($('puzzlegrid').checked?puzzleFor(t.id).outline:t.polygon||hex).map(p=>{const v=rotateScreen(canvasWorld(p,t));return [v[0],-v[1]];}));return [Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>p[1]))];}
// The part of the screen the map can use: beside the sidebar on wide screens, between the heading and the sidebar on phones.
function freeRect(){
 const panel=document.querySelector('aside').getBoundingClientRect();
 const wide=w>700||w>h;
 let left=wide?Math.min(w-100,panel.right+28):24;
 let top=state.sidebarExpanded&&!wide?Math.min(h-100,panel.bottom+20):!state.sidebarExpanded&&wide?24:Math.min(h*.25,156);
 let right=w-24,bottom=state.sidebarExpanded||wide?h-84:Math.max(top+80,panel.top-24);
 if(compactDevice&&!state.sidebarExpanded){({left,right,top,bottom}=mobileFitRect(w,h,$('map-heading').getBoundingClientRect().bottom,panel.top,panel.right));}
 if(mobileRepositioning){left=16;right=w-16;top=Math.min(h-120,$('map-heading').getBoundingClientRect().bottom+20);bottom=Math.max(top+40,document.querySelector('.view-tools').getBoundingClientRect().top-16);}
 return {left,right,top,bottom};
}
function fitView(){
 const b=bounds(),{left,right,top,bottom}=freeRect();
 scale=Math.max(1,Math.min(Math.max(40,right-left)/(b[2]-b[0]),Math.max(40,bottom-top)/(b[3]-b[1])));
 state.zoom=1;state.panX=(left+right-w)/2-(b[0]+b[2])/2*scale;state.panY=(top+bottom-h)/2+(b[1]+b[3])/2*scale;draw();
}
function resize(){if(exporting)return;cancelTourAnimation();headingBounds=null;const rect=$('stage').getBoundingClientRect(),rotated=compactDevice&&persistenceReady&&(w>h)!==(rect.width>rect.height);w=rect.width;h=rect.height;dpr=Math.min(displayPixelRatio(w,h,window.devicePixelRatio,+$('quality').value,compactDevice),gl?graphicsLimit/Math.max(w,h):Infinity);const pixelWidth=Math.round(w*dpr),pixelHeight=Math.round(h*dpr);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;overlay.width=pixelWidth;overlay.height=pixelHeight;}
 if(!persistenceReady){fitView();const offset=shareSelection.layout.viewOffset;if(offset&&!compactDevice){state.panX=offset[0]*scale;state.panY=offset[1]*scale;}defaultView={scale,zoom:state.zoom,panX:state.panX,panY:state.panY};if(restoredView&&(!compactDevice||initialTour)){scale=restoredView.scale;state.zoom=restoredView.zoom;state.panX=restoredView.panX;state.panY=restoredView.panY;}persistenceReady=true;}else if(rotated&&!state.sidebarExpanded)fitView();draw();}
function point(p,t,offset){const v=rotateScreen(canvasWorld(p,t));if(offset){v[0]+=offset[0];v[1]+=offset[1];}return [w/2+v[0]*scale*state.zoom+state.panX,h/2+v[1]*scale*state.zoom+state.panY];}
// Dancing pieces on Spaceship Earth, experiment two (the user's rule): find the
// three-piece vertex nearest the viewport centre and flip the hexagons to it.
// The anchor is the placed piece nearest the centre and never moves; its corner
// nearest the centre names the vertex; the two edges meeting there name the two
// pieces that must sit across them, at the rotations those spherical joins
// demand (a translation plus a turn). The remaining piece keeps its place when
// that is still a valid join of the group, otherwise it takes the free join
// nearest to where it was. So the fewest pieces move, and every piece always
// touches the group along a valid edge. Spaceship Earth draws the unlit
// per-piece base layer while this experiment runs, so turned pieces show no
// inconsistent shadows. Pieces tween in place on the live net objects with a
// slight overshoot; cached route, dot and label projections follow. Exports
// keep the base positions.
// Spaceship Earth always draws through the layered per-piece base. With lighting on and lit sets baked
// (one per rotation class a piece can take), each piece draws its own lit tiles; otherwise the unlit base.
const spaceshipUnlit=()=>!!renderDefault&&state.arrangement==='dymaxion';
const spaceshipLit=()=>spaceshipUnlit()&&!!renderDefault.lit&&$('relief-enabled').checked;
// A piece's lit set is chosen by how it stands on screen: the map turn minus 60° per piece rotation,
// in 30° steps, so the light always comes from the same side of the browser.
const forcedLitSet=['localhost','127.0.0.1','[::1]'].includes(location.hostname)?new URLSearchParams(location.search).get('lit-set'):null;
function litPathFor(t){if(!spaceshipLit()||!danceBase)return null;const r=danceTargets.get(t.id)?.r??t.r,turn=litRotationHold??state.gridRotation,k=forcedLitSet!==null?+forcedLitSet:((Math.round((turn-60*Math.round(r))/30)%renderDefault.lit)+renderDefault.lit)%renderDefault.lit;return `${renderDefault.path}/lit/${k}`;}
let danceBase=null,danceKey='',danceTargets=new Map(),danceTweens=new Map(),danceCentreState='',danceVertex=null,danceEyeEmpty=false;
function danceGrid(){
 const key=[state.method,state.height,state.arrangement,arrangement===arrangementCache.get(state.arrangement)?'a':'b'].join('/');
 if(key!==danceKey){
  danceKey=key;danceBase=state.arrangement==='dymaxion'?net.map(t=>({id:t.id,r:t.r,x:t.x,y:t.y})):null;
  danceTargets=new Map((danceBase||[]).map(t=>[t.id,{x:t.x,y:t.y,r:t.r}]));danceTweens.clear();danceVertex=null;
 }
 return danceBase;
}
function danceActive(){return spaceshipUnlit()&&!exporting&&!!danceGrid();}
function danceSettled(){return danceActive()&&danceTweens.size===0;}
function resetDance(){if(!danceBase)return;for(const t of net){const b=danceBase.find(a=>a.id===t.id);if(b&&(t.x!==b.x||t.y!==b.y||t.r!==b.r)){t.x=b.x;t.y=b.y;t.r=b.r;meshSignature=null;}}danceTargets=new Map(danceBase.map(t=>[t.id,{x:t.x,y:t.y,r:t.r}]));danceTweens.clear();danceVertex=null;}
// The piece that joins edge `e` of a placed piece: which one, turned how, where.
function danceJoin(placed,e){
 const pair=matching(tiles,placed.id,e),a=world(hex[e],placed),b=world(hex[(e+1)%6],placed);
 for(let r=0;r<6;r++){const n={id:pair.id,r,x:0,y:0},p=world(hex[(pair.e+1)%6],n),q=world(hex[pair.e],n),x=a[0]-p[0],y=a[1]-p[1];
  if(Math.abs(q[0]+x-b[0])<1e-9&&Math.abs(q[1]+y-b[1])<1e-9)return {id:pair.id,r,x,y};}
 return null;
}
const sameCell=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6;
const dancePlaced=()=>[...danceTargets.entries()].map(([id,t])=>({id,...t}));
const joined=(from,t)=>{for(let e=0;e<6;e++){const j=danceJoin(from,e);if(j&&j.id===t.id&&j.r===t.r&&sameCell(j,t))return true;}return false;};
// Where the eye rests: the middle of the free part of the screen (beside the sidebar on wide screens,
// between the heading and the sidebar on phones), carried in map space most of the way toward the
// junction of the three continental plates, which lies one cell west of the net's middle. So a
// fitted map settles on that junction whatever the screen, and the bias turns with the map.
function danceCentre(){const {left,right,top,bottom}=freeRect(),unit=scale*state.zoom,x=(left+right)/2,y=(top+bottom)/2,c=rotateScreen([(x-w/2-state.panX)/unit,(y-h/2-state.panY)/unit],-state.gridRotation*Math.PI/180);return [c[0]-.8,-c[1]];}
// Every piece reachable from the first through valid joins.
function danceConnected(){
 const placed=dancePlaced(),seen=new Set([placed[0].id]);let grew=true;
 while(grew){grew=false;for(const p of placed)if(!seen.has(p.id)&&placed.some(q=>seen.has(q.id)&&joined(q,p))){seen.add(p.id);grew=true;}}
 return seen.size===placed.length;
}
function danceFill(centre=danceCentre()){
 const placed=dancePlaced();
 // Every three-piece corner of every placed piece (the two edges meeting there must name two
 // different pieces; on this sphere every other corner is a face meeting itself), nearest first;
 // among corners at one point the piece nearest the eye is the anchor. The current vertex is
 // kept until another is clearly nearer, half a cell nearer, so a nudge never re-forms the net.
 const corners=[];
 for(const p of placed)for(let k=0;k<6;k++){const a=danceJoin(p,(k+5)%6),b=danceJoin(p,k);if(!a||!b||a.id===b.id)continue;const q=world(hex[k],p);corners.push({anchor:p,k,d:Math.hypot(q[0]-centre[0],q[1]-centre[1]),own:Math.hypot(p.x-centre[0],p.y-centre[1])});}
 if(!corners.length)return;
 corners.sort((a,b)=>a.d-b.d||a.own-b.own);
 // When the eye sits in an empty cell, filling it comes first: no stickiness then.
 const eyeEmpty=Math.min(...placed.map(p=>Math.hypot(p.x-centre[0],p.y-centre[1])))>1;danceEyeEmpty=eyeEmpty;
 let choice=corners[0];
 if(danceVertex){const current=corners.find(c=>c.anchor.id===danceVertex.anchor&&c.k===danceVertex.corner);if(current&&current.d<=corners[0].d+(eyeEmpty?.05:.5))choice=current;}
 const anchor=choice.anchor,corner=choice.k;
 if(danceVertex&&danceVertex.anchor===anchor.id&&danceVertex.corner===corner)return;
 danceVertex={anchor:anchor.id,corner};danceCentreState=`${anchor.id}:${corner}`;
 const targets=new Map([[anchor.id,{x:anchor.x,y:anchor.y,r:anchor.r}]]),taken=cell=>[...targets.values()].some(q=>sameCell(q,cell));
 // The two pieces across the corner's edges: three plates always meet at the vertex.
 for(const j of [danceJoin(anchor,(corner+5)%6),danceJoin(anchor,corner)])targets.set(j.id,{x:j.x,y:j.y,r:j.r});
 // The leftover piece takes the free join nearest the eye, so the fourth hex comes to where the
 // user looks rather than lingering off screen; it keeps its cell only while that is about as near.
 for(const p of placed.sort((a,b)=>Math.hypot(a.x-centre[0],a.y-centre[1])-Math.hypot(b.x-centre[0],b.y-centre[1]))){
  if(targets.has(p.id))continue;
  const cur={x:p.x,y:p.y,r:p.r},curValid=!taken(cur)&&[...targets.entries()].some(([id,t])=>joined({id,...t},{id:p.id,...cur})),curD=Math.hypot(cur.x-centre[0],cur.y-centre[1]);
  let best=null;
  for(const [id,t] of targets)for(let e=0;e<6;e++){const j=danceJoin({id,...t},e);if(!j||j.id!==p.id||taken(j))continue;const d=Math.hypot(j.x-centre[0],j.y-centre[1]);if(!best||d<best.d)best={...j,d};}
  if(curValid&&(!best||curD<=best.d+1))targets.set(p.id,cur);else targets.set(p.id,best?{x:best.x,y:best.y,r:best.r}:cur);
 }
 for(const [id,t] of targets)danceTargets.set(id,t);
}
const easeOutBack=p=>p>=1?1:1+2*Math.pow(p-1,3)+1*Math.pow(p-1,2);
function danceStep(now){
 if(!danceActive())return false;
 // Not before the first fit (the camera is nowhere yet) nor while a story flight is in the air (the
 // centre is not where the user looks yet; the frame already placed the pieces).
 if(persistenceReady&&!tourAnimation)danceFill();
 const instant=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=380;let moving=false;
 for(const t of net){
  const {x:tx,y:ty,r:tr}=danceTargets.get(t.id);
  let tween=danceTweens.get(t.id);
  if(!tween||tween.tx!==tx||tween.ty!==ty||tween.tr!==tr){
   if(Math.hypot(tx-t.x,ty-t.y)<1e-6&&t.r===tr){danceTweens.delete(t.id);continue;}
   const turn=((tr-t.r+9)%6)-3;tween={fx:t.x,fy:t.y,fr:t.r,tx,ty,tr,toR:t.r+turn,start:now};danceTweens.set(t.id,tween);
  }
  const p=instant?1:Math.min(1,(now-tween.start)/duration),e=easeOutBack(p);
  t.x=tween.fx+(tx-tween.fx)*e;t.y=tween.fy+(ty-tween.fy)*e;t.r=tween.fr+(tween.toR-tween.fr)*e;meshSignature=null;
  if(p>=1){t.x=tx;t.y=ty;t.r=tr;danceTweens.delete(t.id);}else moving=true;
 }
 return moving;
}
// Framing a story: the piece holding most of it stays put; each other piece with
// points of the story joins the placed group at the edge that keeps those points
// closest to the anchor's, and the framing uses those settled positions.
function danceFrame(anchors){
 if(!danceActive()||!anchors.length)return null;
 const byPiece=new Map();for(const a of anchors){if(!byPiece.has(a.tile.id))byPiece.set(a.tile.id,[]);byPiece.get(a.tile.id).push(a.local);}
 const order=[...byPiece.keys()].sort((a,b)=>byPiece.get(b).length-byPiece.get(a).length);
 const placed=new Map([[order[0],danceTargets.get(order[0])]]),taken=cell=>[...placed.values()].some(q=>sameCell(q,cell));
 const at=(id,t)=>byPiece.get(id).map(l=>world(l,{id,...t}));
 const c0=at(order[0],placed.get(order[0])).reduce((s,p,_,all)=>[s[0]+p[0]/all.length,s[1]+p[1]/all.length],[0,0]);
 for(const id of order.slice(1)){
  let best=null;
  for(const [pid,pt] of placed)for(let e=0;e<6;e++){
   const j=danceJoin({id:pid,...pt},e);if(!j||j.id!==id||taken(j))continue;
   const spread=at(id,j).reduce((s,p)=>s+Math.hypot(p[0]-c0[0],p[1]-c0[1]),0);if(!best||spread<best.spread)best={...j,spread};
  }
  if(best)placed.set(id,{x:best.x,y:best.y,r:best.r});
 }
 // Pieces without points keep their place unless it is now taken; then they join a free edge.
 for(const [id,t] of danceTargets){
  if(placed.has(id))continue;
  if(!taken(t)){placed.set(id,t);continue;}
  let free=null;for(const [pid,pt] of placed)for(let e=0;e<6&&!free;e++){const j=danceJoin({id:pid,...pt},e);if(j&&j.id===id&&!taken(j))free=j;}
  placed.set(id,free?{x:free.x,y:free.y,r:free.r}:t);
 }
 for(const [id,t] of placed)danceTargets.set(id,{x:t.x,y:t.y,r:t.r});
 canvas.dataset.danceFrame=order.join('>');
 return anchors.map(a=>{const p=world(a.local,{id:a.tile.id,...danceTargets.get(a.tile.id)});return rotateScreen([p[0],-p[1]]);});
}
// History routes for the current period, projected on the live net (the dancing
// pieces move the net objects in place, so cached anchors follow). Detail routes
// appear only once the camera passes their zoom level.
function historyRoutes(){
 if(!historyOn||!historyPeriod)return [];
 const key=[historyPeriod.period.id,state.method,state.height,state.arrangement,state.lon,state.lat,state.roll].join('/');
 if(!historyProjection||key!==historyProjectionKey){historyProjection=projectTourRoutes(tiles,net,state,historyPeriod.routes);historyProjectionKey=key;}
 return historyProjection.filter(route=>!route.zoom||state.zoom>=route.zoom);
}
function historySpots(){return historyPeriod?historyPeriod.spots:[];}
function cancelTourAnimation(){cancelAnimationFrame(tourAnimation);tourAnimation=0;}
function animateTourView(target){
 cancelAnimationFrame(tourAnimation);tourAnimation=0;
 const from={zoom:state.zoom,panX:state.panX,panY:state.panY},start=performance.now();
 const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1250;
 const step=now=>{
  const t=duration?Math.min(1,(now-start)/duration):1,ease=1-(1-t)**3;
  for(const key of ['zoom','panX','panY'])state[key]=from[key]+(target[key]-from[key])*ease;
  draw();tourAnimation=t<1?requestAnimationFrame(step):0;
 };
 tourAnimation=requestAnimationFrame(step);
}
function focusPoints(points){const view=focusView(points);if(view)animateTourView(view);}
function focusView(points){
 if(!points.length)return null;
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
 const panel=$('controls').getBoundingClientRect(),portrait=w<=700&&h>w;
 const legend=$('floating-legend').getBoundingClientRect();
 const artwork=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).has('tour-artwork');
 const left=artwork?48:portrait?28:panel.right+32,right=w-(artwork?48:32),top=artwork?166:portrait?145:Math.max(72,legend.height?legend.bottom+24:72),bottom=artwork?h-38:portrait?panel.top-28:h-100;
 const unit=.82*Math.min(Math.max(100,right-left)/(bounds[2]-bounds[0]),Math.max(100,bottom-top)/(bounds[3]-bounds[1]));
 const zoom=Math.min(maximumZoom(scale),Math.max(.25,unit/scale));
 return {zoom,panX:(left+right-w)/2-(bounds[0]+bounds[2])/2*scale*zoom,panY:(top+bottom-h)/2-(bounds[1]+bounds[3])/2*scale*zoom};
}
// Focus: a dot frames its story's routes for this period and shows the spot text
// from the period Markdown. Every other story stays drawn; the scrubber stays.
function focusHistoryStory(id){
 if(!historyOn||!historyPeriod)return;const spot=historyPeriod.text.spots[id];if(!spot)return;
 if(!historyFocus)historyFocusView={scale,view:{zoom:state.zoom,panX:state.panX,panY:state.panY},expanded:state.sidebarExpanded};
 historyFocus=id;setSidebarExpanded(false,false);showHistoryCard(id);
 hideCoordinateReadout();
 const box=spot.view.match(/(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:→|->)\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/);
 const anchors=box?projectTourLocations(tiles,net,state,[[+box[1],+box[2]],[+box[3],+box[4]],[+box[1],+box[4]],[+box[3],+box[2]]].map(([latitude,longitude])=>({latitude,longitude})))
  :projectTourRoutes(tiles,net,state,historyPeriod.routes.filter(r=>r.story===id)).flatMap(route=>route.anchors);
 let points=danceFrame(anchors);
 if(points){
  // Settle the vertex rule at the centre the camera will fly to, re-frame the
  // pieces as they will then stand, and repeat until the destination is stable.
  const settled=()=>anchors.map(a=>{const p=world(a.local,{id:a.tile.id,...danceTargets.get(a.tile.id)});return rotateScreen([p[0],-p[1]]);});
  for(let i=0;i<4;i++){
   const view=focusView(points);if(!view)break;
   const unit=scale*view.zoom,c=rotateScreen([-view.panX/unit,-view.panY/unit],-state.gridRotation*Math.PI/180),before=JSON.stringify([...danceTargets]);
   danceVertex=null;danceFill([c[0],-c[1]]);points=settled();
   if(JSON.stringify([...danceTargets])===before)break;
  }
 }else points=anchors.map(({local,tile})=>rotateScreen(canvasWorld(local,tile)));
 focusPoints(points);syncHistoryTools();scheduleSave();draw();
}
function closeHistoryFocus(restore=true){
 if(!historyFocus)return;const selectedId=historyFocus;historyFocus=null;historyFocusPending=false;tourStory.close();
 cancelTourAnimation();
 if(restore&&historyFocusView){scale=historyFocusView.scale;Object.assign(state,historyFocusView.view);setSidebarExpanded(historyFocusView.expanded,false);}
 historyFocusView=null;syncHistoryTools();scheduleSave();draw();
 requestAnimationFrame(()=>{document.querySelector(`[data-tour-id="${selectedId}"]`)?.focus({preventScroll:true});});
}
function syncHistoryFocus(){
 if(!historyFocus||historyFocusPending)return;const spot=historyPeriod?.text.spots[historyFocus];
 if(!spot){closeHistoryFocus(true);return;}
 showHistoryCard(historyFocus);
}
// The card's bottom arrows cycle through the period's spots in Markdown order.
function showHistoryCard(id){
 const spot=historyPeriod.text.spots[id],ids=Object.keys(historyPeriod.text.spots),index=ids.indexOf(id);
 if(compactDevice){tourStory.strip(ids.map(sid=>({id:sid,title:historyPeriod.text.spots[sid].title,story:historyPeriod.text.spots[sid]})),id,sid=>{if(sid!==historyFocus)focusHistoryStory(sid);},()=>closeHistoryFocus(true));return;}
 tourStory.show(historySpots().find(s=>s.id===id)||{id,title:spot.title},{...spot,storyId:id},{index,count:ids.length,step:delta=>focusHistoryStory(ids[(index+delta+ids.length)%ids.length])});
}
const firstPeriodFor=id=>periods.find(p=>p.stories.includes(id))?.id||null;
$('stage').addEventListener('tourselect',event=>{
 if(historyOn)focusHistoryStory(event.detail.id);
 else{historyPeriodId=firstPeriodFor(event.detail.id)||historyPeriodId;historyFocus=event.detail.id;historyFocusPending=true;enableHistory(true);}
});
// Scrubber: nine approximate dates; the age name sits in the panel heading.
const historyToggle=$('show-history'),historyTools=document.querySelector('.history-tools'),historyLabel=historyToggle.querySelector('.history-label'),historySlider=$('history-stop'),historyDate=$('history-date'),historyLabels=document.querySelector('.history-stop-labels'),historyNote=$('history-note');
function readHistoryParam(value){if(!value)return null;return periods.find(p=>p.id===value||p.stop===value)?.id||null;}
historyPeriodId=readHistoryParam(new URLSearchParams(location.search).get('history'))||initialHistory?.period||(initialTour?firstPeriodFor(initialTour.id):null);
function currentPeriod(){return periodInfo(historyPeriodId);}
historySlider.max=String(periods.length-1);historyLabels.style.setProperty('--stop-count',String(periods.length));
for(const p of periods){const b=document.createElement('button');b.type='button';b.dataset.stop=p.id;b.setAttribute('aria-label',`${p.label}, ${p.date}`);b.textContent=p.tick;b.onclick=()=>selectHistoryPeriod(p.id);historyLabels.append(b);}
function syncHistoryTools(){
 const info=currentPeriod();
 historyToggle.setAttribute('aria-pressed',String(historyOn));historyToggle.classList.toggle('back',compactDevice&&historyOn);
 historyLabel.textContent=historyOn&&!compactDevice?'Close history':'History';
 historyTools.hidden=!historyOn;document.body.classList.toggle('history',historyOn);document.body.classList.toggle('history-focus',historyOn&&!!historyFocus);
 historySlider.value=String(periods.indexOf(info));historySlider.setAttribute('aria-valuetext',`${info.label}, ${info.date}`);historyDate.textContent=`${info.label} · ${info.date}`;
 for(const b of historyLabels.children)b.setAttribute('aria-pressed',String(b.dataset.stop===info.id));
 const note=!historyPeriod?'Loading stories…':historyPeriod.period.id!==info.id?'Loading stories…':historyPeriod.text.intro.note||(historyPeriod.routes.length?'':'Nothing written for this period yet.');
 historyNote.textContent=note;historyNote.hidden=!note;
}
// Choosing a date activates the period's headline spot (the first section of its
// Markdown) unless the focused story continues there, in which case it re-reads.
let historyAutoFocus=false;
function selectHistoryPeriod(id,writeURL=true){historyPeriodId=periodInfo(id).id;historyProjection=null;historyAutoFocus=true;syncHistoryTools();if(writeURL)updateMapUrl();loadHistoryPeriod();draw();}
async function loadHistoryPeriod(){
 const token=++historyLoad,id=currentPeriod().id;
 try{const data=await loadPeriod(id);if(token!==historyLoad||!historyOn)return;historyPeriod=data;historyProjection=null;
  const auto=historyAutoFocus;historyAutoFocus=false;
  if(historyFocusPending){historyFocusPending=false;if(historyFocus)focusHistoryStory(historyFocus);}
  else if(auto&&!(historyFocus&&data.text.spots[historyFocus])){const first=Object.keys(data.text.spots)[0];if(first)focusHistoryStory(first);else closeHistoryFocus(true);}
  else syncHistoryFocus();
  syncHistoryTools();draw();}
 catch{if(token===historyLoad){historyNote.textContent='Could not load this period. Try again.';historyNote.hidden=false;}}
}
async function enableHistory(on){
 if(historyOn===on){syncHistoryTools();return;}
 historyOn=on;
 // Judge eligibility from the current settings, not from a renderer that may not be ready yet.
 if(on&&!tourEnabled(renderDefault||activeDefault())){const pair=sharePair('lifezones','dymaxion');applyMapOption(pair.layout,'layout');applyMapOption(pair.style,'style');}
 if(!on){++historyLoad;historyPeriod=null;historyProjection=null;closeHistoryFocus(false);syncHistoryTools();updateMapUrl();draw();return;}
 syncHistoryTools();updateMapUrl();loadHistoryPeriod();draw();
}
// One button: on phones it is also the way back, from the cards to the scrubber and from the scrubber to the map.
historyToggle.addEventListener('click',()=>{if(historyOn&&compactDevice&&historyFocus)closeHistoryFocus(true);else enableHistory(!historyOn);});
// On phones the scrubber takes the place of the options button inside the sidebar.
if(compactDevice)$('customize').after(historyTools);
historySlider.addEventListener('input',()=>selectHistoryPeriod(periods[+historySlider.value].id));

// Manual map gestures interrupt the camera transition immediately.
$('stage').addEventListener('pointerdown',cancelTourAnimation,true);
$('stage').addEventListener('wheel',cancelTourAnimation,{capture:true,passive:true});
document.querySelector('.view-tools').addEventListener('pointerdown',cancelTourAnimation,true);

function draw(){if(exporting)return;scheduleSave();if(queued)return;queued=true;requestAnimationFrame(render);}
let fractalGridKey=null,fractalPaths=[],fineFractalPaths=[],fineFractalBounds=null,fineFractalMask='';
function drawFractalGrid(){
 if(!$('fractalgrid').checked||state.subgridWidth<=0)return;
 const detail=fractalDetailPlan(state.zoom),large=detail.large.some(a=>a>0),fine=detail.fine.some(a=>a>0),largeKey=meshSignature+'|'+fractalEdgeOwners(detail.large),fineMask=fractalEdgeOwners(detail.fine).join(',');
 if(large>0&&fractalGridKey!==largeKey){
  fractalGridKey=largeKey;const strongest=new Map();
  const largeLines=visibleFractalLines(detail.large);
  for(const t of arrangement.gridParents||visible)largeLines.forEach((edges,level)=>{
   if(detail.large[level]===0)return;
   for(const [a,b] of edges){const p=world(a,t),q=world(b,t),id=edgeKey(p,q),old=strongest.get(id);if(!old||detail.large[level]>detail.large[old.level])strongest.set(id,{p,q,level});}
  });
  fractalPaths=fractalOpacities.map(()=>new Path2D());
  for(const {p,q,level} of strongest.values()){fractalPaths[level].moveTo(...p);fractalPaths[level].lineTo(...q);}
 }
 if(fine>0){
  const v=viewBounds(0),b=fineFractalBounds,vw=v.right-v.left,vh=v.top-v.bottom;
  // Retain a margin around the viewport: normal dragging reuses all paths.
  // Shrink the cache after a substantial zoom-in to keep stroke work bounded.
  if(!b||fineMask!==fineFractalMask||v.left<b.left||v.right>b.right||v.bottom<b.bottom||v.top>b.top||(b.right-b.left)*(b.top-b.bottom)>4*vw*vh){
   fineFractalMask=fineMask;
   fineFractalBounds={left:v.left-vw*.2,right:v.right+vw*.2,bottom:v.bottom-vh*.2,top:v.top+vh*.2};
   const strongest=new Map();
   const fineLines=visibleFractalLines(detail.fine);
   for(const t of fineFractalTiles(fineFractalBounds))fineLines.forEach((edges,level)=>{
    if(detail.fine[level]===0)return;
    for(const [a,b] of edges){const p=[a[0]*fractalFineScale+t.x,a[1]*fractalFineScale+t.y],q=[b[0]*fractalFineScale+t.x,b[1]*fractalFineScale+t.y],id=edgeKey(p,q),old=strongest.get(id);if(!old||detail.fine[level]>detail.fine[old.level])strongest.set(id,{p,q,level});}
   });
   fineFractalPaths=fractalOpacities.map(()=>new Path2D());
   for(const {p,q,level} of strongest.values()){fineFractalPaths[level].moveTo(...p);fineFractalPaths[level].lineTo(...q);}
  }
 }
 const unit=scale*state.zoom;
 ctx.save();ctx.translate(w/2+state.panX,h/2+state.panY);ctx.rotate(state.gridRotation*Math.PI/180);ctx.scale(unit,-unit);
 ctx.strokeStyle=$('hex-grid-color').value;ctx.lineWidth=Math.max(.75,state.subgridWidth*1.25)/unit;
 if(large>0)fractalPaths.forEach((path,level)=>{if(detail.large[level]===0)return;ctx.globalAlpha=detail.large[level];ctx.stroke(path);});
 if(fine>0)fineFractalPaths.forEach((path,level)=>{if(detail.fine[level]===0)return;ctx.globalAlpha=detail.fine[level];ctx.stroke(path);});ctx.restore();
}
// Back grid: the empty cells of the main hexagon lattice on the background of
// any finite map (on by default for Spaceship Earth, whose pieces slide through
// it). Cells under a piece, including one mid-slide, cells inside a map outline
// and edges shared with a piece are left out; the map's own borders come later.
function drawBackdropGrid(){
 if(!$('backdrop-grid').checked||state.backdropWidth<=0||state.backdropOpacity<=0||tiling)return;
 const unit=scale*state.zoom,angle=state.gridRotation*Math.PI/180,H=Math.sqrt(3)/2;
 const corners=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>{const v=rotateScreen([(x-w/2-state.panX)/unit,(y-h/2-state.panY)/unit],-angle);return [v[0],-v[1]];});
 const xs=corners.map(c=>c[0]),ys=corners.map(c=>c[1]);
 const i0=Math.floor((Math.min(...xs)-2)/1.5),i1=Math.ceil((Math.max(...xs)+2)/1.5),j0=Math.floor((Math.min(...ys)-2)/H),j1=Math.ceil((Math.max(...ys)+2)/H);
 if((i1-i0)*(j1-j0)>4000)return;
 const occupied=(x,y)=>net.some(t=>Math.hypot(t.x-x,t.y-y)<1)||(arrangement.outline&&pointInLoops([x,y],arrangement.outline))||(arrangement.clip&&pointInLoops([x,y],[arrangement.clip]));
 ctx.save();ctx.strokeStyle=$('backdrop-color').value;ctx.globalAlpha=state.backdropOpacity/100;ctx.lineWidth=state.backdropWidth;ctx.lineCap='round';ctx.beginPath();
 const seen=new Set();
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
  if(Math.abs((i+j)%2)===1)continue;const x=1.5*i,y=H*j;if(occupied(x,y))continue;
  const cell={x,y,r:0};
  for(let e=0;e<6;e++){
   const a=hex[e],b=hex[(e+1)%6],mx=x+(a[0]+b[0]),my=y+(a[1]+b[1]);
   if(occupied(mx,my))continue;
   const key=`${(x+(a[0]+b[0])/2).toFixed(3)},${(y+(a[1]+b[1])/2).toFixed(3)}`;if(seen.has(key))continue;seen.add(key);
   ctx.moveTo(...point(a,cell));ctx.lineTo(...point(b,cell));
  }
 }
 ctx.stroke();ctx.restore();canvas.dataset.backdropEdges=String(seen.size);
}
function drawPuzzle(){
 if(!$('puzzlegrid').checked||state.puzzleWidth<=0)return;
 ctx.save();ctx.globalAlpha=1;ctx.strokeStyle=$('puzzle-color').value;ctx.lineWidth=state.puzzleWidth;ctx.lineCap='round';
 const seen=new Set();ctx.beginPath();
 for(const t of visible)for(const edge of puzzleFor(t.id).edges){const path=edge.points.map(p=>world(p,t)),key=edgeKey(path[0],path.at(-1));if(seen.has(key))continue;seen.add(key);path.forEach((p,i)=>i?ctx.lineTo(...point(p,{x:0,y:0,r:0})):ctx.moveTo(...point(p,{x:0,y:0,r:0})));}
 ctx.stroke();ctx.restore();
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
  indicatrixWorker=new Worker(new URL('./indicatrix-worker.mjs?v=tetra-area-2',import.meta.url),{type:'module'});
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
let surfaceCache=null,liveSourceKey=null;
const surfaceMeshes=new Map();
function sourceKey(type){return [experimentPaletteRevision,type,classCount('land-classes'),classCount('ocean-classes')].join('/');}
function selectedSurface(){if(new URLSearchParams(location.search).has('palette-lab'))return null;return surfacePreset(state,displayedSource,classCount('land-classes'),classCount('ocean-classes'),+$('interpolation').value,hexBridgesEnabled);}
function visibleSurfaceTiles(level){
 const n=2**level,result=[];
 for(const t of visible)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const rect=surfaceTileRect(level,x,y),[rx,ry,rw,rh]=rect;
  const corners=[[rx,ry],[rx+rw,ry],[rx+rw,ry+rh],[rx,ry+rh]].map(p=>point(p,t));
  if(Math.max(...corners.map(p=>p[0]))<0||Math.min(...corners.map(p=>p[0]))>w||Math.max(...corners.map(p=>p[1]))<0||Math.min(...corners.map(p=>p[1]))>h)continue;
  result.push({t,region:t.id,x,y,rect});
 }
 return result;
}
function drawPrecomputedSurface(){
 if($('puzzlegrid').checked){canvas.dataset.surface='live';return false;}
 const entry=renderDefault?{...renderDefault,path:renderDefault.basePath||renderDefault.path+'/base'}:selectedSurface();if(!entry||(new URLSearchParams(location.search).has('bake-surfaces')||new URLSearchParams(location.search).get('surface')==='live')){canvas.dataset.surface='live';return false;}
 if(renderDefault)surfaceCache=defaultLayers.base;else if(!surfaceCache||surfaceCache===defaultLayers?.base)surfaceCache=new PrecomputedSurfaces(gl,draw);
 const plan=surfacePlan(surfaceLevel(scale*state.zoom*dpr,entry.maxLevel),entry.regions,visibleSurfaceTiles);
 for(const tile of plan.tiles)tile.path=litPathFor(tile.t);
 const previewsReady=surfaceCache.prepare(entry,plan.tiles,plan.level);
 const level=previewsReady?plan.level:0,drawTiles=previewsReady?plan.tiles:visibleSurfaceTiles(0).map(tile=>({...tile,path:litPathFor(tile.t)}));
 canvas.dataset.surfacePreview=String(!previewsReady);
 canvas.dataset.surface='precomputed';canvas.dataset.surfaceLevel=level;
 const savedBuffer=buffer,savedCount=count;
 gl.uniform1i(uniforms.bakedOn,1);
 for(const {t,x,y,rect,path} of drawTiles){
   const key=[geometryKey,state.arrangement,t.id,t.x,t.y,t.r,t.opacity,level,x,y].join('/');
   let mesh=surfaceMeshes.get(key);
   if(!mesh){
    const vertices=[];
    for(const p of (t.drawPatches||tiles[t.id].patches)){
     const triangle=p.xy.map((v,i)=>[...canvasWorld(v,t),...(p.weights?p.weights[i]:[0,1,2].map(j=>j===i?1:0)),...p.v.flat(),t.opacity,...v,t.id]);
     vertices.push(...clipSurfaceTriangle(triangle,rect));
    }
    mesh={buffer:gl.createBuffer(),count:vertices.length/18};gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
   }else surfaceMeshes.delete(key);
   surfaceMeshes.set(key,mesh);
   while(surfaceMeshes.size>192){const oldest=surfaceMeshes.keys().next().value;gl.deleteBuffer(surfaceMeshes.get(oldest).buffer);surfaceMeshes.delete(oldest);}
   if(!mesh.count)continue;
   const tile=surfaceCache.get(path?{...entry,path}:entry,t.id,level,x,y);if(!tile)continue;
   gl.uniform4fv(uniforms.bakedRect,tile.rect);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tile.texture);
   buffer=mesh.buffer;count=mesh.count;drawGeometry(program);
 }
 buffer=savedBuffer;count=savedCount;gl.uniform1i(uniforms.bakedOn,0);canvas.dataset.surfacePending=surfaceCache.pending.size;canvas.dataset.surfaceTiles=surfaceCache.cache.size;canvas.dataset.surfaceFailures=surfaceCache.failures.size;return true;
}
function bindMaterialUniforms(){
 const categoricalHex=state.zoom>=1.5&&(displayedSource==='continents'||displayedSource==='countries');
 gl.uniform1i(uniforms.circularMode,circularMode(state.method));gl.uniform1i(uniforms.tetraEqualArea,state.method==='tetra'?1:0);gl.uniform1i(uniforms.ecologyHex,displayedSource==='ecology'?1:0);gl.uniform1i(uniforms.hexCategorical,categoricalHex?1:0);gl.uniform1i(uniforms.ecologyBridges,hexBridgesEnabled);gl.uniform1i(uniforms.ecologyOcta,state.method==='octa'?1:0);gl.uniform3fv(uniforms['ecologyVertices[0]'],ecologyVertices);
 gl.uniform1f(uniforms.colorFade,legendFade());gl.uniform1i(uniforms.landCutout,$('relief-enabled').checked&&lightingControls().treatment==='land'&&relief?.ready?1:0);
 gl.uniform3fv(uniforms.background,[1,3,5].map(i=>parseInt($('background-color').value.slice(i,i+2),16)/255));
 gl.uniform1i(uniforms.material,['source','ivory','elevation'].indexOf(relief?.ready?materialMode():'source'));gl.uniform1f(uniforms.materialSea,appliedLighting().reliefSeaLevel/255);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,heightTexture);gl.uniform1i(uniforms.heightMap,3);gl.activeTexture(gl.TEXTURE0);
}
function bindRiverUniforms(){gl.uniform1i(uniforms.riverField,riverFieldSize?1:0);gl.uniform2fv(uniforms.riverSize,riverFieldSize||[1,1]);gl.uniform1f(uniforms.riverWidthScale,state.riverWidth);gl.uniform3fv(uniforms.riverColor,[1,3,5].map(i=>parseInt($('river-color').value.slice(i,i+2),16)/255));gl.uniform1i(uniforms.riversVisible,$('rivers-visible').checked?1:0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.uniform1i(uniforms.riverMap,1);gl.activeTexture(gl.TEXTURE0);}
// Shared settings remain visible if any owning feature is enabled. Hiding DOM
// nodes preserves values and removes inactive options from keyboard navigation.
function syncSettingsVisibility(){
 for(const group of document.querySelectorAll('[data-settings-for]')){
  group.hidden=!group.dataset.settingsFor.split(' ').some(id=>{const control=$(id);return control.type==='checkbox'?control.checked:control.value!=='off';});
 }
}
document.addEventListener('change',syncSettingsVisibility);
function render(refined=false,exportMode=false){if(exporting&&!exportMode)return;queued=false;document.documentElement.style.setProperty('--map-background',$('background-color').value);const background=$('background-color').value,brightness=[1,3,5].reduce((sum,i,k)=>sum+parseInt(background.slice(i,i+2),16)*[.299,.587,.114][k],0);document.documentElement.style.setProperty('--heading-ink',brightness>145?'#193c49':'#f6f4ed');for(const id of ['background-color','border-color','hex-grid-color','puzzle-color','graticule-color','river-color','backdrop-color'])$(id+'-value').value=$(id).value;syncOptionCards();syncSettingsVisibility();updateDistortionLegend();$('zoom-value').textContent=Math.round(state.zoom*100)+'%';if(!ready||!gl)return;const currentDefault=activeDefault();const previousPath=!!renderDefault;selectRenderPath(currentDefault);initializeProgram(!!renderDefault);if(previousPath&&!renderDefault&&($('relief-enabled').checked||['ivory','elevation'].includes(displayedSource)))ensureRelief();if(!program)return;if(renderDefault&&!defaultLayers)defaultLayers=new DefaultLayers(gl,draw);if(renderDefault)defaultLayers.prepare(renderDefault);const wasMerged=!!renderMerged;renderMerged=!separateComparison&&!spaceshipUnlit()?mergedEntry(renderDefault):null;if(renderMerged&&!wasMerged){if(surfaceCache===defaultLayers.base)surfaceCache=null;defaultLayers.dispose();defaultLayers=new DefaultLayers(gl,draw);defaultLayers.prepare(renderDefault);}if(!renderMerged&&mergedMaps){if(surfaceCache===mergedMaps.cache)surfaceCache=null;mergedMaps.dispose();mergedMaps=null;}const lighting=renderMerged||spaceshipUnlit()?(defaultLayers?.detail.setRequired(new Set()),null):renderDefault?defaultLayers.lighting(renderDefault,scale*state.zoom,dpr,w,h,state.panX,state.panY,{capToBase:$('lighting-resolution-test').value==='map',compareHighest:$('lighting-resolution-test').value!=='auto'}):$('relief-enabled').checked&&relief?.ready?cachedLighting():null;canvas.dataset.renderPath=renderDefault?'images':'live';if(!renderDefault&&$('rivers-visible').checked&&uploadedRiverKey!==state.riverLevels+'/field'&&!offlineBake)updateRiverLayer();if(danceActive()&&danceStep(performance.now()))requestAnimationFrame(draw);updateVisibleMesh();if(!exportMode)updateHeadingVisibility();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(...[1,3,5].map(i=>parseInt(background.slice(i,i+2),16)/255),1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform1f(uniforms.gridRotation,state.gridRotation*Math.PI/180);gl.uniform2f(uniforms.size,w,h);gl.uniform3f(uniforms.view,scale*state.zoom,state.panX,state.panY);gl.uniform3f(uniforms.angles,state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);gl.uniform1f(uniforms.bias,state.bias);gl.uniform1f(uniforms.blend,+$('interpolation').value);gl.uniform1f(uniforms.grid,$('graticule').checked?state.grid*Math.PI/180:0);gl.uniform1f(uniforms.gridWidth,.6*state.graticuleWidth/(scale*state.zoom));gl.uniform3fv(uniforms.gridColor,[1,3,5].map(i=>parseInt($('graticule-color').value.slice(i,i+2),16)/255));gl.uniform1i(uniforms.palette,displayedSource==='continents'?['atlas','original','night'].indexOf($('palette').value):1);gl.uniform1i(uniforms.distortion,derivativeSupport?($('distortion').checked?3:0):0);gl.uniform1f(uniforms.distortionOpacity,state.distortionOpacity);gl.uniform1f(uniforms.pixelScale,scale*state.zoom*dpr);gl.uniform1i(uniforms.map,0);gl.uniform1i(uniforms.felvClip,arrangement.clip?1:0);
 const drawColor=(width=w,height=h,baseOnly=false,overlayOnly=false)=>{gl.useProgram(program);gl.uniform1i(uniforms.overlayOnly,overlayOnly?1:0);gl.uniform1f(uniforms.grid,!baseOnly&&$('graticule').checked?state.grid*Math.PI/180:0);gl.uniform1i(uniforms.distortion,!baseOnly&&derivativeSupport?($('distortion').checked?3:0):0);gl.uniform2f(uniforms.size,width,height);if(!renderDefault){bindMaterialUniforms();bindRiverUniforms();}gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);if(!overlayOnly&&drawPrecomputedSurface())return;gl.uniform1i(uniforms.bakedOn,0);if(!overlayOnly&&liveSourceKey!==sourceKey(displayedSource)){if(!$('map-loading').textContent)updateMapSource();return;}drawGeometry(program);};
 if(renderMerged){
  if(!mergedMaps)mergedMaps=new MergedMaps(gl,draw);
  defaultLayers.base.setRequired(new Set());defaultLayers.detail.setRequired(new Set());
  const plan=mergedMaps.draw(renderMerged,{width:w,height:h,unit:scale*state.zoom,dpr,panX:state.panX,panY:state.panY},null,[]);
  surfaceCache=mergedMaps.cache;canvas.dataset.surface='precomputed';canvas.dataset.surfacePreview=String(!plan.ready);canvas.dataset.surfaceLevel=String(plan.level);canvas.dataset.surfacePending=String(surfaceCache.pending.size);canvas.dataset.surfaceTiles=String(surfaceCache.cache.size);canvas.dataset.surfaceFailures=String(surfaceCache.failures.size);
 }else drawColor(w,h,!!lighting);
 canvas.dataset.merged=String(!!renderMerged);canvas.dataset.tourLayout=danceActive()?'dancing':'default';canvas.dataset.danceVertex=danceActive()?danceCentreState:'';canvas.dataset.danceEyeEmpty=String(danceActive()&&danceEyeEmpty);canvas.dataset.danceValid=String(danceActive()?danceConnected():true);canvas.dataset.tourLighting=spaceshipLit()?'lit':spaceshipUnlit()?'unlit':'default';canvas.dataset.litHold=litRotationHold===null?'':String(litRotationHold);canvas.dataset.turn=state.gridRotation.toFixed(1);canvas.dataset.danceMoving=String(danceTweens.size>0);canvas.dataset.dancePositions=net.map(t=>`${t.id}:${t.x.toFixed(2)},${t.y.toFixed(2)},${t.r.toFixed(2)}`).join(' ');
 if(lighting){(renderDefault?defaultLayers:projectedLighting).composite(lighting,w,h,scale*state.zoom,state.panX,state.panY,state.shadowOpacity,state.lightOpacity);
  if(!renderDefault&&($('graticule').checked||$('distortion').checked)){gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);drawColor(w,h,false,true);gl.disable(gl.BLEND);}
 }

 mergedPreview?.({entry:renderDefault&&background===renderDefault.signature.controls['background-color']&&state.shadowOpacity===renderDefault.signature.state.shadowOpacity&&state.lightOpacity===renderDefault.signature.state.lightOpacity?renderDefault:null,w,h,dpr,unit:scale*state.zoom,panX:state.panX,panY:state.panY,gl});
 if(renderDefault&&$('graticule').checked&&state.graticuleWidth>0){
  initializeProgram('graticule');gl.useProgram(program);gl.uniform2f(uniforms.size,w,h);gl.uniform3f(uniforms.view,scale*state.zoom,state.panX,state.panY);gl.uniform1f(uniforms.gridRotation,state.gridRotation*Math.PI/180);gl.uniform3f(uniforms.angles,state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);gl.uniform1f(uniforms.bias,state.bias);gl.uniform1f(uniforms.blend,+$('interpolation').value);gl.uniform1f(uniforms.grid,state.grid*Math.PI/180);gl.uniform1f(uniforms.gridWidth,.6*state.graticuleWidth/(scale*state.zoom));gl.uniform3fv(uniforms.gridColor,[1,3,5].map(i=>parseInt($('graticule-color').value.slice(i,i+2),16)/255));gl.uniform1i(uniforms.felvClip,arrangement.clip?1:0);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);drawGeometry(program);gl.disable(gl.BLEND);initializeProgram(true);
 }
 updateLoadingStatus();
 if(!exportMode){
  const enabled=tourEnabled(renderDefault)&&!isAboutPath(location.pathname);
  if(historyOn&&!enabled)enableHistory(false);
  // Off the timeline the seven entry dots invite a click; on it each period places its own spots.
  tourMarkers.update(enabled?projectTourLocations(tiles,net,state,historyOn?historySpots():tourLocations):[],point,w,h);
  tourRoutes.update(historyOn&&enabled?historyRoutes():[],point,w,h);
  const labels=historyOn&&enabled&&historyFocus&&historyPeriod?.text.spots[historyFocus]?.labels||[];
  tourLabels.update(labels.length?projectTourLocations(tiles,net,state,labels):[],point,w,h);updateCoordinateReadout();
 }

 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.lineJoin='round';
 drawBackdropGrid();
 ctx.save();
 if(arrangement.outline){traceOutline();ctx.clip();}
 else if(!tiling){ctx.beginPath();for(const t of visible){($('puzzlegrid').checked?puzzleFor(t.id).outline:t.polygon||hex).forEach((p,i)=>i?ctx.lineTo(...point(p,t)):ctx.moveTo(...point(p,t)));ctx.closePath();}ctx.clip();}
 if(arrangement.clip){ctx.beginPath();arrangement.clip.forEach((p,i)=>i?ctx.lineTo(...point(p,{x:0,y:0,r:0})):ctx.moveTo(...point(p,{x:0,y:0,r:0})));ctx.closePath();ctx.clip();}
 drawSubgrid();drawFractalGrid();drawIndicatrixes();
 for(const t of visible){ctx.globalAlpha=t.opacity;ctx.beginPath();(t.polygon||hex).forEach((p,i)=>{const xy=point(p,t);i?ctx.lineTo(...xy):ctx.moveTo(...xy);});ctx.closePath();ctx.strokeStyle=$('border-color').value;if(state.line>0&&!arrangement.outline&&!$('puzzlegrid').checked){ctx.lineWidth=state.line;ctx.stroke();}
 if($('construction').checked){ctx.strokeStyle='#cb6d3199';ctx.lineWidth=1;ctx.setLineDash([4,4]);for(const p of (t.drawPatches||tiles[t.id].patches)){ctx.beginPath();p.xy.forEach((v,i)=>i?ctx.lineTo(...point(v,t)):ctx.moveTo(...point(v,t)));ctx.closePath();ctx.stroke();}ctx.setLineDash([]);}
 if($('labels').checked){const c=point(t.polygon?t.polygon.reduce((s,p)=>s.map((v,i)=>v+p[i]/t.polygon.length),[0,0]):[0,0],t);ctx.beginPath();ctx.arc(...c,14,0,Math.PI*2);ctx.fillStyle='#f6fbfbea';ctx.fill();ctx.fillStyle='#214754';ctx.font='600 12px "DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ABCD'[t.id],...c);
 for(let e=0;e<(t.polygon?0:6);e++){const mid=hex[e].map((v,i)=>(v+hex[(e+1)%6][i])*.46);const xy=point(mid,t);ctx.font='10px "Space Grotesk",sans-serif';ctx.fillStyle='#f6fbfbde';ctx.fillRect(xy[0]-8,xy[1]-7,16,14);ctx.fillStyle='#3d6774';ctx.fillText(edgeLabels[t.id][e],...xy);}}
 }
 ctx.globalAlpha=1;
 if(arrangement.outline&&state.line>0){traceOutline();ctx.strokeStyle=$('border-color').value;ctx.lineWidth=state.line;ctx.stroke();}
 if(state.line>0&&!$('puzzlegrid').checked){ctx.strokeStyle='#d33d42';ctx.lineWidth=state.line*2.5;
 for(const t of visible)for(let e=0;e<6;e++)if(t.bad[e]){const local=(e-t.r+6)%6;ctx.beginPath();ctx.moveTo(...point(hex[local],t));ctx.lineTo(...point(hex[(local+1)%6],t));ctx.stroke();}
 for(const edge of arrangement.seams||[])if(edge.error>1e-6){ctx.beginPath();ctx.moveTo(...point(edge.a,{x:0,y:0,r:0}));ctx.lineTo(...point(edge.b,{x:0,y:0,r:0}));ctx.stroke();}
 }
 ctx.restore();drawPuzzle();$('status').textContent=arrangementNames[state.arrangement]+($('puzzlegrid').checked?' · '+$('puzzle-count').value+' puzzle pieces':state.line>0?' · red edges mark mismatched joins':' · borders hidden');
 $('height-credit').hidden=!$('relief-enabled').checked&&!['ivory','elevation'].includes($('map-source').value);
 const dotInfo=$('dotgrid-area');dotInfo.hidden=!$('dotgrid').checked;
 if(!dotInfo.hidden){const area=dotGridArea(state.method),format=new Intl.NumberFormat('en-US',{notation:'compact',compactDisplay:'long',maximumSignificantDigits:2});dotInfo.textContent=`Every 4 dots represent roughly ${format.format(area.km2*4)} km². These are global averages; actual area varies with projection and location.`;}
 const info=$('subgrid-area');info.hidden=!$('subgrid').checked||state.subgridWidth<=0;
 if(!info.hidden){const area=subgridArea(state.method),format=new Intl.NumberFormat('en-US',{notation:'compact',compactDisplay:'long',maximumSignificantDigits:2});info.textContent=`Every 4 small hexagons cover roughly ${format.format(area.km2*4)} km². These are global averages; actual area varies with projection and location.`;}

}
for(const b of document.querySelectorAll('.method'))b.onclick=()=>{state.method=b.dataset.method;state.layout=0;document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el===b));rebuild();};
$('layout').onchange=()=>{state.arrangement=$('layout').value;rebuild();if($('optimize').checked)applySearch();};for(const id of ['interpolation','graticule','construction','subgrid','dotgrid','fractalgrid','labels','palette','distortion','indicatrix'])$(id).onchange=draw;$('quality').onchange=resize;
$('puzzlegrid').addEventListener('change',()=>{
 if($('puzzlegrid').checked){
  if(circularMode(state.method)){state.method='tetra';document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el.dataset.method===state.method));}
  if(!['flower','dymaxion'].includes(state.arrangement))state.arrangement='flower';
  for(const id of ['subgrid','fractalgrid','dotgrid','labels'])$(id).checked=false;
 }
 rebuild();
});
$('puzzle-count').addEventListener('change',()=>{meshSignature=null;fitView();});
$('fractalgrid').addEventListener('change',()=>{if($('fractalgrid').checked){$('puzzlegrid').checked=false;$('subgrid').checked=false;$('dotgrid').checked=false;}draw();});
for(const id of ['subgrid','dotgrid'])$(id).addEventListener('change',()=>{if($(id).checked){$('fractalgrid').checked=false;$('puzzlegrid').checked=false;}draw();});
function ensureRelief(){if(activeDefault()||!gl||!program)return;if(!relief){gl.deleteTexture(heightTexture);relief=new ReliefRenderer(gl,vs,draw,message=>$('relief-status').textContent=message);relief.maxSourceWidth=compactDevice?1536:4096;heightTexture=relief.heightTextures[0];}relief.load();}
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

 const baseKey=lightingKey(settings,preset,[$('interpolation').value,controls.treatment,controls.tone,$('puzzlegrid').checked,$('puzzle-count').value,$('rivers-visible').checked,riverGeneration,state.riverWidth,...patch]);
 const pad=tiling?0:relief.padding(settings,100)/100+.15;
 const baseRect=[b[0]-pad,-b[3]-pad,b[2]-b[0]+pad*2,b[3]-b[1]+pad*2];
 const view={unit:scale*state.zoom,width:w,height:h,dpr,panX:state.panX,panY:state.panY};
 let plan=offlineLightingPlan||lightingPlan(baseRect,{...view,compact:compactDevice,maxSize:graphicsLimit,repeat:!!tiling});
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
   relief.render({width:w,height:h,dpr:1,unit:scale,state:{...settings,panX:state.panX,panY:state.panY},blend:+$('interpolation').value,clip:arrangement.clip,material:'source',treatment:controls.treatment,tone:controls.tone,signature:key,drawColor:()=>{},drawGeometry,seams,riverTexture,riverField:riverFieldSize,riverWidthScale:state.riverWidth,riverVisible:$('rivers-visible').checked,riverDepth:settings.reliefRiverDepth,pixelBudget:compactDevice?1200000:5500000,refined:true,lightingPass});
   entry.textures.push(projectedLighting.snapshot());
  }
  projectedLighting.store(key,entry);canvas.dataset.lightingBakes=projectedLighting.bakes;canvas.dataset.lightingLevel=plan.level;canvas.dataset.lightingResolution=w+'×'+h;$('relief-status').textContent=plan.level?'Close-up lighting layers ready':'Lighting layers ready';
  return entry;
 }catch(error){for(const t of entry?.textures||[])gl.deleteTexture(t);$('relief-enabled').checked=false;$('relief-status').textContent='Lighting could not be prepared on this device.';console.warn('Lighting layers:',error);return null;}
 finally{w=saved.w;h=saved.h;scale=saved.scale;dpr=saved.dpr;state.zoom=saved.zoom;state.panX=saved.panX;state.panY=saved.panY;state.gridRotation=saved.gridRotation;canvas.width=saved.cw;canvas.height=saved.ch;meshSignature=null;relief.releaseDetail();}
}
function updateRelief(){
 if($('relief-enabled').checked&&$('lighting-preset').value==='none')$('lighting-preset').value='gentle';
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
$('lighting-resolution-test').onchange=()=>draw();
for(const id of ['relief-treatment','relief-tone'])$(id).onchange=()=>{if($('lighting-preset').value==='custom')$('relief-status').textContent='Apply lighting to update the layers.';else updateRelief();};

// Repositioning the globe is a toggle in More options > Position; on phones it opens the full-screen repositioning flow.
function mode(value){state.mode=value;$('rotate').setAttribute('aria-pressed',String(value==='rotate'));$('rotate').textContent=value==='rotate'?'Stop repositioning':'Reposition globe by dragging';scheduleSave();}
$('rotate').onclick=()=>{if(state.mode==='rotate'){if(mobileRepositioning)finishRepositioning();else mode('pan');return;}if(compactDevice)confirmCustomization(startRepositioning);else mode('rotate');};$('fit').onclick=fitView;
function zoom(factor,x=w/2,y=h/2){const old=state.zoom;state.zoom=Math.min(maximumZoom(scale),Math.max(.25,old*factor));const r=state.zoom/old;state.panX=(state.panX-(x-w/2))*r+(x-w/2);state.panY=(state.panY-(y-h/2))*r+(y-h/2);draw();}
$('zoom-in').onclick=()=>zoom(1.25);$('zoom-out').onclick=()=>zoom(.8);canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
let dragging=null;const pointers=new Map();let pinchDistance=0,grabbed=null;
// Two fingers turn the map as well as zoom it. The lit sets keep the turn the gesture started
// from until the fingers lift, when the turn snaps to one of the twelve stops.
let pinch=null,litRotationHold=null,snapAnimation=0;
function rotateAbout(delta,mx,my){const cx=mx-w/2,cy=my-h/2,a=delta*Math.PI/180,c=Math.cos(a),s=Math.sin(a),vx=cx-state.panX,vy=cy-state.panY;state.panX=cx-(c*vx-s*vy);state.panY=cy-(s*vx+c*vy);state.gridRotation=((state.gridRotation+delta+180)%360+360)%360-180;}
function settleRotation(target){
 state.gridRotation=((target+180)%360+360)%360-180;$('gridRotation').value=state.gridRotation;$('gridRotation').dispatchEvent(new Event('input',{bubbles:true}));litRotationHold=null;draw();
}
function snapRotation(){
 cancelAnimationFrame(snapAnimation);const from=state.gridRotation,target=Math.round(from/30)*30,turn=((target-from+540)%360)-180;
 if(Math.abs(turn)<1e-6){settleRotation(target);return;}
 const start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:220;let done=0;
 const step=now=>{const t=duration?Math.min(1,(now-start)/duration):1,e=1-(1-t)**3,d=turn*e-done;done+=d;rotateAbout(d,w/2,h/2);if(t<1){draw();snapAnimation=requestAnimationFrame(step);}else{snapAnimation=0;settleRotation(target);}};
 snapAnimation=requestAnimationFrame(step);
}
function cursorSphere(e){
 const rect=canvas.getBoundingClientRect(),unit=scale*state.zoom;
 const p=rotateScreen([(e.clientX-rect.left-w/2-state.panX)/unit,(e.clientY-rect.top-h/2-state.panY)/unit],-state.gridRotation*Math.PI/180);
 const xy=[p[0],-p[1]];
 if(arrangement.outline&&!pointInLoops(xy,arrangement.outline))return null;
 if(arrangement.clip){const fy=xy[1],fx=xy[0]-Math.sqrt(3)*fy;if(fy<0||fy>Math.sqrt(3)||fx< -1||fx>5)return null;}
 // In a repeated net each displayed hexagon has its own orientation; on the
 // endless band the copy under the cursor is a translated piece.
 const candidates=tiling?visibleTiles(tiling,{left:xy[0],right:xy[0],bottom:xy[1],top:xy[1]}):net;
 for(const t of candidates){const sample=sphereAt(xy,t,tiles[t.id],state.bias,+$('interpolation').value);if(sample)return sample;}
 return null;
}
function updateCoordinateReadout(){
 if(!coordinatePointer||!ready||exporting||!arrangement||isAboutPath(location.pathname)){coordinateReadout.hidden=true;return;}
 const rect=canvas.getBoundingClientRect(),x=coordinatePointer.clientX-rect.left,y=coordinatePointer.clientY-rect.top;
 const sample=x>=0&&x<=w&&y>=0&&y<=h?cursorSphere(coordinatePointer):null;
 if(!sample){coordinateReadout.hidden=true;return;}
 const p=geographicPoint(state,sample),latitude=Math.asin(Math.max(-1,Math.min(1,p[2])))*180/Math.PI,longitude=Math.atan2(p[1],p[0])*180/Math.PI;
 const decimal=value=>(Math.abs(value)<.00005?0:value).toFixed(4);
 coordinateReadout.textContent=`Lat ${decimal(latitude)}° · Lon ${decimal(longitude)}°`;
 coordinateReadout.hidden=false;
}
function hideCoordinateReadout(){clearTimeout(coordinateHideTimer);coordinateHideTimer=null;coordinatePointer=null;coordinateReadout.hidden=true;}
$('stage').addEventListener('pointermove',event=>{
 if(event.pointerType==='touch'){hideCoordinateReadout();return;}
 if(coordinatePointer?.clientX===event.clientX&&coordinatePointer?.clientY===event.clientY)return;
 coordinatePointer={clientX:event.clientX,clientY:event.clientY};updateCoordinateReadout();
 clearTimeout(coordinateHideTimer);coordinateHideTimer=setTimeout(hideCoordinateReadout,3000);
});
$('stage').addEventListener('pointerleave',hideCoordinateReadout);
$('stage').addEventListener('pointercancel',hideCoordinateReadout);
window.addEventListener('blur',hideCoordinateReadout);
canvas.onpointerdown=e=>{cancelPanSpring();
 canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);dragging={x:e.clientX,y:e.clientY};
 const sample=state.mode==='rotate'?cursorSphere(e):null;
 if(pointers.size===1&&state.mode==='rotate'&&!sample)mode('pan');
 grabbed=sample?geographicPoint(state,sample):null;
 if(pointers.size===2){grabbed=null;const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);cancelAnimationFrame(snapAnimation);snapAnimation=0;pinch={angle:Math.atan2(p[1][1]-p[0][1],p[1][0]-p[0][0])};if(litRotationHold===null)litRotationHold=state.gridRotation;}
};
canvas.onpointermove=e=>{
 if(!pointers.has(e.pointerId)||!dragging)return;
 pointers.set(e.pointerId,[e.clientX,e.clientY]);
 if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),r=canvas.getBoundingClientRect(),mx=(p[0][0]+p[1][0])/2-r.left,my=(p[0][1]+p[1][1])/2-r.top;if(pinchDistance)zoom(d/pinchDistance,mx,my);pinchDistance=d;
  if(pinch){const angle=Math.atan2(p[1][1]-p[0][1],p[1][0]-p[0][0]);let delta=(angle-pinch.angle)*180/Math.PI;delta=((delta+540)%360)-180;pinch.angle=angle;if(delta)rotateAbout(delta,mx,my);draw();}
  dragging={x:e.clientX,y:e.clientY};return;}
 const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;dragging={x:e.clientX,y:e.clientY};
 if(state.mode==='rotate'){
  const sample=cursorSphere(e);if(!sample)return;
  if(!grabbed){grabbed=geographicPoint(state,sample);return;}
  leaveSearch();setRotation(followPoint(state,sample,grabbed));
 }else{grabbed=null;state.panX+=dx;state.panY+=dy;draw();}
};
function end(e){draw();pointers.delete(e.pointerId);pinchDistance=0;grabbed=null;if(pinch&&pointers.size<2){pinch=null;snapRotation();}dragging=pointers.size?{x:[...pointers.values()][0][0],y:[...pointers.values()][0][1]}:null;if(!pointers.size)keepMapInView();}
canvas.onpointerup=end;canvas.onpointercancel=end;
// The map can never be dragged fully out of view: when a drag ends with less
// than a sliver of it on screen, the camera springs back with a small overshoot.
let panSpring=0;
function cancelPanSpring(){cancelAnimationFrame(panSpring);panSpring=0;}
function keepMapInView(){
 if(exporting||!ready||tiling||mobileRepositioning)return;
 const b=bounds(),unit=scale*state.zoom;
 const left=w/2+b[0]*unit+state.panX,right=w/2+b[2]*unit+state.panX,top=h/2-b[3]*unit+state.panY,bottom=h/2-b[1]*unit+state.panY;
 const sliverX=Math.min(120,(right-left)*.3),sliverY=Math.min(120,(bottom-top)*.3);
 let dx=0,dy=0;
 if(right<sliverX)dx=sliverX-right;else if(left>w-sliverX)dx=w-sliverX-left;
 if(bottom<sliverY)dy=sliverY-bottom;else if(top>h-sliverY)dy=h-sliverY-top;
 if(!dx&&!dy)return;
 cancelPanSpring();
 const from={x:state.panX,y:state.panY},start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:520;
 const step=now=>{const t=duration?Math.min(1,(now-start)/duration):1,e=1+2.7*Math.pow(t-1,3)+1.7*Math.pow(t-1,2);
  state.panX=from.x+dx*e;state.panY=from.y+dy*e;draw();panSpring=t<1?requestAnimationFrame(step):0;};
 panSpring=requestAnimationFrame(step);
}

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
 updateMapUrl();clearTimeout(saveTimer);resetDance();exporting=true;button.disabled=true;main.inert=true;dialog.showModal();progress.textContent='Preparing…';
 try{
  const deadline=performance.now()+120000;
  if(!activeDefault()&&relief&&$('relief-enabled').checked)await relief.load(false,control.signal);
  if(!activeDefault()&&$('relief-enabled').checked&&relief?.ready)cachedLighting();
  while($('map-loading').textContent==='Loading map…'||($('relief-enabled').checked&&relief?.loading)||$('indicatrix-status').textContent==='Preparing circles…'){control.signal.throwIfAborted();if(performance.now()>deadline)throw Error('Map assets are still loading; please retry when they finish');await new Promise(resolve=>setTimeout(resolve,100));}
 if(!tiling){const b=bounds(),unit=scale*state.zoom,pad=($('relief-enabled').checked&&(activeDefault()?.lighting||relief?.ready)?ReliefRenderer.prototype.padding(appliedLighting(),unit):0)+12;crop.x=saved.w/2+saved.panX+b[0]*unit-pad;crop.y=saved.h/2+saved.panY-b[3]*unit-pad;crop.topInset=pad;crop.width=(b[2]-b[0])*unit+2*pad;crop.height=(b[3]-b[1])*unit+2*pad;}
  if(!isPDF){const right=Math.min(saved.w,crop.x+crop.width),bottom=Math.min(saved.h,crop.y+crop.height);crop.x=Math.max(0,crop.x);crop.y=Math.max(0,crop.y);crop.width=right-crop.x;crop.height=bottom-crop.y;if(crop.width<=0||crop.height<=0)Object.assign(crop,{x:0,y:0,width:saved.w,height:saved.h});}
  const renderTile=async(x,y,width,height,ratio=factor)=>{
   control.signal.throwIfAborted();
   // Overlap tiles enough to include antialiasing and the relief shadow blur.
   const bleed=4;
   const maxDimension=graphicsLimit;
   if(Math.max(width,height)+2*bleed>maxDimension)throw Error('Shadow softness at this zoom exceeds the device tile limit; reduce zoom or softness and retry');
   w=(width+2*bleed)/ratio;h=(height+2*bleed)/ratio;dpr=ratio;
   state.panX=saved.w/2+saved.panX-crop.x-(x-bleed)/ratio-w/2;state.panY=saved.h/2+saved.panY-crop.y-(y-bleed)/ratio-h/2;
   canvas.width=width+2*bleed;canvas.height=height+2*bleed;overlay.width=canvas.width;overlay.height=canvas.height;
   if(gl.drawingBufferWidth!==canvas.width||gl.drawingBufferHeight!==canvas.height)throw Error('This device could not allocate an export tile');
   render(true,true);
   // Exports must wait for the requested detail, not capture a loading tile.
   while(canvas.dataset.surface==='precomputed'&&(surfaceCache?.pending.size||(activeDefault()&&(defaultLayers?.pending.size||defaultLayers?.detail.pending.size)))){
    control.signal.throwIfAborted();if(performance.now()>deadline)throw Error('Map tiles are still loading; please retry');
    await new Promise(resolve=>setTimeout(resolve,30));render(true,true);
   }
   if(canvas.dataset.surface==='precomputed'&&(surfaceCache?.failures.size||(activeDefault()&&(defaultLayers?.failures.size||defaultLayers?.detail.failures.size))))throw Error('Some map tiles could not load; reload and retry the export');
   out.width=width;out.height=height;context.fillStyle=$('background-color').value;context.fillRect(0,0,width,height);
   context.drawImage(canvas,-bleed,-bleed);context.drawImage(overlay,-bleed,-bleed);
   return context.getImageData(0,0,width,height).data;
  };
  const onProgress=value=>progress.textContent=`Rendering ${isPDF?'PDF':'PNG'} ${factor===2?'Medium':'High'} · ${Math.round(value*100)}%`;
  const license=mapLicense(displayedSource);
  const attribution=[`Hexagonal Earth by Alex Van de Sande - ${license.name} (${license.url}). Third-party source credits and terms also apply.`,sourceAttribution(displayedSource),!$('height-credit').hidden?'Height imagery: NASA Earth Observatory / Jesse Allen, using GEBCO data from the British Oceanographic Data Centre. Height composite by Alex Van de Sande. '+'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/':''].filter(Boolean).join(' ');
  const exportOptions={attribution,rasterScale:factor,width:crop.width,height:crop.height,mapInsetTop:crop.topInset||0,renderTile,signal:control.signal,onProgress,background:$('background-color').value};
  const {pngFromTiles,printPDF}=await import('./map-export.mjs?v=lifezones-shadows-3');
  const blob=isPDF?await printPDF({...exportOptions,lifezones:displayedSource==='ecology'?{colorFade:legendFade(),landCount:classCount('land-classes'),oceanCount:classCount('ocean-classes')}:null}):await pngFromTiles({attribution,width:Math.max(1,Math.round(crop.width*factor)),height:Math.max(1,Math.round(crop.height*factor)),renderTile,signal:control.signal,onProgress});
  control.signal.throwIfAborted();
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Hexagonal Earth by Alex Van de Sande - ${shareSelection.layout.name} - ${shareSelection.style.name}.${isPDF?'pdf':'png'}`;a.click();trackEvent('download',factor+'x-'+(isPDF?'pdf':'png'));setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(error){if(error.name!=='AbortError'){console.warn('Map export:',error);$('relief-status').textContent='Export failed: '+error.message;}}
 finally{w=saved.w;h=saved.h;dpr=saved.dpr;state.panX=saved.panX;state.panY=saved.panY;out.width=out.height=1;relief?.releaseDetail();exporting=false;main.inert=false;dialog.close();button.disabled=false;meshSignature=null;resize();}
}
$('export').onclick=exportMap;
function initializeMapTexture(){
 if(!gl)return;initializeProgram(!!activeDefault());if(!program)return;
 // The selected source loads below; an unrelated continent image must not block it.
 texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);
 for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.LINEAR);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
 ready=true;updateOptimizerUI();if($('optimize').checked)applySearch();updateRiverLayer();updateMapSource();draw();
}
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
  for(const id of ['lon','lat','roll','bias','height','gridRotation','grid','line','clearance','distortionOpacity','riverWidth','riverLevels','subgridWidth','puzzleWidth','graticuleWidth','shadowOpacity','lightOpacity',...reliefRanges.map(s=>s[0])]){
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
  if(v&&['scale','zoom','panX','panY'].every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]))&&v.scale>0&&v.zoom>=.25&&v.zoom<=maximumZoom(v.scale))restoredView=v;
 }catch{/* Missing or damaged map links fall back to defaults. */}
}
function captureSettings(){
 const controls={};document.querySelectorAll('aside input[type=checkbox],aside select,aside input[type=range],aside input[type=color]').forEach(el=>{if(['map-source-choice','lighting-resolution-test'].includes(el.id))return;controls[el.id]=el.type==='checkbox'?el.checked:['land-classes','ocean-classes'].includes(el.id)?classCount(el.id):el.value;});
 const applied=$('lighting-preset').value==='custom'?customApplied:null;if(applied){controls['relief-treatment']=applied.treatment;controls['relief-tone']=applied.tone;}
 return {version:1,state:{...state,...applied},controls,view:{scale,zoom:state.zoom,panX:state.panX,panY:state.panY},details:Object.fromEntries([...document.querySelectorAll('aside > details')].map(el=>[el.id,el.open]))};
}
function readMapStateFromUrl(){const m=location.hash.match(/^#([mp])=([^&]*)/);if(!m)return null;try{return decodeMapState(m[2]);}catch{return null;}}
function updateMapUrl(){if(!persistenceReady||exporting||isAboutPath(location.pathname))return;clearTimeout(saveTimer);try{const url=new URL(location.href);if(!location.pathname.startsWith('/tests/'))url.pathname=historyOn?historyPath(currentPeriod().id,historyFocus):shareSelection.path;const preset=presetSettings(shareSelection),defaults={state:{...urlDefaults.state,...preset.state},controls:{...urlDefaults.controls,...preset.controls},details:urlDefaults.details,view:defaultView};const encoded=encodeMapState(captureSettings(),defaults);url.hash=historyOn?`m=${encoded}&s=${shareSelection.path.slice(1,-1)}`:encoded?'m='+encoded:'';url.searchParams.delete('history');history.replaceState(null,'',url);}catch{}}
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
 if(activeDefault()||!gl||!riverTexture)return;
 if(!$('rivers-visible').checked)return;
 const riverKey=state.riverLevels+'/'+(offlineBake?state.riverWidth:'field');if(riverKey===uploadedRiverKey||riverKey===requestedRiverKey){return;}requestedRiverKey=riverKey;const request=++riverRequest;
 try{const source=offlineBake?await riverMask(state.riverLevels,state.riverWidth):await riverTextureData(state.riverLevels,gl.getParameter(gl.MAX_TEXTURE_SIZE));if(request!==riverRequest)return;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,riverTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,offlineBake?gl.LINEAR:gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,offlineBake?gl.LINEAR:gl.NEAREST);if(offlineBake){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);riverFieldSize=null;}else{gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE_ALPHA,source.width,source.height,0,gl.LUMINANCE_ALPHA,gl.UNSIGNED_BYTE,source.data);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);riverFieldSize=[source.width,source.height];releaseRiverMask();}gl.activeTexture(gl.TEXTURE0);riverGeneration++;uploadedRiverKey=riverKey;draw();}
 catch(error){if(error.name==='AbortError'||request!==riverRequest)return;console.warn('River layer:',error);$('status').textContent='River data could not load; the map remains available.';}finally{if(requestedRiverKey===riverKey)requestedRiverKey=null;}
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
 const type=$('map-source').value;$('floating-legend').hidden=type!=='ecology';$('floating-legend-tip').hidden=true;$('ecology-controls').hidden=type!=='ecology';syncSourceChoice();
 if(type==='ecology'){const landCount=classCount('land-classes'),oceanCount=classCount('ocean-classes');syncClassControl('land-classes',landCount);syncClassControl('ocean-classes',oceanCount);renderLifezonesLegend($('floating-legend').querySelector('.floating-legend-clusters'),landCount,oceanCount);hexLegend('land-legend',landLegends[landCount]);hexLegend('ocean-legend',oceanLegend(oceanCount));hexLegend('missing-legend',[missing]);}
 updateLegendFade();
 const credits={terrain:'Supplied shaded topographic map · baked-in terrain and seafloor relief; lighting is fixed.',ivory:'Generated sculpted-paper finish from the supplied heightfield.',elevation:'Generated earth-and-sea finish from the supplied heightfield.',continents:'Supplied silhouette. Cut-search mask is shared across all layers.',marble:'Supplied Blue Marble · brighter oceans and visible seafloor detail.',countries:'Natural Earth · 1:50m · de facto country boundaries.',ecology:'Leemans / UNEP-WCMC Holdridge (1992); NOAA OISST 1991–2020; Copernicus WAVERYS 2015–2024. HydroRIVERS v1 river network. Hover swatches for class definitions.'};
 const license=mapLicense(type),licenseLink=$('map-license-link');licenseLink.textContent=license.name;licenseLink.href=license.url;
 const reference=referenceSources[type],credit=$('map-credit');
 credit.textContent=credits[type]||'';
 if(reference){
  const sourceLink=document.createElement('a'),licenseLink=document.createElement('a');
  sourceLink.href=reference.url;sourceLink.textContent=reference.author+' · Wikimedia Commons';
  licenseLink.href=reference.licenseURL;licenseLink.textContent=reference.license;
  for(const link of [sourceLink,licenseLink]){link.target='_blank';link.rel='noopener';}
  credit.replaceChildren(sourceLink,' · ',licenseLink,'. '+reference.changes+(reference.note?' '+reference.note:''));
 }
 $('relief-source-note').hidden=!$('relief-enabled').checked||!['terrain','marble'].includes(type);
}
async function updateMapSource(){
 if(ready)initializeProgram(!!activeDefault());
 updateRelief();
 updateMapUI();scheduleSave();if(!ready)return;
 const request=++mapRequest,type=$('map-source').value;
 const imageEntry=activeDefault();if(imageEntry){displayedSource=type;$('map-loading').textContent='';$('source-name').textContent=styleOptions.find(s=>s.source===type)?.name||type;$('source-detail').textContent='';draw();return;}
 const baked=surfacePreset(state,type,classCount('land-classes'),classCount('ocean-classes'),+$('interpolation').value,hexBridgesEnabled);
 if(baked&&!new URLSearchParams(location.search).has('palette-lab')&&!$('puzzlegrid').checked&&!new URLSearchParams(location.search).has('bake-surfaces')&&new URLSearchParams(location.search).get('surface')!=='live'){displayedSource=type;$('map-loading').textContent='';$('source-name').textContent=styleOptions.find(s=>s.source===type)?.name||type;$('source-detail').textContent='';draw();return;}
 $('map-loading').textContent='Loading map…';
 try{let source=await mapSource(type,classCount('land-classes'),classCount('ocean-classes'));if(request!==mapRequest)return;
  const originalWidth=source.width,originalHeight=source.height,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if(source.width>max){const resized=document.createElement('canvas');resized.width=max;resized.height=Math.round(source.height*max/source.width);const c=resized.getContext('2d');c.imageSmoothingEnabled=!['ecology','continents','countries'].includes(type);c.drawImage(source,0,0,resized.width,resized.height);source=resized;}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);const filter=['ecology','continents','countries'].includes(type)?gl.NEAREST:gl.LINEAR;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
  liveSourceKey=sourceKey(type);displayedSource=type;$('map-loading').textContent='';$('source-name').textContent=referenceSources[type]?.name||{continents:'continents.png',marble:'Blue Marble · bluemarble-high.jpg',countries:'Natural Earth · 1:50m · de facto country boundaries.',terrain:'Shaded topographic map',ivory:'Ivory · sculpted paper',elevation:'Elevation · earth & sea',ecology:'Holdridge + marine zones'}[type];$('source-detail').textContent=type==='ecology'?'0.5° land · 1° ocean temperature · 0.8° wave exposure':['ivory','elevation'].includes(type)?'Derived from supplied heightfield':`${originalWidth.toLocaleString()} × ${originalHeight.toLocaleString()} · equirectangular`;
  draw();
 }catch(error){if(request!==mapRequest)return;$('map-source').value=displayedSource;updateMapUI();updateRelief();$('map-loading').textContent='Map could not load. Previous layer retained; select again to retry.';scheduleSave();}
}
for(const id of ['background-color','border-color','hex-grid-color','puzzle-color','graticule-color','river-color'])$(id).addEventListener('input',draw);
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
  // Presets must resolve omitted fields just as a fresh URL does, rather than
  // inheriting values from whichever preset happened to be selected before.
  const options=type==='layout'?layoutOptions:styleOptions;
  const complete=group=>Object.fromEntries([...new Set(options.flatMap(item=>Object.keys(item[group])))].map(key=>[key,option[group][key]??urlDefaults[group][key]]));
  option={...option,state:complete('state'),controls:complete('controls')};
  shareSelection=type==='layout'?sharePair(shareSelection.style.id,option.arrangement):sharePair(option.id,state.arrangement);
  trackEvent(type==='layout'?'format':'style',type==='layout'?shareSelection.layout.arrangement:option.id);
  if(type==='layout'){
    for(const id of ['method','arrangement','lon','lat','roll','bias','height','clearance','gridRotation'])if(option.state[id]!==undefined){if(['method','arrangement'].includes(id))state[id]=option.state[id];else setOptionRange(id,option.state[id]);}
    for(const id of ['interpolation','optimize','backdrop-grid'])if(option.controls[id]!==undefined)setOptionControl(id,option.controls[id]);
    state.layout=0;document.querySelectorAll('.method').forEach(el=>el.classList.toggle('active',el.dataset.method===state.method));
    rebuild();resize();if(option.viewOffset&&!compactDevice){state.panX=option.viewOffset[0]*scale;state.panY=option.viewOffset[1]*scale;draw();}defaultView={scale,zoom:state.zoom,panX:state.panX,panY:state.panY};updateRelief();
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
  for(const option of styleOptions){const card=document.createElement('button');card.type='button';card.className='style-preset-card';card.title='Use '+option.name+' style';card.dataset.source=option.source;card.dataset.style=option.id;card.setAttribute('aria-label',option.name);const thumb=document.createElement('img');thumb.className='style-thumb';thumb.loading='lazy';thumb.decoding='async';thumb.sizes='86px';const thumbVersion=option.id==='lifezones'?'?v=lifezones-thumb-shadows-4':'';thumb.srcset=assetURL(option.thumbnail.replace('.png','-240.webp')+thumbVersion)+' 240w, '+assetURL(option.thumbnail.replace('.png','-480.webp')+thumbVersion)+' 480w';thumb.src=assetURL(option.thumbnail.replace('.png','-240.webp')+thumbVersion);thumb.alt='';thumb.width=240;thumb.height=136;const label=document.createElement('b');label.textContent=option.name;card.append(thumb,label);card.onclick=()=>applyMapOption(option,'style');styleBox.append(card);}
  intro.after(layoutHeading,layoutBox,styleHeading,styleBox);
  document.querySelectorAll('aside details').forEach(el=>{el.open=false;});
}
installColumnOptions();

urlDefaults=captureSettings();
restoreSettings(presetSettings(shareSelection));
// A story URL keeps the preset camera: the timeline frames the story once its period loads.
if(!initialTour)restoreSettings(readMapStateFromUrl());
// A tall screen starts Spaceship Earth a quarter turn round, so the net stands upright.
if(!readMapStateFromUrl()&&state.arrangement==='dymaxion'&&matchMedia('(orientation: portrait)').matches){state.gridRotation=((state.gridRotation+90+180)%360+360)%360-180;$('gridRotation').value=state.gridRotation;$('gridRotation-value').value=state.gridRotation+'°';}
initAnalytics(initialTour?.path||shareSelection.path);setSidebarExpanded(state.sidebarExpanded,false);rebuild(false);initializeMapTexture();
if(historyPeriodId)enableHistory(true);
// Rotation dial beside Fit: dragging around it turns the whole map in 30° steps
// (the dot shows the current turn); arrow keys step it too. It drives the grid
// rotation range so the map turns about the viewport centre like the slider.
if($('rotate-dial')){
 const dial=$('rotate-dial'),input=$('gridRotation');
 const show=()=>dial.style.setProperty('--dial',`${state.gridRotation}deg`);
 const set=degrees=>{let v=Math.round(degrees/30)*30;v=((v+180)%360+360)%360-180;if(v===state.gridRotation)return;input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));show();};
 const angleAt=e=>{const r=dial.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;};
 let grab=null;
 dial.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dial.setPointerCapture(e.pointerId);grab={id:e.pointerId,start:angleAt(e),base:state.gridRotation};});
 dial.addEventListener('pointermove',e=>{if(!grab||e.pointerId!==grab.id)return;let d=angleAt(e)-grab.start;d=((d+540)%360)-180;set(grab.base+d);});
 for(const type of ['pointerup','pointercancel'])dial.addEventListener(type,e=>{if(grab&&e.pointerId===grab.id)grab=null;});
 dial.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();set(state.gridRotation+30);}else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();set(state.gridRotation-30);}});
 input.addEventListener('input',show);show();
}
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
 document.querySelectorAll('.style-thumb').forEach(image=>{image.sizes=expanded?'(max-width: 700px) calc((100vw - 72px) / 2), (max-width: 1000px) and (max-height: 500px) calc((100vw - 72px) / 2), 140px':'86px';});
 if(focus){$(expanded?'collapse-customize':'customize').focus();draw();}
}
$('customize').onclick=()=>setSidebarExpanded(true);
$('collapse-customize').onclick=()=>setSidebarExpanded(false);
const customizationWarning=$('mobile-customization-warning');
const warningPreferenceKey='hexagonal-earth:skip-customization-warning';
let skipCustomizationWarning=false,pendingCustomization=null;
try{skipCustomizationWarning=localStorage.getItem(warningPreferenceKey)==='true';}catch{}
function confirmCustomization(action){
 if(!compactDevice||skipCustomizationWarning){action();return;}
 pendingCustomization=action;$('customization-dont-alert').checked=false;customizationWarning.showModal();
}
function rememberWarningPreference(){
 if(!$('customization-dont-alert').checked)return;
 skipCustomizationWarning=true;
 try{localStorage.setItem(warningPreferenceKey,'true');}catch{}
}
function startRepositioning(){
 mobileRepositioning=true;document.body.classList.add('repositioning');
 setSidebarExpanded(false,false);mode('rotate');fitView();$('rotate').focus();
}
function finishRepositioning(){
 mobileRepositioning=false;document.body.classList.remove('repositioning');mode('pan');
 setSidebarExpanded(true,false);$('rotate').focus();draw();
}
$('reposition-done').onclick=finishRepositioning;
document.querySelectorAll('aside details > summary').forEach(summary=>summary.addEventListener('click',event=>{
 if(summary.parentElement.open||!compactDevice||skipCustomizationWarning)return;
 event.preventDefault();confirmCustomization(()=>{summary.parentElement.open=true;summary.focus();});
}));
$('customization-continue').onclick=()=>{
 rememberWarningPreference();const action=pendingCustomization;pendingCustomization=null;customizationWarning.close();action?.();
};
$('customization-defaults').onclick=()=>{
 rememberWarningPreference();pendingCustomization=null;customizationWarning.close();
 document.querySelectorAll('aside details').forEach(panel=>{panel.open=false;});
 mobileRepositioning=false;document.body.classList.remove('repositioning');mode('pan');setSidebarExpanded(false);
 const {layout,style}=shareSelection;applyMapOption(layout,'layout');applyMapOption(style,'style');fitView();
};
customizationWarning.addEventListener('cancel',()=>{pendingCustomization=null;});
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

if(['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).has('bake-surfaces')){
 window.bakeSurface=async function(layoutIndex,sourceType,region,resolution){
  exporting=true;const layout=layoutOptions[layoutIndex];Object.assign(state,layout.state);state.gridRotation=0;state.zoom=2;
  $('interpolation').value='0';rebuild(false);
  const source=await mapSource(sourceType,10,6);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  const categorical=['ecology','countries','continents'].includes(sourceType);
  for(const parameter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,parameter,categorical?gl.NEAREST:gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);displayedSource=sourceType;
  const verts=[];for(const p of tiles[region].patches)for(let i=0;i<3;i++)verts.push(p.xy[i][0],-p.xy[i][1],...(p.weights?p.weights[i]:[0,1,2].map(j=>j===i?1:0)),...p.v.flat(),1,...p.xy[i],region);
  canvas.width=resolution;canvas.height=resolution;gl.viewport(0,0,resolution,resolution);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
  gl.uniform1i(uniforms.bakedOn,0);gl.uniform1i(uniforms.bakeOnly,1);gl.uniform1i(uniforms.felvClip,0);gl.uniform1i(uniforms.map,0);
  gl.uniform1f(uniforms.gridRotation,0);gl.uniform2f(uniforms.size,resolution,resolution);gl.uniform3f(uniforms.view,resolution/2,0,0);
  gl.uniform3f(uniforms.angles,state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);gl.uniform1f(uniforms.bias,state.bias);gl.uniform1f(uniforms.blend,0);
  bindMaterialUniforms();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);count=verts.length/18;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);drawGeometry(program);gl.finish();
  const error=gl.getError();if(error)throw Error('Bake GL error '+error);
  return canvas.toDataURL('image/png').split(',')[1];
 };
}

syncSettingsVisibility();
initAboutWidget();

// Opt-in temporary editor; normal routes never load its UI or custom palette.
if(new URLSearchParams(location.search).has('palette-lab')){
 import('./palette-experiment.mjs?v=lifezones-shadows-3').then(({mountPaletteExperiment})=>{
  const originalURL=new URL(location.href);originalURL.searchParams.delete('palette-lab');
  $('map-source').value='ecology';$('land-classes').value='2';$('ocean-classes').value='1';
  $('rivers-visible').checked=true;
  mountPaletteExperiment({apply:updateMapSource,shadows:()=>$('relief-enabled').checked,
   setShadows:enabled=>{$('relief-enabled').checked=enabled;updateRelief();},
   exit:()=>location.assign(originalURL.href)});
 });
}

// Offline asset preparation only; never reachable on the public host.
if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).has('bake-layers')){
 window.prepareDefaultLayers=async(layoutIndex,styleIndex)=>{
  exporting=true;offlineLightingPlan=null;restoreSettings(urlDefaults);restoreSettings(presetSettings({layout:layoutOptions[layoutIndex],style:styleOptions[styleIndex]}));
  rebuild(false);initializeProgram(false);const type=$('map-source').value;
  const source=await mapSource(type,classCount('land-classes'),classCount('ocean-classes'));
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,['ecology','countries','continents'].includes(type)?gl.NEAREST:gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);displayedSource=type;liveSourceKey=sourceKey(type);
  if($('relief-enabled').checked||['ivory','elevation'].includes(type)){ensureRelief();await relief.load();}
  await updateRiverLayer();
  return {regions:tiles.length,lighting:$('relief-enabled').checked,signature:captureSettings(),repeat:!!tiling};
 };
 window.bakeDefaultRegion=(region,resolution,graticule=false)=>{
  const saved={zoom:state.zoom,gridRotation:state.gridRotation};state.zoom=2;state.gridRotation=0;
  const verts=[];for(const p of tiles[region].patches)for(let i=0;i<3;i++)verts.push(p.xy[i][0],-p.xy[i][1],...(p.weights?p.weights[i]:[0,1,2].map(j=>j===i?1:0)),...p.v.flat(),1,...p.xy[i],region);
  canvas.width=resolution;canvas.height=resolution;gl.viewport(0,0,resolution,resolution);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
  gl.uniform1i(uniforms.bakedOn,0);gl.uniform1i(uniforms.bakeOnly,0);gl.uniform1i(uniforms.overlayOnly,0);gl.uniform1i(uniforms.felvClip,0);gl.uniform1i(uniforms.map,0);
  gl.uniform1f(uniforms.gridRotation,0);gl.uniform2f(uniforms.size,resolution,resolution);gl.uniform3f(uniforms.view,resolution/2,0,0);
  gl.uniform3f(uniforms.angles,state.lon*Math.PI/180,state.lat*Math.PI/180,state.roll*Math.PI/180);gl.uniform1f(uniforms.bias,state.bias);gl.uniform1f(uniforms.blend,0);
  gl.uniform1i(uniforms.palette,displayedSource==='continents'?['atlas','original','night'].indexOf($('palette').value):1);gl.uniform1f(uniforms.grid,0);gl.uniform1i(uniforms.distortion,$('distortion').checked?3:0);gl.uniform1f(uniforms.distortionOpacity,state.distortionOpacity);gl.uniform1f(uniforms.pixelScale,resolution/2);
  bindMaterialUniforms();bindRiverUniforms();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  count=verts.length/18;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);drawGeometry(program);gl.finish();
  Object.assign(state,saved);meshSignature=null;
  return canvas.toDataURL('image/png').split(',')[1];
 };
 window.preparePacificLighting=async()=>{
  await window.prepareDefaultLayers(0,0);
  net=pacificTourNet(tiles,net);meshSignature=null;
  projectedLighting?.dispose();projectedLighting=null;
  const points=net.filter(t=>t.id===0||t.id===2).flatMap(t=>hex.map(p=>rotateScreen(canvasWorld(p,t))));
  const density=2048,left=Math.floor(Math.min(...points.map(p=>p[0]))*density)/density,top=Math.floor(Math.min(...points.map(p=>p[1]))*density)/density;
  const width=Math.ceil((Math.max(...points.map(p=>p[0]))-left)*density),height=Math.ceil((Math.max(...points.map(p=>p[1]))-top)*density);
  return {net,rect:[left,top,width/density,height/density],width,height,density,angle:state.gridRotation*Math.PI/180,background:$('background-color').value,lighting:appliedLighting(),regions:[0,2]};
 };
 // Lit region for the dancing pieces: the piece stands at rotation 0 in its own frame and the light
 // is turned instead, so set k matches a piece standing on screen turned by 30° × k (the
 // map turn minus 60° per piece rotation). Windows of `size` pixels tile the 4096-pixel region.
 window.bakeLitRegion=(region,k,x,y,size=1024,resolution=4096)=>{
  const saved={net,gridRotation:state.gridRotation,preset:$('lighting-preset').value,custom:customApplied,w,h,scale,zoom:state.zoom,panX:state.panX,panY:state.panY,dpr};
  const look=appliedLighting();
  const controls=lightingControls(),savedArrangement=arrangement;
  // One piece at the origin, unturned, with no net seams (they belong to the full net's positions).
  net=[{...saved.net.find(t=>t.id===region),r:0,x:0,y:0}];arrangement={...arrangement,seams:[]};meshSignature=null;state.gridRotation=0;
  // The piece will be shown turned clockwise by 30° × k, which carries a fixed light with it;
  // turning the light the other way in the piece's frame keeps it fixed to the browser.
  customApplied={...look,gridRotation:0,treatment:controls.treatment,tone:controls.tone,reliefAzimuth:look.reliefAzimuth-30*k};$('lighting-preset').value='custom';
  lightingReadyKey=lightingRefineKey=null;
  const density=resolution/2,plan={level:4,density,rect:[-1+x/density,-1+y/density,Math.min(size,resolution-x)/density,Math.min(size,resolution-y)/density],repeat:false};
  const light=window.bakeDefaultLighting(plan);
  net=saved.net;arrangement=savedArrangement;meshSignature=null;state.gridRotation=saved.gridRotation;customApplied=saved.custom;$('lighting-preset').value=saved.preset;
  w=saved.w;h=saved.h;scale=saved.scale;state.zoom=saved.zoom;state.panX=saved.panX;state.panY=saved.panY;dpr=saved.dpr;offlineLightingPlan=null;lightingReadyKey=lightingRefineKey=null;
  return light.images;
 };
 window.bakeDefaultLighting=(plan=null)=>{
  offlineLightingPlan=plan;
  w=1100;h=800;scale=100;state.zoom=1;dpr=1;state.panX=state.panY=0;meshSignature=null;
  const entry=cachedLighting();
  const output=[];const fbo=gl.createFramebuffer();
  for(const texture of entry.textures){
   gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
   const density=plan?.density||2200/Math.max(entry.rect[2],entry.rect[3]);
   const width=Math.round(entry.rect[2]*density),height=Math.round(entry.rect[3]*density);
   const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   const out=document.createElement('canvas');out.width=width;out.height=height;const c=out.getContext('2d'),data=c.createImageData(width,height);
   for(let y=0;y<height;y++)data.data.set(pixels.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);
   c.putImageData(data,0,0);output.push(out.toDataURL('image/png').split(',')[1]);out.width=out.height=1;
  }
  gl.deleteFramebuffer(fbo);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {rect:entry.rect,repeat:entry.repeat,angle:entry.angle,images:output};
 };
}

function updateLoadingStatus(){
 const test=$('lighting-resolution-test'),note=$('lighting-resolution-note'),info=renderDefault?.lighting,comparison=defaultLayers?.comparison;
 test.disabled=!!renderMerged||!info?.mapResolution;
 const loading=Number(canvas.dataset.surfacePending)>0||defaultLayers?.pending.size||defaultLayers?.detail.pending.size;
 const failed=defaultLayers?.failures.size||defaultLayers?.detail.failures.size;
 note.textContent=renderMerged?'Lighting is included in the map images.':!renderDefault?'Comparison unavailable: this view uses live lighting.':!info?'This style has no additional shadows or highlights to compare.':!info.mapResolution?'Comparison not prepared for this format. Try Spaceship Earth.':failed?'Comparison could not load. Use Retry.':loading?'Loading comparison — wait before judging sharpness.':comparison?.budgetFallback?'Overview shown: comparison exceeds the memory budget.':test.value==='auto'?'Normal rendering adapts detail to the view. Choose Highest detail or Map resolution for a fixed comparison.':comparison?.limited?'Comparison limited by available memory; both options use the same reference limit.':test.value==='high'?'Highest available shadow and highlight detail.':comparison?.capped?'Shadows and highlights reduced to the map’s maximum resolution.':'Lighting is already at or below map resolution; these options are identical here.';
 canvas.dataset.lightingComparison=!info?.mapResolution?'unavailable':loading?'loading':failed?'failed':comparison?.budgetFallback?'overview':comparison?.capped?'capped':'original';
 canvas.dataset.lightingDensity=String(comparison?.density||0);
 canvas.dataset.lightingOriginalDensity=String(comparison?.originalDensity||0);
 canvas.dataset.mapMaximumDensity=String(renderDefault?128*2**renderDefault.maxLevel:0);
 if(renderDefault)$('relief-status').textContent=!renderDefault.lighting?'':defaultLayers.failures.size||defaultLayers.detail.failures.size?'Lighting detail could not load.':defaultLayers.pending.size||defaultLayers.detail.pending.size?'Loading lighting…':'Lighting layers ready';
 const loadFailed=(surfaceCache?.failures.size||0)+(renderDefault?(defaultLayers?.failures.size||0)+(defaultLayers?.detail.failures.size||0):0);
 let notice=$('map-load-notice');if(!notice){notice=document.createElement('div');notice.id='map-load-notice';notice.setAttribute('role','status');notice.innerHTML='<span>Some map detail could not load.</span> <button type="button">Retry</button>';notice.querySelector('button').onclick=()=>{surfaceCache?.retry();defaultLayers?.retry();draw();};$('stage').append(notice);}
 notice.hidden=!loadFailed;canvas.dataset.layerPending=String((surfaceCache?.pending.size||0)+(renderDefault?(defaultLayers?.pending.size||0)+(defaultLayers?.detail.pending.size||0):0));canvas.dataset.layerFailures=String(loadFailed);
}
window.addEventListener('online',()=>{surfaceCache?.retry();defaultLayers?.retry();draw();});
