// Compatibility/data entry point for diagnostics; the app loads individual stories on demand.
import {silkRoadRoutes,polynesiaRoutes} from './tour-route-data.mjs?v=sporadic-1';
import {silkTradeRoutes} from './tour-trade.mjs?v=trade-regions-1';
import {migrationRoutes} from './tour-migrations.mjs?v=siberia-1';
import {vinlandRoutes} from './tour-vinland.mjs?v=territories-1';
export {silkRoadRoutes,polynesiaRoutes,silkRoadSources} from './tour-route-data.mjs?v=sporadic-1';
export {sampleRoute,projectTourRoutes,routePath,createTourRoutes} from './tour-route-renderer.mjs?v=sporadic-1';
export const silkRoadTradeRoutes=silkTradeRoutes(silkRoadRoutes);
export const tourRouteSets={'silk-road':silkRoadTradeRoutes,'french-polynesia':polynesiaRoutes,'origin-of-mankind':migrationRoutes,'iceland-to-vinland':vinlandRoutes};
