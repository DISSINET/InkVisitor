import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
} from "./ActantBookmarkFolderTableStyles";
import {
  IAction,
  IActant,
  IResponseGeneric,
  IResponseStatement,
  IStatementAction,
  IResponseBookmarkFolder,
} from "@shared/types";
import { ActantSuggester, ActantTag, CertaintyToggle, ElvlToggle } from "../..";
import { Button, Input } from "components";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ActantType } from "@shared/enums";
import { ActantBookmarkFolderTableRow } from "./ActantBookmarkFolderTableRow";

interface ActantBookmarkFolderTable {
  folder: IResponseBookmarkFolder;
  updateMutation: any;
  removeBookmark: Function;
}
export const ActantBookmarkFolderTable: React.FC<ActantBookmarkFolderTable> = ({
  folder,
  updateMutation,
  removeBookmark,
}) => {
  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        id: "id",
        accessor: "id",
      },
      {
        id: "Action",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const actant = row.original as IActant;

          return (
            <ActantTag
              actant={actant as IActant}
              short={false}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="danger"
                  tooltip="unlink actant"
                  onClick={() => {
                    removeBookmark(folder.id, actant.id);
                  }}
                />
              }
            />
          );
        },
      },
    ];
  }, [folder]);

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable({
    columns,
    data: folder.actants || [],
    getRowId,
    initialState: {
      hiddenColumns: ["id"],
    },
  });

  const updateFolderItemOrder = () => {
    // updateActionsMutation.mutate({
    //   actions: actions,
    // });
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = folder.actants[dragIndex];
      console.log(dragRecord);
      //   setFilteredActions(
      //     update(filteredActions, {
      //       $splice: [
      //         [dragIndex, 1],
      //         [hoverIndex, 0, dragRecord],
      //       ],
      //     })
      //   );
    },
    [folder]
  );

  return (
    <StyledTable {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <ActantBookmarkFolderTableRow
              index={i}
              row={row}
              folder={folder}
              moveRow={moveRow}
              updateOrderFn={updateFolderItemOrder}
              visibleColumns={visibleColumns}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
