export interface IResponseBackup {
  // relative path from the backup dir, used as the download identifier, e.g. "20240101/inkvisitor_backup.tar.gz"
  id: string;
  // base file name of the archive
  filename: string;
  // size of the archive in bytes
  sizeBytes: number;
  // ISO timestamp of when the archive file was last modified
  createdAt: string;
}
