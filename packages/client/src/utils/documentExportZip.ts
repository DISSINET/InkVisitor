import { IDocumentExport } from "@inkvisitor/shared/types";
import JSZip from "jszip";

// characters no common desktop archiver accepts in an entry name
const illegalFileNameChars = /[/\\:*?"<>|]/g;

/**
 * Names one .txt entry per exported document. Titles are free text, so they are
 * sanitized and made unique - two documents may share a title, and an archive
 * with duplicate entry names loses all but one of them.
 */
export const buildZipEntryNames = (
  documents: Pick<IDocumentExport, "id" | "title">[]
): string[] => {
  const taken = new Set<string>();

  return documents.map((document) => {
    const base = document.title.replace(illegalFileNameChars, "_").trim() || document.id;

    let candidate = base;
    let suffix = 2;
    while (taken.has(`${candidate}.txt`)) {
      candidate = `${base} (${suffix})`;
      suffix += 1;
    }

    taken.add(`${candidate}.txt`);
    return `${candidate}.txt`;
  });
};

/** Date first, so exports of several days sort by name into chronological order */
export const zipFileNameForDate = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}-documents-export.zip`;
};

export const buildDocumentsZip = async (documents: IDocumentExport[]): Promise<Blob> => {
  const zip = new JSZip();
  const names = buildZipEntryNames(documents);

  documents.forEach((document, index) => {
    zip.file(names[index], document.content);
  });

  // entries are plain text, which deflates several times over; JSZip stores
  // them uncompressed unless asked
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
};
