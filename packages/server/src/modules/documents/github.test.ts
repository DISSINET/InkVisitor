import "ts-jest";
import { BadParams } from "@inkvisitor/shared/types/errors";
import { gitBlobSha, parseRepositoryUrl, resolveSyncState } from "./github";

describe("modules/documents github - parseRepositoryUrl", () => {
  const target = {
    owner: "acme",
    repo: "texts",
    branch: "main",
    path: "Some_text__[abc]/Some text.txt",
  };

  it("parses the blob address of a file, decoding its path", () => {
    expect(
      parseRepositoryUrl("https://github.com/acme/texts/blob/main/Some_text__[abc]/Some%20text.txt")
    ).toEqual(target);
  });

  it("parses the tree address the same way", () => {
    expect(
      parseRepositoryUrl("https://github.com/acme/texts/tree/main/Some_text__%5Babc%5D/Some%20text.txt")
    ).toEqual(target);
  });

  it("ignores a query string and a fragment", () => {
    expect(parseRepositoryUrl("https://github.com/acme/texts/blob/main/a/b.txt?plain=1#L3")).toEqual({
      owner: "acme",
      repo: "texts",
      branch: "main",
      path: "a/b.txt",
    });
  });

  it.each([
    ["another host", "https://gitlab.com/a/b/blob/main/f.txt"],
    ["a host that only starts with github.com", "https://github.com.evil.io/a/b/blob/main/f.txt"],
    ["plain http", "http://github.com/a/b/blob/main/f.txt"],
    ["a repository address with no file", "https://github.com/a/b"],
    ["a branch with no path", "https://github.com/a/b/blob/main"],
    ["a folder address ending in a slash", "https://github.com/a/b/blob/main/dir/"],
    ["a parent segment", "https://github.com/a/b/blob/main/x/../y.txt"],
    ["an encoded parent segment", "https://github.com/a/b/blob/main/x/%2e%2e/y.txt"],
    ["a current-folder segment", "https://github.com/a/b/blob/main/./y.txt"],
    ["an empty segment", "https://github.com/a/b/blob/main/x//y.txt"],
    ["an encoded slash inside a segment", "https://github.com/a/b/blob/main/x%2F..%2Fy.txt"],
    ["a parent segment as the repository", "https://github.com/a/../blob/main/y.txt"],
    ["another kind of address", "https://github.com/a/b/commits/main/y.txt"],
    ["text that is no address", "not a url"],
    ["an empty string", ""],
  ])("rejects %s", (_name, url) => {
    expect(() => parseRepositoryUrl(url)).toThrow(BadParams);
  });
});

describe("modules/documents github - gitBlobSha", () => {
  it("matches git for an empty file", () => {
    expect(gitBlobSha("")).toBe("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  });

  it("matches git for ASCII text", () => {
    expect(gitBlobSha("hello\n")).toBe("ce013625030ba8dba906f756967f9e9ca394464a");
  });

  it("counts bytes, not characters", () => {
    expect(gitBlobSha("příliš žluťoučký\n")).toBe("101dbd07e63a670efa36ab57b049e51c6814425d");
  });
});

describe("modules/documents github - resolveSyncState", () => {
  it.each([
    ["not-found", "a", null, "a"],
    ["identical", "a", "a", undefined],
    ["identical", "a", "a", "c"],
    ["never-synced", "a", "b", undefined],
    ["inkvisitor-changed", "a", "b", "b"],
    ["github-changed", "a", "b", "a"],
    ["both-changed", "a", "b", "c"],
  ] as const)("is %s for local %s, remote %s, last committed %s", (state, local, remote, last) => {
    expect(resolveSyncState(local, remote, last)).toBe(state);
  });
});
