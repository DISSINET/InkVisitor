import { Checkbox, Input } from "components";
import React from "react";
import { ITerritoryFilter } from "types";
import {
  StyledCancelButton,
  StyledFilterList,
  StyledFilterWrap,
} from "./TerritoryTreeFilterStyles";
import { UserEnums } from "@shared/enums";
import { MdCancel } from "react-icons/md";

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
        {/* Only for non admin users */}
        {userRole !== UserEnums.Role.Admin && (
          <Checkbox
            label="editor rights"
            value={filterData.editorRights}
            onChangeFn={(value: boolean) =>
              handleFilterChange("editorRights", value)
            }
          />
        )}
        <div style={{ position: "relative" }}>
          <Input
            value={filterData.filter}
            onChangeFn={(value: string) => handleFilterChange("filter", value)}
            changeOnType
            width="full"
          />
          {filterData.filter.length > 0 && (
            <StyledCancelButton>
              <MdCancel
                size={16}
                onClick={() => handleFilterChange("filter", "")}
              />
            </StyledCancelButton>
          )}
        </div>
      </StyledFilterList>
    </StyledFilterWrap>
  );
};
