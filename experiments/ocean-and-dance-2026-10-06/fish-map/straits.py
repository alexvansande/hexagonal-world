"""Hard-coded ocean connections and peninsula transects (lat, lon waypoints).

STRAITS: water paths that must stay kept and joined even where narrower than
the mesh (or the 9 km mask). Each polyline runs from one water body to the
other through the strait. The Suez Canal is artificial and deliberately NOT
listed; the Caspian has no natural ocean outlet and stays excluded.
PENINSULAS: transects from water on one side of a thin land mass to water on
the other; used to check that the unfolded map does not join ocean across land.
"""
STRAITS = {
    'Gibraltar': [(36.0, -6.5), (35.95, -5.6), (36.1, -4.5)],
    'Dardanelles-Marmara-Bosporus': [(39.8, 25.9), (40.2, 26.4), (40.7, 28.0), (41.05, 29.05), (41.4, 29.3)],
    'Kerch (Sea of Azov)': [(45.0, 36.4), (45.35, 36.55), (45.6, 36.7)],
    'Bab-el-Mandeb (Red Sea)': [(12.0, 44.5), (12.6, 43.4), (13.5, 42.8)],
    'Hormuz (Persian Gulf)': [(25.5, 57.3), (26.5, 56.5), (26.4, 55.0)],
    'Skagerrak-Kattegat': [(57.5, 7.0), (57.9, 9.5), (57.3, 11.0)],
    'Oresund (Baltic)': [(57.0, 11.5), (56.0, 12.7), (55.4, 12.9), (55.0, 13.5)],
    'Kvarken (Gulf of Bothnia)': [(63.2, 20.6), (63.6, 21.0), (64.2, 21.8), (65.0, 23.5)],
    'Gorlo (White Sea)': [(68.0, 42.0), (66.8, 41.5), (66.2, 40.0), (65.6, 38.0), (64.6, 36.6)],
    'Gulf of Ob (estuary)': [(72.5, 73.5), (70.0, 73.5), (68.0, 74.0), (66.8, 72.5)],
    'Juan de Fuca-Georgia': [(48.4, -124.8), (48.3, -123.5), (48.9, -123.3), (49.5, -124.0)],
    'Gulf of Suez': [(27.5, 34.0), (28.5, 33.0), (29.6, 32.6)],
    'Gulf of Aqaba (Tiran)': [(27.6, 34.3), (28.2, 34.6), (29.0, 34.75)],
    'Lake Maracaibo outlet': [(11.5, -71.0), (10.9, -71.6), (10.0, -71.6)],
    'English Channel': [(49.5, -4.0), (50.2, -1.0), (51.0, 1.5), (51.5, 2.5)],
    'Bering': [(64.5, -169.5), (65.8, -168.8), (67.0, -168.5)],
    'Fram': [(76.0, 0.0), (79.0, 0.0), (82.0, 0.0)],
    'Davis': [(62.0, -58.0), (67.0, -58.0), (72.0, -62.0)],
    'Hudson Strait': [(61.0, -64.0), (62.3, -70.0), (63.0, -76.0), (61.5, -80.0)],
    'Nares': [(76.5, -72.0), (79.0, -70.0), (81.5, -63.0), (83.0, -58.0)],
    'Parry Channel (NW Passage)': [(74.2, -80.0), (74.5, -90.0), (74.5, -100.0), (74.5, -110.0), (74.5, -120.0), (73.5, -127.0)],
    'Malacca-Singapore': [(6.0, 97.5), (3.5, 100.0), (1.5, 102.5), (1.2, 104.0), (1.5, 105.0)],
    'Torres': [(-10.0, 140.0), (-10.3, 142.2), (-10.0, 144.0)],
    'Magellan': [(-52.5, -68.5), (-53.5, -70.5), (-53.3, -72.3), (-52.5, -74.5)],
    'Drake Passage': [(-56.0, -66.0), (-58.0, -64.0), (-61.0, -62.0)],
}
PENINSULAS = {
    'Malay Peninsula (7N)': [(7.0, 98.5), (7.0, 101.5)],
    'Kra Isthmus (10N)': [(10.0, 98.0), (10.0, 99.8)],
    'Baja California': [(27.0, -115.0), (27.0, -111.8)],
    'Italy': [(41.0, 12.6), (42.0, 16.0)],
    'Korea': [(37.0, 124.5), (37.0, 130.0)],
    'Antarctic Peninsula': [(-66.0, -70.0), (-66.0, -58.0)],
    'Kamchatka': [(55.0, 155.0), (55.0, 163.0)],
    'Florida': [(27.0, -84.0), (27.0, -79.5)],
    'Isthmus of Panama': [(9.6, -79.8), (8.6, -79.6)],
    'Isthmus of Suez (no natural strait)': [(31.5, 32.3), (29.6, 32.6)],
    'Jutland': [(56.0, 7.8), (56.0, 11.0)],
    'Crimea': [(45.0, 32.5), (45.6, 35.3)],
}
