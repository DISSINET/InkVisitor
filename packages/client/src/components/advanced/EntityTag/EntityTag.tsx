import { Placement } from "@popperjs/core";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { ThemeColor } from "Theme/theme";
import { Button, Tag, Tooltip } from "components";
import { EntityTooltip } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { toast } from "react-toastify";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DetailBoxState, DraggedEntityReduxItem, EntityColors, EntityDragItem } from "types";
import {
  getEntityLabel,
  getShortLabelByLetterCount,
  isFirstLabelEmpty,
  isValidEntityClass,
} from "utils/utils";
import {
  StyledButtonWrapper,
  StyledElvlWrapper,
  StyledEntityTag,
  StyledEntityTagWrap,
  StyledExpansionBadge,
  StyledFaStar,
  StyledLabel,
  StyledLabelWrap,
  StyledStarWrap,
  StyledTagComponentWrap,
} from "./EntityTagStyles";
import useDragDrop from "./useDragDrop";

// marker shown on the class glyph when a search surfaced this entity via an
// expansion option rather than a direct match (#2969)
const EXPANSION_MARK = {
  equivalent: {
    label: "eq",
    tooltip: "Surfaced via 'include equivalents' (SYN / IDE / AEE)",
  },
  subordinate: {
    label: "sub",
    tooltip: "Surfaced via 'include subordinates' (subclass / subordinate / meronym / child T)",
  },
} as const;

export interface UnlinkButton {
  onClick: () => void;
  color?: keyof ThemeColor;
  tooltipLabel?: string;
  icon?: React.ReactNode;
}
interface EntityTag {
  entity: IEntity;
  parentId?: string;
  showOnly?: "tag" | "label";
  fullWidth?: boolean;
  /** Override the label's max-width (e.g. theme.space value). */
  tagMaxWidth?: number;
  button?: ReactNode;
  /**
   * Render `button` before the elvl group (left of it), away from the unlink
   * button to avoid misclicks. Used for the annotator resize-anchor button.
   */
  buttonBeforeElvl?: boolean;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  isSelected?: boolean;
  disableTooltip?: boolean;
  disableDoubleClick?: boolean;
  disableDrag?: boolean;
  /** the entity sits in a container the user may only read - see EntityDragItem */
  entityIsReadOnly?: boolean;
  disableCopyToClipboard?: boolean;
  tooltipPosition?: Placement;
  updateOrderFn?: (item: EntityDragItem) => void;
  lvl?: number;
  statementsCount?: number;
  isFavorited?: boolean;
  elvlButtonGroup?: ReactNode | false;

  unlinkButton?: UnlinkButton | false;
  customTooltipAttributes?: { partLabel?: string; childCount?: number };
  /** When set, replaces the default double-click behavior (open in detail). */
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Marks the tag as surfaced via "include equivalents" (SYN/IDE/AEE). */
  isEquivalent?: boolean;
  /** Marks the tag as surfaced via "include subordinates" (inverse SCL/SOE/HOL + child T). */
  isSubordinate?: boolean;
}

// the tag renders nothing without an entity; the check lives in the outer
// component so this one can call its hooks unconditionally
const EntityTagInner: React.FC<EntityTag> = ({
  entity,
  parentId,
  showOnly,
  fullWidth = false,
  tagMaxWidth,
  button = false,
  buttonBeforeElvl = false,
  index,
  moveFn,
  isSelected,
  disableTooltip = false,
  disableDrag = false,
  entityIsReadOnly,
  disableDoubleClick = false,
  disableCopyToClipboard = false,
  tooltipPosition,
  updateOrderFn,
  lvl,
  statementsCount,
  isFavorited,

  elvlButtonGroup = false,

  unlinkButton,
  customTooltipAttributes,
  onDoubleClick: onDoubleClickOverride,
  isEquivalent = false,
  isSubordinate = false,
}) => {
  const { promoteDetailId } = useSearchParams();
  const dispatch = useAppDispatch();
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState,
  );
  const [buttonHovered, setButtonHovered] = useState(false);
  const [elvlHovered, setElvlHovered] = useState(false);
  const [tagHovered, setTagHovered] = useState(false);
  const [clickedOnce, setClickedOnce] = useState(false);
  const [expansionBadgeHovered, setExpansionBadgeHovered] = useState(false);
  const referenceEl = useRef<HTMLDivElement>(null!);
  const expansionBadgeRef = useRef<HTMLDivElement>(null);
  const entityLabel = useMemo(() => getEntityLabel(entity), [entity]);

  useEffect(() => {
    if (!clickedOnce) return;

    const timeout = setTimeout(() => {
      if (!disableCopyToClipboard) {
        navigator.clipboard.writeText(entityLabel);
        toast.info(`label [${getShortLabelByLetterCount(entityLabel, 200)}] copied to clipboard`);
      }
      setClickedOnce(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [clickedOnce, entityLabel]);

  const handleTagHovered = useCallback(() => {
    setTagHovered(true);
  }, []);

  const handleTagUnhovered = useCallback(() => {
    setTagHovered(false);
  }, []);
  const handleButtonHovered = useCallback(() => {
    setButtonHovered(true);
  }, []);

  const handleButtonUnhovered = useCallback(() => {
    setButtonHovered(false);
  }, []);

  const handleBtnClick = useCallback(() => {
    setButtonHovered(false);
    setTagHovered(false);
  }, []);

  const renderUnlinkButton = (unlinkButton: UnlinkButton) => {
    return (
      <Button
        key="d"
        tooltipLabel={unlinkButton.tooltipLabel ? unlinkButton.tooltipLabel : "unlink entity"}
        icon={unlinkButton.icon ? unlinkButton.icon : <FaUnlink />}
        color={unlinkButton.color ? unlinkButton.color : "plain"}
        inverted
        onClick={unlinkButton.onClick}
        shape="sharp"
      />
    );
  };

  const tagComponent = useMemo(() => {
    const mark = isEquivalent
      ? EXPANSION_MARK.equivalent
      : isSubordinate
        ? EXPANSION_MARK.subordinate
        : undefined;
    return (
      <StyledTagComponentWrap>
        <StyledEntityTag
          $color={EntityColors[entity.class].color}
          $isTemplate={entity.isTemplate ?? false}
        >
          {entity.class}
        </StyledEntityTag>
        {mark && (
          <StyledExpansionBadge
            ref={expansionBadgeRef}
            $variant={isEquivalent ? "equivalent" : "subordinate"}
            onMouseEnter={() => {
              setExpansionBadgeHovered(true);
              setTagHovered(false);
            }}
            onMouseLeave={() => {
              setExpansionBadgeHovered(false);
              setTagHovered(true);
            }}
          >
            {mark.label}
          </StyledExpansionBadge>
        )}
        {mark && (
          <Tooltip
            label={mark.tooltip}
            visible={expansionBadgeHovered}
            referenceElement={expansionBadgeRef.current}
            position="top"
          />
        )}
      </StyledTagComponentWrap>
    );
  }, [entity, isEquivalent, isSubordinate, expansionBadgeHovered]);

  const labelComponent = useMemo(() => {
    return (
      <StyledLabelWrap
        $invertedLabel={isSelected ?? false}
        $isFavorited={isFavorited ?? false}
        $tagBorderColorKey={entity.status}
        $labelOnly={showOnly === "label"}
      >
        {isFavorited && (
          <StyledStarWrap>
            <StyledFaStar />
          </StyledStarWrap>
        )}
        <StyledLabel
          $invertedLabel={isSelected ?? false}
          $fullWidth={fullWidth}
          $maxWidth={tagMaxWidth}
          $isFavorited={isFavorited ?? false}
          $isItalic={isFirstLabelEmpty(entity.labels)}
        >
          {entityLabel}
        </StyledLabel>
      </StyledLabelWrap>
    );
  }, [entity, entityLabel, isSelected, isFavorited, showOnly, fullWidth, tagMaxWidth]);

  const draggedEntity: DraggedEntityReduxItem = useAppSelector((state) => state.draggedEntity);

  const [isDragging, canDrag, drag, drop] = useDragDrop({
    entity,
    isTemplate: entity.isTemplate ?? false,
    isDiscouraged: entity.status === EntityEnums.Status.Discouraged,
    entityIsReadOnly,
    propId: entity.id,
    entityClass: entity.class,
    disableDrag,
    index: index ?? -1,
    lvl,
    updateOrderFn: updateOrderFn ?? (() => {}),
    draggedEntity,
    dispatch,
    moveFn,
    ref: referenceEl,
  });

  if (!isValidEntityClass(entity.class)) {
    // labels needs to have length and first label needs to be non-empty
    return (
      <StyledEntityTagWrap>
        <Tag
          tagComponent={
            <StyledEntityTag
              $color={EntityColors[EntityEnums.Extension.Invalid].color}
              $isTemplate={false}
            >
              {EntityEnums.Extension.Invalid}
            </StyledEntityTag>
          }
          labelComponent={labelComponent}
          dragDisabled
          // button={unlinkButton && renderUnlinkButton(unlinkButton)}
        />
      </StyledEntityTagWrap>
    );
  }

  // The tag's trailing side: optional resize/leading button (left of the elvl
  // group when buttonBeforeElvl), the elvl button group, then the action
  // buttons (custom button + unlink). Each sits in its own divider wrapper.
  // Passed to the generic Tag as `rightContent`.
  const buttonWrapperProps = {
    $tagBorderColorKey: entity.status,
    onMouseEnter: handleButtonHovered,
    onMouseLeave: handleButtonUnhovered,
    onClick: handleBtnClick,
  };
  // button sits left of the elvl group when buttonBeforeElvl; otherwise it
  // trails next to unlink.
  const trailingButtons = buttonBeforeElvl ? (
    unlinkButton && renderUnlinkButton(unlinkButton)
  ) : (
    <>
      {button && button}
      {unlinkButton && renderUnlinkButton(unlinkButton)}
    </>
  );
  const rightContent = (
    <>
      {button && buttonBeforeElvl && (
        <StyledButtonWrapper {...buttonWrapperProps}>{button}</StyledButtonWrapper>
      )}
      {elvlButtonGroup && (
        <StyledElvlWrapper $tagBorderColorKey={entity.status}>
          <div onMouseOver={() => setElvlHovered(true)} onMouseOut={() => setElvlHovered(false)}>
            {elvlButtonGroup}
          </div>
        </StyledElvlWrapper>
      )}
      {trailingButtons && (
        <StyledButtonWrapper {...buttonWrapperProps}>{trailingButtons}</StyledButtonWrapper>
      )}
    </>
  );

  return (
    <StyledEntityTagWrap>
      {tagHovered && !disableTooltip && (
        <EntityTooltip
          entityId={entity.id}
          entityClass={entity.class}
          label={
            (entity.labels && entity.labels[0]) ||
            // an unlabelled statement is identified by its anchor text / text
            // rows instead, so it gets no label row at all
            (entity.class === EntityEnums.Class.Statement ? undefined : <i>{"no label"}</i>)
          }
          alternativeLabels={
            entity.labels && entity.labels.length > 1 ? entity.labels.slice(1) : undefined
          }
          language={entity.language}
          detail={entity.detail}
          text={entity.class === EntityEnums.Class.Statement ? entity.data.text : undefined}
          anchorTexts={entity.anchorTexts}
          isTemplate={entity.isTemplate}
          partOfSpeech={entity.data.pos}
          itemsCount={statementsCount}
          position={tooltipPosition}
          disabled={(button !== null && (buttonHovered || elvlHovered)) || Boolean(isDragging)}
          tagHovered={tagHovered}
          referenceElement={referenceEl.current}
          customTooltipAttributes={customTooltipAttributes}
        />
      )}
      <Tag
        ref={referenceEl}
        dragDisabled={!canDrag}
        tagBorderColorKey={entity.status}
        borderStyleKey={entity?.data?.logicalType as EntityEnums.LogicalType}
        showOnly={showOnly}
        tagComponent={tagComponent}
        labelComponent={labelComponent}
        rightContent={rightContent}
        onClick={() => setClickedOnce(true)}
        onDoubleClick={(e) => {
          setClickedOnce(false);
          if (onDoubleClickOverride) {
            onDoubleClickOverride(e);
            return;
          }
          if (!disableDoubleClick) {
            // opening at the front of the tab strip keeps the entity on screen
            // whatever else is already open
            promoteDetailId(entity.id);
            dispatch(setSecondPanelExpanded(true));
            if (detailBoxState === DetailBoxState.Minimized) {
              dispatch(setDetailBoxState(DetailBoxState.Normal));
            }
          }
        }}
        onMouseEnter={handleTagHovered}
        onMouseLeave={handleTagUnhovered}
      />
    </StyledEntityTagWrap>
  );
};

const EntityTagComponent: React.FC<EntityTag> = (props) => {
  if (!props.entity) {
    return <></>;
  }
  return <EntityTagInner {...props} />;
};

function areEntityTagsEqual(
  prev: Readonly<React.ComponentProps<typeof EntityTagComponent>>,
  next: Readonly<React.ComponentProps<typeof EntityTagComponent>>,
) {
  // Compare minimal fields that affect rendering
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isFavorited !== next.isFavorited) return false;
  if (prev.isEquivalent !== next.isEquivalent) return false;
  if (prev.isSubordinate !== next.isSubordinate) return false;
  if (prev.showOnly !== next.showOnly) return false;
  if (prev.fullWidth !== next.fullWidth) return false;
  if (prev.disableTooltip !== next.disableTooltip) return false;
  if (prev.disableDoubleClick !== next.disableDoubleClick) return false;
  if (prev.onDoubleClick !== next.onDoubleClick) return false;
  if (prev.statementsCount !== next.statementsCount) return false;
  if (Boolean(prev.button) !== Boolean(next.button)) return false;
  if (prev.buttonBeforeElvl !== next.buttonBeforeElvl) return false;
  if (Boolean(prev.unlinkButton) !== Boolean(next.unlinkButton)) return false;
  // Compare unlinkButton onClick function reference to ensure handlers are up-to-date
  if (
    prev.unlinkButton &&
    next.unlinkButton &&
    prev.unlinkButton.onClick !== next.unlinkButton.onClick
  )
    return false;
  // Compare function references to ensure they're up-to-date
  if (prev.moveFn !== next.moveFn) return false;
  if (prev.updateOrderFn !== next.updateOrderFn) return false;
  // Entity-based checks (fields that affect Tag/tooltip rendering)
  if (prev.entity?.id !== next.entity.id) return false;
  if (prev.entity?.class !== next.entity.class) return false;
  if (prev.entity?.status !== next.entity.status) return false;
  if (prev.entity?.data?.logicalType !== next.entity?.data?.logicalType) return false;
  if (prev.entity.isTemplate !== next.entity.isTemplate) return false;
  const prevLabel = getEntityLabel(prev.entity);
  const nextLabel = getEntityLabel(next.entity);
  if (prevLabel !== nextLabel) return false;
  return true;
}

export const EntityTag = React.memo(EntityTagComponent, areEntityTagsEqual);
