import { certaintyDict, moodDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementClassification,
} from "@shared/types/statement";
import { AttributeIcon, Button, ButtonGroup, Dropdown } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { UseMutationResult } from "@tanstack/react-query";
import { AttributeData } from "types";
import {
  StyledBorderLeft,
  StyledCIGrid,
  StyledExpandedRow,
} from "../StatementEditorActantTableStyles";
import { TooltipAttributes } from "pages/MainPage/containers";

interface StatementEditorActantClassification {
  classifications: IStatementClassification[];
  classification: IStatementClassification;
  updateActant: (statementActantId: string, changes: any) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  sActant: IStatementActant;
  territoryActants?: string[];
}
export const StatementEditorActantClassification: React.FC<
  StatementEditorActantClassification
> = ({
  classifications,
  classification,
  updateActant,
  sActant,
  statement,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  updateStatementDataMutation,
  territoryActants,
}) => {
  const entity = statement.entities[classification.entityId];

  const handleUpdate = (newData: AttributeData & { entityId?: string }) => {
    updateActant(sActant.id, {
      classifications: classifications.map((c) =>
        c.id === classification.id ? { ...c, ...newData } : { ...c }
      ),
    });
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <StyledBorderLeft borderColor="class" padding marginBottom>
      <StyledCIGrid>
        {entity ? (
          <EntityDropzone
            categoryTypes={[EntityEnums.Class.Concept]}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId });
            }}
            isInsideTemplate={isInsideTemplate}
            excludedActantIds={[entity.id]}
          >
            <EntityTag
              entity={entity}
              fullWidth
              unlinkButton={
                userCanEdit && {
                  onClick: () => {
                    handleUpdate({ entityId: "" });
                  },
                  tooltipLabel: "unlink classification",
                }
              }
              elvlButtonGroup={
                <ElvlButtonGroup
                  value={classification.elvl}
                  onChange={(elvl) => {
                    handleUpdate({ elvl });
                  }}
                  disabled={!userCanEdit}
                />
              }
            />
          </EntityDropzone>
        ) : (
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Concept]}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId });
            }}
            openDetailOnCreate
            isInsideTemplate={isInsideTemplate}
            territoryActants={territoryActants}
          />
        )}

        <LogicButtonGroup
          border
          value={classification.logic}
          onChange={(logic) => handleUpdate({ logic })}
          disabled={!userCanEdit}
        />

        <ButtonGroup>
          {userCanEdit && (
            <Button
              key="d"
              icon={<FaTrashAlt />}
              color="plain"
              inverted
              tooltipLabel="remove classification row"
              onClick={() => {
                updateActant(sActant.id, {
                  classifications: classifications.filter(
                    (c) => c.id !== classification.id
                  ),
                });
              }}
            />
          )}
          {classification.logic === "2" && (
            <Button
              key="neg"
              tooltipLabel="Negative logic"
              color="danger"
              inverted
              noBorder
              icon={<AttributeIcon attributeName={"negation"} />}
            />
          )}
        </ButtonGroup>
        <Button
          inverted
          onClick={() => setIsExpanded(!isExpanded)}
          icon={
            isExpanded ? (
              <TbSettingsFilled size={16} />
            ) : (
              <TbSettingsAutomation
                size={16}
                style={{ transform: "rotate(90deg)" }}
              />
            )
          }
          tooltipContent={
            <TooltipAttributes
              data={{
                elvl: classification.elvl,
                logic: classification.logic,
                certainty: classification.certainty,
                mood: classification.mood,
                moodvariant: classification.moodvariant,
              }}
            />
          }
        />
      </StyledCIGrid>

      {/* Expanded Row */}
      {isExpanded && (
        <StyledExpandedRow>
          <div>
            <Dropdown
              width={130}
              isMulti
              disabled={!userCanEdit}
              placeholder="mood"
              tooltipLabel="mood"
              icon={<AttributeIcon attributeName="mood" />}
              options={moodDict}
              value={[allEntities]
                .concat(moodDict)
                .filter((i: any) => classification.mood.includes(i.value))}
              onChange={(newValue: any) => {
                handleUpdate({
                  mood: newValue ? newValue.map((v: any) => v.value) : [],
                });
              }}
              attributeDropdown
            />
          </div>
          <div>
            <MoodVariantButtonGroup
              border
              value={classification.moodvariant}
              onChange={(moodvariant) => handleUpdate({ moodvariant })}
              disabled={!userCanEdit}
            />
          </div>
          <div>
            <Dropdown
              width={110}
              placeholder="certainty"
              tooltipLabel="certainty"
              icon={<AttributeIcon attributeName="certainty" />}
              disabled={!userCanEdit}
              options={certaintyDict}
              value={certaintyDict.find(
                (i: any) => classification.certainty === i.value
              )}
              onChange={(newValue: any) => {
                handleUpdate({ certainty: newValue.value });
              }}
            />
          </div>
        </StyledExpandedRow>
      )}
    </StyledBorderLeft>
  );
};
