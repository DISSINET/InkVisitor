import React from "react";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityClass: string;
  noMargin?: boolean;
  isTemplate?: boolean;
  dimColor?: boolean;
}
export const TypeBar: React.FC<TypeBar> = ({
  entityClass,
  noMargin = false,
  isTemplate = false,
  dimColor = false,
}) => {
  return (
    <StyledTypeBar
      entity={`entity${entityClass}`}
      noMargin={noMargin}
      isTemplate={isTemplate}
      dimColor={dimColor}
    />
  );
};
