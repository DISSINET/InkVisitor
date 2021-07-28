import React from "react";
import { OptionTypeBase, ValueType } from "react-select";

import { Dropdown, Input, Suggester } from "components";
import {
  StyledBoxContent,
  StyledRow,
  StyledRowHeader,
} from "./ActantSearchBoxStyles";
import { ActantSuggester } from "..";

const classes = ["C", "P", "G", "O", "L", "V", "E", "T", "R"];
const classesActants = ["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"];

export const ActantSearchBox: React.FC = () => {
  const options = classes.map((c: string) => {
    return { label: c, value: c };
  });
  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>class</StyledRowHeader>
        <Dropdown
          onChange={(option: ValueType<OptionTypeBase>) => console.log(option)}
          options={options}
          width={80}
          placeholder={""}
          isClearable
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>label</StyledRowHeader>
        <Input
          changeOnType
          onChangeFn={(value: string) => console.log(value)}
          placeholder="search"
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>used with action</StyledRowHeader>
        <ActantSuggester
          categoryIds={classesActants}
          onSelected={(newSelectedId: string) => {
            console.log(newSelectedId);
          }}
          placeholder={"actant"}
          allowCreate={false}
        />
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>used with actant</StyledRowHeader>
        <ActantSuggester
          categoryIds={classesActants}
          onSelected={(newSelectedId: string) => {
            console.log(newSelectedId);
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
