// Public counting endpoint only: no API key or account credentials belong here.
export const goatCounterEndpoint='';
const formats=['dymaxion','felv','bighex','gosper','flower','infinite','single','double'];
const styles=['lifezones','satellite','elevation','political','topographic','gray-neutral','ivory','distortion-analysis'];
export function eventPayload(kind,value){
 const allowed={format:formats,style:styles,download:['pdf','2x-png','10x-png']};
 return allowed[kind]?.includes(value)?{path:`${kind}-${value}`,title:`${kind}: ${value}`,event:true,referrer:''}:null;
}
export function analyticsAllowed(host,privacy,framed,endpoint){return ['hexagonal.earth','www.hexagonal.earth'].includes(host)&&!privacy&&!framed&&/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint);}
let enabled=false,queue=[];
export function initAnalytics(path){
 const note=document.getElementById('analytics-note');
 if(!goatCounterEndpoint)return;
 if(note)note.innerHTML='We use <a href="https://www.goatcounter.com/" target="_blank" rel="noreferrer">GoatCounter</a> for aggregate visits, format and style choices, and completed downloads. No visitor cookies or map coordinates are recorded. <a href="https://www.goatcounter.com/help/privacy" target="_blank" rel="noreferrer">How it works</a>';
 if(!analyticsAllowed(location.hostname,navigator.globalPrivacyControl||navigator.doNotTrack==='1',window.top!==window,goatCounterEndpoint))return;
 enabled=true;
 let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
 window.goatcounter={no_onload:true,endpoint:goatCounterEndpoint};
 const script=document.createElement('script');script.async=true;script.src='https://gc.zgo.at/count.js';script.referrerPolicy='no-referrer';
 script.onload=()=>{try{window.goatcounter.count({path,title:'Hexagonal World',referrer});for(const event of queue)window.goatcounter.count(event);}catch{}queue=[];};
 script.onerror=()=>{enabled=false;queue=[];};document.head.append(script);
}
export function trackEvent(kind,value){
 if(!enabled)return;const payload=eventPayload(kind,value);if(!payload)return;
 try{if(window.goatcounter?.count)window.goatcounter.count(payload);else if(queue.length<20)queue.push(payload);}catch{}
}
