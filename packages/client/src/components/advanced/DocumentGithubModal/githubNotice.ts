import { GithubSyncState, IDocumentGithubSync } from "@inkvisitor/shared/types";

export interface IGithubNotice {
  text: string;
  // shown as a warning: committing replaces or reverts something on GitHub, or cannot happen
  warning: boolean;
  canCommit: boolean;
}

/**
 * What the commit dialog says about how the document and its GitHub file
 * relate. States with a view of their own (no client id, no URL, no GitHub
 * sign-in) have no notice.
 */
export function githubNotice(state: GithubSyncState): IGithubNotice | undefined {
  switch (state) {
    case "not-found":
      return {
        text: "No file found at this repository URL, perhaps it was moved or renamed. Commit nonetheless?",
        warning: true,
        canCommit: true,
      };
    case "identical":
      return {
        text: "Up to date. GitHub holds this document as it is saved in InkVisitor.",
        warning: false,
        canCommit: false,
      };
    case "inkvisitor-changed":
      return {
        text: "The document changed in InkVisitor since its last commit. The file on GitHub is still that commit.",
        warning: false,
        canCommit: true,
      };
    case "never-synced":
      return {
        text: "This document was not committed from InkVisitor yet and the file on GitHub differs from it. Committing replaces the file on GitHub.",
        warning: true,
        canCommit: true,
      };
    case "github-changed":
      return {
        text: "The file changed on GitHub after the last commit from InkVisitor, and the document did not change since. Committing reverts the change made on GitHub.",
        warning: true,
        canCommit: true,
      };
    case "both-changed":
      return {
        text: "The file changed on GitHub after the last commit from InkVisitor. Committing overwrites that change.",
        warning: true,
        canCommit: true,
      };
    case "no-access":
      return {
        text: "GitHub does not show this repository to your account. Check the URL, your access to the repository, and that the InkVisitor GitHub App is installed on it.",
        warning: true,
        canCommit: false,
      };
    case "is-folder":
      return {
        text: "The repository URL points to a folder. Add the file name to it.",
        warning: true,
        canCommit: false,
      };
    default:
      return undefined;
  }
}

/** The file name comes from the repository path, never from the document title, which can be renamed. */
export const defaultCommitMessage = (path: string, env: string): string =>
  `Update ${path.split("/").pop()} from InkVisitor (${env})`;

/**
 * Whether the document was saved after its last commit from InkVisitor.
 *
 * ponytail: a hint, not a comparison of content. Renaming the document also
 * moves updatedAt, so this can be true for an unchanged text; the commit
 * dialog compares the content itself.
 */
export const isSavedSinceCommit = (document: {
  updatedAt?: Date | string;
  createdAt?: Date | string;
  githubSync?: Pick<IDocumentGithubSync, "documentUpdatedAt"> | null;
}): boolean => {
  const committedAt = document.githubSync?.documentUpdatedAt;
  const savedAt = document.updatedAt ?? document.createdAt;
  if (!committedAt || !savedAt) {
    return false;
  }
  return new Date(savedAt).getTime() !== new Date(committedAt).getTime();
};
