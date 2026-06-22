import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { MdOutlineCheckBox, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";

import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { IEntity, IResponseQueryEntity, IUser, Relation } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import api from "api";
import { EntitySuggester, EntityTag, UserTag } from "components/advanced";
import { deleteProp, deleteRef } from "constructors";

import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { UserTagSize } from "components/advanced/UserTag/utils";
import { useTheme } from "hooks";
import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import { getRelationSuggesterConfig } from "pages/Query/utils";
import { CELL_DISPLAY_LIMIT, ExplorerCellOverflow } from "./ExplorerCellOverflow";
import { StyledCellValue, StyledCheckboxWrapper, StyledFocusedCircle } from "./ExplorerTableStyles";
import { WIDTH_COLUMN_DEFAULT, WIDTH_COLUMN_EUC, WIDTH_COLUMN_FIRST } from "./types";

const EditableCellValue: React.FC<{
  value: string;
  onSave: (value: string) => void;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        data-no-row-click="true"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== value) {
            onSave(draft);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          font: "inherit",
          fontSize: "1.4rem",
          color: "inherit",
          width: "100%",
          padding: 0,
        }}
      />
    );
  }

  return (
    <StyledCellValue
      data-no-row-click="true"
      onClick={() => setEditing(true)}
      style={{ cursor: "text" }}
    >
      {value || " "}
    </StyledCellValue>
  );
};

interface ExplorerTableRowProps {
  rowId: number;
  rowItem: IResponseQueryEntity;
  columns: Explore.IExploreColumn[];
  handleEditColumn: (
    entity: IEntity,
    columnId: string,
    newEntity: IEntity,
    relationType?: RelationEnums.Type,
  ) => void;

  onRowSelect: (rowId: number, isWithShift?: boolean) => void;
  onRowClick: (rowId: number) => void;

  isSelected?: boolean;
  isLastClicked?: boolean;
  onOpenEntityInDetail?: (entityId: string) => void;
}
const ExplorerTableRow: React.FC<ExplorerTableRowProps> = ({
  rowId,
  rowItem,
  columns,
  handleEditColumn,

  onRowSelect,
  onRowClick,

  isSelected = false,
  isLastClicked = false,
  onOpenEntityInDetail,
}) => {
  const theme = useTheme();

  const handleCheckboxClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRowSelect(rowId, (e as React.MouseEvent).shiftKey);
    },
    [onRowSelect, rowId],
  );

  const handleRowClick = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button, a, input, textarea, select, [role='button'],  [data-no-row-click]")
      ) {
        return;
      }
      onRowClick(rowId);
    },
    [onRowClick, rowId],
  );

  const queryClient = useQueryClient();

  const updateEntityMutation = useMutation({
    mutationFn: async (variables: { entityId: string; changes: Partial<IEntity> }) =>
      await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: () => {
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const { entity: rowEntity, columnData } = rowItem ?? {};

  const handleOpenEntityInDetail = React.useCallback(
    (entity: IEntity) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (entity?.id) {
        onOpenEntityInDetail?.(entity.id);
      }
    },
    [onOpenEntityInDetail],
  );

  const relationUpdateMutation = useMutation({
    mutationFn: async (variables: { relationId: string; changes: Partial<Relation.IRelation> }) =>
      await api.relationUpdate(variables.relationId, variables.changes),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const relationDeleteMutation = useMutation({
    mutationFn: async (relationId: string) => await api.relationDelete(relationId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const handleRemoveFromCloud = (synonymCloud: Relation.IRelation, entityToRemove: string) => {
    if (synonymCloud.entityIds?.length > 2) {
      const newEntityIds = synonymCloud.entityIds.filter((eId) => eId !== entityToRemove);
      relationUpdateMutation?.mutate({
        relationId: synonymCloud.id,
        changes: { entityIds: newEntityIds },
      });
    } else {
      relationDeleteMutation?.mutate(synonymCloud.id);
    }
  };

  const handleUnlinkEntity = React.useCallback(
    async (sourceEntity: IEntity, entityToRemove: IEntity, columnId: string) => {
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

      if (column?.type === Explore.EExploreColumnType.ER) {
        const params = column.params as Explore.IExploreColumnParamsER;
        const relations = await api.relationsGet(sourceEntity.id, {
          relationType: params.relationType,
        });
        if (params.relationType === RelationEnums.Type.Synonym) {
          // SYNONYM CLOUD
          const synonymCloud = relations.data[0];
          handleRemoveFromCloud(synonymCloud, entityToRemove.id);
        } else {
          // OTHER RELATIONS
          const relation = relations.data.find((relation) =>
            relation.entityIds.includes(entityToRemove.id),
          );
          const relationId = relation?.id;
          if (relationId) {
            relationDeleteMutation.mutate(relationId);
          }
        }
      }
    },
    [columns, updateEntityMutation],
  );

  const renderCellValue = React.useCallback(
    (
      cellValue: IEntity | number | string | IUser,
      recordEntity: IEntity,
      column: Explore.IExploreColumn,
    ): React.ReactElement => {
      if (typeof (cellValue as IEntity)?.class !== "undefined") {
        return (
          <span data-no-row-click="true">
            <EntityTag
              entity={cellValue as IEntity}
              onDoubleClick={handleOpenEntityInDetail(cellValue as IEntity)}
              unlinkButton={
                column.editable && {
                  onClick: () => {
                    handleUnlinkEntity(recordEntity, cellValue as IEntity, column.id);
                  },
                }
              }
            />
          </span>
        );
      } else if (typeof (cellValue as IUser)?.email !== "undefined") {
        // is type IUser[]
        return (
          <UserTag
            userId={(cellValue as IUser).id}
            variant="dark"
            size={UserTagSize.Medium}
            fontWeight="normal"
          />
        );
      } else {
        if (column.editable && column.type === Explore.EExploreColumnType.ELI) {
          return (
            <EditableCellValue
              value={cellValue as string}
              onSave={(newValue) => {
                updateEntityMutation.mutate({
                  entityId: recordEntity.id,
                  changes: { legacyId: newValue },
                });
              }}
            />
          );
        }
        return <StyledCellValue>{cellValue as string}</StyledCellValue>;
      }
    },
    [handleUnlinkEntity, handleOpenEntityInDetail, updateEntityMutation],
  );

  const renderCell = React.useCallback(
    (
      recordEntity: IEntity,
      cellData: IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[],
      column: Explore.IExploreColumn,
    ): React.ReactElement => {
      if (Array.isArray(cellData)) {
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {cellData
              .filter((_, i) => i < CELL_DISPLAY_LIMIT)
              .map((cellEntity, key) => {
                return (
                  <React.Fragment
                    key={(cellEntity as IEntity)?.id ? (cellEntity as IEntity).id : key}
                  >
                    {renderCellValue(cellEntity, recordEntity, column)}
                  </React.Fragment>
                );
              })}
            {cellData.length > CELL_DISPLAY_LIMIT && (
              <ExplorerCellOverflow hiddenItems={cellData.slice(CELL_DISPLAY_LIMIT)} />
            )}
          </div>
        );
      } else {
        return renderCellValue(cellData, recordEntity, column);
      }
    },
    [renderCellValue],
  );

  const renderEditSection = React.useCallback(
    (rowEntity: IEntity, column: Explore.IExploreColumn): React.ReactElement | null => {
      if (column.editable) {
        if (column.type === Explore.EExploreColumnType.EPV) {
          return (
            <EntitySuggester
              inputWidth={74}
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
              inputWidth={74}
              categoryTypes={[EntityEnums.Class.Resource]}
              onPicked={(newEntity) => {
                handleEditColumn(rowEntity, column.id, newEntity);
              }}
              compactUntilHover
            />
          );
        }
        if (column.type === Explore.EExploreColumnType.ER) {
          const params = column.params as Explore.IExploreColumnParamsER;
          const cellData = columnData[column.id];
          const hasExistingRelation = Array.isArray(cellData)
            ? cellData.length > 0
            : typeof (cellData as IEntity)?.class !== "undefined";
          const { showSuggester, categoryTypes } = getRelationSuggesterConfig(
            params.relationType,
            rowEntity.class,
            { hasExistingRelation },
          );
          if (!showSuggester) {
            return null;
          }
          return (
            <EntitySuggester
              inputWidth={74}
              categoryTypes={categoryTypes}
              onPicked={(newEntity) => {
                handleEditColumn(rowEntity, column.id, newEntity, params.relationType);
              }}
              compactUntilHover
            />
          );
        }
      }
      return null;
    },
    [columnData, handleEditColumn],
  );

  return (
    <div
      className="qt-row-inner"
      onClick={handleRowClick}
      style={{ display: "flex", width: "100%", minHeight: "100%" }}
    >
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
          {isSelected ? <MdOutlineCheckBox /> : <MdOutlineCheckBoxOutlineBlank />}
        </StyledCheckboxWrapper>

        <span
          data-no-row-click="true"
          style={{
            display: "inline-flex",
            overflow: "hidden",
          }}
        >
          <EntityTag
            entity={rowEntity}
            fullWidth
            onDoubleClick={rowEntity ? handleOpenEntityInDetail(rowEntity) : undefined}
          />
        </span>
      </div>

      {columns.map((column, key) => {
        return (
          <div
            key={key}
            className="qt-col"
            style={{
              width:
                column.type === Explore.EExploreColumnType.EUC ||
                column.type === Explore.EExploreColumnType.ELI
                  ? WIDTH_COLUMN_EUC
                  : WIDTH_COLUMN_DEFAULT,
              minWidth: WIDTH_COLUMN_EUC,
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
    </div>
  );
};

function areRowsEqual(
  prev: Readonly<React.ComponentProps<typeof ExplorerTableRow>>,
  next: Readonly<React.ComponentProps<typeof ExplorerTableRow>>,
) {
  if (prev.rowId !== next.rowId) return false;
  const prevEntityId = prev.rowItem?.entity.id;
  const nextEntityId = next.rowItem?.entity.id;
  if (prevEntityId !== nextEntityId) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isLastClicked !== next.isLastClicked) return false;
  if (prev.onOpenEntityInDetail !== next.onOpenEntityInDetail) return false;
  if (prev.onRowClick !== next.onRowClick) return false;
  // Re-render when columns array identity changes (e.g., add/remove)
  if (prev.columns !== next.columns) return false;
  if (prev.rowItem !== next.rowItem) return false;
  return true;
}

export default React.memo(ExplorerTableRow, areRowsEqual);
