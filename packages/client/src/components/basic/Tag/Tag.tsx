import { EntityEnums } from "@inkvisitor/shared/enums";
import React, { ReactNode } from "react";
import { StyledTagWrapper } from "./TagStyles";

interface TagProps {
  ref?: React.RefObject<HTMLDivElement>;
  // for cursor style
  dragDisabled?: boolean;
  // key in theme.color.tagBorderColor to set color of border (e.g. EntityTag status)
  tagBorderColorKey?: EntityEnums.Status;
  // key in theme.borderStyle to set style of left border (e.g. EntityTag logical type)
  borderStyleKey?: EntityEnums.LogicalType;
  // components to render inside tag
  tagComponent?: ReactNode;
  labelComponent?: ReactNode;
  /**
   * Generic slot rendered on the trailing (right) side of the tag. Consumers own
   * its content and layout (e.g. EntityTag composes the elvl group and action
   * buttons here).
   */
  rightContent?: ReactNode;

  showOnly?: "tag" | "label";

  onClick?: () => void;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  ref,
  // TODO: consider sending border color as a prop as key of theme.color instead of tagBorderColorKey
  // status = EntityEnums.Status.Approved,
  tagBorderColorKey = EntityEnums.Status.Approved,
  // ltype = EntityEnums.LogicalType.Definite,
  borderStyleKey = EntityEnums.LogicalType.Definite,
  dragDisabled = false,
  tagComponent,
  labelComponent,
  rightContent,
  showOnly,

  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <StyledTagWrapper
      ref={ref}
      className="tag"
      $tagBorderColorKey={tagBorderColorKey}
      $borderStyleKey={borderStyleKey}
      $dragDisabled={dragDisabled}
      onClick={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick?.(e);
      }}
      onMouseEnter={onMouseEnter && onMouseEnter}
      onMouseLeave={onMouseLeave && onMouseLeave}
    >
      {showOnly ? (showOnly === "tag" ? tagComponent : labelComponent) : (
        <>
          {tagComponent}
          {labelComponent}
        </>
      )}
      {rightContent}
    </StyledTagWrapper>
  );
};
