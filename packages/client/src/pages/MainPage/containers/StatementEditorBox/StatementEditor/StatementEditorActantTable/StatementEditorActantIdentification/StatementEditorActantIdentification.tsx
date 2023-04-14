import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementIdentification,
} from "@shared/types/statement";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, ButtonGroup } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { StyledCIGrid } from "../StatementEditorActantTableStyles";
import { AttributeData } from "types";

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
        <ButtonGroup style={{ marginLeft: "1rem" }}>
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
      </StyledCIGrid>
    </>
  );
};
