// Schematic sea corridors, not reconstructed ship tracks. Geographic western
// Norway is used instead of claiming Bergen (founded 1070) launched the early
// settlement voyages. Greenland waypoints round Cape Farewell, not its ice sheet.
// References and caveats: territory-tours-sources.md. Coordinates are [lat,lon].
// Chapters are snapshots of active sea lanes; two-way links show return sailing.
import {definePeriods,bothWays} from './tour-periods.mjs?v=chapters-1';
const norway=[60.4,5.3],shetland=[60.15,-1.15],faroe=[62,-6.8],iceland=[64.15,-21.94],eastSettlement=[61.15,-45.5],westSettlement=[64.18,-51.72];
const orkney=[59,-3],hebrides=[57.5,-7],dublin=[53.35,-6.26],disko=[69.2,-53],markland=[56,-60],meadows=[51.596,-55.533],smithSound=[76.5,-68.7];
export const vinlandRoutes=[
 {id:'norse-islands',title:'Western Norway, Shetland and the Faroes',geodesic:true,coordinates:[norway,[60.3,3],[60,-.6],shetland,[61,-3],faroe]},
 {id:'norse-iceland',title:'Faroes to Iceland',geodesic:true,coordinates:[faroe,[62.5,-10],[63,-14],[63.1,-18.5],[63.5,-22.5],[64,-22.8],iceland]},
 {id:'norse-greenland',title:'Iceland to the Eastern Settlement',geodesic:true,coordinates:[iceland,[63.8,-25],[61.8,-35],[59.5,-43.8],[60,-46.2],[60.65,-46.2],eastSettlement]},
 {id:'norse-western-settlement',title:'Greenland’s western coast',geodesic:true,coordinates:[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-50.8],[63.7,-52.5],westSettlement]},
 {id:'norse-helluland',title:'Greenland to Helluland and Markland',geodesic:true,coordinates:[westSettlement,[63.6,-53.5],[63.5,-58.5],[63.3,-63],[62.5,-63.7],[60.6,-62],[58.6,-61.7],markland]},
 {id:'norse-vinland',title:'Markland to northern Newfoundland',geodesic:true,coordinates:[markland,[55.2,-58.7],[54.1,-56.8],[52.6,-55.2],meadows]},
];
const base=Object.fromEntries(vinlandRoutes.map(r=>[r.id,r]));
const sail=(id,wave,route,extra={})=>Object.freeze({...route,id,wave,animated:true,geodesic:true,lane:3,...extra});
const leg=(id,title,wave,stops,extra={})=>sail(id,wave,{title,coordinates:stops},extra);
const twoWay=(id,wave,route,extra={})=>bothWays([sail(id,wave,route,extra)]);
const islands=twoWay('norse-islands','voyages',base['norse-islands']);
const northernIsles=leg('norse-northern-isles','Shetland, Orkney, the Hebrides and Dublin','voyages',[shetland,orkney,[58,-5.5],hebrides,[56,-7.5],dublin]);
const faroeIceland=twoWay('norse-iceland','voyages',base['norse-iceland']);
const gaelic=leg('norse-gaelic','Hebrides and Ireland toward Iceland','voyages',[hebrides,[59,-10],[61,-14],[63,-19],[63.5,-22.5],[64,-22.8],iceland],{uncertain:true});
// Sailing directions ran west from Norway, north of Shetland and south of the
// Faroes; this open-sea lane carries the trade in timber, grain and wool.
const openSea=twoWay('norse-open-sea','trade',{title:'Norway and Iceland across the open sea',coordinates:[norway,[61.5,-2],[62.2,-9],[63.5,-16],[63.5,-22.5],[64,-22.8],iceland]});
const greenland=twoWay('norse-greenland','voyages',base['norse-greenland']);
const greenlandTrade=twoWay('norse-greenland-trade','trade',base['norse-greenland']);
const western=twoWay('norse-western-settlement','voyages',base['norse-western-settlement']);
const helluland=twoWay('norse-helluland','voyages',base['norse-helluland'],{uncertain:true});
const vinland=twoWay('norse-vinland','voyages',base['norse-vinland'],{uncertain:true});
const nordrsetur=twoWay('norse-nordrsetur','trade',{title:'Norðrsetur hunting grounds',coordinates:[westSettlement,[65.5,-53.5],[67.5,-54],disko]});
const marklandTimber=twoWay('norse-markland-timber','trade',{title:'Timber voyages to Markland',coordinates:[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-52],[62,-58],[60.6,-62],[58.6,-61.7],markland]},{uncertain:true});
const thule=twoWay('norse-thule','voyages',{title:'Contact with Thule Inuit in the far north',coordinates:[disko,[71,-56],[74,-60],smithSound]},{uncertain:true});
const bergenTrade=twoWay('norse-bergen','trade',{title:'Bergen, Iceland and Greenland',coordinates:[norway,[61.5,-2],[62.2,-9],[63.5,-16],[63.5,-22.5],[64,-22.8],iceland]});
export const vinlandChapters=definePeriods('iceland-to-vinland',[
 {id:'northern-isles',label:'Northern Isles',date:'c. 800 CE',year:800,routes:[...islands,northernIsles],waves:['voyages']},
 {id:'iceland-settlement',label:'Settling Iceland',date:'c. 870–930 CE',year:870,routes:[...islands,northernIsles,...faroeIceland,gaelic,...openSea],waves:['voyages','trade']},
 {id:'greenland',label:'Greenland',date:'c. 985–1000 CE',year:985,routes:[...islands,...faroeIceland,...openSea,...greenland,...western],waves:['voyages','trade']},
 {id:'vinland',label:'Vinland',date:'c. 1000–1020 CE',year:1000,routes:[...islands,...faroeIceland,...openSea,...greenland,...western,...helluland,...vinland],waves:['voyages','trade']},
 {id:'later-atlantic',label:'Later trade',date:'c. 1250–1350 CE',year:1250,routes:[...bergenTrade,...greenlandTrade,...western,...nordrsetur,...marklandTimber,...thule],waves:['voyages','trade']},
],'vinland',{heading:'Voyages through time'});
