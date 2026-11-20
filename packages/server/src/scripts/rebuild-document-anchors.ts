import "../settings";
import Document from "@models/document/document";
import { Db } from "@service/storage";

// Rebuilds the stored anchors tree and entity ids of every document from its
// content, for the database named by the loaded env file (ENV_FILE). A tree
// is stored when a document is saved, so a document saved before a fix to the
// anchor pairing keeps the earlier tree until this runs. `--dry-run` only
// counts the documents it would rewrite.
//   ENV_FILE=production pnpm rebuild-anchors --dry-run
(async () => {
  const dryRun = process.argv.includes("--dry-run");
  const db = new Db();
  await db.initDb();
  try {
    const { checked, rebuilt } = await Document.rebuildAnchors(db.connection, { dryRun });
    console.log(
      `[rebuild-anchors] ${rebuilt} of ${checked} documents ${dryRun ? "to rebuild (dry run)" : "rebuilt"}`
    );
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(`[rebuild-anchors] FAILED: ${e.message}`);
  process.exit(1);
});
