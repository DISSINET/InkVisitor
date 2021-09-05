import React, { useEffect, useState, useMemo } from "react";
const queryString = require("query-string");

import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Loader,
  MultiInput,
} from "components";
import {
  StyledContent,
  StyledSection,
  StyledSectionHeader,
  StyledSectionUsedTable,
  StyledHeaderColumn,
  StyledSectionUsedTableCell,
  StyledSectionMetaTable,
  StyledSectionMetaTableButtonGroup,
  StyledSectionMetaTableCell,
  StyledContentRow,
  StyledForm,
  StyledSectionUsedText,
  StyledSectionUsedPageManager,
  StyledContentRowLabel,
  StyledContentRowValue,
  StyledActantPreviewRow,
  StyledTagWrap,
} from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  IActant,
  IOption,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import {
  FaEdit,
  FaPlus,
  FaUnlink,
  FaTrashAlt,
  FaStepBackward,
  FaStepForward,
  FaRecycle,
} from "react-icons/fa";
import {
  ActantTag,
  ActionDropdown,
  ActantSuggester,
  ElvlToggle,
  CertaintyToggle,
} from "..";

import { CMetaStatement, CStatementActant } from "constructors";
import { findPositionInStatement } from "utils";
import { ActantDetailMetaTableRow } from "./ActantDetailMetaTableRow/ActantDetailMetaTableRow";
import {
  actantLogicalTypeDict,
  actantStatusDict,
  languageDict,
  entitiesDict,
} from "@shared/dictionaries";
import { composeWithDevTools } from "redux-devtools-extension";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const actantId = hashParams.actant;

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
    { enabled: !!actantId && api.isLoggedIn() }
  );

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

  const actantMode = useMemo(() => {
    const actantClass = actant?.class;
    if (actantClass) {
      if (actantClass === "A") {
        return "action";
      } else if (actantClass === "T") {
        return "territory";
      } else if (actantClass === "R") {
        return "resource";
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

  const metaStatements = useMemo(() => {
    if (actant && actant.metaStatements) {
      const sorteMetaStatements = [...actant.metaStatements];
      sorteMetaStatements.sort(
        (s1: IResponseStatement, s2: IResponseStatement) => {
          const typeSActant1 = s1.data.actants.find((a) => a.position == "a1");
          const typeSActant2 = s2.data.actants.find((a) => a.position == "a1");
          const typeActant1 = typeSActant1
            ? s1.actants.find((a) => a.id === typeSActant1.actant)
            : false;

          const typeActant2 = typeSActant2
            ? s2.actants.find((a) => a.id === typeSActant2.actant)
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
  const actantsLabelUpdateMutation = useMutation(
    async (actantObject: { actantId: string; newLabel: string }) =>
      await api.actantsUpdate(actantObject.actantId, {
        label: actantObject.newLabel,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("actant");
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("bookmarks");
      },
    }
  );

  const actantsUpdateMutation = useMutation(
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
      onSuccess: () => {
        queryClient.invalidateQueries(["actant"]);
        // queryClient.invalidateQueries("statement");
        // queryClient.invalidateQueries("tree");
      },
    }
  );

  return (
    <>
      {actant && (
        <StyledContent>
          <StyledSection firstSection>
            <StyledSectionHeader>Actant detail</StyledSectionHeader>

            <StyledActantPreviewRow>
              <StyledTagWrap>
                <ActantTag actant={actant} propId={actant.id} />
              </StyledTagWrap>
              <ButtonGroup>
                <Button
                  color="danger"
                  icon={<FaTrashAlt />}
                  label="remove actant"
                  onClick={() => {
                    hashParams["actant"] = "";
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
                <Button
                  key="refresh"
                  icon={<FaRecycle size={14} />}
                  tooltip="refresh data"
                  color="info"
                  label="refresh"
                  onClick={() => {
                    queryClient.invalidateQueries(["actant"]);
                  }}
                />
              </ButtonGroup>
            </StyledActantPreviewRow>

            <StyledForm>
              <StyledContentRow>
                <StyledContentRowLabel>Label</StyledContentRowLabel>
                <StyledContentRowValue>
                  <Input
                    // width={200}
                    value={actant.label}
                    onChangeFn={async (newLabel: string) => {
                      if (newLabel !== actant.label) {
                        actantsLabelUpdateMutation.mutate({
                          actantId: actant.id,
                          newLabel: newLabel,
                        });
                      }
                    }}
                  />
                </StyledContentRowValue>
              </StyledContentRow>
              <StyledContentRow>
                <StyledContentRowLabel>Detail</StyledContentRowLabel>
                <StyledContentRowValue>
                  <Input
                    // width={200}
                    value={actant.detail}
                    onChangeFn={async (newValue: string) => {
                      updateActantMutation.mutate({ detail: newValue });
                    }}
                  />
                </StyledContentRowValue>
              </StyledContentRow>
              <StyledContentRow>
                <StyledContentRowLabel>Status</StyledContentRowLabel>
                <StyledContentRowValue>
                  <Input
                    value={actant.status}
                    type="select"
                    // width={200}
                    options={actantStatusDict}
                    onChangeFn={async (newValue: string) => {
                      updateActantMutation.mutate({ status: newValue });
                    }}
                  />
                </StyledContentRowValue>
              </StyledContentRow>
              <StyledContentRow>
                <StyledContentRowLabel>Language</StyledContentRowLabel>
                <StyledContentRowValue>
                  <Dropdown
                    isMulti={true}
                    width="full"
                    // width={200}
                    options={languageDict}
                    value={languageDict.filter((i: any) =>
                      actant.language.includes(i.value)
                    )}
                    onChange={(newValue: any) => {
                      updateActantMutation.mutate({
                        language: newValue
                          ? (newValue as string[]).map((v: any) => v.value)
                          : [],
                      });
                    }}
                  />
                </StyledContentRowValue>
              </StyledContentRow>
              {actantMode === "entity" && actant.data?.logicalType && (
                <StyledContentRow>
                  <StyledContentRowLabel>Logical Type</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Input
                      value={actant.data.logicalType}
                      type="select"
                      // width={200}
                      options={actantLogicalTypeDict}
                      onChangeFn={(newValue: string) => {
                        updateActantMutation.mutate({
                          data: { logicalType: newValue },
                        });
                      }}
                    />
                  </StyledContentRowValue>
                </StyledContentRow>
              )}

              {/* Actions */}
              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Valency subject</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Input
                      value={actant.data.valencies.s}
                      width={200}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}
              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Valency actant1</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Input
                      value={actant.data.valencies.a1}
                      width={200}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}
              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Valency actant2</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Input
                      value={actant.data.valencies.a2}
                      width={200}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}

              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Entity Subject</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Dropdown
                      isMulti={true}
                      options={entitiesDict}
                      value={entitiesDict.filter((i: any) =>
                        actant.data.entities.s.includes(i.value)
                      )}
                      width={200}
                      placeholder={"*"}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}
              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Entity Subject</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Dropdown
                      isMulti={true}
                      options={entitiesDict}
                      value={entitiesDict.filter((i: any) =>
                        actant.data.entities.a1.includes(i.value)
                      )}
                      width={200}
                      placeholder={"*"}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}
              {actantMode === "action" && (
                <StyledContentRow>
                  <StyledContentRowLabel>Entity Subject</StyledContentRowLabel>
                  <StyledContentRowValue>
                    <Dropdown
                      isMulti={true}
                      options={entitiesDict}
                      value={entitiesDict.filter((i: any) =>
                        actant.data.entities.a2.includes(i.value)
                      )}
                      width={200}
                      placeholder={"*"}
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
                  </StyledContentRowValue>
                </StyledContentRow>
              )}

              <StyledContentRow>
                <StyledContentRowLabel>Notes</StyledContentRowLabel>
                <StyledContentRowValue>
                  <MultiInput
                    values={actant.notes}
                    // width={200}
                    onChange={(newValues: string[]) => {
                      updateActantMutation.mutate({ notes: newValues });
                    }}
                  />
                </StyledContentRowValue>
              </StyledContentRow>
            </StyledForm>
          </StyledSection>
          <StyledSection>
            <StyledSectionHeader>Meta statements</StyledSectionHeader>
            <Button
              color="primary"
              label="create new meta statement"
              icon={<FaPlus />}
              onClick={async () => {
                const newStatement = CMetaStatement(actant.id);

                actantsCreateMutation.mutate(newStatement);
              }}
            />

            <StyledSectionMetaTable>
              {metaStatements.map((metaStatement: IResponseStatement) => {
                const typeSActant = metaStatement.data.actants.find(
                  (a) => a.position == "a1"
                );
                const valueSActant = metaStatement.data.actants.find(
                  (a) => a.position == "a2"
                );

                const typeActant = typeSActant
                  ? metaStatement.actants.find(
                      (a) => a.id === typeSActant.actant
                    )
                  : false;

                const valueActant = valueSActant
                  ? metaStatement.actants.find(
                      (a) => a.id === valueSActant.actant
                    )
                  : false;

                return (
                  typeSActant &&
                  valueSActant && (
                    <React.Fragment key={metaStatement.id}>
                      <ActantDetailMetaTableRow
                        actant={actant}
                        typeSActant={typeSActant}
                        typeActant={typeActant}
                        metaStatement={metaStatement}
                        valueSActant={valueSActant}
                        valueActant={valueActant}
                        actantsDeleteMutation={actantsDeleteMutation}
                        actantsUpdateMutation={actantsUpdateMutation}
                      />
                    </React.Fragment>
                  )
                );
              })}
            </StyledSectionMetaTable>
          </StyledSection>
          <StyledSection lastSection>
            <StyledSectionHeader>Used in statements:</StyledSectionHeader>
            <StyledSectionUsedPageManager>
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
            </StyledSectionUsedPageManager>
            <StyledSectionUsedTable>
              <StyledHeaderColumn></StyledHeaderColumn>
              <StyledHeaderColumn>Text</StyledHeaderColumn>
              <StyledHeaderColumn>Position</StyledHeaderColumn>
              <StyledHeaderColumn></StyledHeaderColumn>
              {usedInStatements.map((usedInStatement) => {
                const { statement, position } = usedInStatement;
                return (
                  <React.Fragment key={statement.id}>
                    <StyledSectionUsedTableCell>
                      <ActantTag key={statement.id} actant={statement} short />
                    </StyledSectionUsedTableCell>
                    <StyledSectionUsedTableCell>
                      <StyledSectionUsedText>
                        {statement.data.text}
                      </StyledSectionUsedText>
                    </StyledSectionUsedTableCell>
                    <StyledSectionUsedTableCell>
                      <StyledSectionUsedText>{position}</StyledSectionUsedText>
                    </StyledSectionUsedTableCell>
                    <StyledSectionMetaTableCell borderless>
                      <StyledSectionMetaTableButtonGroup>
                        <Button
                          key="r"
                          icon={<FaEdit size={14} />}
                          color="warning"
                          tooltip="edit statement"
                          onClick={async () => {
                            hashParams["statement"] = statement.id;
                            history.push({
                              hash: queryString.stringify(hashParams),
                            });
                          }}
                        />
                      </StyledSectionMetaTableButtonGroup>
                    </StyledSectionMetaTableCell>
                  </React.Fragment>
                );
              })}
            </StyledSectionUsedTable>
          </StyledSection>
        </StyledContent>
      )}
      <Loader
        show={
          isFetching ||
          actantsCreateMutation.isLoading ||
          actantsDeleteMutation.isLoading ||
          actantsLabelUpdateMutation.isLoading ||
          updateActantMutation.isLoading
        }
      />
    </>
  );
};
