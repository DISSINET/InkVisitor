import React from "react";

import {
  StyledActantList,
  StyledActantListItem,
  StyledListHeaderColumn,
} from "../StatementEditorBoxStyles";
import { IResponseStatement } from "@shared/types";
import { actantPositionDict } from "../../../../../../../shared/dictionaries";
import { ActantTag, ActantSuggester, CertaintyToggle, ElvlToggle } from "../..";
import { Input, Button } from "components";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import api from "api";
import { useQueryClient } from "react-query";

interface StatementEditorActantList {
  statement: IResponseStatement;
  statementId: string;
  classEntitiesActant: string[];
}
export const StatementEditorActantList: React.FC<StatementEditorActantList> = ({
  statement,
  statementId,
  classEntitiesActant,
}) => {
  const queryClient = useQueryClient();

  const updateActant = (statementActantId: string, changes: any) => {
    if (statement && statementActantId) {
      const updatedActants = statement.data.actants.map((a) =>
        a.id === statementActantId ? { ...a, ...changes } : a
      );
      const newData = { ...statement.data, ...{ actants: updatedActants } };
      update(newData);
    }
  };
  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { ...statement.data, ...{ actants: updatedActants } };
      update(newData);
    }
  };
  const update = async (changes: object) => {
    const res = await api.actantsUpdate(statementId, {
      data: changes,
    });
    queryClient.invalidateQueries(["statement"]);
  };

  return (
    <StyledActantList>
      <StyledListHeaderColumn>Actant</StyledListHeaderColumn>
      <StyledListHeaderColumn>Position</StyledListHeaderColumn>
      <StyledListHeaderColumn>Attributes</StyledListHeaderColumn>
      <StyledListHeaderColumn>Actions</StyledListHeaderColumn>
      {statement.data.actants.map((sActant, sai) => {
        const actant = statement.actants.find((a) => a.id === sActant.actant);
        return (
          <React.Fragment key={sai}>
            <StyledActantListItem>
              {actant ? (
                <ActantTag
                  actant={actant}
                  short={false}
                  button={
                    <Button
                      key="d"
                      tooltip="unlink actant"
                      icon={<FaUnlink />}
                      color="danger"
                      onClick={() => {
                        updateActant(sActant.id, {
                          actant: "",
                        });
                      }}
                    />
                  }
                />
              ) : (
                <ActantSuggester
                  onSelected={(newSelectedId: string) => {
                    updateActant(sActant.id, {
                      actant: newSelectedId,
                    });
                  }}
                  categoryIds={classEntitiesActant}
                />
              )}
            </StyledActantListItem>
            <StyledActantListItem>
              <Input
                type="select"
                value={sActant.position}
                options={actantPositionDict}
                onChangeFn={(newPosition: any) => {
                  updateActant(sActant.id, {
                    position: newPosition,
                  });
                }}
              ></Input>
            </StyledActantListItem>
            <StyledActantListItem>
              <ElvlToggle
                value={sActant.elvl}
                onChangeFn={(newValue: string) => {
                  updateActant(sActant.id, {
                    elvl: newValue,
                  });
                }}
              />
              <CertaintyToggle
                value={sActant.certainty}
                onChangeFn={(newValue: string) => {
                  updateActant(sActant.id, {
                    certainty: newValue,
                  });
                }}
              />
            </StyledActantListItem>
            <StyledActantListItem>
              <Button
                key="d"
                icon={<FaTrashAlt />}
                color="danger"
                tooltip="remove actant row"
                onClick={() => {
                  removeActant(sActant.id);
                }}
              />
            </StyledActantListItem>
          </React.Fragment>
        );
      })}
    </StyledActantList>
  );
};
