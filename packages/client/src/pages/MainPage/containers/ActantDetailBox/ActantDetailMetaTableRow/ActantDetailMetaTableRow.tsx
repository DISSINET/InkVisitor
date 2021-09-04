import React from "react";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { AxiosResponse } from "axios";
import { StatementEditorAttributes } from "./../../StatementEditorBox/StatementEditorAttributes/StatementEditorAttributes";

import { Button } from "components";
import {
  IActant,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
  IStatementActant,
} from "@shared/types";
import { ActantSuggester, ActantTag, CertaintyToggle, ElvlToggle } from "../..";
import {
  StyledSectionMetaTableButtonGroup,
  StyledSectionMetaTableCell,
} from "../ActandDetailBoxStyles";
import api from "api";

interface ActantDetailMetaTableRow {
  actant: IResponseDetail;
  typeSActant: IStatementActant;
  typeActant?: false | IActant;
  metaStatement: IResponseStatement;
  valueSActant: IStatementActant;
  valueActant?: false | IActant;
  actantsDeleteMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;
  actantsUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      metaStatementId: string;
      changes: object;
    },
    unknown
  >;
}
export const ActantDetailMetaTableRow: React.FC<ActantDetailMetaTableRow> = ({
  actant,
  typeSActant,
  typeActant,
  metaStatement,
  valueSActant,
  valueActant,
  actantsDeleteMutation,
  actantsUpdateMutation,
}) => {
  const queryClient = useQueryClient();

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

      actantsUpdateMutation.mutate({
        metaStatementId: metaStatement.id,
        changes: {
          ...metaStatementData,
          ...{ actants: updatedStatementActants },
        },
      });
    }
  };

  const updateStatementAttribute = async (
    statementId: string,
    changes: any
  ) => {
    const metaStatement =
      actant && actant.metaStatements.find((ms) => ms.id === statementId);

    if (metaStatement) {
      actantsUpdateMutation.mutate({
        metaStatementId: metaStatement.id,
        changes: { ...metaStatement.data, ...changes },
      });
    }
  };

  return (
    <>
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
                    updateStatementActant(metaStatement.id, typeSActant.id, {
                      actant: "",
                    });
                  }}
                />
              }
            />
            <StyledSectionMetaTableButtonGroup>
              <ElvlToggle
                value={typeSActant.elvl}
                onChangeFn={(newValue: string) => {
                  updateStatementActant(metaStatement.id, typeSActant.id, {
                    elvl: newValue,
                  });
                }}
              />
            </StyledSectionMetaTableButtonGroup>
          </React.Fragment>
        ) : (
          <ActantSuggester
            onSelected={async (newActantId: string) => {
              updateStatementActant(metaStatement.id, typeSActant.id, {
                actant: newActantId,
              });
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
                    updateStatementActant(metaStatement.id, valueSActant.id, {
                      actant: "",
                    });
                  }}
                />
              }
            />
            <StyledSectionMetaTableButtonGroup>
              <ElvlToggle
                value={valueSActant.elvl}
                onChangeFn={(newValue: string) => {
                  updateStatementActant(metaStatement.id, valueSActant.id, {
                    elvl: newValue,
                  });
                }}
              />
            </StyledSectionMetaTableButtonGroup>
          </React.Fragment>
        ) : (
          <ActantSuggester
            onSelected={async (newActantId: string) => {
              updateStatementActant(metaStatement.id, valueSActant.id, {
                actant: newActantId,
              });
            }}
            categoryIds={["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"]}
            placeholder={"add new reference"}
          ></ActantSuggester>
        )}
      </StyledSectionMetaTableCell>

      {/* attributes of statement */}
      <StyledSectionMetaTableCell>
        <StyledSectionMetaTableButtonGroup></StyledSectionMetaTableButtonGroup>
      </StyledSectionMetaTableCell>
      {/* actions */}
      <StyledSectionMetaTableCell borderless>
        <StyledSectionMetaTableButtonGroup>
          <Button
            key="r"
            icon={<FaTrashAlt size={14} />}
            color="danger"
            tooltip="delete"
            onClick={() => actantsDeleteMutation.mutate(metaStatement.id)}
          />
        </StyledSectionMetaTableButtonGroup>
      </StyledSectionMetaTableCell>
    </>
  );
};
