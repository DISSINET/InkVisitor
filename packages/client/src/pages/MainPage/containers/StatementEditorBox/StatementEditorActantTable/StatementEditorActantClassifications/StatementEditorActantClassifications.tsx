import { EntityClass } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import {
  IStatementActant,
  IStatementClassification,
} from "@shared/types/statement";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import AttributesEditor from "pages/MainPage/containers/AttributesEditor/AttributesEditor";
import React, { useState } from "react";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import {
  StyledCI,
  StyledCIGrid,
  StyledCIHeading,
  StyledTagWrapper,
} from "../StatementEditorActantTableStyles";

interface StatementEditorActantClassifications {
  classifications: IStatementClassification[];
  updateActant: (statementActantId: string, changes: any) => void;
  statement: IResponseStatement;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  sActant: IStatementActant;
}
export const StatementEditorActantClassifications: React.FC<
  StatementEditorActantClassifications
> = ({
  classifications,
  updateActant,
  sActant,
  statement,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  updateStatementDataMutation,
}) => {
  return (
    <>
      {classifications.length > 0 && (
        <StyledCI>
          <StyledCIHeading>Classifications:</StyledCIHeading>
          {classifications.map((classification, key) => {
            const entity = statement.entities[classification.entityId];
            const [classificationModalOpen, setClassificationModalOpen] =
              useState(false);
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
                            tooltip="unlink classification"
                            icon={<FaUnlink />}
                            color="plain"
                            inverted={true}
                            onClick={() => {
                              updateActant(sActant.id, {
                                classifications: classifications.map((c) =>
                                  c.id === classification.id
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
                    categoryTypes={[EntityClass.Concept]}
                    onSelected={(newSelectedId: string) => {
                      const newClassifications: IStatementClassification[] =
                        classifications.map((c) =>
                          c.id === classification.id
                            ? { ...c, entityId: newSelectedId }
                            : { ...c }
                        );
                      updateActant(sActant.id, {
                        classifications: newClassifications,
                      });
                    }}
                    openDetailOnCreate
                    isInsideTemplate={isInsideTemplate}
                  />
                )}
                <ButtonGroup style={{ marginLeft: "1rem" }}>
                  <AttributesEditor
                    modalOpen={classificationModalOpen}
                    setModalOpen={setClassificationModalOpen}
                    modalTitle={`Classification`}
                    entity={entity}
                    disabledAllAttributes={!userCanEdit}
                    userCanEdit={userCanEdit}
                    data={{
                      elvl: classification.elvl,
                      logic: classification.logic,
                      certainty: classification.certainty,
                      mood: classification.mood,
                      moodvariant: classification.moodvariant,
                    }}
                    handleUpdate={(newData) => {
                      updateActant(sActant.id, {
                        classifications: classifications.map((c) =>
                          c.id === classification.id
                            ? { ...c, ...newData }
                            : { ...c }
                        ),
                      });
                    }}
                    updateActantId={(newId: string) => {
                      updateActant(sActant.id, {
                        classifications: classifications.map((c) =>
                          c.id === classification.id
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
                      tooltip="remove classification row"
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
                      tooltip="Negative logic"
                      color="success"
                      inverted={true}
                      noBorder
                      icon={<AttributeIcon attributeName={"negation"} />}
                      onClick={() => setClassificationModalOpen(true)}
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
