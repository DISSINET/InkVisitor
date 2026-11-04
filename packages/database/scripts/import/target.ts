import { TableSchema } from "./common";

export type TargetKind = "rethinkdb" | "postgres";

/**
 * How one insert landed. `duplicates` are rows dropped because the id is
 * already stored, which is the intended behaviour for a dataset that lists an
 * id twice; `failed` are rows the database refused for any other reason.
 */
export interface InsertResult {
  inserted: number;
  duplicates: number;
  failed: number;
}

/**
 * One database the seeder writes to. Every method after useDb works on the
 * database named there; connect/end own the underlying connection(s).
 */
export interface SeedTarget {
  readonly kind: TargetKind;
  readonly dbName: string;
  connect(): Promise<void>;
  end(): Promise<void>;
  dbList(): Promise<string[]>;
  useDb(name: string): void;
  dbDrop(): Promise<void>;
  dbCreate(): Promise<void>;
  /** every table and index of the catalogue, on an empty database */
  createTables(): Promise<void>;
  /**
   * the constraints between rows, once every table is loaded: a batch can
   * hold a row before the row it references
   */
  addConstraints(): Promise<void>;
  /** rows already carry ids; a duplicate id is skipped, not an error */
  insert(
    table: TableSchema,
    rows: Record<string, unknown>[]
  ): Promise<InsertResult>;
  count(table: TableSchema): Promise<number>;
}
