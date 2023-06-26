import React from "react";
import { TagGroup } from "./TagGroup";
import { CEntity } from "constructors";
import { EntityEnums } from "@shared/enums";
import { UserOptions } from "@shared/types/response-user";

const userOptions: UserOptions = {
  defaultLanguage: EntityEnums.Language.Czech,
  defaultTerritory: "T1",
  searchLanguages: [EntityEnums.Language.Czech],
};

describe("<TagGroup />", () => {
  it("renders", () => {
    cy.mount(
      <TagGroup
        definedEntities={[
          CEntity(userOptions, EntityEnums.Class.Concept, "um"),
          CEntity(userOptions, EntityEnums.Class.Territory, "dois"),
          CEntity(userOptions, EntityEnums.Class.Location, "tres"),
        ]}
        oversizeLimit={2}
      />
    );
  });
});
