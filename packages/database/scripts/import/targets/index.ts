import { SeedTarget } from "../target";
import { RethinkTarget } from "./rethinkdb";

/** targets for a `--target` value; the default is rethinkdb */
export function createTargets(kind: string): SeedTarget[] {
  switch (kind) {
    case "rethinkdb":
      return [new RethinkTarget()];
    default:
      throw new Error(
        `Unknown target '${kind}' (expected rethinkdb)`
      );
  }
}
