import { EntityClass } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementIdentification,
} from "@shared/types/statement";
import { Button, ButtonGroup } from "components";
import { EntityTag, EntitySuggester } from "components/advanced";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import React, { useState } from "react";
import { FaUnlink, FaTrashAlt } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import {
  StyledCI,
  StyledCIHeading,
  StyledCIGrid,
  StyledTagWrapper,
} from "../StatementEditorActantTableStyles";

interface StatementEditorActantIdentifications {
  identifications: IStatementIdentification[];
  updateActant: (statementActantId: string, changes: any) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  sActant: IStatementActant;
  classEntitiesActant: EntityClass[];
}
export const StatementEditorActantIdentifications: React.FC<
  StatementEditorActantIdentifications
> = ({
  identifications,
  statement,
  updateActant,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  updateStatementDataMutation,
  sActant,
  classEntitiesActant,
}) => {
  return (
    <>
      {identifications.length > 0 && (
        <StyledCI>
          <StyledCIHeading>Identifications:</StyledCIHeading>
          {identifications.length > 0 &&
            identifications.map((identification, key) => {
              const [identificationModalOpen, setIdentificationModalOpen] =
                useState(false);
              const entity = statement.entities[identification.entityId];
              return (
                <StyledCIGrid key={key}>
                  {entity ? (
                    <StyledTagWrapper>
                      <EntityTag
                        entity={entity}
                        fullWidth
                        button={
                          userCanEdit && (
                            <Button
                              key="d"
                              tooltip="unlink identification"
                              icon={<FaUnlink />}
                              color="plain"
                              inverted={true}
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
                            c.id === identification.id
                              ? { ...c, ...newData }
                              : { ...c }
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
                      classEntitiesActant={[EntityClass.Concept]}
                      loading={updateStatementDataMutation.isLoading}
                      isInsideTemplate={isInsideTemplate}
                      territoryParentId={territoryParentId}
                    />
                    {userCanEdit && (
                      <Button
                        key="d"
                        icon={<FaTrashAlt />}
                        color="plain"
                        inverted={true}
                        tooltip="remove identification row"
                        onClick={() => {
                          updateActant(sActant.id, {
                            identifications: identifications.filter(
                              (c) => c.id !== identification.id
                            ),
                          });
                        }}
                      />
                    )}
                  </ButtonGroup>
                </StyledCIGrid>
              );
            })}
        </StyledCI>
      )}
    </>
  );
};
