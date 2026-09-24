import {formatSlugs} from './share-routes.mjs?v=turn-30';
import {styleOptions} from './map-options.mjs?v=turn-30';
import {periods} from './history/index.mjs?v=history-1';
// Every download has a fixed address: /download/<style>/<format>/<file> for a
// map and /download/history/<period>/<style>/<format>/<file> for a poster. A
// file cached at that path is served as it is; otherwise the address falls
// through to the app (the site's 404 page), which renders the export in the
// browser and starts the download. A customised map carries its #m= state.
export const downloadTexts=Object.freeze(['brief','titles','full']);
export const downloadRows=Object.freeze([1,2,3]);
export const mapFiles=Object.freeze([
 {file:'map-medium.png',format:'map-2'},{file:'map-high.png',format:'map-10'},
 {file:'map-medium.pdf',format:'pdf-2'},{file:'map-high.pdf',format:'pdf-10'},
 ...downloadRows.map(rows=>({file:`instagram-3x${rows}.zip`,format:'instagram',rows})),
].map(Object.freeze));
export const posterFiles=Object.freeze(downloadTexts.flatMap(text=>[
 {file:`poster-${text}.pdf`,format:'poster-pdf',text},{file:`poster-${text}.png`,format:'poster-png',text},
 ...downloadRows.map(rows=>({file:`poster-${text}-3x${rows}.zip`,format:'poster-instagram',text,rows})),
]).map(Object.freeze));
export const downloadPath=({style,layout,period=null,file})=>period?`/download/history/${period}/${style}/${formatSlugs[layout]}/${file}`:`/download/${style}/${formatSlugs[layout]}/${file}`;
export function readDownloadPath(path){
 const m=path.match(/^\/download\/(?:history\/([a-z0-9-]+)\/)?([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9.-]+)$/);if(!m)return null;
 const [,periodId,styleId,layoutSlug,file]=m;
 const style=styleOptions.find(s=>s.id===styleId),layout=Object.keys(formatSlugs).find(key=>formatSlugs[key]===layoutSlug);
 if(!style||!layout)return null;
 if(periodId){const period=periods.find(p=>p.id===periodId||p.stop===periodId),entry=posterFiles.find(f=>f.file===file);return period&&entry?{style:style.id,layout,period:period.id,...entry}:null;}
 const entry=mapFiles.find(f=>f.file===file);return entry?{style:style.id,layout,period:null,...entry}:null;
}
