import { getWarningMessage } from "@shared/enums/warning";
import { IWarning } from "@shared/types";
import { ThemeColor } from "Theme/theme";
import React from "react";
import { StyledMessage } from "./MessateStyles";

interface Message {
  warning: IWarning;
  color: keyof ThemeColor;
}
export const Message: React.FC<Message> = ({ warning, color = "success" }) => {
  return (
    <StyledMessage $color={color}>{getWarningMessage(warning)}</StyledMessage>
  );
};
