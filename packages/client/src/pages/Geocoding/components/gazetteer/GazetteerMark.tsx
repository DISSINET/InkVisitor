import React from "react";
import { IcoSource } from "Theme/icons";
import { StyledGazetteerMark } from "./GazetteerCardStyles";

/** The one icon every source carries, so a gazetteer name reads as a gazetteer wherever it appears. */
export const GazetteerMark: React.FC = () => (
  <StyledGazetteerMark aria-hidden>
    <IcoSource />
  </StyledGazetteerMark>
);
