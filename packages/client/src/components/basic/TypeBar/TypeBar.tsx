import React from "react";
import { StyledTypeBar } from "./TypeBarStyles";
import { EntityEnums } from "@shared/enums";

interface TypeBar {
  entityClass: EntityEnums.ExtendedClass;
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
      entityColor={`entity${entityClass}`}
      noMargin={noMargin}
      isTemplate={isTemplate}
      dimColor={dimColor}
    />
  );
};
