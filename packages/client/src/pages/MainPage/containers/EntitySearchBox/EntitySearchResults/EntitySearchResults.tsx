import { IResponseEntity } from "@shared/types";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { config, useSpring } from "react-spring";
import { areEqual, FixedSizeList as List } from "react-window";
import { scrollOverscanCount, springConfig } from "Theme/constants";
import { StyledResultItem } from "../EntitySearchBoxStyles";
import {
  StyledResultsAnimatedWrap,
  StyledRow,
} from "./EntitySearchResultsStyles";

interface EntitySearchResults {
  results?: IResponseEntity[];
  height: number;
}
export const EntitySearchResults: React.FC<EntitySearchResults> = ({
  results,
  height,
}) => {
  const data = useMemo(() => (results ? results : []), [results]);
  const animatedHeight = useSpring({
    height: `${height / 10}rem`,
    config: { tension: 195, friction: 20, mass: 1, clamp: true },
  });

  return (
    <>
      {results?.length && (
        <StyledResultsAnimatedWrap style={animatedHeight}>
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
        </StyledResultsAnimatedWrap>
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
        <EntityTag entity={entity} tooltipPosition="left" fullWidth />
      </StyledResultItem>
    </StyledRow>
  );
};

export const MemoizedRow = React.memo(Row, areEqual);
