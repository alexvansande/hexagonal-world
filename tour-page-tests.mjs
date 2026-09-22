import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {tourPages,readTourPath,initTourNavigation,readPeriod,withPeriod} from './dist/tour-pages.mjs';
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

// Browser history must preserve the exact map URL, avoid a duplicate entry on
// direct loads, restore via Back/Forward, and avoid returning to an external site.
const stack=[{url:'/lifezones/spaceship-earth/#m=saved-camera',state:null}];let index=0,listener;
const win={location:new URL(stack[0].url,'https://hexagonal.earth'),addEventListener:(name,fn)=>{assert.equal(name,'popstate');listener=fn;}};
const sync=()=>{win.location=new URL(stack[index].url,'https://hexagonal.earth');};
win.history={get state(){return stack[index].state;},pushState(state,_,url){stack.splice(++index);stack.push({state,url});sync();},replaceState(state,_,url){stack[index]={state,url};sync();},back(){if(index){index--;sync();listener();}},forward(){if(index<stack.length-1){index++;sync();listener();}}};
const shown=[],doc={title:''},nav=initTourNavigation({win,doc,mapPath:()=>'/lifezones/spaceship-earth/',show:id=>shown.push(id)});
nav.open('origin-of-mankind');assert.equal(win.location.pathname,'/origin-of-mankind/');assert.equal(win.location.hash,'');
assert.equal(win.history.state.tourReturnURL,'/lifezones/spaceship-earth/#m=saved-camera');nav.open('origin-of-mankind');assert.equal(stack.length,2);
nav.close();assert.equal(win.location.hash,'#m=saved-camera');assert.equal(shown.at(-1),null);
win.history.forward();assert.equal(shown.at(-1),'origin-of-mankind');assert.match(doc.title,/Origin of mankind/);
nav.close(false);assert.equal(win.location.pathname,'/lifezones/spaceship-earth/');assert.equal(win.history.state,null);
win.history.replaceState(null,'','/french-polynesia/');nav.open('french-polynesia');nav.close();assert.equal(win.location.pathname,'/lifezones/spaceship-earth/');
// The selected chapter is a query parameter on the clean tour URL, never in the map hash.
assert.equal(readPeriod('?period=lapita'),'lapita');assert.equal(readPeriod(''),null);
assert.equal(withPeriod('https://hexagonal.earth/french-polynesia/','lapita'),'https://hexagonal.earth/french-polynesia/?period=lapita');
assert.equal(withPeriod('https://hexagonal.earth/silk-road/?period=antiquity#m=abc','bronze-age'),'https://hexagonal.earth/silk-road/?period=bronze-age#m=abc');
console.log('Tour pages: seven root URLs, unique 1200×630 JPEGs, static OG/Twitter metadata, sitemap, period query state and Back/Forward history pass.');
