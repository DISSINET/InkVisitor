import {
  actantLogicalTypeDict,
  entityStatusDict,
  entitiesDict,
  languageDict,
  entityReferenceSourceDict,
} from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityClass, Language, UserRoleMode } from "@shared/enums";
import { IAction, IEntityReference, IStatement } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Loader,
  MultiInput,
  Submit,
} from "components";
import { CProp } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaRecycle,
  FaRegCopy,
  FaStepBackward,
  FaStepForward,
  FaTrashAlt,
} from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { DraggedPropRowCategory } from "types";
import { findPositionInStatement } from "utils";
import { EntityTag } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "../AuditTable/AuditTable";
import { EntityReferenceInput } from "../EntityReferenceInput/EntityReferenceInput";
import { JSONExplorer } from "../JSONExplorer/JSONExplorer";
import { PropGroup } from "../PropGroup/PropGroup";
import {
  StyledActantPreviewRow,
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailContentRowValueID,
  StyledDetailForm,
  StyledDetailHeaderColumn,
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionHeader,
  StyledDetailSectionMetaTableButtonGroup,
  StyledDetailSectionMetaTableCell,
  StyledDetailSectionUsedPageManager,
  StyledDetailSectionUsedTable,
  StyledDetailSectionUsedTableCell,
  StyledDetailSectionUsedText,
  StyledDetailWrapper,
  StyledTagWrap,
} from "./EntityDetailBoxStyles";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const { detailId, setDetailId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const [usedInPage, setUsedInPage] = useState<number>(0);
  const statementsPerPage = 20;

  const queryClient = useQueryClient();

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
    { enabled: !!detailId && api.isLoggedIn(), retry: 2 }
  );

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
    { enabled: !!detailId && api.isLoggedIn(), retry: 2 }
  );

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [entity]);

  const userCanAdmin: boolean = useMemo(() => {
    return !!entity && entity.right === UserRoleMode.Admin;
  }, [entity]);

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!entity &&
      (entity.right === UserRoleMode.Admin ||
        entity.right === UserRoleMode.Write)
    );
  }, [entity]);

  // mutations
  const allEntitiesOption = {
    value: "*",
    label: "*",
    info: "",
  };
  const entityOptions = [...entitiesDict] as any;
  entityOptions.push(allEntitiesOption);

  const updateEntityMutation = useMutation(
    async (changes: any) => await api.entityUpdate(detailId, changes),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["entity"]);

        if (
          variables.detail ||
          variables.label ||
          variables.status ||
          variables.data?.logicalType
        ) {
          if (entity?.class === EntityClass.Territory) {
            queryClient.invalidateQueries("tree");
          }
          queryClient.invalidateQueries("territory");
          queryClient.invalidateQueries("statement");
          queryClient.invalidateQueries("bookmarks");
        }
      },
    }
  );

  const deleteEntityMutation = useMutation(
    async (entityId: string) => await api.entityDelete(entityId),
    {
      onSuccess: (data, entityId) => {
        toast.info(`Entity deleted!`);
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
        setDetailId("");
      },
    }
  );

  // Props handling

  // adding only second or third level
  const addProp = (originId: string) => {
    if (entity) {
      const newProp = CProp();
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
    if (entity) {
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
    if (entity) {
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

  const movePropUp = (propId: string) => {
    if (entity) {
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === propId) {
          newProps.splice(pi1 - 1, 0, newProps.splice(pi1, 1)[0]);
        }
        prop1.children.forEach((prop2, pi2) => {
          if (prop2.id === propId) {
            newProps[pi1].children.splice(
              pi2 - 1,
              0,
              newProps[pi1].children.splice(pi2, 1)[0]
            );
          }
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const movePropDown = (propId: string) => {
    if (entity) {
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === propId) {
          newProps.splice(pi1 + 1, 0, newProps.splice(pi1, 1)[0]);
        }
        prop1.children.forEach((prop2, pi2) => {
          if (prop2.id === propId) {
            newProps[pi1].children.splice(
              pi2 + 1,
              0,
              newProps[pi1].children.splice(pi2, 1)[0]
            );
          }
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  useEffect(() => {
    if (error && (error as any).error === "EntityDoesNotExits") {
      setDetailId("");
    }
  }, [error]);

  const usedInPages = useMemo(() => {
    if (entity && entity.usedInStatement) {
      return Math.ceil(entity.usedInStatement.length / statementsPerPage);
    } else {
      return 0;
    }
  }, [detailId, entity]);

  useEffect(() => {
    setUsedInPage(0);
  }, [detailId]);

  const mayBeRemoved = useMemo(() => {
    return (
      entity && entity.usedInStatement && entity.usedInStatement.length === 0
    );
  }, [entity]);

  const actantMode = useMemo(() => {
    const actantClass = entity?.class;
    if (actantClass) {
      if (actantClass === EntityClass.Action) {
        return "action";
      } else if (actantClass === EntityClass.Territory) {
        return "territory";
      } else if (actantClass === EntityClass.Resource) {
        return "resource";
      } else if (actantClass === EntityClass.Concept) {
        return "concept";
      }
    }
    return "entity";
  }, [entity]);

  // sort meta statements by type label
  const metaStatements = useMemo(() => {
    if (entity && entity.props) {
      const sorteMetaProps = [...entity.props];
      // sorteMetaStatements.sort(
      //   (s1: IProp, s2: IProp) => {
      //     const typeSActant1 = s1.data.actants.find(
      //       (a) => a.position == Position.Actant1
      //     );
      //     const typeSActant2 = s2.data.actants.find(
      //       (a) => a.position == Position.Actant1
      //     );

      //     const typeActant1 = typeSActant1
      //       ? s1.actants?.find((a) => a.id === typeSActant1.actant)
      //       : false;

      //     const typeActant2 = typeSActant2
      //       ? s2.actants?.find((a) => a.id === typeSActant2.actant)
      //       : false;

      //     if (
      //       typeActant1 === false ||
      //       typeSActant1?.actant === "" ||
      //       !typeActant1
      //     ) {
      //       return 1;
      //     } else if (
      //       typeActant2 === false ||
      //       typeSActant2?.actant === "" ||
      //       !typeActant2
      //     ) {
      //       return -1;
      //     } else {
      //       return typeActant1.label > typeActant2.label ? 1 : -1;
      //     }
      //   }
      // );
      return sorteMetaProps;
    } else {
      return [];
    }
  }, [entity]);

  return (
    <>
      {entity && (
        <StyledDetailWrapper type={entity.class}>
          {/* form section */}
          <StyledDetailSection firstSection>
            <StyledDetailSectionContent>
              <StyledActantPreviewRow>
                <StyledTagWrap>
                  <EntityTag
                    actant={entity}
                    propId={entity.id}
                    tooltipText={entity.data.text}
                    fullWidth
                  />
                </StyledTagWrap>
                <ButtonGroup>
                  {mayBeRemoved && (
                    <Button
                      color="primary"
                      icon={<FaTrashAlt />}
                      label="remove entity"
                      inverted={true}
                      onClick={() => {
                        setShowRemoveSubmit(true);
                      }}
                    />
                  )}
                  <Button
                    key="refresh"
                    icon={<FaRecycle size={14} />}
                    tooltip="refresh data"
                    inverted={true}
                    color="primary"
                    label="refresh"
                    onClick={() => {
                      queryClient.invalidateQueries(["entity"]);
                    }}
                  />
                  {entity.class === EntityClass.Statement && (
                    <Button
                      key="edit"
                      icon={<FaEdit size={14} />}
                      tooltip="open statement in editor"
                      inverted={true}
                      color="primary"
                      label="open statement"
                      onClick={() => {
                        setStatementId(entity.id);
                        setTerritoryId(entity.data.territory.id);
                      }}
                    />
                  )}
                </ButtonGroup>
              </StyledActantPreviewRow>

              <StyledDetailForm>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>ID</StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <StyledDetailContentRowValueID>
                      {entity.id}
                      <Button
                        inverted
                        tooltip="copy ID"
                        color="primary"
                        label=""
                        icon={<FaRegCopy />}
                        onClick={async () => {
                          await navigator.clipboard.writeText(entity.id);
                          toast.info("ID copied to clipboard!");
                        }}
                      />
                    </StyledDetailContentRowValueID>
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>

                {entity.legacyId && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Legacy ID
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <StyledDetailContentRowValueID>
                        {entity.legacyId}
                      </StyledDetailContentRowValueID>
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Label
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <Input
                      disabled={!userCanEdit}
                      width="full"
                      value={entity.label}
                      onChangeFn={async (newLabel: string) => {
                        if (newLabel !== entity.label) {
                          updateEntityMutation.mutate({
                            label: newLabel,
                          });
                        }
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Detail
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <Input
                      disabled={!userCanEdit}
                      width="full"
                      value={entity.detail}
                      onChangeFn={async (newValue: string) => {
                        updateEntityMutation.mutate({ detail: newValue });
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Status
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <AttributeButtonGroup
                      disabled={!userCanAdmin}
                      options={[
                        {
                          longValue: entityStatusDict[0]["label"],
                          shortValue: entityStatusDict[0]["label"],
                          onClick: () => {
                            updateEntityMutation.mutate({
                              status: entityStatusDict[0]["value"],
                            });
                          },
                          selected:
                            entityStatusDict[0]["value"] === entity.status,
                        },
                        {
                          longValue: entityStatusDict[1]["label"],
                          shortValue: entityStatusDict[1]["label"],
                          onClick: () => {
                            updateEntityMutation.mutate({
                              status: entityStatusDict[1]["value"],
                            });
                          },
                          selected:
                            entityStatusDict[1]["value"] === entity.status,
                        },
                        {
                          longValue: entityStatusDict[2]["label"],
                          shortValue: entityStatusDict[2]["label"],
                          onClick: () => {
                            updateEntityMutation.mutate({
                              status: entityStatusDict[2]["value"],
                            });
                          },
                          selected:
                            entityStatusDict[2]["value"] === entity.status,
                        },
                        {
                          longValue: entityStatusDict[3]["label"],
                          shortValue: entityStatusDict[3]["label"],
                          onClick: () => {
                            updateEntityMutation.mutate({
                              status: entityStatusDict[3]["value"],
                            });
                          },
                          selected:
                            entityStatusDict[3]["value"] === entity.status,
                        },
                      ]}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Label language
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <Dropdown
                      disabled={!userCanEdit}
                      isMulti={false}
                      width="full"
                      options={languageDict}
                      value={languageDict.find(
                        (i: any) => i.value === entity.language
                      )}
                      onChange={(newValue: any) => {
                        updateEntityMutation.mutate({
                          language: newValue.value || Language.Empty,
                        });
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                {actantMode === "entity" && entity.data?.logicalType && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Logical Type
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <AttributeButtonGroup
                        disabled={!userCanEdit}
                        options={[
                          {
                            longValue: actantLogicalTypeDict[0]["label"],
                            shortValue: actantLogicalTypeDict[0]["label"],
                            onClick: () => {
                              updateEntityMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[0]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[0]["value"] ===
                              entity.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[1]["label"],
                            shortValue: actantLogicalTypeDict[1]["label"],
                            onClick: () => {
                              updateEntityMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[1]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[1]["value"] ===
                              entity.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[2]["label"],
                            shortValue: actantLogicalTypeDict[2]["label"],
                            onClick: () => {
                              updateEntityMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[2]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[2]["value"] ===
                              entity.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[3]["label"],
                            shortValue: actantLogicalTypeDict[3]["label"],
                            onClick: () => {
                              updateEntityMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[3]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[3]["value"] ===
                              entity.data.logicalType,
                          },
                        ]}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {/* Actions */}
                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Subject entity type
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Dropdown
                        allowAny
                        disabled={!userCanEdit}
                        isMulti
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (entity as IAction).data.entities?.s.includes(
                              i.value
                            )
                          )}
                        width="full"
                        noOptionsMessage={() => "no entity"}
                        placeholder={"no entity"}
                        onChange={(newValue: any) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  s: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  a1: entity.data.entities.a1,
                                  a2: entity.data.entities.a2,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}
                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Subject valency
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Input
                        disabled={!userCanEdit}
                        value={(entity as IAction).data.valencies?.s}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: newValue,
                                  a1: entity.data.valencies.a1,
                                  a2: entity.data.valencies.a2,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Actant1 entity type
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Dropdown
                        disabled={!userCanEdit}
                        isMulti
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (entity as IAction).data.entities?.a1.includes(
                              i.value
                            )
                          )}
                        placeholder={"no entity"}
                        width="full"
                        onChange={(newValue: any) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  a1: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  s: entity.data.entities.s,
                                  a2: entity.data.entities.a2,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Actant1 valency
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Input
                        disabled={!userCanEdit}
                        value={(entity as IAction).data.valencies?.a1}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: entity.data.valencies.s,
                                  a1: newValue,
                                  a2: entity.data.valencies.a2,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Actant2 entity type
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Dropdown
                        disabled={!userCanEdit}
                        isMulti
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (entity as IAction).data.entities?.a2.includes(
                              i.value
                            )
                          )}
                        placeholder={"no entity"}
                        width="full"
                        onChange={(newValue: any) => {
                          const oldData = { ...entity.data };

                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  a2: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  s: entity.data.entities.s,
                                  a1: entity.data.entities.a1,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {actantMode === "action" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      Actant2 valency
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Input
                        disabled={!userCanEdit}
                        value={(entity as IAction).data.valencies?.a2}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: entity.data.valencies.s,
                                  a1: entity.data.valencies.a1,
                                  a2: newValue,
                                },
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                {actantMode === "resource" && (
                  <StyledDetailContentRow>
                    <StyledDetailContentRowLabel>
                      URL
                    </StyledDetailContentRowLabel>
                    <StyledDetailContentRowValue>
                      <Input
                        disabled={!userCanEdit}
                        value={entity.data.url}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...entity.data };
                          updateEntityMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                link: newValue,
                              },
                            },
                          });
                        }}
                      />
                    </StyledDetailContentRowValue>
                  </StyledDetailContentRow>
                )}

                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Notes
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <MultiInput
                      disabled={!userCanEdit}
                      values={entity.notes}
                      width="full"
                      onChange={(newValues: string[]) => {
                        updateEntityMutation.mutate({ notes: newValues });
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>

                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    References
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <EntityReferenceInput
                      disabled={!userCanEdit}
                      values={entity.references}
                      sources={entityReferenceSourceDict.filter((ers) =>
                        ers.entityClasses.includes(entity.class)
                      )}
                      onChange={(newValues: IEntityReference[]) => {
                        updateEntityMutation.mutate({ references: newValues });
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
              </StyledDetailForm>
            </StyledDetailSectionContent>
          </StyledDetailSection>

          {/* meta props section */}
          <StyledDetailSection>
            <StyledDetailSectionHeader>
              Meta properties
            </StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              {/* <EntityDetailMetaTable
                entity={actant}
                userCanEdit={userCanEdit}
                metaProps={metaStatements}
                updateMetaStatement={updateMetaStatementMutation}
                removeMetaStatement={actantsDeleteMutation}
              /> */}
              <table>
                <tbody>
                  <PropGroup
                    originId={entity.id}
                    entities={entity.entities}
                    props={entity.props}
                    territoryId={territoryId}
                    updateProp={updateProp}
                    removeProp={removeProp}
                    addProp={addProp}
                    userCanEdit={userCanEdit}
                    openDetailOnCreate={false}
                    movePropToIndex={(propId, oldIndex, newIndex) => {
                      console.log("oldIndex", oldIndex);
                      console.log("newIndex", newIndex);
                    }}
                    category={DraggedPropRowCategory.META_PROP}
                  />
                </tbody>
              </table>
              {userCanEdit && (
                <Button
                  color="primary"
                  label="create new meta property"
                  icon={<FaPlus />}
                  onClick={async () => {
                    const newProp = CProp();
                    const newActant = { ...entity };
                    newActant.props.push(newProp);

                    updateEntityMutation.mutate({ props: newActant.props });
                  }}
                />
              )}
            </StyledDetailSectionContent>
          </StyledDetailSection>

          {/* usedId section */}
          <StyledDetailSection lastSection>
            <StyledDetailSectionHeader>
              Used in statements:
            </StyledDetailSectionHeader>
            <StyledDetailSectionContentUsedIn>
              <StyledDetailSectionUsedPageManager>
                <StyledDetailSectionUsedTable>
                  {`Page ${usedInPage + 1} / ${usedInPages}`}
                  <Button
                    key="previous"
                    disabled={usedInPage === 0}
                    icon={<FaStepBackward size={14} />}
                    color="primary"
                    tooltip="previous page"
                    onClick={() => {
                      if (usedInPage !== 0) {
                        setUsedInPage(usedInPage - 1);
                      }
                    }}
                  />
                  <Button
                    key="next"
                    disabled={usedInPage === usedInPages - 1}
                    icon={<FaStepForward size={14} />}
                    color="primary"
                    tooltip="next page"
                    onClick={() => {
                      if (usedInPage !== usedInPages - 1) {
                        setUsedInPage(usedInPage + 1);
                      }
                    }}
                  />
                </StyledDetailSectionUsedTable>
              </StyledDetailSectionUsedPageManager>
              <StyledDetailSectionUsedTable>
                <StyledDetailHeaderColumn></StyledDetailHeaderColumn>
                <StyledDetailHeaderColumn>Text</StyledDetailHeaderColumn>
                <StyledDetailHeaderColumn>Position</StyledDetailHeaderColumn>
                <StyledDetailHeaderColumn></StyledDetailHeaderColumn>
                {entity.usedInStatement.map((usedInStatement) => {
                  const { statement, position, originId } = usedInStatement;
                  return (
                    <React.Fragment key={statement.id}>
                      <StyledDetailSectionUsedTableCell>
                        <EntityTag
                          key={statement.id}
                          actant={statement}
                          showOnly="entity"
                          tooltipText={statement.data.text}
                        />
                      </StyledDetailSectionUsedTableCell>
                      <StyledDetailSectionUsedTableCell>
                        <StyledDetailSectionUsedText>
                          {statement.data.text}
                        </StyledDetailSectionUsedText>
                      </StyledDetailSectionUsedTableCell>
                      <StyledDetailSectionUsedTableCell>
                        <StyledDetailSectionUsedText>
                          {position}
                        </StyledDetailSectionUsedText>
                      </StyledDetailSectionUsedTableCell>
                      <StyledDetailSectionMetaTableCell borderless>
                        <StyledDetailSectionMetaTableButtonGroup>
                          {statement.data.territory?.id && (
                            <Button
                              key="e"
                              icon={<FaEdit size={14} />}
                              color="plain"
                              tooltip="edit statement"
                              onClick={async () => {
                                if (statement.data.territory) {
                                  setStatementId(statement.id);
                                  setTerritoryId(statement.data.territory.id);
                                }
                              }}
                            />
                          )}
                        </StyledDetailSectionMetaTableButtonGroup>
                      </StyledDetailSectionMetaTableCell>
                    </React.Fragment>
                  );
                })}
              </StyledDetailSectionUsedTable>
            </StyledDetailSectionContentUsedIn>
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
      )}
      <Submit
        title="Remove entity"
        text="Do you really want to delete the entity?"
        onSubmit={() => deleteEntityMutation.mutate(detailId)}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteEntityMutation.isLoading}
      />
      <Loader
        show={
          isFetching ||
          updateEntityMutation.isLoading ||
          deleteEntityMutation.isLoading
        }
      />
    </>
  );
};
