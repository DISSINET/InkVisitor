import { asyncRouteHandler } from "../index";
import { NextFunction, Response, Router } from "express";
import { UserEnums } from "@shared/enums";
import { IResponseBackup } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { Backup } from "@models/backup/backup";
import { BadParams, NotFound, PermissionDeniedError } from "@shared/types/errors";
import * as fs from "fs";
import * as path from "path";

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
