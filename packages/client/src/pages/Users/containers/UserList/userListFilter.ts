import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseUser } from "@inkvisitor/shared/types";

export interface UserListFilters {
  query: string;
  /** null means every role passes */
  role: UserEnums.Role | null;
  hideInactive: boolean;
}

export const emptyUserListFilters: UserListFilters = {
  query: "",
  role: null,
  hideInactive: false,
};

/** True while any filter narrows the list, i.e. while there is something to clear */
export const hasActiveUserListFilters = (filters: UserListFilters): boolean =>
  filters.query.trim().length > 0 || filters.role !== null || filters.hideInactive;

/** The three filters combine with AND; the query matches name or email. */
export const filterUsers = (
  users: IResponseUser[],
  filters: UserListFilters,
): IResponseUser[] => {
  const query = filters.query.trim().toLowerCase();

  return users.filter((user) => {
    if (filters.role !== null && user.role !== filters.role) {
      return false;
    }
    if (filters.hideInactive && !user.active) {
      return false;
    }
    if (query.length === 0) {
      return true;
    }
    return (
      user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  });
};
