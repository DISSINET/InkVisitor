# design-sync notes — InkVisitor

## Shape

The client is a Vite **application**, not a published component library, so the
synced surface is declared by hand in `packages/client/design-sync/`:

- `index.tsx` — the converter entry (`--entry packages/client/design-sync/index.tsx`).
  Re-exports the whole `components` barrel plus the presentational parts of
  `components/advanced`, and additionally `Theme/icons` (`Ico*`), `theme`,
  `darkTheme`, and the shared enums, because the component props are typed in
  terms of those.
- `DSProvider.tsx` — redux store + HelmetProvider + ThemeProvider + GlobalStyle +
  DndProvider + MemoryRouter + QueryClientProvider, wired as `cfg.provider`.
  With it every component renders; without it the styled-components theme is
  undefined and the DnD-aware ones throw.
- `env-shim.ts` — Vite substitutes `process.env.*` at build time and the
  converter's esbuild pass substitutes only `NODE_ENV`, so the remaining lookups
  need a `process` object to exist first. `package.json` next to it carries
  `"sideEffects": true`, because the client package declares `"sideEffects": false`
  and esbuild otherwise drops the shim import entirely (silent — the failure
  surfaces later as `process is not defined` inside `api`). That `package.json`
  deliberately has no `name`: the converter walks up from the entry to the
  nearest *named* package.json to find `PKG_DIR`, and a name here would make it
  stop one directory too early.

## Build order

`cfg.buildCmd` emits declarations before the converter runs:

```sh
cd packages/client && npx tsc --emitDeclarationOnly --declaration --outDir dist/types --incremental false
```

It prints many `TS2883`/`TS4023` errors (styled-components inferred types that
can't be named portably). Those do not block emit — `dist/types/` is written
regardless, and it is the only source of real prop contracts. Without it every
`<Name>.d.ts` degrades to `[key: string]: unknown`.

## Forked lib scripts

- `overrides/dts.mjs` — this repo names a component's props interface after the
  component (`interface Message`), per CLAUDE.md, not `<Name>Props`. The stock
  extractor only looks for `<Name>Props`, so 58/65 components resolved to an
  index signature. The fork adds a second lookup: an interface or type alias
  named exactly `<Name>` in a file that also declares the value `<Name>`.
- `overrides/source-kit.mjs` — groups come from `.design-sync/groups.json`
  instead of the source tree. Doc-frontmatter `category` cannot do this job: it
  only wins over a group that came out generic, and every component here gets a
  non-generic dir-derived group. Left alone the picker gets sections named both
  `iconbuttongroup` and `iconbuttongroups`.

Both forks need `.design-sync/node_modules` (symlink to `../.ds-sync/node_modules`)
because they import `ts-morph` by bare name. Recreate it per clone:
`ln -sfn ../.ds-sync/node_modules .design-sync/node_modules`.

## Authoring previews

- Import everything from `"dissinet.ddb.client"`. Available: the 65 components,
  the `Ico*` icon set, `EntityEnums`/`RelationEnums`/`UserEnums`, `theme`,
  `darkTheme`.
- Props come from `ds-bundle/components/<group>/<Name>/<Name>.d.ts` — accurate
  and JSDoc-carrying once declarations are emitted.
- Previews compile through esbuild with no typecheck, so a string enum member
  can be written as its literal (`size="S"`).
- `TagGroup` is **not** a layout wrapper — it takes `definedEntities: IEntity[]`
  and renders its own `EntityTag`s. A variant sweep needs a local flex `Row`.
- `Button`'s `size` only moves padding on a labelled button; the icon glyph is
  sized in em, so the size axis is only visible on icon-only buttons.
- Realistic content follows the DISSINET domain: historical entities,
  territories, statements (Council of Trent, Charles V, 1545–1563).

## Component behaviour worth knowing before authoring a preview

Collected while authoring the 64 previews; each of these cost an iteration.

- **`Input`'s `.d.ts` lists `type="select"` but `Input.tsx` has no render branch
  for it** — that mode renders the label and nothing else. A repo bug, not a
  sync artifact.
- **`MultiInput` defaults to `disabled = true`** (meaning read-only), so an
  editable cell must pass `disabled={false}` explicitly.
- **`EntityColors` (client `types.ts`) only covers entity classes T/R/A/S/C/E/G/L.**
  P/B/O/V have theme colors but no `EntityColors` entry, and `EntityTag` reads
  it unguarded — those classes throw. Fixtures stay on the covered set.
- **`theme.color["button"].success` is indigo, not green** — a `success` pill
  that looks blue is correct.
- **`SwitchGroup` is a layout shell**: its `Button` children need
  `noBorder inverted noBackground` (the active one additionally `color`,
  `textColor="white"`, `noHoverBackground`) for the sliding pill to show.
- **`IconButtonGroup`'s `disabled` unmounts every non-selected option** rather
  than dimming them. A Disabled cell showing one icon is right.
- **`AttributeButtonGroup` hides an option's `shortIcon` when it is selected**
  (`option.icon ?? (!option.selected && option.shortIcon)`) — pass `icon`.
- **`Table`'s `fullWidthColumn` squeezes every other column to `width: 1%`**, so
  a full-label `EntityTag` in a neighbouring column gets crushed; use
  `showOnly="tag"` there.
- **`TypeBar` is `position: absolute`** and needs a sized, `position: relative`
  parent.
- **`AttributeIcon` is a bare unstyled glyph** — real usage always puts it in a
  `Button` `icon` slot.
- **`AbbreviatedTextWithTooltip` sets no width of its own**, so it only
  ellipsizes inside a width-constrained ancestor.
- **`UserTag`'s `bright` variant paints a fixed white background with no
  theming**, so it is invisible on a white card and needs a dark backdrop. It
  has no call site anywhere in the app.
- **`Box` does not narrow itself on `isExpanded={false}`** — in the app that
  width comes from `Panel` via redux.
- **Hover-only tooltips** (`IconWithTooltip`, `WarningIcon`,
  `AbbreviatedTextWithTooltip`) can be forced open for capture by dispatching a
  real bubbling `mouseover` at the component's root node from a `useEffect`.
- **Separator components**: omit `panelIndex`/`boxHeightVarKey`/`positionVarKey`
  (they reference shared CSS vars that do not exist in isolation) and let the
  components' own `--separator-x/y` fallback apply. The app's 62.5% root font
  size makes their `value/10rem` units equal plain px.
- **`Toast` is only the react-toastify container.** Its preview mounts the
  container and raises real `toast.*()` calls with `autoClose: false`, which is
  why `toast` is re-exported from the sync entry.

## States that genuinely cannot render statically

Recorded so a future run does not treat these as regressions to fix:

- `Dropzone` — `isOver` / wrong-category visuals are react-dnd state, not props.
  Two cells by design.
- `Menu` — the dropdown opens on internal hover state with no prop path in.
  Cells show the closed trigger.
- `Page` — its content area is gated by redux `contentHeight`/`layoutWidth`,
  both `0` in the empty store, so every prop combination yields the same
  header + Loader shell. One cell by design.
- `BreadcrumbItem` — only renders when handed `territoryData` directly; the
  query-cache path is dead without a backend. That is a real app path too.
- `UserTag` — react-query never resolves, so it falls back to rendering the raw
  `userId`; previews pass human-readable ids plus `disableFetch`.
- `ContactOwnerFooting` — propless and reads the owner email through a live
  query with no injection point. It renders empty, so it deliberately ships the
  floor card rather than an authored blank.

## Known render warns

- Every unauthored component shows the typographic floor card. That is the
  deliberate baseline, not a failure. `ContactOwnerFooting` is the only one.
- `Loader`'s default `DotLoader` genuinely renders two out-of-phase bouncing
  dots, so a static capture always shows one prominent and one faint.
- `WarningIcon` / `Message` styling is uniform across warning types — the DS has
  no severity color axis, so type sweeps vary copy only, not appearance.
- `Submit` trips `variants render identically`. Its cells differ in copy and in
  whether an entity tag is shown, not in chrome — the component renders one
  confirmation dialog shape regardless. Benign.
- The modal parts and the two separators carry `cardMode` overrides
  (`single` / `column`) in `cfg.overrides`. Without them the fixed-position
  dialog escapes its grid cell and the separators overflow it.

## Re-sync risks

- `dist/types/` is generated, gitignored, and **not** checked by the converter
  for staleness. A component whose props changed since the last emit will ship
  a stale contract unless `cfg.buildCmd` is re-run first. When in doubt, re-run it.
- `packages/client/design-sync/index.tsx` is a hand-maintained export list. New
  components added to `src/components/basic` do **not** appear in the sync until
  they are added there *and* to `cfg.componentSrcMap` *and* to
  `.design-sync/groups.json`. All three, or the build silently omits them.
- `cfg.dtsPropsFor` pins four components whose props the extractor cannot reach
  (`ButtonGroups`, `AttributeIcon` — inline type; `ContactOwnerFooting`, `Toast`
  — genuinely propless). If those components gain real props, the pins go stale
  silently.
- The advanced components in scope (`Page`, `LeftHeader`, `RightHeader`,
  `EntityTag`, `BreadcrumbItem`) read redux and react-query. They render because
  `DSProvider` supplies both with an empty store and a no-retry query client, so
  they show their empty/loading state rather than real data.
