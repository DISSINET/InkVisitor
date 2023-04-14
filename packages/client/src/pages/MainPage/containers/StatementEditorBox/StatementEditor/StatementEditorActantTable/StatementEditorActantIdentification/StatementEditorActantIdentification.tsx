import { certaintyDict, moodDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementIdentification,
} from "@shared/types/statement";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, ButtonGroup, Dropdown } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { TbSettingsAutomation, TbSettingsFilled } from "react-icons/tb";
import { UseMutationResult } from "react-query";
import { AttributeData } from "types";
import {
  StyledCIGrid,
  StyledExpandedRow,
} from "../StatementEditorActantTableStyles";

interface StatementEditorActantIdentification {
  identifications: IStatementIdentification[];
  identification: IStatementIdentification;
  updateActant: (statementActantId: string, changes: any) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
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
  updateStatementDataMutation,
  sActant,
  classEntitiesActant,
  territoryActants,
}) => {
  const [identificationModalOpen, setIdentificationModalOpen] = useState(false);
  const entity = statement.entities[identification.entityId];

  const handleUpdate = (newData: AttributeData & { entityId?: string }) => {
    updateActant(sActant.id, {
      identifications: identifications.map((c) =>
        c.id === identification.id ? { ...c, ...newData } : { ...c }
      ),
    });
  };

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <StyledCIGrid>
        {entity ? (
          <EntityDropzone
            categoryTypes={classEntitiesActant}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId });
            }}
            isInsideTemplate={isInsideTemplate}
            excludedActantIds={[entity.id]}
            excludedEntities={excludedSuggesterEntities}
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
                />
              }
            />
          </EntityDropzone>
        ) : (
          <EntitySuggester
            categoryTypes={classEntitiesActant}
            onSelected={(entityId: string) => {
              handleUpdate({ entityId });
            }}
            openDetailOnCreate
            isInsideTemplate={isInsideTemplate}
            territoryActants={territoryActants}
            excludedEntities={excludedSuggesterEntities}
          />
        )}

        <LogicButtonGroup
          border
          value={identification.logic}
          onChange={(logic) => handleUpdate({ logic })}
        />

        <ButtonGroup>
          <AttributesEditor
            modalOpen={identificationModalOpen}
            setModalOpen={setIdentificationModalOpen}
            modalTitle={`Identification`}
            entity={entity}
            disabledAllAttributes={!userCanEdit}
            userCanEdit={userCanEdit}
            data={{
              elvl: identification.elvl,
              logic: identification.logic,
              certainty: identification.certainty,
              mood: identification.mood,
              moodvariant: identification.moodvariant,
            }}
            handleUpdate={(newData) => {
              updateActant(sActant.id, {
                identifications: identifications.map((c) =>
                  c.id === identification.id ? { ...c, ...newData } : { ...c }
                ),
              });
            }}
            updateActantId={(entityId: string) => {
              handleUpdate({ entityId });
            }}
            classEntitiesActant={classEntitiesActant}
            loading={updateStatementDataMutation.isLoading}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
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
              onClick={() => setIdentificationModalOpen(true)}
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
        />
      </StyledCIGrid>

      {/* Expanded Row */}
      {isExpanded && (
        <StyledExpandedRow>
          <div>
            <Dropdown
              width={100}
              isMulti
              disabled={!userCanEdit}
              placeholder="mood"
              tooltipLabel="mood"
              icon={<AttributeIcon attributeName="mood" />}
              options={moodDict}
              value={[allEntities]
                .concat(moodDict)
                .filter((i: any) => identification.mood.includes(i.value))}
              onChange={(newValue: any) => {
                handleUpdate({
                  mood: newValue ? newValue.map((v: any) => v.value) : [],
                });
              }}
            />
          </div>
          <div>
            <MoodVariantButtonGroup
              border
              value={identification.moodvariant}
              onChange={(moodvariant) => handleUpdate({ moodvariant })}
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
                (i: any) => identification.certainty === i.value
              )}
              onChange={(newValue: any) => {
                handleUpdate({ certainty: newValue.value });
              }}
            />
          </div>
        </StyledExpandedRow>
      )}
    </>
  );
};
