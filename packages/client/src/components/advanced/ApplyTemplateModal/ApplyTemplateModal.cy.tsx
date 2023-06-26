import React from "react";
import { ApplyTemplateModal } from "./ApplyTemplateModal";
import { CEntity } from "constructors";
import { EntityEnums } from "@shared/enums";

describe("<ApplyTemplateModal />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <ApplyTemplateModal
        showModal
        templateToApply={CEntity(
          {
            defaultTerritory: "T1",
            defaultLanguage: EntityEnums.Language.Czech,
            searchLanguages: [EntityEnums.Language.Czech],
          },
          EntityEnums.Class.Territory,
          "modal label?"
        )}
        setShowApplyTemplateModal={() => {}}
        setTemplateToApply={() => {}}
      />
    );
  });
});
