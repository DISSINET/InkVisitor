import React, { useEffect, useState } from "react";
const queryString = require("query-string");

import { Button, Input, Loader } from "components";
import {
  StyledContent,
  StyledSectionHeader,
  StyledSectionMeta,
  StyledSectionMetaTable,
  StyledSectionMetaTableButtonGroup,
  StyledSectionMetaTableCell,
  StyledContentRow,
} from "./ActandDetailBoxStyles";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { IActant, IOption, IResponseStatement } from "@shared/types";
import { FaTimes, FaPlus, FaUnlink, FaTrashAlt } from "react-icons/fa";
import {
  ActantTag,
  ActionDropdown,
  ActantSuggester,
  ElvlToggle,
  CertaintyToggle,
  ModalityToggle,
} from "..";

import { CMetaStatement, CStatementActant } from "constructors";
import { ActantType } from "@shared/enums";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const actantId = hashParams.actant;

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

  return (
    <>
      {actant && (
        <StyledContent>
          <StyledSectionHeader>
            <h4>Actant detail</h4>
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
              <Button
                color="danger"
                icon={<FaTrashAlt />}
                onClick={() => {
                  hashParams["actant"] = "";
                  history.push({
                    hash: queryString.stringify(hashParams),
                  });
                  // TODO: remove actant from URL
                }}
              />
            </StyledContentRow>
          </StyledSectionHeader>
          <StyledSectionMeta>
            <h4>Meta statements</h4>
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
              {actant.metaStatements.map(
                (metaStatement: IResponseStatement) => {
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

                  // console.log(
                  //   "meta statement",
                  //   metaStatement.id,
                  //   metaStatement,
                  //   valueActant
                  // );

                  return (
                    <React.Fragment key={metaStatement.id}>
                      <StyledSectionMetaTableCell>
                        {/* <ActionDropdown
                          onSelectedChange={(newActionValue: {
                            value: string;
                            label: string;
                          }) => {}}
                          width={200}
                          value={metaStatement.data.action}
                        /> */}
                      </StyledSectionMetaTableCell>

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
                                  onClick={() => {}}
                                />
                              }
                            />
                            <StyledSectionMetaTableButtonGroup>
                              <ElvlToggle
                                value={typeSActant.elvl}
                                onChangeFn={(newValue: string) => {
                                  // updateProp(prop.id, {
                                  //   type: {
                                  //     ...prop.type,
                                  //     ...{ elvl: newValue },
                                  //   },
                                  // });
                                }}
                              />
                              <CertaintyToggle
                                value={typeSActant.certainty}
                                onChangeFn={(newValue: string) => {
                                  // updateProp(prop.id, {
                                  //   type: {
                                  //     ...prop.type,
                                  //     ...{ certainty: newValue },
                                  //   },
                                  // });
                                }}
                              />
                            </StyledSectionMetaTableButtonGroup>
                          </React.Fragment>
                        ) : (
                          <ActantSuggester
                            onSelected={async (newActantId: string) => {
                              const newStatementActant = CStatementActant();
                              newStatementActant.actant = newActantId;
                              newStatementActant.position = "a1";
                              const newData = {
                                actants: [
                                  ...metaStatement.data.actants,
                                  newStatementActant,
                                ],
                              };
                              const res = await api.actantsUpdate(
                                metaStatement.id,
                                {
                                  data: newData,
                                }
                              );
                              queryClient.invalidateQueries(["actant"]);
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
                                  onClick={() => {}}
                                />
                              }
                            />
                            <StyledSectionMetaTableButtonGroup>
                              <ElvlToggle
                                value={valueSActant.elvl}
                                onChangeFn={(newValue: string) => {
                                  // updateProp(prop.id, {
                                  //   type: {
                                  //     ...prop.type,
                                  //     ...{ elvl: newValue },
                                  //   },
                                  // });
                                }}
                              />
                              <CertaintyToggle
                                value={valueSActant.certainty}
                                onChangeFn={(newValue: string) => {
                                  // updateProp(prop.id, {
                                  //   type: {
                                  //     ...prop.type,
                                  //     ...{ certainty: newValue },
                                  //   },
                                  // });
                                }}
                              />
                            </StyledSectionMetaTableButtonGroup>
                          </React.Fragment>
                        ) : (
                          <ActantSuggester
                            onSelected={async (newActantId: string) => {
                              const newStatementActant = CStatementActant();
                              newStatementActant.actant = newActantId;
                              newStatementActant.position = "a2";
                              const newData = {
                                actants: [
                                  ...metaStatement.data.actants,
                                  newStatementActant,
                                ],
                              };
                              const res = await api.actantsUpdate(
                                metaStatement.id,
                                {
                                  data: newData,
                                }
                              );
                              queryClient.invalidateQueries(["actant"]);
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
                              // updateProp(prop.id, {
                              //   modality: newValue,
                              // });
                            }}
                          />
                          <ElvlToggle
                            value={metaStatement.data.elvl}
                            onChangeFn={(newValue: string) => {
                              // updateProp(prop.id, {
                              //   elvl: newValue,
                              // });
                            }}
                          />
                          <CertaintyToggle
                            value={metaStatement.data.certainty}
                            onChangeFn={(newValue: string) => {
                              // updateProp(prop.id, {
                              //   certainty: newValue,
                              // });
                            }}
                          />
                        </StyledSectionMetaTableButtonGroup>
                      </StyledSectionMetaTableCell>
                      {/* actions */}
                      <StyledSectionMetaTableCell>
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
                  );
                }
              )}
            </StyledSectionMetaTable>
          </StyledSectionMeta>
        </StyledContent>
      )}
      <Loader show={isFetching} />
    </>
  );
};
