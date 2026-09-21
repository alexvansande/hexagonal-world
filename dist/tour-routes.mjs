// Compatibility/data entry point for diagnostics; the app loads individual stories on demand.
import {silkRoadRoutes,polynesiaRoutes} from './tour-route-data.mjs?v=sporadic-1';
import {silkTradeRoutes} from './tour-trade.mjs?v=trade-regions-1';
import {migrationRoutes,migrationChapters} from './tour-migrations.mjs?v=strands-2';
import {vinlandRoutes,vinlandChapters} from './tour-vinland.mjs?v=strands-2';
import {polynesiaChapters} from './tour-polynesia.mjs?v=strands-2';
import {americasChapters} from './tour-americas.mjs?v=strands-2';
import {tradePeriods,tradePeriod,tradeHeading} from './tour-trade-periods.mjs?v=strands-2';
export {silkRoadRoutes,polynesiaRoutes,silkRoadSources} from './tour-route-data.mjs?v=sporadic-1';
export {sampleRoute,projectTourRoutes,routePath,createTourRoutes} from './tour-route-renderer.mjs?v=strands-2';
export const silkRoadTradeRoutes=silkTradeRoutes(silkRoadRoutes);
export const tourRouteSets={'silk-road':silkRoadTradeRoutes,'french-polynesia':polynesiaRoutes,'origin-of-mankind':migrationRoutes,'iceland-to-vinland':vinlandRoutes};
// Every entry point's dated chapters, keyed by location ID (same shape as loadTourData).
export const tourChapters={'silk-road':{heading:tradeHeading,periods:tradePeriods,periodFor:tradePeriod},'origin-of-mankind':migrationChapters,'iceland-to-vinland':vinlandChapters,'french-polynesia':polynesiaChapters,'americas-exchange':americasChapters};
