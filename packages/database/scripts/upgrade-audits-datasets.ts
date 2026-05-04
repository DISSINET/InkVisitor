import * as fs from "fs";
import * as path from "path";
import { createReadStream } from "fs";

import { AuditScope } from "@shared/types";

const StreamArray = require("stream-json/streamers/StreamArray.js") as {
  withParser: (opts?: unknown) => NodeJS.ReadWriteStream;
};

const MAX_LOAD_BYTES = 100 * 1024 * 1024;
const DATASETS_DIR = path.join(__dirname, "../datasets");

function findAuditsJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name === "audits.json") {
      results.push(full);
    } else if (e.isDirectory()) {
      results.push(...findAuditsJsonFiles(full));
    }
  }
  return results;
}

function upgradeAudit(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj.modelId != null && obj.auditScope != null) {
    return obj;
  }
  const entityId = obj.entityId as string | undefined;
  const documentId = obj.documentId as string | undefined;
  let modelId: string;
  let auditScope: AuditScope;
  if (entityId != null && entityId !== "") {
    modelId = entityId;
    auditScope = AuditScope.Entity;
  } else if (documentId != null && documentId !== "") {
    modelId = documentId;
    auditScope = AuditScope.Document;
  } else {
    return obj;
  }
  const out: Record<string, unknown> = { ...obj, modelId, auditScope };
  delete out.entityId;
  delete out.documentId;
  return out;
}

function writeAuditsJsonStream(
  file: string,
  upgraded: Record<string, unknown>[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(file, { encoding: "utf8" });
    stream.write("[\n");
    for (let i = 0; i < upgraded.length; i++) {
      const line =
        (i === 0 ? "  " : "  ,") +
        JSON.stringify(upgraded[i], null, 4).split("\n").join("\n  ") +
        "\n";
      stream.write(line);
    }
    stream.write("]\n");
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    stream.end();
  });
}

function upgradeFileStreaming(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outPath = file + ".tmp";
    const writeStream = fs.createWriteStream(outPath, { encoding: "utf8" });
    writeStream.write("[\n");
    let first = true;
    const pipeline = createReadStream(file).pipe(StreamArray.withParser());
    pipeline.on("data", ({ value }: { value: Record<string, unknown> }) => {
      const upgraded = upgradeAudit(value);
      const line =
        (first ? "  " : "  ,") +
        JSON.stringify(upgraded, null, 4).split("\n").join("\n  ") +
        "\n";
      first = false;
      if (!writeStream.write(line)) {
        pipeline.pause();
        writeStream.once("drain", () => pipeline.resume());
      }
    });
    pipeline.on("end", () => {
      writeStream.write("]\n");
      writeStream.end();
    });
    pipeline.on("error", (err) => {
      writeStream.destroy();
      reject(err);
    });
    writeStream.on("finish", () => {
      fs.renameSync(outPath, file);
      resolve();
    });
    writeStream.on("error", (err) => {
      try {
        fs.unlinkSync(outPath);
      } catch {
        /* ignore */
      }
      reject(err);
    });
  });
}

async function run(): Promise<void> {
  const files = findAuditsJsonFiles(DATASETS_DIR);
  console.log(`Found ${files.length} audits.json file(s).`);
  for (const file of files) {
    const stat = fs.statSync(file);
    if (stat.size > MAX_LOAD_BYTES) {
      console.log(`Upgrading ${file} (streaming, ${(stat.size / 1024 / 1024).toFixed(1)} MB)...`);
      await upgradeFileStreaming(file);
    } else {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(data)) {
        console.log(`Skip ${file}: not an array`);
        continue;
      }
      const upgraded = data.map((item: Record<string, unknown>) =>
        upgradeAudit(item)
      );
      await writeAuditsJsonStream(file, upgraded);
    }
    console.log(`Upgraded ${file}`);
  }
  console.log("Done.");
}

run();
