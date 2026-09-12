import {reliefRanges} from './relief.mjs?v=circular-2';

// The URL payload is positional and URL-safe so a complete map can be shared
// without exposing implementation names in a long query string.
const stateKeys=['method','arrangement','lon','lat','roll','bias','height','gridRotation','grid','line','clearance','distortionOpacity','mode',...reliefRanges.map(s=>s[0]),'riverWidth','riverLevels','sidebarExpanded','subgridWidth','graticuleWidth','shadowOpacity','lightOpacity'];
const controlKeys=['map-source','land-classes','ocean-classes','interpolation','graticule','subgrid','dotgrid','construction','labels','distortion','palette','indicatrix','terrain','quality','optimize','ecology-rivers','relief-enabled','relief-material','relief-treatment','relief-tone','rivers-visible','background-color','border-color','hex-grid-color','graticule-color','fractalgrid','lighting-preset'];

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
 const merged={
  'overlays-panel':['layout-panel','distortion-panel'],
  'positioning-panel':['orientation-panel','projection-method-panel'],
  'effects-panel':['map-source-panel','rivers-panel','relief-panel'],
 };
 for(const panel of panels){
  if(typeof saved[panel.id]==='boolean')panel.open=saved[panel.id];
  else{const previous=(merged[panel.id]||[]).filter(id=>typeof saved[id]==='boolean');if(previous.length)panel.open=previous.some(id=>saved[id]);}
 }
}

const panelKeys=['projection-method-panel','layout-panel','orientation-panel','map-source-panel','rivers-panel','relief-panel','distortion-panel','overlays-panel','positioning-panel','effects-panel'];
const same=(a,b)=>a===b||(typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<1e-9);
export function encodeMapState(saved,defaults){
 if(defaults){
  const diff=(keys,values={},base={})=>keys.flatMap((key,index)=>values[key]!=null&&!same(values[key],base[key])?[index,values[key]]:[]);
  const viewKeys=['scale','zoom','panX','panY'];
  const view=viewKeys.every(key=>same(saved.view?.[key],defaults.view?.[key]))?[]:viewKeys.map(key=>saved.view[key]);
  const compact=[2,diff(stateKeys,saved.state,defaults.state),diff(controlKeys,saved.controls,defaults.controls),view,diff(panelKeys,saved.details,defaults.details)];
  while(compact.length>1&&!compact.at(-1).length)compact.pop();
  if(compact.length===1)return '';
  return btoa(JSON.stringify(compact)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 }
 const compact=[1,stateKeys.map(key=>saved.state[key]??null),controlKeys.map(key=>saved.controls[key]??null),['scale','zoom','panX','panY'].map(key=>saved.view[key]),saved.details];
 return btoa(JSON.stringify(compact)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}

export function decodeMapState(text){
 if(typeof text!=='string'||text.length>16000)throw Error('Invalid map link');
 const base64=text.replaceAll('-','+').replaceAll('_','/'),padded=base64+'='.repeat((4-base64.length%4)%4),data=JSON.parse(atob(padded));
 if(Array.isArray(data)&&data[0]===2){
  if(data.length>5)throw Error('Unsupported map link');
  const expand=(keys,values=[])=>{
   if(!Array.isArray(values)||values.length%2)throw Error('Invalid map changes');
   const result={};for(let i=0;i<values.length;i+=2){const index=values[i];if(!Number.isInteger(index)||index<0||index>=keys.length)throw Error('Invalid map setting');result[keys[index]]=values[i+1];}return result;
  };
  const view=data[3]||[];
  if(!Array.isArray(view)||(view.length!==0&&(view.length!==4||!view.every(Number.isFinite))))throw Error('Invalid map view');
  return {version:1,state:expand(stateKeys,data[1]),controls:expand(controlKeys,data[2]),view:view.length?Object.fromEntries(['scale','zoom','panX','panY'].map((key,index)=>[key,view[index]])):undefined,details:expand(panelKeys,data[4])};
 }
 if(!Array.isArray(data)||data[0]!==1||!Array.isArray(data[1])||!Array.isArray(data[2])||!Array.isArray(data[3])||data[3].length!==4||!data[3].every(Number.isFinite))throw Error('Unsupported map link');
 return {version:1,state:Object.fromEntries(stateKeys.map((key,index)=>[key,data[1][index]])),controls:Object.fromEntries(controlKeys.map((key,index)=>[key,data[2][index]])),view:Object.fromEntries(['scale','zoom','panX','panY'].map((key,index)=>[key,data[3][index]])),details:data[4]&&typeof data[4]==='object'?data[4]:[]};
}
