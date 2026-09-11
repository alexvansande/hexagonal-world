import {layoutOptions,styleOptions} from './map-options.mjs?v=ivory-rivers-1';
export const formatSlugs={dymaxion:'spaceship-earth',felv:'felv',bighex:'flower-world',gosper:'gosper-fractal',flower:'4hexes',infinite:'infinite-honeycomb',single:'rus-one',double:'rus-two'};
export const shareCombinations=styleOptions.flatMap(style=>layoutOptions.map(layout=>({style,layout,path:`/${style.id}/${formatSlugs[layout.arrangement]}/`,image:`/social/${style.id}-${formatSlugs[layout.arrangement]}.jpg`})));
export function readSharePath(path){return shareCombinations.find(pair=>pair.path===path.replace(/\/?$/,'/'))||null;}
export function sharePair(styleId,arrangement){return shareCombinations.find(pair=>pair.style.id===styleId&&pair.layout.arrangement===arrangement)||shareCombinations[0];}
export function inferSharePair(saved){
 if(!saved)return shareCombinations[0];
 const source=saved.controls?.['map-source'];
 const candidates=styleOptions.filter(style=>style.source===source);
 const score=style=>Object.entries(style.controls).filter(([k,v])=>saved.controls?.[k]===v).length+Object.entries(style.state).filter(([k,v])=>saved.state?.[k]===v).length;
 const style=candidates.sort((a,b)=>score(b)-score(a))[0]||styleOptions[0];
 return sharePair(style.id,saved.state?.arrangement||'dymaxion');
}
export function presetSettings(pair){return {version:1,state:{...pair.layout.state,...pair.style.state},controls:{...pair.layout.controls,...pair.style.controls}};}
