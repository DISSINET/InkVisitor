import { describe, expect, it } from "vitest";
import { contentFingerprint } from "@inkvisitor/shared/utils/content-fingerprint";

describe("contentFingerprint", () => {
  it("is stable across calls for the same content", () => {
    expect(contentFingerprint("hello world")).toBe(contentFingerprint("hello world"));
  });

  it("changes when a single character is substituted", () => {
    const before = "<T1>some anchored text</T1> and more";
    const after = "<T1>some anchored text</T1> and mare";
    expect(contentFingerprint(before)).not.toBe(contentFingerprint(after));
  });

  it("changes when an anchor tag is added", () => {
    const before = "plain text here";
    const after = "plain <T1>text</T1> here";
    expect(contentFingerprint(before)).not.toBe(contentFingerprint(after));
  });

  it("prefixes the content length, so different lengths can never collide", () => {
    expect(contentFingerprint("a").split(":")[0]).toBe("1");
    expect(contentFingerprint("ab").split(":")[0]).toBe("2");
  });

  it("handles the empty string", () => {
    expect(contentFingerprint("")).toBe("0:45h");
  });

  it("matches a pinned golden value, so an algorithm change on one side of the wire is caught here", () => {
    expect(contentFingerprint("hello world")).toBe("11:1x0xvt1");
    expect(contentFingerprint("")).toBe("0:45h");
  });

  it("handles content long enough to overflow 32 bits many times", () => {
    const long = "x".repeat(100_000);
    expect(contentFingerprint(long)).toBe(contentFingerprint(long));
    expect(contentFingerprint(long)).not.toBe(contentFingerprint(long + "y"));
  });
});
