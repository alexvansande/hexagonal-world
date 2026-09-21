// Schematic sea and river corridors of the Viking Age, not reconstructed ship
// tracks. Geographic western Norway is used instead of claiming Bergen (founded
// 1070) launched the early voyages. Greenland waypoints round Cape Farewell.
// References and caveats: territory-tours-sources.md. Coordinates are [lat,lon].
// Four chapters follow the wider expansion; the last tells the Iceland,
// Greenland and Vinland story on its own. Two-way links show return sailing.
import {definePeriods,bothWays} from './tour-periods.mjs?v=strands-2';
import {relaxedStrands} from './tour-iceland-to-vinland-relaxed.mjs?v=strands-2';
const norway=[60.4,5.3],shetland=[60.15,-1.15],faroe=[62,-6.8],iceland=[64.15,-21.94],eastSettlement=[61.15,-45.5],westSettlement=[64.18,-51.72];
const orkney=[59,-3],hebrides=[57.5,-7],dublin=[53.35,-6.26],disko=[69.2,-53],markland=[56,-60],meadows=[51.596,-55.533],smithSound=[76.5,-68.7];
export const vikingPlaces={norway,shetland,faroe,iceland,orkney,hebrides,dublin,eastSettlement,westSettlement,disko,markland,meadows,smithSound,iona:[56.33,-6.42],lindisfarne:[55.67,-1.8],york:[53.96,-1.08],eastAnglia:[52.6,1.3],london:[51.5,-.1],maldon:[51.73,.68],stamford:[53.99,-.91],hastings:[50.85,.57],man:[54.2,-4.5],
 hedeby:[54.5,9.57],kaupang:[59.1,10.05],trondheim:[63.43,10.4],birka:[59.33,17.55],gotland:[57.5,18.5],ladoga:[60,32.3],novgorod:[58.52,31.28],kyiv:[50.45,30.52],constantinople:[41.01,28.98],bulgar:[54.97,49.05],itil:[46,47.8],
 dorestad:[51.98,5.1],seine:[49.5,.1],rouen:[49.44,1.1],paris:[48.86,2.35],nantes:[47.22,-1.55],seville:[37.39,-5.99]};
export const vinlandRoutes=[
 {id:'norse-islands',title:'Western Norway, Shetland and the Faroes',geodesic:true,coordinates:[norway,[60.3,3],[60,-.6],shetland,[61,-3],faroe]},
 {id:'norse-iceland',title:'Faroes to Iceland',geodesic:true,coordinates:[faroe,[62.5,-10],[63,-14],[63.1,-18.5],[63.5,-22.5],[64,-22.8],iceland]},
 {id:'norse-greenland',title:'Iceland to the Eastern Settlement',geodesic:true,coordinates:[iceland,[63.8,-25],[61.8,-35],[59.5,-43.8],[60,-46.2],[60.65,-46.2],eastSettlement]},
 {id:'norse-western-settlement',title:'Greenland’s western coast',geodesic:true,coordinates:[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-50.8],[63.7,-52.5],westSettlement]},
 {id:'norse-helluland',title:'Greenland to Helluland and Markland',geodesic:true,coordinates:[westSettlement,[63.6,-53.5],[63.5,-58.5],[63.3,-63],[62.5,-63.7],[60.6,-62],[58.6,-61.7],markland]},
 {id:'norse-vinland',title:'Markland to northern Newfoundland',geodesic:true,coordinates:[markland,[55.2,-58.7],[54.1,-56.8],[52.6,-55.2],meadows]},
];
const base=Object.fromEntries(vinlandRoutes.map(r=>[r.id,r]));
const p=vikingPlaces;
const coords=stops=>stops.map(stop=>typeof stop==='string'?p[stop]:stop);
const sail=(id,wave,route,extra={})=>Object.freeze({...route,id,wave,animated:true,geodesic:true,lane:3,...extra});
const leg=(id,title,wave,stops,extra={})=>sail(id,wave,{title,coordinates:coords(stops)},extra);
const twoWay=(id,wave,route,extra={})=>bothWays([sail(id,wave,route,extra)]);
const twoWayLeg=(id,title,wave,stops,extra={})=>bothWays([leg(id,title,wave,stops,extra)]);
// North Atlantic legs (shared by the wider chapters and the final story).
const islands=twoWay('norse-islands','voyages',base['norse-islands']);
const northernIsles=leg('norse-northern-isles','Shetland, Orkney, the Hebrides and Dublin','voyages',['shetland','orkney',[58,-5.5],'hebrides',[56,-7.5],'dublin']);
const faroeIceland=twoWay('norse-iceland','voyages',base['norse-iceland']);
const gaelic=leg('norse-gaelic','Hebrides and Ireland toward Iceland','voyages',['hebrides',[59,-10],[61,-14],[63,-19],[63.5,-22.5],[64,-22.8],'iceland'],{uncertain:true});
const openSea=twoWayLeg('norse-open-sea','Norway and Iceland across the open sea','trade',['norway',[61.5,-2],[62.2,-9],[63.5,-16],[63.5,-22.5],[64,-22.8],'iceland']);
const greenland=twoWay('norse-greenland','voyages',base['norse-greenland']);
const greenlandTrade=twoWay('norse-greenland-trade','trade',base['norse-greenland']);
const western=twoWay('norse-western-settlement','voyages',base['norse-western-settlement']);
const helluland=twoWay('norse-helluland','voyages',base['norse-helluland'],{uncertain:true});
const vinland=twoWay('norse-vinland','voyages',base['norse-vinland'],{uncertain:true});
const nordrsetur=twoWayLeg('norse-nordrsetur','Norðrsetur hunting grounds','trade',[westSettlement,[65.5,-53.5],[67.5,-54],disko]);
const marklandTimber=twoWayLeg('norse-markland-timber','Timber voyages to Markland','trade',[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-52],[62,-58],[60.6,-62],[58.6,-61.7],markland],{uncertain:true});
const thule=twoWayLeg('norse-thule','Contact with Thule Inuit in the far north','voyages',[disko,[71,-56],[74,-60],smithSound],{uncertain:true});
const bergenTrade=twoWayLeg('norse-bergen','Bergen, Iceland and Greenland','trade',['norway',[61.5,-2],[62.2,-9],[63.5,-16],[63.5,-22.5],[64,-22.8],'iceland']);
// Wider Viking Age: raids, settlement, and the Baltic, river and North Sea trade.
const raidLindisfarne=leg('viking-lindisfarne','Norway to Lindisfarne','raids',['norway',[59.5,2],[57.5,-.5],'lindisfarne']);
const raidIona=leg('viking-iona','Northern Isles to Iona and Ireland','raids',['shetland','orkney',[58,-5.5],'hebrides','iona',[55,-6.5],'dublin']);
const raidFrisia=leg('viking-frisia','Denmark to Frisia and the Frankish coast','raids',['hedeby',[55.5,7],[53.5,5.5],'dorestad']);
const settleIsles=leg('viking-northern-isles','Settling Shetland, Orkney and the Faroes','settlement',['norway',[60.3,3],[60,-.6],'shetland','orkney',[60,-4],[61,-5.5],'faroe']);
const balticTrade=twoWayLeg('viking-baltic','Hedeby, Gotland and Birka','trade',['hedeby',[55.3,12.7],[56.5,16.5],'gotland',[58.5,18.5],'birka']);
const kaupangTrade=twoWayLeg('viking-kaupang','Kaupang and Hedeby','trade',['kaupang',[58,10.5],[56.5,10],'hedeby']);
const greatArmy=leg('viking-great-army','Danish armies to East Anglia and York','raids',['hedeby',[55.5,7],[54.5,4],[53,2],'eastAnglia',[53,.5],'york']);
const seine=leg('viking-seine','Raids up the Seine to Paris','raids',['hedeby',[55.5,7],[54,3.5],[51.5,2],[50.3,1],'seine','rouen','paris']);
const loire=leg('viking-loire','Raids on the Loire and beyond','raids',[[50.3,1],[49.5,-1.5],[48.5,-4.8],[47.3,-2.5],'nantes'],{uncertain:true});
const iberia=leg('viking-iberia','Raids toward Iberia','raids',['nantes',[46,-3],[43.5,-5],[42,-9.5],[39,-9.8],[36.5,-7],'seville'],{uncertain:true});
const danelaw=leg('viking-danelaw','Settling the Danelaw','settlement',['york',[53,.5],'eastAnglia']);
const irishTowns=leg('viking-irish-sea','Dublin, Man and the Irish Sea','settlement',['dublin',[53.8,-5.2],'man',[54.6,-3.6]]);
const icelandSettlement=leg('viking-iceland','Norway to Iceland','settlement',['norway',[61.5,-2],[62.2,-9],[63.5,-16],[63.5,-22.5],[64,-22.8],'iceland']);
const rusNorth=twoWayLeg('viking-rus-north','Birka to Ladoga and Novgorod','trade',['birka',[59.5,19.5],[59.5,23],[60,27],[60,30],'ladoga',[59.3,31.8],'novgorod']);
const dnieper=twoWayLeg('viking-dnieper','Novgorod, Kyiv and Constantinople','trade',['novgorod',[57,32],[55,32],[54.78,32.05],[53.5,30.3],'kyiv',[49,32],[47.9,35.1],[46.6,32.5],[46,31],[44,29],'constantinople']);
const volga=twoWayLeg('viking-volga','Volga route to Bulgar and Itil','trade',['novgorod',[58,34],[57.8,36.5],[57,40],[56.3,44],[55.8,48.8],'bulgar',[52.2,48],[50.8,45.5],[48.7,44.5],'itil']);
const rusRaid=leg('viking-rus-raid','Rus attack on Constantinople','raids',['kyiv',[49,32],[47.9,35.1],[46.6,32.5],[46,31],[44,29],'constantinople'],{uncertain:true});
const normandy=leg('viking-normandy','Settling Normandy','settlement',[[50.3,1],'seine','rouen']);
const greenlandSettlement=leg('viking-greenland','Iceland to Greenland','settlement',['iceland',[63.8,-25],[61.8,-35],[59.5,-43.8],[60,-46.2],[60.65,-46.2],eastSettlement]);
const maldon=leg('viking-maldon','Renewed raids on England','raids',['norway',[59.5,2],[56,2],[53,2.5],'maldon']);
const cnutEngland=leg('viking-cnut','Cnut’s conquest of England','raids',['hedeby',[55.5,7],[54.5,4],[53,2],[51.9,1.4],'london']);
const cnutNorway=leg('viking-cnut-norway','Cnut’s fleet to Norway','raids',['hedeby',[57,8],[59,5.5],'norway',[62,5],'trondheim']);
const hardrada=leg('viking-hardrada','Harald Hardrada to Stamford Bridge','raids',['trondheim',[62,5],[60.5,2],'shetland','orkney',[56,-1],[54,-.3],'stamford']);
const normans=leg('viking-normans','Normans to Hastings','raids',['rouen','seine',[50.2,.3],'hastings'],{uncertain:true});
const vinlandVoyage=leg('viking-vinland','Greenland to Vinland','voyages',[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-50.8],[63.7,-52.5],westSettlement,[63.6,-53.5],[63.5,-58.5],[63.3,-63],[62.5,-63.7],[60.6,-62],[58.6,-61.7],markland,[55.2,-58.7],[54.1,-56.8],[52.6,-55.2],meadows],{uncertain:true});
export const vinlandChapters=definePeriods('iceland-to-vinland',[
 {id:'first-raids',label:'First raids',date:'c. 790–830 CE',year:793,routes:[raidLindisfarne,raidIona,raidFrisia,settleIsles,...balticTrade,...kaupangTrade],waves:['raids','settlement','trade']},
 {id:'rus-and-danelaw',label:'Rus & Danelaw',date:'c. 860–900 CE',year:865,routes:[greatArmy,seine,loire,iberia,rusRaid,danelaw,irishTowns,icelandSettlement,settleIsles,...balticTrade,...rusNorth,...dnieper,...volga],waves:['raids','settlement','trade']},
 {id:'settlements',label:'Settlements',date:'c. 900–1000 CE',year:950,routes:[normandy,danelaw,irishTowns,icelandSettlement,greenlandSettlement,settleIsles,maldon,...balticTrade,...rusNorth,...dnieper,...volga,...openSea],waves:['raids','settlement','trade']},
 {id:'kings',label:'Kings & conquests',date:'c. 1000–1066 CE',year:1016,routes:[cnutEngland,cnutNorway,hardrada,normans,vinlandVoyage,...balticTrade,...dnieper,...openSea,...greenlandTrade],waves:['raids','voyages','trade']},
 {id:'north-atlantic',label:'Iceland to Vinland',date:'c. 870–1350 CE',year:1000,routes:[...islands,northernIsles,...faroeIceland,gaelic,...openSea,...greenland,...western,...helluland,...vinland,...nordrsetur,...marklandTimber,...thule],waves:['voyages','trade']},
],'north-atlantic',{heading:'Voyages through time',strands:relaxedStrands});
