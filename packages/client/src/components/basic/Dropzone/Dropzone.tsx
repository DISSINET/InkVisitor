import { TemplateActionModal } from "components";
import { useTheme } from "hooks";
import React, { ReactElement, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { EntityDragItem, ItemTypes } from "types";
import {
  StyledAiOutlineWarning,
  StyledDropzone,
  StyledDropzoneWrap,
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

  const theme = useTheme();

  return (
    <>
      {!disabled ? (
        <StyledDropzoneWrap ref={dropRef as any}>
          <StyledDropzone $isOver={isOver}>{children}</StyledDropzone>
          <StyledIconWrap>
            {isWrongDropCategory && isOver && (
              <StyledAiOutlineWarning size={22} color={theme.color.warning} />
            )}
          </StyledIconWrap>
        </StyledDropzoneWrap>
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
