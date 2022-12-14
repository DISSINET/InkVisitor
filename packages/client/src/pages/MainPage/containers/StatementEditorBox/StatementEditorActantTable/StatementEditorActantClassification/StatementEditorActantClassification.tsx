import { EntityEnums } from "@shared/enums";
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
  StyledCIGrid,
  StyledTagWrapper,
} from "../StatementEditorActantTableStyles";

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
export const StatementEditorActantClassification: React.FC<StatementEditorActantClassification> =
  ({
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
    const [classificationModalOpen, setClassificationModalOpen] =
      useState(false);

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
                      tooltipLabel="unlink classification"
                      icon={<FaUnlink />}
                      color="plain"
                      inverted
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
              categoryTypes={[EntityEnums.Class.Concept]}
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
              territoryActants={territoryActants}
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
                    c.id === classification.id ? { ...c, ...newData } : { ...c }
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
                color="success"
                inverted
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
                onClick={() => setClassificationModalOpen(true)}
              />
            )}
          </ButtonGroup>
        </StyledCIGrid>
      </>
    );
  };
