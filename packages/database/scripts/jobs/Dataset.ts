import * as fs from "fs";
import * as path from "path";
import { confirm } from "../import/prompts";

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

  public get datasetName() {
    return this._datasetName;
  }

  getPath(filename?: string) {
    if (!this._datasetName) {
      throw new Error(
        "Dataset name not yet set, cannot create the path to directory"
      );
    }

    let parts = [__dirname, "..", "..", Dataset.DIRECTORY, this._datasetName];
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

    const rawData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(rawData);
  }

  async writeFile(filename: string, data: string) {
    if (!filename) {
      throw new Error("no filename provided");
    }

    const dirPath = this.getPath();
    const filePath = this.getPath(filename);

    console.log("dirPath", fs.existsSync(dirPath));
    console.log("filePath", fs.existsSync(filePath));

    // check folder path
    if (fs.existsSync(dirPath)) {
      if (await confirm(`dir ${dirPath} exists...continue?`)) {
        console.log(`reusing dir ${dirPath}`);
      } else {
        console.log(`not reusing dir ${dirPath}. Exiting`);
        return;
      }
    } else {
      fs.mkdirSync(dirPath);
    }

    // check file path
    if (fs.existsSync(filePath)) {
      if (await confirm(`rewrite existing file ${filename}?`)) {
        fs.rmSync(filePath);
      } else {
        console.log(`not overwriting file ${filePath}. Exiting`);
        return;
      }
    }

    fs.writeFileSync(filePath, data);
  }
}
