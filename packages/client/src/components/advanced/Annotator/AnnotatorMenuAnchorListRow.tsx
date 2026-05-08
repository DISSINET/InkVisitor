import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button } from "components/basic/Button/Button";
import React from "react";
import {
  MdDone,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdOutlineOpenWith,
} from "react-icons/md";
import { EntityTag } from "../EntityTag/EntityTag";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import { Tag } from "@inkvisitor/annotator/src/lib";
import { ButtonSize } from "types";

export const ANCHOR_GRID_COLUMNS = 2;
/** One virtual row: two columns for EntityTag + elvl controls (allows wrapped labels). */
export const ANCHOR_GRID_ROW_HEIGHT = 27;

export type AnnotatorAnchorListItem = {
  anchor: Tag;
  anchorTagName: string;
  stableKey: string;
};

export type AnnotatorAnchorGridRowData = {
  items: AnnotatorAnchorListItem[];
  entities: Record<string, IEntity | false>;
  onRemoveAnchor?: (anchor: Tag) => void;
  onUpdateAnchor?: (anchor: Tag, elvl: EntityEnums.Elvl) => void;
  onNudgeAnchorSpan?: (
    anchor: Tag,
    boundary: "start" | "end",
    direction: "left" | "right"
  ) => boolean;
  onCommitAnchorSpanEdits?: () => void;
  editingAnchorKey: string | null;
  hasPendingSpanEditChanges: boolean;
  setEditingAnchorKey: (key: string | null) => void;
  setHasPendingSpanEditChanges: (hasChanges: boolean) => void;
};

export type AnnotatorAnchorGridRowProps = {
  index: number;
  style: React.CSSProperties;
  data: AnnotatorAnchorGridRowData;
};

export const AnnotatorAnchorGridRow = React.memo(
  ({ index, style, data }: AnnotatorAnchorGridRowProps) => {
    const {
      items,
      entities,
      onRemoveAnchor,
      onUpdateAnchor,
      onNudgeAnchorSpan,
      onCommitAnchorSpanEdits,
      editingAnchorKey,
      hasPendingSpanEditChanges,
      setEditingAnchorKey,
      setHasPendingSpanEditChanges,
    } = data;
    const left = items[index * ANCHOR_GRID_COLUMNS];
    const right = items[index * ANCHOR_GRID_COLUMNS + 1];

    const renderCell = (item: AnnotatorAnchorListItem | undefined) => {
      if (!item) {
        return null;
      }
      const entity = entities[item.anchorTagName];
      if (!entity) {
        return null;
      }
      const anchorKey = item.stableKey;
      const isSpanEditActive = editingAnchorKey === anchorKey;
      return (
        <EntityTag
          fullWidth
          unlinkButton={{
            onClick: () => {
              onRemoveAnchor?.(item.anchor);
            },
          }}
          entity={entity}
          disableClick={isSpanEditActive}
          disableDoubleClick={isSpanEditActive}
          button={
            <div
              style={{ display: "flex", alignItems: "center" }}
              onBlur={(event) => {
                if (!isSpanEditActive) {
                  return;
                }
                const nextFocused = event.relatedTarget as Node | null;
                if (nextFocused && event.currentTarget.contains(nextFocused)) {
                  return;
                }
                setEditingAnchorKey(null);
                if (hasPendingSpanEditChanges) {
                  onCommitAnchorSpanEdits?.();
                  setHasPendingSpanEditChanges(false);
                }
              }}
            >
              {isSpanEditActive && (
                <>
                  <Button
                    color="success"
                    inverted
                    size={ButtonSize.Small}
                    icon={<MdKeyboardDoubleArrowLeft size={14} />}
                    tooltipLabel="Move start tag one character left"
                    onClick={() => {
                      const changed = onNudgeAnchorSpan?.(item.anchor, "start", "left");
                      if (changed) {
                        setHasPendingSpanEditChanges(true);
                      }
                    }}
                  />
                  <Button
                    color="success"
                    inverted
                    size={ButtonSize.Small}
                    icon={<MdKeyboardDoubleArrowRight size={14} />}
                    tooltipLabel="Move start tag one character right"
                    onClick={() => {
                      const changed = onNudgeAnchorSpan?.(item.anchor, "start", "right");
                      if (changed) {
                        setHasPendingSpanEditChanges(true);
                      }
                    }}
                  />
                  <Button
                    color="info"
                    inverted
                    size={ButtonSize.Small}
                    icon={<MdKeyboardDoubleArrowLeft size={14} />}
                    tooltipLabel="Move end tag one character left"
                    onClick={() => {
                      const changed = onNudgeAnchorSpan?.(item.anchor, "end", "left");
                      if (changed) {
                        setHasPendingSpanEditChanges(true);
                      }
                    }}
                  />
                  <Button
                    color="info"
                    inverted
                    size={ButtonSize.Small}
                    icon={<MdKeyboardDoubleArrowRight size={14} />}
                    tooltipLabel="Move end tag one character right"
                    onClick={() => {
                      const changed = onNudgeAnchorSpan?.(item.anchor, "end", "right");
                      if (changed) {
                        setHasPendingSpanEditChanges(true);
                      }
                    }}
                  />
                </>
              )}
              <Button
                color={isSpanEditActive ? "warning" : "plain"}
                inverted
                size={ButtonSize.Small}
                icon={isSpanEditActive ? <MdDone size={14} /> : <MdOutlineOpenWith size={14} />}
                tooltipLabel={
                  isSpanEditActive ? "Finish anchor span edit" : "Edit anchor span bounds"
                }
                onClick={() => {
                  if (isSpanEditActive) {
                    setEditingAnchorKey(null);
                    if (hasPendingSpanEditChanges) {
                      onCommitAnchorSpanEdits?.();
                      setHasPendingSpanEditChanges(false);
                    }
                    return;
                  }
                  if (!isSpanEditActive) {
                    setHasPendingSpanEditChanges(false);
                    setEditingAnchorKey(anchorKey);
                  }
                }}
              />
            </div>
          }
          elvlButtonGroup={
            isSpanEditActive ? (
              false
            ) : (
              <ElvlButtonGroup
                value={item.anchor.attributes.elvl as EntityEnums.Elvl}
                onChange={(elvl) => {
                  onUpdateAnchor?.(item.anchor, elvl);
                }}
              />
            )
          }
        />
      );
    };

    return (
      <div
        style={{
          ...style,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          gap: "0.5rem",
          padding: "0 0.25rem",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {renderCell(left)}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {renderCell(right)}
        </div>
      </div>
    );
  }
);
