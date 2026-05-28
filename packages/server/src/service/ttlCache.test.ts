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

  describe("singleton export", () => {
    it("exports a shared instance", () => {
      singletonCache.clear();
      singletonCache.set("ping", "pong", 1000);
      expect(singletonCache.get<string>("ping")).toBe("pong");
      singletonCache.clear();
    });
  });
});
