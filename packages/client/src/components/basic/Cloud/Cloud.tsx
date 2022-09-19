import { Button } from "components";
import React, { ReactElement } from "react";
import { FaUnlink } from "react-icons/fa";
import { StyledCloud } from "./CloudStyles";

interface Cloud {
  children: ReactElement;
  onUnlink: () => void;
}
export const Cloud: React.FC<Cloud> = ({ children, onUnlink }) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <StyledCloud>{children}</StyledCloud>
      <div style={{ marginLeft: "0.3rem" }}>
        <Button
          tooltip="unlink from cloud"
          icon={<FaUnlink />}
          onClick={onUnlink}
        />
      </div>
    </div>
  );
};
