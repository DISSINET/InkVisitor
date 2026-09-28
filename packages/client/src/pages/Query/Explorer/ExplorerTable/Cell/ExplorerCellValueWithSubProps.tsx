import { IEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { Tooltip } from "components";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getInlineSubProps } from "../utils";
import { ExplorerCellSubProps, ExplorerCellValueTree } from "./ExplorerCellSubProps";
import {
  StyledSubPropsClip,
  StyledSubPropsMore,
  StyledValueTag,
  StyledValueWithSubProps,
} from "./ExplorerCellSubPropsStyles";
import { useHoverTooltip } from "./useHoverTooltip";

interface ExplorerCellValueWithSubProps {
  value: IEntity;
  /** The value's own cell tag, as the column renders it. */
  valueTag: React.ReactNode;
  subProps: IResponseQuerySubProp[];
  onEntityDoubleClick?: (entity: IEntity) => (e: React.MouseEvent) => void;
}

/**
 * A property value followed by its first subproperty pair on the same line.
 * A "..." opens the full tree when there are more subproperties, or when the
 * pair does not fit the cell and clips.
 */
export const ExplorerCellValueWithSubProps: React.FC<ExplorerCellValueWithSubProps> = ({
  value,
  valueTag,
  subProps,
  onEntityDoubleClick,
}) => {
  const { inline, hasHidden } = useMemo(() => getInlineSubProps(subProps), [subProps]);
  const clipRef = useRef<HTMLSpanElement>(null);
  const [isClipped, setIsClipped] = useState(false);
  const tooltip = useHoverTooltip();
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);

  // the clip box resizes with the column, the group inside it with its content;
  // the "..." only narrows an already clipped box, so showing it never unclips
  useLayoutEffect(() => {
    const clip = clipRef.current;
    if (!clip) {
      return;
    }
    const measure = () => setIsClipped(clip.scrollWidth > clip.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(clip);
    if (clip.firstElementChild) {
      observer.observe(clip.firstElementChild);
    }
    return () => observer.disconnect();
  }, [inline]);

  return (
    <StyledValueWithSubProps>
      <StyledValueTag>{valueTag}</StyledValueTag>
      <StyledSubPropsClip ref={clipRef}>
        <ExplorerCellSubProps subProps={inline} onEntityDoubleClick={onEntityDoubleClick} />
      </StyledSubPropsClip>
      {(hasHidden || isClipped) && (
        <>
          {/* the tooltip renders through a portal, so its clicks still bubble
              up the React tree to the row handler - hence the marker */}
          <Tooltip
            visible={tooltip.visible}
            referenceElement={referenceElement}
            position="bottom"
            color="success"
            noArrow
            tagGroup
            onMouseLeave={tooltip.onTooltipMouseLeave}
            content={
              <ExplorerCellValueTree
                value={value}
                subProps={subProps}
                onEntityDoubleClick={onEntityDoubleClick}
              />
            }
          />
          <StyledSubPropsMore
            ref={setReferenceElement}
            data-no-row-click="true"
            onMouseEnter={tooltip.onTriggerMouseEnter}
            onMouseLeave={tooltip.onTriggerMouseLeave}
          >
            ...
          </StyledSubPropsMore>
        </>
      )}
    </StyledValueWithSubProps>
  );
};
