import Audit from "@models/audit/audit";
import Document from "@models/document/document";
import User from "@models/user/user";
import { UserEnums } from "@inkvisitor/shared/enums";
import {
  GithubDevicePollStatus,
  IDocumentGithubSync,
  IGithubTarget,
  IRequestGithubCommit,
  IResponseDocumentGithub,
  IResponseGeneric,
  IResponseGithubDevice,
} from "@inkvisitor/shared/types";
import {
  BadParams,
  DocumentDoesNotExist,
  GithubConflictError,
  GithubRequestError,
  GithubSignInRequiredError,
  InternalServerError,
  PermissionDeniedError,
} from "@inkvisitor/shared/types/errors";
import { Router } from "express";
import { Conn, storage } from "@service/storage";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "../index";
import {
  GithubUnauthorized,
  getFile,
  getGithubLogin,
  getLastCommit,
  gitBlobSha,
  githubClientId,
  parseRepositoryUrl,
  pollDeviceToken,
  putFile,
  repositoryReachable,
  requestDeviceCode,
  resolveSyncState,
} from "./github";
import { githubSignIns } from "./githubSignIns";
import { userCanManageDocument } from "./permissions";

const MAX_COMMIT_MESSAGE_LENGTH = 2000;
const BLOB_SHA = /^[0-9a-f]{40}$/;

const sessionIdOf = (request: IRequest): string => {
  if (!request.sessionID) {
    throw new InternalServerError("the request has no session");
  }
  return request.sessionID;
};

const iso = (value: Date | string | undefined): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

/** A viewer can never commit, so a viewer (or a guest login) cannot make the server call GitHub. */
const signInUser = (request: IRequest): User => {
  const user = request.getUserOrFail();
  if (user.role === UserEnums.Role.Viewer) {
    throw new PermissionDeniedError("viewers cannot sign in to GitHub");
  }
  return user;
};

/** The document of the request, for a user who may manage it (the export rule). */
const manageableDocument = async (request: IRequest<{ documentId: string }>): Promise<Document> => {
  const documentId = request.params.documentId;
  if (!documentId) {
    throw new BadParams("document id has to be set");
  }
  const document = await Document.getDocumentById(request.db.connection, documentId);
  if (!document) {
    throw DocumentDoesNotExist.forId(documentId);
  }
  if (!(await userCanManageDocument(request.db.connection, documentId, request.getUserOrFail()))) {
    throw new PermissionDeniedError("document cannot be committed");
  }
  return document;
};

/**
 * When, by whom and how the document was last saved. Who and how come from
 * the latest audit entry, and only when that entry belongs to the last save:
 * removing an anchor saves the document without an audit, and a document
 * created and never saved again has none.
 */
const lastSave = async (conn: Conn, document: Document): Promise<IResponseDocumentGithub["inkvisitor"]> => {
  const savedAt = document.updatedAt ?? document.createdAt;
  const [latest] = await Audit.getLastNForDocument(conn, document.id, 1);
  // the audit of a save is written right after the document itself
  const audit =
    latest && savedAt && new Date(latest.date).getTime() >= new Date(savedAt).getTime() ? latest : undefined;
  const author = audit ? await User.findUserById(conn, audit.user) : null;
  return {
    updatedAt: iso(savedAt),
    userName: author?.name || undefined,
    auditType: audit?.type,
  };
};

const targetOf = (document: Document): IGithubTarget | undefined => {
  if (!document.repositoryUrl) {
    return undefined;
  }
  try {
    return parseRepositoryUrl(document.repositoryUrl);
  } catch {
    return undefined;
  }
};

// The static /github paths are registered before any /:documentId route of the
// documents router, which mounts this router first.
export default Router()
  /**
   * @openapi
   * /documents/github/device:
   *   post:
   *     description: Starts a GitHub sign-in and returns the code the user confirms on github.com
   *     tags:
   *       - documents
   *     responses:
   *       200:
   *         description: Returns the user code and where to enter it
   */
  .post(
    "/github/device",
    asyncRouteHandler<IResponseGithubDevice>(async (request: IRequest) => {
      const user = signInUser(request);
      if (!githubClientId()) {
        throw new BadParams("GitHub commits are not configured on this deployment");
      }

      const device = await requestDeviceCode();
      githubSignIns.setPending(sessionIdOf(request), user.id, device.deviceCode, device.expiresIn, device.interval);

      return {
        userCode: device.userCode,
        verificationUri: device.verificationUri,
        expiresIn: device.expiresIn,
        interval: device.interval,
      };
    })
  )
  /**
   * @openapi
   * /documents/github/device/poll:
   *   post:
   *     description: Asks GitHub once whether the user confirmed the code
   *     tags:
   *       - documents
   *     responses:
   *       200:
   *         description: Returns the state of the sign-in
   */
  .post(
    "/github/device/poll",
    asyncRouteHandler<{ status: GithubDevicePollStatus }>(async (request: IRequest) => {
      const user = signInUser(request);
      const sessionId = sessionIdOf(request);

      const pending = githubSignIns.pending(sessionId, user.id);
      if (!pending) {
        return { status: "expired" };
      }

      // GitHub hands a token over once per device code, so a token is held
      // with the pending sign-in until its login is read: a poll that got the
      // token and not the login is followed by one that asks for the login alone
      let held = pending.heldToken;
      if (!held) {
        const result = await pollDeviceToken(pending.deviceCode);
        if (result.status !== "authorized") {
          if (result.status === "expired" || result.status === "denied") {
            githubSignIns.drop(sessionId);
          }
          return { status: result.status };
        }
        held = { accessToken: result.accessToken, expiresInSec: result.expiresIn };
        githubSignIns.holdToken(sessionId, user.id, held);
      }

      try {
        const login = await getGithubLogin(held.accessToken);
        githubSignIns.setToken(sessionId, user.id, held.accessToken, held.expiresInSec, login);
        return { status: "authorized" };
      } catch (err) {
        if (err instanceof GithubUnauthorized) {
          githubSignIns.drop(sessionId);
          return { status: "denied" };
        }
        if (err instanceof GithubRequestError) {
          // ponytail: no retry limit. While GitHub keeps failing the read, the
          // dialog waits until the device code expires and then reports the
          // code as expired; a status of its own for the browser is the upgrade path.
          console.warn(`[github] sign-in of user ${user.id} waits for its GitHub login: ${err.message}`);
          return { status: "pending" };
        }
        throw err;
      }
    })
  )
  /**
   * @openapi
   * /documents/{documentId}/repository:
   *   put:
   *     description: Sets the GitHub URL of the file the document is committed to; an empty string clears it
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Returns generic response
   */
  .put(
    "/:documentId/repository",
    asyncRouteHandler<IResponseGeneric>(
      async (request: IRequest<{ documentId: string }, { repositoryUrl?: unknown }>) => {
        const document = await manageableDocument(request);

        if (typeof request.body?.repositoryUrl !== "string") {
          throw new BadParams("repository URL has to be set");
        }
        const repositoryUrl = request.body.repositoryUrl.trim();
        if (repositoryUrl) {
          parseRepositoryUrl(repositoryUrl);
        }

        // written past Document.update: the document was not saved, so its
        // updatedAt stays. The last commit describes the previous file.
        if (repositoryUrl !== (document.repositoryUrl || "")) {
          await storage.documents.update(request.db.connection, document.id, { repositoryUrl, githubSync: null });
        }

        return { result: true };
      }
    )
  )
  /**
   * @openapi
   * /documents/{documentId}/github:
   *   get:
   *     description: Compares the document with its file on GitHub
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Returns both sides and how they relate
   */
  .get(
    "/:documentId/github",
    asyncRouteHandler<IResponseDocumentGithub>(async (request: IRequest<{ documentId: string }>) => {
      const document = await manageableDocument(request);
      const sessionId = sessionIdOf(request);
      const configured = !!githubClientId();
      const signIn = configured ? githubSignIns.token(sessionId, request.getUserOrFail().id) : undefined;
      const target = targetOf(document);

      const response: IResponseDocumentGithub = {
        state: "not-configured",
        configured,
        authorized: !!signIn,
        githubLogin: signIn?.login,
        repositoryUrl: document.repositoryUrl || undefined,
        target,
        inkvisitor: await lastSave(request.db.connection, document),
        lastSync: document.githubSync ?? null,
      };

      if (!configured) {
        return response;
      }
      if (!target) {
        return { ...response, state: "not-linked" };
      }
      if (!signIn) {
        return { ...response, state: "not-authorized" };
      }

      try {
        const file = await getFile(signIn.accessToken, target);
        if (file.kind === "folder") {
          return { ...response, state: "is-folder" };
        }
        if (file.kind === "missing") {
          // GitHub answers 404 both for a missing file and for a repository
          // the user or the app cannot see
          return (await repositoryReachable(signIn.accessToken, target))
            ? { ...response, state: "not-found", github: { exists: false } }
            : { ...response, state: "no-access" };
        }

        return {
          ...response,
          state: resolveSyncState(gitBlobSha(document.content), file.sha, document.githubSync?.blobSha),
          github: {
            exists: true,
            blobSha: file.sha,
            lastCommit: await getLastCommit(signIn.accessToken, target),
          },
        };
      } catch (err) {
        if (err instanceof GithubUnauthorized) {
          githubSignIns.drop(sessionId);
          return { ...response, state: "not-authorized", authorized: false, githubLogin: undefined };
        }
        throw err;
      }
    })
  )
  /**
   * @openapi
   * /documents/{documentId}/github/commit:
   *   post:
   *     description: Commits the saved document to its file on GitHub as the signed-in GitHub user
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Returns the record of the commit
   */
  .post(
    "/:documentId/github/commit",
    asyncRouteHandler<IDocumentGithubSync>(
      async (request: IRequest<{ documentId: string }, Partial<IRequestGithubCommit>>) => {
        const document = await manageableDocument(request);
        const user = request.getUserOrFail();
        const sessionId = sessionIdOf(request);

        const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
        if (!message || message.length > MAX_COMMIT_MESSAGE_LENGTH) {
          throw new BadParams(`a commit message of at most ${MAX_COMMIT_MESSAGE_LENGTH} characters is required`);
        }
        // the blob the user was shown, or null for "no file there"
        const expectedRemoteSha = request.body?.expectedRemoteSha;
        if (
          expectedRemoteSha !== null &&
          !(typeof expectedRemoteSha === "string" && BLOB_SHA.test(expectedRemoteSha))
        ) {
          throw new BadParams("the expected GitHub file version has to be set");
        }
        if (typeof request.body?.repositoryUrl !== "string") {
          throw new BadParams("the repository URL the commit was confirmed for has to be set");
        }
        const target = targetOf(document);
        if (!target) {
          throw new BadParams("the document has no repository URL");
        }
        // the user confirmed a commit to the file they were shown, not to
        // wherever the document points by now
        if (request.body.repositoryUrl !== document.repositoryUrl) {
          throw new GithubConflictError("The repository URL of this document changed since it was shown");
        }
        const signIn = githubSignIns.token(sessionId, user.id);
        if (!signIn) {
          throw new GithubSignInRequiredError();
        }

        let written: Awaited<ReturnType<typeof putFile>>;
        try {
          written = await putFile(signIn.accessToken, target, message, document.content, expectedRemoteSha);
        } catch (err) {
          if (err instanceof GithubUnauthorized) {
            githubSignIns.drop(sessionId);
            throw new GithubSignInRequiredError();
          }
          throw err;
        }

        if (written.blobSha !== gitBlobSha(document.content)) {
          // the comparison of the two copies rests on these being equal
          console.warn(
            `[github] document ${document.id}: GitHub stored blob ${written.blobSha}, which is not the fingerprint of the committed content`
          );
        }

        // every key is set on each commit: the storage update merges nested
        // objects, so a key left out would keep its previous value
        const githubSync: IDocumentGithubSync = {
          ...written,
          userId: user.id,
          userName: user.name,
          githubLogin: signIn.login,
          documentUpdatedAt: iso(document.updatedAt ?? document.createdAt) ?? "",
        };
        // the record describes the file at the document's repository URL, so it
        // is kept only while the document still points at the file just written
        const current = await storage.documents.get(request.db.connection, document.id);
        if (current?.repositoryUrl === document.repositoryUrl) {
          await storage.documents.update(request.db.connection, document.id, { githubSync });
        }

        return githubSync;
      }
    )
  );
