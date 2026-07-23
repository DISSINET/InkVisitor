import { userRoleDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IResponseUser, IUser, IUserRight } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Loader, Submit } from "components";
import { AttributeButtonGroup, EntitySuggester, EntityTag } from "components/advanced";
import { UserTagSize } from "components/advanced/UserTag/utils";
import { useResourcesWithDocumentsQuery, useUsersGetMoreQuery } from "hooks/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaEnvelopeOpenText, FaKey, FaToggleOff, FaToggleOn, FaUserCheck } from "react-icons/fa";
import { CellProps, Column, Row, useTable } from "react-table";
import { toast } from "react-toastify";
import { IcoTrash } from "Theme/icons";
import { ButtonSize } from "types";
import { getUserIcon } from "utils/iconUtils";
import { getStoredUserId, getStoredUserRole } from "utils/userStorage";
import { UserListEmailInput } from "./UserListEmailInput/UserListEmailInput";
import { UserListIcon } from "./UserListIcon/UserListIcon";
import {
  ROW_FLASH_CLEAR_AFTER_MS,
  StyledNotActiveText,
  StyledTable,
  StyledTableWrapper,
  StyledTerritoryColumn,
  StyledTerritoryColumnAllLabel,
  StyledTerritoryList,
  StyledTerritoryListItem,
  StyledTerritoryListItemMissing,
  StyledTh,
  StyledTHead,
  StyledUserNameColumn,
  StyledUserNameColumnIcon,
  StyledUserNameColumnText,
  UserListRowFlash,
} from "./UserListStyles";
import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { UserListUsernameInput } from "./UserListUsernameInput/UserListUsernameInput";
import { UsersUtils } from "./UsersUtils";

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

  const { data: users, isFetching } = useUsersGetMoreQuery();

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

  const addResourceRightToUser = (user: IResponseUser, resourceId: string) => {
    const newRights: IUserRight[] = [
      ...user.rights.filter((right) => !isAnnotateRight(right, resourceId)),
    ];
    newRights.push({
      territory: resourceId,
      mode: UserEnums.RoleMode.Annotate,
    });
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const removeResourceRightFromUser = (user: IResponseUser, resourceId: string) => {
    const newRights: IUserRight[] = [
      ...user.rights.filter((right) => !isAnnotateRight(right, resourceId)),
    ];
    userMutation.mutate({ id: user.id, rights: newRights });
  };

  const getRowId = useCallback((row: IResponseUser) => {
    return row.id;
  }, []);

  const { data: resourcesWithDocuments } = useResourcesWithDocumentsQuery();

  const columns = useMemo<Column<IResponseUser>[]>(
    () => [
      {
        Header: "",
        id: "Name",
        accessor: "name",
        Cell: ({ row }: CellType) => {
          const { name, email, role, active, verified } = row.original;

          return (
            <StyledUserNameColumn $active={active} $verified={verified}>
              <StyledUserNameColumnIcon>
                <UserListIcon
                  icon={
                    !verified ? (
                      <FaEnvelopeOpenText size={16} />
                    ) : (
                      getUserIcon(role, UserTagSize.ExtraLarge)
                    )
                  }
                  tooltipLabel={role}
                />
              </StyledUserNameColumnIcon>

              {!verified ? (
                <StyledNotActiveText>
                  <span>Verification email has been sent to</span>
                  <b>{email}</b>
                </StyledNotActiveText>
              ) : (
                <StyledUserNameColumnText>
                  <b>{name}</b>
                  <span>{email}</span>
                </StyledUserNameColumnText>
              )}
            </StyledUserNameColumn>
          );
        },
      },
      {
        Header: "Username",
        id: "Username",
        Cell: ({ row, rows }: CellType) => {
          const { verified } = row.original;

          return (
            <>
              {verified && (
                <UserListUsernameInput
                  user={row.original}
                  userMutation={userMutation}
                  rows={rows}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "Email",
        id: "Email",
        Cell: ({ row }: CellType) => {
          const { verified, email } = row.original;
          return verified ? (
            <UserListEmailInput user={row.original} userMutation={userMutation} />
          ) : null;
        },
      },
      {
        Header: "Role",
        id: "Role",
        Cell: ({ row }: CellType) => {
          const { id, role } = row.original;
          return (
            <AttributeButtonGroup
              disabled={id === getStoredUserId() || role === UserEnums.Role.Owner}
              options={
                role === UserEnums.Role.Owner
                  ? [
                      {
                        longValue: userRoleDict[0].label,
                        shortValue: userRoleDict[0].label,
                        selected: role === userRoleDict[0].value,
                        onClick: () => {
                          userMutation.mutate({
                            id: id,
                            role: userRoleDict[0].value,
                          });
                        },
                      },
                    ]
                  : [
                      {
                        longValue: userRoleDict[1].label,
                        shortValue: userRoleDict[1].label,
                        selected: role === userRoleDict[1].value,
                        onClick: () => {
                          userMutation.mutate({
                            id: id,
                            role: userRoleDict[1].value,
                          });
                        },
                      },
                      {
                        longValue: userRoleDict[2].label,
                        shortValue: userRoleDict[2].label,
                        selected: role === userRoleDict[2].value,
                        onClick: () => {
                          userMutation.mutate({
                            id: id,
                            role: userRoleDict[2].value,
                          });
                        },
                      },
                      {
                        longValue: userRoleDict[3].label,
                        shortValue: userRoleDict[3].label,
                        selected: role === userRoleDict[3].value,
                        onClick: () => {
                          userMutation.mutate({
                            id: id,
                            role: userRoleDict[3].value,
                          });
                        },
                      },
                    ]
              }
            />
          );
        },
      },
      {
        Header: "Read Territories",
        id: "territories-read",
        Cell: ({ row }: CellType) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
            role: userRole,
          } = row.original;

          const readTerritories = rights.filter((r: IUserRight) => r.mode === "read");

          return (
            <StyledTerritoryColumn>
              {userRole !== UserEnums.Role.Admin && userRole !== UserEnums.Role.Owner ? (
                <React.Fragment>
                  <EntitySuggester
                    disableTemplatesAccept
                    disableCreate
                    onSelected={(newSelectedId: string) => {
                      addRightToUser(row.original, newSelectedId, "read");
                    }}
                    categoryTypes={[EntityEnums.Class.Territory]}
                    placeholder={"assign a territory"}
                    excludedActantIds={readTerritories.map((r) => r.territory)}
                  />
                  <StyledTerritoryList>
                    {readTerritories.length > 0 && territoryActants ? (
                      readTerritories.map((right: IUserRight) => {
                        const territoryActant = territoryActants.find(
                          (t) => t.territory.id === right.territory,
                        );

                        return territoryActant && territoryActant.territory ? (
                          <StyledTerritoryListItem key={right.territory}>
                            <EntityTag
                              entity={territoryActant.territory}
                              unlinkButton={{
                                onClick: () => {
                                  removeRightFromUser(row.original, right.territory);
                                },
                                tooltipLabel: "remove territory from rights",
                              }}
                              disableDoubleClick
                            />
                          </StyledTerritoryListItem>
                        ) : (
                          <StyledTerritoryListItemMissing key={right.territory}>
                            <div>invalid T {right.territory}</div>
                            <Button
                              key="d"
                              tooltipLabel="remove invalid territory"
                              icon={<IcoTrash />}
                              color="danger"
                              noBorder
                              onClick={() => {
                                removeRightFromUser(row.original, right.territory);
                              }}
                            />
                          </StyledTerritoryListItemMissing>
                        );
                      })
                    ) : (
                      <div />
                    )}
                  </StyledTerritoryList>
                </React.Fragment>
              ) : (
                <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>
              )}
            </StyledTerritoryColumn>
          );
        },
      },
      {
        Header: "Write Territories",
        id: "territories-write",
        Cell: ({ row }: CellType) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
            role: userRole,
          } = row.original;

          const writeTerritories = rights.filter((r: IUserRight) => r.mode === "write");

          return (
            <StyledTerritoryColumn>
              {userRole !== UserEnums.Role.Admin && userRole !== UserEnums.Role.Owner ? (
                userRole === UserEnums.Role.Editor ? (
                  <React.Fragment>
                    <EntitySuggester
                      disableTemplatesAccept
                      disableCreate
                      onSelected={(newSelectedId: string) => {
                        addRightToUser(row.original, newSelectedId, "write");
                      }}
                      categoryTypes={[EntityEnums.Class.Territory]}
                      placeholder={"assign a territory"}
                      excludedActantIds={writeTerritories.map((r) => r.territory)}
                    />
                    <StyledTerritoryList>
                      {writeTerritories.length > 0 && territoryActants ? (
                        writeTerritories.map((right: IUserRight) => {
                          const territoryActant = territoryActants.find(
                            (t) => t.territory.id === right.territory,
                          );

                          return territoryActant && territoryActant.territory ? (
                            <StyledTerritoryListItem key={right.territory}>
                              <EntityTag
                                entity={territoryActant.territory}
                                unlinkButton={{
                                  onClick: () => {
                                    removeRightFromUser(row.original, right.territory);
                                  },
                                  tooltipLabel: "remove territory from rights",
                                }}
                                disableDoubleClick
                              />
                            </StyledTerritoryListItem>
                          ) : (
                            <StyledTerritoryListItemMissing key={right.territory}>
                              invalid T {right.territory}
                              <Button
                                key="d"
                                tooltipLabel="remove invalid territory"
                                icon={<IcoTrash />}
                                color="danger"
                                noBorder
                                onClick={() => {
                                  removeRightFromUser(row.original, right.territory);
                                }}
                              />
                            </StyledTerritoryListItemMissing>
                          );
                        })
                      ) : (
                        <div />
                      )}
                    </StyledTerritoryList>
                  </React.Fragment>
                ) : (
                  <StyledTerritoryColumnAllLabel>-</StyledTerritoryColumnAllLabel>
                )
              ) : (
                <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>
              )}
            </StyledTerritoryColumn>
          );
        },
      },
      {
        Header: "Annotate documents",
        id: "resources-annotate",
        Cell: ({ row }: CellType) => {
          const { rights, resourceRights, role: userRole } = row.original;

          const annotateRights = rights.filter((r: IUserRight) => isAnnotateRight(r));

          return (
            <StyledTerritoryColumn>
              {userRole !== UserEnums.Role.Admin && userRole !== UserEnums.Role.Owner ? (
                userRole === UserEnums.Role.Editor ? (
                  <React.Fragment>
                    <EntitySuggester
                      disableTemplatesAccept
                      disableCreate
                      onSelected={(newSelectedId: string) => {
                        addResourceRightToUser(row.original, newSelectedId);
                      }}
                      categoryTypes={[EntityEnums.Class.Resource]}
                      placeholder={"assign a resource"}
                      excludedActantIds={annotateRights.map((r) => r.territory)}
                      preSuggestions={resourcesWithDocuments}
                    />
                    <StyledTerritoryList>
                      {annotateRights.length > 0 && resourceRights ? (
                        annotateRights.map((right: IUserRight) => {
                          const resourceActant = resourceRights.find(
                            (r) => r.resource.id === right.territory,
                          );

                          return resourceActant && resourceActant.resource ? (
                            <StyledTerritoryListItem key={right.territory}>
                              <EntityTag
                                entity={resourceActant.resource}
                                unlinkButton={{
                                  onClick: () => {
                                    removeResourceRightFromUser(row.original, right.territory);
                                  },
                                  tooltipLabel: "remove resource from rights",
                                }}
                                disableDoubleClick
                              />
                            </StyledTerritoryListItem>
                          ) : (
                            <StyledTerritoryListItemMissing key={right.territory}>
                              <div>invalid R {right.territory}</div>
                              <Button
                                key="d"
                                tooltipLabel="remove invalid resource"
                                icon={<IcoTrash />}
                                color="danger"
                                noBorder
                                onClick={() => {
                                  removeResourceRightFromUser(row.original, right.territory);
                                }}
                              />
                            </StyledTerritoryListItemMissing>
                          );
                        })
                      ) : (
                        <div />
                      )}
                    </StyledTerritoryList>
                  </React.Fragment>
                ) : (
                  <StyledTerritoryColumnAllLabel>-</StyledTerritoryColumnAllLabel>
                )
              ) : (
                <StyledTerritoryColumnAllLabel>all</StyledTerritoryColumnAllLabel>
              )}
            </StyledTerritoryColumn>
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
    [canVerifyManually, scheduleRowFlash, resourcesWithDocuments],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, visibleColumns } =
    useTable({
      columns,
      data: localUsers,
      getRowId,
    });

  return (
    <>
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
          </tbody>
        </StyledTable>
        <Loader show={isFetching} />
      </StyledTableWrapper>

      {/* NEW USER | TEST EMAIL */}
      <UsersUtils users={localUsers} />

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
    </>
  );
});
