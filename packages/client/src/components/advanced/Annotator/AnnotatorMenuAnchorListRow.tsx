import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import React from "react";
import { FaArrowsAltH } from "react-icons/fa";
import { Button } from "components/basic/Button/Button";
import { EntityTag } from "../EntityTag/EntityTag";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import { Tag } from "@inkvisitor/annotator/src/lib";

export const ANCHOR_GRID_COLUMNS = 2;
/** One virtual row: two columns for EntityTag + elvl controls (allows wrapped labels). */
export const ANCHOR_GRID_ROW_HEIGHT = 27;

export type AnnotatorAnchorListItem = { anchor: Tag; anchorTagName: string };

export type AnnotatorAnchorGridRowData = {
  items: AnnotatorAnchorListItem[];
  entities: Record<string, IEntity | false>;
  onRemoveAnchor?: (anchor: Tag) => void;
  onUpdateAnchor?: (anchor: Tag, elvl: EntityEnums.Elvl) => void;
  /** Enters move-anchor mode for this anchor (#2885); absent when readonly. */
  onMoveAnchor?: (anchor: Tag) => void;
  /** View-only: render anchors without unlink/elvl controls. */
  readonly?: boolean;
};

export type AnnotatorAnchorGridRowProps = {
  index: number;
  style: React.CSSProperties;
  data: AnnotatorAnchorGridRowData;
};

export const AnnotatorAnchorGridRow = React.memo(
  ({ index, style, data }: AnnotatorAnchorGridRowProps) => {
    const { items, entities, onRemoveAnchor, onUpdateAnchor, onMoveAnchor, readonly } = data;
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
      return (
        <EntityTag
          fullWidth
          button={
            onMoveAnchor ? (
              <Button
                icon={<FaArrowsAltH size={11} />}
                color="primary"
                inverted
                tooltipLabel="Move anchor span"
                onClick={() => {
                  onMoveAnchor(item.anchor);
                }}
                shape="sharp-square"
              />
            ) : undefined
          }
          unlinkButton={
            readonly
              ? false
              : {
                  onClick: () => {
                    onRemoveAnchor?.(item.anchor);
                  },
                }
          }
          entity={entity}
          elvlButtonGroup={
            readonly ? (
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
  },
);
