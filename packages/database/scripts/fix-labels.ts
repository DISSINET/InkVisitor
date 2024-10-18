import { IEntity } from "@shared/types";
import * as fs from "fs";
import * as path from "path";

// Function to scan the given directory and print contents of entities.json in subdirectories
async function scanDirectory(directory: string): Promise<void> {
  try {
    const files = await fs.promises.readdir(directory, { withFileTypes: true });

    // Iterate over all files/directories in the current directory
    for (const file of files) {
      if (file.isDirectory()) {
        // Form the path to 'entities.json' in the subdirectory
        const entitiesFilePath = path.join(
          directory,
          file.name,
          "entities.json"
        );

        // Check if 'entities.json' exists in the subdirectory
        if (fs.existsSync(entitiesFilePath)) {
          const content = await fs.promises.readFile(entitiesFilePath, "utf-8");
          console.log(`Fixing ${entitiesFilePath}:`);
          const entities: IEntity[] = JSON.parse(content);
          entities.forEach((e) => {
            if ((e as any).label) {
              e.labels = [(e as any).label];
            }
            delete (e as any).label;
          });
          await fs.writeFileSync(
            entitiesFilePath,
            JSON.stringify(entities, null, 4)
          );
        } else {
          console.log(`No entities.json found in ${file.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Error reading the directory:", error);
  }
}

// Example usage: scan a directory
const directoryToScan = "./datasets"; // Replace with the directory path
scanDirectory(directoryToScan);
