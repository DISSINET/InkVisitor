import React, { useEffect, useState, useMemo } from "react";

import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Loader,
  MultiInput,
  Submit,
} from "components";
import {
  StyledContent,
  StyledDetailSection,
  StyledDetailSectionHeader,
  StyledDetailSectionUsedTable,
  StyledDetailHeaderColumn,
  StyledDetailSectionUsedTableCell,
  StyledDetailSectionMetaTableButtonGroup,
  StyledDetailSectionMetaTableCell,
  StyledDetailContentRow,
  StyledDetailForm,
  StyledDetailSectionUsedText,
  StyledDetailSectionUsedPageManager,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledActantPreviewRow,
  StyledTagWrap,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionContent,
} from "./EntityDetailBoxStyles";
import api from "api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { IResponseStatement, IStatement } from "@shared/types";
import {
  FaEdit,
  FaPlus,
  FaTrashAlt,
  FaStepBackward,
  FaStepForward,
  FaRecycle,
} from "react-icons/fa";
import { EntityTag } from "..";

import { CMetaStatement } from "constructors";
import { findPositionInStatement } from "utils";
import {
  actantLogicalTypeDict,
  actantStatusDict,
  languageDict,
  entitiesDict,
} from "@shared/dictionaries";
import {
  ActantType,
  Language,
  Position,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { toast } from "react-toastify";
import { ActantDetailMetaTable } from "./EntityDetailMetaTable/EntityDetailMetaTable";
import { useSearchParams } from "hooks";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "../AuditTable/AuditTable";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const {
    actantId,
    setActantId,
    setStatementId,
    setTerritoryId,
  } = useSearchParams();

  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const [usedInPage, setUsedInPage] = useState<number>(0);
  const statementsPerPage = 20;

  const queryClient = useQueryClient();

  const { status, data: actant, error, isFetching } = useQuery(
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

  useEffect(() => {
    if (error && (error as any).error === "ActantDoesNotExits") {
      setActantId("");
    }
  }, [error]);

  const usedInPages = useMemo(() => {
    if (actant && actant.usedIn) {
      return Math.ceil(actant.usedIn.length / statementsPerPage);
    } else {
      return 0;
    }
  }, [actantId, actant]);

  useEffect(() => {
    setUsedInPage(0);
  }, [actantId]);

  const mayBeRemoved = useMemo(() => {
    return actant && actant.usedIn && actant.usedIn.length === 0;
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
    if (actant && actant.usedIn) {
      const displayStatements = actant.usedIn.slice(
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
    if (actant && actant.metaStatements) {
      const sorteMetaStatements = [...actant.metaStatements];
      sorteMetaStatements.sort(
        (s1: IResponseStatement, s2: IResponseStatement) => {
          const typeSActant1 = s1.data.actants.find(
            (a) => a.position == Position.Actant1
          );
          const typeSActant2 = s2.data.actants.find(
            (a) => a.position == Position.Actant1
          );

          const typeActant1 = typeSActant1
            ? s1.actants?.find((a) => a.id === typeSActant1.actant)
            : false;

          const typeActant2 = typeSActant2
            ? s2.actants?.find((a) => a.id === typeSActant2.actant)
            : false;

          if (
            typeActant1 === false ||
            typeSActant1?.actant === "" ||
            !typeActant1
          ) {
            return 1;
          } else if (
            typeActant2 === false ||
            typeSActant2?.actant === "" ||
            !typeActant2
          ) {
            return -1;
          } else {
            return typeActant1.label > typeActant2.label ? 1 : -1;
          }
        }
      );
      return sorteMetaStatements;
    } else {
      return [];
    }
  }, [actant]);

  const actantsCreateMutation = useMutation(
    async (newStatement: IStatement) => await api.actantsCreate(newStatement),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("actant");
      },
    }
  );

  const actantsDeleteMutation = useMutation(
    async (metaStatementId: string) => await api.actantsDelete(metaStatementId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("actant");
      },
    }
  );

  const allEntityTypes = entitiesDict.map((ent) => ent.value);

  const allEntitiesOption = {
    value: "*",
    label: "*",
    info: "",
  };
  const entityOptions = [...entitiesDict] as any;
  entityOptions.push(allEntitiesOption);

  // TODO: what is metastatement?!
  const updateMetaStatementMutation = useMutation(
    async (metaStatementObject: { metaStatementId: string; changes: object }) =>
      await api.actantsUpdate(metaStatementObject.metaStatementId, {
        data: metaStatementObject.changes,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["actant"]);
      },
    }
  );

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

  return (
    <>
      {actant && (
        <StyledContent type={actant.class}>
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
                        isMulti={true}
                        options={entitiesDict}
                        value={entitiesDict.filter((i: any) =>
                          actant.data.entities.s.includes(i.value)
                        )}
                        width="full"
                        noOptionsMessage={() => "* any"}
                        placeholder={"* any"}
                        hideSelectedOptions={true}
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
                        value={actant.data.valencies.s}
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
                        isMulti={true}
                        options={entitiesDict}
                        value={entitiesDict.filter((i: any) =>
                          actant.data.entities.a1.includes(i.value)
                        )}
                        placeholder={"* any"}
                        width="full"
                        hideSelectedOptions={true}
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
                        value={actant.data.valencies.a1}
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
                        isMulti={true}
                        options={entitiesDict}
                        value={entitiesDict.filter((i: any) =>
                          actant.data.entities.a2.includes(i.value)
                        )}
                        hideSelectedOptions={true}
                        placeholder={"* any"}
                        width="full"
                        onChange={(newValue: any) => {
                          const oldData = { ...actant.data };
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
                        value={actant.data.valencies.a2}
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

          {/* meta statements section */}
          <StyledDetailSection>
            <StyledDetailSectionHeader>
              Meta statements
            </StyledDetailSectionHeader>
            <StyledDetailSectionContent>
              <ActantDetailMetaTable
                userCanEdit={userCanEdit}
                metaStatements={metaStatements}
                updateMetaStatement={updateMetaStatementMutation}
                removeMetaStatement={actantsDeleteMutation}
              />
              {userCanEdit && (
                <Button
                  color="primary"
                  label="create new meta statement"
                  icon={<FaPlus />}
                  onClick={async () => {
                    const newStatement = CMetaStatement(
                      actant.id,
                      localStorage.getItem("userrole") as UserRole
                    );

                    actantsCreateMutation.mutate(newStatement);
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
        </StyledContent>
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
          actantsCreateMutation.isLoading ||
          actantsDeleteMutation.isLoading ||
          updateActantMutation.isLoading ||
          deleteActantMutation.isLoading ||
          updateMetaStatementMutation.isLoading
        }
      />
    </>
  );
};
