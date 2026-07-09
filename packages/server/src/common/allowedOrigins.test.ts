import { getAllowedOrigins, isAllowedOrigin } from "@common/allowedOrigins";

describe("allowedOrigins", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.CORS_ORIGINS;
    delete process.env.DOMAIN;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = env;
  });

  it("builds origins from DOMAIN", () => {
    process.env.DOMAIN = "dissinet.cz";
    expect(getAllowedOrigins()).toEqual(
      expect.arrayContaining(["https://dissinet.cz", "http://dissinet.cz"])
    );
  });

  it("strips path from DOMAIN", () => {
    process.env.DOMAIN = "dissinet.cz/apps/inkvisitor-sandbox";
    expect(isAllowedOrigin("https://dissinet.cz")).toBe(true);
  });

  it("builds origins from CORS_ORIGINS", () => {
    process.env.CORS_ORIGINS = "https://a.test,http://b.test";
    expect(isAllowedOrigin("https://a.test")).toBe(true);
    expect(isAllowedOrigin("https://evil.test")).toBe(false);
  });
});
