# Working in Hexagonal Earth

Read [DESIGN-DECISIONS.md](DESIGN-DECISIONS.md) before changing geometry, map
behavior, presets, rendering, exports, or public copy. It records the reasoning
and corrections that must survive between sessions. Use [README.md](README.md)
for implementation details and [AUDIT.md](AUDIT.md) for diagnosed failures.

## Start with the established design

- Inspect the relevant existing implementation and tests before proposing a
  replacement. “Our usual grid” means `dist/subgrid.mjs`, not a new subdivision.
- Preserve accepted visual references. Explain a proposed departure before
  implementing it; visual similarity alone does not establish equivalence.
- Treat the latest explicit user correction as superseding the older decision
  on that topic. An assistant suggestion, experiment, or claim that tests passed
  is not evidence of user acceptance.
- Act on requested fixes. Acknowledging a mismatch is not fixing it. Finish the
  change, verify it, and distinguish local completion from publication.
- Preserve unrelated working-tree changes. Keep fixes within the requested
  scope; removing a feature does not authorize removing adjacent controls.

## Invariants worth checking

- Gosper subdivision uses the shared seven-child hierarchy, alternating turns,
  and whole hexagons for puzzle pieces. Never substitute clipped Voronoi cells.
- Match map/puzzle edges by their full oriented edge identity. A neighbor can
  meet the same piece on more than one side.
- New outlines need correct geography, clipping, lighting, fitting and exports,
  not just a stroke over the old silhouette.
- Format and style are separate controls. Presets should not accidentally import
  the pan/zoom or open panels from a reference link.
- Shared URLs are durable. Append positional state keys rather than reordering
  them; preserve old links and meaningful false/zero values.
- Preserve the author's public voice. When asked to review copy before editing,
  give the review and wait for approval of the wording. Do not turn that local
  copy-review requirement into a blanket permission gate for coding work.

## Verification and delivery

- Run `npm start` for the static preview; reuse a working server when available.
- After editing the app HTML, regenerate local routes with
  `node scripts/build-share-pages.mjs`. Update relevant asset cache versions.
- Use focused regression tests for the changed invariant; run `npm test` for
  changes spanning geometry, rendering, saved state or exports. A visual change
  also needs inspection in the browser at the user's saved view when available.
- Test the failure that caused the correction, not just the new implementation's
  internal consistency. State which checks were performed and any limits.
- Production is documented as GitHub Pages in the README and Pages workflow.
  `.openai/hosting.json` is labeled legacy metadata. Do not infer an authorized
  hosting migration from its presence. If active tooling instructions conflict,
  surface the conflict; do not silently publish to another destination or bypass
  an approval rejection. This guide grants no new publishing authorization.
- Keep DESIGN-DECISIONS.md current when a user approves a consequential change:
  record the choice, reason, superseded alternative, and relevant evidence.
  Record unresolved questions as unresolved. Do not append a chat transcript.
