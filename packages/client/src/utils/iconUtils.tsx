import React from "react";
import { EntityEnums } from "@shared/enums";
import { UserEnums } from "@shared/enums";
import {
  FaClock,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaEdit,
  FaUserShield,
  FaUserCog,
  FaUserEdit,
  FaUserTag,
} from "react-icons/fa";
import { UserTagSize } from "components/advanced/UserTag/utils";

/**
 * Maps an entity status to its corresponding icon
 * @param status - The entity status to map
 * @returns The corresponding icon component or undefined
 */
export const getEntityStatusIcon = (status: EntityEnums.Status) => {
  switch (status) {
    case EntityEnums.Status.Pending:
      return <FaClock />;
    case EntityEnums.Status.Approved:
      return <FaCheck />;
    case EntityEnums.Status.Discouraged:
      return <FaTimes />;
    case EntityEnums.Status.Warning:
      return <FaExclamationTriangle />;
    case EntityEnums.Status.Unfinished:
      return <FaEdit />;
    default:
      return undefined;
  }
};

const getUserIconSize = (size?: UserTagSize): number => {
  switch (size) {
    case UserTagSize.Small:
      return 17;
    case UserTagSize.Medium:
      return 19;
    case UserTagSize.Large:
      return 21;
    default:
      return 17;
  }
};
/**
 * Maps a user role to its corresponding icon
 * @param userRole - The user role to map
 * @param size - Optional size for the icon
 * @returns The corresponding icon component
 */
export const getUserIcon = (userRole: UserEnums.Role, size?: UserTagSize): React.ReactNode => {
  if (userRole === UserEnums.Role.Owner) {
    return <FaUserShield size={getUserIconSize(size)} />;
  } else if (userRole === UserEnums.Role.Admin) {
    return <FaUserCog size={getUserIconSize(size)} />;
  } else if (userRole === UserEnums.Role.Editor) {
    return <FaUserEdit size={getUserIconSize(size)} />;
  }
  return <FaUserTag size={getUserIconSize(size)} />;
};
