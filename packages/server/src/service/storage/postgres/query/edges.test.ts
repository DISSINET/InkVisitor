import "ts-jest";
import { Params } from "../sql";
import { PREDICATES, getEdgeInstance } from "./edges";

/** edge type -> the gin column its predicate narrows by */
const INDEXED: [string, string][] = [
  ["EP:T", "prop_entity_ids"],
  ["HP:V", "prop_entity_ids"],
  ["HR:R", "reference_entity_ids"],
  ["HR:V", "reference_entity_ids"],
  ["SP:T", "statement_prop_entity_ids"],
  ["SP:V", "statement_prop_entity_ids"],
  ["SC", "statement_actant_ci_ids"],
  ["SI", "statement_actant_ci_ids"],
  ["I_IS:S", "statement_entity_ids"],
  ["I_IS:A1", "statement_entity_ids"],
  ["I_IS:A2", "statement_entity_ids"],
  ["I_IS:PS", "statement_entity_ids"],
  ["I_IS:A", "statement_entity_ids"],
];

const ids = (n: number): string[] => Array.from({ length: n }, (_, i) => `e-${i}`);

const sql = (type: string, targets: string[] | null): string => {
  const edge = getEdgeInstance({ type: type as any, node: { params: {} } as any });
  (edge as any).targetEntityIds = targets;
  return PREDICATES[type](edge, new Params());
};

describe.each(INDEXED)("%s", (type, column) => {
  it("probes the gin column for up to 100 targets", () => {
    expect(sql(type, ids(1))).toContain(`${column} && $`);
    expect(sql(type, ids(100))).toContain(`${column} && $`);
  });

  it("leaves a longer target list to the document predicate", () => {
    expect(sql(type, ids(101))).not.toContain(`${column} &&`);
  });

  it("has no index condition without a target", () => {
    expect(sql(type, null)).not.toContain(`${column} &&`);
  });
});
