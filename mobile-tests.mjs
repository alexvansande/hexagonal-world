import assert from 'node:assert/strict';
import {mobileFitRect} from './dist/device-profile.mjs';
import {ReliefRenderer} from './dist/relief.mjs';
for(const [w,h,title,panel,right] of [[390,844,96,620,356],[320,568,90,390,308],[844,390,86,172,310]]){
 const r=mobileFitRect(w,h,title,panel,right);assert(r.top>title);assert(r.bottom>r.top);assert(r.right>r.left);assert(r.left>=0&&r.right<=w&&r.bottom<=h);
}
const fake=()=>({ready:false,detailed:false,generation:0,uploads:[],onStatus(){},onChange(){},async upload(url){this.uploads.push(url);}});
const a=fake();await ReliefRenderer.prototype.load.call(a);assert.deepEqual(a.uploads,['maps/height/overview.png']);
await ReliefRenderer.prototype.load.call(a);assert.equal(a.uploads.length,1,'Overview must not reload');
await ReliefRenderer.prototype.load.call(a,true);assert.equal(a.uploads.length,7,'Detailed images load only when requested');assert(a.detailed);
const b=fake();b.upload=async()=>{throw new DOMException('Cancelled','AbortError');};await assert.rejects(()=>ReliefRenderer.prototype.load.call(b,true),{name:'AbortError'});assert.equal(b.loading,false);
console.log('Mobile fitting, lazy elevation, deduplicated loads and cancellation pass.');
const released=[];const gpu={TEXTURE_2D:1,LUMINANCE:2,UNSIGNED_BYTE:3,TEXTURE0:4,texImage2D(...a){assert.equal(a[3],1);assert.equal(a[4],1);},deleteFramebuffer(x){released.push(x);},deleteTexture(x){released.push(x);},activeTexture(){}};
const detail={gl:gpu,heightTextures:Array(7),targets:[{fbo:'f',texture:'t'}],bindTexture(){},detailed:true,generation:1};
ReliefRenderer.prototype.releaseDetail.call(detail);assert.deepEqual(released,['f','t']);assert.equal(detail.targets.length,0);assert.equal(detail.detailed,false);assert.equal(detail.generation,2);
console.log('Export detail textures and render targets are released.');
