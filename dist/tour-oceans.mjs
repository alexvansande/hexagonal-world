// Editorial schematic of the ocean-going networks that joined the world's seas:
// the Indian Ocean monsoon trade and Ming treasure fleets, the Iberian Atlantic
// and Cape routes, then the galleons and chartered companies. Lines are trade
// lanes between ports, not voyages of named captains; `uncertain` marks
// inferred links. Sources: ocean-crossings-sources.md.
import {definePeriods,bothWays} from './tour-periods.mjs?v=strands-2';
import {relaxedStrands} from './tour-ocean-crossings-relaxed.mjs?v=strands-2';
export const oceanPlaces={
 nanjing:[32.06,118.8],changle:[25.96,119.5],quanzhou:[24.87,118.67],guangzhou:[23.13,113.26],champa:[13.8,109.2],ayutthaya:[14.35,100.57],surabaya:[-7.25,112.75],malacca:[2.2,102.25],pasai:[5.2,97.1],galle:[6.03,80.2],calicut:[11.25,75.78],cambay:[22.31,72.62],hormuz:[27.07,56.46],aden:[12.8,45],jeddah:[21.5,39.2],mogadishu:[2.05,45.3],malindi:[-3.2,40.1],kilwa:[-8.96,39.5],ryukyu:[26.2,127.7],
 venice:[45.44,12.34],alexandria:[31.2,29.9],cairo:[30.05,31.2],lisbon:[38.7,-9.14],seville:[37.39,-5.99],cadiz:[36.5,-6.3],palos:[37.2,-6.9],madeira:[32.7,-17],canaries:[28.1,-15.4],capeVerde:[15,-23.5],azores:[38.7,-27.2],goodHope:[-34.4,18.5],mozambique:[-15,40.7],hispaniola:[19,-70],portoSeguro:[-16.4,-39.1],elmina:[5.08,-1.35],
 acapulco:[16.85,-99.9],manila:[14.6,121],potosi:[-19.6,-65.75],arica:[-18.5,-70.3],callao:[-12.05,-77.1],panama:[8.95,-79.5],portobelo:[9.55,-79.65],havana:[23.1,-82.4],veracruz:[19.2,-96.1],cartagena:[10.4,-75.5],
 amsterdam:[52.37,4.9],capeTown:[-33.9,18.4],batavia:[-6.2,106.8],deshima:[32.7,129.9],london:[51.5,-.1],bombay:[19.07,72.88],madras:[13.08,80.27],calcutta:[22.57,88.36],canton:[23.13,113.26],bristol:[51.45,-2.6],nantes:[47.2,-1.55],bordeaux:[44.84,-.58],jamaica:[18,-77],barbados:[13.1,-59.6],saintDomingue:[19.7,-72.2],salvador:[-12.97,-38.5],rio:[-22.9,-43.2],yorkFactory:[57,-92.3],quebec:[46.8,-71.2],laRochelle:[46.16,-1.15],charleston:[32.8,-79.9],
};
const p=oceanPlaces;
const coords=stops=>Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?p[stop]:stop)));
const flow=(id,title,wave,stops,extra={})=>Object.freeze({id:'ocean-'+id,title,wave,animated:true,geodesic:true,lane:0,coordinates:coords(stops),...extra});
const twoWay=(id,title,wave,stops,extra={})=>bothWays([flow(id,title,wave,stops,{lane:3,...extra})]);
const treasure=['nanjing',[31.5,121.5],'changle',[22,116],[18,111],'champa',[10,109],[4,106],'surabaya',[-3,108],'malacca','pasai',[6,90],'galle',[8,77],'calicut',[15,68],[22,62],'hormuz'];
const westIndianOcean=['calicut',[12,65],[13,52],'aden',[10,48],'mogadishu',[0,43],'malindi'];
export const mingRoutes=Object.freeze([
 ...twoWay('treasure-fleets','Ming treasure fleets from Nanjing to Hormuz','porcelain-silk',treasure),
 ...twoWay('treasure-africa','Treasure fleets to Aden and the Swahili coast','porcelain-silk',westIndianOcean),
 ...twoWay('gujarat-aden','Gujarat, Aden and the Red Sea','cotton-cloth',['cambay',[18,66],[14,54],'aden',[13,43],[18,40],'jeddah']),
 ...twoWay('gujarat-malacca','Gujarat and Malabar to Malacca','cotton-cloth',['cambay',[15,71],'calicut',[7,78],[5,88],[5,96],'malacca']),
 ...twoWay('malacca-china','Malacca to the China coast','porcelain-silk',['malacca',[3,106],[8,110],[16,113],[21,115],'quanzhou']),
 ...twoWay('ryukyu','Ryukyu between Japan, China and Southeast Asia','porcelain-silk',['ryukyu',[22,122],[16,118],'malacca'],{uncertain:true}),
 ...twoWay('swahili-cambay','Swahili coast and Gujarat on the monsoon','cotton-cloth',['kilwa',[-3,48],[6,58],[15,66],'cambay']),
 flow('spice-route','Spices from Malacca to Alexandria and Venice','spices-pepper',['malacca',[5,96],[6,90],'galle',[8,77],'calicut',[12,65],[13,52],'aden',[13,43],[18,40],'jeddah',[24,36],[28,33],'cairo',[30.3,31.1],'alexandria',[33,25],[38,18],[41,16],'venice']),
 flow('bullion-east','Silver and gold eastward for spices','bullion',['venice',[41,16],[38,18],[33,25],'alexandria',[30.3,31.1],'cairo',[28,33],[24,36],'jeddah',[18,40],[13,43],'aden',[13,52],[12,65],'calicut'],{lane:-3}),
]);
export const iberianRoutes=Object.freeze([
 ...twoWay('cape-route','Lisbon to India around the Cape','spices-pepper',['lisbon',[33,-14],'madeira',[24,-20],'capeVerde',[5,-25],[-10,-32],[-25,-30],[-34,-5],'goodHope',[-30,32],[-22,38],'mozambique',[-8,41],'malindi',[2,55],[8,68],'calicut']),
 flow('cape-bullion','Silver and copper eastward for pepper','bullion',['lisbon',[33,-14],'madeira',[24,-20],'capeVerde',[5,-25],[-10,-32],[-25,-30],[-34,-5],'goodHope',[-30,32],[-22,38],'mozambique',[-8,41],'malindi',[2,55],[8,68],'calicut'],{lane:-3}),
 flow('columbus-crossing','Atlantic crossings to the Caribbean','cotton-cloth',['palos',[33,-11],'canaries',[24,-30],[20,-50],'hispaniola']),
 flow('atlantic-return','Return on the westerlies','bullion',['hispaniola',[25,-65],[33,-50],'azores',[38,-15],'seville'],{lane:3}),
 flow('brazil-route','Portuguese ships to Brazil','cotton-cloth',['lisbon',[33,-14],'madeira',[24,-20],'capeVerde',[5,-25],[-8,-32],'portoSeguro'],{lane:3}),
 flow('gold-coast-lisbon','Gold Coast gold to Lisbon','bullion',['elmina',[3,-4],[5,-15],[15,-25],[25,-22],[33,-14],'lisbon']),
 flow('spice-route-2','The older spice route through the Red Sea continues','spices-pepper',['calicut',[12,65],[13,52],'aden',[13,43],[18,40],'jeddah',[24,36],[28,33],'cairo',[30.3,31.1],'alexandria',[33,25],[38,18],[41,16],'venice'],{lane:3}),
 ...twoWay('gujarat-malacca-2','Gujarat and Malabar to Malacca','cotton-cloth',['cambay',[15,71],'calicut',[7,78],[5,88],[5,96],'malacca']),
 ...twoWay('malacca-china-2','Malacca to the China coast','porcelain-silk',['malacca',[3,106],[8,110],[16,113],[21,115],'quanzhou']),
]);
export const galleonRoutes=Object.freeze([
 flow('manila-galleon-west','Silver from Acapulco to Manila','bullion',['acapulco',[13,-115],[12,-140],[11,-165],[12,170],[13,145],'manila']),
 flow('manila-galleon-east','Silk and porcelain from Manila to Acapulco','porcelain-silk',['manila',[20,125],[30,140],[38,165],[40,-170],[36,-140],[25,-115],'acapulco'],{lane:3}),
 flow('canton-manila','Chinese goods to Manila','porcelain-silk',['canton',[20,116],[17,119],'manila']),
 flow('potosi-silver','Potosí silver to the Pacific coast','bullion',['potosi',[-19,-68],'arica',[-16,-73],'callao']),
 flow('callao-panama','Silver north to Panama','bullion',['callao',[-8,-80],[-2,-81],[5,-79],'panama',[9.3,-79.6],'portobelo'],{lane:3}),
 flow('treasure-fleet','Treasure fleets to Havana and Cádiz','bullion',['portobelo',[10.5,-77],'cartagena',[15,-78],[21,-84],'havana',[27,-79],[32,-65],[36,-45],[37,-25],'cadiz']),
 flow('veracruz-havana','New Spain silver via Veracruz','bullion',['veracruz',[21,-93],[22,-86],'havana'],{lane:3}),
 flow('cadiz-outbound','Goods and migrants to the Indies','cotton-cloth',['cadiz',[30,-15],'canaries',[20,-30],[16,-50],[14,-63],'cartagena',[9.8,-77],'portobelo'],{lane:-3}),
 ...twoWay('voc-route','Dutch East India Company to Batavia','spices-pepper',['amsterdam',[49,-5],[35,-18],[10,-25],[-20,-30],[-38,0],'capeTown',[-36,50],[-25,90],[-10,105],'batavia']),
 flow('voc-japan','Batavia to Deshima','porcelain-silk',['batavia',[0,108],[10,112],[22,120],[29,127],'deshima'],{lane:3}),
 ...twoWay('eic-route','East India Company to Bombay, Madras and Calcutta','cotton-cloth',['london',[48,-8],[35,-18],[10,-25],[-20,-30],[-36,10],[-34,30],[-20,45],[0,62],'bombay',[10,76],'madras',[15,85],'calcutta']),
 flow('canton-tea','Tea and porcelain from Canton','porcelain-silk',['canton',[18,112],[5,108],[-2,104],[-8,102],[-20,90],[-36,50],'capeTown',[-38,0],[-20,-30],[10,-25],[35,-18],[48,-8],'london'],{lane:3}),
 flow('sugar-europe','Sugar, tobacco and rum to Europe','sugar-tobacco',['jamaica',[22,-75],[30,-65],[38,-45],[46,-20],'bristol']),
 flow('sugar-france','Saint-Domingue sugar to Nantes and Bordeaux','sugar-tobacco',['saintDomingue',[24,-68],[33,-50],[42,-25],'nantes'],{lane:3}),
 flow('brazil-sugar','Brazilian sugar and gold to Lisbon','sugar-tobacco',['salvador',[-5,-32],[10,-28],[25,-22],[35,-14],'lisbon']),
 flow('brazil-gold','Minas Gerais gold to Lisbon','bullion',['rio',[-15,-35],[-5,-32],[10,-28],[25,-22],[35,-14],'lisbon'],{lane:3}),
 flow('hudson-furs','Hudson Bay furs to London','furs',['yorkFactory',[60,-85],[62,-70],[60,-50],[56,-25],'london']),
 flow('quebec-furs','St Lawrence furs to La Rochelle','furs',['quebec',[48,-62],[47,-40],[46,-15],'laRochelle'],{lane:3}),
 flow('charleston-rice','Rice and indigo to Britain','sugar-tobacco',['charleston',[34,-70],[40,-50],[48,-20],'bristol'],{lane:3}),
]);
export const oceanChapters=definePeriods('ocean-crossings',[
 {id:'ming-and-monsoon',label:'Ming & the monsoon',date:'c. 1420 CE',year:1420,routes:mingRoutes,waves:['porcelain-silk','cotton-cloth','spices-pepper','bullion']},
 {id:'iberian-routes',label:'Iberian routes',date:'c. 1500 CE',year:1500,routes:iberianRoutes,waves:['spices-pepper','bullion','cotton-cloth','porcelain-silk']},
 {id:'galleons-and-companies',label:'Galleons & companies',date:'c. 1750 CE',year:1750,routes:galleonRoutes,waves:['bullion','porcelain-silk','spices-pepper','cotton-cloth','sugar-tobacco','furs']},
],'iberian-routes',{heading:'Crossings through time',strands:relaxedStrands});
