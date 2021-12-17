import React, {
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import { StyledTable } from "../StatementEditorActionTable/StatementEditorActionTableStyles";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow";
import { IActant, IResponseStatement, IStatementAction } from "@shared/types";
import { EntitySuggester, EntityTag } from "../..";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ActantType } from "@shared/enums";
import { excludedSuggesterEntities } from "Theme/constants";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";

interface FilteredActionObject {
  data: { action: IActant | undefined; sAction: IStatementAction };
}
interface StatementEditorActionTable {
  statement: IResponseStatement;
  statementId: string;
  userCanEdit?: boolean;
  handleRowClick?: Function;
  renderPropGroup: Function;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  propsByOrigins: {
    [key: string]: {
      type: "action" | "actant";
      origin: string;
      props: any[];
      actant: IActant;
    };
  };
}
export const StatementEditorActionTable: React.FC<
  StatementEditorActionTable
> = ({
  statement,
  statementId,
  userCanEdit = false,
  handleRowClick = () => {},
  renderPropGroup,
  updateActionsMutation,
  addProp,
  propsByOrigins,
}) => {
  const [filteredActions, setFilteredActions] = useState<
    FilteredActionObject[]
  >([]);

  useEffect(() => {
    const filteredActions = statement.data.actions.map((sAction, key) => {
      const action = statement.actants?.find((a) => a.id === sAction.action);
      return { id: key, data: { action, sAction } };
    });
    setFilteredActions(filteredActions);
  }, [statement]);

  const updateActionOrder = () => {
    if (userCanEdit) {
      const actions: IStatementAction[] = filteredActions.map(
        (filteredAction) => filteredAction.data.sAction
      );
      if (JSON.stringify(statement.data.actions) !== JSON.stringify(actions)) {
        updateActionsMutation.mutate({
          actions: actions,
        });
      }
    }
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = filteredActions[dragIndex];
      setFilteredActions(
        update(filteredActions, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [filteredActions]
  );

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Action",
        accessor: "data",
      },
      {
        id: "Attributes & Buttons",
      },
    ];
  }, [filteredActions, updateActionsMutation.isLoading]);

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable(
    {
      columns,
      data: filteredActions,
      getRowId,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded
  );

  return (
    <>
      <StyledTable {...getTableProps()}>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row, i: number) => {
            prepareRow(row);
            return (
              <StatementEditorActionTableRow
                renderPropGroup={renderPropGroup}
                handleClick={handleRowClick}
                index={i}
                row={row}
                statement={statement}
                moveRow={moveRow}
                userCanEdit={userCanEdit}
                updateOrderFn={updateActionOrder}
                visibleColumns={visibleColumns}
                updateActionsMutation={updateActionsMutation}
                addProp={addProp}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    </>
  );
};
