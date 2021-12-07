import React, { useState, useMemo, useEffect } from "react";
import { StyledJSONExplorerWrapper } from "./JSONExplorerStyles";
import ReactJson from "react-json-view";

interface IJSONDisplay {
  data: object;
}

export const JSONExplorer: React.FC<IJSONDisplay> = ({ data = {} }) => {
  return (
    <StyledJSONExplorerWrapper>
      <ReactJson
        src={data}
        enableClipboard={false}
        collapsed={true}
        displayDataTypes={false}
        sortKeys={true}
      />
    </StyledJSONExplorerWrapper>
  );
};
