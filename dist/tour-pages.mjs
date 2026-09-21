import {tourLocations} from './tour-markers.mjs?v=tour-pages-1';

// Only implemented stories have landing pages. Stable location IDs also make
// durable, root-level links; future chapters can extend this registry.
export const tourPages=tourLocations.filter(location=>location.overlay).map(location=>({
 ...location,path:`/${location.id}/`,image:`/social/tour-${location.id}.jpg`,
}));
export const readTourPath=path=>tourPages.find(tour=>tour.path===path.replace(/\/?$/,'/'))||null;

export function initTourNavigation({show,mapPath,win=window,doc=document}){
 const mapTitle='Lifezones · Spaceship Earth — Hexagonal Earth';
 const title=tour=>{doc.title=tour?`${tour.title} — Hexagonal Earth`:mapTitle;};
 const sync=()=>{const tour=readTourPath(win.location.pathname);title(tour);show(tour?.id||null);};
 win.addEventListener('popstate',sync);
 return {
  open(id){
   const tour=tourPages.find(t=>t.id===id);if(!tour)return;
   if(readTourPath(win.location.pathname)?.id!==id){
    const returnURL=win.location.pathname+win.location.search+win.location.hash;
    win.history.pushState({tourReturnURL:returnURL},'',tour.path);
   }
   title(tour);
  },
  close(restore=true){
   if(!readTourPath(win.location.pathname))return;
   if(restore&&win.history.state?.tourReturnURL)win.history.back();
   else {win.history.replaceState(null,'',mapPath());title(null);}
  },
 };
}
