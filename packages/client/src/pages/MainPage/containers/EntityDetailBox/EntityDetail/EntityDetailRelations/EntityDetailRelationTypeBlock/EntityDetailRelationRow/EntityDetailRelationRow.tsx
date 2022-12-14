import { certaintyDict } from "@shared/dictionaries";
import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseGeneric, Relation } from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, Dropdown } from "components";
import { EntityTag } from "components/advanced";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import {
  StyledGrid,
  StyledGridColumn,
} from "../EntityDetailRelationTypeBlockStyles";

interface EntityDetailRelationRow {
  relation: Relation.IRelation;
  entityId: string;
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entities: Record<string, IEntity>;
  relationUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: any;
    },
    unknown
  >;
  relationDeleteMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    string,
    unknown
  >;

  hasOrder: boolean;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  index: number;
  updateOrderFn: (relationId: string, newOrder: number) => void;
}
export const EntityDetailRelationRow: React.FC<EntityDetailRelationRow> = ({
  relation,
  relationRule,
  entityId,
  relationType,
  entities,
  relationUpdateMutation,
  relationDeleteMutation,

  hasOrder,
  moveRow,
  index,
  updateOrderFn,
}) => {
  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const handleMultiRemove = (relationId: string) => {
    relationDeleteMutation.mutate(relationId);
  };

  const shouldBeRendered = (key: number) =>
    !relationRule.asymmetrical || (relationRule.asymmetrical && key > 0);

  const renderCertainty = (relation: Relation.IRelation) => (
    <div>
      <Dropdown
        width={140}
        placeholder="certainty"
        options={certaintyDict}
        value={{
          value: (relation as Relation.IIdentification).certainty,
          label: certaintyDict.find(
            (c) => c.value === (relation as Relation.IIdentification).certainty
          )?.label,
        }}
        onChange={(newValue: any) => {
          relationUpdateMutation.mutate({
            relationId: relation.id,
            changes: { certainty: newValue.value as string },
          });
        }}
      />
    </div>
  );

  const [, drop] = useDrop({
    accept: ItemTypes.MULTI_RELATION,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.MULTI_RELATION,
      index,
      id: relation.id,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item && item.index !== index) {
        updateOrderFn(item.id, item.index);
      }
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <StyledGrid
      ref={dropRef}
      style={{ opacity }}
      hasAttribute={relationRule.attributes.length > 0}
      hasOrder={hasOrder}
    >
      {relation.entityIds.map((relationEntityId, key) => {
        const relationEntity = entities[relationEntityId];
        return (
          <React.Fragment key={key}>
            {relationEntity &&
              relationEntity.id !== entityId &&
              shouldBeRendered(key) && (
                <>
                  {hasOrder && (
                    <StyledGridColumn
                      ref={dragRef}
                      style={{
                        cursor: "move",
                      }}
                    >
                      <FaGripVertical />
                    </StyledGridColumn>
                  )}
                  <StyledGridColumn key={key}>
                    <EntityTag
                      fullWidth
                      entity={relationEntity}
                      button={
                        <Button
                          key="d"
                          icon={<FaUnlink />}
                          color="plain"
                          inverted
                          tooltipLabel="unlink"
                          onClick={() => handleMultiRemove(relation.id)}
                        />
                      }
                    />
                  </StyledGridColumn>
                </>
              )}
          </React.Fragment>
        );
      })}

      {/* Certainty (Identification) */}
      {relationType === RelationEnums.Type.Identification &&
        renderCertainty(relation)}
    </StyledGrid>
  );
};
