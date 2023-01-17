import { EntityEnums } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementIdentification,
} from "@shared/types/statement";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import React, { useState } from "react";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import {
  StyledCIGrid,
  StyledTagWrapper,
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
export const StatementEditorActantIdentification: React.FC<StatementEditorActantIdentification> =
  ({
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
    const [identificationModalOpen, setIdentificationModalOpen] =
      useState(false);
    const entity = statement.entities[identification.entityId];

    return (
      <>
        <StyledCIGrid>
          {entity ? (
            <StyledTagWrapper>
              <EntityTag
                entity={entity}
                fullWidth
                button={
                  userCanEdit && (
                    <Button
                      key="d"
                      tooltipLabel="unlink identification"
                      icon={<FaUnlink />}
                      color="plain"
                      inverted
                      onClick={() => {
                        updateActant(sActant.id, {
                          identifications: identifications.map((c) =>
                            c.id === identification.id
                              ? { ...c, entityId: "" }
                              : { ...c }
                          ),
                        });
                      }}
                    />
                  )
                }
              />
            </StyledTagWrapper>
          ) : (
            <EntitySuggester
              categoryTypes={classEntitiesActant}
              onSelected={(newSelectedId: string) => {
                const newIdentifications: IStatementIdentification[] =
                  identifications.map((c) =>
                    c.id === identification.id
                      ? { ...c, entityId: newSelectedId }
                      : { ...c }
                  );
                updateActant(sActant.id, {
                  identifications: newIdentifications,
                });
              }}
              openDetailOnCreate
              isInsideTemplate={isInsideTemplate}
              territoryActants={territoryActants}
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
              updateActantId={(newId: string) => {
                updateActant(sActant.id, {
                  identifications: identifications.map((c) =>
                    c.id === identification.id
                      ? { ...c, entityId: newId }
                      : { ...c }
                  ),
                });
              }}
              classEntitiesActant={[EntityEnums.Class.Concept]}
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
                color="success"
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
