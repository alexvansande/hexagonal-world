import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {tourPages,readTourPath} from './dist/tour-pages.mjs';
import {periods} from './dist/history/index.mjs';
import {parsePeriod} from './dist/tour-content.mjs';
import {buildSharePages} from './scripts/build-share-pages.mjs';
import {assetURL} from './dist/asset-url.mjs';

const atlas='https://assets.example/maps-original',extra='https://assets.example/maps-tours';
const overrides=['social/tour-','maps/tours/pacific-v1/'].map(prefix=>({prefix,baseURL:extra}));
assert.equal(assetURL('/social/tour-india.jpg',atlas,overrides),extra+'/social/tour-india.jpg');
assert.equal(assetURL('maps/tours/pacific-v1/0/0-0.png',atlas,overrides),extra+'/maps/tours/pacific-v1/0/0-0.png');
assert.equal(assetURL('/social/lifezones-spaceship-earth.jpg',atlas,overrides),atlas+'/social/lifezones-spaceship-earth.jpg');
assert.equal(assetURL('/social/tour-india.jpg','',overrides),'/social/tour-india.jpg');
assert.equal(assetURL('https://example.com/a.jpg',atlas,overrides),'https://example.com/a.jpg');

assert.equal(tourPages.length,7);
assert.equal(new Set(tourPages.map(t=>t.path)).size,7);
assert.equal(readTourPath('/india/'),null,'Retired overlays no longer resolve as tour pages');
assert.equal(readTourPath('/unknown/'),null);assert.equal(readTourPath('/india/extra/'),null);
const directory=await mkdtemp(join(tmpdir(),'hex-tour-pages-')),hashes=new Set();
try{
 await buildSharePages(directory);const sitemap=await readFile(join(directory,'sitemap.xml'),'utf8');
 for(const tour of tourPages){
  assert.equal(readTourPath(tour.path),tour);assert.equal(readTourPath(tour.path.slice(0,-1)),tour);
  assert.match(tour.path,/^\/[a-z-]+\/$/);
  const html=await readFile(join(directory,tour.path,'index.html'),'utf8');
  for(const tag of [`<title>${tour.title} — Hexagonal Earth</title>`,`rel="canonical" href="https://hexagonal.earth${tour.path}"`,`property="og:url" content="https://hexagonal.earth${tour.path}"`,`property="og:image" content="https://hexagonal.earth${tour.image}"`,`name="twitter:image" content="https://hexagonal.earth${tour.image}"`])assert(html.includes(tag),tag);
  assert(html.includes('property="og:image:width" content="1200"'));assert(html.includes('property="og:image:height" content="630"'));
  assert(sitemap.includes('https://hexagonal.earth'+tour.path));assert(!html.includes('social-preview.png'));
  const bytes=await readFile('dist'+tour.image);assert.equal(bytes.readUInt16BE(0),0xffd8);
  let size=null;for(let pos=2;pos<bytes.length;){const marker=bytes[pos+1],length=bytes.readUInt16BE(pos+2);if([0xc0,0xc1,0xc2].includes(marker)){size=[bytes.readUInt16BE(pos+7),bytes.readUInt16BE(pos+5)];break;}pos+=length+2;}
  assert.deepEqual(size,[1200,630]);hashes.add(createHash('sha256').update(bytes).digest('hex'));
 }
 assert.equal(hashes.size,7,'each tour has distinct rendered artwork');
}finally{await rm(directory,{recursive:true,force:true});}

// A story page describes the story's earliest period, the text the timeline shows when the link opens.
for(const tour of tourPages){
 const first=periods.find(p=>p.stories.includes(tour.id));assert(first,tour.id+' appears in some period');
 const spot=parsePeriod(await readFile(`dist/history/${first.id}.md`,'utf8')).spots[tour.id];assert(spot.paragraphs[0].length>40);
}
console.log('Tour pages: seven root URLs, unique 1200×630 JPEGs, static OG/Twitter metadata from the period Markdown and sitemap pass.');
