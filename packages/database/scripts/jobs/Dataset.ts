import * as fs from "fs";
import * as path from "path";

export default class Dataset {
  static DIRECTORY = "datasets";
  _datasetName: string = "";

  constructor(datasetName?: string) {
    if (datasetName) {
      this._datasetName = datasetName;
    }
  }

  public set datasetName(datasetName: string) {
    this._datasetName = datasetName;
  }

  getPath(filename?: string) {
    if (!this._datasetName) {
      throw new Error(
        "Dataset name not yet set, cannot create the path to directory"
      );
    }

    let parts = [
      __dirname,
      "..",
      "..",
      Dataset.DIRECTORY,
      this._datasetName,
    ];
    if (filename) {
      parts.push(filename);
    }
    return path.join.apply(undefined, parts);
  }

  async loadData(filename: string): Promise<any[]> {
    const filePath = this.getPath(filename);

    if (!fs.existsSync(filePath)) {
        throw new Error(`file ${filePath} does not exist`);
    }

    const rawData = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(rawData)
  }

  async writeFile(filename: string, data: string) {
    if (!filename) {
      throw new Error("no filename provided");
    }

    const dirPath = this.getPath();
    const filePath = this.getPath(filename);

    if (fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    } else {
      if (await confirm(`dir ${dirPath} exists...continue?`)) {
        console.log(`not reusing dir ${dirPath}`);
        return;
      }
    }

    if (fs.existsSync(filePath)) {
      if (await confirm(`rewrite existing file ${filename}?`)) {
        fs.rmSync(filePath);
      } else {
        console.log(`not overwriting file ${filePath}`);
        return;
      }
    }

    fs.writeFileSync(filePath, data);
  }
}
