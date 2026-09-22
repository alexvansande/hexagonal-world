// Unified history timeline: fixed stops, each showing the chapters that cover
// that moment across every story. Stops are editorial snapshots on a three-zone
// scale (deep time, prehistory, history), not evenly spaced years. Every chapter
// belongs to exactly one stop (tour-timeline-tests.mjs); a chapter entry may
// restrict itself to some waves. Empty stops are placeholders for stories that
// are not written yet. Small and dependency-free: safe to import at startup.
const chapter=(tour,period,waves=null)=>Object.freeze({tour,period,storyId:`${tour}-${period}`,waves:waves&&Object.freeze(waves)});
export const timelineStops=Object.freeze([
 {id:'early-hominins',label:'Early hominins',date:'c. 1.8 million years ago',year:-1800000,chapters:[chapter('origin-of-mankind','early-hominins')]},
 {id:'out-of-africa',label:'Out of Africa',date:'c. 50,000 years ago',year:-50000,chapters:[chapter('origin-of-mankind','archaic-eurasia'),chapter('origin-of-mankind','sapiens-expansion'),chapter('french-polynesia','near-oceania')]},
 {id:'ice-age-to-farming',label:'Ice Age to farming',date:'c. 15,000–3,000 years ago',year:-13000,chapters:[chapter('origin-of-mankind','later-movements')]},
 {id:'bronze-age',label:'Bronze Age',date:'c. 1300 BCE',year:-1300,chapters:[chapter('silk-road','bronze-age'),chapter('french-polynesia','lapita'),chapter('americas-exchange','early-exchange')]},
 {id:'antiquity',label:'Antiquity',date:'c. 200 CE',year:200,chapters:[chapter('silk-road','antiquity'),chapter('americas-exchange','classic'),chapter('african-networks','garamantes-and-aksum')]},
 {id:'middle-ages',label:'Middle Ages',date:'c. 950 CE',year:950,chapters:[chapter('silk-road','early-middle-ages'),chapter('iceland-to-vinland','first-raids'),chapter('iceland-to-vinland','rus-and-danelaw'),chapter('iceland-to-vinland','settlements'),chapter('iceland-to-vinland','kings'),chapter('americas-exchange','andean-networks'),chapter('french-polynesia','east-polynesia'),chapter('african-networks','ghana-and-swahili')]},
 {id:'high-middle-ages',label:'High Middle Ages',date:'c. 1300 CE',year:1300,chapters:[chapter('silk-road','high-middle-ages'),chapter('french-polynesia','far-corners'),chapter('french-polynesia','south-america'),chapter('iceland-to-vinland','north-atlantic',['trade']),chapter('african-networks','mali-and-kilwa')]},
 {id:'globalization',label:'Globalization',date:'c. 1450–1520 CE',year:1450,chapters:[chapter('americas-exchange','late-precolumbian'),chapter('african-networks','songhai-and-portuguese'),chapter('ocean-crossings','ming-and-monsoon'),chapter('ocean-crossings','iberian-routes')]},
 {id:'plantations-and-empires',label:'Plantations & empires',date:'c. 1750 CE',year:1750,chapters:[chapter('african-networks','atlantic-slave-trade'),chapter('ocean-crossings','galleons-and-companies')]},
].map(stop=>Object.freeze({...stop,chapters:Object.freeze(stop.chapters),tours:Object.freeze([...new Set(stop.chapters.map(c=>c.tour))])})));
export const defaultTimelineStop='middle-ages';
export const timelineStop=id=>timelineStops.find(stop=>stop.id===id)||timelineStops.find(stop=>stop.id===defaultTimelineStop);
// Union of the stop's chapter routes across loaded tours; route IDs are unique per tour prefix.
export function timelineRoutes(stop,dataByTour){
 const seen=new Set(),routes=[];
 for(const entry of stop.chapters){
  const data=dataByTour[entry.tour];if(!data?.periods)continue;
  const period=data.periods.find(p=>p.id===entry.period);if(!period)continue;
  for(const route of period.routes){
   if(entry.waves&&!entry.waves.includes(route.wave))continue;
   if(seen.has(route.id))continue;seen.add(route.id);routes.push(route);
  }
 }
 return routes;
}
// The chapter to open when a story dot is clicked while this stop is shown.
export const timelinePeriod=(stop,tour)=>stop.chapters.find(c=>c.tour===tour)?.period||null;
