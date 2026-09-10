import {makeGeometry} from './geometry.mjs?v=circular-2';
import {indicatrixField} from './indicatrix.mjs?v=circular-2';

self.onmessage=({data:job})=>{
 try{
  const field=indicatrixField(makeGeometry(job.method,job.height),job.level,job.bias,job.blend);
  const regions=field.regions.map(segments=>new Float32Array(segments.flat(2)));
  self.postMessage({key:job.key,regions},regions.map(region=>region.buffer));
 }catch(error){self.postMessage({key:job.key,error:error.message});}
};
