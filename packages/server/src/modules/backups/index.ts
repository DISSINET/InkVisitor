import { asyncRouteHandler } from "../index";
import { NextFunction, Response, Router } from "express";
import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseBackup } from "@inkvisitor/shared/types";
import { IRequest } from "src/custom_typings/request";
import { Backup } from "@models/backup/backup";
import { BadParams, NotFound, PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { generateShortLivedToken } from "@common/auth";
import { apiPathOld } from "@common/constants";
import * as fs from "fs";
import * as path from "path";

// Window during which a freshly issued download URL stays valid. Short enough
// that a leaked URL is mostly harmless, long enough for the browser to fetch.
const DOWNLOAD_URL_TTL_SECONDS = 60;

const getBackupDir = (): string => process.env.BACKUP_DIR || "";

/**
 * Backups contain full database dumps - access is restricted to the owner only.
 * Note: the generic acl admin/owner bypass is not enough here (it would also let
 * admins through), so the owner role is enforced explicitly in each handler.
 */
const assertOwner = (request: IRequest): void => {
  if (!request.getUserOrFail().hasRole([UserEnums.Role.Owner])) {
    throw new PermissionDeniedError("only the owner can access backups");
  }
};

/**
 * Validates the `?file=` param and resolves it to an existing backup archive
 * on disk. Throws on missing param, path traversal, or non-existent file.
 */
const requireBackup = (request: IRequest): { file: string; resolved: string } => {
  const file = (request.query.file as string) || "";
  if (!file) {
    throw new BadParams("file query param has to be set");
  }
  const resolved = Backup.resolvePath(getBackupDir(), file);
  if (
    !resolved ||
    !fs.existsSync(resolved) ||
    !fs.statSync(resolved).isFile()
  ) {
    throw new NotFound(`backup '${file}' does not exist`);
  }
  return { file, resolved };
};

export default Router()
  /**
   * Lists all available backup archives. Owner only.
   */
  .get(
    "/",
    asyncRouteHandler<IResponseBackup[]>(async (request: IRequest) => {
      assertOwner(request);
      return Backup.list(getBackupDir());
    })
  )
  /**
   * Issues a short-lived signed URL the browser can use to navigate directly
   * to the binary download endpoint. The URL embeds a JWT in its query string
   * because <a download> navigations cannot carry Authorization headers, and
   * sticking the long-lived session token in a URL would be a far worse leak.
   */
  .get(
    "/download-url",
    asyncRouteHandler<{ url: string }>(async (request: IRequest) => {
      assertOwner(request);
      const { file } = requireBackup(request);

      const token = generateShortLivedToken(
        request.getUserOrFail(),
        DOWNLOAD_URL_TTL_SECONDS
      );
      const url =
        `${apiPathOld}/backups/download` +
        `?file=${encodeURIComponent(file)}` +
        `&token=${encodeURIComponent(token)}`;
      return { url };
    })
  )
  /**
   * Streams a single backup archive as an attachment. Owner only.
   * The file is piped through the api (behind jwt) - it is never exposed as a
   * public/static link.
   *
   * This is a raw handler (binary stream) so it does not go through
   * asyncRouteHandler - the owner check is therefore enforced explicitly below.
   */
  .get(
    "/download",
    async (request: IRequest, res: Response, next: NextFunction) => {
      try {
        assertOwner(request);
        const { resolved } = requireBackup(request);

        const stat = fs.statSync(resolved);
        res.setHeader("Content-Type", "application/gzip");
        res.setHeader("Content-Length", stat.size);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${path.basename(resolved)}"`
        );

        const stream = fs.createReadStream(resolved);
        stream.on("error", next);
        stream.pipe(res);
      } catch (err) {
        next(err);
      }
    }
  );
