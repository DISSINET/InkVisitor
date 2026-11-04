import { SeedTarget } from "../target";
import { PostgresTarget } from "./postgres";
import { RethinkTarget } from "./rethinkdb";

/** targets for a `--target` value; the default is rethinkdb, `both` writes the same rows to each */
export function createTargets(kind: string): SeedTarget[] {
  switch (kind) {
    case "rethinkdb":
      return [new RethinkTarget()];
    case "postgres":
      return [new PostgresTarget()];
    case "both":
      return [new RethinkTarget(), new PostgresTarget()];
    default:
      throw new Error(
        `Unknown target '${kind}' (expected rethinkdb, postgres or both)`
      );
  }
}
