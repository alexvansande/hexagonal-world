// Maps of their time for the History timeline: a period may replace the base
// raster of a style with one of its own. Only where the change is drastic: the
// last glacial life zones (ice sheets, Beringia, Sunda and Sahul, Doggerland)
// for Peopling the world, and the political map for every historical stop.
export const eraMaps=Object.freeze({
 '2m-ya':{countries:'maps/eras/political-none.png'},
 '50k-ya':{ecology:'maps/eras/ecology-50k-ya.png',countries:'maps/eras/political-none.png'},
 '3k-ya':{countries:'maps/eras/political-3k-ya.png'},
 '200-ce':{countries:'maps/eras/political-200-ce.png'},
 '1000-ce':{countries:'maps/eras/political-1000-ce.png'},
 '1400-ce':{countries:'maps/eras/political-1400-ce.png'},
 '1600-ce':{countries:'maps/eras/political-1600-ce.png'},
 '1800-ce':{countries:'maps/eras/political-1800-ce.png'},
});
export const eraMap=(period,type)=>eraMaps[period]?.[type]||null;
// The present political map is drawn the same way (the live path, one style for every age), so the
// timeline can fade from one age's borders to the next and to today's.
export const modernMaps=Object.freeze({countries:'maps/countries.png'});
export const eraCredit=path=>!path?null:path.includes('/political-')?{name:'Historical borders · aourednik/historical-basemaps (GPL-3.0)',detail:'A work in progress, boundaries approximate; grey is land without a state, bold colours the largest polities, pastels the rest'}:path.includes('/ecology-')?{name:'Last glacial life zones · c. 21,000 years ago',detail:'Holdridge classes from CHELSA-TraCE21k (CC0): ice sheets and exposed shelves from its surface altitude; oceans as today'}:null;
