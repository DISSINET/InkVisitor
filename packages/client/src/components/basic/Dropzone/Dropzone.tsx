import React, { ReactElement, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { EntityDragItem, ItemTypes } from "types";

interface Dropzone {
  onDrop: (item: EntityDragItem, instantiateTemplate?: boolean) => void;
  onHover: (item: EntityDragItem) => void;
  children: ReactElement;

  isWrongDropCategory?: boolean;
  isInsideTemplate: boolean;
}
export const Dropzone: React.FC<Dropzone> = ({
  onDrop,
  onHover,
  children,
  isWrongDropCategory,
  isInsideTemplate = false,
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

  return (
    <div
      ref={dropRef}
      style={{ opacity: opacity, display: "grid", overflow: "hidden" }}
    >
      {children}
    </div>
  );
};
