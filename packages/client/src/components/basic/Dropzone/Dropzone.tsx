import { TemplateActionModal } from "components";
import React, { ReactElement, useContext, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { ThemeContext } from "styled-components";
import { EntityDragItem, ItemTypes } from "types";
import {
  StyledAiOutlineWarning,
  StyledDropzone,
  StyledIconWrap,
} from "./DropzoneStyles";

interface Dropzone {
  onDrop: (item: EntityDragItem, instantiateTemplate?: boolean) => void;
  onHover: (item: EntityDragItem) => void;
  isWrongDropCategory?: boolean;
  isInsideTemplate: boolean;
  children: ReactElement;
  disabled?: boolean;
}
export const Dropzone: React.FC<Dropzone> = ({
  onDrop,
  onHover,
  children,
  isWrongDropCategory,
  isInsideTemplate = false,
  disabled,
}) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tempDropItem, setTempDropItem] = useState<EntityDragItem | false>(
    false
  );

  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: EntityDragItem) => {
      if (!isWrongDropCategory) {
        if (!item.isTemplate) {
          onDrop(item);
        } else if (item.isTemplate && !isInsideTemplate) {
          onDrop(item, true);
        } else if (item.isTemplate && isInsideTemplate) {
          setTempDropItem(item);
          setShowTemplateModal(true);
        }
      }
    },
    hover: (item: EntityDragItem) => {
      onHover && onHover(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const opacity = isOver ? 0.5 : 1;

  const themeContext = useContext(ThemeContext);

  return (
    <>
      {!disabled ? (
        <span style={{ display: "grid" }}>
          <StyledDropzone ref={dropRef} style={{ opacity: opacity }}>
            {children}
          </StyledDropzone>
          <StyledIconWrap>
            {isWrongDropCategory && isOver && (
              <StyledAiOutlineWarning
                size={22}
                color={themeContext?.color.warning}
              />
            )}
          </StyledIconWrap>
        </span>
      ) : (
        <>{children}</>
      )}

      {showTemplateModal && (
        <TemplateActionModal
          onClose={() => {
            setTempDropItem(false);
            setShowTemplateModal(false);
          }}
          onUse={() => {
            {
              tempDropItem && onDrop(tempDropItem);
              setTempDropItem(false);
              setShowTemplateModal(false);
            }
          }}
          onInstantiate={() => {
            tempDropItem && onDrop(tempDropItem, true);
            setTempDropItem(false);
            setShowTemplateModal(false);
          }}
        />
      )}
    </>
  );
};
