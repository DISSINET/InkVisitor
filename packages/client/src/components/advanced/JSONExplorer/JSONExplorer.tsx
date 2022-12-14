import { Button } from "components";
import React, { useState } from "react";
import { BsArrowsCollapse, BsArrowsExpand } from "react-icons/bs";
import ReactJson from "react-json-view";
import { StyledJSONExplorerWrapper } from "./JSONExplorerStyles";

interface IJSONDisplay {
  data: object;
}

export const JSONExplorer: React.FC<IJSONDisplay> = ({ data = {} }) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  return (
    <StyledJSONExplorerWrapper>
      <Button
        onClick={() => {
          setCollapsed(!collapsed);
        }}
        inverted
        icon={
          collapsed ? (
            <BsArrowsExpand size={17} />
          ) : (
            <BsArrowsCollapse size={17} />
          )
        }
        label={collapsed ? "Expand all" : "Collapse all"}
      ></Button>
      <ReactJson
        src={data}
        enableClipboard={false}
        collapsed={collapsed}
        displayDataTypes={false}
        sortKeys={true}
      />
    </StyledJSONExplorerWrapper>
  );
};
