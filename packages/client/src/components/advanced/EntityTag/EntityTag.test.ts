import { describe, expect, it } from "vitest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity } from "constructors";
import { areEntityTagsEqual } from "./EntityTag";

/**
 * A tag renders again only when its comparison says a prop it draws with
 * changed, so every such prop has to be compared.
 */
describe("areEntityTagsEqual", () => {
  const entity = CEntity(
    { defaultLanguage: EntityEnums.Language.English } as UserOptions,
    EntityEnums.Class.Concept,
    "town",
  );

  it("renders a tag again when its tooltip starts or stops letting the pointer through", () => {
    expect(
      areEntityTagsEqual({ entity, tooltipPassThrough: false }, { entity, tooltipPassThrough: true }),
    ).toBe(false);
  });

  it("keeps a tag whose props are the same", () => {
    expect(
      areEntityTagsEqual({ entity, tooltipPassThrough: true }, { entity, tooltipPassThrough: true }),
    ).toBe(true);
  });
});
