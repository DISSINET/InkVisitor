import { describe, expect, it } from "vitest";
import { GithubSyncState } from "@inkvisitor/shared/types";
import { defaultCommitMessage, githubNotice, isSavedSinceCommit } from "./githubNotice";

describe("githubNotice", () => {
  it("uses the sentence of the issue for a missing file", () => {
    expect(githubNotice("not-found")).toEqual({
      text: "No file found at this repository URL, perhaps it was moved or renamed. Commit nonetheless?",
      warning: true,
      canCommit: true,
    });
  });

  it("offers no commit when both copies are the same", () => {
    expect(githubNotice("identical")).toMatchObject({ warning: false, canCommit: false });
  });

  it("commits a change made only in InkVisitor without a warning", () => {
    expect(githubNotice("inkvisitor-changed")).toMatchObject({ warning: false, canCommit: true });
  });

  it.each<GithubSyncState>(["never-synced", "github-changed", "both-changed"])(
    "warns before overwriting in state %s",
    (state) => {
      expect(githubNotice(state)).toMatchObject({ warning: true, canCommit: true });
    },
  );

  it.each<GithubSyncState>(["no-access", "is-folder"])("blocks the commit in state %s", (state) => {
    expect(githubNotice(state)).toMatchObject({ warning: true, canCommit: false });
  });

  it.each<GithubSyncState>(["not-configured", "not-linked", "not-authorized"])(
    "has nothing to say in state %s, which has its own view",
    (state) => {
      expect(githubNotice(state)).toBeUndefined();
    },
  );
});

describe("defaultCommitMessage", () => {
  it("names the repository file and the instance", () => {
    expect(defaultCommitMessage("Some_text__[abc]/Some text.txt", "sandbox")).toBe(
      "Update Some text.txt from InkVisitor (sandbox)",
    );
  });
});

describe("isSavedSinceCommit", () => {
  const sync = { documentUpdatedAt: "2026-01-02T03:04:05.000Z" };

  it("is false when the document was not saved after the commit", () => {
    expect(isSavedSinceCommit({ updatedAt: new Date("2026-01-02T03:04:05Z"), githubSync: sync })).toBe(false);
  });

  it("is true when the document was saved after the commit", () => {
    expect(isSavedSinceCommit({ updatedAt: new Date("2026-01-02T03:05:00Z"), githubSync: sync })).toBe(true);
  });

  it("falls back to the creation date of a document never saved again", () => {
    expect(isSavedSinceCommit({ createdAt: new Date("2026-01-02T03:04:05Z"), githubSync: sync })).toBe(false);
  });

  it("is false for a document that was never committed", () => {
    expect(isSavedSinceCommit({ updatedAt: new Date("2026-01-02T03:05:00Z"), githubSync: null })).toBe(false);
  });
});
