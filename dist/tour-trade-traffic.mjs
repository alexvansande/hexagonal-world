// Visual timing, not reconstructed trade volumes. Stable seeds prevent flicker
// on pan/zoom. A long irregular cycle avoids per-frame JS and particle allocation.
export function tradeTraffic(id){
 let seed=2166136261;
 for(const ch of id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const phase=random(),dashes=[];
 for(let i=0;i<18;i++){
  const cluster=1+Math.floor(random()*3);
  for(let j=0;j<cluster;j++)dashes.push(.1,j===cluster-1?65+random()*115:9+random()*12);
 }
 // Round the actual pattern before summing, so the animation loops exactly.
 // Halve each dot-to-dot interval: twice the arrivals at the same travel speed,
 // preserving dot size and the random mix of clusters and quiet stretches.
 const values=dashes.map((n,i)=>Math.round((i%2?(n+.1)/2-.1:n)*100)/100),length=values.reduce((a,b)=>a+b,0);
 return Object.freeze({dasharray:values.join(' '),length,phase:phase*length,speed:13});
}
