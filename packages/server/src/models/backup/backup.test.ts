import { Backup } from "@models/backup/backup";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("models/backup", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ink-backup-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const writeBackup = (relPath: string, content = "data") => {
    const full = path.join(root, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    return full;
  };

  describe("list", () => {
    it("returns an empty array for an empty backup dir path", () => {
      expect(Backup.list("")).toEqual([]);
    });

    it("returns an empty array when the directory does not exist", () => {
      expect(Backup.list(path.join(root, "missing"))).toEqual([]);
    });

    it("returns an empty array when no archives are present", () => {
      writeBackup("20240101/readme.txt");
      expect(Backup.list(root)).toEqual([]);
    });

    it("finds .tar.gz archives in dated subdirectories", () => {
      writeBackup("20240101/inkvisitor_backup.tar.gz", "hello");
      writeBackup("20240101/notes.txt");

      const result = Backup.list(root);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "20240101/inkvisitor_backup.tar.gz",
        filename: "inkvisitor_backup.tar.gz",
        sizeBytes: 5,
      });
      expect(typeof result[0].createdAt).toBe("string");
    });

    it("sorts archives newest dated directory first", () => {
      writeBackup("20240101/inkvisitor_backup.tar.gz");
      writeBackup("20240301/inkvisitor_backup.tar.gz");
      writeBackup("20240201/inkvisitor_backup.tar.gz");

      const ids = Backup.list(root).map((b) => b.id);

      expect(ids).toEqual([
        "20240301/inkvisitor_backup.tar.gz",
        "20240201/inkvisitor_backup.tar.gz",
        "20240101/inkvisitor_backup.tar.gz",
      ]);
    });
  });

  describe("resolvePath", () => {
    it("resolves a valid id to an absolute path inside the backup dir", () => {
      writeBackup("20240101/inkvisitor_backup.tar.gz");

      const resolved = Backup.resolvePath(root, "20240101/inkvisitor_backup.tar.gz");

      expect(resolved).toBe(path.resolve(root, "20240101/inkvisitor_backup.tar.gz"));
    });

    it("rejects path traversal attempts", () => {
      expect(Backup.resolvePath(root, "../../etc/passwd")).toBeNull();
      expect(Backup.resolvePath(root, "20240101/../../../etc/passwd")).toBeNull();
    });

    it("rejects absolute path ids", () => {
      expect(Backup.resolvePath(root, "/etc/passwd")).toBeNull();
    });

    it("rejects an empty id", () => {
      expect(Backup.resolvePath(root, "")).toBeNull();
    });

    it("rejects any id when the backup dir is not configured", () => {
      expect(Backup.resolvePath("", "20240101/inkvisitor_backup.tar.gz")).toBeNull();
    });
  });
});
