// Cross-checks the three hand-maintained component lists a sync reads:
// the exports of packages/client/design-sync/index.tsx, cfg.componentSrcMap
// and groups.json. The converter silently drops a component missing from any
// of them, so run this before every sync.
//
//   node .design-sync/check-lists.mjs
//
// Components are the PascalCase names exported from the entry, including the
// ones reached through `export * from "components"`. `export *` of any other
// module (the Ico* icon set) is not a component source. A null in
// componentSrcMap marks a deliberate exclusion.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// Non-component PascalCase exports of the entry.
const NOT_COMPONENTS = new Set(['EntityEnums', 'RelationEnums', 'UserEnums']);

const namesIn = (block) =>
  block
    .split(',')
    .map((s) => s.trim().split(/\s+as\s+/).pop().trim())
    .filter(Boolean);

const entry = read('packages/client/design-sync/index.tsx');
const barrel = read('packages/client/src/components/index.tsx');

const exported = new Set();
for (const [, block] of entry.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
  namesIn(block).forEach((n) => exported.add(n));
}
if (/export\s*\*\s*from\s*["']components["']/.test(entry)) {
  // the barrel's own `export { ... }` block has no `from`
  for (const [, block] of barrel.matchAll(/export\s*\{([^}]*)\}\s*;?\s*$/gm)) {
    namesIn(block).forEach((n) => exported.add(n));
  }
}

const cfg = JSON.parse(read('.design-sync/config.json'));
const srcMap = cfg.componentSrcMap ?? {};
const excluded = new Set(Object.keys(srcMap).filter((k) => srcMap[k] === null));
const mapped = new Set(Object.keys(srcMap).filter((k) => srcMap[k] !== null));
const grouped = new Set(Object.keys(JSON.parse(read('.design-sync/groups.json'))));

const components = new Set(
  [...exported].filter((n) => /^[A-Z]/.test(n) && !NOT_COMPONENTS.has(n) && !excluded.has(n)),
);

const missing = (from, label, inSet) => [...from].filter((n) => !inSet.has(n)).map((n) => `${n}: ${label}`);

const problems = [
  ...missing(components, 'exported but not in componentSrcMap', mapped),
  ...missing(components, 'exported but not in groups.json', grouped),
  ...missing(mapped, 'in componentSrcMap but not exported from index.tsx', components),
  ...missing(grouped, 'in groups.json but not exported from index.tsx', components),
];

if (problems.length) {
  console.error(`[check-lists] ${problems.length} mismatch(es):`);
  for (const p of problems.sort()) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`[check-lists] ${components.size} components, all three lists agree`);
