## Query Page (FE) — Current Status and Next Steps

### Purpose

Keep the current two-pane layout (Query builder + Explore results) while making the Explore view fast, smooth, and maintainable for large result sets. Frontend-only scope.

### What’s live now

- Query ownership

  - `QueryPage` owns query state, explore window state, and data fetching.
  - Query key shape (current): `['query', { query, explore }]`.
  - TanStack Query v5 config: `staleTime: 5m`, `gcTime: 30m`; previous data is retained by default in v5.
  - Enabled only when the query is valid and the user is logged in.
  - Header-level fetching indicator (`Loader` + subtle spinner in Explore).

- Windowed fetching and debouncing

  - Explore window is driven from the virtualized list’s visible range plus overscan (±20 rows).
  - Debounced window updates (120 ms) to reduce refetch churn.
  - Fetch size capped based on viewport to avoid oversized windows.

- Virtualized Explore table

  - Virtualized list (`List`) with variable row sizes via measurement and a per-row size cache.
  - `overscanCount = 20`.
  - Expanded content is measured; cached height is updated so layout stays correct.
  - `ExplorerTableRow` is memoized.

- Mutations & invalidation

  - Narrow invalidation via `invalidateActiveQuery()` threaded from `QueryPage` → `ExplorerBox` → `ExplorerTable`/rows.
  - Broad invalidation fallback is preserved where needed.
  - Equality-based redundant invalidations in `QueryPage` were removed.

- UX polish (partial)
  - No flashes during scroll; retained rows with subtle loading placeholders while fetching.

### Temporarily disabled

- Neighbor prefetch on scroll stop (will return once keying/virtualization is finalized to avoid duplicate requests).

### Not yet implemented (Next steps)

- Better query keys (Phase 2)

  - Build a stable signature of all parameters that affect identity and ordering.
  - Target final key shape: `['query', stableSignature, { offset, limit }]`.
  - Use `setQueriesData` to update all windows under the same signature.
  - Re-introduce neighbor prefetch using the same signature.

- Virtualization improvements (Phase 3)

  - Continue refining variable-size handling and reset logic after expand/collapse.
  - Consider sticky first column in Explore (CSS-first approach).
  - Track selection/expansion by `entity.id` instead of row index.
  - Consistent skeletons for visible-but-missing rows.

- Normalized window cache (optional, Phase 4)

  - Consider TanStack DB for normalized `entities` + `windows` to dedupe overlaps and enable instant revisits.

- UX polish (Phase 5)
  - Keyboard navigation, improved tooltips, clearer error states.

### Non-goals

- No backend API changes.
- No infinite scroll; keep explicit offset/limit semantics.

### Quick backlog (ordered)

1. Implement stable signature builder and switch query keys.
2. Re-introduce neighbor prefetch driven by the stable signature.
3. Refine variable-size virtualization and height reset after expand/collapse.
4. Switch selection/expansion tracking to `entity.id`.
5. Evaluate TanStack DB for normalized window caching (if cache reuse remains a pain point).
