import { userRoleDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IResponseUser, IUserRight } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Loader, Submit } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useCallback, useMemo, useState } from "react";
import {
  FaEnvelopeOpenText,
  FaKey,
  FaToggleOff,
  FaToggleOn,
  FaTrashAlt,
} from "react-icons/fa";
import {
  RiUserSearchFill,
  RiUserSettingsFill,
  RiUserStarFill,
} from "react-icons/ri";
import { CellProps, Column, Row, useTable } from "react-table";
import { toast } from "react-toastify";
import { UserListEmailInput } from "./UserListEmailInput/UserListEmailInput";
import {
  StyledNotActiveText,
  StyledTHead,
  StyledTable,
  StyledTableWrapper,
  StyledTerritoryColumn,
  StyledTerritoryColumnAllLabel,
  StyledTerritoryList,
  StyledTerritoryListItem,
  StyledTerritoryListItemMissing,
  StyledTh,
  StyledUserNameColumn,
  StyledUserNameColumnIcon,
  StyledUserNameColumnText,
} from "./UserListStyles";
import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { UserListUsernameInput } from "./UserListUsernameInput/UserListUsernameInput";
import { UsersUtils } from "./UsersUtils";

type CellType = CellProps<IResponseUser>;

interface UserList {}

export const UserList: React.FC<UserList> = React.memo(() => {
  const [removingUserId, setRemovingUserId] = useState<false | string>("");

  const queryClient = useQueryClient();

  const {
    status,
    data: users,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.usersGetMore({});
      return res.data.sort((a, b) => (a.id > b.id ? 1 : -1));
    },
    enabled: api.isLoggedIn(),
  });

  const removingUser = useMemo(() => {
    return removingUserId ? users?.find((d) => d.id === removingUserId) : false;
  }, [removingUserId]);

  const userMutation = useMutation({
    mutationFn: async (userChanges: any) =>
      await api.usersUpdate(userChanges.id, userChanges),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => await api.resetPassword(userId),
    onSuccess: (data, variables) => {
      const { message } = data.data;

      toast.info(message, {
        autoClose: 6000,
        closeOnClick: false,
        onClick: () => {
          navigator.clipboard.writeText(message ? message.split("'")[1] : "");
          toast.info("Password copied to clipboard");
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

  const addRightToUser = (
    user: IResponseUser,
    territoryId: string,
    mode: "read" | "write"
  ) => {
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

  const getRowId = useCallback((row: IResponseUser) => {
    return row.id;
  }, []);

  const usernameList = useMemo(() => users?.map((u) => u.name) || [], [users]);

  const columns = useMemo<Column<IResponseUser>[]>(
    () => [
      {
        Header: "",
        id: "Name",
        accessor: "name",
        Cell: ({ row }: CellType) => {
          const { name, email, role, active, verified } = row.original;
          let icon = <RiUserSearchFill />;
          if (role === UserEnums.Role.Admin) {
            icon = <RiUserStarFill />;
          }
          if (role === UserEnums.Role.Editor) {
            icon = <RiUserSettingsFill />;
          }
          if (!verified) {
            icon = <FaEnvelopeOpenText size={16} />;
          }
          return (
            <StyledUserNameColumn $active={active} $verified={verified}>
              <StyledUserNameColumnIcon>{icon}</StyledUserNameColumnIcon>

              {!verified ? (
                <StyledNotActiveText>{"not activated"}</StyledNotActiveText>
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
        Cell: ({ row }: CellType) => {
          const { verified } = row.original;

          return (
            <>
              {verified && (
                <UserListUsernameInput
                  user={row.original}
                  userMutation={userMutation}
                  usernameList={usernameList}
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
          return (
            <UserListEmailInput
              user={row.original}
              userMutation={userMutation}
            />
          );
        },
      },
      {
        Header: "Role",
        id: "Role",
        Cell: ({ row }: CellType) => {
          const { id, role } = row.original;
          return (
            <AttributeButtonGroup
              disabled={id === localStorage.getItem("userid")}
              options={[
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
              ]}
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

          const readTerritories = rights.filter(
            (r: IUserRight) => r.mode === "read"
          );

          return (
            <StyledTerritoryColumn>
              {userRole !== UserEnums.Role.Admin ? (
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
                    {readTerritories.length && territoryActants ? (
                      readTerritories.map((right: IUserRight) => {
                        const territoryActant = territoryActants.find(
                          (t) => t.territory.id === right.territory
                        );

                        return territoryActant && territoryActant.territory ? (
                          <StyledTerritoryListItem key={right.territory}>
                            <EntityTag
                              entity={territoryActant.territory}
                              unlinkButton={{
                                onClick: () => {
                                  removeRightFromUser(
                                    row.original,
                                    right.territory
                                  );
                                },
                                tooltipLabel: "remove territory from rights",
                              }}
                            />
                          </StyledTerritoryListItem>
                        ) : (
                          <StyledTerritoryListItemMissing key={right.territory}>
                            <div>invalid T {right.territory}</div>
                            <Button
                              key="d"
                              tooltipLabel="remove invalid territory"
                              icon={<FaTrashAlt />}
                              color="danger"
                              noBorder
                              onClick={() => {
                                removeRightFromUser(
                                  row.original,
                                  right.territory
                                );
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
                <StyledTerritoryColumnAllLabel>
                  all
                </StyledTerritoryColumnAllLabel>
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

          const writeTerritories = rights.filter(
            (r: IUserRight) => r.mode === "write"
          );

          return (
            <StyledTerritoryColumn>
              {userRole !== UserEnums.Role.Admin ? (
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
                      excludedActantIds={writeTerritories.map(
                        (r) => r.territory
                      )}
                    />
                    <StyledTerritoryList>
                      {writeTerritories.length && territoryActants ? (
                        writeTerritories.map((right: IUserRight) => {
                          const territoryActant = territoryActants.find(
                            (t) => t.territory.id === right.territory
                          );

                          return territoryActant &&
                            territoryActant.territory ? (
                            <StyledTerritoryListItem key={right.territory}>
                              <EntityTag
                                entity={territoryActant.territory}
                                unlinkButton={{
                                  onClick: () => {
                                    removeRightFromUser(
                                      row.original,
                                      right.territory
                                    );
                                  },
                                  tooltipLabel: "remove territory from rights",
                                }}
                              />
                            </StyledTerritoryListItem>
                          ) : (
                            <StyledTerritoryListItemMissing
                              key={right.territory}
                            >
                              invalid T {right.territory}
                              <Button
                                key="d"
                                tooltipLabel="remove invalid territory"
                                icon={<FaTrashAlt />}
                                color="danger"
                                noBorder
                                onClick={() => {
                                  removeRightFromUser(
                                    row.original,
                                    right.territory
                                  );
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
                  <StyledTerritoryColumnAllLabel>
                    -
                  </StyledTerritoryColumnAllLabel>
                )
              ) : (
                <StyledTerritoryColumnAllLabel>
                  all
                </StyledTerritoryColumnAllLabel>
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
          } = row.original;

          let activateTooltip = "activate user";
          if (!verified) {
            activateTooltip = "cannot activate unverified user";
          } else if (userId === localStorage.getItem("userid")) {
            activateTooltip = "cannot deactivate yourself";
          } else if (active) {
            activateTooltip = "deactivate user";
          }

          let deleteTooltip = "delete user";
          if (userId === localStorage.getItem("userid")) {
            deleteTooltip = "cannot delete yourself";
          }

          return (
            <ButtonGroup $noMarginRight>
              <Button
                key="r"
                icon={<FaTrashAlt size={14} />}
                color="danger"
                tooltipLabel={deleteTooltip}
                disabled={userId === localStorage.getItem("userid")}
                onClick={() => {
                  setRemovingUserId(userId);
                }}
              />
              <Button
                icon={<FaKey size={14} />}
                tooltipLabel="reset password"
                color="warning"
                disabled={!active || !verified}
                onClick={() => {
                  resetPasswordMutation.mutate(userId);
                }}
              />
              <Button
                icon={
                  active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />
                }
                disabled={
                  !verified || userId === localStorage.getItem("userid")
                }
                color={active ? "success" : "danger"}
                tooltipLabel={activateTooltip}
                onClick={() => {
                  userMutation.mutate({
                    id: userId,
                    active: !active,
                  });
                }}
              />
            </ButtonGroup>
          );
        },
      },
    ],
    [usernameList]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable({
    columns,
    data: useMemo(() => users || [], [users]),
    getRowId,
  });

  return (
    <>
      {users && (
        <>
          <StyledTableWrapper>
            <StyledTable {...getTableProps()}>
              <StyledTHead>
                {headerGroups.map((headerGroup, key) => (
                  <tr {...headerGroup.getHeaderGroupProps()} key={key}>
                    {headerGroup.headers.map((column, key) => (
                      <StyledTh {...column.getHeaderProps()} key={key}>
                        {column.render("Header")}
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
                      {...row.getRowProps()}
                    />
                  );
                })}
              </tbody>
            </StyledTable>
          </StyledTableWrapper>
          {/* NEW USER | TEST EMAIL */}
          <UsersUtils users={users} />
        </>
      )}

      <Submit
        title={`Deleting user ${removingUser ? removingUser.name : ""}`}
        text={`Do you really want to delete the user ${
          removingUser ? removingUser.name : ""
        }?`}
        show={removingUser != false}
        onSubmit={() => removingUser && removeUserMutation.mutate(removingUser)}
        onCancel={() => {
          setRemovingUserId(false);
        }}
        loading={removeUserMutation.isPending}
      />
      <Loader show={isFetching} />
    </>
  );
});
