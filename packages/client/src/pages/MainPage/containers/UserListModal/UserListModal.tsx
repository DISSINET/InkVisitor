import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row } from "react-table";
import { Modal, ModalHeader, ModalContent, ModalFooter, Button, ButtonGroup } from "components";
import { useQuery } from "react-query";
import api from "api";

import {
  StyledTable,
  StyledTHead,
  StyledTh,
} from "./UserListTableStyles";

import {UserListTableRow}from "./UserListTableRow/UserListTableRow"

interface UserListModal {
  isOpen: boolean;
  handler: Function; 
}

export const UserListModal: React.FC = (modVals: UserListModal) => {
   const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.usersGetMore({});
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );
   
   console.log(data)

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "Name",
        id: "Name",
        accessor: "name",
      },
      {
        Header: "Email",
        id: "email",
        accessor: "email",
      },
      {
        Header: "Role",
        id: "role",
        accessor: "role",
      },
      {
        Header: "Territories",
        id: "territories",
        accessor: "territories",
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
      },
     ]
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
    <Modal showModal={modVals.isOpen} onClose={() => modVals.handler()} width="middle">
     <ModalHeader title={"Manage Users"} />
      <ModalContent>
       <StyledTable {...getTableProps()}>
       <StyledTHead>
          {headerGroups.map((headerGroup, key) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={key}>
              <th></th>
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

      </ModalContent>
      <ModalFooter>
      <ButtonGroup>
        <Button
          key="close"
          label="Close"
          color="primary"
          inverted
          onClick={() => modVals.handler()}
        />
      </ButtonGroup>
      </ModalFooter>
    </Modal>
    );
};
