import { certaintyDict } from "@shared/dictionaries";
import { RelationEnums } from "@shared/enums";
import { IEntity, IResponseGeneric, Relation } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import React, { useContext, useRef } from "react";
import Dropdown, { EntityTag } from "components/advanced";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { DragItem, Identifier, ItemTypes } from "types";
import { dndHoverFn } from "utils/utils";
import {
  StyledGrid,
  StyledGridColumn,
} from "../EntityDetailRelationTypeBlockStyles";
import { ThemeContext } from "styled-components";

interface EntityDetailRelationRow {
  relation: Relation.IRelation | Relation.IIdentification;
  entityId: string;
  relationRule: Relation.RelationRule;
  relationType: RelationEnums.Type;
  entities: Record<string, IEntity>;
  relationUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      relationId: string;
      changes: Partial<Relation.IRelation | Relation.IIdentification>;
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

  userCanEdit: boolean;
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
  userCanEdit,
}) => {
  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const handleMultiRemove = (relationId: string) => {
    relationDeleteMutation.mutate(relationId);
  };

  const shouldBeRendered = (key: number) =>
    !relationRule.asymmetrical || (relationRule.asymmetrical && key > 0);

  const renderCertainty = (relation: Relation.IIdentification) => (
    <div>
      <Dropdown.Single.Basic
        disabled={!userCanEdit}
        width={105}
        placeholder="certainty"
        options={certaintyDict}
        value={relation.certainty}
        onChange={(newValue) => {
          relationUpdateMutation.mutate({
            relationId: relation.id,
            changes: { certainty: newValue },
          });
        }}
      />
    </div>
  );

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.MULTI_RELATION,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.MULTI_RELATION,
    item: {
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

  const uniqueRelationIds = [...new Set(relation.entityIds)];

  const themeContext = useContext(ThemeContext);

  return (
    <>
      <StyledGrid
        data-handler-id={handlerId}
        ref={dropRef}
        style={{ opacity: opacity }}
        $hasAttribute={relationRule.attributes.length > 0}
        $hasOrder={hasOrder}
      >
        {uniqueRelationIds.map((relationEntityId, key) => {
          const relationEntity = entities[relationEntityId];
          return (
            (relationEntityId !== entityId ||
              (relationRule.selfLoop && uniqueRelationIds.length === 1)) && (
              <React.Fragment key={key}>
                {relationEntity && shouldBeRendered(key) && (
                  <>
                    {hasOrder && (
                      <StyledGridColumn
                        ref={dragRef}
                        style={{
                          cursor: "move",
                        }}
                      >
                        <FaGripVertical color={themeContext?.color.black} />
                      </StyledGridColumn>
                    )}
                    <StyledGridColumn key={key}>
                      <EntityTag
                        fullWidth
                        entity={relationEntity}
                        unlinkButton={
                          userCanEdit && {
                            onClick: () => handleMultiRemove(relation.id),
                          }
                        }
                      />
                    </StyledGridColumn>
                  </>
                )}
              </React.Fragment>
            )
          );
        })}

        {/* Certainty (Identification) */}
        {relationType === RelationEnums.Type.Identification &&
          renderCertainty(relation as Relation.IIdentification)}
      </StyledGrid>
    </>
  );
};
