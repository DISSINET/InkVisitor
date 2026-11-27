import React from "react";
import { StyledScopeMark } from "./CandidateScopeMarkStyles";

interface CandidateScopeMark {
  /** What the engine marked a name form as; absent where its marks did not arrive in time. */
  scope?: "place" | "container";
}

/**
 * Says a name form names a larger place around the one sought, such as the town
 * around an abbey. Under the engine's default rule a container's records give a
 * suggestion's coordinate only where nothing else was found, which is why a
 * coordinate can lie away from where that name's records point.
 */
export const CandidateScopeMark: React.FC<CandidateScopeMark> = ({ scope }) =>
  scope === "container" ? (
    <StyledScopeMark data-hint="The name of a town or area around the place sought, such as the town around an abbey. Under the engine's default rule its records give a suggestion's coordinate only where nothing else was found.">
      around it
    </StyledScopeMark>
  ) : null;
