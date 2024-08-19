import { Box, Panel } from "components";
import React from "react";
import { useAppSelector } from "redux/hooks";

interface AdvancedSearchPage {}
export const AdvancedSearchPage: React.FC<AdvancedSearchPage> = ({}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );
  return (
    <>
      <Panel width={layoutWidth / 3}>
        <Box borderColor="white" height={contentHeight} label="Search">
          {/* <MemoizedAdvancedSearchBox /> */}
        </Box>
      </Panel>
      <Panel width={(layoutWidth / 3) * 2}>
        <Box borderColor="white" height={contentHeight} label="Explorer">
          {/* <MemoizedExplorerBox /> */}
        </Box>
      </Panel>
    </>
  );
};
