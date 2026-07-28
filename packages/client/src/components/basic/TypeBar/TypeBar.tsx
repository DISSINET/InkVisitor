import React from "react";
import { ThemeColor } from "Theme/theme";
import { EntityColors } from "types";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityLetter: keyof typeof EntityColors;
  noMargin?: boolean;
  isTemplate?: boolean;
  dimColor?: boolean;
  width?: number;
  /** Paints the bar in a fixed colour, for fields that carry no entity class. */
  color?: keyof ThemeColor;
}
export const TypeBar: React.FC<TypeBar> = ({
  entityLetter,
  noMargin = false,
  isTemplate = false,
  dimColor = false,
  width = 3,
  color,
}) => {
  return (
    <StyledTypeBar
      $entity={color ?? EntityColors[entityLetter]?.color ?? "transparent"}
      $noMargin={noMargin}
      $isTemplate={isTemplate}
      $dimColor={dimColor}
      $width={width}
    />
  );
};
