import {readFileSync,writeFileSync} from 'node:fs';
import {optimize} from '../dist/optimizer.mjs';
import {clearanceField,clearanceMask} from '../dist/clearance.mjs';
import {makeGeometry,layouts} from '../dist/geometry.mjs';
import {makeArrangement,arrangementNames} from '../dist/arrangements.mjs';
const mask=new Uint8Array(readFileSync('/tmp/hex-land-mask.bin')),width=4320,height=2160;
const field=clearanceField(mask,width,height),presets={};
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const config={method,height:1.5,bias:1,blend:0},tiles=makeGeometry(method,config.height),nets=layouts(tiles);
 presets[method]={};
 for(const name of Object.keys(arrangementNames)){
 const shape=makeArrangement(tiles,name,nets),results=[];
  if(!shape.tiling)for(let i=0;i<=9;i++){
   const metric=i===0?{mask,width,height}:{mask:clearanceMask(field.distance,i),width:field.width,height:field.height};
   const result=optimize({config,arrangement:shape,start:{lon:0,lat:0,roll:0},...metric,budget:1500,seed:17931});
   if(result.after>result.before)throw Error(`${method}/${name}: score regression`);
   results.push({distance:i,...result});
  }
  presets[method][name]={config,results};
  console.log(method+'/'+name+(shape.tiling?': no outer edge; optimizer disabled':': 10 validated outer-edge presets'));
 }
}
writeFileSync('dist/search-presets.mjs','// Precomputed from continents.png; 1,500 initial rotations per distance, scored on each shape\'s exposed outer boundary.\nexport const searchPresets = '+JSON.stringify(presets,null,2)+';\n');
