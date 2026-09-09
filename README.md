# Hex Atlas

A dependency-free WebGL app using the supplied 4320 × 2160 equirectangular continent texture.

Run `npm start`, then open http://localhost:4173. Run `npm test` for geometry validation.

## Implemented

- Tetrahedral faces expanded into regular hexagons through their alternating vertices and edge midpoints.
- Four octahedral faces plus the three centroid-divided neighboring face pieces per hexagon.
- Twelve rhombic dodecahedron faces partitioned into four groups of three rhombi.
- Tetrakis hexahedron with configurable pyramid tip distance (cube half-edge = 1).
- 81 valid connected layouts for each construction, built by matching oriented spherical edges and rejecting overlaps or incompatible contacts.
- Global longitude, latitude and roll; central projection or normalized vertex interpolation; triangle barycentric shape bias.
- Canvas pan, cursor-centered zoom, globe rotation, touch pinch zoom, fitting, graticules, construction lines, edge labels, palettes and PNG export.

The supplied name “rhombic icosahedron” is interpreted as **rhombic dodecahedron** because the requested solid has 12 rhombic faces.

## Geometry and limitations

All four regions collectively cover the sphere exactly once. Hexagons remain flat. Exposed boundaries are cuts, and matching lowercase labels identify their paired edges. Every physically joined edge matches. This finite net does not claim an uninterrupted infinite honeycomb. Degree-two spherical junctions prevent all degree-three planar honeycomb vertices from preserving the boundary identifications.

Default central projection uses actual planar polyhedral coordinates. The normalized vertex option and shape bias are custom continuous interpolation controls, not published conformal/equal-area implementations. No area-preservation claim is made. Tetrakis at tip distance 2 converges to the rhombic dodecahedron geometry. No pentagonal geometry is present.

The tests check spherical area, all paired borders at 101 samples, and all contacts in every generated layout. Browser interaction and GPU shader execution are not automated in this project.

## Primary literature

- Alex Van de Sande, *Gosper World: A Hexagonal Map Using Gosper Fractals*, Bridges 2024, pp. 507–510. https://archive.bridgesmathart.org/2024/bridges2024-507.pdf
- Jacob Rus, *Flowsnake Earth*, Bridges 2017, pp. 237–244. https://archive.bridgesmathart.org/2017/bridges2017-237.pdf
- B. J. S. Cahill's original writings, collected by Gene Keyes: https://www.genekeyes.com/B.J.S._CAHILL_RESOURCE.html

The app uses the polyhedral constructions as a basis, and does not implement Gosper fractal boundaries or Cahill's conformal projection formula.
