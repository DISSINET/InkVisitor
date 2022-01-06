import api from "api";
import { useSearchParams } from "hooks";
import React, { useMemo, useRef, useState } from "react";
import { UseMutationResult, useQuery } from "react-query";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaClone,
  FaGripVertical,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import { Cell, ColumnInstance } from "react-table";

import { DragItem, ItemTypes } from "types";
import { StatementListRowExpanded } from "./StatementListRowExpanded";
import {
  StyledTd,
  StyledTdLastEdit,
  StyledTr,
} from "./StatementListTableStyles";
import {
  IStatement,
  IActant,
  IAction,
  IResponseStatement,
  IResponseTerritory,
} from "@shared/types";
import { EntityTag } from "../..";
import { Button, ButtonGroup, Submit, TagGroup, Tooltip } from "components";
import { StyledDots, StyledText } from "../StatementLitBoxStyles";
import { UserRoleMode } from "@shared/enums";
import { BsArrowUp, BsArrowDown } from "react-icons/bs";
import { StatementListContextMenu } from "../StatementListContextMenu/StatementListContextMenu";

interface StatementListRow {
  row: any;
  index: number;
  moveRow: any;
  moveEndRow: Function;
  handleClick: Function;
  visibleColumns: ColumnInstance<{}>[];
  actants: IActant[];
  data?: IResponseTerritory;
  duplicateStatementMutation: UseMutationResult<
    void,
    unknown,
    IResponseStatement,
    unknown
  >;
  removeStatementMutation: UseMutationResult<void, unknown, string, unknown>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
  moveEndRow,
  handleClick = () => {},
  visibleColumns,
  actants,
  data,
  duplicateStatementMutation,
  addStatementAtCertainIndex,
  removeStatementMutation,
}) => {
  const { statementId } = useSearchParams();
  const [showSubmit, setShowSubmit] = useState(false);

  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", row.values.id],
    async () => {
      const res = await api.auditGet(row.values.id);
      return res.data;
    },
    { enabled: row && !!row.values.id, retry: 2 }
  );

  const lastEditdateText = useMemo(() => {
    if (audit && audit.last && audit.last[0] && audit.last[0].date) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastEditDate = audit.last[0].date;
      const lastEditDay = new Date(lastEditDate).setHours(0, 0, 0, 0);

      if (today === lastEditDay) {
        return (
          "today " +
          new Date(lastEditDate).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } else {
        new Date(lastEditDate).toLocaleDateString("en-GB");
      }
    } else {
      return "";
    }

    return;
  }, [audit]);

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STATEMENT_ROW,
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
    item: { type: ItemTypes.STATEMENT_ROW, index, id: row.values.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      moveEndRow(row.values, index);
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  const renderListActant = (actantObject: IActant, key: number) => {
    return (
      actantObject && (
        <EntityTag
          key={key}
          actant={actantObject}
          showOnly="entity"
          tooltipPosition="bottom center"
        />
      )
    );
  };

  const renderStatementCell = () => {
    const statement = row.original as IStatement;
    return (
      <EntityTag
        actant={statement as IActant}
        showOnly="entity"
        tooltipText={statement.data.text}
      />
    );
  };

  const renderSubjectCell = () => {
    const subjectIds = row.values.data?.actants
      ? row.values.data.actants
          .filter((a: any) => a.position === "s")
          .map((a: any) => a.actant)
      : [];

    const subjectObjects = subjectIds.map((actantId: string) => {
      const subjectObject = actants && actants.find((a) => a.id === actantId);

      return subjectObject;
    });

    const isOversized = subjectIds.length > 2;

    return (
      <TagGroup>
        {subjectObjects
          .slice(0, 2)
          .map((subjectObject: IActant, key: number) =>
            renderListActant(subjectObject, key)
          )}
        {isOversized && (
          <Tooltip
            offsetX={-14}
            position="right center"
            color="success"
            noArrow
            items={
              <TagGroup>
                {subjectObjects
                  .slice(2)
                  .map((subjectObject: IActant, key: number) =>
                    renderListActant(subjectObject, key)
                  )}
              </TagGroup>
            }
          >
            <StyledDots>{"..."}</StyledDots>
          </Tooltip>
        )}
      </TagGroup>
    );
  };

  const renderActionsCell = () => {
    const { actions }: { actions?: IAction[] } = row.original;

    if (actions) {
      const isOversized = actions.length > 2;
      return (
        <TagGroup>
          {actions
            .slice(0, 2)
            .map((action: IActant, key: number) =>
              renderListActant(action, key)
            )}
          {isOversized && (
            <Tooltip
              offsetX={-14}
              position="right center"
              color="success"
              noArrow
              items={
                <TagGroup>
                  {actions
                    .slice(2)
                    .map((action: IActant, key: number) =>
                      renderListActant(action, key)
                    )}
                </TagGroup>
              }
            >
              <StyledDots>{"..."}</StyledDots>
            </Tooltip>
          )}
        </TagGroup>
      );
    } else {
      return <div />;
    }
  };

  const renderObjectsCell = () => {
    const actantIds = row.values.data?.actants
      ? row.values.data.actants
          .filter((a: any) => a.position !== "s")
          .map((a: any) => a.actant)
      : [];
    const isOversized = actantIds.length > 4;

    const actantObjects = actantIds.map((actantId: string) => {
      const actantObject =
        actants && actants.find((a) => a && a.id === actantId);
      return actantObject && actantObject;
    });
    return (
      <TagGroup>
        {actantObjects
          .slice(0, 4)
          .map((actantObject: IActant, key: number) =>
            renderListActant(actantObject, key)
          )}
        {isOversized && (
          <Tooltip
            offsetX={-14}
            position="right center"
            color="success"
            noArrow
            items={
              <TagGroup>
                {actantObjects
                  .slice(4)
                  .map((actantObject: IActant, key: number) =>
                    renderListActant(actantObject, key)
                  )}
              </TagGroup>
            }
          >
            <StyledDots>{"..."}</StyledDots>
          </Tooltip>
        )}
      </TagGroup>
    );
  };

  const renderTextCell = () => {
    const { text } = row.values.data;
    const maxWordsCount = 20;
    const trimmedText = text.split(" ").slice(0, maxWordsCount).join(" ");
    if (text?.match(/(\w+)/g)?.length > maxWordsCount) {
      return <StyledText>{trimmedText}...</StyledText>;
    }
    return <StyledText>{trimmedText}</StyledText>;
  };

  const renderExpanderCell = () => {
    return (
      <ButtonGroup>
        {data?.right !== UserRoleMode.Read && (
          <StatementListContextMenu
            buttons={[
              <Button
                key="r"
                icon={<FaTrashAlt size={14} />}
                color="danger"
                tooltip="delete"
                onClick={() => {
                  setShowSubmit(true);
                }}
              />,
              <Button
                key="d"
                icon={<FaClone size={14} />}
                color="warning"
                tooltip="duplicate"
                onClick={() => {
                  duplicateStatementMutation.mutate(
                    row.original as IResponseStatement
                  );
                }}
              />,
              <Button
                key="add-up"
                icon={
                  <>
                    <FaPlus size={14} />
                    <BsArrowUp size={14} />
                  </>
                }
                tooltip="add new statement before"
                color="info"
                onClick={() => {
                  addStatementAtCertainIndex(row.index - 1);
                }}
              />,
              <Button
                key="add-down"
                icon={
                  <>
                    <FaPlus size={14} />
                    <BsArrowDown size={14} />
                  </>
                }
                tooltip="add new statement after"
                color="success"
                onClick={() => {
                  addStatementAtCertainIndex(row.index + 1);
                }}
              />,
            ]}
          />
        )}
        <span
          {...row.getToggleRowExpandedProps()}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            row.toggleRowExpanded();
          }}
        >
          {row.isExpanded ? <FaChevronCircleUp /> : <FaChevronCircleDown />}
        </span>
      </ButtonGroup>
    );
  };

  const renderListActantLong = (
    actantObject: IActant,
    key: number,
    attributes?: boolean,
    statement?: IResponseStatement
  ) => {
    return (
      actantObject && (
        <div key={key}>
          <div style={{ marginTop: "4px", display: "flex" }}>
            <EntityTag
              key={key}
              actant={actantObject}
              tooltipPosition="bottom center"
            />
          </div>
          <div>
            {/* {statement ? renderPropGroup(actantObject.id, statement) : ""} */}
          </div>
        </div>
      )
    );
  };

  const renderExpActions = () => {
    const { actions }: { actions?: IAction[] } = row.original;
    const statement = row.original as IResponseStatement;
    if (actions) {
      return (
        <>
          <div>{actions.length > 0 ? <i>Actions</i> : ""}</div>
          <TagGroup>
            <div style={{ display: "block" }}>
              {actions.map((action: IAction, key: number) =>
                renderListActantLong(action, key, true, statement)
              )}
            </div>
          </TagGroup>
        </>
      );
    } else {
      return <div />;
    }
  };

  return (
    <React.Fragment key={row.values.data.territory.order}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        isOdd={Boolean(index % 2)}
        isSelected={row.values.id === statementId}
        onClick={(e: any) => {
          handleClick(row.values.id);
          e.stopPropagation();
        }}
        id={`statement${row.values.id}`}
      >
        <td
          ref={dragRef}
          style={{ cursor: "move" }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <FaGripVertical />
        </td>
        <StyledTd>{renderStatementCell()}</StyledTd>
        <StyledTd>{renderSubjectCell()}</StyledTd>
        <StyledTd>{renderActionsCell()}</StyledTd>
        <StyledTd>{renderObjectsCell()}</StyledTd>
        <StyledTd>{renderTextCell()}</StyledTd>
        <StyledTdLastEdit key="audit">{lastEditdateText}</StyledTdLastEdit>
        <StyledTd>{renderExpanderCell()}</StyledTd>
      </StyledTr>
      {row.isExpanded ? (
        <StatementListRowExpanded row={row} visibleColumns={visibleColumns} />
      ) : null}

      <Submit
        title="Delete statement"
        text={`Do you really want to delete statement [${
          row.original?.label ? row.original.label : row.original?.id
        }]?`}
        show={showSubmit}
        onCancel={() => {
          setShowSubmit(false);
        }}
        onSubmit={() => {
          if (row.original) {
            removeStatementMutation.mutate(row.original.id);
            setShowSubmit(false);
          }
        }}
        loading={removeStatementMutation.isLoading}
      />
    </React.Fragment>
  );
};
