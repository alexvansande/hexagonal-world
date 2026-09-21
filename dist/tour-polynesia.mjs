// Editorial schematic of Pacific settlement and voyaging, not recovered canoe
// tracks. Waypoints are [latitude, longitude]; great-circle arcs cross the date
// line. Two-way links mark documented or inferred return voyaging; the South
// American links are an evidence-based hypothesis with uncertain direction.
// Sources and caveats: polynesia-sources.md.
import {definePeriods,bothWays} from './tour-periods.mjs?v=chapters-1';
const p={bismarck:[-5,150],santaCruz:[-10.7,166],vanuatu:[-17.7,168.3],newCaledonia:[-22,166],fiji:[-17.8,178],tonga:[-21.2,-175.2],samoa:[-13.9,-171.8],
 cooks:[-21.2,-159.8],tahiti:[-17.65,-149.43],tuamotu:[-15.1,-147.6],marquesas:[-8.9,-140.1],southMarquesas:[-10.5,-138.6],mangareva:[-23.1,-135],pitcairn:[-25.07,-130.1],austral:[-23.4,-149.5],
 hawaii:[19.5,-155.5],rapaNui:[-27.12,-109.35],aotearoa:[-35.5,174],kermadec:[-29.3,-177.9],chatham:[-44,-176.5],ecuador:[-1,-80.7],colombia:[3.9,-77],arica:[-18.5,-70.3],
 sunda:[2,110],newGuinea:[-5,139],manus:[-2,147],newBritain:[-5.3,150.1],newIreland:[-3.2,151.9],buka:[-5.4,154.7],solomons:[-9.6,160],taiwan:[23.5,121],luzon:[16,121],guam:[13.5,144.8],chuuk:[7.4,151.8],pohnpei:[6.9,158.2]};
const coords=stops=>Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?p[stop]:stop)));
const voyage=(id,title,wave,period,stops,extra={})=>Object.freeze({id:'polynesia-'+id,title,wave,period,animated:true,geodesic:true,lane:0,coordinates:coords(stops),...extra});
// Interisland voyaging is denser than one-off settlement crossings.
const twoWay=(id,title,period,stops,extra={})=>bothWays([voyage(id,title,'voyaging',period,stops,{lane:3,frequency:1.5,...extra})]);
const contact=(id,title,period,stops)=>bothWays([voyage(id,title,'contact',period,stops,{lane:3,frequency:.5,uncertain:true})]);
// Pleistocene Near Oceania: Sahul, the Bismarcks and the Solomons were settled
// tens of thousands of years before Lapita; obsidian moved between islands.
export const nearOceaniaRoutes=Object.freeze([
 voyage('near-sahul','Wallacea to New Guinea','settlement','Sahul: about 65,000–50,000 years ago',['sunda',[0,123],[-1,132],'newGuinea'],{uncertain:true}),
 voyage('near-bismarck','New Guinea to the Bismarck Archipelago','settlement','Bismarcks: about 40,000 years ago',['newGuinea',[-5.5,145],'newBritain',[-4,151],'newIreland']),
 voyage('near-manus','Crossing to Manus','settlement','Manus: about 13,000 years ago or earlier',['newIreland',[-2.5,149.5],'manus'],{uncertain:true}),
 voyage('near-solomons','Into the Solomon Islands','settlement','Buka: about 29,000 years ago',['newIreland',[-4.5,153.5],'buka',[-8,158],'solomons']),
 ...twoWay('near-obsidian','New Britain obsidian to New Ireland','Obsidian exchange from about 20,000 years ago',['newBritain',[-4.5,151],'newIreland']),
]);
// Austronesian speakers reach the Pacific from island Southeast Asia; Lapita
// carries their descendants into Remote Oceania, and Micronesia follows.
export const austronesianRoutes=Object.freeze([
 voyage('austronesian-philippines','Taiwan to the Philippines','settlement','About 2000–1500 BCE',['taiwan',[19,121.5],'luzon'],{uncertain:true}),
 voyage('austronesian-marianas','Philippines to the Mariana Islands','settlement','Marianas: about 1500 BCE',['luzon',[14.5,130],[14,138],'guam'],{uncertain:true}),
 voyage('austronesian-bismarck','Island Southeast Asia to the Bismarcks','settlement','About 1500 BCE',['luzon',[8,124],[2,128],[-2,140],[-4,147],'newBritain'],{uncertain:true}),
 voyage('austronesian-carolines','Melanesia to the Caroline Islands','settlement','Carolines: about 2,000 years ago',['solomons',[-3,160],[2,157],'pohnpei',[7,155],'chuuk'],{uncertain:true}),
]);
export const lapitaRoutes=Object.freeze([
 ...austronesianRoutes,
 voyage('lapita-melanesia','Bismarck Archipelago to Vanuatu and New Caledonia','settlement','Lapita: about 3,300–3,000 years ago',['newBritain',[-8,158],'santaCruz','vanuatu','newCaledonia']),
 voyage('lapita-fiji','Vanuatu to Fiji, Tonga and Samoa','settlement','West Polynesia: about 1100–800 BCE',['vanuatu',[-18,173],'fiji',[-19.5,-178.5],'tonga',[-17,-173.5],'samoa']),
 ...twoWay('west-polynesia','Fiji, Tonga and Samoa','Continuing exchange',['fiji',[-19.5,-178.5],'tonga',[-17,-173.5],'samoa']),
 ...twoWay('fiji-samoa','Fiji and Samoa','Continuing exchange',['fiji',[-15,-179],'samoa']),
]);
export const eastPolynesiaRoutes=Object.freeze([
 voyage('east-cooks','Samoa to the Cook Islands','settlement','East Polynesia: about 1000–1200 CE',['samoa',[-17,-165],'cooks']),
 voyage('east-society','Cook Islands to the Society Islands','settlement','East Polynesia: about 1000–1200 CE',['cooks',[-19.5,-154],'tahiti']),
 voyage('east-tuamotu','Society Islands to the Tuamotus','settlement','East Polynesia: about 1000–1200 CE',['tahiti','tuamotu']),
 voyage('east-marquesas','Tuamotus to the Marquesas','settlement','East Polynesia: about 1000–1200 CE',['tuamotu',[-12,-143.5],'marquesas']),
 voyage('east-austral','Society Islands to the Australs','settlement','East Polynesia: about 1000–1200 CE',['tahiti','austral']),
 voyage('east-mangareva','Tuamotus to Mangareva','settlement','East Polynesia: about 1000–1200 CE',['tuamotu',[-19,-141],'mangareva']),
 ...twoWay('society-cooks','Society Islands and Cook Islands','Continuing voyaging',['tahiti',[-19.5,-154],'cooks']),
 ...twoWay('society-tuamotu','Society Islands and Tuamotus','Continuing voyaging',['tahiti','tuamotu']),
 ...twoWay('society-marquesas','Society Islands and Marquesas','Continuing voyaging',['tahiti',[-13,-144.5],'marquesas']),
 ...twoWay('society-austral','Society Islands and Australs','Continuing voyaging',['tahiti','austral']),
 ...twoWay('samoa-cooks','Samoa and Cook Islands','Continuing voyaging',['samoa',[-17,-165],'cooks']),
]);
export const farCornerRoutes=Object.freeze([
 voyage('far-hawaii','Marquesas toward Hawaiʻi','settlement','Hawaiʻi: about 1000–1200 CE',['marquesas',[0,-146],[10,-151],'hawaii'],{uncertain:true}),
 voyage('far-pitcairn','Mangareva to Pitcairn','settlement','About 1200 CE',['mangareva','pitcairn']),
 voyage('far-rapa-nui','Pitcairn toward Rapa Nui','settlement','Rapa Nui: about 1200 CE',['pitcairn',[-26.5,-120],'rapaNui'],{uncertain:true}),
 voyage('far-aotearoa','Society and Cook Islands toward Aotearoa','settlement','Aotearoa: about 1250–1300 CE',['cooks',[-26,-167],[-30,-178],[-33,178],'aotearoa']),
 voyage('far-kermadec','Kermadec Islands','settlement','About 1300 CE',[[-30,-178],'kermadec'],{uncertain:true}),
 voyage('far-chatham','Aotearoa to the Chatham Islands','settlement','About 1500 CE',['aotearoa',[-40,178],'chatham'],{uncertain:true}),
 ...twoWay('hawaii-society','Hawaiʻi and the Society Islands','Voyages remembered in tradition; adze evidence',['hawaii',[8,-152],[-4,-149],'tahiti'],{uncertain:true}),
 ...twoWay('marquesas-mangareva','Marquesas, Tuamotus and Mangareva','Continuing voyaging',['marquesas',[-15,-139],'mangareva']),
 ...twoWay('mangareva-pitcairn','Mangareva and Pitcairn','Continuing voyaging',['mangareva','pitcairn']),
]);
export const contactRoutes=Object.freeze([
 ...contact('contact-marquesas','Marquesas and the Colombian–Ecuadorian coast','Native American gene flow: about 1200 CE',['southMarquesas',[-5,-120],[-1,-100],'ecuador']),
 ...contact('contact-rapa-nui','Rapa Nui and the South American coast','Rapa Nui admixture: about 1250–1430 CE',['rapaNui',[-24,-90],'arica']),
 ...twoWay('mangareva-rapa-nui','Mangareva, Pitcairn and Rapa Nui','Continuing voyaging; ceased before European contact',['pitcairn',[-26.5,-120],'rapaNui'],{uncertain:true}),
]);
const voyaging=routes=>routes.filter(r=>r.wave==='voyaging');
export const polynesiaChapters=definePeriods('french-polynesia',[
 {id:'near-oceania',label:'Near Oceania',date:'c. 40,000 years ago',year:-40000,routes:nearOceaniaRoutes,waves:['settlement','voyaging']},
 {id:'lapita',label:'Austronesians & Lapita',date:'c. 1500 BCE – 1 CE',year:-1500,routes:lapitaRoutes,waves:['settlement','voyaging']},
 {id:'east-polynesia',label:'East Polynesia',date:'c. 1000–1200 CE',year:1000,routes:[...voyaging(lapitaRoutes),...eastPolynesiaRoutes],waves:['settlement','voyaging']},
 {id:'far-corners',label:'Far corners',date:'c. 1200–1300 CE',year:1200,routes:[...voyaging(lapitaRoutes),...voyaging(eastPolynesiaRoutes),...farCornerRoutes],waves:['settlement','voyaging']},
 {id:'south-america',label:'South America',date:'c. 1200–1400 CE',year:1300,routes:[...voyaging(lapitaRoutes),...voyaging(eastPolynesiaRoutes),...voyaging(farCornerRoutes),...contactRoutes],waves:['voyaging','contact']},
],'far-corners',{heading:'Settlement through time'});
