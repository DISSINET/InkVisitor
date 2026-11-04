/**
 * Gives the test environment a working `localStorage` and `sessionStorage`.
 *
 * Node exposes both as globals of its own that read `undefined` unless the
 * process was started with `--localstorage-file`. They are already present on
 * `globalThis` by the time the jsdom environment populates it, and jsdom's own
 * are not copied over a name that is taken - so every module that reads storage
 * at import time sees `undefined` and throws before a single test runs.
 *
 * Written out rather than borrowed from a second jsdom window because jsdom
 * ships no type declarations here, and the Storage contract is small enough to
 * state exactly: values are strings, a missing key reads null, and `key(i)`
 * follows insertion order.
 */
const memoryStorage = (): Storage => {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => (entries.has(key) ? (entries.get(key) as string) : null),
    setItem: (key: string, value: string) => void entries.set(String(key), String(value)),
    removeItem: (key: string) => void entries.delete(String(key)),
    clear: () => entries.clear(),
  };
};

for (const name of ["localStorage", "sessionStorage"] as const) {
  Object.defineProperty(globalThis, name, {
    value: memoryStorage(),
    configurable: true,
    writable: true,
  });
}

/**
 * Gives the test environment a `ResizeObserver`.
 *
 * jsdom ships none. The app's own hooks guard for that and skip observing, but a
 * map renderer constructs one unconditionally in its constructor, so a test that
 * mounts the geocoding map fails before it reaches an assertion. Observing
 * nothing is the honest stand-in: jsdom lays nothing out, so a real
 * implementation would have no size change to report either.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
