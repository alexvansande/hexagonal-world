import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {shareCombinations} from '../dist/share-routes.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function buildSharePages(output){
 const template=await readFile(resolve(root,'dist/index.html'),'utf8');
 const escape=text=>text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 for(const pair of shareCombinations){
  const title=`${pair.style.name} · ${pair.layout.name} — Hexagonal World`,description=`${pair.style.name} in the ${pair.layout.name} format. Explore, customize and print a hexagonal world map.`,url='https://hexagonal.earth'+pair.path,image='https://hexagonal.earth'+pair.image;
  let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/(<link rel="canonical" href=")[^"]+/,`$1${url}`);
  for(const [key,value] of Object.entries({'description':description,'og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:type':'image/jpeg','og:image:alt':description,'twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':description}))html=html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`),(_,prefix)=>prefix+escape(value));
  const destination=resolve(output,pair.path.slice(1),'index.html');await mkdir(dirname(destination),{recursive:true});await writeFile(destination,html);
 }
 await writeFile(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+['/',...shareCombinations.map(p=>p.path)].map(path=>`<url><loc>https://hexagonal.earth${path}</loc></url>`).join('\n')+'\n</urlset>\n');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await buildSharePages(resolve(process.argv[2]||'dist'));console.log('Generated 64 share pages and sitemap.');}
