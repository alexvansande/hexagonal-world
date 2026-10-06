import {readFileSync,writeFileSync} from 'node:fs';
import {clearanceField} from '/home/user/hexagonal-world/dist/clearance.mjs';
const m=new Uint8Array(readFileSync('mask.bin')),W=4320,H=2160;
const off=clearanceField(m,W,H,1440,720).distance;           // ocean: degrees to land
const inl=clearanceField(m.map(v=>1-v),W,H,1440,720).distance; // land: degrees to ocean
const s=new Float32Array(off.length);for(let i=0;i<s.length;i++)s[i]=inl[i]>0?inl[i]:-off[i];
writeFileSync('signed.bin',Buffer.from(s.buffer));
