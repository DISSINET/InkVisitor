import { EntityClass } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useRef } from "react";
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
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import { EntitySuggester, EntityTag } from "../..";
import { AttributeButtonGroup } from "../../AttributeButtonGroup/AttributeButtonGroup";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { PropGroup } from "../../PropGroup/PropGroup";
import {
  StyledTagWrapper,
  StyledTd,
  StyledTr,
} from "./StatementEditorActantTableStyles";

interface StatementEditorActantTableRow {
  row: any;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  // updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  handleClick: Function;
  visibleColumns: ColumnInstance<{}>[];
  statement: IResponseStatement;
  classEntitiesActant: EntityClass[];
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
}

export const StatementEditorActantTableRow: React.FC<
  StatementEditorActantTableRow
> = ({
  row,
  index,
  moveRow,
  statement,
  userCanEdit = false,
  updateOrderFn,
  handleClick = () => {},
  visibleColumns,
  classEntitiesActant,
  updateStatementDataMutation,
  addProp,
  // updateProp,
  removeProp,
  movePropToIndex,
}) => {
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
    item: { type: ItemTypes.ACTANT_ROW, index, id: row.values.id },
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
      actant: IEntity;
      sActant: IStatementActant | any;
    } = row.values.data;
    return actant ? (
      <StyledTagWrapper>
        <EntityTag
          actant={actant}
          // fullWidth
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
                    actant: "",
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
              actant: newSelectedId,
            });
          }}
          categoryTypes={classEntitiesActant}
          excludedEntities={excludedSuggesterEntities}
        />
      )
    );
  };

  const renderPositionCell = () => {
    const { sActant } = row.values.data;
    return (
      <AttributeButtonGroup
        disabled={!userCanEdit}
        options={[
          {
            longValue: "subject",
            shortValue: "s",
            onClick: () =>
              updateActant(sActant.id, {
                position: "s",
              }),
            selected: sActant.position == "s",
          },
          {
            longValue: "actant1",
            shortValue: "a1",
            onClick: () =>
              updateActant(sActant.id, {
                position: "a1",
              }),
            selected: sActant.position == "a1",
          },
          {
            longValue: "actant2",
            shortValue: "a2",
            onClick: () =>
              updateActant(sActant.id, {
                position: "a2",
              }),
            selected: sActant.position == "a2",
          },
          {
            longValue: "pseudo-actant",
            shortValue: "pa",
            onClick: () =>
              updateActant(sActant.id, {
                position: "p",
              }),
            selected: sActant.position == "p",
          },
        ]}
      />
    );
  };

  const renderAttributesCell = () => {
    const {
      actant,
      sActant,
    }: {
      actant: IEntity;
      sActant: IStatementActant | any;
    } = row.values.data;

    const propOriginId = row.values.data.sActant.actant;
    return (
      <ButtonGroup noMarginRight>
        {sActant && (
          <AttributesEditor
            modalTitle={`Actant involvement`}
            actant={actant}
            disabledAllAttributes={!userCanEdit}
            userCanEdit={userCanEdit}
            data={{
              elvl: sActant.elvl,
              certainty: sActant.certainty,
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
              updateActant(sActant.id, { actant: newId });
            }}
            classEntitiesActant={classEntitiesActant}
            loading={updateStatementDataMutation.isLoading}
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
              removeActant(row.values.data.sActant.id);
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
        {sActant.logic == "2" && (
          <Button
            key="neg"
            tooltip="Negative logic"
            color="success"
            inverted={true}
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
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

  const updatePropNew = useCallback(
    (propId: string, changes: any) => {
      console.log(statement.data.actants[0].position);
      if (statement && propId) {
        const newStatementData = { ...statement.data };

        // this is probably an overkill
        [...newStatementData.actants, ...newStatementData.actions].forEach(
          (actant: IStatementActant | IStatementAction) => {
            actant.props.forEach((prop1, pi1) => {
              // 1st level
              if (prop1.id === propId) {
                actant.props[pi1] = { ...actant.props[pi1], ...changes };
              }

              // 2nd level
              actant.props[pi1].children.forEach((prop2, pi2) => {
                if (prop2.id === propId) {
                  actant.props[pi1].children[pi2] = {
                    ...actant.props[pi1].children[pi2],
                    ...changes,
                  };
                }

                // 3rd level
                actant.props[pi1].children[pi2].children.forEach(
                  (prop3, pi3) => {
                    if (prop3.id === propId) {
                      actant.props[pi1].children[pi2].children[pi3] = {
                        ...actant.props[pi1].children[pi2].children[pi3],
                        ...changes,
                      };
                    }
                  }
                );
              });
            });
          }
        );

        updateStatementDataMutation.mutate(newStatementData);
      }
    },
    [JSON.stringify(statement)]
  );

  const renderPropGroup = useCallback(
    (
      originId: string,
      props: IProp[],
      statement: IResponseStatement,
      category: DraggedPropRowCategory
    ) => {
      const originActant = statement.entities[originId];

      if (props.length > 0) {
        return (
          <PropGroup
            originId={originActant ? originActant.id : ""}
            entities={statement.entities}
            props={props}
            territoryId={territoryId}
            updateProp={updatePropNew}
            removeProp={removeProp}
            addProp={addProp}
            movePropToIndex={movePropToIndex}
            userCanEdit={userCanEdit}
            openDetailOnCreate={false}
            category={category}
          />
        );
      }
    },
    [statement]
  );

  return (
    <React.Fragment key={index}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        isOdd={Boolean(index % 2)}
        isSelected={row.values.id === statementId}
        onClick={() => {
          handleClick(row.values.id);
        }}
      >
        {userCanEdit && (
          <td ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </td>
        )}
        <StyledTd>{renderActantCell()}</StyledTd>
        <StyledTd>{renderPositionCell()}</StyledTd>
        <StyledTd>{renderAttributesCell()}</StyledTd>
      </StyledTr>

      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTANT
      ) &&
        renderPropGroup(
          row.values.data.sActant.actant,
          row.values.data.sActant.props,
          statement,
          DraggedPropRowCategory.ACTANT
        )}
    </React.Fragment>
  );
};
