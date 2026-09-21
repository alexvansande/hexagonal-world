// Data is requested only by openTour, never during startup, hover or idle time.
// Every story returns {heading, periods, periodFor} plus empty routes/areas; the
// app selects a chapter (URL ?period= or the story default) after loading.
const chapters=({heading,periods,periodFor})=>({heading,periods,periodFor,routes:[],areas:[]});
export async function loadTourData(id){
 if(id==='silk-road'){const {tradePeriods,tradePeriod,tradeHeading}=await import('./tour-trade-periods.mjs?v=chapters-1');return chapters({heading:tradeHeading,periods:tradePeriods,periodFor:tradePeriod});}
 if(id==='origin-of-mankind')return chapters((await import('./tour-migrations.mjs?v=chapters-1')).migrationChapters);
 if(id==='iceland-to-vinland')return chapters((await import('./tour-vinland.mjs?v=chapters-1')).vinlandChapters);
 if(id==='french-polynesia')return chapters((await import('./tour-polynesia.mjs?v=chapters-1')).polynesiaChapters);
 if(id==='americas-exchange')return chapters((await import('./tour-americas.mjs?v=chapters-1')).americasChapters);
 return {routes:[],areas:[]};
}
