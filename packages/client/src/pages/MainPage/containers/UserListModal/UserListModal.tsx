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
} from "./UserListTableStyles";

import { UserListTableRow } from "./UserListTableRow/UserListTableRow";
import { ActantSuggester } from "../ActantSuggester/ActantSuggester";
import { ActantTag } from "../ActantTag/ActantTag";
import { IResponseUser, IUserRight } from "@shared/types";
import { UserRoleMode } from "@shared/enums";
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
  const [editedUserId, setEditedUserId] = useState<false | string>(false);
  const queryClient = useQueryClient();

  const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.usersGetMore({});
      return res.data;
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
      const newRights: IUserRight[] = [...oldUser.rights];
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
        Header: "User",
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
        Header: "Territories",
        id: "territories",
        Cell: ({ row }: Cell) => {
          const {
            id: userId,
            rights,
            territoryRights: territoryActants,
          } = row.original as any;
          return (
            <>
              <div>
                {rights
                  .filter((r: any) => r.mode === "edit")
                  .map((territory: string) => {
                    const territoryActant = territoryActants.find(
                      (t: any) => t.id === territory
                    );
                    return territoryActant ? (
                      <div key={territoryActant}>
                        <ActantTag
                          actant={territoryActant}
                          short={false}
                          button={
                            <Button
                              key="d"
                              tooltip="unlink actant from tags"
                              icon={<FaUnlink />}
                              color="plain"
                              inverted={true}
                              onClick={() => {
                                // =>
                              }}
                            />
                          }
                        />
                      </div>
                    ) : (
                      <div>{territory} </div>
                    );
                  })}
              </div>
              <ActantSuggester
                allowCreate={false}
                onSelected={(newSelectedId: string) => {
                  addRightToUser(userId, newSelectedId, "write");
                  //
                }}
                categoryIds={["T"]}
                placeholder={"assign a territory"}
              ></ActantSuggester>
            </>
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
                inverted
              />
              <Button
                key="e"
                icon={<FaPencilAlt size={14} />}
                color="warning"
                tooltip="edit"
                inverted={setEditedUserId !== userId}
                onClick={() => {
                  setEditedUserId(userId);
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

  console.log(editedUser);

  return (
    <Modal showModal={isOpen} onClose={() => onCloseFn()} width={"full"}>
      <ModalHeader title={"Manage Users"} />
      <ModalContent>
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
              console.log(row);
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
        {editedUser ? (
          <StyledUserEditor>
            <StyledUserEditorTitle>{editedUser.name}</StyledUserEditorTitle>
            <StyledUserEditorBody>
              <StyledUserEditorForm>
                <StyledUserEditorRow>
                  <StyledUserEditorRowLabel>Username</StyledUserEditorRowLabel>
                  <StyledUserEditorRowValue>
                    <Input
                      width="full"
                      value={editedUser.name}
                      onChangeFn={async (newValue: string) => {
                        userMutation.mutate({ id: editedUser, name: newValue });
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
                          id: editedUser,
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
          </StyledUserEditor>
        ) : (
          <div />
        )}
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
