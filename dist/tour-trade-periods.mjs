// Loaded only when the Silk Road story is opened. These are editorial networks
// around four dates, not measured itineraries or annual trade-volume estimates.
import {definePeriods} from './tour-periods.mjs?v=strands-2';
import {relaxedStrands} from './tour-silk-road-relaxed.mjs?v=strands-2';
import {silkRoadRoutes} from './tour-route-data.mjs?v=trade-periods-1';
import {silkTradeRoutes} from './tour-trade.mjs?v=trade-regions-1';

const mixed=silkTradeRoutes(silkRoadRoutes);
export const tradePlaces={
 rome:[41.9,12.5],antioch:[36.2,36.16],alexandria:[31.2,29.9],constantinople:[41.01,28.98],
 baghdad:[33.31,44.37],ctesiphon:[33.09,44.58],ray:[35.59,51.44],bukhara:[39.77,64.43],samarkand:[39.65,66.97],
 urgench:[42.32,59.15],bolgar:[54.97,49.05],itil:[46,47.8],saray:[47.2,47.4],saraychik:[47.5,51.7],
 ladoga:[60,32.3],novgorod:[58.52,31.28],kyiv:[50.45,30.52],crimea:[45.03,35.38],
 cambay:[22.31,72.62],multan:[30.2,71.47],kannauj:[27.05,79.92],delhi:[28.61,77.21],
 kollam:[8.89,76.59],nagapattinam:[10.77,79.84],sriLanka:[6,80.2],siraf:[27.67,52.34],hormuz:[27.07,56.46],
 guangzhou:[23.13,113.26],quanzhou:[24.87,118.67],hangzhou:[30.25,120.16],yangzhou:[32.39,119.42],
 xian:[34.26,108.94],beijing:[39.9,116.4],karakorum:[47.2,102.82],almaliq:[44.2,80.5],
 venice:[45.44,12.34],genoa:[44.41,8.93],tabriz:[38.08,46.29],
 cyprus:[35.13,33.94],ugarit:[35.6,35.78],byblos:[34.12,35.65],mycenae:[37.73,22.76],crete:[35.3,25.2],
 hattusa:[40.02,34.62],babylon:[32.54,44.42],nileDelta:[30.8,31.8],thebes:[25.72,32.65],nubia:[19.6,33.4],
 lothal:[22.5,72.2],magan:[23.6,58.5],dilmun:[26.2,50.6],ur:[30.96,46.1],badakhshan:[36.7,70.8],balkh:[36.75,66.9],merv:[37.66,62.19],sambia:[54.8,20.5],carnuntum:[48.2,16.4],aquileia:[45.8,13.4],gawasis:[26.6,34],adulis:[15.26,39.66],berenike:[23.9,35.5],
};
const p=tradePlaces;
const coords=stops=>stops.map(stop=>typeof stop==='string'?p[stop]:stop);
const flow=(id,wave,stops,lane=0,extra={})=>({id,title:id,wave,lane,animated:true,coordinates:coords(stops),...extra});
const reverse=(r,id=r.id+'-return',wave=r.wave)=>({...r,id,wave,coordinates:[...r.coordinates].reverse()});
const bronze=[
 flow('bronze-tin-atlantic','tin',[[50.2,-5.2],[49.8,-5.5],[48.5,-4.8],[47.3,-2.3],[47.2,-.6],[47.3,2],[47,4.8],[46.3,4.9],[45.76,4.84],[44.93,4.89],[43.68,4.63],[43.2,5.2]],0,{uncertain:true}),
 flow('bronze-tin-mediterranean','tin',[[43.2,5.2],[41.3,7.7],[39,8.2],[37.4,10],[36.3,13],[35.3,19],'crete',[35.4,27.4],[35.9,29.7],[36.1,32.3],'cyprus','ugarit'],-4,{uncertain:true}),
 flow('bronze-tin-anatolia','tin',['ugarit',[36.5,36.5],[37,35.9],[37.35,34.8],[38.7,34.8],'hattusa'],0,{uncertain:true}),
 // Proposed eastern supply chain. These regional anchors do not identify a
 // proven exporting mine or a recovered Late Bronze Age itinerary.
 flow('bronze-tin-central-asia','tin',[[39.7,66.3],[38.8,66.5],[37.3,67.3],[36.75,66.9]],0,{uncertain:true}),
 flow('bronze-tin-hindukush','tin',[[35.5,70.5],[36.7,69.5],[36.75,66.9]],0,{uncertain:true}),
 flow('bronze-tin-iran','tin',[[36.75,66.9],[36,64.5],[34.35,62.2],[35.2,60.6],[36.2,59.6],[36.2,57.7],[36.4,54.95],[35.6,53.4],'ray',[34.8,48.5],[34.3,47.1],[34.3,45.2],'babylon'],0,{uncertain:true}),
 flow('bronze-tin-mesopotamia','tin',['babylon',[33.4,43.3],[35.3,40.1],[36.5,38.1],[36.2,37.2],'ugarit'],-4,{uncertain:true}),
 flow('bronze-tin-eastern-mediterranean','tin',['ugarit','cyprus',[36.1,32.3],[35.9,29.7],[35.4,27.4],'crete'],-4,{uncertain:true}),
 flow('bronze-copper-aegean','copper',['cyprus',[36.1,32.3],[36.2,30],[35.9,28],[36,26.5],'crete',[36,24.5],[37,23.2],'mycenae'],-4),
 flow('bronze-copper-levant','copper',['cyprus','ugarit',[34.6,35.6],'byblos'],4),
 flow('bronze-copper-egypt','copper',['cyprus',[33.5,33.7],[31.5,32.3],'nileDelta'],4),
 flow('bronze-copper-west','copper',['crete',[35.3,19],[36.3,13],[37.4,10],[39,8.2]],0),
 flow('bronze-gold-nile','gold-silver',['nubia',[21,31],[22.3,31.6],[24.1,32.9],'thebes',[27.2,31],[29.9,31.2],'nileDelta'],0),
 flow('bronze-gold-levant','gold-silver',['nileDelta',[31.5,32.3],[31.4,34],[33,35],'byblos',[34.6,35.6],'ugarit'],-4),
 flow('bronze-gold-syria','gold-silver',['ugarit',[36.2,37.2],[36.5,38.1],[35.3,40.1],[33.4,43.3],'babylon'],0),
 flow('bronze-glass-egypt','glass-metals',['thebes',[27.2,31],[29.9,31.2],'nileDelta',[31.5,32.3],[33.5,33.7],'cyprus',[36.1,32.3],[36.2,30],[35.9,28],'crete'],0),
 flow('bronze-timber','timber',['byblos',[33,35],[31.4,34],[31.5,32.3],'nileDelta'],4),
 flow('bronze-textiles','textiles-pottery',['babylon',[33.4,43.3],[35.3,40.1],[36.5,38.1],[36.2,37.2],'ugarit'],4),
 flow('bronze-pottery-cyprus','textiles-pottery',['mycenae',[37,23.2],[36,24.5],'crete',[35.9,28],[36.2,30],[36.1,32.3],'cyprus'],4),
 flow('bronze-pottery-levant','textiles-pottery',['cyprus','ugarit'],0),
 // Wider Bronze Age world: Indus–Gulf shipping, Afghan lapis lazuli, Baltic amber and Punt.
 flow('bronze-indus-gulf','lapis-amber',['lothal',[22,68],[24,62],'magan',[25.5,55],'dilmun',[28.5,49],'ur'],0),
 flow('bronze-lapis','lapis-amber',['badakhshan','balkh','merv',[36.2,58.8],[35.6,53.4],'ray',[34.8,48.5],[33.5,44.4],'babylon'],-4),
 flow('bronze-amber','lapis-amber',['sambia',[53,17],[50.5,15.5],[48,16],[47,15],'aquileia',[44,13.5],[41,17.5],[39,19.5],[38,21.5],'mycenae'],0,{uncertain:true}),
 flow('bronze-punt','gold-silver',['adulis',[18,40],[22,37.5],'gawasis',[26,33],'thebes'],0,{uncertain:true}),
];

// Remove explicitly later institutions and hubs from the Roman/Han snapshot.
// Ctesiphon replaces Baghdad (founded in 762); no Sui canal or Constantinople hub.
const ancient=[...mixed.filter(r=>r.region!=='byzantium'&&!r.id.endsWith('china-canal')).map(r=>({
 ...r,coordinates:r.coordinates.map(([lat,lon])=>lat===33.31&&lon===44.37?p.ctesiphon:[lat,lon]),
})),
 // Beyond the Silk Road proper: the Amber Road to Rome and Aksum's Red Sea port.
 flow('ancient-amber','lapis-amber',['sambia',[53,17],[50.5,15.5],'carnuntum',[47,15],'aquileia',[44.5,11.3],[43.5,11.2],'rome'],0),
 flow('ancient-adulis','spices-cotton',['adulis',[18,40],[22,37.5],'berenike'],0),
];

// Medieval overland backbone: inland Asian corridors persist, while the western
// distribution network and maritime ports change. Palmyra/Roman ocean legs drop out.
const backbone=mixed.filter(r=>(r.region==='china'||r.id==='trade-horses-fergana'||
 ['hexi','tarim-north','tarim-south','dzungarian','fergana','pamir','bactria','india','persia'].some(id=>r.id===`trade-silk-${id}`||r.id===`trade-horses-${id}`)));
const early=[...backbone,
 ...mixed.filter(r=>r.id.includes('byzantium-')&&!r.id.endsWith('byzantium-levant')),
 flow('early-baghdad-syria','silk',['baghdad',[34.2,42.4],[35.95,39],[36.2,37.16],'antioch'],-4),
 flow('early-baghdad-spices','spices-cotton',['baghdad',[34.2,42.4],[35.95,39],[36.2,37.16],'antioch'],4),
 flow('early-byzantine-silk','silk',['constantinople',[40.8,28],[40.4,26.7],[40,26],[39,25.8],[37.8,26.8],[36.3,24],[36.3,20],[37,16],[38.8,14.5],'rome'],0),
];
const india=(prefix,port)=>[
 flow(prefix+'-ganges','spices-cotton',[[22.3,87.92],[24.1,88.25],[25.61,85.14],[25.32,83],'kannauj',[26.9,76.6],[23.18,75.78],'cambay'],-4),
 flow(prefix+'-indus','spices-cotton',['multan',[28.4,70.3],[26.2,68.4],[24.7,67.4],[23.5,68.5],'cambay'],0),
 flow(prefix+'-deccan','spices-cotton',[[19.48,75.38],[20,73.8],[20.95,72.92],'cambay'],0),
 flow(prefix+'-malabar','spices-cotton',['kollam',[10.5,75.9],[12.8,74.65],[15.3,73.6],[18.95,72.7],[20.5,72.6],'cambay'],-4),
 flow(prefix+'-tamil','spices-cotton',['nagapattinam',[9.2,80],[6.5,81.8],'sriLanka',[7,77.5],'kollam'],0),
 flow(prefix+'-gulf','spices-cotton',['cambay',[20,69],[22,62],[24,59.5],[26,56.7],port],-4),
 flow(prefix+'-gulf-silver','gold-silver',[port,[26,56.7],[24,59.5],[22,62],[20,69],'cambay'],-4),
];
early.push(...india('early','siraf'),
 flow('early-siraf-baghdad','spices-cotton',['siraf',[28.9,50.3],[29.7,48.5],[30.5,47.8],[32,45.8],'baghdad'],0),
 flow('early-baghdad-silver','gold-silver',['baghdad',[32,45.8],[30.5,47.8],[29.7,48.5],[28.9,50.3],'siraf'],4),
 flow('early-china-sea','silk',['guangzhou',[22,113.5],[18,111],[12,109.5],[6,104],[1.2,104],[1.5,102],[3.5,100],[6,97],[6,90],'sriLanka',[7,77.5],'kollam'],-4),
 flow('early-sogdian-silver','gold-silver',['bukhara',[41,61],'urgench',[44,57],[46,53],[49,49],[52,49],'bolgar'],4),
 flow('early-caspian-silver','gold-silver',['baghdad',[34.31,47.07],[34.8,48.52],'ray',[36.7,51.5],[38.5,51],[41,50],[44,49],'itil',[48.7,44.5],[50.8,45.5],[52.2,48],'bolgar'],0),
 flow('early-northern-silver','gold-silver',['bolgar',[55.8,48.8],[56.3,44],[57,40],[57.8,36.5],[58,34],'novgorod',[59,31.5],'ladoga',[60.2,30],[59.8,26],[59,21],[59.33,18.06]],-4),
 flow('early-northern-furs','furs',['ladoga',[59,31.5],'novgorod',[58,34],[57.8,36.5],[57,40],[56.3,44],[55.8,48.8],'bolgar',[49,49],[46,53],[44,57],'urgench',[41,61],'bukhara'],-4),
 flow('early-dnieper','furs',['novgorod',[57,32],[55,32],[54.78,32.05],[53.5,30.3],'kyiv',[49,32],[47.9,35.1],[46.6,32.5],[46,31],[44,29],'constantinople'],0),
);

// A 13th–14th-century view: Black Sea/Volga links, Mongol corridors and southern
// Chinese shipping. Do not carry over a Roman European road network unchanged.
const high=[...backbone.filter(r=>!r.id.endsWith('china-north')),
 ...india('high','hormuz'),
 flow('high-delhi','spices-cotton',['kannauj','delhi',[29.4,74.5],'multan'],0),
 flow('high-yuan-capital','silk',['hangzhou',[31.3,120.6],'yangzhou',[34.5,118],[36.7,116],[38.5,116.7],'beijing'],0),
 flow('high-quanzhou','silk',['hangzhou',[29.9,121.5],[28,121],[26.1,119.5],'quanzhou'],0),
 flow('high-mongolia','silk',['beijing',[40.8,111.7],[43,109],[45,105],'karakorum',[47,96],[46,90],[44.5,85],'almaliq',[43.3,77.24],[42.8,75.2],[42.9,71.37],[41.3,69.24],'samarkand'],-4),
 flow('high-china-sea','silk',['quanzhou',[23,118],[19,113],[12,109.5],[6,104],[1.2,104],[1.5,102],[3.5,100],[6,97],[6,90],'sriLanka',[7,77.5],'kollam'],-4),
 flow('high-porcelain','ceramics',['quanzhou',[23,118],[19,113],[12,109.5],[6,104],[1.2,104],[1.5,102],[3.5,100],[6,97],[6,90],'sriLanka',[7,77.5],'kollam',[11,73],[17,65],[24,59.5],'hormuz'],4),
 flow('high-hormuz-tabriz','spices-cotton',['hormuz',[28,55],[29.6,52.5],[32.65,51.67],[34.6,50],[36.67,48.5],'tabriz'],0),
 flow('high-persia-tabriz','silk',['ray',[36.67,48.5],'tabriz'],0),
 flow('high-horde','silk',['samarkand','bukhara',[41,61],'urgench',[44,57],[46,53],'saraychik','saray',[47.1,43],[47.1,39.4],[46.3,37.5],'crimea'],-4),
 flow('high-volga','furs',['novgorod',[58,34],[57.8,36.5],[57,40],[56.3,44],[55.8,48.8],'bolgar',[52.2,48],[50.8,45.5],[48.7,44.5],'saray','saraychik',[46,53],[44,57],'urgench'],0),
 flow('high-black-sea','silk',['crimea',[44,34],[42,31],'constantinople'],-4),
 flow('high-trebizond','silk',['tabriz',[39,44],[40,41.3],[41,39.7],[42,37],[42,31],'constantinople'],0),
 flow('high-venice','silk',['constantinople',[40.4,26.7],[39,25.8],[37.8,26.8],[36.3,24],[36.3,20],[39,19.3],[41.5,17],[44,13.5],'venice'],-4),
 flow('high-genoa','silk',['constantinople',[40.4,26.7],[39,25.8],[37.8,26.8],[36.3,24],[36.3,20],[36.3,16],[38.3,12.8],[41.3,9.7],'genoa'],0),
 flow('high-red-sea','spices-cotton',['kollam',[11,73],[12,60],[12,46],[12.6,43.4],[18,40],[26,34.2],[25.9,32.8],[27.2,31],'alexandria'],0),
 flow('high-egypt-venice','spices-cotton',['alexandria',[32,28],[34,23],[36.3,20],[39,19.3],[41.5,17],[44,13.5],'venice'],0),
 flow('high-italian-silver','gold-silver',['venice',[44,13.5],[41.5,17],[39,19.3],[36.3,20],[36.3,24],[37.8,26.8],[39,25.8],[40.4,26.7],'constantinople',[42,31],[44,34],'crimea'], -4),
];
// Indian goods also move east; silk/ceramics move through the same maritime hubs.
early.push(reverse(early.find(r=>r.id==='early-china-sea'),'early-spices-east','spices-cotton'));
high.push(reverse(high.find(r=>r.id==='high-china-sea'),'high-spices-east','spices-cotton'));

const trade=definePeriods('silk-road',[
 {id:'bronze-age',label:'Bronze Age',date:'c. 1300 BCE',year:-1300,routes:bronze,waves:['tin','copper','gold-silver','glass-metals','timber','textiles-pottery','lapis-amber']},
 {id:'antiquity',label:'Antiquity',date:'c. 150 CE',year:150,routes:ancient,waves:['silk','gold-silver','glass-metals','horses','spices-cotton','lapis-amber']},
 {id:'early-middle-ages',label:'Early Middle Ages',date:'c. 900 CE',year:900,routes:early,waves:['silk','gold-silver','horses','spices-cotton','furs']},
 {id:'high-middle-ages',label:'High Middle Ages',date:'c. 1300 CE',year:1300,routes:high,waves:['silk','gold-silver','horses','spices-cotton','furs','ceramics']},
],'antiquity',{heading:'Trade through time',strands:relaxedStrands});
export const tradePeriods=trade.periods;
export const defaultTradePeriod=trade.defaultId;
export const tradePeriod=trade.periodFor;
export const tradeHeading=trade.heading;
