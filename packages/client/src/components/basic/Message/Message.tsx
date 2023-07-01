import React from "react";
import { StyledMessage } from "./MessateStyles";
import { ThemeColor } from "Theme/theme";

interface Message {
  text: string;
  color: keyof ThemeColor;
}
export const Message: React.FC<Message> = ({
  text = "",
  color = "success",
}) => {
  return <StyledMessage $color={color}>{text}</StyledMessage>;
};
