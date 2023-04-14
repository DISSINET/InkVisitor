import { IEntity, IProp } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
} from "components/advanced";
import React from "react";
import { PropAttributeFilter, classesPropType } from "types";
import { StyledNoEntity } from "../PropGroupStyles";

interface PropGroupRowType {
  prop: IProp;
  propTypeEntity?: IEntity;
  updateProp: (propId: string, changes: any) => void;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  territoryActants: string[];
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  openDetailOnCreate: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const PropGroupRowType: React.FC<PropGroupRowType> = ({
  propTypeEntity,
  prop,
  updateProp,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  territoryActants,
  isExpanded,
  disabledAttributes,
  openDetailOnCreate,
  setModalOpen,
}) => {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column" }}>
      <div>
        {propTypeEntity ? (
          <>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    entityId: newSelectedId,
                  },
                });
              }}
              categoryTypes={classesPropType}
              excludedEntities={excludedSuggesterEntities}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
              excludedActantIds={[propTypeEntity.id]}
            >
              <EntityTag
                entity={propTypeEntity}
                fullWidth
                tooltipPosition="right"
                unlinkButton={
                  userCanEdit && {
                    onClick: () => {
                      updateProp(prop.id, {
                        type: {
                          ...prop.type,
                          entityId: "",
                        },
                      });
                    },
                  }
                }
                elvlButtonGroup={
                  !disabledAttributes.type?.includes("elvl") && (
                    <ElvlButtonGroup
                      value={prop.type.elvl}
                      onChange={(elvl) =>
                        updateProp(prop.id, {
                          type: {
                            ...prop.type,
                            elvl: elvl,
                          },
                        })
                      }
                    />
                  )
                }
              />
            </EntityDropzone>
            <div style={{ display: "inline-flex", verticalAlign: "middle" }}>
              {prop.type.logic == "2" && (
                <Button
                  key="neg"
                  tooltipLabel="Negative logic"
                  color="danger"
                  inverted
                  noBorder
                  onClick={() => setModalOpen(true)}
                  icon={<AttributeIcon attributeName={"negation"} />}
                />
              )}
            </div>
          </>
        ) : userCanEdit ? (
          <EntitySuggester
            territoryActants={territoryActants}
            onSelected={(newSelectedId: string) => {
              updateProp(prop.id, {
                type: {
                  ...prop.type,
                  entityId: newSelectedId,
                },
              });
            }}
            placeholder="type"
            openDetailOnCreate={openDetailOnCreate}
            categoryTypes={classesPropType}
            inputWidth={80}
            excludedEntities={excludedSuggesterEntities}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        ) : (
          <StyledNoEntity>-</StyledNoEntity>
        )}
      </div>
      {isExpanded && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {!disabledAttributes.type?.includes("logic") && (
            <div>
              <LogicButtonGroup
                border
                value={prop.type.logic}
                onChange={(logic) =>
                  updateProp(prop.id, {
                    type: { ...prop.type, logic: logic },
                  })
                }
              />
            </div>
          )}
          {!disabledAttributes.type?.includes("virtuality") && (
            <div>{"virtuality "}</div>
          )}
          {!disabledAttributes.type?.includes("partitivity") && (
            <div>{"partitivity"}</div>
          )}
        </div>
      )}
    </div>
  );
};
