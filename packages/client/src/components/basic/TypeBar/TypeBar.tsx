import React from "react";
import { EntityColors } from "types";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityLetter: keyof typeof EntityColors;
  noMargin?: boolean;
  isTemplate?: boolean;
  dimColor?: boolean;
  width?: number;
}
export const TypeBar: React.FC<TypeBar> = ({
  entityLetter,
  noMargin = false,
  isTemplate = false,
  dimColor = false,
  width = 3,
}) => {
  return (
    <StyledTypeBar
      $entity={EntityColors[entityLetter]?.color ?? "transparent"}
      $noMargin={noMargin}
      $isTemplate={isTemplate}
      $dimColor={dimColor}
      $width={width}
    />
  );
};
