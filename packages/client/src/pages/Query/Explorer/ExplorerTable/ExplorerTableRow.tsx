import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import {
  entityStatusDict,
  conceptPartOfSpeechDict,
  actionPartOfSpeechDict,
} from "@inkvisitor/shared/dictionaries";
import { IEntity, IResponseQueryEntity, IUser, Relation } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import api from "api";
import { Checkbox } from "components";
import Dropdown, { EntitySuggester, EntityTag, UserTag } from "components/advanced";
import { deleteProp, deleteRef } from "constructors";
import { useOrderedLanguageDict } from "hooks/react-query";

import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";

import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import { getRelationSuggesterConfig } from "pages/Query/utils";
import { CELL_DISPLAY_LIMIT, ExplorerCellOverflow } from "./Cell/ExplorerCellOverflow";
import {
  StyledAltLabelAddInput,
  StyledAltLabelChip,
  StyledAltLabelRemove,
  StyledAltLabelsWrap,
  StyledCellArrayWrap,
  StyledCellContent,
  StyledCellValue,
  StyledCheckboxWrapper,
  StyledEditableCellValue,
  StyledEditableInput,
  StyledEntityTagWrap,
  StyledFocusedCircle,
  StyledRowInner,
} from "./ExplorerTableStyles";
import { WIDTH_COLUMN_FIRST } from "./constants";
import { getColumnWidth } from "./utils";

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
      <StyledEditableInput
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
      />
    );
  }

  return (
    <StyledEditableCellValue data-no-row-click="true" onClick={() => setEditing(true)}>
      {value || " "}
    </StyledEditableCellValue>
  );
};

const EditableAltLabels: React.FC<{
  entity: IEntity;
  onSave: (labels: string[]) => void;
}> = ({ entity, onSave }) => {
  const [newLabel, setNewLabel] = React.useState("");
  const altLabels = (entity.labels ?? []).slice(1);

  return (
    <StyledAltLabelsWrap data-no-row-click="true">
      {altLabels.map((label, i) => (
        <StyledAltLabelChip key={i}>
          {label}
          <StyledAltLabelRemove
            type="button"
            onClick={() => onSave(entity.labels.filter((_, idx) => idx !== i + 1))}
          >
            ×
          </StyledAltLabelRemove>
        </StyledAltLabelChip>
      ))}
      <StyledAltLabelAddInput
        $hasValue={!!newLabel}
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newLabel.trim()) {
            onSave([...entity.labels, newLabel.trim()]);
            setNewLabel("");
          }
        }}
        placeholder="+"
      />
    </StyledAltLabelsWrap>
  );
};

interface ExplorerTableRowProps {
  rowId: number;
  rowItem: IResponseQueryEntity;
  columns: Explore.IExploreColumn[];
  /** Content-estimated widths per column id; static fallback when absent. */
  columnWidths: Record<string, number>;
  handleEditColumn: (
    entity: IEntity,
    columnId: string,
    newEntity: IEntity,
    relationType?: RelationEnums.Type
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
  columnWidths,
  handleEditColumn,

  onRowSelect,
  onRowClick,

  isSelected = false,
  isLastClicked = false,
  onOpenEntityInDetail,
}) => {
  const handleCheckboxChange = React.useCallback(
    (value: boolean, e?: React.MouseEvent) => {
      onRowSelect(rowId, e?.shiftKey);
    },
    [onRowSelect, rowId]
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
    [onRowClick, rowId]
  );

  const queryClient = useQueryClient();

  const orderedLanguageDict = useOrderedLanguageDict();

  // Every editable cell writes to the row's own entity - even one showing a
  // related entity edits this row's props - so the row's mode decides them all.
  // Without a write mode the cells render as plain values: no dropdown, no
  // suggester, no unlink button. A Viewer resolves to Read on every class, and
  // a Territory, Statement or Resource the editor has no right to does too.
  const rowIsEditable = rowItem?.right !== UserEnums.RoleMode.Read;
  const isColumnEditable = React.useCallback(
    (column: Explore.IExploreColumn) => column.editable && rowIsEditable,
    [rowIsEditable]
  );

  const updateEntityMutation = useMutation({
    mutationFn: async (variables: { entityId: string; changes: Partial<IEntity> }) =>
      await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: () => {
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const { entity: rowEntity, columnData, isEquivalent, isSubordinate } = rowItem ?? {};

  const handleOpenEntityInDetail = React.useCallback(
    (entity: IEntity) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (entity?.id) {
        onOpenEntityInDetail?.(entity.id);
      }
    },
    [onOpenEntityInDetail]
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

      if (column?.type === Explore.EExploreColumnType.ERV) {
        const newEntity = deleteRef(sourceEntity, {
          valueId: entityToRemove.id,
        });

        updateEntityMutation.mutate({
          entityId: sourceEntity.id,
          changes: {
            references: newEntity.references,
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
            relation.entityIds.includes(entityToRemove.id)
          );
          const relationId = relation?.id;
          if (relationId) {
            relationDeleteMutation.mutate(relationId);
          }
        }
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
          <span data-no-row-click="true">
            <EntityTag
              entity={cellValue as IEntity}
              onDoubleClick={handleOpenEntityInDetail(cellValue as IEntity)}
              unlinkButton={
                isColumnEditable(column) && {
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
        return <UserTag userId={(cellValue as IUser).id} />;
      } else {
        if (isColumnEditable(column)) {
          if (column.type === Explore.EExploreColumnType.ELI) {
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
          if (column.type === Explore.EExploreColumnType.EDET) {
            return (
              <EditableCellValue
                value={cellValue as string}
                onSave={(newValue) => {
                  updateEntityMutation.mutate({
                    entityId: recordEntity.id,
                    changes: { detail: newValue },
                  });
                }}
              />
            );
          }
          if (column.type === Explore.EExploreColumnType.EST) {
            return (
              <Dropdown.Single.Basic
                width={140}
                value={recordEntity.status}
                options={entityStatusDict}
                onChange={(v) => {
                  updateEntityMutation.mutate({
                    entityId: recordEntity.id,
                    changes: { status: v },
                  });
                }}
              />
            );
          }
          if (column.type === Explore.EExploreColumnType.ELA) {
            return (
              <Dropdown.Single.Basic
                width={140}
                value={recordEntity.language}
                options={orderedLanguageDict}
                onChange={(v) => {
                  updateEntityMutation.mutate({
                    entityId: recordEntity.id,
                    changes: { language: v || EntityEnums.Language.Empty },
                  });
                }}
              />
            );
          }
          if (column.type === Explore.EExploreColumnType.EAL) {
            return (
              <EditableAltLabels
                entity={recordEntity}
                onSave={(labels) => {
                  updateEntityMutation.mutate({
                    entityId: recordEntity.id,
                    changes: { labels },
                  });
                }}
              />
            );
          }
          if (column.type === Explore.EExploreColumnType.EPOS) {
            if (recordEntity.class === EntityEnums.Class.Concept) {
              return (
                <Dropdown.Single.Basic
                  width={140}
                  value={(recordEntity.data as any)?.pos}
                  options={conceptPartOfSpeechDict}
                  onChange={(v) => {
                    updateEntityMutation.mutate({
                      entityId: recordEntity.id,
                      changes: { data: { ...recordEntity.data, pos: v } },
                    });
                  }}
                />
              );
            }
            if (recordEntity.class === EntityEnums.Class.Action) {
              return (
                <Dropdown.Single.Basic
                  width={140}
                  value={(recordEntity.data as any)?.pos}
                  options={actionPartOfSpeechDict}
                  onChange={(v) => {
                    updateEntityMutation.mutate({
                      entityId: recordEntity.id,
                      changes: { data: { ...recordEntity.data, pos: v } },
                    });
                  }}
                />
              );
            }
          }
        }
        return <StyledCellValue>{cellValue as string}</StyledCellValue>;
      }
    },
    [
      handleUnlinkEntity,
      handleOpenEntityInDetail,
      updateEntityMutation,
      orderedLanguageDict,
      isColumnEditable,
    ]
  );

  const renderCell = React.useCallback(
    (
      recordEntity: IEntity,
      cellData: IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[],
      column: Explore.IExploreColumn
    ): React.ReactElement => {
      if (Array.isArray(cellData)) {
        return (
          <StyledCellArrayWrap>
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
          </StyledCellArrayWrap>
        );
      } else {
        return renderCellValue(cellData, recordEntity, column);
      }
    },
    [renderCellValue]
  );

  const renderEditSection = React.useCallback(
    (rowEntity: IEntity, column: Explore.IExploreColumn): React.ReactElement | null => {
      if (isColumnEditable(column)) {
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
        if (column.type === Explore.EExploreColumnType.ERV) {
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
            { hasExistingRelation }
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
    [columnData, handleEditColumn, isColumnEditable]
  );

  return (
    <StyledRowInner className="qt-row-inner" onClick={handleRowClick}>
      <div
        className="qt-col"
        style={{
          width: WIDTH_COLUMN_FIRST,
          minWidth: WIDTH_COLUMN_FIRST,
          maxWidth: WIDTH_COLUMN_FIRST,
        }}
      >
        <StyledCheckboxWrapper>
          {isLastClicked && <StyledFocusedCircle />}
          <Checkbox
            value={isSelected}
            color="primary"
            noFill
            size={15}
            onChangeFn={handleCheckboxChange}
          />
        </StyledCheckboxWrapper>

        <StyledEntityTagWrap data-no-row-click="true">
          <EntityTag
            entity={rowEntity}
            fullWidth
            onDoubleClick={rowEntity ? handleOpenEntityInDetail(rowEntity) : undefined}
            isEquivalent={isEquivalent}
            isSubordinate={isSubordinate}
          />
        </StyledEntityTagWrap>
      </div>

      {columns.map((column, key) => {
        const width = columnWidths[column.id] ?? getColumnWidth(column.type);
        return (
          <div
            key={key}
            className="qt-col"
            style={{
              width,
              minWidth: width,
              maxWidth: width,
            }}
          >
            <StyledCellContent>
              {renderCell(rowEntity, columnData[column.id], column)}
              {renderEditSection(rowEntity, column)}
            </StyledCellContent>
          </div>
        );
      })}
    </StyledRowInner>
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
  if (prev.onOpenEntityInDetail !== next.onOpenEntityInDetail) return false;
  if (prev.onRowClick !== next.onRowClick) return false;
  // Re-render when columns array identity changes (e.g., add/remove)
  if (prev.columns !== next.columns) return false;
  // Re-render when the width map identity changes (ratchet grew / query reset)
  if (prev.columnWidths !== next.columnWidths) return false;
  if (prev.rowItem !== next.rowItem) return false;
  return true;
}

export default React.memo(ExplorerTableRow, areRowsEqual);
