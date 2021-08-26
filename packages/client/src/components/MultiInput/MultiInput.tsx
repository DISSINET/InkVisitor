import React, { useState } from "react";

import { Button, Input } from "components";
import { IResponseStatement } from "@shared/types";
import { useMutation, useQueryClient } from "react-query";
import api from "api";
import { FaPlus } from "react-icons/fa";

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
    // updateStatementMutation.mutate({ notes: newData });
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

  return (
    <>
      {data?.map((text, key) => {
        return (
          <Input
            key={key}
            type="textarea"
            width={1000}
            // changeOnType
            onChangeFn={(newValue: string) => {
              if (text !== newValue) {
                console.log(key, newValue);
                handleChange(key, newValue);
                // update(newData);
              }
            }}
            value={text}
          />
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
