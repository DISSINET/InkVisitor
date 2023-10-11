import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IResponseStatement,
  IStatement,
  IStatementData,
} from "@shared/types";
import { Button, ButtonGroup, Submit } from "components";
import { AttributeButtonGroup, EntitySuggester } from "components/advanced";
import {
  DStatementActants,
  DStatementActions,
  DReferences,
} from "constructors";
import React, { useState } from "react";
import { FaClone, FaPlus, FaTrashAlt } from "react-icons/fa";
import { TbReplace } from "react-icons/tb";
import { UseMutationResult } from "@tanstack/react-query";

interface StatementEditorSectionButtons {
  section: "actions" | "actants" | "references";
  statement: IResponseStatement;
  previousStatement: IResponseStatement | false;
  updateStatementMutation: UseMutationResult<void, unknown, object, unknown>;
  updateStatementDataMutation: UseMutationResult<
    void,
    unknown,
    object,
    unknown
  >;
  setShowSubmitSection: (
    value: React.SetStateAction<false | "actants" | "references" | "actions">
  ) => void;

  handleAttributeChange: (
    changes: Partial<IStatement>,
    instantUpdate: boolean
  ) => void;
  handleDataAttributeChange: (
    changes: Partial<IStatementData>,
    instantUpdate: boolean
  ) => void;
}
export const StatementEditorSectionButtons: React.FC<
  StatementEditorSectionButtons
> = ({
  section,
  statement,
  previousStatement,
  updateStatementMutation,
  updateStatementDataMutation,
  setShowSubmitSection,

  handleAttributeChange,
  handleDataAttributeChange,
}) => {
  const [replaceSection, setReplaceSection] = useState(false);

  const handleCopyFromStatement = (
    selectedStatement: IResponseStatement | IStatement | false,
    section: "actions" | "actants" | "references",
    replaceSection: boolean
  ) => {
    if (selectedStatement) {
      switch (section) {
        case "actions":
          const newActions = replaceSection
            ? [...DStatementActions(selectedStatement.data.actions)]
            : [
                ...statement.data.actions,
                ...DStatementActions(selectedStatement.data.actions),
              ];
          // updateStatementDataMutation.mutate({
          //   actions: newActions,
          // });
          handleDataAttributeChange({ actions: newActions }, true);
          return;
        case "actants":
          const newActants = replaceSection
            ? [...DStatementActants(selectedStatement.data.actants)]
            : [
                ...statement.data.actants,
                ...DStatementActants(selectedStatement.data.actants),
              ];
          // updateStatementDataMutation.mutate({
          //   actants: newActants,
          // });
          handleDataAttributeChange({ actants: newActants }, true);
          return;
        case "references":
          const newReferences = replaceSection
            ? [...DReferences(selectedStatement.references)]
            : [
                ...statement.references,
                ...DReferences(selectedStatement.references),
              ];
          // updateStatementMutation.mutate({ references: newReferences });
          handleAttributeChange({ references: newReferences }, true);
          return;
      }
    }
  };

  const hasEntities = () => {
    switch (section) {
      case "actions":
        return statement.data.actions.length > 0;
      case "actants":
        return statement.data.actants.length > 0;
      case "references":
        return statement.references.length > 0;
    }
  };

  return (
    <>
      <ButtonGroup
        height={19}
        style={{ marginLeft: "0.5rem", marginRight: "1rem" }}
      >
        <Button
          disabled={!hasEntities()}
          icon={<FaTrashAlt />}
          inverted
          color="danger"
          tooltipLabel={`remove all ${section} from statement`}
          onClick={() => setShowSubmitSection(section)}
        />
        <div
          style={{ borderRight: "1px dashed black", marginLeft: "0.3rem" }}
        />
        <AttributeButtonGroup
          options={[
            {
              longValue: "append",
              shortValue: "",
              onClick: () => setReplaceSection(false),
              selected: !replaceSection,
              shortIcon: <FaPlus />,
            },
            {
              longValue: "replace",
              shortValue: "",
              onClick: () => setReplaceSection(true),
              selected: replaceSection,
              shortIcon: <TbReplace />,
            },
          ]}
        />
        <Button
          icon={<FaClone />}
          label="previous S"
          disabled={!previousStatement}
          tooltipLabel={`copy ${section} from the previous statement`}
          inverted
          onClick={() =>
            handleCopyFromStatement(previousStatement, section, replaceSection)
          }
        />
      </ButtonGroup>
      <EntitySuggester
        categoryTypes={[EntityEnums.Class.Statement]}
        onSelected={(id: string) => {}}
        onPicked={(entity: IEntity) =>
          handleCopyFromStatement(entity as IStatement, section, replaceSection)
        }
        excludedActantIds={[statement.id]}
        disableTemplatesAccept
        disableCreate
        inputWidth={65}
        placeholder="another S"
      />
    </>
  );
};
