import {readFileSync} from 'node:fs';
import {makeGeometry,layouts} from '/home/user/hexagonal-world/dist/geometry.mjs';
import {makeArrangement} from '/home/user/hexagonal-world/dist/arrangements.mjs';
import {outerEdgeSamples,landScore} from '/home/user/hexagonal-world/dist/optimizer.mjs';
const land=new Uint8Array(readFileSync('mask.bin')),t=makeGeometry('rhombic',1.5),a=makeArrangement(t,'dymaxion',layouts(t));
const s=outerEdgeSamples({method:'rhombic',height:1.5},a,4096),a2={lon:109.39,lat:13.15,roll:-165.65};
console.log('rounded border on land',(landScore(s,a2,land,4320,2160)*100).toFixed(2)+'%');
console.log(Buffer.from(JSON.stringify([2,[2,a2.lon,3,a2.lat,4,a2.roll]])).toString('base64url'));
