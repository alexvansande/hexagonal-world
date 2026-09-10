import {reliefRanges} from './relief.mjs';

// The URL payload is positional and URL-safe so a complete map can be shared
// without exposing implementation names in a long query string.
const stateKeys=['method','arrangement','lon','lat','roll','bias','height','gridRotation','grid','line','clearance','distortionOpacity','mode',...reliefRanges.map(s=>s[0]),'riverWidth','riverLevels'];
const controlKeys=['map-source','land-classes','ocean-classes','interpolation','graticule','subgrid','dotgrid','construction','labels','distortion','palette','indicatrix','terrain','quality','optimize','ecology-rivers','relief-enabled','relief-material','relief-treatment','relief-tone','rivers-visible','background-color'];

export const distortionEnabled=value=>value===true||['area','angle','both'].includes(value);

export function restorePanelStates(panels,saved){
 // Old links stored panel positions from the nested sidebar. New links use IDs
 // so future reordering cannot open a different section by accident.
 if(Array.isArray(saved))saved={
  'projection-method-panel':saved[0],'orientation-panel':saved[0],
  'layout-panel':saved[1],'distortion-panel':saved[1],
  'map-source-panel':saved[2],'rivers-panel':saved[4],
  'relief-panel':saved[5]||saved[6],
 };
 if(!saved||typeof saved!=='object')return;
 for(const panel of panels)if(typeof saved[panel.id]==='boolean')panel.open=saved[panel.id];
}

export function encodeMapState(saved){
 const compact=[1,stateKeys.map(key=>saved.state[key]??null),controlKeys.map(key=>saved.controls[key]??null),['scale','zoom','panX','panY'].map(key=>saved.view[key]),saved.details];
 return btoa(JSON.stringify(compact)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}

export function decodeMapState(text){
 if(typeof text!=='string'||text.length>16000)throw Error('Invalid map link');
 const base64=text.replaceAll('-','+').replaceAll('_','/'),padded=base64+'='.repeat((4-base64.length%4)%4),data=JSON.parse(atob(padded));
 if(!Array.isArray(data)||data[0]!==1||!Array.isArray(data[1])||!Array.isArray(data[2])||!Array.isArray(data[3])||data[3].length!==4||!data[3].every(Number.isFinite))throw Error('Unsupported map link');
 return {version:1,state:Object.fromEntries(stateKeys.map((key,index)=>[key,data[1][index]])),controls:Object.fromEntries(controlKeys.map((key,index)=>[key,data[2][index]])),view:Object.fromEntries(['scale','zoom','panX','panY'].map((key,index)=>[key,data[3][index]])),details:data[4]&&typeof data[4]==='object'?data[4]:[]};
}
