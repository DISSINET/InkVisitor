import { EntityEnums } from "@shared/enums";
import { IResponseEntity } from "@shared/types";
import { Tooltip, TypeBar } from "components";
import React, { MouseEventHandler, useState } from "react";
import { getEntityLabel } from "utils";
import {
  StyledCgClose,
  StyledIconWrap,
  StyledLabel,
  StyledTab,
} from "./EntityDetailTabStyles";
import { FiMove } from "react-icons/fi";
import { EntityTag } from "components/advanced";
import {
  FloatingPortal,
  autoUpdate,
  offset,
  useFloating,
} from "@floating-ui/react";

interface EntityDetailTab {
  entity: IResponseEntity;
  onClick?: MouseEventHandler<HTMLElement>;
  onClose?: () => void;
  isSelected?: boolean;
}
export const EntityDetailTab: React.FC<EntityDetailTab> = ({
  entity,
  onClick,
  onClose,
  isSelected = false,
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTag, setShowTag] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "left",
    whileElementsMounted: autoUpdate,
    middleware: [offset({ mainAxis: -14 })],
  });

  return (
    <>
      <StyledTab
        isSelected={isSelected}
        ref={setReferenceElement}
        onMouseEnter={() => {
          setShowTooltip(true);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          setIsHovered(false);
          setShowTag(false);
        }}
      >
        <StyledLabel
          isSelected={isSelected}
          isItalic={
            entity?.class === EntityEnums.Class.Statement && !entity?.label
          }
          onClick={onClick}
        >
          {entity?.class && (
            <TypeBar
              entityLetter={entity?.class}
              isTemplate={entity.isTemplate}
              noMargin
              dimColor={!isSelected}
            />
          )}
          {!entity ? "..." : getEntityLabel(entity)}
        </StyledLabel>

        {isHovered && (
          <StyledIconWrap
            onMouseDown={() => {
              setShowTag(true);
              setShowTooltip(false);
            }}
            ref={refs.setReference}
          >
            <FiMove size={13} style={{ cursor: "move" }} />
          </StyledIconWrap>
        )}

        {showTag && (
          <FloatingPortal id="page">
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
              }}
            >
              <EntityTag entity={entity} />
            </div>
          </FloatingPortal>
        )}

        <StyledIconWrap onClick={onClose}>
          <StyledCgClose size={13} strokeWidth={0.5} />
        </StyledIconWrap>
      </StyledTab>

      <Tooltip
        visible={showTooltip}
        referenceElement={referenceElement}
        label={getEntityLabel(entity)}
      />
    </>
  );
};
