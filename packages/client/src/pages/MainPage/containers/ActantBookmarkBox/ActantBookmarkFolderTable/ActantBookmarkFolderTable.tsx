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
import { EntitySuggester, EntityTag, CertaintyToggle, ElvlToggle } from "../..";
import { Button, Input } from "components";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ActantType } from "@shared/enums";
import { ActantBookmarkFolderTableRow } from "./ActantBookmarkFolderTableRow";

interface ActantBookmarkFolderTable {
  folder: IResponseBookmarkFolder;
  updateFolderActants: any;
  removeBookmark: Function;
}
export const ActantBookmarkFolderTable: React.FC<ActantBookmarkFolderTable> = ({
  folder,
  updateFolderActants,
  removeBookmark,
}) => {
  const [folderActants, setFolderActants] = useState(folder.actants);

  useEffect(() => {
    setFolderActants(folder.actants);
  }, [folder]);

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
            <EntityTag
              actant={actant as IActant}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted
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
    data: folderActants || [],
    getRowId,
    initialState: {
      hiddenColumns: ["id"],
    },
  });

  const updateFolderItemOrder = () => {
    updateFolderActants(
      folderActants.map((a) => a.id),
      folder.id
    );
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = folderActants[dragIndex];
      const newlySortedActants = update(folderActants, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRecord],
        ],
      });

      setFolderActants(newlySortedActants);
    },
    [folderActants]
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
