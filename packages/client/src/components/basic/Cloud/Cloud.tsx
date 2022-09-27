import { Button } from "components";
import React, { ReactElement } from "react";
import { FaUnlink } from "react-icons/fa";
import { StyledButtonWrap, StyledCloud, StyledCloudWrap } from "./CloudStyles";

interface Cloud {
  children: ReactElement;
  onUnlink: () => void;
}
export const Cloud: React.FC<Cloud> = ({ children, onUnlink }) => {
  return (
    <StyledCloudWrap style={{ display: "flex", alignItems: "center" }}>
      <StyledCloud>{children}</StyledCloud>
      <StyledButtonWrap style={{ marginLeft: "0.3rem" }}>
        <Button
          tooltip="unlink from cloud"
          icon={<FaUnlink />}
          onClick={onUnlink}
        />
      </StyledButtonWrap>
    </StyledCloudWrap>
  );
};
