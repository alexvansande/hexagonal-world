// Editorial schematic, not surveyed caravan tracks. Waypoints are [latitude,
// longitude]; intermediate points follow the main oasis chains and corridors.
// This combines routes used in different periods, not one simultaneous itinerary.
export const silkRoadSources=Object.freeze([
 {title:'UNESCO · Chang’an–Tianshan corridor',url:'https://whc.unesco.org/en/list/1442/'},
 {title:'Encyclopaedia Iranica · Tarim and Dzungarian routes',url:'https://www.iranicaonline.org/articles/chinese-turkestan-ii/'},
 {title:'UNESCO · Baghdad and the Silk Route',url:'https://en.unesco.org/silkroad/sites/default/files/knowledge-bank-article/baghdad_and_silk_route.pdf'},
 {title:'University of Washington · Trade routes',url:'https://depts.washington.edu/silkroad/exhibit/trade/essay.html'},
]);
export const silkRoadPlaces={
 xian:[34.26,108.94],lanzhou:[36.06,103.83],wuwei:[37.93,102.64],zhangye:[38.93,100.45],jiuquan:[39.73,98.49],dunhuang:[40.14,94.66],
 hami:[42.83,93.51],turfan:[42.95,89.19],karashahr:[42.06,86.57],korla:[41.76,86.15],kucha:[41.72,82.96],aksu:[41.17,80.26],tumshuq:[39.87,79.08],kashgar:[39.47,75.99],
 miran:[39.23,88.99],niya:[37.97,82.7],khotan:[37.11,79.93],yarkand:[38.42,77.25],
 urumqi:[43.8,87.6],manas:[44.31,86.21],jinghe:[44.6,82.9],gate:[45.4,82.4],alakol:[46.1,81.6],qayaliq:[45.65,80.25],talgar:[43.3,77.24],
 suyab:[42.8,75.2],taraz:[42.9,71.37],tashkent:[41.3,69.24],samarkand:[39.65,66.97],bukhara:[39.77,64.43],merv:[37.66,62.19],
 irkeshtam:[39.69,73.97],sarytash:[39.73,73.25],osh:[40.53,72.8],kokand:[40.53,70.94],khujand:[40.28,69.62],
 tashkurgan:[37.77,75.23],wakhan:[37.02,73.5],ishkashim:[36.72,71.61],balkh:[36.76,66.9],bamiyan:[34.82,67.83],kabul:[34.55,69.21],peshawar:[34.01,71.58],taxila:[33.75,72.84],mathura:[27.49,77.67],
 sarakhs:[36.54,61.16],nishapur:[36.21,58.8],damghan:[36.17,54.35],ray:[35.59,51.44],hamadan:[34.8,48.52],kermanshah:[34.31,47.07],baghdad:[33.31,44.37],palmyra:[34.55,38.27],aleppo:[36.2,37.16],antioch:[36.2,36.16],
};
// Named junctions keep branches connected when a location is corrected.
const route=(id,title,stops)=>Object.freeze({id,title,coordinates:Object.freeze(stops.map(stop=>Object.freeze(typeof stop==='string'?silkRoadPlaces[stop]:stop)))});
export const silkRoadRoutes=Object.freeze([
 route('hexi','Chang’an and the Hexi corridor',['xian',[35.58,104.62],'lanzhou','wuwei','zhangye','jiuquan','dunhuang']),
 route('tarim-north','Northern Tarim oases',['dunhuang','hami','turfan','karashahr','korla','kucha','aksu','tumshuq','kashgar']),
 route('tarim-south','Southern Tarim oases',['dunhuang',[40.5,92.3],[40.5,90.1],'miran',[38.15,85.55],'niya','khotan','yarkand','kashgar']),
 route('dzungarian','Dzungarian Gate and Zhetysu',['turfan','urumqi','manas','jinghe','gate','alakol','qayaliq',[44.17,80.0],'talgar',[43.05,75.8],'suyab','taraz','tashkent','samarkand']),
 route('fergana','Kashgar and the Fergana Valley',['kashgar','irkeshtam','sarytash',[40.1,73.5],'osh','kokand','khujand','samarkand']),
 route('pamir','Pamir and Bactria',['kashgar','tashkurgan',[37.3,74.8],'wakhan','ishkashim',[37.12,70.58],[36.73,69.53],'balkh']),
 route('bactria','Bactria and Sogdiana',['balkh',[37.27,67.31],[38.22,66.9],'samarkand']),
 route('india','Hindu Kush and northern India',['balkh','bamiyan','kabul',[34.43,70.45],'peshawar','taxila',[32.5,74.3],[30.3,76.0],'mathura']),
 route('persia','Sogdiana and Persia',['samarkand','bukhara',[39.08,63.58],'merv','sarakhs','nishapur',[36.21,57.68],[36.4,55.0],'damghan',[35.58,53.39],'ray','hamadan','kermanshah','baghdad']),
 route('mediterranean','Mesopotamia and the Mediterranean',['baghdad',[33.43,43.31],[34.45,40.92],'palmyra','aleppo','antioch']),
]);

// The conventional cultural triangle, including the Hawaiian archipelago and
// southern Aotearoa. Two northern waypoints include the long Hawaiian island
// chain; short great-circle arcs cross the date line in the Pacific.
export const polynesiaRoutes=Object.freeze([{id:'polynesian-triangle',title:'Polynesian Triangle',geodesic:true,coordinates:[[28.4,-178.3],[20.5,-154.5],[-27.12,-109.35],[-47.3,167.5],[28.4,-178.3]]}]);
