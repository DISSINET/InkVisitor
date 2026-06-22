import { Explore } from "@inkvisitor/shared/types/query";
import { Button, Loader } from "components";
import { useTheme } from "hooks";
import React from "react";
import { CgClose } from "react-icons/cg";
import { MdOutlineEdit } from "react-icons/md";
import { ExploreTableHeaderTooltip } from "./ExploreTableHeaderTooltip";
import { StyledHeader } from "./ExplorerTableStyles";
import { WIDTH_COLUMN_DEFAULT, WIDTH_COLUMN_EUC, WIDTH_COLUMN_FIRST } from "./types";

const ExploreTableHeader: React.FC<{
  columns: Explore.IExploreColumn[];
  onRemoveColumn: (id: string) => void;
}> = React.memo(({ columns, onRemoveColumn }) => {
  const theme = useTheme();

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
          <div
            key={key}
            className="qt-col qt-col-header"
            style={{
              width:
                column.type === Explore.EExploreColumnType.EUC ||
                column.type === Explore.EExploreColumnType.ELI
                  ? WIDTH_COLUMN_EUC
                  : WIDTH_COLUMN_DEFAULT,
              minWidth: WIDTH_COLUMN_EUC,
              maxWidth: WIDTH_COLUMN_DEFAULT,
              display: "flex",
              alignItems: "center",
            }}
          >
            {column.editable && <MdOutlineEdit size={14} style={{ marginRight: "0.3rem" }} />}
            <ExploreTableHeaderTooltip column={column}>{column.name}</ExploreTableHeaderTooltip>
            <span style={{ marginLeft: "0.5rem" }}>
              <Button
                noBorder
                noBackground
                inverted
                icon={<CgClose color={theme.color.white} />}
                onClick={() => onRemoveColumn(column.id)}
                tooltipLabel="remove column"
              />
            </span>
          </div>
        );
      })}
    </StyledHeader>
  );
});

ExploreTableHeader.displayName = "ExploreTableHeader";

export default ExploreTableHeader;
