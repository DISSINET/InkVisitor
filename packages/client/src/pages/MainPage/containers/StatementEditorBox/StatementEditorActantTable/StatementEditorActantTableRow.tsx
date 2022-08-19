import { actantPositionDict } from "@shared/dictionaries";
import { EntityClass, Position } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseStatement,
  IStatementActant,
} from "@shared/types";
import {
  IStatementClassification,
  IStatementIdentification,
} from "@shared/types/statement";
import { AttributeIcon, Button, ButtonGroup } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ColumnInstance } from "react-table";
import { setDraggedActantRow } from "redux/features/rowDnd/draggedActantRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  DraggedActantRowItem,
  DraggedPropRowCategory,
  DragItem,
  FilteredActantObject,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { PropGroup } from "../../PropGroup/PropGroup";
import {
  StyledGrid,
  StyledGridColumn,
  StyledTagWrapper,
} from "./StatementEditorActantTableStyles";

interface StatementEditorActantTableRow {
  filteredActant: FilteredActantObject;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  visibleColumns: ColumnInstance<{}>[];
  statement: IResponseStatement;
  classEntitiesActant: EntityClass[];
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  territoryParentId?: string;
}

export const StatementEditorActantTableRow: React.FC<
  StatementEditorActantTableRow
> = ({
  // row,
  filteredActant,
  index,
  moveRow,
  statement,
  userCanEdit = false,
  updateOrderFn,
  visibleColumns,
  classEntitiesActant,
  updateStatementDataMutation,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
}) => {
  const isInsideTemplate = statement.isTemplate || false;
  const { statementId, territoryId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ACTANT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.ACTANT_ROW,
      index,
      id: filteredActant.id.toString(),
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item) updateOrderFn();
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  const updateActant = (statementActantId: string, changes: any) => {
    if (statement && statementActantId) {
      const updatedActants = statement.data.actants.map((a) =>
        a.id === statementActantId ? { ...a, ...changes } : a
      );
      const newData = { actants: updatedActants };
      updateStatementDataMutation.mutate(newData);
    }
  };

  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { actants: updatedActants };
      updateStatementDataMutation.mutate(newData);
    }
  };

  const renderActantCell = () => {
    const {
      actant,
      sActant,
    }: {
      actant?: IEntity;
      sActant: IStatementActant;
    } = filteredActant.data;
    return actant ? (
      <StyledTagWrapper>
        <EntityTag
          entity={actant}
          fullWidth
          button={
            userCanEdit && (
              <Button
                key="d"
                tooltip="unlink actant"
                icon={<FaUnlink />}
                color="plain"
                inverted={true}
                onClick={() => {
                  updateActant(sActant.id, {
                    entityId: "",
                  });
                }}
              />
            )
          }
        />
      </StyledTagWrapper>
    ) : (
      userCanEdit && (
        <EntitySuggester
          onSelected={(newSelectedId: string) => {
            updateActant(sActant.id, {
              entityId: newSelectedId,
            });
          }}
          categoryTypes={classEntitiesActant}
          openDetailOnCreate
          excludedEntities={excludedSuggesterEntities}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
        />
      )
    );
  };

  const renderPositionCell = () => {
    const { sActant } = filteredActant.data;
    return (
      <AttributeButtonGroup
        disabled={!userCanEdit}
        options={[
          {
            longValue: actantPositionDict[Position.Subject].label,
            shortValue: actantPositionDict[Position.Subject].value,
            onClick: () =>
              updateActant(sActant.id, {
                position: actantPositionDict[Position.Subject].value,
              }),
            selected:
              sActant.position == actantPositionDict[Position.Subject].value,
          },
          {
            longValue: actantPositionDict[Position.Actant1].label,
            shortValue: actantPositionDict[Position.Actant1].value,
            onClick: () =>
              updateActant(sActant.id, {
                position: actantPositionDict[Position.Actant1].value,
              }),
            selected:
              sActant.position == actantPositionDict[Position.Actant1].value,
          },
          {
            longValue: actantPositionDict[Position.Actant2].label,
            shortValue: actantPositionDict[Position.Actant2].value,
            onClick: () =>
              updateActant(sActant.id, {
                position: actantPositionDict[Position.Actant2].value,
              }),
            selected:
              sActant.position == actantPositionDict[Position.Actant2].value,
          },
          {
            longValue: actantPositionDict[Position.PseudoActant].label,
            shortValue: actantPositionDict[Position.PseudoActant].value,
            onClick: () =>
              updateActant(sActant.id, {
                position: actantPositionDict[Position.PseudoActant].value,
              }),
            selected:
              sActant.position ==
              actantPositionDict[Position.PseudoActant].value,
          },
        ]}
      />
    );
  };

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderAttributesCell = () => {
    const {
      actant,
      sActant,
    }: {
      actant?: IEntity;
      sActant: IStatementActant;
    } = filteredActant.data;

    const propOriginId = filteredActant.data.sActant.entityId;
    return (
      <ButtonGroup noMarginRight height={19}>
        {sActant && (
          <AttributesEditor
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            modalTitle={`Actant involvement`}
            entity={actant}
            disabledAllAttributes={!userCanEdit}
            userCanEdit={userCanEdit}
            data={{
              elvl: sActant.elvl,
              logic: sActant.logic,
              virtuality: sActant.virtuality,
              partitivity: sActant.partitivity,
              bundleOperator: sActant.bundleOperator,
              bundleStart: sActant.bundleStart,
              bundleEnd: sActant.bundleEnd,
            }}
            handleUpdate={(newData) => {
              updateActant(sActant.id, newData);
            }}
            updateActantId={(newId: string) => {
              updateActant(sActant.id, { entityId: newId });
            }}
            classEntitiesActant={classEntitiesActant}
            loading={updateStatementDataMutation.isLoading}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        )}
        {userCanEdit && (
          <Button
            key="d"
            icon={<FaTrashAlt />}
            color="plain"
            inverted={true}
            tooltip="remove actant row"
            onClick={() => {
              removeActant(filteredActant.data.sActant.id);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="a"
            icon={<FaPlus />}
            color="plain"
            inverted={true}
            tooltip="add new prop"
            onClick={() => {
              addProp(propOriginId);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="c"
            icon={<FaPlus />}
            label="c"
            color="plain"
            inverted={true}
            tooltip="add classification"
            onClick={() => {
              console.log("adding Classification");
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="i"
            icon={<FaPlus />}
            label="i"
            color="plain"
            inverted={true}
            tooltip="add identification"
            onClick={() => {
              console.log("adding Identification");
            }}
          />
        )}
        {sActant.logic == "2" && (
          <Button
            key="neg"
            tooltip="Negative logic"
            color="success"
            inverted={true}
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
            onClick={() => setModalOpen(true)}
          />
        )}
        {sActant.bundleOperator && (
          <Button
            key="oper"
            tooltip="Logical operator type"
            color="success"
            inverted={true}
            noBorder
            icon={sActant.bundleOperator}
            onClick={() => setModalOpen(true)}
          />
        )}
      </ButtonGroup>
    );
  };

  const dispatch = useAppDispatch();
  const draggedActantRow: DraggedActantRowItem = useAppSelector(
    (state) => state.rowDnd.draggedActantRow
  );

  useEffect(() => {
    if (isDragging) {
      dispatch(
        setDraggedActantRow({ category: DraggedPropRowCategory.ACTANT })
      );
    } else {
      dispatch(setDraggedActantRow({}));
    }
  }, [isDragging]);

  const renderPropGroup = useCallback(
    (originId: string, props: IProp[], category: DraggedPropRowCategory) => {
      const originActant = statement.entities[originId];

      if (props.length > 0) {
        return (
          <PropGroup
            boxEntity={statement}
            originId={originActant ? originActant.id : ""}
            entities={statement.entities}
            props={props}
            territoryId={territoryId}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            movePropToIndex={movePropToIndex}
            userCanEdit={userCanEdit}
            openDetailOnCreate={false}
            category={category}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        );
      }
    },
    [statement]
  );

  const renderClassifications = (
    classifications: IStatementClassification[]
  ) => {
    return (
      <p>
        {classifications.map((classification, key) => {
          return <div key={key}>{"classification"}</div>;
        })}
      </p>
    );
  };
  const renderIdentifications = (
    identifications: IStatementIdentification[]
  ) => {
    return (
      <p>
        {identifications.map((identification, key) => {
          return <div key={key}>{"identification"}</div>;
        })}
      </p>
    );
  };

  return (
    <React.Fragment key={index}>
      <StyledGrid ref={dropRef} style={{ opacity }}>
        {userCanEdit && (
          <StyledGridColumn ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </StyledGridColumn>
        )}
        <StyledGridColumn>{renderActantCell()}</StyledGridColumn>
        <StyledGridColumn>{renderPositionCell()}</StyledGridColumn>
        <StyledGridColumn>{renderAttributesCell()}</StyledGridColumn>
      </StyledGrid>

      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTANT
      ) &&
        renderPropGroup(
          filteredActant.data.sActant.entityId,
          filteredActant.data.sActant.props,
          DraggedPropRowCategory.ACTANT
        )}
      {renderClassifications(filteredActant.data.sActant.classifications)}
      {renderIdentifications(filteredActant.data.sActant.identifications)}
    </React.Fragment>
  );
};
