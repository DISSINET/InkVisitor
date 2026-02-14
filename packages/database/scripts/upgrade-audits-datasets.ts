import * as fs from "fs";
import * as path from "path";

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
  let auditScope: "entity" | "document";
  if (entityId != null && entityId !== "") {
    modelId = entityId;
    auditScope = "entity";
  } else if (documentId != null && documentId !== "") {
    modelId = documentId;
    auditScope = "document";
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

async function run(): Promise<void> {
  const files = findAuditsJsonFiles(DATASETS_DIR);
  console.log(`Found ${files.length} audits.json file(s).`);
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(data)) {
      console.log(`Skip ${file}: not an array`);
      continue;
    }
    const upgraded = data.map((item: Record<string, unknown>) =>
      upgradeAudit(item)
    );
    await writeAuditsJsonStream(file, upgraded);
    console.log(`Upgraded ${file}`);
  }
  console.log("Done.");
}

run();
