import React from "react";
import { IcoExclamation } from "Theme/icons";
import { StyledAsymmetricalAnchorWarning } from "./AsymmetricalAnchorWarningStyles";

/**
 * Stands in for the text of an orphaned anchor, one whose opening tag never
 * closes, in the lists of an entity's anchors. The label is spelled out next
 * to the icon because one of those lists sits inside a tooltip, where a hover
 * hint cannot open.
 */
export const AsymmetricalAnchorWarning: React.FC = () => (
  <StyledAsymmetricalAnchorWarning>
    <IcoExclamation />
    broken anchor
  </StyledAsymmetricalAnchorWarning>
);
