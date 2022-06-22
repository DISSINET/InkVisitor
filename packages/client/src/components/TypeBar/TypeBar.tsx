import React from "react";
import { StyledTypeBar } from "./TypeBarStyles";

interface TypeBar {
  entityLetter: string;
  noMargin?: boolean;
}
export const TypeBar: React.FC<TypeBar> = ({
  entityLetter,
  noMargin = false,
}) => {
  return <StyledTypeBar entity={`entity${entityLetter}`} noMargin={noMargin} />;
};
