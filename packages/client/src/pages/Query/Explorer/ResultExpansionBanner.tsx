import React from "react";

import { IcoClose } from "Theme/icons";
import {
  StyledExpansionBannerChip,
  StyledExpansionBannerChipCount,
  StyledExpansionBannerLabel,
  StyledExpansionBannerRow,
} from "./ExplorerBoxStyles";

interface ResultExpansionBanner {
  includeEquivalents: boolean;
  includeSubordinates: boolean;
  /** Rows the expansion added to the current result, per provenance. */
  expansion?: { equivalents: number; subordinates: number };
  onToggleIncludeEquivalents: (value: boolean) => void;
  onToggleIncludeSubordinates: (value: boolean) => void;
}
/**
 * States - above the results - that the shown set is wider than the query's own
 * matches. The toggles that cause it live in the Query box header, far from the
 * rows they change, so the expansion is announced where its effect is read.
 */
export const ResultExpansionBanner: React.FC<ResultExpansionBanner> = ({
  includeEquivalents,
  includeSubordinates,
  expansion,
  onToggleIncludeEquivalents,
  onToggleIncludeSubordinates,
}) => {
  if (!includeEquivalents && !includeSubordinates) {
    return null;
  }

  return (
    <StyledExpansionBannerRow>
      <StyledExpansionBannerLabel>results expanded with</StyledExpansionBannerLabel>
      {includeEquivalents && (
        <StyledExpansionBannerChip
          $variant="equivalent"
          onClick={() => onToggleIncludeEquivalents(false)}
          title="stop including equivalents (run search to apply)"
        >
          equivalents
          {expansion !== undefined && (
            <StyledExpansionBannerChipCount>
              +{expansion.equivalents}
            </StyledExpansionBannerChipCount>
          )}
          <IcoClose />
        </StyledExpansionBannerChip>
      )}
      {includeSubordinates && (
        <StyledExpansionBannerChip
          $variant="subordinate"
          onClick={() => onToggleIncludeSubordinates(false)}
          title="stop including subordinates (run search to apply)"
        >
          subordinates
          {expansion !== undefined && (
            <StyledExpansionBannerChipCount>
              +{expansion.subordinates}
            </StyledExpansionBannerChipCount>
          )}
          <IcoClose />
        </StyledExpansionBannerChip>
      )}
    </StyledExpansionBannerRow>
  );
};
