# Territory and North Atlantic tours

Compiled September 21, 2026. Story text is editable in `tour-stories.md`.

## Reading these overlays

The four imperial outlines are **editorial, approximate envelopes**, not surveyed
borders or a GIS reconstruction from primary administrative records. They show
the broad maximum reach of the chosen empire, including areas governed through
dependent rulers. They do not imply equal, continuous or uncontested control.
Frontier detail remains open to refinement. Modern coastlines are retained.

Coordinates are authored in `scripts/tour-area-envelopes.json` and clipped to a
dissolved Natural Earth 1:50m land mask (v5.1.1); modern country boundaries are
not used as imperial boundaries. Small offshore fragments are omitted. The
generated GeoJSON geometries are in `tour-area-data.mjs`. The Amazon is extracted
from a drainage dataset separately and is not hand drawn.

## Egypt — Thutmose III, 15th century BCE

[National Museum of Egyptian Civilization: Thutmose III](https://nmec.gov.eg/mummies-hall/Thutmose-iii/)
places the farthest reach between the Euphrates and the Nile’s Fourth Cataract.
The outline represents Egypt, Nubia and the Levantine sphere of rule. The broad
desert and Levantine margins are schematic; the northern limit does not mean
all the land reached by an expedition became a directly administered province.

## Mesopotamia — Neo-Assyrian Empire, 7th century BCE

[British Museum: Introducing the Assyrians](https://www.britishmuseum.org/blog/introducing-assyrians)
includes a map of the empire at its greatest extent under Ashurbanipal.
[British Museum: Who was Ashurbanipal?](https://www.britishmuseum.org/blog/who-was-ashurbanipal)
provides the imperial context. This tour combines the peak reach under
Esarhaddon and Ashurbanipal, including brief control in Egypt and dependent
Cypriot kingdoms; it is not a snapshot of uniform administration in one year.
The user selected Neo-Assyria instead of treating Sumer’s city-states as one
empire. Mountain and desert frontiers are approximate.

## India — Mauryan Empire under Ashoka, about 250 BCE

[National Geographic Society: Mauryan Empire](https://education.nationalgeographic.org/resource/mauryan-empire/)
describes its broad subcontinental reach and Ashoka’s conquest of Kalinga.
The envelope includes the northwest, Gangetic plain, Bengal, Kalinga and much
of the Deccan, excluding the far southern kingdoms and Sri Lanka. It is the
peak of this chosen ancient empire, not a claim to the largest state ever to
rule any part of India. Himalayan, northeastern and southern margins, and the
degree of authority over forest communities, are uncertain.

## China — Qing Empire under Qianlong, late 18th century

[Columbia University, Asia for Educators: The Kangxi and Qianlong Emperors](https://afe.easia.columbia.edu/qing/emperors.html)
provides the expansion map and multiethnic imperial context, with scholarly
consultants Maxwell K. Hearn and Madeleine Zelin. The envelope includes Outer
Mongolia, Tuva and Outer Manchuria, as well as Xinjiang and Tibet. It excludes
tributary neighbors such as Korea, Vietnam, Nepal and Burma. Taiwan is represented
by a western administrative belt rather than assuming complete Qing control of
the island’s indigenous interior. Frontier authority was varied; the line is an
overview and is not a modern territorial claim.

## Norway, Iceland, Greenland and Vinland

[National Museum of Denmark: North Atlantic](https://natmus.dk/historisk-viden/verden/nordatlanten/)
provides the island settlement sequence.
[Parks Canada: A Saga of Discovery](https://parks.canada.ca/lhn-nhs/nl/meadows/culture/saga)
discusses the sagas and the archaeological settlement at L’Anse aux Meadows.
[Parks Canada: Management plan](https://parks.canada.ca/lhn-nhs/nl/meadows/info/gestion-management-2019)
explains its role as a base for wider exploration.

Routes combine settlement and exploration across generations, not a single
recorded journey. Western Norway near present-day Bergen is a geographic anchor:
[Bergen’s official visitor site](https://en.visitbergen.com/ideas-and-inspiration/explore-bergen/bergen-world-heritage-city)
dates the city’s foundation to 1070, after the first westward settlement voyages.
Shetland and the Faroes are included as stepping stones, not mandatory stops on
every voyage. Paths round southern Iceland and Cape Farewell, follow western
Greenland, then reach Baffin Island (Helluland), Labrador (Markland) and northern
Newfoundland. Saga identifications and ship tracks are approximate. The endpoint
does not assert that all Vinland was confined to Newfoundland.

## Amazon basin — HydroBASINS v1c

[HydroBASINS](https://www.hydrosheds.org/products/hydrobasins), South America,
standard level 03: **HYBAS_ID 6030007000**, Pfafstetter code **622**, source area
**5,912,922.8 km²**. This is the Amazon catchment; the dataset keeps Tocantins and
nearby coastal catchments separate. The displayed boundary is simplified by
0.018° with topology preserved, so its visible area is not a new measurement.

Source archive: [official South America download](https://data.hydrosheds.org/file/hydrobasins/standard/hybas_sa_lev01-12_v1c.zip).
Attribution: HydroSHEDS / WWF; Lehner, B. and Grill, G. (2013), “Global river
hydrography and network routing: baseline data and new approaches to study the
world’s large river systems”, *Hydrological Processes*, 27(15), 2171–2186.
[DOI](https://doi.org/10.1002/hyp.9740).

HydroBASINS uses the [HydroSHEDS license agreement](https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf).
This is a modified, simplified extract; it is supplied without warranty and
should not be used for local drainage, engineering or navigation decisions.

Required HydroSHEDS attribution:

This product Hexagonal Earth incorporates data from the HydroSHEDS version 1
database which is © World Wildlife Fund, Inc. (2006-2022) and has been used herein
under license. WWF has not evaluated the data as altered and incorporated within
Hexagonal Earth, and therefore gives no warranty regarding its accuracy,
completeness, currency or suitability for any particular purpose. Portions of
the HydroSHEDS v1 database incorporate data which are the intellectual property
rights of © USGS (2006-2008), NASA (2000-2005), ESRI (1992-1998), CIAT (2004-2006),
UNEP-WCMC (1993), WWF (2004), Commonwealth of Australia (2007), and Her Royal
Majesty and the British Crown and are used under license. The HydroSHEDS v1
database and more information are available at https://www.hydrosheds.org.

Natural Earth coastline data are [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

## Regeneration

Install `pyshp` and `shapely` in a temporary Python environment. Extract
`hybas_sa_lev03_v1c.*` from the official archive into `data/tour-areas/`, retain
the existing `data/countries/ne_50m_admin_0_countries.*`, then run
`python3 scripts/build-tour-areas.py`. Source downloads stay outside Git; the
small generated module is bundled with the app, with no runtime GIS dependency.
