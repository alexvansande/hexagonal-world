// Schematic sea corridors, not reconstructed ship tracks. Geographic western
// Norway is used instead of claiming Bergen (founded 1070) launched the early
// settlement voyages. Greenland waypoints round Cape Farewell, not its ice sheet.
// References and caveats: territory-tours-sources.md. Coordinates are [lat,lon].
const norway=[60.4,5.3],shetland=[60.15,-1.15],faroe=[62,-6.8],iceland=[64.15,-21.94],eastSettlement=[61.15,-45.5],westSettlement=[64.18,-51.72];
export const vinlandRoutes=[
 {id:'norse-islands',title:'Western Norway, Shetland and the Faroes',geodesic:true,coordinates:[norway,[60.3,3],[60,-.6],shetland,[61,-3],faroe]},
 {id:'norse-iceland',title:'Faroes to Iceland',geodesic:true,coordinates:[faroe,[62.5,-10],[63,-14],[63.1,-18.5],[63.5,-22.5],[64,-22.8],iceland]},
 {id:'norse-greenland',title:'Iceland to the Eastern Settlement',geodesic:true,coordinates:[iceland,[63.8,-25],[61.8,-35],[59.5,-43.8],[60,-46.2],[60.65,-46.2],eastSettlement]},
 {id:'norse-western-settlement',title:'Greenland’s western coast',geodesic:true,coordinates:[eastSettlement,[60.6,-47],[61.5,-49.3],[62.5,-50.8],[63.7,-52.5],westSettlement]},
 {id:'norse-helluland',title:'Greenland to Helluland and Markland',geodesic:true,coordinates:[westSettlement,[63.6,-53.5],[63.5,-58.5],[63.3,-63],[62.5,-63.7],[60.6,-62],[58.6,-61.7],[56,-60]]},
 {id:'norse-vinland',title:'Markland to northern Newfoundland',geodesic:true,coordinates:[[56,-60],[55.2,-58.7],[54.1,-56.8],[52.6,-55.2],[51.596,-55.533]]},
];
