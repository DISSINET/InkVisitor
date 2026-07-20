import { Button } from "components";
import React, { ReactElement, ReactNode } from "react";
import { FaUnlink } from "react-icons/fa";
import {
  StyledButtonWrap,
  StyledCloud,
  StyledCloudTopRight,
  StyledCloudWrap,
} from "./CloudStyles";
import { IEntity } from "@inkvisitor/shared/types";

interface Cloud {
  children: ReactElement;
  onUnlink: () => void;
  originEntity: IEntity | undefined;
  disabled?: boolean;
  topRightSlot?: ReactNode;
}
export const Cloud: React.FC<Cloud> = ({
  children,
  onUnlink,
  originEntity,
  disabled,
  topRightSlot,
}) => {
  return (
    <StyledCloudWrap>
      <StyledCloud $hasTopRight={!!topRightSlot}>
        {topRightSlot && <StyledCloudTopRight>{topRightSlot}</StyledCloudTopRight>}
        {children}
      </StyledCloud>
      <StyledButtonWrap>
        <Button
          color="plain"
          inverted
          tooltipLabel={`unlink ${
            originEntity?.labels ?? "entity"
          } from the cloud`}
          icon={<FaUnlink />}
          onClick={onUnlink}
          disabled={disabled}
        />
      </StyledButtonWrap>
    </StyledCloudWrap>
  );
};
