import { IResponseEntity } from "@shared/types";
import React, { useMemo } from "react";
import { areEqual, FixedSizeList as List } from "react-window";
import { scrollOverscanCount } from "Theme/constants";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StyledResultItem } from "../EntitySearchBoxStyles";
import { StyledRow } from "./EntitySearchResultsStyles";

interface EntitySearchResults {
  results?: IResponseEntity[];
  height?: number;
}
export const EntitySearchResults: React.FC<EntitySearchResults> = ({
  results,
  height = 180,
}) => {
  const data = useMemo(() => (results ? results : []), [results]);

  return (
    <>
      {results?.length && (
        <List
          height={height}
          itemCount={results.length}
          itemData={data}
          itemSize={25}
          width="100%"
          overscanCount={scrollOverscanCount}
        >
          {MemoizedRow}
        </List>
      )}
    </>
  );
};

interface Row {
  data: IResponseEntity[];
  index: number;
  style: any;
}
const Row: React.FC<Row> = ({ data, index, style }) => {
  const entity = data[index];

  return (
    <StyledRow style={style}>
      <StyledResultItem>
        <EntityTag actant={entity} tooltipPosition="left center" fullWidth />
      </StyledResultItem>
    </StyledRow>
  );
};

export const MemoizedRow = React.memo(Row, areEqual);
