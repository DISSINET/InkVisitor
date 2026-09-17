import { userRoleDict } from "@inkvisitor/shared/dictionaries";
import { UserEnums } from "@inkvisitor/shared/enums";
import React from "react";
import { StyledRoleBadge } from "./RoleBadgeStyles";

interface RoleBadge {
  role: UserEnums.Role;
}

/** A role the current context cannot reassign, shown as a value rather than a control */
export const RoleBadge: React.FC<RoleBadge> = ({ role }) => (
  <StyledRoleBadge>
    {userRoleDict.find((roleOption) => roleOption.value === role)?.label ?? role}
  </StyledRoleBadge>
);
