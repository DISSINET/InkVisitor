import { Checkbox, Input } from "components";
import React from "react";
import { ITerritoryFilter } from "types";
import {
  StyledFilterList,
  StyledFilterWrap,
} from "./TerritoryTreeFilterStyles";

interface TerritoryTreeFilter {
  filterData: ITerritoryFilter;
  handleFilterChange: (
    key: keyof ITerritoryFilter,
    value: boolean | string
  ) => void;
}
export const TerritoryTreeFilter: React.FC<TerritoryTreeFilter> = ({
  filterData,
  handleFilterChange,
}) => {
  return (
    <StyledFilterWrap>
      <StyledFilterList>
        <Checkbox
          label="non empty"
          value={filterData.nonEmpty}
          onChangeFn={(value: boolean) => handleFilterChange("nonEmpty", value)}
        />
        <Checkbox
          label="starred"
          value={filterData.starred}
          onChangeFn={(value: boolean) => handleFilterChange("starred", value)}
        />
        <Checkbox
          label="editor rights"
          value={filterData.editorRights}
          onChangeFn={(value: boolean) =>
            handleFilterChange("editorRights", value)
          }
        />
        <Input
          value={filterData.filter}
          onChangeFn={(value: string) => handleFilterChange("filter", value)}
          changeOnType
        />
      </StyledFilterList>
    </StyledFilterWrap>
  );
};
