import { Box, Panel } from "components";
import { PanelSeparator } from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";

interface AdvancedSearchPage {}
export const AdvancedSearchPage: React.FC<AdvancedSearchPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const handleSeparatorXPositionChange = (xPosition: number) => {
    if (advancedSearchSeparatorXPosition !== xPosition) {
      setAdvancedSearchSeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem(
        "advancedSearchSeparatorXPosition",
        separatorXPercentPosition.toString()
      );
    }
  };

  const onePercentOfLayoutWidth = useMemo(
    () => layoutWidth / 100,
    [layoutWidth]
  );

  const localStorageSeparatorXPosition = localStorage.getItem(
    "advancedSearchSeparatorXPosition"
  );
  const [
    advancedSearchSeparatorXPosition,
    setAdvancedSearchSeparatorXPosition,
  ] = useState<number>(
    localStorageSeparatorXPosition
      ? floorNumberToOneDecimal(
          Number(localStorageSeparatorXPosition) * onePercentOfLayoutWidth
        )
      : layoutWidth / 2
  );

  const [currentLayoutWidth, setcurrentLayoutWidth] = useState(layoutWidth);

  useEffect(() => {
    const onePercentOfLastLayoutWidth = currentLayoutWidth / 100;
    const separatorXPercentPosition = floorNumberToOneDecimal(
      advancedSearchSeparatorXPosition / onePercentOfLastLayoutWidth
    );
    setAdvancedSearchSeparatorXPosition(
      separatorXPercentPosition * onePercentOfLayoutWidth
    );
    localStorage.setItem(
      "advancedSearchSeparatorXPosition",
      separatorXPercentPosition.toString()
    );
    setcurrentLayoutWidth(layoutWidth);
  }, [layoutWidth]);

  return (
    <>
      {advancedSearchSeparatorXPosition > 0 && (
        <PanelSeparator
          leftSideMinWidth={400}
          leftSideMaxWidth={layoutWidth - 400}
          separatorXPosition={advancedSearchSeparatorXPosition}
          setSeparatorXPosition={(xPosition) =>
            handleSeparatorXPositionChange(xPosition)
          }
        />
      )}

      <Panel width={advancedSearchSeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Search">
          {/* <MemoizedAdvancedSearchBox /> */}
        </Box>
      </Panel>
      <Panel width={layoutWidth - advancedSearchSeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Explorer">
          {/* <MemoizedExplorerBox /> */}
        </Box>
      </Panel>
    </>
  );
};
