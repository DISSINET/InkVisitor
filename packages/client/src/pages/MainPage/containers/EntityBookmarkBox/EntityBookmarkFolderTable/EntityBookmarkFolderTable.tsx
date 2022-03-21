import { IEntity, IResponseBookmarkFolder } from "@shared/types";
import { Button } from "components";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { Cell, Column, Row, useTable } from "react-table";
import { EntityTag } from "../..";
import { EntityBookmarkFolderTableRow } from "./EntityBookmarkFolderTableRow";
import { StyledTable } from "./EntityBookmarkFolderTableStyles";

interface EntityBookmarkFolderTable {
  folder: IResponseBookmarkFolder;
  updateFolderEntitys: any;
  removeBookmark: Function;
}
export const EntityBookmarkFolderTable: React.FC<EntityBookmarkFolderTable> = ({
  folder,
  updateFolderEntitys,
  removeBookmark,
}) => {
  const [folderEntitys, setFolderEntitys] = useState(folder.entities);

  useEffect(() => {
    setFolderEntitys(folder.entities);
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
          const entity = row.original as IEntity;

          return (
            <EntityTag
              actant={entity as IEntity}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted
                  tooltip="unlink Entity"
                  onClick={() => {
                    removeBookmark(folder.id, entity.id);
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
    data: folderEntitys || [],
    getRowId,
    initialState: {
      hiddenColumns: ["id"],
    },
  });

  const updateFolderItemOrder = () => {
    updateFolderEntitys(
      folderEntitys.map((a) => a.id),
      folder.id
    );
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = folderEntitys[dragIndex];
      const newlySortedEntitys = update(folderEntitys, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRecord],
        ],
      });

      setFolderEntitys(newlySortedEntitys);
    },
    [folderEntitys]
  );

  return (
    <StyledTable {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <EntityBookmarkFolderTableRow
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
