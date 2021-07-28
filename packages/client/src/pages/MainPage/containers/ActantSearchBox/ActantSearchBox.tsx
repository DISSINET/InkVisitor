import React, { useEffect, useState } from "react";
import { OptionTypeBase, ValueType } from "react-select";

import { Dropdown, Input, Suggester } from "components";
import {
  StyledBoxContent,
  StyledRow,
  StyledRowHeader,
} from "./ActantSearchBoxStyles";
import { ActantSuggester } from "..";
import { useMutation } from "react-query";
import api from "api";
import { IRequestSearch } from "types";

const classes = ["C", "P", "G", "O", "L", "V", "E", "T", "R"];
const classesActants = ["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"];

const initValues: IRequestSearch = {
  class: null,
  actantId: "",
  label: "",
};

export const ActantSearchBox: React.FC = () => {
  const [data, setData] = useState<IRequestSearch>(initValues);

  const handleChange = (
    key: string,
    value: string | ValueType<OptionTypeBase>
  ) => {
    setData({
      ...data,
      [key]: value,
    });
  };

  useEffect(() => {
    if (data.actantId || data.label || data.class) {
      searchActantsMutation.mutate(data);
    } else {
      // Clear search results
    }
  }, [data]);

  const searchActantsMutation = useMutation(
    async (searchData: IRequestSearch) => api.actantsSearch(searchData),
    {
      onSuccess: (data) => {
        console.log(data.data);
      },
    }
  );

  const options = classes.map((c: string) => {
    return { label: c, value: c };
  });
  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>class</StyledRowHeader>
        <Dropdown
          placeholder={""}
          width={80}
          isClearable
          options={options}
          onChange={(option: ValueType<OptionTypeBase>) => {
            handleChange("class", option);
          }}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>label</StyledRowHeader>
        <Input
          placeholder="search"
          changeOnType
          onChangeFn={(value: string) => handleChange("label", value)}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>used with actant</StyledRowHeader>
        <ActantSuggester
          categoryIds={classesActants}
          onSelected={(newSelectedId: string) => {
            handleChange("actantId", newSelectedId);
          }}
          placeholder={"actant"}
          allowCreate={false}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>
          <b>Results:</b>
        </StyledRowHeader>
      </StyledRow>
    </StyledBoxContent>
  );
};
