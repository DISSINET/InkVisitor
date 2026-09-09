// Vite replaces `process.env.*` at build time, so the client's sources read it
// as if it were a plain object. The design-sync bundler substitutes only
// NODE_ENV and leaves the rest as runtime lookups, which need `process` to
// exist before any module reading it is evaluated — hence a standalone module
// imported first, not a statement in the entry (ESM evaluates imports first).
const g = globalThis as unknown as {
  process?: { env?: Record<string, string | undefined> };
  appConfig?: { env: string };
};

if (!g.process) g.process = {};
if (!g.process.env) g.process.env = {};
if (!g.appConfig) g.appConfig = { env: "default" };

export {};
