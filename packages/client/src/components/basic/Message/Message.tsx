import { getWarningMessage } from "@shared/enums/warning";
import { IWarning } from "@shared/types";
import { ThemeColor } from "Theme/theme";
import React from "react";
import { StyledMessage } from "./MessateStyles";

interface Message {
  warning: IWarning;
}
export const Message: React.FC<Message> = ({ warning }) => {
  return <StyledMessage>{getWarningMessage(warning)}</StyledMessage>;
};
