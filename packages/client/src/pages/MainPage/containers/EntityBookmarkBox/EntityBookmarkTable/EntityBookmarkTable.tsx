import { IEntity, IResponseBookmarkFolder } from "@shared/types";
import { EntityTag } from "components/advanced";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CellProps, Column, Row, useTable } from "react-table";
import { EntityBookmarkTableRow } from "./EntityBookmarkTableRow";
import { StyledTable, StyledTagWrap } from "./EntityBookmarkTableStyles";

type CellType = CellProps<IEntity>;

interface EntityBookmarkTable {
  folder: IResponseBookmarkFolder;
  updateFolderEntitys: any;
  removeBookmark: (folderId: string, bookmarkId: string) => void;
}
export const EntityBookmarkTable: React.FC<EntityBookmarkTable> = ({
  folder,
  updateFolderEntitys,
  removeBookmark,
}) => {
  const [folderEntitys, setFolderEntitys] = useState(folder.entities);

  useEffect(() => {
    setFolderEntitys(folder.entities);
  }, [folder]);

  const columns = useMemo<Column<IEntity>[]>(
    () => [
      {
        id: "Action",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          const entity = row.original;

          return (
            <StyledTagWrap>
              <EntityTag
                entity={entity}
                tooltipPosition="left"
                fullWidth
                unlinkButton={{
                  onClick: () => {
                    removeBookmark(folder.id, entity.id);
                  },
                }}
              />
            </StyledTagWrap>
          );
        },
      },
    ],
    [folder]
  );

  const getRowId = useCallback((row: IEntity) => {
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
    data: useMemo(() => folderEntitys || [], [folderEntitys]),
    getRowId,
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
        {rows.map((row: Row<IEntity>, i: number) => {
          prepareRow(row);
          return (
            <EntityBookmarkTableRow
              index={i}
              row={row}
              folder={folder}
              moveRow={moveRow}
              updateOrderFn={updateFolderItemOrder}
              visibleColumns={visibleColumns}
              hasOrder={rows.length > 1}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
