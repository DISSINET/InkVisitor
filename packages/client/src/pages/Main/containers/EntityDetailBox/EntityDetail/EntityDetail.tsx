import { entitiesDictKeys } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IReference, IResponseDetail, Relation } from "@inkvisitor/shared/types";
import { EProtocolTieType, ITerritoryValidation } from "@inkvisitor/shared/types/territory";
import { IWarningPositionSection } from "@inkvisitor/shared/types/warning";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, CustomScrollbar, Loader, Message, Submit, ToastWithLink } from "components";
import { ApplyTemplateModal, AuditTable, EntityTag, JSONExplorer } from "components/advanced";
import { CMetaProp, DProps } from "constructors";
import { useSearchParams } from "hooks";
import { useTemplatesQuery } from "hooks/react-query";
import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
import { DraggedPropRowCategory } from "types";
import { DropdownItem } from "@inkvisitor/shared/types";
import { getEntityLabel, getEntityRelationRules, getShortLabelByLetterCount } from "utils/utils";
import {
  ENTITY_DETAIL_SCROLLBAR_ID,
  ENTITY_DETAIL_SCROLL_CONTAINER_ID,
  handleDeleteEntityError,
  usedInSectionId,
} from "utils/deleteEntityConflict";
import { openRestoredEntity } from "utils/openRestoredEntity";
import { EntityReferenceTable } from "../../EntityReferenceTable/EntityReferenceTable";
import { PropGroup } from "../../PropGroup/PropGroup";
import { EntityDetailCreateTemplateModal } from "./EntityDetailCreateTemplateModal/EntityDetailCreateTemplateModal";
import { EntityDetailExpandIcon } from "./EntityDetailExpandIcon/EntityDetailExpandIcon";
import { EntityDetailFormSection } from "./EntityDetailFormSection/EntityDetailFormSection";
import { EntityDetailHeaderRow } from "./EntityDetailHeaderRow/EntityDetailHeaderRow";
import { EntityDetailProtocol } from "./EntityDetailProtocol/EntityDetailProtocol";
import { EntityDetailRelations } from "./EntityDetailRelations/EntityDetailRelations";
import { EntityDetailSectionButtons } from "./EntityDetailSectionButtons/EntityDetailSectionButtons";
import {
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionEntityList,
  StyledDetailSectionHeader,
  StyledDetailSectionHeading,
  StyledDetailWarnings,
  StyledDetailWrapper,
  StyledPropGroupWrap,
  StyledUsedAsHeading,
  StyledUsedAsTitle,
} from "./EntityDetailStyles";
import { EntityDetailClassificationTable } from "./EntityDetailUsedInTable/EntityDetailClassificationTable/EntityDetailClassificationTable";
import { EntityDetailIdentificationTable } from "./EntityDetailUsedInTable/EntityDetailIdentificationTable/EntityDetailIdentificationTable";
import { EntityDetailMetaPropsTable } from "./EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "./EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "./EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";
import { EntityDetailUsedInDocumentsTable } from "./EntityDetailUsedInTable/EntityDetailUsedInDocumentsTable/EntityDetailUsedInDocumentsTable";
import { EntityDetailValency } from "./EntityDetailValency/EntityDetailValency";
import { EntityDetailValidationSection } from "./EntityDetailValidationSection/EntityDetailValidationSection";

const allowedEntityChangeClasses = [
  EntityEnums.Class.Value,
  EntityEnums.Class.Person,
  EntityEnums.Class.Being,
  EntityEnums.Class.Event,
  EntityEnums.Class.Group,
  EntityEnums.Class.Location,
  EntityEnums.Class.Object,
];
const initValidation: ITerritoryValidation = {
  detail: "",
  entityClasses: [],
  entityClassifications: [],
  entityLanguages: [],
  entityStatuses: [],
  entitySOEs: [],
  allowedEntities: [],
  allowedClasses: [],
  propType: [],
  tieType: EProtocolTieType.Property,
};

enum EntityDetailSection {
  Protocol = "protocol",
  Validation = "validation",
  Valency = "valency",
  Relations = "relations",
  Metaproperties = "metaproperties",
  References = "references",
  UsedIn = "usedIn",
  Audits = "audits",
  Json = "json",
}

interface EntityDetail {
  detailId: string;
  entity: IResponseDetail;
  error: Error | null;
  isFetching: boolean;
}
export const EntityDetail: React.FC<EntityDetail> = ({ detailId, entity, error, isFetching }) => {
  const {
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
    removeDetailId,
    setSelectedDetailId,
    appendDetailId,
    detailIdArray,
    selectedDetailId,
  } = useSearchParams();

  useEffect(() => {
    if (error && (error as any).message === "unknown class for entity") {
      removeDetailId(detailId);
    }
  }, [error]);

  const isIncompleteEntityDetail =
    !!entity && (entity.relations === undefined || entity.entities === undefined);

  useEffect(() => {
    if (!isIncompleteEntityDetail) return;
    toast.error(
      "Entity detail could not be loaded: the same query key was used for a different API response. Please contact support.",
      { toastId: `incomplete-entity-detail-${detailId}` }
    );
  }, [isIncompleteEntityDetail, detailId]);

  const [selectedEntityType, setSelectedEntityType] = useState<EntityEnums.Class>();
  const [createTemplateModal, setCreateTemplateModal] = useState<boolean>(false);
  const [isCleaningEntityPrompt, setIsCleaningEntityPrompt] = useState<boolean>(false);
  const [showRemoveSubmit, setShowRemoveSubmit] = useState<boolean>(false);
  const [showTypeSubmit, setShowTypeSubmit] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState<boolean>(false);
  const [templateToApply, setTemplateToApply] = useState<IEntity | false>(false);

  const selectedEntityTypeLabel: string = useMemo(() => {
    return selectedEntityType ? entitiesDictKeys[selectedEntityType].label : "";
  }, [selectedEntityType]);

  const handleAskForTemplateApply = (templateIdToApply: string) => {
    if (templates) {
      const templateThatIsGoingToBeApplied = templates.find(
        (template: IEntity) => template.id === templateIdToApply
      );

      if (templateThatIsGoingToBeApplied) {
        setTemplateToApply(templateThatIsGoingToBeApplied);
        setShowApplyTemplateModal(true);
      }
    }
  };

  const queryClient = useQueryClient();

  const isClassChangeable = entity && allowedEntityChangeClasses.includes(entity.class);

  const {
    data: allTemplates,
    isStale: templatesStale,
    refetch: refetchTemplates,
  } = useTemplatesQuery();

  const templates = useMemo(
    () => allTemplates?.filter((template: IEntity) => template.class === entity?.class),
    [allTemplates, entity?.class]
  );

  // refresh the template list when the user opens the dropdown, but only once
  // the 5min staleTime has elapsed - avoids refetching on every open
  const handleTemplateDropdownFocus = () => {
    if (templatesStale) {
      refetchTemplates();
    }
  };

  const templateOptions = useMemo<DropdownItem[]>(() => {
    const options =
      entity !== undefined && templates
        ? templates
            .filter((template: IEntity) => template.id !== entity.id)
            .map((template: IEntity) => ({
              value: template.id,
              label: getShortLabelByLetterCount(getEntityLabel(template), 200),
            }))
        : [];

    return options;
  }, [templates, entity]);

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery({
    queryKey: ["audit", detailId],
    queryFn: async () => {
      const res = await api.auditGet(detailId);
      return res.data;
    },
    enabled: !!detailId && api.isLoggedIn(),
  });

  // refetch audit when statement changes
  useEffect(() => {
    if (entity !== undefined) {
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    }
  }, [entity]);

  useEffect(() => {
    if (entity !== undefined) {
      setSelectedEntityType(entity.class);
    }
  }, []);

  const userCanAdmin: boolean = useMemo(() => {
    return !!entity && entity.right === UserEnums.RoleMode.Admin;
  }, [entity]);

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!entity &&
      (entity.right === UserEnums.RoleMode.Admin || entity.right === UserEnums.RoleMode.Write)
    );
  }, [entity]);

  const {
    status: statusStatement,
    data: statement,
    error: statementError,
    isFetching: isFetchingStatement,
  } = useQuery({
    queryKey: ["statement", statementId],
    queryFn: async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    enabled: !!statementId && api.isLoggedIn(),
  });

  const updateEntityMutation = useMutation({
    mutationFn: async (changes: Partial<IEntity>) => await api.entityUpdate(detailId, changes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);

      if (
        statementId &&
        (statementId === entity?.id ||
          (statement?.entities && entity && Object.keys(statement.entities).includes(entity.id)))
      ) {
        queryClient.invalidateQueries({ queryKey: ["statement"] });
      }

      if (
        variables.references !== undefined ||
        variables.detail !== undefined ||
        variables.labels !== undefined ||
        variables.status ||
        variables.language !== undefined ||
        variables.data?.logicalType
      ) {
        queryClient.invalidateQueries({ queryKey: ["suggestion"] });
        if (entity?.class === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries({ queryKey: ["tree"] });
        }

        queryClient.invalidateQueries({ queryKey: ["territory"] });
        queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      }
      if (variables.labels !== undefined) {
        queryClient.invalidateQueries({ queryKey: ["detail-tab-entities"] });
      }
      if (entity?.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      }
    },
  });

  const changeEntityTypeMutation = useMutation({
    mutationFn: async (newClass: EntityEnums.Class) =>
      await api.entityUpdate(detailId, { class: newClass }),

    onSuccess: (data, variables) => {
      setShowTypeSubmit(false);
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      if (variables === EntityEnums.Class.Territory) {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
      }
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      if (entity?.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      }
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: (entityId: string) => api.entityDelete(entityId),
    onSuccess: async (data, entityId) => {
      toast.info(
        <ToastWithLink
          children={`Entity removed!`}
          linkText={"Restore"}
          onLinkClick={async () => {
            const response = await api.entityRestore(entityId);
            toast.info("Entity restored");
            openRestoredEntity(response.data.data as IEntity, {
              setTerritoryId,
              setStatementId,
              appendDetailId,
            });
            queryClient.invalidateQueries({ queryKey: ["entity"] });
            queryClient.invalidateQueries({ queryKey: ["statement"] });
            if (entity?.class === EntityEnums.Class.Territory) {
              queryClient.invalidateQueries({ queryKey: ["tree"] });
            }
            queryClient.invalidateQueries({ queryKey: ["territory"] });
            queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
            if (entity?.isTemplate) {
              queryClient.invalidateQueries({ queryKey: ["templates"] });
            }
          }}
        />,
        {
          autoClose: 5000,
        }
      );

      // hide selected territory if T removed
      if (entity && entity.class == EntityEnums.Class.Territory && entity.id === territoryId) {
        setTerritoryId("");
      } else {
        queryClient.invalidateQueries({ queryKey: ["territory"] });
      }

      // hide editor box if the removed entity was also opened in the editor
      if (entity && entity.class == EntityEnums.Class.Statement && entity.id === statementId) {
        setStatementId("");
      } else {
        queryClient.invalidateQueries({ queryKey: ["statement"] });
      }

      queryClient.invalidateQueries({ queryKey: ["tree"] });

      removeDetailId(entityId);
    },
    onError: (error, entityId) => {
      handleDeleteEntityError(error, entityId, appendDetailId);
    },
  });

  const handleCleanEntityDetails = () => {
    // remove all props and references
    updateEntityMutation.mutate({ props: [], references: [] });

    // remove all relations
    const relationTypes = getEntityRelationRules(
      entity.class,
      RelationEnums.EntityDetailTypes,
      entity.isTemplate
    );
    relationTypes.forEach((relationType: RelationEnums.Type) => {
      entity.relations[relationType as keyof Relation.IUsedRelations]?.connections.forEach(
        (connection: Relation.IConnection<Relation.IRelation>) => {
          relationDeleteMutation.mutate(connection.id);
        }
      );
    });

    setIsCleaningEntityPrompt(false);
  };

  // Props handling

  // adding only second or third level
  // function adding the first level prop is in the button
  const addMetaProp = (originId: string) => {
    if (entity !== undefined) {
      const newProp = CMetaProp();
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === originId) {
          newProps[pi1].children = [...newProps[pi1].children, newProp];
        }

        // 3rd level
        newProps[pi1].children.forEach((prop2, pi2) => {
          if (prop2.id == originId) {
            newProps[pi1].children[pi2].children = [
              ...newProps[pi1].children[pi2].children,
              newProp,
            ];
          }
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const updateProp = (propId: string, changes: Partial<IProp>) => {
    if (entity !== undefined) {
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        // 1st level
        if (prop1.id === propId) {
          newProps[pi1] = { ...newProps[pi1], ...changes };
        }

        // 2nd level
        prop1.children.forEach((prop2, pi2) => {
          if (prop2.id === propId) {
            newProps[pi1].children[pi2] = {
              ...newProps[pi1].children[pi2],
              ...changes,
            };
          }

          // 3rd level
          prop1.children[pi2].children.forEach((prop3, pi3) => {
            if (prop3.id === propId) {
              newProps[pi1].children[pi2].children[pi3] = {
                ...newProps[pi1].children[pi2].children[pi3],
                ...changes,
              };
            }
          });
        });
      });
      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const removeProp = (propId: string) => {
    if (entity !== undefined) {
      const newProps = [...entity.props].filter((prop, pi) => prop.id !== propId);

      // 2nd level
      newProps.forEach((prop1, pi1) => {
        newProps[pi1].children = prop1.children.filter((child) => child.id !== propId);

        // 3rd level
        newProps[pi1].children.forEach((prop2, pi2) => {
          newProps[pi1].children[pi2].children = newProps[pi1].children[pi2].children.filter(
            (child) => child.id !== propId
          );
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const changeOrder = (propId: string, props: IProp[], oldIndex: number, newIndex: number) => {
    for (let prop of props) {
      if (prop.id === propId) {
        props.splice(newIndex, 0, props.splice(oldIndex, 1)[0]);
        return props;
      }
      for (let prop1 of prop.children) {
        if (prop1.id === propId) {
          prop.children.splice(newIndex, 0, prop.children.splice(oldIndex, 1)[0]);
          return props;
        }
        for (let prop2 of prop1.children) {
          if (prop2.id === propId) {
            prop1.children.splice(newIndex, 0, prop1.children.splice(oldIndex, 1)[0]);
            return props;
          }
        }
      }
    }
    return props;
  };

  const movePropToIndex = (propId: string, oldIndex: number, newIndex: number) => {
    if (entity !== undefined) {
      const newProps = [...entity.props];
      changeOrder(propId, newProps, oldIndex, newIndex);
      updateEntityMutation.mutate({ props: newProps });
    }
  };

  useEffect(() => {
    if (error && (error as any).error === "EntityDoesNotExist") {
      removeDetailId(detailId);
      if (detailIdArray.length) {
        setSelectedDetailId(detailIdArray[0]);
      }
    }
  }, [error]);

  const mayBeRemoved = useMemo(() => {
    return entity && entity.usedInStatements && entity.usedInStatements.length === 0;
  }, [entity]);

  const actantMode = useMemo(() => {
    const actantClass = entity?.class;
    if (actantClass) {
      if (actantClass === EntityEnums.Class.Action) {
        return "action";
      } else if (actantClass === EntityEnums.Class.Territory) {
        return "territory";
      } else if (actantClass === EntityEnums.Class.Resource) {
        return "resource";
      } else if (actantClass === EntityEnums.Class.Concept) {
        return "concept";
      }
    }
    return "entity";
  }, [entity]);

  const isTerritoryWithParent = (entity: IResponseDetail): boolean => {
    return (
      entity.class === EntityEnums.Class.Territory &&
      entity.data?.parent &&
      !!entity.entities &&
      Object.keys(entity.entities).includes(entity.data.parent.territoryId)
    );
  };

  const isStatementWithTerritory = (entity: IResponseDetail): boolean => {
    return (
      entity.class === EntityEnums.Class.Statement &&
      entity.data?.territory &&
      !!entity.entities &&
      Object.keys(entity.entities).includes(entity.data.territory.territoryId)
    );
  };

  const getTerritoryId = (entity: IResponseDetail) => {
    if (isTerritoryWithParent(entity)) {
      return entity.entities[entity.data.parent.territoryId]?.id;
    } else if (isStatementWithTerritory(entity)) {
      return entity.entities[entity.data.territory.territoryId]?.id;
    } else {
      return undefined;
    }
  };

  const relationCreateMutation = useMutation({
    mutationFn: async (newRelation: Relation.IRelation) => await api.relationCreate(newRelation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const relationUpdateMutation = useMutation({
    mutationFn: async (relationObject: {
      relationId: string;
      changes: Partial<Relation.IRelation>;
    }) => await api.relationUpdate(relationObject.relationId, relationObject.changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });
  const relationDeleteMutation = useMutation({
    mutationFn: async (relationId: string) => await api.relationDelete(relationId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const isInsideTemplate = entity?.isTemplate || false;

  const [showBatchRemovePropSubmit, setShowBatchRemovePropSubmit] = useState(false);
  const [loadingValidations, setLoadingValidations] = useState(false);

  // Single state to manage collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<EntityDetailSection>>(
    new Set([EntityDetailSection.Protocol, EntityDetailSection.Validation])
  );

  const toggleSection = (sectionId: EntityDetailSection) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionExpanded = (sectionId: EntityDetailSection) => !collapsedSections.has(sectionId);

  const contentWidth = useAppSelector((state) => state.layout.mainPage.secondPanelRealWidth);
  const widthTooNarrow = contentWidth < 516;

  const isRootTerritory = selectedDetailId === rootTerritoryId;
  const isOwner = (localStorage.getItem("userrole") as UserEnums.Role) === UserEnums.Role.Owner;
  const disableAttributesForNonOwnersInRoot = isRootTerritory && !isOwner;
  const canEditEntity = userCanEdit && !disableAttributesForNonOwnersInRoot;

  if (isIncompleteEntityDetail) {
    return null;
  }

  return (
    <>
      {entity && (
        <CustomScrollbar
          scrollerId={ENTITY_DETAIL_SCROLLBAR_ID}
          elementId={ENTITY_DETAIL_SCROLL_CONTAINER_ID}
          customStyle={{
            // necessary to scroll until the bottom of the page
            height: "calc(100% - 2.5rem)",
          }}
        >
          <>
            <EntityDetailHeaderRow
              entity={entity}
              userCanEdit={canEditEntity}
              userCanAdmin={userCanAdmin}
              mayBeRemoved={mayBeRemoved}
              setShowRemoveSubmit={setShowRemoveSubmit}
              setCreateTemplateModal={setCreateTemplateModal}
              setIsCleaningEntityPrompt={setIsCleaningEntityPrompt}
              widthTooNarrow={widthTooNarrow}
              hasWarnings={entity.warnings && entity.warnings.length > 0}
            />

            <StyledDetailWrapper>
              {/* form section */}
              <StyledDetailSection $firstSection>
                <StyledDetailSectionContent $firstSection>
                  {entity.warnings && entity.warnings.length > 0 && (
                    <StyledDetailWarnings $paddingLeft={!widthTooNarrow}>
                      {entity.warnings
                        .filter((w) => w.position?.section === IWarningPositionSection.Entity)
                        .map((warning, key) => {
                          return <Message key={key} warning={warning} />;
                        })}
                    </StyledDetailWarnings>
                  )}

                  <EntityDetailFormSection
                    entity={entity}
                    userCanEdit={canEditEntity}
                    userCanAdmin={userCanAdmin}
                    actantMode={actantMode}
                    isStatementWithTerritory={isStatementWithTerritory}
                    isClassChangeable={isClassChangeable || false}
                    isTerritoryWithParent={isTerritoryWithParent}
                    allowedEntityChangeClasses={allowedEntityChangeClasses}
                    handleAskForTemplateApply={handleAskForTemplateApply}
                    onTemplateDropdownFocus={handleTemplateDropdownFocus}
                    setSelectedEntityType={setSelectedEntityType}
                    setShowTypeSubmit={setShowTypeSubmit}
                    templateOptions={templateOptions}
                    updateEntityMutation={updateEntityMutation}
                    widthTooNarrow={widthTooNarrow}
                  />
                </StyledDetailSectionContent>
              </StyledDetailSection>

              {/* Protocol */}
              {entity.class === EntityEnums.Class.Territory && (
                <StyledDetailSection>
                  <StyledDetailSectionHeader
                    onClick={() => toggleSection(EntityDetailSection.Protocol)}
                  >
                    <EntityDetailExpandIcon
                      isExpanded={isSectionExpanded(EntityDetailSection.Protocol)}
                    />
                    <StyledDetailSectionHeading>Protocol</StyledDetailSectionHeading>
                  </StyledDetailSectionHeader>
                  {isSectionExpanded(EntityDetailSection.Protocol) && (
                    <StyledDetailSectionContent>
                      <EntityDetailProtocol
                        territory={entity}
                        updateEntityMutation={updateEntityMutation}
                        isInsideTemplate={isInsideTemplate}
                        userCanEdit={canEditEntity}
                      />
                    </StyledDetailSectionContent>
                  )}
                </StyledDetailSection>
              )}

              {/* Validation rules */}
              {entity.class === EntityEnums.Class.Territory && (
                <StyledDetailSection>
                  <EntityDetailValidationSection
                    isValidationExpanded={isSectionExpanded(EntityDetailSection.Validation)}
                    setIsValidationExpanded={() => toggleSection(EntityDetailSection.Validation)}
                    validations={entity.data.validations as ITerritoryValidation[] | undefined}
                    entities={entity.entities}
                    updateEntityMutation={updateEntityMutation}
                    userCanEdit={canEditEntity}
                    isInsideTemplate={isInsideTemplate}
                    territoryParentId={getTerritoryId(entity)}
                    entity={entity}
                    setLoadingValidations={setLoadingValidations}
                    widthTooNarrow={widthTooNarrow}
                  />
                </StyledDetailSection>
              )}

              {/* Valency (A) */}
              {entity.class === EntityEnums.Class.Action && (
                <StyledDetailSection>
                  <StyledDetailSectionHeader
                    onClick={() => toggleSection(EntityDetailSection.Valency)}
                  >
                    <EntityDetailExpandIcon
                      isExpanded={isSectionExpanded(EntityDetailSection.Valency)}
                    />
                    <StyledDetailSectionHeading>Valency</StyledDetailSectionHeading>
                  </StyledDetailSectionHeader>
                  {isSectionExpanded(EntityDetailSection.Valency) && (
                    <>
                      <StyledDetailWarnings>
                        {entity.warnings &&
                          entity.warnings
                            .filter(
                              (w) => w.position?.section === IWarningPositionSection.Valencies
                            )
                            .map((warning, key) => {
                              return <Message key={key} warning={warning} />;
                            })}
                      </StyledDetailWarnings>
                      <StyledDetailSectionContent>
                        <EntityDetailValency
                          entity={entity}
                          userCanEdit={canEditEntity}
                          updateEntityMutation={updateEntityMutation}
                          relationCreateMutation={relationCreateMutation}
                          relationUpdateMutation={relationUpdateMutation}
                          relationDeleteMutation={relationDeleteMutation}
                        />
                      </StyledDetailSectionContent>
                    </>
                  )}
                </StyledDetailSection>
              )}

              {/* Relations */}
              <StyledDetailSection>
                <StyledDetailSectionHeader
                  onClick={() => toggleSection(EntityDetailSection.Relations)}
                >
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.Relations)}
                  />
                  <StyledDetailSectionHeading>Relations</StyledDetailSectionHeading>
                </StyledDetailSectionHeader>
                {isSectionExpanded(EntityDetailSection.Relations) && (
                  <>
                    {entity.warnings && entity.warnings.length > 0 && (
                      <StyledDetailWarnings>
                        {entity.warnings
                          .filter((w) => w.position?.section === IWarningPositionSection.Relations)
                          .map((warning, key) => {
                            return <Message key={key} warning={warning} />;
                          })}
                      </StyledDetailWarnings>
                    )}
                    <StyledDetailSectionContent>
                      <EntityDetailRelations
                        entity={entity}
                        relationCreateMutation={relationCreateMutation}
                        relationUpdateMutation={relationUpdateMutation}
                        relationDeleteMutation={relationDeleteMutation}
                        userCanEdit={canEditEntity}
                      />
                    </StyledDetailSectionContent>
                  </>
                )}
              </StyledDetailSection>

              {/* metaprops section */}
              <StyledDetailSection $metaSection>
                <StyledDetailSectionHeader
                  onClick={() => toggleSection(EntityDetailSection.Metaproperties)}
                >
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.Metaproperties)}
                  />
                  <StyledDetailSectionHeading>Metaproperties</StyledDetailSectionHeading>
                  {canEditEntity && isSectionExpanded(EntityDetailSection.Metaproperties) && (
                    <EntityDetailSectionButtons
                      entityId={entity.id}
                      setShowSubmit={setShowBatchRemovePropSubmit}
                      removeBtnTooltip="remove all metaproperties from entity"
                      removeBtnDisabled={!entity.props.length}
                      handleCopyFromEntity={(pickedEntity, replace) => {
                        if (pickedEntity.props.length === 0) {
                          toast.info("no metaprops");
                        } else {
                          if (replace) {
                            updateEntityMutation.mutate({
                              props: DProps(pickedEntity.props),
                            });
                          } else {
                            updateEntityMutation.mutate({
                              props: [...entity.props, ...DProps(pickedEntity.props)],
                            });
                          }
                        }
                      }}
                    />
                  )}
                </StyledDetailSectionHeader>

                {isSectionExpanded(EntityDetailSection.Metaproperties) && (
                  <StyledDetailSectionContent>
                    <StyledPropGroupWrap>
                      <PropGroup
                        boxEntity={entity}
                        originId={entity.id}
                        entities={entity.entities}
                        props={entity.props}
                        territoryId={territoryId}
                        updateProp={updateProp}
                        removeProp={removeProp}
                        addProp={addMetaProp}
                        addPropWithEntityId={(variables: {
                          typeEntityId?: string;
                          valueEntityId?: string;
                        }) => {
                          const newProp = CMetaProp(variables);
                          updateEntityMutation.mutate({
                            props: [...entity.props, newProp],
                          });
                        }}
                        userCanEdit={canEditEntity}
                        movePropToIndex={(propId, oldIndex, newIndex) => {
                          movePropToIndex(propId, oldIndex, newIndex);
                        }}
                        category={DraggedPropRowCategory.META_PROP}
                        // disabledAttributes={
                        //   {
                        //     statement: ["moodvariant", "mood", "bundleOperator"],
                        //     type: ["logic", "virtuality", "partitivity"],
                        //     value: ["logic", "virtuality", "partitivity"],
                        //   } as PropAttributeFilter
                        // }
                        isInsideTemplate={isInsideTemplate}
                        territoryParentId={getTerritoryId(entity)}
                        lowIdent
                        alwaysShowCreateModal
                      />
                    </StyledPropGroupWrap>
                    {canEditEntity && (
                      <Button
                        color="primary"
                        label="new metaproperty"
                        icon={<FaPlus />}
                        onClick={() => {
                          const newProp = CMetaProp();
                          updateEntityMutation.mutate({
                            props: [...entity.props, newProp],
                          });
                        }}
                      />
                    )}
                  </StyledDetailSectionContent>
                )}
              </StyledDetailSection>

              {/* reference section */}
              <StyledDetailSection>
                <StyledDetailSectionHeader
                  onClick={() => toggleSection(EntityDetailSection.References)}
                >
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.References)}
                  />
                  <StyledDetailSectionHeading>References</StyledDetailSectionHeading>
                </StyledDetailSectionHeader>
                {isSectionExpanded(EntityDetailSection.References) && (
                  <StyledDetailSectionContent>
                    <EntityReferenceTable
                      disabled={!canEditEntity}
                      references={entity.references ?? []}
                      entities={entity.entities}
                      entityId={entity.id}
                      onChange={(newValues: IReference[]) => {
                        updateEntityMutation.mutate({ references: newValues });
                      }}
                      isInsideTemplate={isInsideTemplate}
                      userCanEdit={canEditEntity}
                      alwaysShowCreateModal
                    />
                  </StyledDetailSectionContent>
                )}
              </StyledDetailSection>

              <StyledDetailSection id={usedInSectionId(entity.id)}>
                <StyledDetailSectionHeader
                  onClick={() => toggleSection(EntityDetailSection.UsedIn)}
                >
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.UsedIn)}
                  />
                  <StyledDetailSectionHeading>Used in:</StyledDetailSectionHeading>
                </StyledDetailSectionHeader>

                {isSectionExpanded(EntityDetailSection.UsedIn) && (
                  <StyledDetailSectionContent>
                    {/* used as template */}
                    {!!entity.isTemplate && entity.usedAsTemplate && (
                      <>
                        <StyledUsedAsHeading>
                          <StyledUsedAsTitle>
                            <b>{entity.usedAsTemplate.length}</b> As a template
                          </StyledUsedAsTitle>
                        </StyledUsedAsHeading>
                        <StyledDetailSectionEntityList>
                          {entity.usedAsTemplate.map((entityId) => (
                            <React.Fragment key={entityId}>
                              <div style={{ display: "inline-grid" }}>
                                <EntityTag entity={entity.entities[entityId]} fullWidth />
                              </div>
                            </React.Fragment>
                          ))}
                        </StyledDetailSectionEntityList>
                      </>
                    )}

                    {/* usedIn props */}
                    {!entity.isTemplate && (
                      <EntityDetailMetaPropsTable
                        title={{
                          singular: "Metaproperty",
                          plural: "Metaproperties",
                        }}
                        entities={entity.entities}
                        useCases={entity.usedInMetaProps}
                        key="MetaProp"
                        perPage={10}
                      />
                    )}

                    {/* usedIn statements */}
                    {!entity.isTemplate && (
                      <EntityDetailStatementsTable
                        title={{ singular: "Statement", plural: "Statements" }}
                        entities={entity.entities}
                        useCases={entity.usedInStatements}
                        key="Statement"
                        perPage={10}
                      />
                    )}

                    {/* usedIn statement props */}
                    {!entity.isTemplate && (
                      <EntityDetailStatementPropsTable
                        title={{
                          singular: "In-statement Property",
                          plural: "In-statement Properties",
                        }}
                        entities={entity.entities}
                        useCases={entity.usedInStatementProps}
                        key="StatementProp"
                        perPage={10}
                      />
                    )}

                    {/* usedIn statement identification */}
                    {!entity.isTemplate && (
                      <EntityDetailIdentificationTable
                        title={{
                          singular: "In-statement Identification",
                          plural: "In-statement Identifications",
                        }}
                        entities={entity.entities}
                        useCases={entity.usedInStatementIdentifications}
                        key="StatementIdentification"
                        perPage={10}
                      />
                    )}

                    {/* usedIn statement classification */}
                    {!entity.isTemplate && (
                      <EntityDetailClassificationTable
                        title={{
                          singular: "In-statement Classification",
                          plural: "In-statement Classifications",
                        }}
                        entities={entity.entities}
                        useCases={entity.usedInStatementClassifications}
                        key="StatementClassification"
                        perPage={10}
                      />
                    )}

                    {!entity.isTemplate && (
                      <EntityDetailUsedInDocumentsTable
                        title={{
                          singular: "Anchor",
                          plural: "Anchors",
                        }}
                        perPage={10}
                        entity={entity}
                        widthTooNarrow={widthTooNarrow}
                      />
                    )}
                  </StyledDetailSectionContent>
                )}
              </StyledDetailSection>

              {/* Audits */}
              <StyledDetailSection key="editor-section-audits">
                <StyledDetailSectionHeader
                  onClick={() => toggleSection(EntityDetailSection.Audits)}
                >
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.Audits)}
                  />
                  <StyledDetailSectionHeading>Audits</StyledDetailSectionHeading>
                </StyledDetailSectionHeader>
                {isSectionExpanded(EntityDetailSection.Audits) && (
                  <StyledDetailSectionContent>
                    {audit && <AuditTable {...audit} />}
                  </StyledDetailSectionContent>
                )}
              </StyledDetailSection>

              {/* JSON */}
              <StyledDetailSection key="editor-section-json">
                <StyledDetailSectionHeader onClick={() => toggleSection(EntityDetailSection.Json)}>
                  <EntityDetailExpandIcon
                    isExpanded={isSectionExpanded(EntityDetailSection.Json)}
                  />
                  <StyledDetailSectionHeading>JSON</StyledDetailSectionHeading>
                </StyledDetailSectionHeader>
                {isSectionExpanded(EntityDetailSection.Json) && (
                  <StyledDetailSectionContent>
                    {entity && <JSONExplorer data={entity} />}
                  </StyledDetailSectionContent>
                )}
              </StyledDetailSection>
            </StyledDetailWrapper>
          </>
        </CustomScrollbar>
      )}

      <Submit
        title="Delete entity"
        text="Do you really want to delete this entity?"
        submitLabel="Delete"
        entityToSubmit={entity}
        onSubmit={() => {
          deleteEntityMutation.mutate(detailId);
          setShowRemoveSubmit(false);
        }}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteEntityMutation.isPending}
      />
      <Submit
        title="Delete metaprops"
        text="Do you really want to delete all metaprops from this entity?"
        submitLabel="Delete"
        onSubmit={() => {
          updateEntityMutation.mutate({ props: [] });
          setShowBatchRemovePropSubmit(false);
        }}
        onCancel={() => setShowBatchRemovePropSubmit(false)}
        show={showBatchRemovePropSubmit}
        loading={updateEntityMutation.isPending}
      />
      <Submit
        title="Change entity type"
        text={`Changing entity type to: [${selectedEntityTypeLabel}]. You may loose some values. Do you want to continue?`}
        submitLabel="Continue"
        onSubmit={() => {
          if (selectedEntityType) {
            changeEntityTypeMutation.mutate(selectedEntityType);
          }
        }}
        onCancel={() => setShowTypeSubmit(false)}
        show={showTypeSubmit}
      />

      <Loader
        show={
          isFetching ||
          updateEntityMutation.isPending ||
          deleteEntityMutation.isPending ||
          changeEntityTypeMutation.isPending ||
          loadingValidations
        }
      />

      {entity && templateToApply && (
        <ApplyTemplateModal
          showModal={showApplyTemplateModal}
          entity={entity}
          setShowApplyTemplateModal={setShowApplyTemplateModal}
          updateEntityMutation={updateEntityMutation}
          templateToApply={templateToApply}
          setTemplateToApply={setTemplateToApply}
        />
      )}

      {entity && (
        <EntityDetailCreateTemplateModal
          setCreateTemplateModal={setCreateTemplateModal}
          entity={entity}
          showModal={createTemplateModal}
          userCanEdit={canEditEntity}
          updateEntityMutation={updateEntityMutation}
        />
      )}

      <Submit
        show={isCleaningEntityPrompt}
        title="Clean all entity details"
        text="Do you really want to clean all entity details? This action will remove all entity meta properties, relations and references."
        submitLabel="Clean"
        onSubmit={() => {
          handleCleanEntityDetails();
        }}
        onCancel={() => setIsCleaningEntityPrompt(false)}
      />
    </>
  );
};
