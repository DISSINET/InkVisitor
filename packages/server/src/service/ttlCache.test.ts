import "ts-jest";
import { TtlCache, cache as singletonCache } from "./ttlCache";

describe("TtlCache", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("get / set", () => {
    it("returns undefined for missing key", () => {
      const cache = new TtlCache();
      expect(cache.get("nope")).toBeUndefined();
    });

    it("returns value when set and within TTL", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      expect(cache.get<number>("a")).toBe(1);
    });

    it("overwrites existing key", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      cache.set("a", 2, 1000);
      expect(cache.get<number>("a")).toBe(2);
      expect(cache.size).toBe(1);
    });

    it("stores heterogeneous values under different keys", () => {
      const cache = new TtlCache();
      cache.set("num", 42, 1000);
      cache.set("str", "hello", 1000);
      cache.set("obj", { id: "x" }, 1000);
      expect(cache.get<number>("num")).toBe(42);
      expect(cache.get<string>("str")).toBe("hello");
      expect(cache.get<{ id: string }>("obj")).toEqual({ id: "x" });
    });
  });

  describe("TTL expiry", () => {
    it("returns undefined after ttlMs elapses", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      jest.setSystemTime(1000);
      expect(cache.get("a")).toBeUndefined();
    });

    it("still returns value just before ttlMs", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      jest.setSystemTime(999);
      expect(cache.get<number>("a")).toBe(1);
    });

    it("removes expired entry from internal store on read", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      jest.setSystemTime(1000);
      cache.get("a");
      expect(cache.size).toBe(0);
    });

    it("set after expiry resets TTL", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      jest.setSystemTime(1500);
      cache.set("a", 2, 1000);
      jest.setSystemTime(2400);
      expect(cache.get<number>("a")).toBe(2);
      jest.setSystemTime(2500);
      expect(cache.get("a")).toBeUndefined();
    });

    it("different entries can have different TTLs", () => {
      const cache = new TtlCache();
      cache.set("short", 1, 500);
      cache.set("long", 2, 5000);
      jest.setSystemTime(1000);
      expect(cache.get("short")).toBeUndefined();
      expect(cache.get<number>("long")).toBe(2);
    });

    it("entries set without ttlMs never expire", () => {
      const cache = new TtlCache();
      cache.set("forever", 42);
      jest.setSystemTime(Number.MAX_SAFE_INTEGER);
      expect(cache.get<number>("forever")).toBe(42);
    });
  });

  describe("delete / clear", () => {
    it("delete removes a single entry", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      cache.set("b", 2, 1000);
      cache.delete("a");
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get<number>("b")).toBe(2);
    });

    it("clear removes all entries", () => {
      const cache = new TtlCache();
      cache.set("a", 1, 1000);
      cache.set("b", 2, 1000);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBeUndefined();
    });

    it("deletePrefix removes only matching keys", () => {
      const cache = new TtlCache();
      cache.set("user:byId:1", { id: "1" }, 1000);
      cache.set("user:byId:2", { id: "2" }, 1000);
      cache.set("entity:byId:1", { id: "1" }, 1000);
      cache.deletePrefix("user:byId:");
      expect(cache.get("user:byId:1")).toBeUndefined();
      expect(cache.get("user:byId:2")).toBeUndefined();
      expect(cache.get<{ id: string }>("entity:byId:1")).toEqual({ id: "1" });
    });
  });

  describe("isolation from caller mutations", () => {
    it("mutating the input after set does not affect later get", () => {
      const cache = new TtlCache();
      const input = { id: "x", nested: { value: 1 } };
      cache.set("k", input, 1000);
      input.id = "y";
      input.nested.value = 99;
      expect(cache.get<typeof input>("k")).toEqual({
        id: "x",
        nested: { value: 1 },
      });
    });

    it("mutating a returned value does not affect later get", () => {
      const cache = new TtlCache();
      cache.set("k", { id: "x", tags: ["a"] }, 1000);
      const first = cache.get<{ id: string; tags: string[] }>("k")!;
      first.id = "y";
      first.tags.push("b");
      expect(cache.get<{ id: string; tags: string[] }>("k")).toEqual({
        id: "x",
        tags: ["a"],
      });
    });

    it("preserves Date values across set/get", () => {
      const cache = new TtlCache();
      const d = new Date("2025-01-01T00:00:00Z");
      cache.set("k", { when: d }, 1000);
      const out = cache.get<{ when: Date }>("k")!;
      expect(out.when.toISOString()).toBe(d.toISOString());
    });
  });

  describe("snapshot / trySet (generation counter)", () => {
    it("snapshot returns 0 for an unseen key and is stable across reads", () => {
      const cache = new TtlCache();
      expect(cache.snapshot("k")).toBe(0);
      expect(cache.snapshot("k")).toBe(0);
    });

    it("delete bumps the snapshot", () => {
      const cache = new TtlCache();
      const v0 = cache.snapshot("k");
      cache.delete("k");
      expect(cache.snapshot("k")).toBe(v0 + 1);
    });

    it("trySet succeeds when no invalidation happened", () => {
      const cache = new TtlCache();
      const v = cache.snapshot("k");
      const ok = cache.trySet("k", { value: 1 }, 1000, v);
      expect(ok).toBe(true);
      expect(cache.get<{ value: number }>("k")).toEqual({ value: 1 });
    });

    it("trySet is rejected when an invalidation fired between snapshot and trySet", () => {
      const cache = new TtlCache();
      const v = cache.snapshot("k");
      cache.delete("k"); // simulates a writer firing between read start and read end
      const ok = cache.trySet("k", { stale: true }, 1000, v);
      expect(ok).toBe(false);
      expect(cache.get("k")).toBeUndefined();
    });

    it("deletePrefix bumps in-flight snapshots even if the entry was never stored", () => {
      const cache = new TtlCache();
      const v = cache.snapshot("user:byId:1");
      // Snapshot was taken, but reader hasn't trySet yet. deletePrefix
      // should still cause the next trySet to fail.
      cache.deletePrefix("user:byId:");
      const ok = cache.trySet("user:byId:1", { id: "1" }, undefined, v);
      expect(ok).toBe(false);
      expect(cache.get("user:byId:1")).toBeUndefined();
    });

    it("clear bumps every known snapshot so in-flight trySets are rejected", () => {
      const cache = new TtlCache();
      const v = cache.snapshot("k");
      cache.clear();
      const ok = cache.trySet("k", { stale: true }, 1000, v);
      expect(ok).toBe(false);
    });

    it("trySet supports undefined ttlMs", () => {
      const cache = new TtlCache();
      const v = cache.snapshot("k");
      cache.trySet("k", { x: 1 }, undefined, v);
      jest.setSystemTime(Number.MAX_SAFE_INTEGER);
      expect(cache.get<{ x: number }>("k")).toEqual({ x: 1 });
    });
  });

  describe("LRU eviction", () => {
    it("evicts the oldest entry when size exceeds maxEntries", () => {
      const cache = new TtlCache({ maxEntries: 2 });
      cache.set("a", 1, 1000);
      cache.set("b", 2, 1000);
      cache.set("c", 3, 1000);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get<number>("b")).toBe(2);
      expect(cache.get<number>("c")).toBe(3);
      expect(cache.size).toBe(2);
    });

    it("get refreshes recency so frequently-read entries are kept", () => {
      const cache = new TtlCache({ maxEntries: 2 });
      cache.set("a", 1, 1000);
      cache.set("b", 2, 1000);
      // touch `a` - now `b` is the oldest
      expect(cache.get<number>("a")).toBe(1);
      cache.set("c", 3, 1000);
      expect(cache.get<number>("a")).toBe(1); // survived
      expect(cache.get("b")).toBeUndefined(); // evicted
      expect(cache.get<number>("c")).toBe(3);
    });

    it("Infinity maxEntries (default) never evicts", () => {
      const cache = new TtlCache();
      for (let i = 0; i < 1000; i++) cache.set(`k${i}`, i, 60_000);
      expect(cache.size).toBe(1000);
      expect(cache.get<number>("k0")).toBe(0);
    });

    it("eviction does not bump versions (in-flight trySet still lands)", () => {
      const cache = new TtlCache({ maxEntries: 1 });
      const v = cache.snapshot("a");
      cache.set("z", "filler", 1000); // evicts nothing yet (a was never set)
      // a's snapshot is still 0; trySet should succeed even though we've
      // never set a and z occupies the only slot.
      const ok = cache.trySet("a", "value", 1000, v);
      expect(ok).toBe(true);
      // setting `a` evicted `z`
      expect(cache.get<string>("a")).toBe("value");
      expect(cache.get("z")).toBeUndefined();
    });
  });

  describe("singleton export", () => {
    it("exports a shared instance", () => {
      singletonCache.clear();
      singletonCache.set("ping", "pong", 1000);
      expect(singletonCache.get<string>("ping")).toBe("pong");
      singletonCache.clear();
    });
  });
});
