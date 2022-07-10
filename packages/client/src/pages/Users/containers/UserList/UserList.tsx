import React, { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Cell, Column, Row, useTable } from "react-table";
import { toast } from "react-toastify";
import {
  FaKey,
  FaToggleOff,
  FaToggleOn,
  FaTrashAlt,
  FaUnlink,
} from "react-icons/fa";
import {
  RiUserSearchFill,
  RiUserSettingsFill,
  RiUserStarFill,
} from "react-icons/ri";

import { userRoleDict } from "@shared/dictionaries";
import { EntityClass, UserRole, UserRoleMode } from "@shared/enums";
import { IResponseUser, IUser, IUserRight } from "@shared/types";
import api from "api";
import { Button, ButtonGroup, Input, Loader, Submit } from "components";
import { StyledPanelWrap } from "pages/Users/UsersPageStyles";
import { AttributeButtonGroup } from "../../../MainPage/containers/AttributeButtonGroup/AttributeButtonGroup";
import { EntitySuggester } from "../../../MainPage/containers/EntitySuggester/EntitySuggester";

import {
  StyledTable,
  StyledTableWrapper,
  StyledTerritoryColumn,
  StyledTerritoryColumnAllLabel,
  StyledTerritoryList,
  StyledTerritoryListItem,
  StyledTh,
  StyledTHead,
  StyledUserNameColumn,
  StyledUserNameColumnIcon,
  StyledUserNameColumnText,
} from "./UserListStyles";
import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { UsersUtils } from "./UsersUtils";
import { EntityTag } from "components/Advanced";

interface UserList {}

export const UserList: React.FC<UserList> = React.memo(({}) => {
  const [removingUserId, setRemovingUserId] = useState<false | string>("");

  const queryClient = useQueryClient();

  const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.administrationGet();
      return res.data.users.sort((a, b) => (a.id > b.id ? 1 : -1));
    },
    { enabled: api.isLoggedIn() }
  );

  const removingUser = useMemo(() => {
    return removingUserId ? data?.find((d) => d.id === removingUserId) : false;
  }, [removingUserId]);

  const userMutation = useMutation(
    async (userChanges: any) =>
      await api.usersUpdate(userChanges.id, userChanges),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
      },
    }
  );

  const removeUser = async () => {
    if (removingUser) {
      const res: any = await api.usersDelete(removingUser.id);
      if (res.status === 200) {
        toast.warning(`User ${removingUser.name} removed!`);
        queryClient.invalidateQueries("users");
        setRemovingUserId(false);
      }
    }
  };

  const addRightToUser = (
    userId: string,
    territoryId: string,
    mode: "read" | "write"
  ) => {
    const oldUser = data?.find((u: IResponseUser) => u.id === userId);
    if (oldUser) {
      // remove this territory from the list if it was added before
      const newRights: IUserRight[] = [
        ...oldUser.rights.filter((right) => right.territory !== territoryId),
      ];
      newRights.push({ territory: territoryId, mode: mode as UserRoleMode });
      userMutation.mutate({ id: userId, rights: newRights });
    }
  };

  const removeRightFromUser = (userId: string, territoryId: string) => {
    const oldUser = data?.find((u: IResponseUser) => u.id === userId);
    if (oldUser) {
      const newRights: IUserRight[] = [
        ...oldUser.rights.filter((right) => right.territory !== territoryId),
      ];
      userMutation.mutate({ id: userId, rights: newRights });
    }
  };

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "",
        id: "Name",
        accessor: "name",
        Cell: ({ row }: Cell) => {
          const { name, email, role } = row.original as any;
          let icon = <RiUserSearchFill />;
          if (role === "admin") {
            icon = <RiUserStarFill />;
          }
          if (role === "editor") {
            icon = <RiUserSettingsFill />;
          }
          return (
            <StyledUserNameColumn>
              <StyledUserNameColumnIcon>{icon}</StyledUserNameColumnIcon>
              <StyledUserNameColumnText>
                <b>{name}</b>
                <span>{email}</span>
              </StyledUserNameColumnText>
            </StyledUserNameColumn>
          );
        },
      },
      {
        Header: "Username",
        id: "Username",
        Cell: ({ row }: Cell) => {
          const { id, name, email, role } = row.original as any;
          return (
            <Input
              value={name}
              onChangeFn={async (newValue: string) => {
                userMutation.mutate({
                  id: id,
                  name: newValue,
                });
              }}
            />
          );
        },
      },
      {
        Header: "Email",
        id: "Email",
        Cell: ({ row }: Cell) => {
          const { id, name, email, role } = row.original as any;
          return (
            <Input
              value={email}
              onChangeFn={async (newValue: string) => {
                userMutation.mutate({
                  id: id,
                  email: newValue,
                });
              }}
            />
          );
        },
      },
      {
        Header: "Role",
        id: "Role",
        Cell: ({ row }: Cell) => {
          const { id, name, email, role } = row.original as any;
          return (
            <AttributeButtonGroup
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
        Cell: ({ row }: Cell) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
            role: userRole,
          } = row.original as any;

          const readTerritories = rights.filter(
            (r: IUserRight) => r.mode === "read"
          );

          return (
            <StyledTerritoryColumn>
              {userRole !== UserRole.Admin ? (
                <React.Fragment>
                  <EntitySuggester
                    disableCreate
                    onSelected={(newSelectedId: string) => {
                      addRightToUser(userId, newSelectedId, "read");
                    }}
                    categoryTypes={[EntityClass.Territory]}
                    placeholder={"assign a territory"}
                  />
                  <StyledTerritoryList>
                    {readTerritories.length && territoryActants ? (
                      readTerritories.map((right: IUserRight) => {
                        const territoryActant = territoryActants.find(
                          (t: any) => t.territory.id === right.territory
                        );

                        return territoryActant && territoryActant.territory ? (
                          <StyledTerritoryListItem key={right.territory}>
                            <EntityTag
                              actant={territoryActant.territory}
                              button={
                                <Button
                                  key="d"
                                  tooltip="remove territory from rights"
                                  icon={<FaUnlink />}
                                  color="plain"
                                  inverted={true}
                                  onClick={() => {
                                    removeRightFromUser(
                                      userId,
                                      right.territory
                                    );
                                  }}
                                />
                              }
                            />
                          </StyledTerritoryListItem>
                        ) : (
                          <StyledTerritoryListItem key={right.territory}>
                            {right.territory}
                          </StyledTerritoryListItem>
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
        Cell: ({ row }: Cell) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
            role: userRole,
          } = row.original as any;

          const writeTerritories = rights.filter(
            (r: IUserRight) => r.mode === "write"
          );

          return (
            <StyledTerritoryColumn>
              {userRole !== UserRole.Admin ? (
                userRole === UserRole.Editor ? (
                  <React.Fragment>
                    <EntitySuggester
                      disableCreate
                      onSelected={(newSelectedId: string) => {
                        addRightToUser(userId, newSelectedId, "write");
                      }}
                      categoryTypes={[EntityClass.Territory]}
                      placeholder={"assign a territory"}
                    />
                    <StyledTerritoryList>
                      {writeTerritories.length && territoryActants ? (
                        writeTerritories.map((right: IUserRight) => {
                          const territoryActant = territoryActants.find(
                            (t: any) => t.territory.id === right.territory
                          );

                          return territoryActant &&
                            territoryActant.territory ? (
                            <StyledTerritoryListItem key={right.territory}>
                              <EntityTag
                                actant={territoryActant.territory}
                                button={
                                  <Button
                                    key="d"
                                    tooltip="remove territory from rights"
                                    icon={<FaUnlink />}
                                    color="plain"
                                    inverted={true}
                                    onClick={() => {
                                      removeRightFromUser(
                                        userId,
                                        right.territory
                                      );
                                    }}
                                  />
                                }
                              />
                            </StyledTerritoryListItem>
                          ) : (
                            <StyledTerritoryListItem key={right.territory}>
                              {right.territory}
                            </StyledTerritoryListItem>
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
        accessor: "actions",
        Cell: ({ row }: Cell) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
          } = row.original as any;
          const active = (row.original as IUser).active;
          return (
            <ButtonGroup noMarginRight>
              <Button
                key="r"
                icon={<FaTrashAlt size={14} />}
                color="danger"
                tooltip="delete"
                disabled={userId === localStorage.getItem("userid")}
                onClick={() => {
                  setRemovingUserId(userId);
                }}
              />
              <Button
                icon={<FaKey size={14} />}
                tooltip="reset password"
                color="warning"
                onClick={() => {
                  api
                    .resetPasswordAdmin(userId)
                    .then((data) => toast.success(data.data.message));
                }}
              />
              <Button
                icon={
                  active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />
                }
                color={active ? "success" : "danger"}
                tooltip={active ? "set inactive" : "set active"}
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
    ];
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable({
    columns,
    data: data || [],
    getRowId,
    initialState: {
      hiddenColumns: ["id"],
    },
  });

  return (
    <StyledPanelWrap>
      {data && (
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
                {rows.map((row: Row, i: number) => {
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

          <UsersUtils />
        </>
      )}
      <Submit
        title={`Delete User ${removingUser ? removingUser.name : ""}`}
        text={`Do you really want do delete User ${
          removingUser ? removingUser.name : ""
        }?`}
        show={removingUser != false}
        onSubmit={() => {
          removeUser();
        }}
        onCancel={() => {
          setRemovingUserId(false);
        }}
        loading={false}
      />
      <Loader show={isFetching} />
    </StyledPanelWrap>
  );
});
