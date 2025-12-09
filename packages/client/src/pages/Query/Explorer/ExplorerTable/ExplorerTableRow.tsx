import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useContext } from "react";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaUserAlt,
} from "react-icons/fa";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { ThemeContext } from "styled-components";

import { classesAll } from "@shared/dictionaries/entity";
import { IEntity, IResponseQueryEntity, IUser } from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import { EntitySuggester, EntityTag } from "components/advanced";
import { deleteProp, deleteRef } from "constructors";

import { EntityEnums } from "@shared/enums";
import {
  StyledCheckboxWrapper,
  StyledFocusedCircle,
  StyledUserTag,
} from "./ExplorerTableStyles";
import { WIDTH_COLUMN_DEFAULT, WIDTH_COLUMN_FIRST } from "./types";
import { HiMiniDocumentMagnifyingGlass } from "react-icons/hi2";
import { Button } from "components";

interface ExplorerTableRowProps {
  rowId: number;
  rowItem: IResponseQueryEntity;
  columns: Explore.IExploreColumn[];
  handleEditColumn: (
    entity: IEntity,
    columnId: string,
    newEntity: IEntity
  ) => void;

  onRowSelect: (rowId: number, isWithShift?: boolean) => void;
  onExpand: (rowId: number) => void;

  isSelected?: boolean;
  isLastClicked?: boolean;
  isExpanded?: boolean;
  invalidateActiveQuery?: () => void;
}
const ExplorerTableRow: React.FC<ExplorerTableRowProps> = ({
  rowId,
  rowItem,
  columns,
  handleEditColumn,

  onRowSelect,
  onExpand,

  isSelected = false,
  isLastClicked = false,
  // isExpanded = false,
  invalidateActiveQuery,
}) => {
  const themeContext = useContext(ThemeContext);
  const handleCheckboxClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRowSelect(rowId, (e as React.MouseEvent).shiftKey);
    },
    [onRowSelect, rowId]
  );
  const handleExpandClick = React.useCallback(() => {
    onExpand(rowId);
  }, [onExpand, rowId]);

  const queryClient = useQueryClient();

  const updateEntityMutation = useMutation({
    mutationFn: async (variables: {
      entityId: string;
      changes: Partial<IEntity>;
    }) => await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: () => {
      if (invalidateActiveQuery) {
        invalidateActiveQuery();
      } else {
        queryClient.invalidateQueries({
          queryKey: ["query"],
        });
      }
    },
  });

  const { entity: rowEntity, columnData } = rowItem ?? {};

  const handleUnlinkEntity = React.useCallback(
    (sourceEntity: IEntity, entityToRemove: IEntity, columnId: string) => {
      const column = columns.find((column) => column.id === columnId);

      if (column?.type === Explore.EExploreColumnType.EPT) {
        const newEntity = deleteProp(sourceEntity, {
          typeEntityId: entityToRemove.id,
        });

        updateEntityMutation.mutate({
          entityId: sourceEntity.id,
          changes: {
            props: newEntity.props,
          },
        });
      }

      if (column?.type === Explore.EExploreColumnType.EPV) {
        const newEntity = deleteProp(sourceEntity, {
          valueEntityId: entityToRemove.id,
        });

        updateEntityMutation.mutate({
          entityId: sourceEntity.id,
          changes: {
            props: newEntity.props,
          },
        });
      }

      if (column?.type === Explore.EExploreColumnType.ERR) {
        const newEntity = deleteRef(sourceEntity, {
          resourceId: entityToRemove.id,
        });

        updateEntityMutation.mutate({
          entityId: sourceEntity.id,
          changes: {
            references: newEntity.references,
          },
        });
      }
    },
    [columns, updateEntityMutation]
  );

  const renderCellValue = React.useCallback(
    (
      cellValue: IEntity | number | string | IUser,
      recordEntity: IEntity,
      column: Explore.IExploreColumn
    ): React.ReactElement => {
      if (typeof (cellValue as IEntity)?.class !== "undefined") {
        return (
          <EntityTag
            entity={cellValue as IEntity}
            unlinkButton={
              column.editable && {
                onClick: () => {
                  handleUnlinkEntity(
                    recordEntity,
                    cellValue as IEntity,
                    column.id
                  );
                },
              }
            }
            disableDoubleClick
          />
        );
      } else if (typeof (cellValue as IUser)?.email !== "undefined") {
        // is type IUser[]
        return (
          <StyledUserTag>
            <FaUserAlt
              size={14}
              // onClick={() => setUserCustomizationOpen(true)}
            />
            <span>{(cellValue as IUser).name}</span>
          </StyledUserTag>
        );
      } else {
        return (
          <div>
            <span>{cellValue as string}</span>
          </div>
        );
      }
    },
    [handleUnlinkEntity]
  );

  const renderCell = React.useCallback(
    (
      recordEntity: IEntity,
      cellData:
        | IEntity
        | IEntity[]
        | number
        | number[]
        | string
        | string[]
        | IUser
        | IUser[],
      column: Explore.IExploreColumn
    ): React.ReactElement => {
      if (Array.isArray(cellData)) {
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {cellData
              // todo: this limits the number of entities displayed in the cell
              .filter((_, i) => i < 3)
              .map((cellEntity, key) => {
                return (
                  <React.Fragment
                    key={
                      (cellEntity as IEntity)?.id
                        ? (cellEntity as IEntity).id
                        : key
                    }
                  >
                    {renderCellValue(cellEntity, recordEntity, column)}
                  </React.Fragment>
                );
              })}
          </div>
        );
      } else {
        return renderCellValue(cellData, recordEntity, column);
      }
    },
    [renderCellValue]
  );

  const renderEditSection = React.useCallback(
    (
      rowEntity: IEntity,
      column: Explore.IExploreColumn
    ): React.ReactElement | null => {
      if (column.editable) {
        if (column.type === Explore.EExploreColumnType.EPV) {
          return (
            <EntitySuggester
              categoryTypes={classesAll}
              onPicked={(newEntity) => {
                handleEditColumn(rowEntity, column.id, newEntity);
              }}
              compactUntilHover
            />
          );
        }
        if (column.type === Explore.EExploreColumnType.ERR) {
          return (
            <EntitySuggester
              categoryTypes={[EntityEnums.Class.Resource]}
              onPicked={(newEntity) => {
                handleEditColumn(rowEntity, column.id, newEntity);
              }}
              compactUntilHover
            />
          );
        }
      }
      return null;
    },
    [handleEditColumn]
  );

  return (
    <React.Fragment>
      <div
        className="qt-col"
        style={{
          width: WIDTH_COLUMN_FIRST,
          minWidth: WIDTH_COLUMN_FIRST,
          maxWidth: WIDTH_COLUMN_FIRST,
        }}
      >
        <StyledCheckboxWrapper onClick={handleCheckboxClick}>
          {isLastClicked && <StyledFocusedCircle />}
          {isSelected ? (
            <MdOutlineCheckBox />
          ) : (
            <MdOutlineCheckBoxOutlineBlank />
          )}
        </StyledCheckboxWrapper>

        <Button
          noBackground
          noBorder
          icon={
            <HiMiniDocumentMagnifyingGlass
              size={20}
              color={themeContext?.color.primary}
            />
          }
          onClick={handleExpandClick}
        />

        <span
          style={{
            display: "inline-flex",
            overflow: "hidden",
          }}
        >
          <EntityTag entity={rowEntity} fullWidth disableDoubleClick />
        </span>
      </div>

      {columns.map((column, key) => {
        return (
          <div
            key={key}
            className="qt-col"
            style={{
              width: WIDTH_COLUMN_DEFAULT,
              minWidth: WIDTH_COLUMN_DEFAULT,
              maxWidth: WIDTH_COLUMN_DEFAULT,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                gap: "0.25rem",
              }}
            >
              {renderCell(rowEntity, columnData[column.id], column)}
              {renderEditSection(rowEntity, column)}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
};

function areRowsEqual(
  prev: Readonly<React.ComponentProps<typeof ExplorerTableRow>>,
  next: Readonly<React.ComponentProps<typeof ExplorerTableRow>>
) {
  if (prev.rowId !== next.rowId) return false;
  const prevEntityId = prev.rowItem?.entity.id;
  const nextEntityId = next.rowItem?.entity.id;
  if (prevEntityId !== nextEntityId) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isLastClicked !== next.isLastClicked) return false;
  if (prev.isExpanded !== next.isExpanded) return false;
  // Re-render when columns array identity changes (e.g., add/remove)
  if (prev.columns !== next.columns) return false;
  return true;
}

export default React.memo(ExplorerTableRow, areRowsEqual);
