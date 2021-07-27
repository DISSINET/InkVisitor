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
  ModalityToggle,
} from "..";

import { CMetaStatement, CStatementActant } from "constructors";
import { findPositionInStatement } from "utils";
import { ActantDetailMetaTableRow } from "./ActantDetailMetaTableRow/ActantDetailMetaTableRow";

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

  const actantsCreateMutation = useMutation(
    async (newStatement: IStatement) => await api.actantsCreate(newStatement),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["actant"]);
      },
    }
  );

  const actantsDeleteMutation = useMutation(
    async (metaStatementId: string) => await api.actantsDelete(metaStatementId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["actant"]);
      },
    }
  );

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
                  if (newLabel !== actant.label) {
                    const res = await api.actantsUpdate(actant.id, {
                      label: newLabel,
                    });
                    if (res.status === 200) {
                      queryClient.invalidateQueries(["actant"]);
                      queryClient.invalidateQueries(["statement"]);
                      queryClient.invalidateQueries(["tree"]);
                      queryClient.invalidateQueries(["territory"]);
                      queryClient.invalidateQueries(["bookmarks"]);
                    }
                  }
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
      <Loader
        show={
          isFetching ||
          actantsCreateMutation.isLoading ||
          actantsDeleteMutation.isLoading
        }
      />
    </>
  );
};
