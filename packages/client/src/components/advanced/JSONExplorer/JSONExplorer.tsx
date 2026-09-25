import { Button } from "components";
import React, { useState } from "react";
import { BsArrowsCollapse, BsArrowsExpand, BsClipboard } from "react-icons/bs";
import ReactJson from "react-json-view";
import { StyledJSONExplorerWrapper } from "./JSONExplorerStyles";
import { useAppSelector } from "redux/hooks";
import { InterfaceEnums } from "@inkvisitor/shared/enums";
import { toast } from "react-toastify";

interface IJSONDisplay {
  data: object;
}

export const JSONExplorer: React.FC<IJSONDisplay> = ({ data = {} }) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector(
    (state) => state.theme
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.info("JSON copied to clipboard");
  };

  return (
    <StyledJSONExplorerWrapper>
      <div style={{ display: "flex", gap: "8px" }}>
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
        />
        <Button
          onClick={handleCopy}
          inverted
          icon={<BsClipboard size={17} />}
          label="Copy JSON"
        />
      </div>

      <ReactJson
        src={data}
        enableClipboard={false}
        collapsed={collapsed}
        displayDataTypes={false}
        sortKeys={true}
        theme={selectedThemeId === "dark" ? "bright" : "rjv-default"}
      />
    </StyledJSONExplorerWrapper>
  );
};
