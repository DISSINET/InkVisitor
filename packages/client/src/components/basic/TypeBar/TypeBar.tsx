import React from "react";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityLetter: string;
  noMargin?: boolean;
  isTemplate?: boolean;
  dimColor?: boolean;
}
export const TypeBar: React.FC<TypeBar> = ({
  entityLetter,
  noMargin = false,
  isTemplate = false,
  dimColor = false,
}) => {
  return (
    <StyledTypeBar
      entity={`entity${entityLetter}`}
      noMargin={noMargin}
      isTemplate={isTemplate}
      dimColor={dimColor}
    />
  );
};
