import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {aboutShapes,aboutPath} from '../dist/about-route.mjs';
import {shareCombinations} from '../dist/share-routes.mjs';
import {tourPages} from '../dist/tour-pages.mjs';
import {parsePeriod} from '../dist/tour-content.mjs';
import {periods} from '../dist/history/index.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function buildSharePages(output){
 const template=await readFile(resolve(root,'dist/index.html'),'utf8');
 const escape=text=>text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 // A story's page describes its earliest period: the text the timeline shows when the link opens.
 const texts=new Map();
 const storyText=async id=>{const p=periods.find(p=>p.stories.includes(id));if(!texts.has(p.id))texts.set(p.id,parsePeriod(await readFile(resolve(root,`dist/history/${p.id}.md`),'utf8')));return texts.get(p.id).spots[id];};
 for(const tour of tourPages){
  const story=await storyText(tour.id),title=`${tour.title} — Hexagonal Earth`,url='https://hexagonal.earth'+tour.path,image='https://hexagonal.earth'+tour.image;
  const description=story.paragraphs[0].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\*/g,''),alt=`${story.title}: Lifezones map with ${{'french-polynesia':'Polynesian voyaging routes','origin-of-mankind':'human dispersal routes','silk-road':'Silk Road branches','iceland-to-vinland':'Norse sea routes','americas-exchange':'pre-Columbian exchange routes','african-networks':'African trade routes','ocean-crossings':'ocean trade routes'}[tour.id]||'historical routes'}.`;
  let page=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/(<link rel="canonical" href=")[^"]+/,`$1${url}`);
  const metadata={'description':description,'og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:type':'image/jpeg','og:image:width':'1200','og:image:height':'630','og:image:alt':alt,'twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':alt};
  for(const [key,value] of Object.entries(metadata))page=page.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`),(_,prefix)=>prefix+escape(value));
  const destination=resolve(output,tour.path.slice(1),'index.html');await mkdir(dirname(destination),{recursive:true});await writeFile(destination,page);
 }
 for(const pair of shareCombinations){
  const title=`${pair.style.name} · ${pair.layout.name} — Hexagonal Earth`,description=`${pair.style.name} in the ${pair.layout.name} format. Explore, customize and print a hexagonal world map.`,url='https://hexagonal.earth'+pair.path,image='https://hexagonal.earth'+pair.image;
  let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/(<link rel="canonical" href=")[^"]+/,`$1${url}`);
  for(const [key,value] of Object.entries({'description':description,'og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:type':'image/jpeg','og:image:alt':description,'twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':description}))html=html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`),(_,prefix)=>prefix+escape(value));
  const destination=resolve(output,pair.path.slice(1),'index.html');await mkdir(dirname(destination),{recursive:true});await writeFile(destination,html);
 }
 const aboutPages=[['/about/','About','rhombic-dodecahedron','Rhombic dodecahedron'],...aboutShapes.map(([id,slug,label])=>[aboutPath(id),label+' · About',slug,label])];
 for(const [path,heading,slug,label] of aboutPages){
  const title=heading+' — Hexagonal Earth',url='https://hexagonal.earth'+path,image='http://hexagonal.earth/social/about-'+slug+'.jpg';
  const circular=['one-hex','two-hexes'].includes(slug),description=circular?`See how Earth becomes ${label.toLowerCase()}, from a sphere to an equal-area hexagonal map.`:`See how the ${label.toLowerCase()} opens from a globe into a hexagonal map.`;
  const alt=label+': sphere and '+(circular?'hexagonal map':'unfolded faces')+' side by side.';
  let page=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/(<link rel="canonical" href=")[^"]+/,`$1${url}`);
  const metadata={'description':description,'og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:type':'image/jpeg','og:image:width':'1200','og:image:height':'630','og:image:alt':alt,'twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':alt};
  for(const [key,value] of Object.entries(metadata))page=page.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*`),(_,prefix)=>prefix+escape(value));
  const destination=resolve(output,path.slice(1),'index.html');await mkdir(dirname(destination),{recursive:true});await writeFile(destination,page);
 }
 await writeFile(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+['/','/about/',...aboutShapes.map(([id])=>aboutPath(id)),...shareCombinations.map(p=>p.path),...tourPages.map(p=>p.path)].map(path=>`<url><loc>https://hexagonal.earth${path}</loc></url>`).join('\n')+'\n</urlset>\n');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await buildSharePages(resolve(process.argv[2]||'dist'));console.log(`Generated About, 64 map pages, ${tourPages.length} tour pages and sitemap.`);}
