import { entitiesDictKeys } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IOption,
  IProp,
  IReference,
  IResponseDetail,
  Relation,
} from "@shared/types";
import api from "api";
import { Button, Loader, Submit } from "components";
import {
  ApplyTemplateModal,
  AuditTable,
  EntityTag,
  JSONExplorer,
} from "components/advanced";
import { CMetaProp } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  DraggedPropRowCategory,
  DropdownItem,
  PropAttributeFilter,
} from "types";
import { getEntityLabel, getShortLabelByLetterCount } from "utils";
import { EntityReferenceTable } from "../../EntityReferenceTable/EntityReferenceTable";
import { PropGroup } from "../../PropGroup/PropGroup";
import { EntityDetailCreateTemplateModal } from "./EntityDetailCreateTemplateModal/EntityDetailCreateTemplateModal";
import { EntityDetailFormSection } from "./EntityDetailFormSection/EntityDetailFormSection";
import { EntityDetailHeaderRow } from "./EntityDetailHeaderRow/EntityDetailHeaderRow";
import { EntityDetailRelations } from "./EntityDetailRelations/EntityDetailRelations";
import {
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionEntityList,
  StyledDetailSectionHeader,
  StyledDetailWrapper,
  StyledUsedAsHeading,
  StyledUsedAsTitle,
} from "./EntityDetailStyles";
import { EntityDetailClassificationTable } from "./EntityDetailUsedInTable/EntityDetailClassificationTable/EntityDetailClassificationTable";
import { EntityDetailIdentificationTable } from "./EntityDetailUsedInTable/EntityDetailIdentificationTable/EntityDetailIdentificationTable";
import { EntityDetailInverseRelations } from "./EntityDetailRelations/EntityDetailInverseRelations/EntityDetailInverseRelations";
import { EntityDetailMetaPropsTable } from "./EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "./EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "./EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";
import { EntityDetailValency } from "./EntityDetailValency/EntityDetailValency";

const allowedEntityChangeClasses = [
  EntityEnums.Class.Value,
  EntityEnums.Class.Person,
  EntityEnums.Class.Being,
  EntityEnums.Class.Event,
  EntityEnums.Class.Group,
  EntityEnums.Class.Location,
  EntityEnums.Class.Object,
];

interface EntityDetail {
  detailId: string;
}
export const EntityDetail: React.FC<EntityDetail> = ({ detailId }) => {
  const {
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
    removeDetailId,
    setSelectedDetailId,
    detailIdArray,
    selectedDetailId,
  } = useSearchParams();
  const {
    status,
    data: entity,
    error,
    isFetching,
  } = useQuery(
    ["entity", detailId],
    async () => {
      const res = await api.detailGet(detailId);
      return res.data;
    },
    { enabled: !!detailId && api.isLoggedIn() }
  );

  const [createTemplateModal, setCreateTemplateModal] =
    useState<boolean>(false);
  const [showRemoveSubmit, setShowRemoveSubmit] = useState<boolean>(false);
  const [selectedEntityType, setSelectedEntityType] =
    useState<EntityEnums.Class>();
  const [showTypeSubmit, setShowTypeSubmit] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] =
    useState<boolean>(false);
  const [templateToApply, setTemplateToApply] = useState<IEntity | false>(
    false
  );

  const selectedEntityTypeLabel: string = useMemo(() => {
    return selectedEntityType ? entitiesDictKeys[selectedEntityType].label : "";
  }, [selectedEntityType]);

  const handleAskForTemplateApply = (templateOptionToApply: IOption) => {
    if (templates) {
      const templateThatIsGoingToBeApplied = templates.find(
        (template: IEntity) => template.id === templateOptionToApply.value
      );

      if (templateThatIsGoingToBeApplied) {
        setTemplateToApply(templateThatIsGoingToBeApplied);
        setShowApplyTemplateModal(true);
      }
    }
  };

  const queryClient = useQueryClient();

  const isClassChangeable =
    entity && allowedEntityChangeClasses.includes(entity.class);

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["entity-templates", "templates", entity?.class],
    async () => {
      const res = await api.entitiesSearch({
        onlyTemplates: true,
        class: entity?.class,
      });

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    { enabled: !!entity && api.isLoggedIn() }
  );

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options = [
      {
        value: "",
        label: "select template",
      },
    ];

    if (entity !== undefined && templates) {
      templates
        .filter((template) => template.id !== entity.id)
        .forEach((template) => {
          const maxLetterCount = 200;
          options.push({
            value: template.id,
            label: getShortLabelByLetterCount(
              getEntityLabel(template),
              maxLetterCount
            ),
          });
        });
    }
    return options;
  }, [templates]);

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", detailId],
    async () => {
      const res = await api.auditGet(detailId);
      return res.data;
    },
    { enabled: !!detailId && api.isLoggedIn() }
  );

  // refetch audit when statement changes
  useEffect(() => {
    if (entity !== undefined) {
      queryClient.invalidateQueries("audit");
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
      (entity.right === UserEnums.RoleMode.Admin ||
        entity.right === UserEnums.RoleMode.Write)
    );
  }, [entity]);

  const updateEntityMutation = useMutation(
    async (changes: any) => await api.entityUpdate(detailId, changes),
    {
      onSuccess: (data, variables) => {
        // TODO - check this
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries("statement");

        if (statementId === detailId) {
          queryClient.invalidateQueries("statement");
        }
        if (
          variables.references !== undefined ||
          variables.detail !== undefined ||
          variables.label !== undefined ||
          variables.status ||
          variables.data?.logicalType
        ) {
          if (entity?.class === EntityEnums.Class.Territory) {
            queryClient.invalidateQueries("tree");
          }
          queryClient.invalidateQueries("territory");
          queryClient.invalidateQueries("bookmarks");
        }
        if (variables.label !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
        if (entity?.isTemplate) {
          queryClient.invalidateQueries("templates");
        }
      },
    }
  );

  const changeEntityTypeMutation = useMutation(
    async (newClass: string) =>
      await api.entityUpdate(detailId, { class: newClass }),
    {
      onSuccess: (data, variables) => {
        setShowTypeSubmit(false);
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries("statement");
        if (variables === EntityEnums.Class.Territory) {
          queryClient.invalidateQueries("tree");
        }
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("bookmarks");
        if (entity?.isTemplate) {
          queryClient.invalidateQueries("templates");
        }
      },
    }
  );

  const deleteEntityMutation = useMutation(
    (entityId: string) => api.entityDelete(entityId),
    {
      onSuccess: async (data, entityId) => {
        setShowRemoveSubmit(false);

        toast.info(`Entity removed!`);

        // hide selected territory if T removed
        if (
          entity &&
          entity.class == EntityEnums.Class.Territory &&
          entity.id === territoryId
        ) {
          setTerritoryId("");
        } else {
          queryClient.invalidateQueries("territory");
        }

        // hide editor box if the removed entity was also opened in the editor
        if (
          entity &&
          entity.class == EntityEnums.Class.Statement &&
          entity.id === statementId
        ) {
          setStatementId("");
        } else {
          queryClient.invalidateQueries("statement");
        }

        queryClient.invalidateQueries("tree");

        removeDetailId(entityId);
      },
    }
  );

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

  const updateProp = (propId: string, changes: any) => {
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
      const newProps = [...entity.props].filter(
        (prop, pi) => prop.id !== propId
      );

      // 2nd level
      newProps.forEach((prop1, pi1) => {
        newProps[pi1].children = prop1.children.filter(
          (child) => child.id !== propId
        );

        // 3rd level
        newProps[pi1].children.forEach((prop2, pi2) => {
          newProps[pi1].children[pi2].children = newProps[pi1].children[
            pi2
          ].children.filter((child) => child.id !== propId);
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const changeOrder = (
    propId: string,
    props: IProp[],
    oldIndex: number,
    newIndex: number
  ) => {
    for (let prop of props) {
      if (prop.id === propId) {
        props.splice(newIndex, 0, props.splice(oldIndex, 1)[0]);
        return props;
      }
      for (let prop1 of prop.children) {
        if (prop1.id === propId) {
          prop.children.splice(
            newIndex,
            0,
            prop.children.splice(oldIndex, 1)[0]
          );
          return props;
        }
        for (let prop2 of prop1.children) {
          if (prop2.id === propId) {
            prop1.children.splice(
              newIndex,
              0,
              prop1.children.splice(oldIndex, 1)[0]
            );
            return props;
          }
        }
      }
    }
    return props;
  };

  const movePropToIndex = (
    propId: string,
    oldIndex: number,
    newIndex: number
  ) => {
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
    return (
      entity && entity.usedInStatements && entity.usedInStatements.length === 0
    );
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
      entity.data.parent &&
      Object.keys(entity.entities).includes(entity.data.parent.territoryId)
    );
  };

  const isStatementWithTerritory = (entity: IResponseDetail): boolean => {
    return (
      entity.class === EntityEnums.Class.Statement &&
      entity.data.territory &&
      Object.keys(entity.entities).includes(entity.data.territory.id)
    );
  };

  const getTerritoryId = (entity: IResponseDetail) => {
    if (isTerritoryWithParent(entity)) {
      return entity.entities[entity.data.parent.territoryId].id;
    } else if (isStatementWithTerritory(entity)) {
      return entity.entities[entity.data.territory.id].id;
    } else {
      return undefined;
    }
  };

  const relationCreateMutation = useMutation(
    async (newRelation: Relation.IRelation) =>
      await api.relationCreate(newRelation),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("entity");
      },
    }
  );

  const relationUpdateMutation = useMutation(
    async (relationObject: { relationId: string; changes: any }) =>
      await api.relationUpdate(
        relationObject.relationId,
        relationObject.changes
      ),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("entity");
      },
    }
  );
  const relationDeleteMutation = useMutation(
    async (relationId: string) => await api.relationDelete(relationId),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("entity");
      },
    }
  );

  return (
    <>
      {entity && (
        <>
          <EntityDetailHeaderRow
            entity={entity}
            userCanEdit={userCanEdit}
            mayBeRemoved={mayBeRemoved}
            setShowRemoveSubmit={setShowRemoveSubmit}
            setCreateTemplateModal={setCreateTemplateModal}
          />

          <StyledDetailWrapper>
            {/* form section */}
            <StyledDetailSection firstSection>
              <StyledDetailSectionContent firstSection>
                <EntityDetailFormSection
                  entity={entity}
                  userCanEdit={userCanEdit}
                  userCanAdmin={userCanAdmin}
                  actantMode={actantMode}
                  isStatementWithTerritory={isStatementWithTerritory}
                  isClassChangeable={isClassChangeable || false}
                  isTerritoryWithParent={isTerritoryWithParent}
                  allowedEntityChangeClasses={allowedEntityChangeClasses}
                  handleAskForTemplateApply={handleAskForTemplateApply}
                  setSelectedEntityType={setSelectedEntityType}
                  setShowTypeSubmit={setShowTypeSubmit}
                  templateOptions={templateOptions}
                  updateEntityMutation={updateEntityMutation}
                />
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* Valency (A) */}
            {entity.class === EntityEnums.Class.Action && (
              <StyledDetailSection>
                <StyledDetailSectionHeader>Valency</StyledDetailSectionHeader>
                <StyledDetailSectionContent>
                  <EntityDetailValency
                    entity={entity}
                    userCanEdit={userCanEdit}
                    updateEntityMutation={updateEntityMutation}
                    relationCreateMutation={relationCreateMutation}
                    relationUpdateMutation={relationUpdateMutation}
                    relationDeleteMutation={relationDeleteMutation}
                  />
                </StyledDetailSectionContent>
              </StyledDetailSection>
            )}

            {/* Relations */}
            <StyledDetailSection>
              <StyledDetailSectionHeader>Relations</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                <EntityDetailRelations
                  entity={entity}
                  relationCreateMutation={relationCreateMutation}
                  relationUpdateMutation={relationUpdateMutation}
                  relationDeleteMutation={relationDeleteMutation}
                />
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* reference section */}
            <StyledDetailSection>
              <StyledDetailSectionHeader>References</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                <EntityReferenceTable
                  disabled={!userCanEdit}
                  references={entity.references || []}
                  entities={entity.entities}
                  onChange={(newValues: IReference[]) => {
                    updateEntityMutation.mutate({ references: newValues });
                  }}
                  isInsideTemplate={entity.isTemplate || false}
                />
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* meta props section */}
            <StyledDetailSection metaSection>
              <StyledDetailSectionHeader>
                Meta properties
              </StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                <PropGroup
                  boxEntity={entity}
                  originId={entity.id}
                  entities={entity.entities}
                  props={entity.props}
                  territoryId={territoryId}
                  updateProp={updateProp}
                  removeProp={removeProp}
                  addProp={addMetaProp}
                  userCanEdit={userCanEdit}
                  openDetailOnCreate={false}
                  movePropToIndex={(propId, oldIndex, newIndex) => {
                    movePropToIndex(propId, oldIndex, newIndex);
                  }}
                  category={DraggedPropRowCategory.META_PROP}
                  disabledAttributes={
                    {
                      statement: [
                        "elvl",
                        "moodvariant",
                        "mood",
                        "bundleOperator",
                      ],
                      type: ["elvl", "logic", "virtuality", "partitivity"],
                      value: ["elvl", "logic", "virtuality", "partitivity"],
                    } as PropAttributeFilter
                  }
                  isInsideTemplate={entity.isTemplate || false}
                  territoryParentId={getTerritoryId(entity)}
                />
                {userCanEdit && (
                  <Button
                    color="primary"
                    label="create new meta property"
                    icon={<FaPlus />}
                    onClick={async () => {
                      const newProp = CMetaProp();
                      const newActant = { ...entity };
                      newActant.props.push(newProp);
                      updateEntityMutation.mutate({ props: newActant.props });
                    }}
                  />
                )}
              </StyledDetailSectionContent>
            </StyledDetailSection>

            <StyledDetailSection>
              <StyledDetailSectionHeader>Used in:</StyledDetailSectionHeader>

              {/* used as template */}
              {entity.isTemplate && entity.usedAsTemplate && (
                <StyledDetailSectionContentUsedIn key="as template">
                  <StyledUsedAsHeading>
                    <StyledUsedAsTitle>
                      <b>{entity.usedAsTemplate.length}</b> As a template
                    </StyledUsedAsTitle>
                  </StyledUsedAsHeading>
                  <StyledDetailSectionEntityList>
                    {entity.usedAsTemplate.map((entityId) => (
                      <React.Fragment key={entityId}>
                        <EntityTag entity={entity.entities[entityId]} />
                      </React.Fragment>
                    ))}
                  </StyledDetailSectionEntityList>
                </StyledDetailSectionContentUsedIn>
              )}

              {/* usedIn props */}
              {!entity.isTemplate && (
                <EntityDetailMetaPropsTable
                  title={{
                    singular: "Meta Property",
                    plural: "Meta Properties",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInMetaProps}
                  key="MetaProp"
                />
              )}

              {/* usedIn statements */}
              {!entity.isTemplate && (
                <EntityDetailStatementsTable
                  title={{ singular: "Statement", plural: "Statements" }}
                  entities={entity.entities}
                  useCases={entity.usedInStatements}
                  key="Statement"
                />
              )}

              {/* usedIn statement props */}
              {!entity.isTemplate && (
                <EntityDetailStatementPropsTable
                  title={{
                    singular: "Statement Property",
                    plural: "Statement Properties",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInStatementProps}
                  key="StatementProp"
                />
              )}

              {/* usedIn statement identification */}
              {!entity.isTemplate && (
                <EntityDetailIdentificationTable
                  title={{
                    singular: "Statement Identification",
                    plural: "Statement Identifications",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInStatementIdentifications}
                  key="StatementIdentification"
                />
              )}

              {/* usedIn statement classification */}
              {!entity.isTemplate && (
                <EntityDetailClassificationTable
                  title={{
                    singular: "Statement Classification",
                    plural: "Statement Classifications",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInStatementClassifications}
                  key="StatementClassification"
                />
              )}
            </StyledDetailSection>

            {/* Audits */}
            <StyledDetailSection key="editor-section-audits">
              <StyledDetailSectionHeader>Audits</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                {audit && <AuditTable {...audit} />}
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* JSON */}
            <StyledDetailSection key="editor-section-json">
              <StyledDetailSectionHeader>JSON</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                {entity && <JSONExplorer data={entity} />}
              </StyledDetailSectionContent>
            </StyledDetailSection>
          </StyledDetailWrapper>
        </>
      )}

      <Submit
        title="Remove entity"
        text="Do you really want to remove this entity?"
        submitLabel="Remove"
        onSubmit={() => {
          deleteEntityMutation.mutate(detailId);
        }}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteEntityMutation.isLoading}
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
          updateEntityMutation.isLoading ||
          deleteEntityMutation.isLoading ||
          changeEntityTypeMutation.isLoading
        }
      />

      <ApplyTemplateModal
        showModal={showApplyTemplateModal}
        entity={entity}
        setShowApplyTemplateModal={setShowApplyTemplateModal}
        updateEntityMutation={updateEntityMutation}
        templateToApply={templateToApply}
        setTemplateToApply={setTemplateToApply}
      />

      <EntityDetailCreateTemplateModal
        setCreateTemplateModal={setCreateTemplateModal}
        entity={entity}
        showModal={createTemplateModal}
        userCanEdit={userCanEdit}
        updateEntityMutation={updateEntityMutation}
      />
    </>
  );
};
