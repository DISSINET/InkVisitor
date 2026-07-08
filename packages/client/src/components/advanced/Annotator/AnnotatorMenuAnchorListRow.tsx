import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import React, { useState } from "react";
import { FaArrowsAltH, FaEllipsisV, FaUnlink } from "react-icons/fa";
import { Button } from "components/basic/Button/Button";
import { EntityTag } from "../EntityTag/EntityTag";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import {
  StyledAnchorCell,
  StyledAnchorClusterElvl,
  StyledAnchorClusterHoverZone,
  StyledAnchorClusterMoveButton,
  StyledAnchorClusterUnlinkButton,
  StyledAnchorControlsCluster,
} from "./AnnotatorStyles";
import { Tag } from "@inkvisitor/annotator/src/lib";

export const ANCHOR_GRID_COLUMNS = 2;
/** One virtual row: two columns for EntityTag + elvl controls (allows wrapped labels). */
export const ANCHOR_GRID_ROW_HEIGHT = 27;
/**
 * Breathing room before the first row and after the last row. Added to those
 * rows' heights (see rowHeight in AnnotatorMenu) and rendered as border-box
 * padding inside the row, so it scrolls with the content instead of shrinking
 * the scroll viewport (which container padding would do).
 */
export const ANCHOR_GRID_ROW_MARGIN = 5;

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
  /**
   * Render the elvl button group in disabled mode (single, non-interactive
   * current-elvl icon) even when not fully readonly (documents page).
   */
  disableElvl?: boolean;
  /**
   * When false (view mode), collapse the per-anchor controls into a kebab menu
   * next to a static current-elvl icon; when true (edit mode), show resize /
   * elvl / unlink inline as before. Ignored where controls are hidden anyway
   * (readonly, disableElvl).
   */
  editControls?: boolean;
};

export type AnnotatorAnchorGridRowProps = {
  index: number;
  style: React.CSSProperties;
  data: AnnotatorAnchorGridRowData;
};

type AnnotatorAnchorGridCell = {
  item: AnnotatorAnchorListItem;
  entity: IEntity;
} & Pick<
  AnnotatorAnchorGridRowData,
  "onRemoveAnchor" | "onUpdateAnchor" | "onMoveAnchor" | "readonly" | "disableElvl" | "editControls"
>;

type AnnotatorAnchorControlsCluster = Pick<
  AnnotatorAnchorGridCell,
  "item" | "onRemoveAnchor" | "onUpdateAnchor" | "onMoveAnchor" | "editControls"
>;

/**
 * The anchor row's controls, rendered in the tag's button slot. Owns its own
 * hover state so it re-renders itself on hover — EntityTag is memoized and
 * would not re-render when only its `button` content changes. At rest: a static
 * current-elvl icon + a kebab hint. Expanded (kebab hover, or the menu-level
 * edit toggle / Ctrl-hold via editControls): inline resize / interactive elvl /
 * unlink. Kebab and the expanded controls live in one wrapper, so only the
 * kebab — not the label — opens it and it stays open while the pointer moves
 * across the controls.
 */
const AnnotatorAnchorControlsCluster: React.FC<AnnotatorAnchorControlsCluster> = ({
  item,
  onRemoveAnchor,
  onUpdateAnchor,
  onMoveAnchor,
  editControls,
}) => {
  const [hovered, setHovered] = useState(false);
  const elvlValue = item.anchor.attributes.elvl as EntityEnums.Elvl;
  const hasElvlValue = Object.values(EntityEnums.Elvl).includes(elvlValue);
  const open = !!editControls || hovered;

  return (
    <StyledAnchorControlsCluster>
      {/* Static current-elvl icon at a glance while collapsed. Sits outside
          the hover zone below so hovering it (disabled, non-interactive)
          does not open the controls. */}
      {!open && hasElvlValue && (
        <ElvlButtonGroup value={elvlValue} onChange={() => {}} sharpCorners disabled />
      )}
      <StyledAnchorClusterHoverZone
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {open && (
          <>
            {onMoveAnchor && (
              <Button
                icon={<FaArrowsAltH size={12} />}
                color="info"
                inverted
                tooltipLabel="resize anchor span"
                onClick={() => {
                  onMoveAnchor(item.anchor);
                }}
                shape="sharp-square"
              />
            )}
            <StyledAnchorClusterElvl>
              <ElvlButtonGroup
                value={elvlValue}
                onChange={(elvl) => {
                  onUpdateAnchor?.(item.anchor, elvl);
                }}
                sharpCorners
              />
            </StyledAnchorClusterElvl>
            <Button
              icon={<FaUnlink size={12} />}
              color="plain"
              inverted
              tooltipLabel="unlink entity"
              onClick={() => {
                onRemoveAnchor?.(item.anchor);
              }}
              shape="sharp-square"
            />
          </>
        )}
        {/* Kebab is the hover affordance for view mode only; edit mode
            (permanent or Ctrl-hold) shows every button, so no kebab. Kept
            last so its position is stable between collapsed and
            hover-expanded. */}
        {!editControls && (
          <Button icon={<FaEllipsisV size={12} />} color="gray" inverted shape="sharp-square" />
        )}
      </StyledAnchorClusterHoverZone>
    </StyledAnchorControlsCluster>
  );
};

/**
 * One anchor's tag + controls. Where controls are available (not readonly /
 * documents page) they live in the hover-expandable cluster; otherwise only a
 * static current-elvl icon is shown.
 */
const AnnotatorAnchorGridCell: React.FC<AnnotatorAnchorGridCell> = ({
  item,
  entity,
  onRemoveAnchor,
  onUpdateAnchor,
  onMoveAnchor,
  readonly,
  disableElvl,
  editControls,
}) => {
  const elvlValue = item.anchor.attributes.elvl as EntityEnums.Elvl;
  const hasElvlValue = Object.values(EntityEnums.Elvl).includes(elvlValue);
  // Where the inline controls can exist at all (not readonly / documents page).
  const controlsAvailable = !readonly && !disableElvl;

  return (
    <StyledAnchorCell>
      <EntityTag
        fullWidth
        button={
          controlsAvailable ? (
            <AnnotatorAnchorControlsCluster
              item={item}
              onRemoveAnchor={onRemoveAnchor}
              onUpdateAnchor={onUpdateAnchor}
              onMoveAnchor={onMoveAnchor}
              editControls={editControls}
            />
          ) : undefined
        }
        entity={entity}
        elvlButtonGroup={
          // Readonly / documents page: static current-elvl icon (the cluster,
          // which carries elvl otherwise, is not rendered here).
          !controlsAvailable && hasElvlValue ? (
            <ElvlButtonGroup value={elvlValue} onChange={() => {}} sharpCorners disabled />
          ) : (
            false
          )
        }
      />
    </StyledAnchorCell>
  );
};

export const AnnotatorAnchorGridRow = React.memo(
  ({ index, style, data }: AnnotatorAnchorGridRowProps) => {
    const {
      items,
      entities,
      onRemoveAnchor,
      onUpdateAnchor,
      onMoveAnchor,
      readonly,
      disableElvl,
      editControls,
    } = data;
    const left = items[index * ANCHOR_GRID_COLUMNS];
    const right = items[index * ANCHOR_GRID_COLUMNS + 1];

    const isFirst = index === 0;
    const isLast = index === Math.ceil(items.length / ANCHOR_GRID_COLUMNS) - 1;

    const renderCell = (item: AnnotatorAnchorListItem | undefined) => {
      if (!item) {
        return null;
      }
      const entity = entities[item.anchorTagName];
      if (!entity) {
        return null;
      }
      return (
        <AnnotatorAnchorGridCell
          item={item}
          entity={entity}
          onRemoveAnchor={onRemoveAnchor}
          onUpdateAnchor={onUpdateAnchor}
          onMoveAnchor={onMoveAnchor}
          readonly={readonly}
          disableElvl={disableElvl}
          editControls={editControls}
        />
      );
    };

    return (
      <div
        style={{
          ...style,
          boxSizing: "border-box",
          paddingTop: isFirst ? ANCHOR_GRID_ROW_MARGIN : undefined,
          paddingBottom: isLast ? ANCHOR_GRID_ROW_MARGIN : undefined,
          display: "flex",
          flexDirection: "row",
          gap: "0.5rem",
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
