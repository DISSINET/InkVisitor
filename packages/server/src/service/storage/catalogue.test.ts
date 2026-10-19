import { TABLES as RETHINK } from "./rethink/provision";
import { REQUIRED } from "./requiredIndexes";

/**
 * The catalogue is written by hand. This is what keeps it carrying every
 * index the server requires.
 */
describe("storage catalogues", () => {
  it("declare every index the server requires at startup", () => {
    for (const req of REQUIRED) {
      expect(RETHINK[req.table]?.map((i) => i.name)).toContain(req.index);
    }
  });
});
