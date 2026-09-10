import {clearanceField,clearanceMask} from './clearance.mjs';
import {optimize} from './optimizer.mjs';
self.onmessage=({data})=>{try{
 if(data.type==='clearance'){const result=clearanceField(data.mask,data.width,data.height);self.postMessage({type:'clearance',...result},[result.distance.buffer]);return;}
 if(data.type==='batch'){
  const results=[];
  for(let i=0;i<=9;i++){
   const metric=i===0?{mask:data.mask,width:data.width,height:data.height}:{mask:clearanceMask(data.field.distance,i),width:data.field.width,height:data.field.height};
   results.push(optimize({config:data.config,arrangement:data.arrangement,start:data.start,...metric,budget:1500,seed:17931},p=>self.postMessage({type:'progress',percent:Math.round((i*100+p.percent)/10)})));
  }
  self.postMessage({type:'done',results});return;
 }
 const result=optimize(data,progress=>self.postMessage({type:'progress',...progress}));self.postMessage({type:'done',...result});
}catch(error){self.postMessage({type:'error',message:error.message});}};
