import { useSpring } from "@react-spring/web";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { List } from "react-window";
import { scrollOverscanCount } from "Theme/constants";
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
            rowProps={{ data }}
            rowCount={results.length}
            rowHeight={25}
            overscanCount={scrollOverscanCount}
            rowComponent={(props) => <Row {...props} />}
          />
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

  const { setStatementId } = useSearchParams();

  return (
    <StyledRow style={style}>
      <StyledResultItem>
        <EntityTag
          entity={entity}
          tooltipPosition="left"
          fullWidth
          button={
            entity.class === EntityEnums.Class.Statement && (
              <Button
                tooltipLabel="open statement in editor"
                color="plain"
                inverted
                icon={<FaEdit />}
                onClick={() => setStatementId(entity.id)}
              />
            )
          }
        />
      </StyledResultItem>
    </StyledRow>
  );
};
