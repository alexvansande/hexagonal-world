import {tourLocations} from './tour-markers.mjs?v=history-4';

// Story landing pages: root-level links such as /silk-road/ that open the map
// with the history timeline focused on that story. Each has a social preview.
export const tourPages=tourLocations.filter(location=>location.overlay).map(location=>({
 ...location,path:`/${location.id}/`,image:`/social/tour-${location.id}.jpg`,
}));
export const readTourPath=path=>tourPages.find(tour=>tour.path===path.replace(/\/?$/,'/'))||null;
