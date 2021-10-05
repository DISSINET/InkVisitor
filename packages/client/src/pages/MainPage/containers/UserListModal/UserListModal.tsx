import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  ButtonGroup,
} from "components";
import { useQuery } from "react-query";
import api from "api";

import { FaTrashAlt, FaPlus } from "react-icons/fa";

import { StyledTable, StyledTHead, StyledTh } from "./UserListTableStyles";

import { UserListTableRow } from "./UserListTableRow/UserListTableRow";

interface UserListModal {
  isOpen: boolean;
  onCloseFn: Function;
}

export const UserListModal: React.FC<UserListModal> = ({
  isOpen,
  onCloseFn,
}) => {
  const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.usersGetMore({});
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "Name (Email)",
        id: "Name",
        accessor: "name",
        Cell: ({ row }: Cell) => {
          const username = row.values.Name;
          const mail = "me@mail.com"; //row.values.email;
          return (
            <>
              <h6>{username}</h6>
              <span>{mail}</span>
            </>
          );
        },
      },
      {
        Header: "Role",
        id: "role",
        accessor: "role",
        Cell: ({ row }: Cell) => {
          const role = row.values.role;
          return <span>{role}</span>;
        },
      },
      {
        Header: "Territories",
        id: "territories",
      },
      {
        Header: "Password",
        id: "password",
        accessor: "password",
      },
      {
        Header: "Actions",
        id: "actions",
        accessor: "actions",
        Cell: ({ row }: Cell) => {
          return (
            <ButtonGroup noMargin>
              <Button
                key="add"
                icon={<FaPlus size={14} />}
                tooltip="add new user"
                color="plain"
                inverted
              />
              <Button
                key="r"
                icon={<FaTrashAlt size={14} />}
                color="danger"
                tooltip="delete"
                inverted
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
    <Modal showModal={isOpen} onClose={() => onCloseFn()} width="thin">
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
              return (
                <UserListTableRow index={i} row={row} {...row.getRowProps()} />
              );
            })}
          </tbody>
        </StyledTable>
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
