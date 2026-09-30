import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { templateSourceLink } from "./templateSourceLink";

const asEntity = (o: object): IEntity => o as unknown as IEntity;

describe("templateSourceLink", () => {
  it("links an entity to the template created from it", () => {
    expect(
      templateSourceLink(
        asEntity({ id: "E1", class: EntityEnums.Class.Event, isTemplate: false }),
        "T-new",
      ),
    ).toEqual({ usedTemplate: "T-new" });
  });

  it("leaves a template untouched when a new template is created from it", () => {
    expect(
      templateSourceLink(
        asEntity({
          id: "T-origin",
          class: EntityEnums.Class.Event,
          isTemplate: true,
          usedTemplate: "",
        }),
        "T-new",
      ),
    ).toBeNull();
  });
});
