import { userRoleDict } from "@inkvisitor/shared/dictionaries";
import { UserEnums } from "@inkvisitor/shared/enums";
import { Button, Checkbox, Input } from "components";
import { AttributeButtonGroup } from "components/advanced";
import React from "react";
import { IcoClose, IcoSearch } from "Theme/icons";
import { ButtonSize } from "types";
import {
  StyledToolbar,
  StyledToolbarClear,
  StyledToolbarCount,
  StyledToolbarGroup,
} from "../UserListStyles";
import {
  emptyUserListFilters,
  hasActiveUserListFilters,
  UserListFilters,
} from "../userListFilter";

interface UserListToolbar {
  filters: UserListFilters;
  onFiltersChange: (filters: UserListFilters) => void;
  filteredCount: number;
  totalCount: number;
}

export const UserListToolbar: React.FC<UserListToolbar> = ({
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
}) => {
  // owner is skipped: at most one user holds it and it is never assignable
  const roleOptions: { value: UserEnums.Role | null; label: string }[] = [
    { value: null, label: "all" },
    ...userRoleDict.slice(1).map((role) => ({ value: role.value, label: role.label })),
  ];

  return (
    <StyledToolbar>
      <StyledToolbarGroup>
        <Input
          value={filters.query}
          placeholder="search users"
          changeOnType
          clearable
          icon={<IcoSearch />}
          width={220}
          onChangeFn={(value: string) => onFiltersChange({ ...filters, query: value })}
          roundCorners
        />
        <AttributeButtonGroup
          options={roleOptions.map((option) => ({
            longValue: option.label,
            shortValue: option.label,
            selected: filters.role === option.value,
            onClick: () => onFiltersChange({ ...filters, role: option.value }),
          }))}
        />
        <Checkbox
          value={filters.hideInactive}
          label="hide inactive"
          onChangeFn={(value: boolean) => onFiltersChange({ ...filters, hideInactive: value })}
        />

        <StyledToolbarCount>
          {filteredCount === totalCount
            ? `${totalCount} users`
            : `${filteredCount} of ${totalCount} users`}
        </StyledToolbarCount>

        <StyledToolbarClear>
          {hasActiveUserListFilters(filters) && (
            <Button
              icon={<IcoClose />}
              color="danger"
              noBorder
              tooltipLabel="clear all filters"
              size={ButtonSize.Medium}
              onClick={() => onFiltersChange(emptyUserListFilters)}
            />
          )}
        </StyledToolbarClear>
      </StyledToolbarGroup>
    </StyledToolbar>
  );
};
