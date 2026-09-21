// Editorial schematic of pre-Columbian exchange, not surveyed trade roads or
// volume estimates. Waypoints are [latitude, longitude] along plausible coastal,
// river and highland corridors. `uncertain` marks hypotheses or contested
// provenance rather than well-documented sourcing. Sources: americas-exchange-sources.md.
import {definePeriods,bothWays} from './tour-periods.mjs?v=chapters-1';
const p={
 chayal:[14.7,-90.4],pachuca:[20.1,-98.7],sanLorenzo:[17.75,-94.75],laVenta:[18.1,-94],motagua:[15,-89.5],teotihuacan:[19.7,-98.85],kaminaljuyu:[14.63,-90.55],tikal:[17.2,-89.6],copan:[14.84,-89.14],
 soconusco:[15,-92.5],chichen:[20.68,-88.57],tula:[20.05,-99.35],tenochtitlan:[19.43,-99.13],xicalango:[18.6,-91.9],cozumel:[20.4,-86.9],ulua:[15.7,-88.6],guanaja:[16.45,-85.9],mayapan:[20.63,-89.46],colima:[19,-104.3],
 balsas:[18,-100],paquime:[30.4,-107.95],chaco:[36.06,-107.96],zuni:[35.1,-108.8],yellowstone:[44.8,-110.7],hopewell:[39.4,-83],superior:[47.5,-88],tampa:[27.8,-82.6],cahokia:[38.65,-90.06],moundville:[33,-87.6],spiro:[35.3,-94.6],etowah:[34.1,-84.8],
 orinoco:[8.6,-62.5],trinidad:[10.5,-61.3],grenada:[12.1,-61.7],guadeloupe:[16.2,-61.6],puertoRico:[18.2,-66.5],hispaniola:[18.9,-70.2],cuba:[21.5,-78],
 santaElena:[-2.2,-80.9],manta:[-1,-80.7],buenaventura:[3.9,-77],panama:[8.5,-80],cacaoAmazon:[-4.5,-79],chavin:[-9.6,-77.2],ucayali:[-8.4,-74.5],moche:[-8.1,-79],lambayeque:[-6.7,-79.8],chanChan:[-8.1,-79.1],
 wari:[-13.1,-74.2],pikillacta:[-13.6,-71.7],cusco:[-13.5,-72],cerroBaul:[-17.1,-70.85],tiwanaku:[-16.55,-68.67],moquegua:[-17.2,-70.9],cochabamba:[-17.4,-66.2],atacama:[-22.9,-68.2],madreDeDios:[-12.5,-69.2],
 quito:[-.2,-78.5],cajamarca:[-7.2,-78.5],huanuco:[-9.9,-76.8],chincha:[-13.4,-76.1],laPaz:[-16.5,-68.2],tupiza:[-21.4,-65.7],santiago:[-33.4,-70.6],
 marajo:[-.9,-49.5],santarem:[-2.4,-54.7],manaus:[-3.1,-60],casiquiare:[2,-66.9],guianas:[5,-55],southwestAmazon:[-12,-63],
};
const coords=stops=>Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?p[stop]:stop)));
const flow=(id,title,wave,stops,extra={})=>Object.freeze({id:'americas-'+id,title,wave,animated:true,lane:0,coordinates:coords(stops),...extra});
const twoWay=(id,title,wave,stops,extra={})=>bothWays([flow(id,title,wave,stops,{lane:3,...extra})]);
const gulfCoast=['soconusco',[16.5,-94],[18.5,-96]];
export const earlyRoutes=Object.freeze([
 flow('early-obsidian-chayal','El Chayal obsidian to the Olmec heartland','obsidian',['chayal',[15.5,-92],[16.5,-94],'sanLorenzo']),
 flow('early-obsidian-pachuca','Central Mexican obsidian to the Gulf coast','obsidian',['pachuca',[19,-97.5],[18.3,-96],'sanLorenzo'],{lane:3}),
 flow('early-jade','Motagua jade to La Venta','jade',['motagua',[16,-91],[17.2,-93],'laVenta']),
 flow('early-spondylus','Spondylus from Ecuador to Chavín','shell',['santaElena',[-4,-81],[-6,-80],[-8,-79],'chavin']),
 ...twoWay('early-amazon-chavin','Tropical forest goods and Chavín','feathers',['ucayali',[-9,-76],'chavin'],{uncertain:true}),
 flow('early-maize','Maize spreading south','crops',['balsas',[16,-96],[14,-90],[12,-86],[9,-80],'panama',[5,-75],[1,-78],[-4,-79.5],[-8,-79]],{uncertain:true}),
 flow('early-cacao','Cacao from the upper Amazon toward Mesoamerica','crops',['cacaoAmazon','manta','buenaventura','panama',[12,-86],'soconusco'],{uncertain:true,lane:3}),
 flow('early-manioc','Manioc from the southwest Amazon along the rivers','crops',['southwestAmazon',[-8,-60],'manaus',[0,-62],'casiquiare','orinoco','trinidad'],{uncertain:true}),
]);
export const classicRoutes=Object.freeze([
 flow('classic-obsidian-teotihuacan','Pachuca obsidian to Teotihuacan and the Maya','obsidian',['pachuca','teotihuacan',[18.5,-96],[17,-93],[15.5,-91],'kaminaljuyu',[15.8,-89.8],'tikal']),
 flow('classic-obsidian-chayal','El Chayal obsidian to the lowland Maya','obsidian',['chayal','kaminaljuyu',[15.8,-89.8],'tikal'],{lane:3}),
 flow('classic-obsidian-hopewell','Yellowstone obsidian to Hopewell earthworks','obsidian',['yellowstone',[44,-100],[42,-92],[40.5,-88],'hopewell']),
 flow('classic-jade-tikal','Motagua jade to Copán and Tikal','jade',['motagua','copan',[16,-89.5],'tikal']),
 flow('classic-jade-teotihuacan','Maya jade toward Teotihuacan','jade',['motagua',[15.5,-90.5],'kaminaljuyu',[15.5,-92],[16.5,-94],[18.5,-96],'teotihuacan'],{lane:-3}),
 flow('classic-shell-hopewell','Gulf shell to the Ohio valley','shell',['tampa',[31,-84],[35,-85],'hopewell']),
 flow('classic-spondylus','Spondylus to the Moche coast','shell',['santaElena',[-4,-81],[-6,-80],'moche']),
 flow('classic-copper-hopewell','Lake Superior copper to the Ohio valley','metals',['superior',[45,-87],[42,-85],'hopewell'],{lane:3}),
 flow('classic-cacao','Soconusco cacao to Teotihuacan','crops',[...gulfCoast,'teotihuacan'],{lane:3}),
 flow('classic-saladoid','Saladoid pottery makers through the Lesser Antilles','ceramics',['orinoco','trinidad','grenada',[13.5,-61.2],[14.6,-61],'guadeloupe',[17.3,-63],'puertoRico']),
 ...twoWay('classic-amazon-river','Marajó, Santarém and the middle Amazon','ceramics',['marajo',[-1.5,-52],'santarem',[-2.8,-57.5],'manaus'],{uncertain:true}),
 ...twoWay('classic-arawak','Rio Negro, Casiquiare and the Orinoco','ceramics',['manaus',[0,-63],'casiquiare',[5,-66],'orinoco'],{uncertain:true}),
]);
export const andeanRoutes=Object.freeze([
 flow('andean-obsidian-chichen','Pachuca obsidian to Tula and Chichén Itzá','obsidian',['pachuca','tula',[20,-97],[19.5,-93],[20,-90.5],'chichen']),
 flow('andean-spondylus-coast','Spondylus to Lambayeque and Chimú lords','shell',['santaElena',[-4,-81],[-6,-80],'lambayeque','chanChan']),
 flow('andean-spondylus-highlands','Spondylus into the Wari and Tiwanaku highlands','shell',['chanChan',[-10,-77.5],[-12,-76],'wari',[-14,-72],[-16,-70],'tiwanaku'],{uncertain:true}),
 flow('andean-shell-cahokia','Gulf shell to Cahokia','shell',['tampa',[30,-88],[33,-90],'cahokia']),
 flow('andean-copper-cahokia','Lake Superior copper to Cahokia','metals',['superior',[45,-89],[41,-90],'cahokia'],{lane:3}),
 ...twoWay('andean-vertical','Tiwanaku, the coast and the eastern valleys','crops',['moquegua',[-17,-69.5],'tiwanaku',[-17.2,-67.5],'cochabamba']),
 ...twoWay('andean-atacama','Tiwanaku and San Pedro de Atacama','feathers',['tiwanaku',[-19,-68.5],[-21,-68.3],'atacama']),
 ...twoWay('andean-wari','Wari roads to Cusco and Moquegua','feathers',['wari','pikillacta',[-15,-71.5],'cerroBaul']),
 ...twoWay('andean-amazon','Eastern slopes and the highlands','feathers',['madreDeDios',[-14,-69.5],'tiwanaku'],{uncertain:true}),
 flow('andean-macaws','Scarlet macaws to Chaco Canyon','feathers',[[17,-96],[20,-100],[24,-104],[28,-107],[32,-108],'chaco'],{uncertain:true}),
 flow('andean-cacao-chaco','Cacao to Chaco Canyon','crops',[[17,-96],[20,-100],[24,-104],[28,-107],[32,-108],'chaco'],{uncertain:true,lane:3}),
 flow('andean-metallurgy','Metalworking knowledge by sea to West Mexico','metals',['manta','buenaventura','panama',[12,-88],[16,-96],'colima'],{uncertain:true}),
 ...twoWay('andean-marajo','Marajoara mounds and the lower Amazon','ceramics',['marajo',[-1.5,-52],'santarem'],{uncertain:true}),
 ...twoWay('andean-negro-orinoco','Middle Amazon, Rio Negro and Orinoco','ceramics',['santarem',[-2.8,-57.5],'manaus',[0,-63],'casiquiare',[5,-66],'orinoco'],{uncertain:true}),
 flow('andean-muiraquita','Muiraquitã greenstone amulets toward the Guianas and Caribbean','jade',['santarem',[1,-52],'guianas',[8,-59],'trinidad'],{uncertain:true}),
 ...twoWay('andean-ucayali','Ucayali lowlands and the central highlands','feathers',['ucayali',[-9,-76],'huanuco'],{uncertain:true}),
]);
export const lateRoutes=Object.freeze([
 flow('late-obsidian-tenochtitlan','Pachuca obsidian to Tenochtitlan','obsidian',['pachuca','tenochtitlan']),
 flow('late-pochteca','Pochteca merchants to the Gulf and Soconusco','obsidian',['tenochtitlan',[18.5,-96],[17.5,-93.5],'xicalango']),
 flow('late-pochteca-south','Pochteca merchants to Soconusco','obsidian',['tenochtitlan',[18.5,-96],[16.5,-94],'soconusco'],{lane:3}),
 flow('late-cacao','Soconusco cacao to Tenochtitlan','crops',[...gulfCoast,'tenochtitlan'],{lane:-3}),
 flow('late-quetzal','Quetzal feathers from the Maya highlands','feathers',[[15.5,-90.3],'soconusco',[16.5,-94],[18.5,-96],'tenochtitlan'],{lane:-6}),
 flow('late-maya-canoes','Maya canoe trade around Yucatán','crops',['ulua',[16.5,-88.2],[18.5,-87.6],'cozumel',[21.5,-88],[21,-90.5],[19.5,-91.5],'xicalango']),
 flow('late-macaws','Paquimé macaws to the Pueblo world','feathers',['paquime',[33,-108.5],'zuni']),
 flow('late-shell-mississippi','Gulf shell to Moundville and Spiro','shell',['tampa',[30,-86],'moundville',[34.5,-90],'spiro']),
 flow('late-copper-etowah','Lake Superior copper to Etowah','metals',['superior',[43,-86],[39,-85],[36,-85],'etowah']),
 flow('late-spondylus','Spondylus to Chincha and Cusco','shell',['santaElena',[-6,-80],[-10,-78],'chincha',[-13.7,-73.5],'cusco']),
 flow('late-inca-north','Qhapaq Ñan: gold and tribute from Quito to Cusco','metals',['quito','cajamarca','huanuco',[-11.5,-75],'cusco'],{lane:3}),
 flow('late-inca-south','Qhapaq Ñan: silver from the south','metals',['santiago',[-27,-69],'tupiza',[-19.5,-66],'laPaz',[-15,-70],'cusco'],{lane:3}),
 flow('late-cumbi-north','Fine cloth distributed from Cusco','feathers',['cusco',[-11.5,-75],'huanuco','cajamarca','quito'],{lane:3}),
 flow('late-cumbi-south','Fine cloth distributed from Cusco','feathers',['cusco',[-15,-70],'laPaz',[-19.5,-66],'tupiza',[-27,-69],'santiago'],{lane:3}),
 ...twoWay('late-amazon','Coca, feathers and the Inca eastern frontier','feathers',['madreDeDios',[-13,-70.5],'cusco'],{uncertain:true}),
 flow('late-guanin','Guanín gold-copper alloys from the mainland','metals',['orinoco','trinidad','grenada',[14.6,-61],'guadeloupe',[17.3,-63],'puertoRico','hispaniola'],{uncertain:true}),
 ...twoWay('late-taino-cuba','Taíno exchange: Hispaniola and Cuba','ceramics',['hispaniola',[20,-74],'cuba']),
 ...twoWay('late-taino-puerto-rico','Taíno exchange: Hispaniola and Puerto Rico','ceramics',['hispaniola','puertoRico']),
 ...twoWay('late-tapajos','Santarém pottery along the lower Amazon','ceramics',['santarem',[-1.5,-52],'marajo'],{uncertain:true}),
 ...twoWay('late-amazon-river','Middle Amazon and Rio Negro','ceramics',['santarem',[-2.8,-57.5],'manaus',[0,-63],'casiquiare'],{uncertain:true}),
 ...twoWay('late-ucayali','Ucayali lowlands and the Inca frontier','feathers',['ucayali',[-9,-76],'huanuco'],{uncertain:true}),
]);
export const americasChapters=definePeriods('americas-exchange',[
 {id:'early-exchange',label:'Early exchange',date:'c. 1000 BCE',year:-1000,routes:earlyRoutes,waves:['obsidian','jade','shell','crops','feathers']},
 {id:'classic',label:'Classic & Hopewell',date:'c. 400 CE',year:400,routes:classicRoutes,waves:['obsidian','jade','shell','metals','crops','ceramics']},
 {id:'andean-networks',label:'Wari, Tiwanaku & Chaco',date:'c. 1000 CE',year:1000,routes:andeanRoutes,waves:['obsidian','jade','shell','metals','crops','feathers','ceramics']},
 {id:'late-precolumbian',label:'Aztec, Inca & Taíno',date:'c. 1450 CE',year:1450,routes:lateRoutes,waves:['obsidian','shell','crops','metals','feathers','ceramics']},
],'late-precolumbian',{heading:'Exchange through time'});
