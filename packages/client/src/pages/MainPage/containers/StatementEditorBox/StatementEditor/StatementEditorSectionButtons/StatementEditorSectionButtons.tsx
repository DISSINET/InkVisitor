import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseStatement, IStatement } from "@shared/types";
import { ButtonGroup, Button, Checkbox } from "components";
import { AttributeButtonGroup, EntitySuggester } from "components/advanced";
import {
  DStatementActions,
  DStatementActants,
  DStatementReferences,
} from "constructors";
import React, { useState } from "react";
import { FaClone, FaTrashAlt } from "react-icons/fa";
import { HiOutlineFolderRemove } from "react-icons/hi";
import { MdDriveFileMove, MdDriveFolderUpload } from "react-icons/md";
import { UseMutationResult } from "react-query";

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
}
export const StatementEditorSectionButtons: React.FC<
  StatementEditorSectionButtons
> = ({
  section,
  statement,
  previousStatement,
  updateStatementMutation,
  updateStatementDataMutation,
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
          updateStatementDataMutation.mutate({
            actions: newActions,
          });
          return;
        case "actants":
          const newActants = replaceSection
            ? [...DStatementActants(selectedStatement.data.actants)]
            : [
                ...statement.data.actants,
                ...DStatementActants(selectedStatement.data.actants),
              ];
          updateStatementDataMutation.mutate({
            actants: newActants,
          });
          return;
        case "references":
          const newReferences = replaceSection
            ? [...DStatementReferences(selectedStatement.references)]
            : [
                ...statement.references,
                ...DStatementReferences(selectedStatement.references),
              ];
          updateStatementMutation.mutate({ references: newReferences });
          return;
      }
    }
  };

  return (
    <>
      <ButtonGroup
        height={19}
        style={{ marginLeft: "0.5rem", marginRight: "1rem" }}
      >
        <Button
          icon={<FaTrashAlt />}
          inverted
          color="danger"
          tooltipLabel={`remove all ${section} from statement`}
          onClick={() => {
            if (section === "references") {
              updateStatementMutation.mutate({ references: [] });
            } else {
              updateStatementDataMutation.mutate({ [section]: [] });
            }
          }}
        />
        <div
          style={{ borderRight: "1px dashed black", marginLeft: "0.3rem" }}
        />
        <AttributeButtonGroup
          // disabled={!userCanEdit}
          options={[
            {
              longValue: "append",
              shortValue: "append",
              onClick: () => setReplaceSection(false),
              selected: !replaceSection,
            },
            {
              longValue: "replace",
              shortValue: "replace",
              onClick: () => setReplaceSection(true),
              selected: replaceSection,
            },
          ]}
        />
        <Button
          icon={<FaClone />}
          label="...from previous S"
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
        onSelected={(id: string) => console.log(id)}
        onPicked={(entity: IEntity) =>
          handleCopyFromStatement(entity as IStatement, section, replaceSection)
        }
        excludedActantIds={[statement.id]}
        disableCreate
        placeholder="...from another S"
      />
    </>
  );
};
