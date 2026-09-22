// Data is requested only by openTour, never during startup, hover or idle time.
// Every story returns {heading, periods, periodFor} plus empty routes/areas; the
// app selects a chapter (URL ?period= or the story default) after loading.
const chapters=({heading,periods,periodFor})=>({heading,periods,periodFor,routes:[],areas:[]});
export async function loadTourData(id){
 if(id==='silk-road'){const {tradePeriods,tradePeriod,tradeHeading}=await import('./tour-trade-periods.mjs?v=strands-2');return chapters({heading:tradeHeading,periods:tradePeriods,periodFor:tradePeriod});}
 if(id==='origin-of-mankind')return chapters((await import('./tour-migrations.mjs?v=strands-2')).migrationChapters);
 if(id==='iceland-to-vinland')return chapters((await import('./tour-vinland.mjs?v=strands-2')).vinlandChapters);
 if(id==='french-polynesia')return chapters((await import('./tour-polynesia.mjs?v=strands-2')).polynesiaChapters);
 if(id==='americas-exchange')return chapters((await import('./tour-americas.mjs?v=strands-2')).americasChapters);
 if(id==='african-networks')return chapters((await import('./tour-africa.mjs?v=strands-2')).africaChapters);
 if(id==='ocean-crossings')return chapters((await import('./tour-oceans.mjs?v=strands-2')).oceanChapters);
 return {routes:[],areas:[]};
}
