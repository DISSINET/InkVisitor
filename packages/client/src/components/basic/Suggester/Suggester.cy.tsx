import React from "react";
import { Suggester } from "./Suggester";
import { EntityEnums } from "@shared/enums";

describe("<Suggester />", () => {
  it("renders", () => {
    cy.mount(
      <Suggester
        typed=""
        categories={[
          { label: EntityEnums.Class.Action, value: EntityEnums.Class.Action },
          {
            label: EntityEnums.Class.Location,
            value: EntityEnums.Class.Location,
          },
        ]}
        category={{
          label: EntityEnums.Class.Action,
          value: EntityEnums.Class.Action,
        }}
        isInsideTemplate={false}
        onCancel={() => {}}
        onChangeCategory={(selectedOption) => {}}
        onCreate={(item) => {}}
        onDrop={(item) => {}}
        onHover={(item) => {}}
        onPick={(entity) => {}}
        onType={(newType) => {}}
        showCreateModal={false}
        setShowCreateModal={(value) => {}}
        suggestions={[]}
      />
    );
  });
});
