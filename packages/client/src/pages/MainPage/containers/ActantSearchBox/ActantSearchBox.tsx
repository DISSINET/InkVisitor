import React from "react";
import { OptionTypeBase, ValueType } from "react-select";

import { Dropdown, Input, Suggester } from "components";
import {
  StyledBoxContent,
  StyledRow,
  StyledRowHeader,
} from "./ActantSearchBoxStyles";

export const ActantSearchBox: React.FC = () => {
  return (
    <StyledBoxContent>
      <StyledRow>
        <StyledRowHeader>class</StyledRowHeader>
        <Dropdown
          onChange={(option: ValueType<OptionTypeBase>) => console.log(option)}
          // options={}
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
        {/* <Suggester  /> */}
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>used with actant</StyledRowHeader>
        {/* <Suggester  /> */}
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>
          <b>Results:</b>
        </StyledRowHeader>
      </StyledRow>
    </StyledBoxContent>
  );
};
