import { entitiesDict, entityStatusDict, languageDict } from "@inkvisitor/shared/dictionaries";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { EProtocolTieType, ITerritoryValidation } from "@inkvisitor/shared/types/territory";
import { Button, Input } from "components";
import Dropdown, { AttributeButtonGroup, EntitySuggester, EntityTag } from "components/advanced";
import { useOrderedLanguageDict } from "hooks/react-query";
import React, { useMemo } from "react";
import { IcoTrash } from "Theme/icons";
import {
  StyledBorderLeft,
  StyledValue,
  StyledGrid,
  StyledLabel,
  StyledLanguageList,
  StyledNotActiveTag,
} from "./ValidationRuleStyles";
import { ValidationText } from "./ValidationText/ValidationText";
import { LanguageTag } from "./LanguageTag";
import { getEntityStatusIcon } from "utils/iconUtils";

interface ValidationRule {
  validation: ITerritoryValidation;
  entities: Record<string, IEntity>;
  updateValidationRule: (changes: Partial<ITerritoryValidation>) => void;
  removeValidationRule: () => void;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  widthTooNarrow?: boolean;
  userCanEdit: boolean;
}
export const ValidationRule: React.FC<ValidationRule> = ({
  validation,
  entities,
  updateValidationRule,
  removeValidationRule,
  isInsideTemplate,
  territoryParentId,
  widthTooNarrow = false,
  userCanEdit,
}) => {
  const {
    detail,
    entityClasses,
    entityClassifications,
    entitySOEs,
    entityLanguages,
    entityStatuses,
    tieType,
    propType,
    allowedClasses,
    allowedEntities,
  } = validation;

  const orderedLanguageDict = useOrderedLanguageDict();

  const disabledEntityClassesSection = useMemo<boolean>(() => {
    return allowedEntities !== undefined && allowedEntities.length > 0;
  }, [allowedEntities]);

  const allowedEntitiesClasses = useMemo<EntityEnums.Class[]>(() => {
    if (tieType === EProtocolTieType.Classification) {
      return [EntityEnums.Class.Concept];
    }
    if (tieType === EProtocolTieType.Reference) {
      return [EntityEnums.Class.Resource];
    }
    return classesAll;
  }, [tieType]);

  const active: boolean = useMemo<boolean>(() => {
    return validation.active !== false;
  }, [validation.active]);

  const isAllowedEntitiesSuggesterVisible = useMemo<boolean>(() => {
    if (!allowedEntities) {
      return false;
    }
    return true;

    // if (tieType === EProtocolTieType.Reference) {
    //   return allowedEntities?.length !== 1;
    // } else {
    //   return true;
    // }
  }, [tieType, allowedEntities, userCanEdit]);

  return (
    <StyledBorderLeft $active={active}>
      <div
        style={{
          width: "100%",
          paddingTop: "0.2rem",
          paddingBottom: "1.5rem",
        }}
      >
        {!active && <StyledNotActiveTag>rule not activated</StyledNotActiveTag>}
        <ValidationText validation={validation} entities={entities} active={active} />
      </div>
      <StyledGrid>
        {/* Entity classes */}
        <StyledLabel>Entity types</StyledLabel>
        <Dropdown.Multi.Entity
          disableEmpty
          width="full"
          value={entityClasses ?? []}
          onChange={(values) => updateValidationRule({ entityClasses: values })}
          options={entitiesDict}
          disabled={!userCanEdit}
        />

        {/* Entity Classifications */}
        <StyledLabel>classified as</StyledLabel>
        <StyledValue>
          {entityClassifications?.map((classification, key) => (
            <EntityTag
              key={key}
              entity={entities[classification]}
              unlinkButton={
                userCanEdit && {
                  onClick: () =>
                    updateValidationRule({
                      entityClassifications: entityClassifications.filter(
                        (c) => c !== classification
                      ),
                    }),
                }
              }
            />
          ))}
          {!(!userCanEdit && entityClassifications && entityClassifications?.length > 0) && (
            <EntitySuggester
              inputWidth="full"
              alwaysShowCreateModal
              excludedActantIds={entityClassifications}
              categoryTypes={[EntityEnums.Class.Concept]}
              onPicked={(entity) =>
                updateValidationRule({
                  entityClassifications: [...(entityClassifications ?? []), entity.id],
                })
              }
              disabled={!userCanEdit || tieType === EProtocolTieType.Classification}
            />
          )}
        </StyledValue>

        {/* Entity SOE */}
        <StyledLabel>having superordinate entity</StyledLabel>
        <StyledValue>
          {entitySOEs?.map((soe, key) => (
            <EntityTag
              key={key}
              entity={entities[soe]}
              unlinkButton={
                userCanEdit && {
                  onClick: () =>
                    updateValidationRule({
                      entitySOEs: entitySOEs.filter((s) => s !== soe),
                    }),
                }
              }
            />
          ))}
          {!(!userCanEdit && entitySOEs && entitySOEs?.length > 0) && (
            <EntitySuggester
              inputWidth="full"
              alwaysShowCreateModal
              excludedActantIds={entitySOEs}
              reuseDroppedValue
              categoryTypes={[
                EntityEnums.Class.Location,
                EntityEnums.Class.Object,
                EntityEnums.Class.Event,
                EntityEnums.Class.Group,
                EntityEnums.Class.Statement,
                EntityEnums.Class.Value,
                EntityEnums.Class.Resource,
                EntityEnums.Class.Person,
                EntityEnums.Class.Being,
              ]}
              onPicked={(entity) =>
                updateValidationRule({
                  entitySOEs: [...(entitySOEs ?? []), entity.id],
                })
              }
              disabled={!userCanEdit}
            />
          )}
        </StyledValue>

        {/* Entity Languages */}
        <StyledLabel>having language</StyledLabel>
        <StyledValue>
          <StyledLanguageList>
            {entityLanguages?.map((language, key) => (
              <LanguageTag
                languageValue={language}
                languageTooltip={languageDict.find((lang) => lang.value === language)?.label}
                onUnlink={
                  userCanEdit
                    ? () => {
                        updateValidationRule({
                          entityLanguages: entityLanguages.filter((c) => c !== language),
                        });
                      }
                    : undefined
                }
              />
            ))}
          </StyledLanguageList>

          {!(!userCanEdit && entityLanguages) && (
            <Dropdown.Single.Basic
              disabled={!userCanEdit}
              placeholder="Add new rule language"
              width={200}
              options={orderedLanguageDict.filter(
                (language) => !entityLanguages || !entityLanguages.includes(language.value)
              )}
              value={null}
              onChange={(selectedOption) => {
                const newLanguageList = [...(entityLanguages ?? [])];
                const newLanguage = selectedOption as EntityEnums.Language;

                updateValidationRule({
                  entityLanguages: newLanguageList.includes(newLanguage)
                    ? newLanguageList.filter((language) => language !== newLanguage)
                    : [...newLanguageList, newLanguage],
                });
              }}
            />
          )}
        </StyledValue>

        {/* Entity Statuses */}
        <StyledLabel>having status</StyledLabel>
        <div>
          <AttributeButtonGroup
            noMargin
            iconsOnly={widthTooNarrow}
            disabled={!userCanEdit}
            canSelectMultiple={true}
            options={entityStatusDict.map((entityStatusOption) => {
              const icon = getEntityStatusIcon(entityStatusOption["value"]);
              return {
                longValue: entityStatusOption["label"],
                shortValue: entityStatusOption["label"],
                icon: widthTooNarrow ? icon : undefined,
                onClick: () => {
                  let newStatus: EntityEnums.Status[] = [...(entityStatuses ?? [])];
                  const statusValue = entityStatusOption["value"] as EntityEnums.Status;

                  console.log("statusValue", statusValue);

                  if (entityStatuses && entityStatuses.length > 0) {
                    // remove if already in the list
                    if (entityStatuses.includes(statusValue)) {
                      newStatus = entityStatuses.filter((status) => status !== statusValue);
                    } else {
                      newStatus.push(statusValue);
                    }
                  } else {
                    newStatus.push(statusValue);
                  }

                  updateValidationRule({ entityStatuses: newStatus });
                },
                selected:
                  entityStatuses && entityStatuses.length
                    ? entityStatuses.includes(entityStatusOption["value"] as EntityEnums.Status)
                    : true,
              };
            })}
          />
        </div>

        {/* Tie type */}
        <StyledLabel>Tie type</StyledLabel>
        <AttributeButtonGroup
          disabled={!userCanEdit}
          noMargin
          options={[
            {
              longValue: EProtocolTieType.Property,
              shortValue: EProtocolTieType.Property,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Property,
                  propType: [],
                  allowedClasses: [],
                  allowedEntities: [],
                }),
              selected: tieType === EProtocolTieType.Property,
            },
            {
              longValue: EProtocolTieType.Classification,
              shortValue: EProtocolTieType.Classification,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Classification,
                  propType: [],
                  allowedClasses: [],
                  allowedEntities: [],
                }),
              selected: tieType === EProtocolTieType.Classification,
              optionDisabled: entityClassifications && entityClassifications.length > 0,
            },
            {
              longValue: EProtocolTieType.Reference,
              shortValue: EProtocolTieType.Reference,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Reference,
                  propType: [],
                  allowedClasses: [],
                  allowedEntities: [],
                }),
              selected: tieType === EProtocolTieType.Reference,
            },
          ]}
        />

        {/* Prop type */}
        {tieType === EProtocolTieType.Property && (
          <>
            <StyledLabel>Prop type</StyledLabel>
            <StyledValue>
              {propType?.map((entityId, key) => (
                <EntityTag
                  key={key}
                  entity={entities[entityId]}
                  unlinkButton={
                    userCanEdit && {
                      onClick: () =>
                        updateValidationRule({
                          propType: propType?.filter((pTiD) => pTiD !== entityId),
                        }),
                    }
                  }
                />
              ))}
              {!(!userCanEdit && propType && propType.length > 0) && (
                <EntitySuggester
                  inputWidth="full"
                  alwaysShowCreateModal
                  categoryTypes={[EntityEnums.Class.Concept]}
                  excludedActantIds={propType}
                  onPicked={(entity) =>
                    updateValidationRule({
                      propType: [...(propType || []), entity.id],
                    })
                  }
                  disabled={!userCanEdit}
                />
              )}
            </StyledValue>
          </>
        )}

        {/* Allowed classes */}
        {tieType === EProtocolTieType.Property && (
          <>
            <StyledLabel>Entity types allowed in property value</StyledLabel>
            <Dropdown.Multi.Entity
              disableEmpty
              width="full"
              value={allowedClasses || []}
              onChange={(values) => updateValidationRule({ allowedClasses: values })}
              options={entitiesDict}
              disabled={disabledEntityClassesSection || !userCanEdit}
            />
          </>
        )}

        {/* Allowed entities */}
        <StyledLabel>
          {tieType === EProtocolTieType.Classification && "Allowed Concepts"}
          {tieType === EProtocolTieType.Reference && "Allowed Resources"}
          {tieType === EProtocolTieType.Property && "Entities allowed in property value"}
        </StyledLabel>
        <StyledValue>
          {allowedEntities?.map((entityId, key) => (
            <EntityTag
              key={key}
              entity={entities[entityId]}
              unlinkButton={
                userCanEdit && {
                  onClick: () =>
                    updateValidationRule({
                      allowedEntities: allowedEntities.filter((aE) => aE !== entityId),
                    }),
                }
              }
            />
          ))}

          {isAllowedEntitiesSuggesterVisible && (
            <EntitySuggester
              inputWidth="full"
              alwaysShowCreateModal
              categoryTypes={allowedEntitiesClasses}
              excludedActantIds={allowedEntities}
              reuseDroppedValue
              onPicked={(entity) => {
                updateValidationRule({
                  allowedEntities: [...(allowedEntities ?? []), entity.id],
                  allowedClasses: [],
                });
              }}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
              disabled={!userCanEdit}
            />
          )}
        </StyledValue>

        {/* Detail */}
        <StyledLabel>Detail / Notes</StyledLabel>
        <Input
          width="full"
          value={detail}
          onChangeFn={(value) => updateValidationRule({ detail: value })}
          disabled={!userCanEdit}
        />
      </StyledGrid>
      {userCanEdit && (
        <div
          style={{
            paddingTop: "1.5rem",
            paddingBottom: ".5rem",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <Button
            color={active ? "greyer" : "primary"}
            onClick={() => updateValidationRule({ active: !active })}
            inverted
            label={active ? "deactivate rule" : "activate rule"}
          />
          <Button
            color="danger"
            icon={<IcoTrash />}
            onClick={removeValidationRule}
            inverted
            label="remove validation rule"
          />
        </div>
      )}
    </StyledBorderLeft>
  );
};
