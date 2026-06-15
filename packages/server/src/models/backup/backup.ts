import { IResponseBackup } from "@inkvisitor/shared/types";
import * as fs from "fs";
import * as path from "path";

/**
 * Backup encapsulates read-only access to the DB backup archives that the backup
 * CronJob writes onto the shared volume (mounted read-only into the app at BACKUP_DIR).
 * All access is filesystem based - backups are never exposed as a public/static link.
 */
export class Backup {
  static readonly archiveSuffix = ".tar.gz";

  /**
   * Lists all backup archives found (recursively) under the given backup dir.
   * Returns an empty list when the dir is not configured or does not exist.
   */
  static list(backupDir: string): IResponseBackup[] {
    if (!backupDir) {
      return [];
    }

    const root = path.resolve(backupDir);
    if (!fs.existsSync(root)) {
      return [];
    }

    const results: IResponseBackup[] = [];

    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith(Backup.archiveSuffix)) {
          const stat = fs.statSync(full);
          results.push({
            id: path.relative(root, full).split(path.sep).join("/"),
            filename: entry.name,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          });
        }
      }
    };

    walk(root);

    return results.sort((a, b) => (a.id < b.id ? 1 : -1));
  }

  /**
   * Resolves a backup id (relative path) to an absolute path inside the backup dir.
   * Returns null for empty input or any path that would escape the backup dir
   * (path traversal / absolute paths) - guarding against arbitrary file reads.
   * Does not check for existence.
   */
  static resolvePath(backupDir: string, id: string): string | null {
    if (!backupDir || !id || !id.trim()) {
      return null;
    }

    const root = path.resolve(backupDir);
    const target = path.resolve(root, id);
    const rel = path.relative(root, target);

    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
      return null;
    }

    return target;
  }
}
