import { getTrustProxy } from "@common/trustProxy";

describe("trustProxy", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.TRUST_PROXY;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = env;
  });

  it("trusts one hop in production so req.secure survives the ingress", () => {
    process.env.NODE_ENV = "production";
    expect(getTrustProxy()).toBe(1);
  });

  it("trusts nothing outside production", () => {
    expect(getTrustProxy()).toBe(false);
    process.env.NODE_ENV = "development";
    expect(getTrustProxy()).toBe(false);
  });

  it("honours an explicit hop count", () => {
    process.env.TRUST_PROXY = "2";
    expect(getTrustProxy()).toBe(2);
  });

  it("allows opting out explicitly", () => {
    process.env.NODE_ENV = "production";
    process.env.TRUST_PROXY = "false";
    expect(getTrustProxy()).toBe(false);
    process.env.TRUST_PROXY = "0";
    expect(getTrustProxy()).toBe(false);
  });

  it("rejects `true`, which would let X-Forwarded-For be spoofed", () => {
    process.env.TRUST_PROXY = "true";
    expect(() => getTrustProxy()).toThrow(/positive integer hop count/);
  });

  it("rejects garbage rather than silently trusting nothing", () => {
    process.env.TRUST_PROXY = "yes-please";
    expect(() => getTrustProxy()).toThrow(/positive integer hop count/);
  });
});
