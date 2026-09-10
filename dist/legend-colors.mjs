// Same color-fade blend used by both the live and baked relief shaders.
export function fadedLegendColor(hex,amount=0){
 const fade=Math.max(0,Math.min(1,Number(amount)||0));
 if(!fade)return hex;
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const luma=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114;
 return '#'+rgb.map((v,i)=>Math.round((v*(1-fade)+(luma*.45+[.78,.77,.72][i]*.55)*fade)*255).toString(16).padStart(2,'0')).join('');
}
