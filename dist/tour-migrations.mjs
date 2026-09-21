// Geographic editorial schematics, NOT recovered tracks, mtDNA family trees,
// or a timeline. Dates describe regional evidence, not travel duration.
// Source assessment and limitations: human-migrations-sources.md (2026-09-21).
// Four chapters: early hominins, Neanderthals/Denisovans (with the first Homo
// sapiens departures), the main Homo sapiens expansion, and later movements.
// Two-way links show contact or range, never a claim that every ancestor moved.
import {definePeriods,bothWays} from './tour-periods.mjs?v=strands-2';
import {relaxedStrands} from './tour-origin-of-mankind-relaxed.mjs?v=strands-2';
export const migrationSources=Object.freeze({
 origins:'https://www.nature.com/articles/s41586-023-06055-y',
 misliya:'https://pubmed.ncbi.nlm.nih.gov/29371468/',
 arabia:'https://www.nature.com/articles/s41559-018-0518-2',
 levant:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10550223/',
 expansion:'https://www.nature.com/articles/s41586-025-09154-0',
 hub:'https://www.nature.com/articles/s41467-024-46161-7',
 europe:'https://www.nature.com/articles/s41586-024-08420-x',
 sahul:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12662211/',
 australia:'https://www.nature.com/articles/nature21416',
 north:'https://www.nature.com/articles/s41467-024-48762-8',
 americas:'https://www.nature.com/articles/s41586-021-03499-y',
 footprints:'https://pubs.usgs.gov/publication/fs20253046/full',
 andes:'https://www.nature.com/articles/s41467-025-58134-5',
 southAmerica:'https://www.nature.com/articles/s41586-026-10406-w',
 // Earlier hominins, archaic Eurasians, admixture and Holocene movements.
 shangchen:'https://www.nature.com/articles/s41586-018-0299-4',
 dmanisi:'https://www.science.org/doi/10.1126/science.1238484',
 sangiran:'https://www.science.org/doi/10.1126/science.aau8556',
 flores:'https://www.nature.com/articles/nature17663',
 luzon:'https://www.nature.com/articles/s41586-018-0072-8',
 atapuerca:'https://www.nature.com/articles/nature06815',
 happisburgh:'https://www.nature.com/articles/nature09117',
 erectus:'https://humanorigins.si.edu/evidence/human-fossils/species/homo-erectus',
 neanderthals:'https://humanorigins.si.edu/evidence/human-fossils/species/homo-neanderthalensis',
 denisova:'https://www.nature.com/articles/s41586-018-0455-x',
 xiahe:'https://www.nature.com/articles/s41586-019-1139-x',
 laos:'https://www.nature.com/articles/s41467-022-29923-z',
 papuans:'https://www.cell.com/cell/fulltext/S0092-8674(19)30218-1',
 irhoud:'https://www.nature.com/articles/nature22336',
 apidima:'https://www.nature.com/articles/s41586-019-1376-z',
 admixture:'https://humanorigins.si.edu/evidence/genetics/ancient-dna-and-neanderthals',
 bantu:'https://www.science.org/doi/10.1126/science.aal1988',
 backflow:'https://www.science.org/doi/10.1126/science.aad2879',
 arctic:'https://www.science.org/doi/10.1126/science.1255832',
 farmers:'https://www.nature.com/articles/nature19310',
 steppe:'https://www.nature.com/articles/nature14317',
});
const p={origin:[3.5,36],levant:[32.7,35],hub:[29,52],bengal:[23,89],sunda:[4,103],china:[34,110],altai:[49,87],yana:[68,135],alaska:[65,-160],california:[35,-120],mexico:[20,-100],montana:[46,-110],panama:[8.5,-80],colombia:[5,-74],peru:[-12,-75],chile:[-40,-73],newGuinea:[-5,139],northAustralia:[-13,131]};
const branch=(id,title,wave,period,sources,stops,uncertainty='The corridor is schematic; its exact path and timing are uncertain.')=>Object.freeze({
 id:'migration-'+id,title,wave,period,animated:true,geodesic:true,
 sources:Object.freeze(sources),uncertainty,
 coordinates:Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?p[stop]:stop))),
});
export const migrationRoutes=Object.freeze([
 branch('early-levant','Early departures through northeast Africa','early','Levant: about 194,000–90,000 years ago',['misliya','levant'],['origin',[10,32],[20,31],[28,31],[31,34],'levant']),
 branch('early-arabia','Earlier occupation of Arabia','early','Arabia: at least 85,000 years ago',['arabia','levant'],['levant',[30,37],[28,40],[27.5,41]]),
 branch('northern-exit','Nile–Sinai corridor to southwest Asia','expansion','Main expansion broadly 70,000–50,000 years ago',['levant','expansion','hub'],['origin',[10,37],[20,34],[27,33],[30,34],[33,37],[34,43],'hub'],'Northern and southern exits are alternatives or complementary corridors, not two proven, separately dated migrations.'),
 branch('southern-exit','Possible southern exit through Arabia','expansion','Main expansion broadly 70,000–50,000 years ago',['sahul','expansion'],['origin',[8,40],[11.5,43],[12.7,43.5],[14,47],[18,52],[23,56],'hub'],'The Bab el-Mandeb crossing and southern corridor remain debated; shown as a proposed route.'),
 branch('south-asia','Across southern Asia','expansion','Late Pleistocene; regional chronologies differ',['sahul','hub'],['hub',[26,57],[25,63],[24,68],[22,73],[21,79],[22,84],'bengal']),
 branch('southeast-asia','Mainland Southeast Asia to Sunda','expansion','Before the peopling of Sahul; chronology debated',['sahul'],['bengal',[22,94],[18,97],[13,100],[8,100],'sunda']),
 branch('east-asia','East Asian expansion','expansion','Broadly 50,000–40,000 years ago; earlier evidence debated',['north','hub'],['bengal',[25,96],[26,102],[29,107],'china',[40,116]]),
 branch('japan','Toward Korea and Japan','expansion','Late Pleistocene',['north'],['china',[38,118],[40,124],[36,128],[34,131],[36,139]]),
 branch('central-asia','Central Asia and the Altai','expansion','By about 45,000 years ago',['north','europe','hub'],['hub',[36,55],[40,62],[43,70],[46,78],'altai']),
 branch('europe','Southwest Asia into Europe','expansion','Europe: more than 45,000 years ago',['europe','hub'],['hub',[35,44],[38,39],[39,33],[41,28],[44,24],[47,19],[49,12],[47,6],[45,1],[40,-4]]),
 branch('siberia','Across Siberia','later','Northern expansion during the later Ice Age',['north','americas'],['altai',[58,84],[57,104],[63,123],'yana']),
 branch('beringia','Northeast Asia and Beringia','later','Ancestral population formation around 25,000 years ago; entry timing debated',['americas','southAmerica','footprints'],['yana',[66,154],[65,174],[65,-174],'alaska']),
 branch('pacific-coast','Proposed Pacific coastal dispersal','later','Americas: evidence by 23,000–21,000 years ago; route debated',['americas','footprints'],['alaska',[60,-148],[57,-136],[52,-129],[46,-124],[40,-124],'california']),
 branch('white-sands','Interior North America','later','White Sands: about 23,000–21,000 years ago',['footprints'],['california',[34,-114],[32.8,-106.3]],'The footprints date human presence, not this illustrated connection or a proven coastal itinerary.'),
 branch('interior','Later movement through the continental interior','later','Later than the earliest southern presence; roughly 14,000 years ago onward',['americas'],['alaska',[63,-143],[59,-132],[54,-120],'montana'],'The later ice-free corridor does not explain the older White Sands footprints.'),
 branch('north-america-east','Expansion across North America','later','Late Ice Age and subsequent dispersals',['americas'],['montana',[43,-100],[42,-89],[39,-80]]),
 branch('mexico','South into Mexico','later','Late Ice Age',['americas'],['california',[29,-112],[24,-105],'mexico']),
 branch('central-america','Through Central America','later','Late Ice Age',['americas','southAmerica'],['mexico',[17,-96],[15,-90],[12,-85],'panama','colombia']),
 branch('andes','Along the Andes','later','Late Ice Age; southern South America occupied by about 14,500 years ago',['andes','americas'],['colombia',[0,-78],[-5,-78],'peru',[-20,-70],[-30,-71],'chile',[-48,-73],[-53,-70]]),
 branch('south-america-east','Toward eastern South America','later','Late Ice Age and early Holocene',['andes','southAmerica'],['peru',[-15,-67],[-20,-60],[-23,-49],[-18,-43]]),
 branch('amazon','Northern South America and Amazonia','later','Late Ice Age and subsequent regional dispersals',['southAmerica'],['colombia',[1,-68],[-3,-62],[-2,-55],[0,-50]]),
 branch('later-south-america','Subsequent dispersals into South America','later','Population turnover from about 9,000 years ago; further later movements',['southAmerica'],['panama',[9,-75],[8,-68],[3,-62],[-3,-60],[-10,-55]],'Represents repeated dispersals. The 2026 genomic model identifies at least three principal movements, not three geographically resolved tracks.'),
 branch('sahul-north','Northern sea crossings into Sahul','expansion','Around 60,000 years ago in a 2025 genetic model; timing debated',['sahul'],['sunda',[3,112],[2,119],[0,123],[1,128],[-1,132],'newGuinea']),
 branch('sahul-south','Southern sea crossings into Sahul','expansion','Around 60,000 years ago in a 2025 genetic model; timing debated',['sahul'],['sunda',[-3,105],[-7,110],[-8,118],[-9,125],'northAustralia']),
 branch('sahul-east','Eastern Sahul','expansion','Southern Australia reached by about 49,000–45,000 years ago',['australia','sahul'],['newGuinea',[-10,142],[-17,145],[-25,148],[-34,147]]),
 branch('sahul-west','Western and southern Sahul','expansion','Southern Australia reached by about 49,000–45,000 years ago',['australia','sahul'],['northAustralia',[-18,124],[-25,116],[-32,117],[-34,128],[-35,139]]),
]);

// Chapter data outside the Homo sapiens network. Ranges and contact zones are
// drawn as two-way links; dispersals as one-way branches. All are uncertain.
const q={sterkfontein:[-26,27.7],ainHanech:[36.3,5.4],dmanisi:[41.7,44.3],shangchen:[34.2,110],sangiran:[-7.4,110.8],flores:[-8.6,121],luzon:[17.5,121.5],
 orce:[37.7,-2.4],atapuerca:[42.35,-3.5],happisburgh:[52.8,1.5],gibraltar:[36.1,-5.3],ferrassie:[44.95,.94],krapina:[46.2,15.9],kebara:[32.6,35],
 mezmaiskaya:[44.2,40],teshikTash:[38,67],denisova:[51.4,84.7],xiahe:[35.4,102.6],tamNguHao:[20.2,104.3],shanidar:[36.8,44.2],irhoud:[31.9,-8.9],florisbad:[-28.8,26.1],
 cameroon:[6,10],congo:[0,18],victoria:[-2,33],limpopo:[-23,30],ethiopia:[9,40],canadianArctic:[73,-95],thule:[76.5,-68.7],anatolia:[38,33],steppe:[48,40]};
const link=(id,title,wave,period,sources,stops,extra={})=>Object.freeze({
 id:'migration-'+id,title,wave,period,animated:true,geodesic:true,uncertain:true,lane:0,
 sources:Object.freeze(sources),uncertainty:'Schematic range or contact link; the exact paths and timing are uncertain.',
 coordinates:Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?q[stop]||p[stop]:stop))),...extra,
});
const twoWay=(...args)=>bothWays([link(...args,{lane:3})]);
export const homininRoutes=Object.freeze([
 // Early Homo spreads outward from the East African anchor; no return lanes, so
 // the chapter reads as expansion rather than exchange.
 link('early-homo-south','Early Homo across eastern and southern Africa','early-homo','Early Homo: more than 2 million years ago',['erectus'],['origin',[-5,35],[-15,33],[-20,29],'sterkfontein']),
 link('early-homo-north','Early Homo toward North Africa','early-homo','Early Homo: about 2.4–1.8 million years ago',['erectus'],['origin',[10,32],[20,25],[28,15],[33,8],'ainHanech']),
 link('early-homo-west','Early Homo toward the Sahel and West Africa','early-homo','Early Homo: about 2 million years ago; sparse evidence',['erectus'],['origin',[8,30],[10,22],[12,14],[13,6]]),
 link('erectus-levant','Out of Africa into the Caucasus','erectus','Dmanisi: about 1.8 million years ago',['dmanisi','erectus'],['origin',[10,37],[20,34],[27,33],[30,34],'levant',[36,37],[39,41],'dmanisi']),
 link('erectus-asia','Southern Asia toward Java','erectus','Sangiran: about 1.3 million years ago',['sangiran','erectus'],['levant',[33,42],[33,48],[30,60],[27,68],[22,76],[20,84],'bengal',[18,97],[13,100],[8,100],[2,104],[-4,106],'sangiran']),
 link('erectus-china','Into East Asia','erectus','Shangchen tools: about 2.1 million years ago; Zhoukoudian later',['shangchen','erectus'],['bengal',[25,96],[26,102],[29,107],'shangchen',[38,113],[40,116]]),
 link('erectus-flores','Sea gaps to Flores and Luzon','erectus','Flores: by about 1 million years ago; Luzon: about 700,000 years ago',['flores','luzon'],['sangiran',[-8,116],'flores',[-5,124],[2,124],[10,123],'luzon']),
 link('erectus-europe','Into Europe','erectus','Southern Spain: about 1.4 million years ago; Atapuerca: about 1.2 million',['atapuerca','happisburgh'],['levant',[37,34],[40,29],[43,24],[45,15],[43,8],[41,2],'orce',[40,-3],'atapuerca']),
 link('erectus-britain','Northern Europe in warm phases','erectus','Happisburgh: about 900,000 years ago',['happisburgh'],[[43,8],[46,4],[49,2],'happisburgh']),
]);
export const archaicRoutes=Object.freeze([
 ...twoWay('neanderthal-west','Neanderthal Europe','neanderthal','Neanderthals: about 400,000–40,000 years ago',['neanderthals'],['gibraltar',[40,-3],[43,-1],'ferrassie',[47,5],[48,10],'krapina']),
 ...twoWay('neanderthal-east','Balkans to the Levant','neanderthal','Neanderthals: about 400,000–40,000 years ago',['neanderthals'],['krapina',[44,22],[41,28],[38,33],[36,36],'kebara']),
 ...twoWay('neanderthal-caucasus','Levant, Caucasus and Central Asia','neanderthal','Neanderthals reached the Altai by about 120,000 years ago',['neanderthals','denisova'],['kebara',[36,40],[40,43],'mezmaiskaya',[44,50],[42,60],'teshikTash',[43,72],[48,80],'denisova']),
 ...twoWay('denisovan-tibet','Altai to the Tibetan Plateau','denisovan','Xiahe mandible: about 160,000 years ago',['denisova','xiahe'],['denisova',[47,90],[42,96],[38,100],'xiahe']),
 ...twoWay('denisovan-southeast','Toward Southeast Asia','denisovan','Laos molar: about 164,000–131,000 years ago',['laos','papuans'],['xiahe',[28,104],'tamNguHao',[10,104],[2,110]]),
 ...twoWay('sapiens-africa-north','Connected African populations: north','sapiens-africa','Jebel Irhoud: about 300,000 years ago',['irhoud','origins'],['origin',[10,30],[18,20],[25,10],[30,0],'irhoud']),
 ...twoWay('sapiens-africa-south','Connected African populations: south','sapiens-africa','Florisbad: about 260,000 years ago',['origins'],['origin',[-5,35],[-15,32],[-22,28],'florisbad']),
]);
export const admixtureRoutes=Object.freeze([
 ...twoWay('admixture-near-east','Neanderthal contact in southwest Asia','admixture','Shared admixture: about 50,000–45,000 years ago',['europe','admixture'],['levant',[34,39],'shanidar']),
 ...twoWay('admixture-wallacea','Denisovan contact toward Sahul','admixture','Before the settlement of Sahul',['papuans'],[[2,110],[0,123],[-1,132],'newGuinea']),
]);
export const holoceneRoutes=Object.freeze([
 link('holocene-farmers','Anatolian farmers into Europe','holocene','From about 8,500 years ago',['farmers'],['anatolia',[41,28],[44,24],[47,19],[49,12],[47,6],[45,1]]),
 link('holocene-steppe','Steppe ancestry into Europe','holocene','About 5,000 years ago',['steppe'],['steppe',[50,30],[52,20],[52,10]]),
 link('holocene-backflow','Eurasian ancestry back into Africa','holocene','Repeated; strongly by about 3,000 years ago',['backflow'],['levant',[30,33],[24,35],[15,39],'ethiopia']),
 link('holocene-bantu','Bantu-speaking expansions','holocene','About 5,000–1,500 years ago',['bantu'],['cameroon','congo','victoria',[-12,32],'limpopo']),
 link('holocene-bantu-west','Western Bantu stream','holocene','About 5,000–1,500 years ago',['bantu'],['cameroon',[-2,11],[-8,14],[-14,15]]),
 link('holocene-arctic','Paleo-Inuit and Thule across the Arctic','holocene','About 5,000 years ago, then about 1,000 years ago',['arctic'],['alaska',[70,-150],[70,-130],[70,-110],'canadianArctic',[75,-80],'thule',[72,-55]]),
]);
// Named anchors are the hard stops for corridor relaxation (scripts/relax-tour-routes.py).
export const migrationPlaces=Object.freeze({...p,...q});
const sapiens=wave=>migrationRoutes.filter(r=>r.wave===wave);
export const migrationChapters=definePeriods('origin-of-mankind',[
 {id:'early-hominins',label:'Early hominins',date:'c. 2 million–500,000 years ago',year:-2000000,routes:homininRoutes,waves:['early-homo','erectus']},
 {id:'archaic-eurasia',label:'Neanderthals & Denisovans',date:'c. 400,000–60,000 years ago',year:-400000,routes:[...archaicRoutes,...sapiens('early')],waves:['neanderthal','denisovan','sapiens-africa','early']},
 {id:'sapiens-expansion',label:'Homo sapiens expansion',date:'c. 70,000–40,000 years ago',year:-70000,routes:[...sapiens('expansion'),...admixtureRoutes],waves:['expansion','admixture']},
 {id:'later-movements',label:'Later movements',date:'c. 25,000 years ago onward',year:-25000,routes:[...sapiens('later'),...holoceneRoutes],waves:['later','holocene']},
],'sapiens-expansion',{heading:'Waves of dispersal',strands:relaxedStrands});
