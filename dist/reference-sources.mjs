// Wikimedia reference maps are image sources, independent of the style presets.
export const referenceSources={
 'wikipedia-world':{
  name:'Wikipedia: Default',file:'maps/wikipedia/world.jpg',
  title:'Equirectangular projection SW',author:'Strebe',
  url:'https://commons.wikimedia.org/wiki/File:Equirectangular_projection_SW.jpg',
  license:'CC BY-SA 3.0',licenseURL:'https://creativecommons.org/licenses/by-sa/3.0/',
  changes:'Outer image frame removed and image resampled; reprojected and styled by Hexagonal Earth.'
 },
 'wikipedia-tissot':{
  name:'Wikipedia: Tissot',file:'maps/wikipedia/tissot.svg',
  title:"Plate Carree with Tissot's Indicatrices of Distortion",author:'Justin Kunimune',
  url:'https://commons.wikimedia.org/wiki/File:Plate_Carr%C3%A9e_with_Tissot%27s_Indicatrices_of_Distortion.svg',
  license:'CC BY-SA 4.0',licenseURL:'https://creativecommons.org/licenses/by-sa/4.0/',
  changes:'Rasterized, reprojected and styled by Hexagonal Earth.',
  note:'The grid and circles are part of the source image and move with the map.'
 },
 'wikipedia-marble':{
  name:'Wikipedia: Blue Marble',file:'maps/wikipedia/blue-marble.jpg',mobileFile:'maps/wikipedia/blue-marble-mobile.jpg',
  title:'Blue Marble 2002',author:'NASA / Reto Stockli and Robert Simmon; combined by Meow',
  url:'https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.png',
  license:'Public domain (NASA)',licenseURL:'https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.png#Licensing',
  changes:'Downsampled and converted to JPEG; reprojected and styled by Hexagonal Earth.',
  publicDomain:true
 }
};
export function sourceAttribution(type){
 const source=referenceSources[type];
 return source?`${source.title} by ${source.author}. Source: ${source.url} . ${source.changes} ${source.publicDomain?'Source imagery':'Adapted map imagery'}: ${source.license} (${source.licenseURL}).`:'';
}
