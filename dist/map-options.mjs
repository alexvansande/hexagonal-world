import {makeGeometry,layouts,hex,world} from './geometry.mjs?v=circular-2';
import {makeArrangement} from './arrangements.mjs?v=rus-search-1';

export const layoutOptions=[
 {name:'Spaceship Earth',arrangement:'dymaxion',state:{method:'rhombic',arrangement:'dymaxion',lon:-170.01889457926154,lat:32.99273576349003,roll:-13.384930707514286,bias:1,height:1.5,clearance:0,gridRotation:31,mode:'rotate'},controls:{interpolation:'0',optimize:false}},
 {name:'Felv',arrangement:'felv',state:{method:'rhombic',arrangement:'felv',lon:-5.183258477970867,lat:-42.04019961295529,roll:-1.7428079310803923,bias:1,height:1.5,clearance:3,gridRotation:0,mode:'rotate'},controls:{interpolation:'0',optimize:false}},
 {name:'Flower World',arrangement:'bighex',state:{method:'rhombic',arrangement:'bighex',lon:-19.196120097618845,lat:54.98466622358542,roll:-73.21086442098823,bias:1,height:1.5,gridRotation:60,mode:'rotate'},controls:{interpolation:'0',optimize:false}},
 {name:'4Hexes',arrangement:'flower',state:{method:'rhombic',arrangement:'flower',lon:132.47383515760305,lat:40.19079148977437,roll:87.45012620687487,bias:1,height:1.5,clearance:1,gridRotation:120,mode:'pan'},controls:{interpolation:'0',optimize:false}},
 {name:'Infinite Honeycomb',arrangement:'infinite',state:{method:'rhombic',arrangement:'infinite',lon:-168.51360216723162,lat:37.41313981522221,roll:-11.453856794719924,bias:1,height:1.5,clearance:1,gridRotation:60,mode:'pan'},viewOffset:[-0.28669960461805105,-0.4522765322383842],controls:{interpolation:'0',optimize:false}},
 {name:'Rus One',arrangement:'single',state:{method:'lambert-one',arrangement:'single',lon:-113.3026042766869,lat:22.058934644941793,roll:-63.51656958460808,bias:1,height:1.5,clearance:0,gridRotation:30,mode:'rotate'},controls:{interpolation:'0',optimize:false}},
 {name:'Rus Two',arrangement:'double',state:{method:'lambert-two',arrangement:'double',lon:-32.30610191412268,lat:-32.063330167477375,roll:158.64937123842537,bias:1,height:1.5,clearance:0,gridRotation:30,mode:'rotate'},controls:{interpolation:'0',optimize:false}}
];

// Curated surface settings from the user's saved maps. Projection and view are deliberately absent.
export const styleOptions=[
  {
    "id": "lifezones",
    "name": "Lifezones",
    "source": "ecology",
    "state": {
      "reliefHeight": 1.15,
      "reliefAzimuth": 315,
      "reliefAltitude": 53,
      "reliefContrast": 1,
      "reliefHighlights": 0.55,
      "reliefAmbient": 0.75,
      "reliefShadows": 0.4,
      "reliefSoftness": 0.75,
      "reliefAO": 0.45,
      "reliefColorFade": 0.3,
      "reliefThickness": 0.7,
      "reliefOcean": 0.4,
      "reliefRiverDepth": 0.25,
      "reliefSeaLevel": 105,
      "line": 0.1,
      "grid": 30,
      "distortionOpacity": 0.75,
      "riverWidth": 2.5,
      "riverLevels": 12,
      "subgridWidth": 0.2,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "ecology",
      "relief-enabled": true,
      "relief-treatment": "atlas",
      "relief-tone": "warm",
      "rivers-visible": true,
      "land-classes": 10,
      "ocean-classes": 6,
      "graticule": false,
      "subgrid": true,
      "dotgrid": true,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "border-color": "#376472",
      "hex-grid-color": "#d6d6d6",
      "graticule-color": "#4f8796",
      "background-color": "#ebebeb"
    },
    "thumbnail": "maps/styles/lifezones.png"
  },
  {
    "id": "satellite",
    "name": "Satellite",
    "source": "marble",
    "state": {
      "reliefHeight": 1.1,
      "reliefAzimuth": 300,
      "reliefAltitude": 32,
      "reliefContrast": 1.45,
      "reliefHighlights": 0.9,
      "reliefAmbient": 0.7,
      "reliefShadows": 0.65,
      "reliefSoftness": 0.65,
      "reliefAO": 0.75,
      "reliefColorFade": 0.25,
      "reliefThickness": 0.55,
      "reliefOcean": 0.6,
      "reliefRiverDepth": 0.75,
      "reliefSeaLevel": 116,
      "line": 0.1,
      "grid": 30,
      "distortionOpacity": 0.75,
      "riverWidth": 1.25,
      "riverLevels": 6,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "marble",
      "relief-enabled": true,
      "relief-treatment": "atlas",
      "relief-tone": "neutral",
      "rivers-visible": true,
      "land-classes": 15,
      "ocean-classes": 3,
      "graticule": false,
      "subgrid": false,
      "dotgrid": false,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/satellite.png"
  },
  {
    "id": "elevation",
    "name": "Elevation",
    "source": "elevation",
    "state": {
      "reliefHeight": 1.25,
      "reliefAzimuth": 269,
      "reliefAltitude": 17,
      "reliefContrast": 1.45,
      "reliefHighlights": 0.9,
      "reliefAmbient": 0.7,
      "reliefShadows": 0.7,
      "reliefSoftness": 0.65,
      "reliefAO": 0.75,
      "reliefColorFade": 0.25,
      "reliefThickness": 0.55,
      "reliefOcean": 0.4,
      "reliefRiverDepth": 0.9,
      "reliefSeaLevel": 105,
      "line": 0.1,
      "grid": 30,
      "distortionOpacity": 0.75,
      "riverWidth": 1.75,
      "riverLevels": 6,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "elevation",
      "relief-enabled": true,
      "relief-treatment": "atlas",
      "relief-tone": "neutral",
      "rivers-visible": true,
      "land-classes": 15,
      "ocean-classes": 3,
      "graticule": false,
      "subgrid": false,
      "dotgrid": false,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/elevation.png"
  },
  {
    "id": "political",
    "name": "Political",
    "source": "countries",
    "state": {
      "reliefHeight": 1.25,
      "reliefAzimuth": 269,
      "reliefAltitude": 17,
      "reliefContrast": 1.45,
      "reliefHighlights": 0.9,
      "reliefAmbient": 0.7,
      "reliefShadows": 0.7,
      "reliefSoftness": 0.65,
      "reliefAO": 0.75,
      "reliefColorFade": 0.25,
      "reliefThickness": 0.55,
      "reliefOcean": 0.4,
      "reliefRiverDepth": 0.9,
      "reliefSeaLevel": 105,
      "line": 0.1,
      "grid": 15,
      "distortionOpacity": 0.75,
      "riverWidth": 1.25,
      "riverLevels": 12,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "countries",
      "relief-enabled": false,
      "relief-treatment": "atlas",
      "relief-tone": "neutral",
      "rivers-visible": true,
      "land-classes": 15,
      "ocean-classes": 3,
      "graticule": false,
      "subgrid": false,
      "dotgrid": false,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "background-color": "#2b4b5f",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/political.png"
  },
  {
    "id": "gray-neutral",
    "name": "Gray neutral",
    "source": "continents",
    "state": {
      "reliefHeight": 1.25,
      "reliefAzimuth": 0,
      "reliefAltitude": 54,
      "reliefContrast": 1.15,
      "reliefHighlights": 0.85,
      "reliefAmbient": 0.35,
      "reliefShadows": 0.05,
      "reliefSoftness": 0.25,
      "reliefAO": 0.3,
      "reliefColorFade": 0,
      "reliefThickness": 0,
      "reliefOcean": 0.45,
      "reliefRiverDepth": 0.5,
      "reliefSeaLevel": 105,
      "line": 0,
      "grid": 30,
      "distortionOpacity": 0.75,
      "riverWidth": 1,
      "riverLevels": 6,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "continents",
      "relief-enabled": true,
      "relief-treatment": "land",
      "relief-tone": "neutral",
      "rivers-visible": false,
      "land-classes": 15,
      "ocean-classes": 3,
      "graticule": false,
      "subgrid": false,
      "dotgrid": true,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "background-color": "#a2bac1",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/gray-neutral.png"
  },
  {
    "id": "ivory",
    "name": "Ivory",
    "source": "ivory",
    "state": {
      "reliefHeight": 0.65,
      "reliefAzimuth": 315,
      "reliefAltitude": 48,
      "reliefContrast": 1.1,
      "reliefHighlights": 0.65,
      "reliefAmbient": 0.7,
      "reliefShadows": 0.45,
      "reliefSoftness": 0.65,
      "reliefAO": 0.25,
      "reliefColorFade": 0.3,
      "reliefThickness": 0.65,
      "reliefOcean": 0.4,
      "reliefRiverDepth": 0.2,
      "reliefSeaLevel": 105,
      "line": 0.1,
      "grid": 30,
      "distortionOpacity": 0.75,
      "riverWidth": 2.5,
      "riverLevels": 12,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "ivory",
      "relief-enabled": true,
      "relief-treatment": "atlas",
      "relief-tone": "warm",
      "rivers-visible": true,
      "land-classes": 10,
      "ocean-classes": 6,
      "graticule": true,
      "subgrid": false,
      "dotgrid": false,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": false,
      "indicatrix": "off",
      "background-color": "#8b9992",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/ivory.png"
  },
  {
    "id": "distortion-analysis",
    "name": "Distortion Analysis",
    "source": "continents",
    "state": {
      "reliefHeight": 1.25,
      "reliefAzimuth": 0,
      "reliefAltitude": 54,
      "reliefContrast": 1.15,
      "reliefHighlights": 0.85,
      "reliefAmbient": 0.35,
      "reliefShadows": 0.05,
      "reliefSoftness": 0.25,
      "reliefAO": 0.3,
      "reliefColorFade": 0,
      "reliefThickness": 0,
      "reliefOcean": 0.45,
      "reliefRiverDepth": 0.5,
      "reliefSeaLevel": 105,
      "line": 0,
      "grid": 30,
      "distortionOpacity": 0.9,
      "riverWidth": 1,
      "riverLevels": 6,
      "subgridWidth": 1,
      "graticuleWidth": 1
    },
    "controls": {
      "map-source": "continents",
      "relief-enabled": false,
      "relief-treatment": "land",
      "relief-tone": "neutral",
      "rivers-visible": false,
      "land-classes": 15,
      "ocean-classes": 3,
      "graticule": false,
      "subgrid": false,
      "dotgrid": true,
      "palette": "atlas",
      "construction": false,
      "labels": false,
      "distortion": true,
      "indicatrix": "4x49",
      "background-color": "#eff4f5",
      "border-color": "#376472",
      "hex-grid-color": "#315865",
      "graticule-color": "#4f8796"
    },
    "thumbnail": "maps/styles/distortion-analysis.png"
  }
];

const svgNS='http://www.w3.org/2000/svg';
// Icons use the same polygons, placements and rotation as the selected format.
export function layoutPolygons(option){
 const tiles=makeGeometry(option.state.method,option.state.height);
 const arrangement=makeArrangement(tiles,option.arrangement,layouts(tiles));
 const net=arrangement.tiling?Array.from({length:7},(_,i)=>i-3).flatMap(q=>
  Array.from({length:7},(_,i)=>i-3).filter(r=>Math.abs(q+r)<=3).map(r=>
   ({...arrangement.tiling.at(q,r),x:q*1.5,y:Math.sqrt(3)*(r+q/2)}))):arrangement.net;
 const angle=option.state.gridRotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 return net.map(t=>(t.polygon||hex).map(p=>{
  const [x,y]=world(p,t);return [c*x+s*y,s*x-c*y];
 }));
}
export function layoutIcon(option){
 const polygons=layoutPolygons(option),points=polygons.flat();
 const left=Math.min(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1]));
 const width=Math.max(...points.map(p=>p[0]))-left,height=Math.max(...points.map(p=>p[1]))-top;
 const scale=Math.min(88/width,58/height);
 const svg=document.createElementNS(svgNS,'svg');svg.classList.add('layout-icon');svg.setAttribute('viewBox','0 0 100 70');svg.setAttribute('aria-hidden','true');
 for(const polygon of polygons){const path=document.createElementNS(svgNS,'path');
  path.setAttribute('d',polygon.map(([x,y],i)=>`${i?'L':'M'}${(50+(x-left-width/2)*scale).toFixed(3)} ${(35+(y-top-height/2)*scale).toFixed(3)}`).join(' ')+'Z');svg.append(path);
 }
 return svg;
}
