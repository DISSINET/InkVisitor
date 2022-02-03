import { ActantType } from "@shared/enums";
import { IActant, IResponseStatement, IStatementActant } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { useSearchParams } from "hooks";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ColumnInstance } from "react-table";
import { excludedSuggesterEntities } from "Theme/constants";
import { DragItem, ItemTypes } from "types";
import { EntitySuggester, EntityTag } from "../..";
import { AttributeButtonGroup } from "../../AttributeButtonGroup/AttributeButtonGroup";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import {
  StyledTagWrapper,
  StyledTd,
  StyledTr,
} from "./StatementEditorActantTableStyles";

interface StatementEditorActantTableRow {
  row: any;
  index: number;
  moveRow: any;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  handleClick: Function;
  renderPropGroup: Function;
  visibleColumns: ColumnInstance<{}>[];
  statement: IResponseStatement;
  classEntitiesActant: ActantType[];
  updateActantsMutation: UseMutationResult<any, unknown, object, unknown>;
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
  renderPropGroup,
  visibleColumns,
  classEntitiesActant,
  updateActantsMutation,
  addProp,
}) => {
  const { statementId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ACTANT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
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
      updateActantsMutation.mutate(newData);
    }
  };

  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { actants: updatedActants };
      updateActantsMutation.mutate(newData);
    }
  };

  const renderActantCell = () => {
    const {
      actant,
      sActant,
    }: {
      actant: IActant;
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
      actant: IActant;
      sActant: IStatementActant | any;
    } = row.values.data;

    const propOriginId = row.values.data.sActant.actant;
    return (
      <ButtonGroup noMargin>
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
              operator: sActant.operator,
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
            loading={updateActantsMutation.isLoading}
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
        {sActant.operator && (
          <Button
            key="oper"
            tooltip="Logical operator type"
            color="success"
            inverted={true}
            noBorder
            icon={sActant.operator}
          />
        )}
      </ButtonGroup>
    );
  };

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

      {renderPropGroup(
        row.values.data.sActant.actant,
        row.values.data.sActant.props,
        statement
      )}
    </React.Fragment>
  );
};
