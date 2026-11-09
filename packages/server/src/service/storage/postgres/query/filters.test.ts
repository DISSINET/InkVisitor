import "ts-jest";
import { BadParams } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { nodeFilters } from "./filters";

/** params as a client might send them, past the type the server declares */
const params = (raw: Record<string, unknown>) => raw as Query.INodeParams;

describe("nodeFilters", () => {
  it("reads the user and list params", () => {
    const filters = nodeFilters(params({ createdBy: "u-1", editedBy: ["u-1", "u-2"], coOccurrence: ["e-1"] }));
    expect(filters.createdBy).toBe("u-1");
    expect(filters.updatedBy).toBeUndefined();
    expect(filters.editedBy).toEqual(["u-1", "u-2"]);
    expect(filters.coOccurrence).toEqual(["e-1"]);
  });

  it("rejects a list param that is not a list of ids", () => {
    expect(() => nodeFilters(params({ editedBy: "u-1" }))).toThrow(BadParams);
    expect(() => nodeFilters(params({ coOccurrence: [1, 2] }))).toThrow(BadParams);
  });

  it("rejects a user param that is not a string", () => {
    expect(() => nodeFilters(params({ createdBy: ["u-1"] }))).toThrow(BadParams);
    expect(() => nodeFilters(params({ updatedBy: 5 }))).toThrow(BadParams);
  });
});
