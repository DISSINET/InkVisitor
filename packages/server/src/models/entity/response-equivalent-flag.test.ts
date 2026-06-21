import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import Entity from "./entity";
import { ResponseEntity } from "./response";

// The flag is set on the ResponseEntity Proxy; verify it survives JSON
// serialization (that is how it reaches the client).
describe("ResponseEntity.isEquivalent serialization", () => {
  test("isEquivalent=true appears in JSON", () => {
    const entity = new Entity({ id: "x", class: EntityEnums.Class.Concept });
    const response = new ResponseEntity(entity);
    response.isEquivalent = true;
    const json = JSON.parse(JSON.stringify(response));
    expect(json.isEquivalent).toBe(true);
    expect(json.id).toBe("x");
  });

  test("unset flag is omitted from JSON (no payload bloat)", () => {
    const entity = new Entity({ id: "y", class: EntityEnums.Class.Concept });
    const response = new ResponseEntity(entity);
    const json = JSON.parse(JSON.stringify(response));
    expect(json.isEquivalent).toBeUndefined();
  });
});
