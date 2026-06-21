import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import Entity from "./entity";
import { ResponseEntity } from "./response";

// The expansion flags are set on the ResponseEntity Proxy; verify they survive
// JSON serialization (that is how they reach the client).
describe("ResponseEntity expansion flag serialization", () => {
  test("isEquivalent=true appears in JSON", () => {
    const entity = new Entity({ id: "x", class: EntityEnums.Class.Concept });
    const response = new ResponseEntity(entity);
    response.isEquivalent = true;
    const json = JSON.parse(JSON.stringify(response));
    expect(json.isEquivalent).toBe(true);
    expect(json.id).toBe("x");
  });

  test("isSubordinate=true appears in JSON", () => {
    const entity = new Entity({ id: "z", class: EntityEnums.Class.Concept });
    const response = new ResponseEntity(entity);
    response.isSubordinate = true;
    const json = JSON.parse(JSON.stringify(response));
    expect(json.isSubordinate).toBe(true);
  });

  test("unset flags are omitted from JSON (no payload bloat)", () => {
    const entity = new Entity({ id: "y", class: EntityEnums.Class.Concept });
    const response = new ResponseEntity(entity);
    const json = JSON.parse(JSON.stringify(response));
    expect(json.isEquivalent).toBeUndefined();
    expect(json.isSubordinate).toBeUndefined();
  });
});
