import { IResponseUser } from "@shared/types";
import api from "api";
import { Suggester } from "components";
import { UserSuggestionI } from "components/Suggester/Suggester";
import { useDebounce } from "hooks";
import React, { useState } from "react";
import { DragObjectWithType } from "react-dnd";
import { useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";

interface UserSuggester {
  placeholder?: string;
  inputWidth?: number | "full";
}
export const UserSuggester: React.FC<UserSuggester> = ({
  placeholder,
  inputWidth,
}) => {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState<string>("");
  const debouncedTyped = useDebounce(typed, 100);

  // Suggesions query
  const {
    status: statusStatement,
    data: suggestions,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["suggestion", debouncedTyped],
    async () => {
      const resSuggestions = await api.usersGetMore({
        label: debouncedTyped,
      });

      return resSuggestions.data.map((u: IResponseUser) => {
        return {
          id: u.id,
          label: u.name,
        };
      });
    },
    {
      enabled: debouncedTyped.length > 1 && api.isLoggedIn(),
    }
  );

  const handleClean = () => {
    setTyped("");
  };

  const handlePick = (newPicked: UserSuggestionI) => {
    console.log(newPicked);
  };

  return (
    <Suggester
      isFetching={isFetchingStatement}
      marginTop={false}
      suggestions={suggestions || []}
      placeholder={placeholder}
      typed={typed} // input value
      category={{ label: "U", value: "U" }} // selected category
      categories={[{ label: "U", value: "U" }]} // all possible categories
      onCancel={() => {
        handleClean();
      }}
      //disabled?: boolean; // todo not implemented yet
      onType={(newType: string) => {
        setTyped(newType);
      }}
      onChangeCategory={(option: ValueType<OptionTypeBase, any>) => {}}
      onPick={(newPicked: UserSuggestionI) => {
        handlePick(newPicked);
      }}
      inputWidth={inputWidth}
    />
  );
};
