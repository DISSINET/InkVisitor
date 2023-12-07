import { certaintyDict, moodDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementIdentification,
} from "@shared/types/statement";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, ButtonGroup } from "components";
import Dropdown, {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import { TooltipAttributes } from "pages/MainPage/containers";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { AttributeData } from "types";
import {
  StyledBorderLeft,
  StyledCIGrid,
  StyledExpandedRow,
} from "../StatementEditorActantTableStyles";

interface StatementEditorActantIdentification {
  identifications: IStatementIdentification[];
  identification: IStatementIdentification;
  updateActant: (
    statementActantId: string,
    changes: any,
    instantUpdate?: boolean
  ) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  sActant: IStatementActant;
  classEntitiesActant: EntityEnums.Class[];
  territoryActants?: string[];
}
export const StatementEditorActantIdentification: React.FC<
  StatementEditorActantIdentification
> = ({
  identifications,
  identification,
  statement,
  updateActant,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  sActant,
  classEntitiesActant,
  territoryActants,
}) => {
  const entity = statement.entities[identification.entityId];

  const handleUpdate = (
    newData: AttributeData & { entityId?: string },
    instantUpdate?: boolean
  ) => {
    updateActant(
      sActant.id,
      {
        identifications: identifications.map((c) =>
          c.id === identification.id ? { ...c, ...newData } : { ...c }
        ),
      },
      instantUpdate
    );
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <StyledBorderLeft borderColor="ident" padding marginBottom>
      <StyledCIGrid>
        {entity ? (
          <EntityDropzone
            categoryTypes={classEntitiesActant}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId }, true);
            }}
            isInsideTemplate={isInsideTemplate}
            excludedActantIds={[entity.id]}
            excludedEntityClasses={excludedSuggesterEntities}
          >
            <EntityTag
              entity={entity}
              fullWidth
              unlinkButton={
                userCanEdit && {
                  onClick: () => {
                    handleUpdate({ entityId: "" });
                  },
                  tooltipLabel: "unlink identification",
                }
              }
              elvlButtonGroup={
                <ElvlButtonGroup
                  value={identification.elvl}
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
            categoryTypes={classEntitiesActant}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId }, true);
            }}
            openDetailOnCreate
            isInsideTemplate={isInsideTemplate}
            territoryActants={territoryActants}
            excludedEntityClasses={excludedSuggesterEntities}
          />
        )}

        <LogicButtonGroup
          border
          value={identification.logic}
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
              tooltipLabel="remove identification row"
              onClick={() => {
                updateActant(sActant.id, {
                  identifications: identifications.filter(
                    (c) => c.id !== identification.id
                  ),
                });
              }}
            />
          )}
          {identification.logic === "2" && (
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
                elvl: identification.elvl,
                logic: identification.logic,
                certainty: identification.certainty,
                mood: identification.mood,
                moodvariant: identification.moodvariant,
              }}
            />
          }
        />
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
              value={identification.mood}
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
              value={identification.moodvariant}
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
              value={identification.certainty}
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
