import {
  actantLogicalTypeDict,
  actantStatusDict,
  entitiesDict,
  languageDict,
} from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { ActantType, Language, UserRoleMode } from "@shared/enums";
import { IAction, IResponseActant, IStatement } from "@shared/types";
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
import { findPositionInStatement } from "utils";
import { EntityTag } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "../AuditTable/AuditTable";
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
  const { actantId, setActantId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const [usedInPage, setUsedInPage] = useState<number>(0);
  const statementsPerPage = 20;

  const queryClient = useQueryClient();

  const {
    status,
    data: actant,
    error,
    isFetching,
  } = useQuery(
    ["actant", actantId],
    async () => {
      const res = await api.detailGet(actantId);
      return res.data;
    },
    { enabled: !!actantId && api.isLoggedIn(), retry: 2 }
  );

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", actantId],
    async () => {
      const res = await api.auditGet(actantId);
      return res.data;
    },
    { enabled: !!actantId && api.isLoggedIn(), retry: 2 }
  );

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [actant]);

  const userCanAdmin: boolean = useMemo(() => {
    return !!actant && actant.right === UserRoleMode.Admin;
  }, [actant]);

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!actant &&
      (actant.right === UserRoleMode.Admin ||
        actant.right === UserRoleMode.Write)
    );
  }, [actant]);

  // mutations
  const allEntitiesOption = {
    value: "*",
    label: "*",
    info: "",
  };
  const entityOptions = [...entitiesDict] as any;
  entityOptions.push(allEntitiesOption);

  const updateActantMutation = useMutation(
    async (changes: any) => await api.actantsUpdate(actantId, changes),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["actant"]);

        if (
          variables.detail ||
          variables.label ||
          variables.status ||
          variables.data?.logicalType
        ) {
          if (actant?.class === ActantType.Territory) {
            queryClient.invalidateQueries("tree");
          }
          queryClient.invalidateQueries("territory");
          queryClient.invalidateQueries("statement");
          queryClient.invalidateQueries("bookmarks");
        }
      },
    }
  );

  const deleteActantMutation = useMutation(
    async (actantId: string) => await api.actantsDelete(actantId),
    {
      onSuccess: (data, actantId) => {
        toast.info(`Actant deleted!`);
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
        setActantId("");
      },
    }
  );

  // Props handling

  const addProp = (originId: string) => {
    if (actant) {
      const newProp = CProp();
      const newProps = [...actant.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === originId) {
          newProps[pi1].children = [...newProps[pi1].children, newProp];
        }
      });

      updateActantMutation.mutate({ props: newProps });
    }
  };

  const updateProp = (propId: string, changes: any) => {
    if (actant) {
      const newProps = [...actant.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === propId) {
          newProps[pi1] = { ...newProps[pi1], ...changes };
        }
        prop1.children.forEach((prop2, pi2) => {
          if (prop2.id === propId) {
            newProps[pi1].children[pi2] = {
              ...newProps[pi1].children[pi2],
              ...changes,
            };
          }
        });
      });
      updateActantMutation.mutate({ props: newProps });
    }
  };

  const removeProp = (propId: string) => {
    if (actant) {
      const newProps = [...actant.props].filter(
        (prop, pi) => prop.id !== propId
      );

      newProps.forEach((prop1, pi1) => {
        newProps[pi1].children = prop1.children.filter(
          (child) => child.id !== propId
        );
      });

      updateActantMutation.mutate({ props: newProps });
    }
  };

  const movePropUp = (propId: string) => {
    if (actant) {
      const newProps = [...actant.props];

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

      updateActantMutation.mutate({ props: newProps });
    }
  };

  const movePropDown = (propId: string) => {
    if (actant) {
      const newProps = [...actant.props];

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

      updateActantMutation.mutate({ props: newProps });
    }
  };

  useEffect(() => {
    if (error && (error as any).error === "ActantDoesNotExits") {
      setActantId("");
    }
  }, [error]);

  const usedInPages = useMemo(() => {
    if (actant && actant.usedInStatement) {
      return Math.ceil(actant.usedInStatement.length / statementsPerPage);
    } else {
      return 0;
    }
  }, [actantId, actant]);

  useEffect(() => {
    setUsedInPage(0);
  }, [actantId]);

  const mayBeRemoved = useMemo(() => {
    return (
      actant && actant.usedInStatement && actant.usedInStatement.length === 0
    );
  }, [actant]);

  const actantMode = useMemo(() => {
    const actantClass = actant?.class;
    if (actantClass) {
      if (actantClass === ActantType.Action) {
        return "action";
      } else if (actantClass === ActantType.Territory) {
        return "territory";
      } else if (actantClass === ActantType.Resource) {
        return "resource";
      } else if (actantClass === ActantType.Concept) {
        return "concept";
      }
    }
    return "entity";
  }, [actant]);

  const usedInStatements = useMemo(() => {
    if (actant && actant.usedInStatement) {
      const displayStatements = actant.usedInStatement.slice(
        statementsPerPage * usedInPage,
        statementsPerPage * (usedInPage + 1)
      );

      return displayStatements.map((statement: IStatement) => {
        return {
          position: findPositionInStatement(statement, actant),
          statement: statement,
        };
      });
    } else {
      return [];
    }
  }, [usedInPage, actantId, actant]);

  // sort meta statements by type label
  const metaStatements = useMemo(() => {
    if (actant && actant.props) {
      const sorteMetaProps = [...actant.props];
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
  }, [actant]);

  return (
    <>
      {actant && (
        <StyledDetailWrapper type={actant.class}>
          {/* form section */}
          <StyledDetailSection firstSection>
            <StyledDetailSectionContent>
              <StyledActantPreviewRow>
                <StyledTagWrap>
                  <EntityTag
                    actant={actant}
                    propId={actant.id}
                    tooltipText={actant.data.text}
                    fullWidth
                  />
                </StyledTagWrap>
                <ButtonGroup>
                  {mayBeRemoved && (
                    <Button
                      color="primary"
                      icon={<FaTrashAlt />}
                      label="remove actant"
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
                      queryClient.invalidateQueries(["actant"]);
                    }}
                  />
                  {actant.class === ActantType.Statement && (
                    <Button
                      key="edit"
                      icon={<FaEdit size={14} />}
                      tooltip="open statement in editor"
                      inverted={true}
                      color="primary"
                      label="open statement"
                      onClick={() => {
                        setStatementId(actant.id);
                        setTerritoryId(actant.data.territory.id);
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
                      {actant.id}
                      <Button
                        inverted
                        tooltip="copy ID"
                        color="primary"
                        label=""
                        icon={<FaRegCopy />}
                        onClick={async () => {
                          await navigator.clipboard.writeText(actant.id);
                          toast.info("ID copied to clipboard!");
                        }}
                      />
                    </StyledDetailContentRowValueID>
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Label
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <Input
                      disabled={!userCanEdit}
                      width="full"
                      value={actant.label}
                      onChangeFn={async (newLabel: string) => {
                        if (newLabel !== actant.label) {
                          updateActantMutation.mutate({
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
                      value={actant.detail}
                      onChangeFn={async (newValue: string) => {
                        updateActantMutation.mutate({ detail: newValue });
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
                          longValue: actantStatusDict[0]["label"],
                          shortValue: actantStatusDict[0]["label"],
                          onClick: () => {
                            updateActantMutation.mutate({
                              status: actantStatusDict[0]["value"],
                            });
                          },
                          selected:
                            actantStatusDict[0]["value"] === actant.status,
                        },
                        {
                          longValue: actantStatusDict[1]["label"],
                          shortValue: actantStatusDict[1]["label"],
                          onClick: () => {
                            updateActantMutation.mutate({
                              status: actantStatusDict[1]["value"],
                            });
                          },
                          selected:
                            actantStatusDict[1]["value"] === actant.status,
                        },
                        {
                          longValue: actantStatusDict[2]["label"],
                          shortValue: actantStatusDict[2]["label"],
                          onClick: () => {
                            updateActantMutation.mutate({
                              status: actantStatusDict[2]["value"],
                            });
                          },
                          selected:
                            actantStatusDict[2]["value"] === actant.status,
                        },
                        {
                          longValue: actantStatusDict[3]["label"],
                          shortValue: actantStatusDict[3]["label"],
                          onClick: () => {
                            updateActantMutation.mutate({
                              status: actantStatusDict[3]["value"],
                            });
                          },
                          selected:
                            actantStatusDict[3]["value"] === actant.status,
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
                        (i: any) => i.value === actant.language
                      )}
                      onChange={(newValue: any) => {
                        updateActantMutation.mutate({
                          language: newValue.value || Language.Empty,
                        });
                      }}
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
                {actantMode === "entity" && actant.data?.logicalType && (
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
                              updateActantMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[0]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[0]["value"] ===
                              actant.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[1]["label"],
                            shortValue: actantLogicalTypeDict[1]["label"],
                            onClick: () => {
                              updateActantMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[1]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[1]["value"] ===
                              actant.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[2]["label"],
                            shortValue: actantLogicalTypeDict[2]["label"],
                            onClick: () => {
                              updateActantMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[2]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[2]["value"] ===
                              actant.data.logicalType,
                          },
                          {
                            longValue: actantLogicalTypeDict[3]["label"],
                            shortValue: actantLogicalTypeDict[3]["label"],
                            onClick: () => {
                              updateActantMutation.mutate({
                                data: {
                                  logicalType:
                                    actantLogicalTypeDict[3]["value"],
                                },
                              });
                            },
                            selected:
                              actantLogicalTypeDict[3]["value"] ===
                              actant.data.logicalType,
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
                        disabled={!userCanEdit}
                        isMulti
                        allowSelectAll
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (actant as IAction).data.entities?.s.includes(
                              i.value
                            )
                          )}
                        width="full"
                        noOptionsMessage={() => "no entity"}
                        placeholder={"no entity"}
                        onChange={(newValue: any) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  s: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  a1: actant.data.entities.a1,
                                  a2: actant.data.entities.a2,
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
                        value={(actant as IAction).data.valencies?.s}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: newValue,
                                  a1: actant.data.valencies.a1,
                                  a2: actant.data.valencies.a2,
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
                        allowSelectAll
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (actant as IAction).data.entities?.a1.includes(
                              i.value
                            )
                          )}
                        placeholder={"no entity"}
                        width="full"
                        onChange={(newValue: any) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  a1: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  s: actant.data.entities.s,
                                  a2: actant.data.entities.a2,
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
                        value={(actant as IAction).data.valencies?.a1}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: actant.data.valencies.s,
                                  a1: newValue,
                                  a2: actant.data.valencies.a2,
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
                        allowSelectAll
                        options={entitiesDict}
                        value={[allEntities]
                          .concat(entitiesDict)
                          .filter((i: any) =>
                            (actant as IAction).data.entities?.a2.includes(
                              i.value
                            )
                          )}
                        placeholder={"no entity"}
                        width="full"
                        onChange={(newValue: any) => {
                          const oldData = { ...actant.data };

                          console.log(actant.data.entities);
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                entities: {
                                  a2: newValue
                                    ? (newValue as string[]).map(
                                        (v: any) => v.value
                                      )
                                    : [],
                                  s: actant.data.entities.s,
                                  a1: actant.data.entities.a1,
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
                        value={(actant as IAction).data.valencies?.a2}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
                            data: {
                              ...oldData,
                              ...{
                                valencies: {
                                  s: actant.data.valencies.s,
                                  a1: actant.data.valencies.a1,
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
                        value={actant.data.url}
                        width="full"
                        onChangeFn={async (newValue: string) => {
                          const oldData = { ...actant.data };
                          updateActantMutation.mutate({
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
                      values={actant.notes}
                      width="full"
                      onChange={(newValues: string[]) => {
                        updateActantMutation.mutate({ notes: newValues });
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
                    originId={actant.id}
                    entities={actant.entities}
                    props={actant.props}
                    territoryId={territoryId}
                    updateProp={updateProp}
                    removeProp={removeProp}
                    addProp={addProp}
                    movePropDown={movePropDown}
                    movePropUp={movePropUp}
                    userCanEdit={userCanEdit}
                    openDetailOnCreate={false}
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
                    const newActant = { ...actant };
                    newActant.props.push(newProp);

                    updateActantMutation.mutate({ props: newActant.props });
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
                {usedInStatements.map((usedInStatement) => {
                  const { statement, position } = usedInStatement;
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
                          <Button
                            key="e"
                            icon={<FaEdit size={14} />}
                            color="plain"
                            tooltip="edit statement"
                            onClick={async () => {
                              setStatementId(statement.id);
                              setTerritoryId(statement.data.territory.id);
                            }}
                          />
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
              {actant && <JSONExplorer data={actant} />}
            </StyledDetailSectionContent>
          </StyledDetailSection>
        </StyledDetailWrapper>
      )}
      <Submit
        title="Remove entity"
        text="Do you really want to delete actant?"
        onSubmit={() => deleteActantMutation.mutate(actantId)}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteActantMutation.isLoading}
      />
      <Loader
        show={
          isFetching ||
          updateActantMutation.isLoading ||
          deleteActantMutation.isLoading
        }
      />
    </>
  );
};
