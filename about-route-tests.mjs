import assert from 'node:assert/strict';
import {initAboutRoute,isAboutPath,aboutShapes,aboutPath,aboutMethod} from './dist/about-route.mjs';
function fixture(initial){
 const listeners={},events={},doc={title:'Map title'},entries=[{url:initial,state:null}];let index=0;
 const win={location:new URL(initial,'https://hexagonal.earth'),addEventListener:(name,fn)=>listeners[name]=fn};
 const navigate=()=>{win.location=new URL(entries[index].url,'https://hexagonal.earth');};
 win.history={get state(){return entries[index].state;},pushState(state,_,url){entries.splice(index+1);entries.push({state,url});index++;navigate();},replaceState(state,_,url){entries[index]={state,url};navigate();},back(){if(index){index--;navigate();listeners.popstate();}},forward(){if(index+1<entries.length){index++;navigate();listeners.popstate();}}};
 const dialog={open:false,addEventListener:(name,fn)=>events[name]=fn,close(){this.open=false;events.close();}};
 const open=initAboutRoute({dialog,win,doc,show:()=>dialog.open=true});return {win,doc,dialog,open};
}
assert.ok(isAboutPath('/about/'));assert.ok(isAboutPath('/about'));assert.ok(!isAboutPath('/about-other'));
const map='/lifezones/spaceship-earth/?test=1#m=custom',f=fixture(map);
f.open();assert.equal(f.win.location.pathname,'/about/');assert.ok(f.dialog.open);assert.equal(f.doc.title,'About — Hexagonal Earth');
f.win.history.back();assert.equal(f.win.location.pathname+f.win.location.search+f.win.location.hash,map);assert.ok(!f.dialog.open);assert.equal(f.doc.title,'Map title');
f.win.history.forward();assert.ok(f.dialog.open);assert.equal(f.win.location.pathname,'/about/');
f.dialog.close();assert.equal(f.win.location.pathname+f.win.location.search+f.win.location.hash,map);
const direct=fixture('/about/');assert.ok(direct.dialog.open);direct.dialog.close();assert.equal(direct.win.location.pathname,'/');assert.ok(!direct.dialog.open);
console.log('About URL: direct entry, close, Back, Forward and exact map return pass.');

for(const [id] of aboutShapes){
 const path=aboutPath(id),page=fixture(path);
 assert.equal(aboutMethod(path),id);assert.equal(aboutMethod(path.slice(0,-1)),id);
 assert.ok(page.dialog.open);page.dialog.close();assert.equal(page.win.location.pathname,'/');
}
assert.equal(aboutMethod('/about/unknown/'),null);
const selected=fixture(map);selected.open();selected.open.setProjection('tetra');
assert.equal(selected.win.location.pathname,'/about/tetrahedron/');
selected.open.setProjection('octa');assert.equal(selected.win.location.pathname,'/about/octahedron/');
selected.dialog.close();assert.equal(selected.win.location.pathname+selected.win.location.search+selected.win.location.hash,map);
selected.win.history.forward();assert.equal(selected.win.location.pathname,'/about/octahedron/');assert.ok(selected.dialog.open);
console.log('Shape URLs: all six direct routes, dropdown changes and return history pass.');
