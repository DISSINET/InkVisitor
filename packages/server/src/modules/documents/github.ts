import { createHash } from "crypto";
import { IGithubLastCommit, IGithubTarget } from "@inkvisitor/shared/types";
import { BadParams, GithubConflictError, GithubRequestError } from "@inkvisitor/shared/types/errors";

const REPOSITORY_URL = /^https:\/\/github\.com\/([^?#]*)/i;

/**
 * Splits the address a browser shows for a repository file,
 * https://github.com/<owner>/<repo>/blob/<branch>/<path> (or /tree/), into its
 * parts. The path comes back decoded; requests encode it again per segment.
 *
 * The address is read as written, without a URL parser: a parser resolves
 * `..` before anyone can refuse it, and the parts end up in a request path
 * where `fetch` resolves dot segments too. So a segment that is empty, `.`,
 * `..` or hides a slash is refused here.
 */
export function parseRepositoryUrl(url: string): IGithubTarget {
  const match = REPOSITORY_URL.exec((url || "").trim());
  if (!match) {
    throw new BadParams("the repository URL has to start with https://github.com/");
  }

  const segments = match[1].split("/").map((raw) => {
    let segment: string;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      throw new BadParams("the repository URL is not correctly encoded");
    }
    if (segment === "" || segment === "." || segment === ".." || /[/\\]/.test(segment)) {
      throw new BadParams("the repository URL contains an empty or relative path segment");
    }
    return segment;
  });

  // ponytail: the branch is the single segment after blob/ or tree/, so a
  // branch named with a slash is read wrong; resolving it needs the branch
  // list from GitHub
  const [owner, repo, kind, branch, ...path] = segments;
  if (!owner || !repo || (kind !== "blob" && kind !== "tree") || !branch || !path.length) {
    throw new BadParams(
      "the repository URL has to be the address of a file: https://github.com/<owner>/<repository>/blob/<branch>/<path>"
    );
  }

  return { owner, repo, branch, path: path.join("/") };
}

/** The sha git gives a file with this content, over its UTF-8 bytes. */
export function gitBlobSha(content: string): string {
  const bytes = Buffer.from(content, "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

/**
 * How the document and its GitHub file relate, from three fingerprints: the
 * document's, the file's (null when there is no file) and the one InkVisitor
 * last committed (undefined when it never did).
 */
export function resolveSyncState(
  localSha: string,
  remoteSha: string | null,
  lastSyncedSha: string | undefined
): "not-found" | "identical" | "never-synced" | "inkvisitor-changed" | "github-changed" | "both-changed" {
  if (remoteSha === null) {
    return "not-found";
  }
  if (remoteSha === localSha) {
    return "identical";
  }
  if (lastSyncedSha === undefined) {
    return "never-synced";
  }
  if (remoteSha === lastSyncedSha) {
    return "inkvisitor-changed";
  }
  if (localSha === lastSyncedSha) {
    return "github-changed";
  }
  return "both-changed";
}

// The only two hosts the server ever calls for this feature. A repository URL
// is user input and contributes path segments, never a host.
const GITHUB_WEB = "https://github.com";
const GITHUB_API = "https://api.github.com";

// a status request makes two reads in a row and the client waits 15 s for it
const READ_TIMEOUT_MS = 6_000;
// with the read before the write and the read after a refusal it stays below
// the route's own limit in server.ts, so the caller gets GitHub's failure and
// not a bare timeout
const WRITE_TIMEOUT_MS = 100_000;

/** Client id of the deployment's GitHub App; empty when commits are not set up. */
export const githubClientId = (): string => (process.env.GITHUB_APP_CLIENT_ID || "").trim();

/**
 * GitHub answered 401: the token is expired or revoked. Callers drop the
 * sign-in. It is never sent to the browser as a 401, which the client reads
 * as "logged out of InkVisitor".
 */
export class GithubUnauthorized extends Error {}

interface IGithubRequest {
  method?: "GET" | "POST" | "PUT";
  token?: string;
  accept?: string;
  body?: Record<string, unknown>;
  timeoutMs?: number;
}

async function githubFetch(url: string, request: IGithubRequest = {}): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {
    Accept: request.accept || "application/vnd.github+json",
    "User-Agent": "InkVisitor",
  };
  if (request.token) {
    headers.Authorization = `Bearer ${request.token}`;
    headers["X-GitHub-Api-Version"] = "2022-11-28";
  }
  if (request.body) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method || "GET",
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal: AbortSignal.timeout(request.timeoutMs ?? READ_TIMEOUT_MS),
    });
  } catch {
    throw new GithubRequestError("GitHub cannot be reached");
  }

  // only a request that carried a token can have had it refused; the sign-in
  // calls carry none, and their 401 is a refusal like any other
  if (response.status === 401 && request.token) {
    throw new GithubUnauthorized();
  }

  // an error page or an empty body is not JSON
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

const githubMessage = (body: any, fallback: string): string => {
  const text = body?.error_description || body?.message;
  return typeof text === "string" && text ? `${fallback}: ${text}` : fallback;
};

const encodePath = (path: string): string => path.split("/").map(encodeURIComponent).join("/");

const repositoryUrl = (target: IGithubTarget): string =>
  `${GITHUB_API}/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`;

const contentsUrl = (target: IGithubTarget): string => `${repositoryUrl(target)}/contents/${encodePath(target.path)}`;

/** First step of the device flow: a code for the user to confirm on github.com. */
export async function requestDeviceCode(): Promise<{
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}> {
  const { status, body } = await githubFetch(`${GITHUB_WEB}/login/device/code`, {
    method: "POST",
    accept: "application/json",
    body: { client_id: githubClientId() },
  });
  if (status !== 200 || typeof body?.device_code !== "string" || typeof body?.user_code !== "string") {
    throw new GithubRequestError(githubMessage(body, `GitHub did not start the sign-in (${status})`));
  }

  const verificationUri =
    typeof body.verification_uri === "string" && body.verification_uri.startsWith(`${GITHUB_WEB}/`)
      ? body.verification_uri
      : `${GITHUB_WEB}/login/device`;

  return {
    deviceCode: body.device_code,
    userCode: body.user_code,
    verificationUri,
    expiresIn: Number(body.expires_in) || 900,
    interval: Number(body.interval) || 5,
  };
}

/**
 * One poll of the device flow. GitHub answers 200 either way; a token that is
 * not there yet comes back as an `error` field.
 */
export async function pollDeviceToken(
  deviceCode: string
): Promise<
  | { status: "pending" | "slow-down" | "expired" | "denied" }
  | { status: "authorized"; accessToken: string; expiresIn?: number }
> {
  const { body } = await githubFetch(`${GITHUB_WEB}/login/oauth/access_token`, {
    method: "POST",
    accept: "application/json",
    body: {
      client_id: githubClientId(),
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    },
  });

  if (typeof body?.access_token === "string" && body.access_token) {
    return { status: "authorized", accessToken: body.access_token, expiresIn: Number(body.expires_in) || undefined };
  }

  switch (body?.error) {
    case "authorization_pending":
      return { status: "pending" };
    case "slow_down":
      return { status: "slow-down" };
    // GitHub's documentation uses both names
    case "expired_token":
    case "token_expired":
      return { status: "expired" };
    case "access_denied":
      return { status: "denied" };
    default:
      throw new GithubRequestError(githubMessage(body, "GitHub refused the sign-in"));
  }
}

export async function getGithubLogin(token: string): Promise<string> {
  const { status, body } = await githubFetch(`${GITHUB_API}/user`, { token });
  if (status !== 200 || typeof body?.login !== "string") {
    throw new GithubRequestError(githubMessage(body, "GitHub did not name the signed-in user"));
  }
  return body.login;
}

/**
 * What sits at the target path on the branch. The object media type answers
 * with the sha for files up to 100 MB; the default one stops at 1 MB.
 */
export async function getFile(
  token: string,
  target: IGithubTarget
): Promise<{ kind: "file"; sha: string } | { kind: "folder" } | { kind: "missing" }> {
  const { status, body } = await githubFetch(`${contentsUrl(target)}?ref=${encodeURIComponent(target.branch)}`, {
    token,
    accept: "application/vnd.github.object+json",
  });

  if (status === 404) {
    return { kind: "missing" };
  }
  if (status !== 200) {
    throw new GithubRequestError(githubMessage(body, `GitHub did not return the file (${status})`));
  }
  if (Array.isArray(body) || body?.type === "dir") {
    return { kind: "folder" };
  }
  if (body?.type !== "file" || typeof body.sha !== "string") {
    throw new GithubRequestError("The repository URL does not name a regular file");
  }
  return { kind: "file", sha: body.sha };
}

/** Whether the signed-in user and the app can see the repository at all. */
export async function repositoryReachable(token: string, target: IGithubTarget): Promise<boolean> {
  const { status } = await githubFetch(repositoryUrl(target), { token });
  return status === 200;
}

/** The newest commit on the branch that touched the file. */
export async function getLastCommit(token: string, target: IGithubTarget): Promise<IGithubLastCommit | undefined> {
  const query = `path=${encodeURIComponent(target.path)}&sha=${encodeURIComponent(target.branch)}&per_page=1`;
  const { status, body } = await githubFetch(`${repositoryUrl(target)}/commits?${query}`, { token });
  const commit = status === 200 && Array.isArray(body) ? body[0] : undefined;
  if (!commit) {
    return undefined;
  }
  return {
    date: commit.commit?.author?.date ?? "",
    authorName: commit.commit?.author?.name ?? "",
    authorLogin: commit.author?.login ?? undefined,
    message: String(commit.commit?.message ?? "").split("\n")[0],
    url: commit.html_url ?? "",
  };
}

/**
 * Writes the content to the target path as one commit by the signed-in user.
 * `sha` is the blob the caller expects to replace, null to create the file;
 * the write is refused when the file is not that blob.
 */
export async function putFile(
  token: string,
  target: IGithubTarget,
  message: string,
  content: string,
  sha: string | null
): Promise<{ blobSha: string; commitSha: string; commitUrl: string; committedAt: string }> {
  const body: Record<string, unknown> = {
    message,
    branch: target.branch,
    content: Buffer.from(content, "utf8").toString("base64"),
  };
  if (sha) {
    body.sha = sha;
    // GitHub compares the expected blob only with a file that exists: with
    // none at the path it creates one. A file removed or moved since it was
    // shown is therefore looked for before the write.
    // ponytail: check, then write. A file removed between the two requests is
    // still created again; closing that takes the git data endpoints, which
    // commit on top of a known tree.
    if ((await getFile(token, target)).kind === "missing") {
      throw new GithubConflictError();
    }
  }

  const { status, body: reply } = await githubFetch(contentsUrl(target), {
    method: "PUT",
    token,
    body,
    timeoutMs: WRITE_TIMEOUT_MS,
  });

  if (status === 200 || status === 201) {
    if (typeof reply?.content?.sha !== "string" || typeof reply?.commit?.sha !== "string") {
      throw new GithubRequestError("GitHub accepted the commit but did not describe it");
    }
    return {
      blobSha: reply.content.sha,
      commitSha: reply.commit.sha,
      commitUrl: reply.commit.html_url ?? "",
      committedAt: reply.commit.committer?.date ?? reply.commit.author?.date ?? new Date().toISOString(),
    };
  }

  // GitHub answers 409 and 422 for a file that is not the expected blob, and
  // also for refusals that have nothing to do with it, such as a protected
  // branch. Reading the file again tells the two apart.
  if (status === 409 || status === 422) {
    const current = await getFile(token, target).catch(() => undefined);
    const moved =
      (current?.kind === "file" && current.sha !== sha) || (current?.kind === "missing" && sha !== null);
    if (moved) {
      throw new GithubConflictError();
    }
  }
  throw new GithubRequestError(githubMessage(reply, `GitHub refused the commit (${status})`));
}
