// the file a document is committed to, parsed from its repository URL
export interface IGithubTarget {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

// the last commit InkVisitor made for a document
export interface IDocumentGithubSync {
  // git blob sha of the content that was written
  blobSha: string;
  commitSha: string;
  commitUrl: string;
  // commit date as GitHub returned it
  committedAt: string;
  // InkVisitor user who committed
  userId: string;
  userName: string;
  githubLogin: string;
  // the document's updatedAt at the moment of the commit
  documentUpdatedAt?: string;
}

export type GithubSyncState =
  | "not-configured"
  | "not-linked"
  | "not-authorized"
  | "no-access"
  | "is-folder"
  | "not-found"
  | "identical"
  | "never-synced"
  | "inkvisitor-changed"
  | "github-changed"
  | "both-changed";

export interface IGithubLastCommit {
  date: string;
  authorName: string;
  authorLogin?: string;
  message: string;
  url: string;
}

export interface IResponseDocumentGithub {
  state: GithubSyncState;
  configured: boolean;
  authorized: boolean;
  githubLogin?: string;
  repositoryUrl?: string;
  target?: IGithubTarget;
  // last save of the document: when, by whom and the audit type of that save
  inkvisitor: { updatedAt?: string; userName?: string; auditType?: string };
  lastSync?: IDocumentGithubSync | null;
  github?: { exists: boolean; blobSha?: string; lastCommit?: IGithubLastCommit };
}

export interface IResponseGithubDevice {
  userCode: string;
  verificationUri: string;
  // seconds
  expiresIn: number;
  interval: number;
}

export type GithubDevicePollStatus = "pending" | "slow-down" | "expired" | "denied" | "authorized";

export interface IRequestGithubCommit {
  // the repository URL the user was shown; the commit is refused when the document points elsewhere by now
  repositoryUrl: string;
  message: string;
  // blob sha of the GitHub file the user was shown, null when no file was there
  expectedRemoteSha: string | null;
}
