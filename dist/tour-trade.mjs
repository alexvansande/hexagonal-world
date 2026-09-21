// Representative commodity exchanges, not cargo tracks or trade volumes.
// Every route runs from supply toward demand; lane offsets are UI spacing only.
// Evidence and limitations: silk-road-sources.md.
import {regionalTradeLinks} from './tour-trade-regions.mjs?v=trade-regions-1';
export function silkTradeRoutes(corridors){
 const byId=Object.fromEntries(corridors.map(route=>[route.id,route]));
 const antioch=byId.mediterranean.coordinates.at(-1),rome=[41.9,12.5],alexandria=[31.2,29.9],berenike=[23.9,35.5],barygaza=[21.7,72.99];
 // Coastal sea legs plus the Nile/desert transfer, not a modern Suez shortcut.
 const links={
  ...byId,
  'rome-levant':{coordinates:[antioch,[36,35.8],[35,34],[34.4,29],[34.6,24],[36.3,20],[37,16],[38.8,14.5],rome]},
  'rome-egypt':{coordinates:[rome,[38.8,14.5],[36.3,17],[34,23],[32,28],alexandria]},
  'egypt-transfer':{coordinates:[alexandria,[30.3,31.1],[27.2,31],[26,32.8],[25.7,32.8],berenike]},
  'indian-ocean':{coordinates:[berenike,[22,37.5],[18,40],[14,42.5],[12.6,43.4],[12,46],[13,51],[15,58],[18,66],[20,70.5],barygaza]},
 };
 const flows=[];
 const regional=regionalTradeLinks({rome,antioch,alexandria,barygaza,xian:byId.hexi.coordinates[0],mathura:byId.india.coordinates.at(-1)});
 Object.assign(links,regional);
 const add=(wave,ids,lane,reverse=false)=>{
  for(const id of ids){const route=links[id];flows.push(Object.freeze({
   id:`trade-${wave}-${id}`,title:route.title||wave,region:route.region||'international',animated:true,wave,lane:reverse?-lane:lane,
   coordinates:Object.freeze(reverse?[...route.coordinates].reverse():[...route.coordinates]),
  }));}
 };
 add('silk',corridors.map(r=>r.id).concat('rome-levant'),-4);
 // Gold and silver are one commodity category, whether coins, bullion or objects.
 add('gold-silver',['rome-levant','mediterranean','persia'],4,true);
 add('gold-silver',['rome-egypt','egypt-transfer','indian-ocean'],-6);
 add('glass-metals',['rome-egypt','egypt-transfer','indian-ocean'],0);
 // The Fergana corridor contains the horse-producing valley; start at Osh.
 const fergana=byId.fergana.coordinates;
 flows.push(Object.freeze({id:'trade-horses-fergana',title:'horses',animated:true,wave:'horses',lane:-4,coordinates:Object.freeze(fergana.slice(0,fergana.findIndex(p=>p[0]===40.53&&p[1]===72.8)+1).reverse())}));
 add('horses',['tarim-north','hexi'],4,true);
 add('spices-cotton',['indian-ocean','egypt-transfer','rome-egypt'],6,true);
 for(const [id,route] of Object.entries(regional))for(const [wave,lane,reverse] of route.flows)add(wave,[id],lane,reverse);
 return Object.freeze(flows);
}
