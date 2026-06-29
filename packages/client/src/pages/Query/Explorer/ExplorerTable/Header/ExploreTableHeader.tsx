import { Explore } from "@inkvisitor/shared/types/query";
import React from "react";
import ExploreTableHeaderColumn from "./ExploreTableHeaderColumn";
import { StyledHeader } from "../ExplorerTableStyles";
import { WIDTH_COLUMN_FIRST } from "../constants";

const ExploreTableHeader: React.FC<{
  columns: Explore.IExploreColumn[];
  onRemoveColumn: (id: string) => void;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
}> = React.memo(({ columns, onRemoveColumn, onMoveColumn }) => {
  return (
    <StyledHeader>
      <div
        className="qt-col qt-col-header"
        style={{
          width: WIDTH_COLUMN_FIRST,
          minWidth: WIDTH_COLUMN_FIRST,
          maxWidth: WIDTH_COLUMN_FIRST,
        }}
      >
        Entity
      </div>
      {columns.map((column, key) => {
        return (
          <ExploreTableHeaderColumn
            key={column.id}
            column={column}
            index={key}
            isFirst={key === 0}
            isLast={key === columns.length - 1}
            onRemoveColumn={onRemoveColumn}
            onMoveColumn={onMoveColumn}
          />
        );
      })}
    </StyledHeader>
  );
});

ExploreTableHeader.displayName = "ExploreTableHeader";

export default ExploreTableHeader;
