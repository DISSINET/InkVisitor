import React, { useEffect, useState, useMemo } from "react";
const queryString = require("query-string");

import { Button, ButtonGroup, Input, Loader } from "components";
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
  StyledSectionUsedText,
  StyledSectionUsedPageManager,
} from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { QueryClient, useQuery, useQueryClient } from "react-query";
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
  FaRecycle
} from "react-icons/fa";
import {
  ActantTag,
  ActionDropdown,
  ActantSuggester,
  ElvlToggle,
  CertaintyToggle,
  ModalityToggle,
} from "..";

import { CMetaStatement, CStatementActant } from "constructors";
import { findPositionInStatement } from "utils";

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

  const updateStatementActant = async (
    statementId: string,
    actantId: string,
    changes: any
  ) => {
    const metaStatement =
      actant && actant.metaStatements.find((ms) => ms.id === statementId);

    if (metaStatement) {
      const metaStatementData = { ...metaStatement.data };

      const updatedStatementActants = metaStatementData.actants.map((actant) =>
        actant.id === actantId ? { ...actant, ...changes } : actant
      );

      const res = await api.actantsUpdate(statementId, {
        data: { ...metaStatementData, ...{ actants: updatedStatementActants } },
      });
      queryClient.invalidateQueries(["actant"]);
    }
  };

  const updateStatementAttribute = async (
    statementId: string,
    changes: any
  ) => {
    const metaStatement =
      actant && actant.metaStatements.find((ms) => ms.id === statementId);

    if (metaStatement) {
      const res = await api.actantsUpdate(statementId, {
        data: { ...metaStatement.data, ...changes },
      });
      queryClient.invalidateQueries(["actant"]);
    }
  };

  return (
    <>
      {actant && (
        <StyledContent>
          <StyledSection firstSection>
            <StyledSectionHeader>Actant detail</StyledSectionHeader>
            <StyledContentRow>
              <ActantTag actant={actant} propId={actant.id} />
              <Input
                value={actant.label}
                onChangeFn={async (newLabel: string) => {
                  const res = await api.actantsUpdate(actant.id, {
                    ...actant,
                    ...{ label: newLabel },
                  });
                  queryClient.invalidateQueries(["actant"]);
                  queryClient.invalidateQueries(["statement"]);
                  queryClient.invalidateQueries(["tree"]);
                  queryClient.invalidateQueries(["territory"]);
                }}
              />
              <ButtonGroup>
              <Button
                color="danger"
                icon={<FaTrashAlt />}
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
            </StyledContentRow>
          </StyledSection>
          <StyledSection>
            <StyledSectionHeader>Meta statements</StyledSectionHeader>
            <Button
              color="primary"
              label="create new meta statement"
              icon={<FaPlus />}
              onClick={async () => {
                const newStatement = CMetaStatement(actant.id);
                const res = await api.actantsCreate(newStatement);

                queryClient.invalidateQueries(["actant"]);
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
                      <StyledSectionMetaTableCell></StyledSectionMetaTableCell>

                      {/* type */}
                      <StyledSectionMetaTableCell>
                        {typeSActant && typeActant ? (
                          <React.Fragment>
                            <ActantTag
                              actant={typeActant}
                              short={false}
                              button={
                                <Button
                                  key="d"
                                  icon={<FaUnlink />}
                                  tooltip="unlink actant"
                                  color="danger"
                                  onClick={() => {
                                    updateStatementActant(
                                      metaStatement.id,
                                      typeSActant.id,
                                      { actant: "" }
                                    );
                                  }}
                                />
                              }
                            />
                            <StyledSectionMetaTableButtonGroup>
                              <ElvlToggle
                                value={typeSActant.elvl}
                                onChangeFn={(newValue: string) => {
                                  updateStatementActant(
                                    metaStatement.id,
                                    typeSActant.id,
                                    { elvl: newValue }
                                  );
                                }}
                              />
                              <CertaintyToggle
                                value={typeSActant.certainty}
                                onChangeFn={(newValue: string) => {
                                  updateStatementActant(
                                    metaStatement.id,
                                    typeSActant.id,
                                    { certainty: newValue }
                                  );
                                }}
                              />
                            </StyledSectionMetaTableButtonGroup>
                          </React.Fragment>
                        ) : (
                          <ActantSuggester
                            onSelected={async (newActantId: string) => {
                              updateStatementActant(
                                metaStatement.id,
                                typeSActant.id,
                                { actant: newActantId }
                              );
                            }}
                            categoryIds={["C"]}
                            placeholder={"add new reference"}
                          ></ActantSuggester>
                        )}
                      </StyledSectionMetaTableCell>

                      {/* value */}
                      <StyledSectionMetaTableCell>
                        {valueSActant && valueActant ? (
                          <React.Fragment>
                            <ActantTag
                              actant={valueActant}
                              short={false}
                              button={
                                <Button
                                  key="d"
                                  icon={<FaUnlink />}
                                  tooltip="unlink actant"
                                  color="danger"
                                  onClick={() => {
                                    updateStatementActant(
                                      metaStatement.id,
                                      valueSActant.id,
                                      { actant: "" }
                                    );
                                  }}
                                />
                              }
                            />
                            <StyledSectionMetaTableButtonGroup>
                              <ElvlToggle
                                value={valueSActant.elvl}
                                onChangeFn={(newValue: string) => {
                                  updateStatementActant(
                                    metaStatement.id,
                                    valueSActant.id,
                                    { elvl: newValue }
                                  );
                                }}
                              />
                              <CertaintyToggle
                                value={valueSActant.certainty}
                                onChangeFn={(newValue: string) => {
                                  updateStatementActant(
                                    metaStatement.id,
                                    valueSActant.id,
                                    { certainty: newValue }
                                  );
                                }}
                              />
                            </StyledSectionMetaTableButtonGroup>
                          </React.Fragment>
                        ) : (
                          <ActantSuggester
                            onSelected={async (newActantId: string) => {
                              updateStatementActant(
                                metaStatement.id,
                                valueSActant.id,
                                { actant: newActantId }
                              );
                            }}
                            categoryIds={[
                              "P",
                              "G",
                              "O",
                              "C",
                              "L",
                              "V",
                              "E",
                              "S",
                              "T",
                              "R",
                            ]}
                            placeholder={"add new reference"}
                          ></ActantSuggester>
                        )}
                      </StyledSectionMetaTableCell>

                      {/* attributes of statement */}
                      <StyledSectionMetaTableCell>
                        <StyledSectionMetaTableButtonGroup>
                          <ModalityToggle
                            value={metaStatement.data.modality}
                            onChangeFn={(newValue: string) => {
                              updateStatementAttribute(metaStatement.id, {
                                modality: newValue,
                              });
                            }}
                          />
                          <ElvlToggle
                            value={metaStatement.data.elvl}
                            onChangeFn={(newValue: string) => {
                              updateStatementAttribute(metaStatement.id, {
                                elvl: newValue,
                              });
                            }}
                          />
                          <CertaintyToggle
                            value={metaStatement.data.certainty}
                            onChangeFn={(newValue: string) => {
                              updateStatementAttribute(metaStatement.id, {
                                certainty: newValue,
                              });
                            }}
                          />
                        </StyledSectionMetaTableButtonGroup>
                      </StyledSectionMetaTableCell>
                      {/* actions */}
                      <StyledSectionMetaTableCell borderless>
                        <StyledSectionMetaTableButtonGroup>
                          <Button
                            key="r"
                            icon={<FaTrashAlt size={14} />}
                            color="danger"
                            tooltip="delete"
                            onClick={async () => {
                              const res = await api.actantsDelete(
                                metaStatement.id
                              );
                              queryClient.invalidateQueries(["actant"]);
                            }}
                          />
                        </StyledSectionMetaTableButtonGroup>
                      </StyledSectionMetaTableCell>
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
                //console.log(actant.usedIn);
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
      <Loader show={isFetching} />
    </>
  );
};
