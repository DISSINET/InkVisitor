import { UserEnums } from "@inkvisitor/shared/enums";
import { Checkbox, Input } from "components";
import { AttributeButtonGroup } from "components/advanced";
import { useTheme } from "hooks";
import React from "react";
import { FaSearch } from "react-icons/fa";
import { ITerritoryFilter } from "types";
import {
  StyledFilterList,
  StyledFilterWrap,
  StyledInputWrap,
} from "./TerritoryTreeFilterStyles";

interface TerritoryTreeFilter {
  filterData: ITerritoryFilter;
  handleFilterChange: (
    key: keyof ITerritoryFilter,
    value: boolean | string
  ) => void;
  userRole: string | null;
}
export const TerritoryTreeFilter: React.FC<TerritoryTreeFilter> = ({
  filterData,
  handleFilterChange,
  userRole,
}) => {
  const theme = useTheme();

  return (
    <StyledFilterWrap>
      <div style={{ marginBottom: "0.3rem", padding: "0 0.5rem" }}>
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
      </div>
      <StyledFilterList>
        <Checkbox
          label="starred"
          value={filterData.starred}
          onChangeFn={(value: boolean) => handleFilterChange("starred", value)}
        />
        {/* Only for non admin users */}
        {userRole !== UserEnums.Role.Admin &&
          userRole !== UserEnums.Role.Owner && (
            <Checkbox
              label="editor rights"
              value={filterData.editorRights}
              onChangeFn={(value: boolean) =>
                handleFilterChange("editorRights", value)
              }
            />
          )}
        <Checkbox
          label="with subterritories"
          value={filterData.withSubterritories}
          onChangeFn={(value: boolean) =>
            handleFilterChange("withSubterritories", value)
          }
          tooltipLabel="first-level Territories (directly under root) which have sub-Territories"
        />
        <Checkbox
          label="with statements"
          value={filterData.withStatements}
          onChangeFn={(value: boolean) =>
            handleFilterChange("withStatements", value)
          }
        />
        <StyledInputWrap>
          <FaSearch
            style={{ flexShrink: 0 }}
            size={14}
            color={theme.color.black}
          />
          <Input
            value={filterData.filter}
            placeholder="Filter by text"
            onChangeFn={(value: string) => handleFilterChange("filter", value)}
            changeOnType
            width="full"
            clearable
          />
        </StyledInputWrap>
      </StyledFilterList>
    </StyledFilterWrap>
  );
};
