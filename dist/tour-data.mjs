// Data is requested only by openTour, never during startup, hover or idle time.
export async function loadTourData(id){
 if(id==='silk-road'){
  const {tradePeriods,tradePeriod}=await import('./tour-trade-periods.mjs?v=eastern-tin-1');
  return {periods:tradePeriods,periodFor:tradePeriod,routes:[],areas:[]};
 }
 if(id==='origin-of-mankind')return {routes:(await import('./tour-migrations.mjs?v=siberia-1')).migrationRoutes,areas:[]};
 if(id==='iceland-to-vinland')return {routes:(await import('./tour-vinland.mjs?v=territories-1')).vinlandRoutes,areas:[]};
 if(id==='french-polynesia')return {routes:(await import('./tour-route-data.mjs?v=sporadic-1')).polynesiaRoutes,areas:[]};
 return {routes:[],areas:(await import('./tour-area-data.mjs?v=territories-1')).tourAreaSets[id]||[]};
}
