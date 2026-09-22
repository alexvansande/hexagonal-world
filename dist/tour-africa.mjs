// Editorial schematic of African exchange networks: trans-Saharan caravans, the
// Nile and Red Sea, the Swahili coast and, later, the Atlantic. Routes are
// corridors between known towns, mines and ports, not itineraries; `uncertain`
// marks inferred links. Enslaved people are drawn as a wave of their own so the
// trade is named, never folded into "goods". Sources: african-networks-sources.md.
import {definePeriods,bothWays} from './tour-periods.mjs?v=strands-2';
import {relaxedStrands} from './tour-african-networks-relaxed.mjs?v=strands-2';
export const africaPlaces={
 lepcis:[32.6,14.3],garama:[26.5,13.4],gao:[16.3,-.05],timbuktu:[16.77,-3],djenne:[13.9,-4.55],meroe:[16.9,33.7],aswan:[24.1,32.9],alexandria:[31.2,29.9],cairo:[30.05,31.2],aksum:[14.1,38.7],adulis:[15.26,39.66],zeila:[11.4,43.5],aden:[12.8,45],
 sijilmasa:[31.3,-4.3],fez:[34.03,-5],taghaza:[23.6,-5],walata:[17.3,-7],koumbi:[15.8,-8],bambuk:[12.5,-11],niani:[11.4,-8.6],tuat:[27.9,-.3],ghadames:[30.1,9.5],tripoli:[32.9,13.2],kanem:[13.5,14.5],dongola:[18.2,30.7],
 kilwa:[-8.96,39.5],zanzibar:[-6.16,39.2],mogadishu:[2.05,45.3],sofala:[-20.2,34.7],zimbabwe:[-20.3,30.9],mapungubwe:[-22.2,29.4],siraf:[27.67,52.34],hormuz:[27.07,56.46],cambay:[22.31,72.62],muscat:[23.6,58.6],jeddah:[21.5,39.2],
 elmina:[5.08,-1.35],akan:[6.7,-1.6],benin:[6.3,5.6],saoTome:[.3,6.7],mbanza:[-6.27,14.25],arguin:[20.6,-16.5],capeVerde:[15,-23.5],ouidah:[6.35,2.1],bonny:[4.4,7.2],loango:[-4.6,12.1],luanda:[-8.8,13.2],kazembe:[-10,28.7],mozambique:[-15,40.7],
 jamaica:[18,-77],barbados:[13.1,-59.6],salvador:[-12.97,-38.5],rio:[-22.9,-43.2],charleston:[32.8,-79.9],saintDomingue:[19.7,-72.2],lisbon:[38.7,-9.14],
};
const p=africaPlaces;
const coords=stops=>Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?p[stop]:stop)));
const flow=(id,title,wave,stops,extra={})=>Object.freeze({id:'africa-'+id,title,wave,animated:true,lane:0,coordinates:coords(stops),...extra});
const twoWay=(id,title,wave,stops,extra={})=>bothWays([flow(id,title,wave,stops,{lane:3,...extra})]);
const sahara=['sijilmasa',[28,-5],'taghaza',[20.5,-6.5],'walata'];
export const garamantesRoutes=Object.freeze([
 ...twoWay('garamantes','Garamantes between the Fezzan and the coast','salt-copper',['lepcis',[30.5,13.5],'garama'],{uncertain:true}),
 flow('garamantes-sahel','Fezzan toward the Niger bend','captives',[[16.3,-.05],[19,3],[22,8],[24.5,11.5],'garama'],{uncertain:true}),
 flow('meroe-nile','Meroë to Egypt along the Nile','gold-ivory',['meroe',[19.5,31.5],[21.5,31],'aswan',[26,32.8],[29.5,31.1],'alexandria']),
 flow('aksum-adulis','Aksum to its port at Adulis','gold-ivory',['aksum',[14.6,39.2],'adulis']),
 ...twoWay('aksum-arabia','Aksum and South Arabia across the Red Sea','cloth-beads',['adulis',[14,41.5],[13,44]]),
 flow('nile-cloth','Egyptian and Roman goods up the Nile','cloth-beads',['alexandria',[29.5,31.1],[26,32.8],'aswan',[21.5,31],'meroe'],{lane:3}),
]);
export const ghanaRoutes=Object.freeze([
 flow('ghana-gold','Gold from Bambuk to the Sahara','gold-ivory',['bambuk',[14,-9.5],'koumbi','walata',[20.5,-6.5],'taghaza',[28,-5],'sijilmasa',[33,-4.8],'fez']),
 flow('ghana-salt','Salt from Taghaza to the Sahel','salt-copper',['taghaza',[20.5,-6.5],'walata','koumbi',[15,-5.5],'djenne'],{lane:3}),
 flow('ghana-cloth','Cloth, copper and beads south across the Sahara','cloth-beads',['fez',[33,-4.8],'sijilmasa',[28,-5],'taghaza',[20.5,-6.5],'walata','koumbi'],{lane:-3}),
 flow('kanem-tripoli','Kanem to Tripoli through the Fezzan','captives',['kanem',[17,14],[21,14],[24.5,12],'garama',[30.5,13.5],'tripoli']),
 flow('nubia-cairo','Nubia to Cairo','captives',['dongola',[21,31],'aswan',[26,32.8],[29.5,31.1],'cairo']),
 ...twoWay('swahili-gulf','Swahili coast and the Persian Gulf','cloth-beads',['kilwa','zanzibar',[0,44],'mogadishu',[8,50],[15,53],[22,58],'siraf']),
 flow('swahili-ivory','Ivory and gold from the Swahili coast','gold-ivory',['kilwa','zanzibar',[0,44],'mogadishu',[8,50],[15,53],[22,58],'siraf'],{lane:-3}),
 flow('swahili-captives','Enslaved people shipped from the Swahili coast','captives',['zanzibar',[0,44],'mogadishu',[8,50],[15,53],[22,58],'siraf'],{lane:-6}),
 flow('mapungubwe-sofala','Limpopo gold to the coast','gold-ivory',['mapungubwe',[-21.5,32.5],'sofala',[-16,38],[-11,40],'kilwa'],{uncertain:true}),
]);
export const maliRoutes=Object.freeze([
 flow('mali-gold','Mali gold to Sijilmasa and Fez','gold-ivory',['bambuk',[12,-9],'niani',[14,-6],'djenne','timbuktu',[20,-4],'taghaza',[28,-5],'sijilmasa',[33,-4.8],'fez']),
 flow('mali-salt','Salt to Timbuktu and the Niger','salt-copper',['taghaza',[20,-4],'timbuktu','djenne'],{lane:3}),
 flow('mali-cloth','Cloth, copper, horses and books south','cloth-beads',['fez',[33,-4.8],'sijilmasa',[28,-5],'taghaza',[20,-4],'timbuktu'],{lane:-3}),
 flow('mali-cairo','Timbuktu and Gao to Cairo','gold-ivory',['timbuktu','gao',[20,2],[24,5.5],'tuat',[28.5,5],[30,9],'ghadames',[30.5,16],[30.5,24],'cairo'],{lane:3}),
 flow('mali-tripoli','Gao to Tripoli','captives',['gao',[20,2],[24,5.5],[27,9],'ghadames',[31.5,11.5],'tripoli']),
 flow('kanem-tripoli-2','Kanem–Bornu to Tripoli','captives',['kanem',[17,14],[21,14],[24.5,12],'garama',[30.5,13.5],'tripoli'],{lane:3}),
 flow('nubia-cairo-2','Nubia to Cairo','captives',['dongola',[21,31],'aswan',[26,32.8],[29.5,31.1],'cairo']),
 ...twoWay('kilwa-aden','Kilwa, Aden and Hormuz','cloth-beads',['kilwa','zanzibar',[0,44],'mogadishu',[9,49],'aden',[14,50],[20,57],'hormuz']),
 ...twoWay('kilwa-cambay','Kilwa and Gujarat on the monsoon','cloth-beads',['kilwa',[-3,48],[6,58],[15,66],'cambay']),
 flow('zimbabwe-sofala','Great Zimbabwe gold to Sofala and Kilwa','gold-ivory',['zimbabwe',[-20.5,32.5],'sofala',[-16,38],[-11,40],'kilwa']),
 flow('kilwa-ivory','Ivory and gold to Arabia and India','gold-ivory',['kilwa',[-3,48],[6,58],[15,66],'cambay'],{lane:-3}),
 ...twoWay('ethiopia-zeila','Ethiopian highlands and the Red Sea','cloth-beads',[[9,39],[10.5,41.5],'zeila',[12.5,44],'aden']),
 flow('ethiopia-captives','Enslaved people to the Red Sea','captives',[[9,39],[10.5,41.5],'zeila',[13,43.5],[18,40.5],'jeddah'],{lane:3}),
]);
export const songhaiRoutes=Object.freeze([
 flow('songhai-gold','Songhai gold across the Sahara','gold-ivory',['bambuk',[12,-9],[14,-6],'djenne','timbuktu',[20,-4],'taghaza',[28,-5],'sijilmasa',[33,-4.8],'fez']),
 flow('songhai-salt','Salt to the Niger bend','salt-copper',['taghaza',[20,-4],'timbuktu','gao'],{lane:3}),
 flow('songhai-cloth','Cloth, horses and books south','cloth-beads',['fez',[33,-4.8],'sijilmasa',[28,-5],'taghaza',[20,-4],'timbuktu'],{lane:-3}),
 flow('songhai-cairo','Gao and Timbuktu to Cairo','gold-ivory',['timbuktu','gao',[20,2],[24,5.5],'tuat',[28.5,5],[30,9],'ghadames',[30.5,16],[30.5,24],'cairo'],{lane:3}),
 flow('songhai-tripoli','Enslaved people to Tripoli','captives',['gao',[20,2],[24,5.5],[27,9],'ghadames',[31.5,11.5],'tripoli']),
 flow('bornu-tripoli','Bornu to Tripoli','captives',['kanem',[17,14],[21,14],[24.5,12],'garama',[30.5,13.5],'tripoli'],{lane:3}),
 flow('akan-elmina','Akan gold to Elmina','gold-ivory',['akan',[6,-1.5],'elmina']),
 flow('elmina-lisbon','Gold and pepper to Lisbon','gold-ivory',['elmina',[3,-4],[5,-15],[15,-25],[25,-22],[33,-14],'lisbon'],{lane:3}),
 flow('lisbon-elmina','Cloth, brass and beads to the Gold Coast','cloth-beads',['lisbon',[33,-14],[25,-22],[15,-25],[5,-15],[3,-4],'elmina'],{lane:-3}),
 flow('benin-cloth','Benin cloth and pepper to the coast','cloth-beads',['benin',[5.5,5],[3,3],'saoTome'],{uncertain:true}),
 flow('kongo-captives','Enslaved people from Kongo to São Tomé','captives',['mbanza',[-5.5,12.5],[-3,10],'saoTome']),
 flow('arguin-captives','Senegambia to Arguin and Iberia','captives',[[14.7,-17.4],'arguin',[24,-17],[30,-13],'lisbon'],{uncertain:true}),
 ...twoWay('kilwa-cambay-2','Kilwa and Gujarat on the monsoon','cloth-beads',['kilwa',[-3,48],[6,58],[15,66],'cambay']),
 flow('zimbabwe-sofala-2','Zimbabwe plateau gold to Sofala','gold-ivory',['zimbabwe',[-20.5,32.5],'sofala',[-16,38],[-11,40],'kilwa']),
]);
export const atlanticRoutes=Object.freeze([
 flow('senegambia-atlantic','Senegambia to the Caribbean','captives',[[14.7,-17.4],[13,-30],[15,-45],[16,-58],'barbados',[16,-70],'jamaica']),
 flow('gold-coast-atlantic','Gold Coast to Jamaica and Charleston','captives',['elmina',[3,-8],[6,-25],[12,-40],[16,-55],'jamaica',[24,-78],'charleston'],{lane:3}),
 flow('bight-benin-atlantic','Bight of Benin to Bahia','captives',['ouidah',[3,0],[-3,-15],[-9,-30],'salvador']),
 flow('biafra-atlantic','Bight of Biafra to the Caribbean','captives',['bonny',[2,4],[4,-10],[8,-30],[14,-50],[17,-62],'saintDomingue'],{lane:-3}),
 flow('angola-brazil','Loango and Luanda to Brazil','captives',['luanda',[-10,8],[-14,-5],[-18,-20],[-22,-35],'rio']),
 flow('loango-caribbean','Loango to the Caribbean','captives',['loango',[-2,8],[2,-10],[8,-30],[14,-50],[17,-62],'saintDomingue'],{lane:3}),
 flow('atlantic-goods','Textiles, guns, rum and iron to the coast','cloth-beads',['lisbon',[30,-15],[20,-20],[12,-19],[8,-14],[5,-6],'elmina',[4,2],'ouidah',[4,6],'bonny'],{lane:-3}),
 flow('interior-coast','Captives marched from the interior','captives',['kazembe',[-9,24],[-8,19],[-8,15],'luanda'],{uncertain:true}),
 flow('ashanti-gold','Asante gold and captives to the coast','gold-ivory',['akan',[6,-1.5],'elmina']),
 flow('interior-sahel','Sahel captives to the Atlantic coast','captives',[[13.5,-8],[12,-12],[13.5,-15],[14.7,-17.4]],{uncertain:true}),
 flow('sahara-tripoli-3','Trans-Saharan trade to Tripoli continues','captives',['kanem',[17,14],[21,14],[24.5,12],'garama',[30.5,13.5],'tripoli']),
 flow('sahara-gold-3','Sahel gold to Morocco','gold-ivory',['timbuktu',[20,-4],'taghaza',[28,-5],'sijilmasa',[33,-4.8],'fez'],{lane:3}),
 flow('swahili-oman','Zanzibar and Kilwa to Oman and the Gulf','captives',['kilwa','zanzibar',[0,44],'mogadishu',[9,49],[15,54],[20,58],'muscat']),
 ...twoWay('zanzibar-india','Zanzibar cloth and ivory trade with India','cloth-beads',['zanzibar',[-3,48],[6,58],[15,66],'cambay']),
 flow('mozambique-brazil','Mozambique to Brazil','captives',['mozambique',[-20,38],[-30,25],[-34,10],[-30,-10],[-25,-30],'rio'],{uncertain:true}),
 flow('ethiopia-jeddah','Red Sea captive trade','captives',[[9,39],[10.5,41.5],'zeila',[13,43.5],[18,40.5],'jeddah']),
]);
export const africaChapters=definePeriods('african-networks',[
 {id:'garamantes-and-aksum',label:'Garamantes & Aksum',date:'c. 200 CE',year:200,routes:garamantesRoutes,waves:['gold-ivory','salt-copper','cloth-beads','captives']},
 {id:'ghana-and-swahili',label:'Ghana & Swahili coast',date:'c. 950 CE',year:950,routes:ghanaRoutes,waves:['gold-ivory','salt-copper','cloth-beads','captives']},
 {id:'mali-and-kilwa',label:'Mali & Kilwa',date:'c. 1300 CE',year:1300,routes:maliRoutes,waves:['gold-ivory','salt-copper','cloth-beads','captives']},
 {id:'songhai-and-portuguese',label:'Songhai & the Portuguese',date:'c. 1480 CE',year:1480,routes:songhaiRoutes,waves:['gold-ivory','salt-copper','cloth-beads','captives']},
 {id:'atlantic-slave-trade',label:'Atlantic slave trade',date:'c. 1750 CE',year:1750,routes:atlanticRoutes,waves:['captives','cloth-beads','gold-ivory']},
],'mali-and-kilwa',{heading:'Networks through time',strands:relaxedStrands});
