import { Box, Panel } from "components";
import { PanelSeparator } from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "redux/hooks";
import { floorNumberToOneDecimal } from "utils/utils";

interface QueryPage {}
export const QueryPage: React.FC<QueryPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  const handleSeparatorXPositionChange = (xPosition: number) => {
    if (querySeparatorXPosition !== xPosition) {
      setquerySeparatorXPosition(xPosition);

      const separatorXPercentPosition = floorNumberToOneDecimal(
        xPosition / onePercentOfLayoutWidth
      );
      localStorage.setItem(
        "querySeparatorXPosition",
        separatorXPercentPosition.toString()
      );
    }
  };

  const onePercentOfLayoutWidth = useMemo(
    () => layoutWidth / 100,
    [layoutWidth]
  );

  const localStorageSeparatorXPosition = localStorage.getItem(
    "querySeparatorXPosition"
  );
  const [querySeparatorXPosition, setquerySeparatorXPosition] =
    useState<number>(
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
      querySeparatorXPosition / onePercentOfLastLayoutWidth
    );
    setquerySeparatorXPosition(
      separatorXPercentPosition * onePercentOfLayoutWidth
    );
    localStorage.setItem(
      "querySeparatorXPosition",
      separatorXPercentPosition.toString()
    );
    setcurrentLayoutWidth(layoutWidth);
  }, [layoutWidth]);

  return (
    <>
      {querySeparatorXPosition > 0 && (
        <PanelSeparator
          leftSideMinWidth={400}
          leftSideMaxWidth={layoutWidth - 400}
          separatorXPosition={querySeparatorXPosition}
          setSeparatorXPosition={(xPosition) =>
            handleSeparatorXPositionChange(xPosition)
          }
        />
      )}

      <Panel width={querySeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Search">
          {/* <MemoizedQueryBox /> */}
        </Box>
      </Panel>
      <Panel width={layoutWidth - querySeparatorXPosition}>
        <Box borderColor="white" height={contentHeight} label="Explorer">
          {/* <MemoizedExplorerBox /> */}
        </Box>
      </Panel>
    </>
  );
};
