import assert from 'node:assert/strict';
import {polygonOverlapsRect} from './dist/interface-layout.mjs';
const diamond=[[0,2],[2,0],[4,2],[2,4]];
assert(!polygonOverlapsRect(diamond,{left:0,top:0,right:.5,bottom:.5}),'Empty corners of the bounds do not obscure text');
assert(polygonOverlapsRect(diamond,{left:1,top:1,right:3,bottom:3}),'Interior overlap obscures text');
assert(polygonOverlapsRect(diamond,{left:1.9,top:-1,right:2.1,bottom:5}),'Crossing edges count without enclosed vertices');
assert(!polygonOverlapsRect(diamond,{left:5,top:5,right:6,bottom:6}));
console.log('Interface: title overlap follows convex map pieces and their empty corners.');
