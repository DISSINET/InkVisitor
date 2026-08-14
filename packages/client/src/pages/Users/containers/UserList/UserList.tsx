import { userRoleDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResponseUser, IUser, IUserRight } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, ButtonGroup, Loader, RoleBadge, Submit } from "components";
import { AttributeButtonGroup } from "components/advanced";
import { useTreeQuery, useUsersGetMoreQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaKey, FaToggleOff, FaToggleOn, FaUserCheck } from "react-icons/fa";
import { CellProps, Column, Row, useTable } from "react-table";
import { toast } from "react-toastify";
import { IcoTrash } from "Theme/icons";
import { ButtonSize } from "types";
import { getStoredUserId, getStoredUserRole } from "utils/userStorage";
import { UserListIdentityCell } from "./UserListIdentityCell/UserListIdentityCell";
import {
  ROW_FLASH_CLEAR_AFTER_MS,
  StyledEmptyCell,
  StyledRoleBadgeWrap,
  StyledTable,
  StyledTableWrapper,
  StyledTerritoryColumnAllLabel,
  StyledTh,
  StyledTHead,
  UserListRowFlash,
} from "./UserListStyles";
import { UserListResourceRightsCell } from "./UserListRightsCell/UserListResourceRightsCell";
import { UserListRightsCell } from "./UserListRightsCell/UserListRightsCell";
import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { UserListToolbar } from "./UserListToolbar/UserListToolbar";
import { UsersUtils } from "./UsersUtils";
import {
  emptyUserListFilters,
  filterUsers,
  hasActiveUserListFilters,
  UserListFilters,
} from "./userListFilter";
import { readBlockedTerritoryIds, rightTerritoryIds } from "./userTerritoryRights";

const rolePriority: Record<UserEnums.Role, number> = {
  [UserEnums.Role.Owner]: 1,
  [UserEnums.Role.Admin]: 2,
  [UserEnums.Role.Editor]: 3,
  [UserEnums.Role.Viewer]: 4,
};

type CellType = CellProps<IResponseUser>;

interface UserList {}

export const UserList: React.FC<UserList> = React.memo(() => {
  const [removingUserId, setRemovingUserId] = useState<false | string>("");
  const [filters, setFilters] = useState<UserListFilters>(emptyUserListFilters);
  const [rowFlash, setRowFlash] = useState<{
    userId: string;
    kind: Exclude<UserListRowFlash, false>;
  } | null>(null);
  const flashClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();

  const scheduleRowFlash = useCallback((userId: string, kind: Exclude<UserListRowFlash, false>) => {
    if (flashClearTimeoutRef.current) {
      clearTimeout(flashClearTimeoutRef.current);
    }
    setRowFlash({ userId, kind });
    flashClearTimeoutRef.current = setTimeout(() => {
      setRowFlash(null);
      flashClearTimeoutRef.current = null;
    }, ROW_FLASH_CLEAR_AFTER_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (flashClearTimeoutRef.current) {
        clearTimeout(flashClearTimeoutRef.current);
      }
    };
  }, []);

  const currentUserRole = getStoredUserRole() as UserEnums.Role;
  const canVerifyManually =
    currentUserRole === UserEnums.Role.Admin || currentUserRole === UserEnums.Role.Owner;

  const { data: users, isFetching, isLoading } = useUsersGetMoreQuery();
  const { data: treeData } = useTreeQuery();

  const userComparator = (a: IResponseUser, b: IResponseUser): number => {
    // First, compare by role priority
    if (rolePriority[a.role] !== rolePriority[b.role]) {
      return rolePriority[a.role] - rolePriority[b.role];
    }

    // If roles are the same, compare by active status
    return b.active ? 1 : -1;
  };

  const localUsers = useMemo(() => {
    if (!users) {
      return [];
    }
    return [...users].sort(userComparator);
  }, [users]);

  const filteredUsers = useMemo(() => filterUsers(localUsers, filters), [localUsers, filters]);

  const removingUser = useMemo(() => {
    return removingUserId ? users?.find((d) => d.id === removingUserId) : false;
  }, [removingUserId]);

  const userMutation = useMutation({
    mutationFn: async (userChanges: Partial<Omit<IUser, "id">> & { id: IUser["id"] }) =>
      await api.usersUpdate(userChanges.id, userChanges),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => await api.resetPassword(userId),
    onSuccess: (response) => {
      const body = response.data;
      const message = body.message ?? "";
      const password =
        typeof body.data === "string" && body.data.length > 0
          ? body.data
          : (message.match(/'([^']+)'/)?.[1] ?? "");

      toast.info(message, {
        autoClose: 6000,
        closeOnClick: false,
        style: { cursor: "copy" },
        onClick: () => {
          if (password) {
            navigator.clipboard.writeText(password);
            toast.info("Password copied to clipboard");
          }
        },
        closeButton: true,
        draggable: false,
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (user: IResponseUser) => await api.usersDelete(user.id),
    onSuccess: (data, variables) => {
      toast.warning(`User ${variables.name} removed!`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRemovingUserId(false);
    },
  });

  const addRightToUser = (user: IResponseUser, territoryId: string, mode: "read" | "write") => {
    // remove this territory from the list if it was added before
    const newRights: IUserRight[] = [
      ...user.rights.filter((right) => right.territory !== territoryId),
    ];
    newRights.push({
      territory: territoryId,
      mode: mode as UserEnums.RoleMode,
    });
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const removeRightFromUser = (user: IResponseUser, territoryId: string) => {
    const newRights: IUserRight[] = [
      ...user.rights.filter((right) => right.territory !== territoryId),
    ];
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  // Resource (annotate) assignments reuse the rights array with mode === Annotate,
  // where the `territory` field carries the Resource entity id.
  const isAnnotateRight = (right: IUserRight, resourceId?: string) =>
    right.mode === UserEnums.RoleMode.Annotate &&
    (resourceId === undefined || right.territory === resourceId);

  // one mutation covers the whole batch: a per-resource call would send rights
  // read before the previous call landed, and the last response would win
  const addResourceRightsToUser = (user: IResponseUser, resourceIds: string[]) => {
    const newRights: IUserRight[] = [
      ...user.rights.filter(
        (right) => !resourceIds.some((resourceId) => isAnnotateRight(right, resourceId)),
      ),
      ...resourceIds.map((resourceId) => ({
        territory: resourceId,
        mode: UserEnums.RoleMode.Annotate,
      })),
    ];
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const removeResourceRightFromUser = (user: IResponseUser, resourceId: string) => {
    const newRights: IUserRight[] = [
      ...user.rights.filter((right) => !isAnnotateRight(right, resourceId)),
    ];
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const removeAllResourceRightsFromUser = (user: IResponseUser) => {
    const newRights: IUserRight[] = [...user.rights.filter((right) => !isAnnotateRight(right))];
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const getRowId = useCallback((row: IResponseUser) => {
    return row.id;
  }, []);

  const columns = useMemo<Column<IResponseUser>[]>(
    () => [
      {
        Header: "",
        id: "Name",
        accessor: "name",
        Cell: ({ row }: CellType) => (
          <UserListIdentityCell
            user={row.original}
            allUsers={localUsers}
            userMutation={userMutation}
          />
        ),
      },
      {
        Header: "Role",
        id: "Role",
        Cell: ({ row }: CellType) => {
          const { id, role } = row.original;

          // an owner keeps the role for good, and nobody demotes themselves, so
          // those rows state the role rather than offering a control
          if (id === getStoredUserId() || role === UserEnums.Role.Owner) {
            return (
              <StyledRoleBadgeWrap>
                <RoleBadge role={role} />
              </StyledRoleBadgeWrap>
            );
          }

          return (
            <AttributeButtonGroup
              options={userRoleDict.slice(1).map((roleOption) => ({
                longValue: roleOption.label,
                shortValue: roleOption.label,
                selected: role === roleOption.value,
                onClick: () => {
                  if (role === roleOption.value) {
                    return;
                  }
                  userMutation.mutate(
                    { id: id, role: roleOption.value },
                    {
                      onSuccess: () => {
                        scheduleRowFlash(id, "role");
                      },
                    },
                  );
                },
              }))}
            />
          );
        },
      },
      {
        Header: "Read Territories",
        id: "territories-read",
        Cell: ({ row }: CellType) => {
          const { rights, territoryRights, role: userRole } = row.original;

          if (userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner) {
            return <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>;
          }

          return (
            <UserListRightsCell
              entityClass={EntityEnums.Class.Territory}
              assignedIds={rightTerritoryIds(rights, UserEnums.RoleMode.Read)}
              excludedIds={readBlockedTerritoryIds(
                treeData,
                rightTerritoryIds(rights, UserEnums.RoleMode.Write),
              )}
              entities={territoryRights?.map((right) => right.territory)}
              placeholder="assign a territory"
              invalidLabel="invalid T"
              removeTooltip="unassign territory from this user"
              onAdd={(territoryId) => addRightToUser(row.original, territoryId, "read")}
              onRemove={(territoryId) => removeRightFromUser(row.original, territoryId)}
            />
          );
        },
      },
      {
        Header: "Write Territories",
        id: "territories-write",
        Cell: ({ row }: CellType) => {
          const { rights, territoryRights, role: userRole } = row.original;

          if (userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner) {
            return <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>;
          }
          if (userRole !== UserEnums.Role.Editor) {
            return <StyledTerritoryColumnAllLabel>-</StyledTerritoryColumnAllLabel>;
          }

          return (
            <UserListRightsCell
              entityClass={EntityEnums.Class.Territory}
              assignedIds={rightTerritoryIds(rights, UserEnums.RoleMode.Write)}
              entities={territoryRights?.map((right) => right.territory)}
              placeholder="assign a territory"
              invalidLabel="invalid T"
              removeTooltip="unassign territory from this user"
              onAdd={(territoryId) => addRightToUser(row.original, territoryId, "write")}
              onRemove={(territoryId) => removeRightFromUser(row.original, territoryId)}
            />
          );
        },
      },
      {
        Header: "Annotate documents",
        id: "resources-annotate",
        Cell: ({ row }: CellType) => {
          const { rights, resourceRights, role: userRole, name } = row.original;

          if (userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner) {
            return <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>;
          }
          if (userRole !== UserEnums.Role.Editor) {
            return <StyledTerritoryColumnAllLabel>-</StyledTerritoryColumnAllLabel>;
          }

          return (
            <UserListResourceRightsCell
              userName={name}
              assignedIds={rights
                .filter((right: IUserRight) => isAnnotateRight(right))
                .map((right) => right.territory)}
              entities={resourceRights?.map((right) => right.resource)}
              onAdd={(resourceId) => addResourceRightsToUser(row.original, [resourceId])}
              onAddAll={(resourceIds) => addResourceRightsToUser(row.original, resourceIds)}
              onRemove={(resourceId) => removeResourceRightFromUser(row.original, resourceId)}
              onRemoveAll={() => removeAllResourceRightsFromUser(row.original)}
            />
          );
        },
      },
      {
        Header: "",
        id: "actions",
        Cell: ({ row }: CellType) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
            active,
            verified,
            role,
          } = row.original;

          let activateTooltip = "activate user";
          if (!verified) {
            activateTooltip = "cannot activate unverified user";
          } else if (userId === getStoredUserId()) {
            activateTooltip = "cannot deactivate yourself";
          } else if (role === UserEnums.Role.Owner) {
            activateTooltip = "owner must be active";
          } else if (active) {
            activateTooltip = "deactivate user";
          }

          let deleteTooltip = "delete user";
          if (userId === getStoredUserId()) {
            deleteTooltip = "cannot delete yourself";
          }

          return (
            <ButtonGroup $gap="no">
              <Button
                key="r"
                icon={<IcoTrash size={14} />}
                color="danger"
                tooltipLabel={deleteTooltip}
                disabled={userId === getStoredUserId() || role === UserEnums.Role.Owner}
                onClick={() => {
                  setRemovingUserId(userId);
                }}
                shape="rounded-left-sm"
                size={ButtonSize.Medium}
              />
              <Button
                icon={<FaKey size={14} />}
                tooltipLabel="set a new random password (copy by clicking on the notification)"
                color="warning"
                disabled={!active}
                onClick={() => {
                  resetPasswordMutation.mutate(userId);
                }}
                shape="sharp-square"
                size={ButtonSize.Medium}
              />
              {canVerifyManually && !verified && (
                <Button
                  key="verify"
                  icon={<FaUserCheck size={14} />}
                  tooltipLabel="manually verify email (when activation mail was not received)"
                  color="info"
                  disabled={userMutation.isPending}
                  onClick={() => {
                    userMutation.mutate(
                      { id: userId, verified: true },
                      {
                        onSuccess: () => {
                          toast.success("User marked as verified");
                        },
                      },
                    );
                  }}
                  shape="sharp-square"
                  size={ButtonSize.Medium}
                />
              )}
              <Button
                icon={active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
                shape="rounded-right-sm"
                disabled={
                  !verified || userId === getStoredUserId() || role === UserEnums.Role.Owner
                }
                color={active ? "success" : "danger"}
                tooltipLabel={activateTooltip}
                onClick={() => {
                  const nextActive = !active;
                  userMutation.mutate(
                    { id: userId, active: nextActive },
                    {
                      onSuccess: () => {
                        scheduleRowFlash(userId, nextActive ? "activate" : "deactivate");
                      },
                    },
                  );
                }}
                size={ButtonSize.Medium}
              />
            </ButtonGroup>
          );
        },
      },
    ],
    [canVerifyManually, scheduleRowFlash, localUsers, treeData],
  );

  // an empty body during the first fetch is not yet an empty result
  const emptyBodyMessage = isLoading
    ? "loading users..."
    : hasActiveUserListFilters(filters)
      ? "no users match the filter"
      : "no users";

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, visibleColumns } =
    useTable({
      columns,
      data: filteredUsers,
      getRowId,
    });

  return (
    <Box
      label="Users"
      disableHeaderClick
      disableScroll
      headerComponent={
        <UserListToolbar
          filters={filters}
          onFiltersChange={setFilters}
          filteredCount={filteredUsers.length}
          totalCount={localUsers.length}
          actions={<UsersUtils users={localUsers} />}
        />
      }
    >
      <StyledTableWrapper>
        <StyledTable {...getTableProps()}>
          <StyledTHead>
            {headerGroups.map((headerGroup, key) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={key}>
                {headerGroup.headers.map((column, key) => (
                  <StyledTh {...column.getHeaderProps()} key={key}>
                    {column.render("Header") as React.ReactNode}
                  </StyledTh>
                ))}
              </tr>
            ))}
          </StyledTHead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row: Row<IResponseUser>, i: number) => {
              prepareRow(row);
              return (
                <UserListTableRow
                  index={i}
                  row={row}
                  flash={rowFlash?.userId === row.original.id ? rowFlash.kind : false}
                  key={row.id}
                />
              );
            })}

            {rows.length === 0 && (
              <tr>
                <StyledEmptyCell colSpan={visibleColumns.length}>
                  {emptyBodyMessage}
                </StyledEmptyCell>
              </tr>
            )}
          </tbody>
        </StyledTable>
        <Loader show={isFetching} />
      </StyledTableWrapper>

      <Submit
        title={`Deleting user ${removingUser ? removingUser.name : ""}`}
        text={`Do you really want to delete the user ${removingUser ? removingUser.name : ""}?`}
        show={removingUser != false}
        onSubmit={() => removingUser && removeUserMutation.mutate(removingUser)}
        onCancel={() => {
          setRemovingUserId(false);
        }}
        loading={removeUserMutation.isPending}
      />
    </Box>
  );
});
