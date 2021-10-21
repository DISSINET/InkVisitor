import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  ButtonGroup,
  Input,
} from "components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import api from "api";

import {
  RiUserStarFill,
  RiUserSearchFill,
  RiUserSettingsFill,
} from "react-icons/ri";

import {
  FaTrashAlt,
  FaPlus,
  FaPen,
  FaKey,
  FaPencilAlt,
  FaUnlink,
} from "react-icons/fa";

import {
  StyledTable,
  StyledTHead,
  StyledTh,
  StyledUserNameColumn,
  StyledUserNameColumnIcon,
  StyledUserNameColumnText,
  StyledUserEditor,
  StyledUserEditorBody,
  StyledUserEditorFoot,
  StyledUserEditorTitle,
  StyledUserEditorForm,
  StyledUserEditorRow,
  StyledUserEditorRowLabel,
  StyledUserEditorRowValue,
  StyledUserEditorSection,
  StyledTableWrapper,
  StyledTerritoryColumn,
  StyledTerritoryList,
  StyledTerritoryListItem,
} from "./UserListTableStyles";

import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { ActantSuggester } from "../ActantSuggester/ActantSuggester";
import { ActantTag } from "../ActantTag/ActantTag";
import { IResponseUser, IUserRight } from "@shared/types";
import { UserRole, UserRoleMode } from "@shared/enums";
import {
  StyledEditorSection,
  StyledEditorSectionHeader,
  StyledEditorSectionContent,
} from "../StatementEditorBox/StatementEditorBoxStyles";
import { userRoleDict } from "@shared/dictionaries";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";

interface UserListModal {
  isOpen: boolean;
  onCloseFn: Function;
}

export const UserListModal: React.FC<UserListModal> = ({
  isOpen,
  onCloseFn,
}) => {
  const [editedUserId, setEditedUserId] = useState<false | string>("1");
  const queryClient = useQueryClient();

  const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.administrationGet();
      return res.data.users.sort((a, b) => (a.id > b.id ? 1 : -1));
    },
    { enabled: api.isLoggedIn() }
  );

  const editedUser = useMemo(() => {
    return data ? data.find((d) => d.id === editedUserId) : false;
  }, [editedUserId, data]);

  const userMutation = useMutation(
    async (userChanges: any) =>
      await api.usersUpdate(userChanges.id, userChanges),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
      },
    }
  );

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
              {userRole !== UserRole.Admin && (
                <React.Fragment>
                  <ActantSuggester
                    allowCreate={false}
                    onSelected={(newSelectedId: string) => {
                      addRightToUser(userId, newSelectedId, "read");
                    }}
                    categoryIds={["T"]}
                    placeholder={"assign a territory"}
                  ></ActantSuggester>
                  <StyledTerritoryList>
                    {readTerritories.length && territoryActants ? (
                      readTerritories.map((right: IUserRight) => {
                        const territoryActant = territoryActants.find(
                          (t: any) => t.territory.id === right.territory
                        );

                        return territoryActant && territoryActant.territory ? (
                          <StyledTerritoryListItem key={right.territory}>
                            <ActantTag
                              actant={territoryActant.territory}
                              short={false}
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
              {userRole === UserRole.Editor && (
                <React.Fragment>
                  <ActantSuggester
                    allowCreate={false}
                    onSelected={(newSelectedId: string) => {
                      addRightToUser(userId, newSelectedId, "write");
                    }}
                    categoryIds={["T"]}
                    placeholder={"assign a territory"}
                  ></ActantSuggester>
                  <StyledTerritoryList>
                    {writeTerritories.length && territoryActants ? (
                      writeTerritories.map((right: IUserRight) => {
                        const territoryActant = territoryActants.find(
                          (t: any) => t.territory.id === right.territory
                        );

                        return territoryActant && territoryActant.territory ? (
                          <StyledTerritoryListItem key={right.territory}>
                            <ActantTag
                              actant={territoryActant.territory}
                              short={false}
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
          return (
            <ButtonGroup noMargin>
              <Button
                key="r"
                icon={<FaTrashAlt size={14} />}
                color="danger"
                tooltip="delete"
              />
              <Button
                icon={<FaKey size={14} />}
                tooltip="by clicking here, the user password will be restarted and new password send to an address"
                color="warning"
                onClick={() => {}}
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
    <Modal showModal={isOpen} onClose={() => onCloseFn()} width={"full"}>
      <ModalHeader title={"Manage Users"} />
      <ModalContent>
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
                    isSelected={editedUserId === row.id}
                    index={i}
                    row={row}
                    {...row.getRowProps()}
                  />
                );
              })}
            </tbody>
          </StyledTable>
        </StyledTableWrapper>
        {/* {editedUser ? (
          <StyledUserEditor>
            <StyledUserEditorSection>
              <StyledUserEditorTitle>{editedUser.name}</StyledUserEditorTitle>
              <StyledUserEditorBody>
                <StyledUserEditorForm>
                  <StyledUserEditorRow>
                    <StyledUserEditorRowLabel>
                      Username
                    </StyledUserEditorRowLabel>
                    <StyledUserEditorRowValue>
                      <Input
                        width="full"
                        value={editedUser.name}
                        onChangeFn={async (newValue: string) => {
                          userMutation.mutate({
                            id: editedUser.id,
                            name: newValue,
                          });
                        }}
                      />
                    </StyledUserEditorRowValue>
                  </StyledUserEditorRow>
                  <StyledUserEditorRow>
                    <StyledUserEditorRowLabel>Email</StyledUserEditorRowLabel>
                    <StyledUserEditorRowValue>
                      <Input
                        width="full"
                        value={editedUser.email}
                        onChangeFn={async (newValue: string) => {
                          userMutation.mutate({
                            id: editedUser.id,
                            email: newValue,
                          });
                        }}
                      />
                    </StyledUserEditorRowValue>
                  </StyledUserEditorRow>
                  <StyledUserEditorRow>
                    <StyledUserEditorRowLabel>
                      Restart Password
                    </StyledUserEditorRowLabel>
                    <StyledUserEditorRowValue>
                      <Button
                        label="reset password"
                        tooltip="by clicking here, the user password will be restarted and new password send to an address"
                        color="warning"
                        onClick={() => {}}
                      />
                    </StyledUserEditorRowValue>
                  </StyledUserEditorRow>

                  <StyledUserEditorRow>
                    <StyledUserEditorRowLabel>Role</StyledUserEditorRowLabel>
                    <StyledUserEditorRowValue>
                      <AttributeButtonGroup
                        options={[
                          {
                            longValue: userRoleDict[0].label,
                            shortValue: userRoleDict[0].label,
                            selected: editedUser.role === userRoleDict[0].value,
                            onClick: () => {
                              userMutation.mutate({
                                id: editedUser.id,
                                role: userRoleDict[0].value,
                              });
                            },
                          },
                          {
                            longValue: userRoleDict[1].label,
                            shortValue: userRoleDict[1].label,
                            selected: editedUser.role === userRoleDict[1].value,
                            onClick: () => {
                              userMutation.mutate({
                                id: editedUser.id,
                                role: userRoleDict[1].value,
                              });
                            },
                          },
                          {
                            longValue: userRoleDict[2].label,
                            shortValue: userRoleDict[2].label,
                            selected: editedUser.role === userRoleDict[2].value,
                            onClick: () => {
                              userMutation.mutate({
                                id: editedUser.id,
                                role: userRoleDict[2].value,
                              });
                            },
                          },
                        ]}
                      />
                    </StyledUserEditorRowValue>
                  </StyledUserEditorRow>
                </StyledUserEditorForm>
              </StyledUserEditorBody>
              <StyledUserEditorFoot></StyledUserEditorFoot>
            </StyledUserEditorSection>
            <StyledUserEditorSection>
              <ActantSuggester
                allowCreate={false}
                onSelected={(newSelectedId: string) => {
                  //addRightToUser(userId, newSelectedId, "write");
                  //
                }}
                categoryIds={["T"]}
                placeholder={"assign a territory"}
              ></ActantSuggester>
            </StyledUserEditorSection>
          </StyledUserEditor>
        ) : (
          <div />
        )}
       */}
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="add"
            icon={<FaPlus size={14} />}
            tooltip="add new user"
            color="primary"
            label="new user"
          />
          <Button
            key="close"
            label="Close"
            color="primary"
            inverted
            onClick={() => onCloseFn()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
