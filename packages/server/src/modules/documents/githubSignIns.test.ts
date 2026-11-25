import "ts-jest";
import { githubSignIns } from "./githubSignIns";

describe("modules/documents githubSignIns", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    githubSignIns.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a token to the session and user it was stored for", () => {
    githubSignIns.setToken("sid", "user-1", "tok", 60, "octo");
    expect(githubSignIns.token("sid", "user-1")).toEqual({ accessToken: "tok", login: "octo" });
  });

  it("gives another user on the same session id nothing and forgets the sign-in", () => {
    githubSignIns.setToken("sid", "user-1", "tok", 60, "octo");
    expect(githubSignIns.token("sid", "user-2")).toBeUndefined();
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
  });

  it("forgets a token past its expiry", () => {
    githubSignIns.setToken("sid", "user-1", "tok", 60, "octo");
    jest.advanceTimersByTime(61_000);
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
  });

  it("keeps a token without an expiry for eight hours", () => {
    githubSignIns.setToken("sid", "user-1", "tok", undefined, "octo");
    jest.advanceTimersByTime(8 * 3600_000 - 1000);
    expect(githubSignIns.token("sid", "user-1")).toBeDefined();
    jest.advanceTimersByTime(2000);
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
  });

  it("returns a pending device code until it expires", () => {
    githubSignIns.setPending("sid", "user-1", "device", 900, 5);
    expect(githubSignIns.pending("sid", "user-1")).toEqual({ deviceCode: "device", intervalSec: 5 });
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
    jest.advanceTimersByTime(901_000);
    expect(githubSignIns.pending("sid", "user-1")).toBeUndefined();
  });

  it("holds a token with the pending device code, out of reach until the sign-in is complete", () => {
    githubSignIns.setPending("sid", "user-1", "device", 900, 5);
    githubSignIns.holdToken("sid", "user-1", { accessToken: "tok", expiresInSec: 60 });
    expect(githubSignIns.pending("sid", "user-1")?.heldToken).toEqual({ accessToken: "tok", expiresInSec: 60 });
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
    // it lives as long as the device code it came from
    jest.advanceTimersByTime(901_000);
    expect(githubSignIns.pending("sid", "user-1")).toBeUndefined();
  });

  it("replaces the pending device code when the token arrives", () => {
    githubSignIns.setPending("sid", "user-1", "device", 900, 5);
    githubSignIns.setToken("sid", "user-1", "tok", 60, "octo");
    expect(githubSignIns.pending("sid", "user-1")).toBeUndefined();
    expect(githubSignIns.token("sid", "user-1")).toEqual({ accessToken: "tok", login: "octo" });
  });

  it("sweeps expired sign-ins of other sessions when one is added", () => {
    githubSignIns.setToken("old", "user-1", "tok", 60, "octo");
    jest.advanceTimersByTime(61_000);
    githubSignIns.setPending("new", "user-2", "device", 900, 5);
    expect(githubSignIns.size()).toBe(1);
  });

  it("drops a sign-in", () => {
    githubSignIns.setToken("sid", "user-1", "tok", 60, "octo");
    githubSignIns.drop("sid");
    expect(githubSignIns.token("sid", "user-1")).toBeUndefined();
  });
});
