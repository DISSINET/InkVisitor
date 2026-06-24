import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { EntityTag } from "components/advanced";
import update from "immutability-helper";
import React, { useCallback, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { TbArrowsSort } from "react-icons/tb";
import { setDisableTreeScroll } from "redux/features/territoryTree/disableTreeScrollSlice";
import { useAppDispatch } from "redux/hooks";
import { DragItem, IExtendedResponseTree } from "types";
import {
  StyledDragHandle,
  StyledIndex,
  StyledList,
  StyledRow,
  StyledTagWrap,
} from "./ReorderTerritoryChildrenModalStyles";

const REORDER_ITEM_TYPE = "REORDER_TERRITORY_CHILD";

interface DraggableRow {
  child: IExtendedResponseTree;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableRow: React.FC<DraggableRow> = ({ child, index, moveRow }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: REORDER_ITEM_TYPE,
    item: { index, id: child.territory.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: REORDER_ITEM_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <StyledRow ref={ref} $isDragging={isDragging}>
      <StyledDragHandle>
        <FaGripVertical />
      </StyledDragHandle>
      <StyledIndex>{index + 1}.</StyledIndex>
      <StyledTagWrap>
        <EntityTag fullWidth entity={child.territory} disableTooltip disableDrag />
      </StyledTagWrap>
    </StyledRow>
  );
};

interface ReorderTerritoryChildrenModal {
  parentId: string;
  children: IExtendedResponseTree[];
  onClose: () => void;
}

export const ReorderTerritoryChildrenModal: React.FC<ReorderTerritoryChildrenModal> = ({
  parentId,
  children: initialChildren,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [orderedChildren, setOrderedChildren] = useState<IExtendedResponseTree[]>(initialChildren);

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setOrderedChildren((prev) =>
      update(prev, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prev[dragIndex]],
        ],
      }),
    );
  }, []);

  const hasChanges = orderedChildren.some(
    (child, i) => child.territory.id !== initialChildren[i]?.territory.id,
  );

  const reorderMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < orderedChildren.length; i++) {
        await api.treeMoveTerritory(orderedChildren[i].territory.id, parentId, i);
      }
    },
    onSuccess: () => {
      dispatch(setDisableTreeScroll(true));
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      onClose();
    },
  });

  return (
    <Modal
      showModal
      onClose={onClose}
      width="auto"
      maxWidth={500}
      isLoading={reorderMutation.isPending}
    >
      <ModalHeader title="Reorder children" icon={<TbArrowsSort />} />
      <ModalContent column enableScroll>
        <StyledList>
          {orderedChildren.map((child, index) => (
            <DraggableRow key={child.territory.id} child={child} index={index} moveRow={moveRow} />
          ))}
        </StyledList>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="cancel" onClick={onClose} />
          <Button
            label="save order"
            color="success"
            disabled={!hasChanges || reorderMutation.isPending}
            onClick={() => reorderMutation.mutate()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
