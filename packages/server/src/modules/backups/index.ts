import { asyncRouteHandler } from "../index";
import { NextFunction, Response, Router } from "express";
import { IResponseBackup } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { Backup } from "@models/backup/backup";
import { BadParams, NotFound } from "@shared/types/errors";
import * as fs from "fs";
import * as path from "path";

const getBackupDir = (): string => process.env.BACKUP_DIR || "";

export default Router()
  /**
   * Lists all available backup archives. Restricted to admin/owner by default
   * (no public ACL permission is registered for this controller).
   */
  .get(
    "/",
    asyncRouteHandler<IResponseBackup[]>(async () => {
      return Backup.list(getBackupDir());
    })
  )
  /**
   * Streams a single backup archive as an attachment. The file is piped through
   * the api (behind jwt + acl) - it is never exposed as a public/static link.
   *
   * This is a raw handler (binary stream) so it does not go through
   * asyncRouteHandler - the acl check is therefore enforced explicitly below.
   */
  .get(
    "/download",
    async (request: IRequest, res: Response, next: NextFunction) => {
      try {
        if (request.acl) {
          const err = await request.acl.validate(request);
          if (err) {
            next(err);
            return;
          }
        }

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
