import { UserEnums } from "@inkvisitor/shared/enums";
import { Checkbox, Input } from "components";
import { AttributeButtonGroup } from "components/advanced";
import { useTheme } from "hooks";
import React from "react";
import { ITerritoryFilter } from "types";
import {
  StyledFilterList,
  StyledFilterWrap,
  StyledInputWrap,
  StyledLogicalOperator,
} from "./TerritoryTreeFilterStyles";
import { BiSearch } from "react-icons/bi";

interface TerritoryTreeFilter {
  filterData: ITerritoryFilter;
  handleFilterChange: (key: keyof ITerritoryFilter, value: boolean | string) => void;
  userRole: string | null;
}
export const TerritoryTreeFilter: React.FC<TerritoryTreeFilter> = ({
  filterData,
  handleFilterChange,
  userRole,
}) => {
  return (
    <StyledFilterWrap>
      <StyledLogicalOperator>
        <AttributeButtonGroup
          fullWidth
          options={[
            {
              longValue: "OR",
              shortValue: "OR",
              onClick: () => handleFilterChange("operator", "or"),
              selected: filterData.operator === "or",
            },
            {
              longValue: "AND",
              shortValue: "AND",
              onClick: () => handleFilterChange("operator", "and"),
              selected: filterData.operator === "and",
            },
          ]}
        />
      </StyledLogicalOperator>
      <StyledFilterList>
        {/* Only for non admin users */}
        {userRole !== UserEnums.Role.Admin && userRole !== UserEnums.Role.Owner && (
          <Checkbox
            label="editor rights"
            value={filterData.editorRights}
            onChangeFn={(value: boolean) => handleFilterChange("editorRights", value)}
          />
        )}
        <Checkbox
          label="with subterritories"
          value={filterData.withSubterritories}
          onChangeFn={(value: boolean) => handleFilterChange("withSubterritories", value)}
          tooltipLabel="first-level Territories (directly under root) which have sub-Territories"
        />
        <Checkbox
          label="with statements"
          value={filterData.withStatements}
          onChangeFn={(value: boolean) => handleFilterChange("withStatements", value)}
        />
        <StyledInputWrap>
          <Input
            value={filterData.filter}
            placeholder="Filter by text"
            onChangeFn={(value: string) => handleFilterChange("filter", value)}
            changeOnType
            width="full"
            clearable
            icon={<BiSearch />}
          />
        </StyledInputWrap>
      </StyledFilterList>
    </StyledFilterWrap>
  );
};
