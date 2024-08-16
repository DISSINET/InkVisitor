import { certaintyDict, moodDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementClassification,
} from "@shared/types/statement";
import { AttributeIcon, Button, ButtonGroup } from "components";
import Dropdown, {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import { TooltipAttributes } from "pages/Main/containers";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { AttributeData } from "types";
import {
  StyledBorderLeft,
  StyledCIGrid,
  StyledExpandedRow,
  StyledSuggesterWrap,
} from "../StatementEditorActantTableStyles";

interface StatementEditorActantClassification {
  classifications: IStatementClassification[];
  classification: IStatementClassification;
  updateActant: (
    statementActantId: string,
    changes: Partial<IStatementActant>,
    instantUpdate?: boolean
  ) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
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
  territoryActants,
}) => {
  const entity = statement.entities[classification.entityId];

  const handleUpdate = (
    newData: AttributeData & { entityId?: string },
    instantUpdate?: boolean
  ) => {
    updateActant(
      sActant.id,
      {
        classifications: classifications.map((c) =>
          c.id === classification.id ? { ...c, ...newData } : { ...c }
        ),
      },
      instantUpdate
    );
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <StyledBorderLeft $borderColor="class" $padding $marginBottom>
      <StyledCIGrid>
        {entity ? (
          <EntityDropzone
            categoryTypes={[EntityEnums.Class.Concept]}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId }, true);
            }}
            isInsideTemplate={isInsideTemplate}
            excludedActantIds={[entity.id]}
            disabled={!userCanEdit}
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
          <StyledSuggesterWrap>
            <EntitySuggester
              categoryTypes={[EntityEnums.Class.Concept]}
              onSelected={(entityId: string) => {
                handleUpdate({ entityId }, true);
              }}
              openDetailOnCreate
              isInsideTemplate={isInsideTemplate}
              territoryActants={territoryActants}
              disabled={!userCanEdit}
            />
          </StyledSuggesterWrap>
        )}

        <LogicButtonGroup
          border
          value={classification.logic}
          onChange={(logic) => handleUpdate({ logic })}
          disabled={!userCanEdit}
        />

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
      </StyledCIGrid>

      {/* Expanded Row */}
      {isExpanded && (
        <StyledExpandedRow>
          <div>
            <Dropdown.Multi.Attribute
              width={130}
              disabled={!userCanEdit}
              placeholder="mood"
              tooltipLabel="mood"
              icon={<AttributeIcon attributeName="mood" />}
              options={moodDict}
              value={classification.mood}
              onChange={(newValues) => {
                handleUpdate({
                  mood: newValues,
                });
              }}
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
            <Dropdown.Single.Basic
              width={110}
              placeholder="certainty"
              tooltipLabel="certainty"
              icon={<AttributeIcon attributeName="certainty" />}
              disabled={!userCanEdit}
              options={certaintyDict}
              value={classification.certainty}
              onChange={(newValue) => {
                handleUpdate({
                  certainty: newValue,
                });
              }}
            />
          </div>
        </StyledExpandedRow>
      )}
    </StyledBorderLeft>
  );
};
