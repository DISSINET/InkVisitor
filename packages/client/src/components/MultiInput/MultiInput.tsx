import React, { useState } from "react";

import { Button, Input } from "components";
import { IResponseStatement } from "@shared/types";
import { useMutation, useQueryClient } from "react-query";
import api from "api";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { StyledRow } from "./MultiInputStyles";

const testTextArr = [
  "dasdasdads",
  "Asda DKLlkd Podowi Qewieo qiuda",
  "X V F skdjl aksjl fsa kljf opwi qp",
];
interface MultiInput {
  statement: IResponseStatement;
}
export const MultiInput: React.FC<MultiInput> = ({ statement }) => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<string[]>(statement.notes || []);

  const handleChange = (key: number, value: string) => {
    const newData: string[] = [...data];
    newData[key] = value;
    updateStatementMutation.mutate({ notes: newData });
    setData(newData);
  };

  const updateStatementMutation = useMutation(
    async (changes: object) =>
      await api.actantsUpdate(statement.id, {
        data: changes,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["statement"]);
      },
    }
  );

  const handleDelete = (key: number) => {
    const newData = data;
    newData.splice(key, 1);
    updateStatementMutation.mutate({ notes: newData });
  };

  return (
    <>
      {data?.map((text, key) => {
        return (
          <StyledRow key={key}>
            <Input
              key={key}
              type="textarea"
              width={1000}
              onChangeFn={(newValue: string) => {
                if (text !== newValue) {
                  handleChange(key, newValue);
                }
              }}
              value={text}
            />
            <div style={{ display: "flex" }}>
              <Button
                color="danger"
                icon={<FaTrashAlt />}
                onClick={() => handleDelete(key)}
              />
            </div>
          </StyledRow>
        );
      })}
      <Button
        icon={<FaPlus />}
        label={"New note"}
        onClick={() =>
          updateStatementMutation.mutate({ notes: [...statement.notes, ""] })
        }
      />
    </>
  );
};
