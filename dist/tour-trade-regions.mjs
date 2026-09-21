// Selected regional distribution corridors, not borders or a single-period atlas.
// Named junctions keep internal networks connected to the international routes.
export function regionalTradeLinks({rome,antioch,alexandria,barygaza,xian,mathura}){
 const p={rome,antioch,alexandria,barygaza,xian,mathura,
  constantinople:[41.01,28.98],thessaloniki:[40.64,22.94],dyrrachium:[41.32,19.45],brindisi:[40.63,17.94],
  massilia:[43.3,5.37],lyon:[45.76,4.84],milan:[45.46,9.19],trier:[49.75,6.64],london:[51.51,-.09],cordoba:[37.89,-4.78],tarraco:[41.12,1.25],
  luoyang:[34.62,112.45],yangzhou:[32.39,119.42],hangzhou:[30.25,120.16],chengdu:[30.67,104.06],wuhan:[30.59,114.3],guangzhou:[23.13,113.26],youzhou:[39.9,116.4],
  ujjain:[23.18,75.78],paithan:[19.48,75.38],pataliputra:[25.61,85.14],tamralipti:[22.3,87.92],muziris:[10.2,76.2],arikamedu:[11.9,79.82],
 };
 const result={};
 const link=(id,region,title,stops,flows)=>{result[id]={region,title,coordinates:stops.map(stop=>typeof stop==='string'?p[stop]:stop),flows};};
 // Each flow is [commodity, screen lane, reverse]. Supply heads toward hubs;
 // imported goods branch out into regional distribution networks.
 const chinese=[['silk',-4,false],['horses',4,true]];
 link('china-capitals','china','Luoyang and Chang’an',['luoyang',[34.76,111.2],[34.58,110.1],'xian'],chinese);
 link('china-canal','china','Jiangnan and the Sui–Tang canal corridors',['hangzhou',[31.3,120.6],[31.8,119.97],'yangzhou',[33.6,119.02],[34.3,117.2],[34.44,115.65],[34.8,114.3],'luoyang'],[['silk',0,false]]);
 link('china-sichuan','china','Sichuan and the Qinling passes',['chengdu',[31.46,104.74],[32.44,105.84],[33.07,107.02],[34.36,107.24],'xian'],[['silk',0,false]]);
 link('china-yangtze','china','Yangtze and the central plains',['yangzhou',[32.06,118.8],[31.33,118.38],[30.52,117.05],[29.73,115.99],'wuhan',[32.01,112.12],[33,112.53],'luoyang'],[['silk',0,false]]);
 link('china-lingnan','china','Pearl–Lingqu–Xiang river connection',['guangzhou',[23.05,112.46],[23.48,111.3],[24.5,110.4],[25.27,110.29],[25.61,110.67],[26.22,111.62],[26.89,112.58],[28.23,112.94],[29.36,113.13],'wuhan'],[['silk',0,false]]);
 link('china-north','china','Northern plain to Youzhou',['luoyang',[35.3,113.9],[36.1,114.35],[37.5,114.6],[38.87,115.46],'youzhou'],[['horses',0,false]]);

 const indian=[['spices-cotton',-4,false],['gold-silver',4,true]];
 link('india-malwa','india','Ujjain to Barygaza',['ujjain',[22.6,75.7],[22.1,74.5],'barygaza'],indian);
 link('india-mathura','india','Mathura and Malwa',['mathura',[26.9,76.6],[25.2,75.85],[24.1,75.7],'ujjain'],[...indian,['silk',0,false]]);
 link('india-ganges','india','Ganges plain and northern road',['tamralipti',[24.1,88.25],[25.2,87.0],'pataliputra',[25.32,83.0],[25.45,81.84],[27,79.9],'mathura'],indian);
 link('india-deccan','india','Deccan to the western ports',['paithan',[20.0,73.8],[20.95,72.92],'barygaza'],indian);
 link('india-narmada','india','Malwa–Narmada–Deccan',['ujjain',[22.18,75.59],[21.3,76.23],[20.5,75.75],'paithan'],[['silk',0,false]]);
 link('india-west-coast','india','Malabar to the Gujarat ports',['muziris',[11.3,75.6],[12.8,74.65],[15.3,73.6],[17,73.1],[18.95,72.7],[20.5,72.6],'barygaza'],[['spices-cotton',-6,false],['glass-metals',0,true],['gold-silver',6,true]]);
 link('india-south','india','Tamil country and the Palghat gap',['arikamedu',[11.9,78.15],[11.34,77.72],[10.99,76.96],[10.78,76.65],[10.5,76.2],'muziris'],[['spices-cotton',-4,false],['glass-metals',4,true]]);

 // Roman Europe: representative road/river corridors and coastal shipping.
 const roman=[['gold-silver',-4,false],['silk',4,true]];
 link('europe-iberia','europe','Baetica and the Spanish Mediterranean coast',['cordoba',[37.39,-4.0],[37.63,-1.7],[37.6,-.98],[38.35,-.48],[39.46,-.38],'tarraco',[41.4,2.2],[42.4,3.3],[43.18,3.0],'massilia'],roman);
 link('europe-west-mediterranean','europe','Massilia and the Italian coast',['massilia',[43.1,6.5],[43.6,7.3],[44.3,8.8],[44,9.8],[43.5,10.1],[42.5,11.1],[41.75,12.25],'rome'],[...roman,['glass-metals',0,false]]);
 link('europe-rhone','europe','Rhône corridor',['lyon',[45.52,4.87],[44.93,4.89],[43.68,4.63],'massilia'],[...roman,['glass-metals',0,false]]);
 link('europe-rhine','europe','Rhine and Moselle to Gaul',[[50.94,6.96],'trier',[49.12,6.18],[48.68,5.9],[47.32,5.04],'lyon'],roman);
 link('europe-britain','europe','Britain, Channel crossing and Gaul',['london',[51.28,1.08],[51.13,1.31],[50.73,1.61],[49.89,2.3],[49.26,4.03],[47.86,4.57],'lyon'],[['glass-metals',-4,false],['silk',4,true]]);
 link('europe-italy','europe','Po valley and central Italy',['milan',[45.05,9.7],[44.5,11.34],[44.06,12.57],[43.84,13.02],[43.35,12.91],[42.56,12.64],'rome'],roman);

 // Constantinople ties Anatolia, the Aegean and the Via Egnatia together.
 const byzantine=[['silk',-4,false],['gold-silver',4,true]];
 link('byzantium-anatolia','byzantium','Antioch to Constantinople',['antioch',[36.92,34.9],[37.35,34.8],[37.97,34.68],[37.87,32.48],[38.76,30.54],[39.77,30.52],[40.43,29.72],[40.77,29.92],'constantinople'],byzantine);
 link('byzantium-egnatia','byzantium','Via Egnatia',['constantinople',[41.15,27.8],[40.85,25.87],[41.01,24.28],[40.82,23.85],'thessaloniki',[40.8,22.05],[41.03,21.33],[41.12,20.8],'dyrrachium'],byzantine);
 link('byzantium-italy','byzantium','Adriatic crossing and Via Appia',['dyrrachium','brindisi',[40.48,17.24],[40.99,15.66],[41.13,14.78],[41.11,14.21],[41.35,13.4],'rome'],byzantine);
 link('byzantium-aegean','byzantium','Aegean ports and Constantinople',['antioch',[36,35.8],[35,34],[35.8,29.5],[36.3,28.1],[37.8,26.8],[39,25.8],[40,26],[40.4,26.7],[40.8,28],'constantinople'],[['spices-cotton',0,false]]);
 link('byzantium-levant','byzantium','Alexandria and the Levantine ports',['alexandria',[31.5,32.3],[31.4,34],[32.8,34.8],[33.9,35.3],[35.4,35.6],'antioch'],[['spices-cotton',0,false]]);
 return result;
}
