import {periods} from './history/index.mjs?v=history-1';
// Every age and every pane has its own address: /history/<period>/ and
// /history/<period>/<spot>/. The map style and layout ride in the hash (&s=)
// so the path stays about history. Old stop names still resolve.
export const historyPath=(period,spot=null)=>`/history/${period}/${spot?spot+'/':''}`;
export function readHistoryPath(path){
 const m=path.match(/^\/history\/([a-z0-9-]+)(?:\/([a-z][a-z0-9-]*))?\/?$/);if(!m)return null;
 const period=periods.find(p=>p.id===m[1]||p.stop===m[1]);if(!period)return null;
 return {period:period.id,spot:m[2]&&period.stories.includes(m[2])?m[2]:null};
}
export const historyPages=periods.flatMap(p=>[{period:p.id,spot:null,path:historyPath(p.id),image:`/social/history-${p.id}.jpg`},...p.stories.map(spot=>({period:p.id,spot,path:historyPath(p.id,spot),image:`/social/history-${p.id}-${spot}.jpg`}))]);
export function readHashShare(hash){const m=hash.match(/(?:^#|&)s=([a-z0-9-]+\/[a-z0-9-]+)(?:&|$)/);return m?'/'+m[1]+'/':null;}
