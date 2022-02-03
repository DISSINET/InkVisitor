import React from "react";
import ReactJson from "react-json-view";
import { StyledJSONExplorerWrapper } from "./JSONExplorerStyles";

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
