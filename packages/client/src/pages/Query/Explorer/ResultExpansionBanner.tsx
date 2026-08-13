import React, { useState } from "react";

import { Tooltip } from "components";
import { IcoClose, IcoInfo } from "Theme/icons";
import {
  StyledExpansionBannerChip,
  StyledExpansionBannerChipCount,
  StyledExpansionBannerInfo,
  StyledExpansionBannerLabel,
  StyledExpansionBannerNote,
  StyledExpansionBannerRow,
} from "./ExplorerBoxStyles";

interface ResultExpansionBanner {
  includeEquivalents: boolean;
  includeSubordinates: boolean;
  /** Rows the expansion added to the current result, per provenance. */
  expansion?: { equivalents: number; subordinates: number };
  /** True while any explore filter narrows the result (label, uuids, search box). */
  hasFilters?: boolean;
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
  hasFilters = false,
  onToggleIncludeEquivalents,
  onToggleIncludeSubordinates,
}) => {
  const [infoElement, setInfoElement] = useState<HTMLElement | null>(null);
  const [infoHovered, setInfoHovered] = useState(false);

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
      {hasFilters && (
        <>
          <StyledExpansionBannerNote>
            added after the filters, so they need not match them
          </StyledExpansionBannerNote>
          <StyledExpansionBannerInfo
            ref={setInfoElement}
            onMouseEnter={() => setInfoHovered(true)}
            onMouseLeave={() => setInfoHovered(false)}
          >
            <IcoInfo />
          </StyledExpansionBannerInfo>
          <Tooltip
            label="expansion runs on the filtered matches"
            content={
              <p>
                The filters narrow the query matches; the equivalents and subordinates of what
                survives are then appended. Rows that arrived that way carry an eq / sub mark on
                their tag.
              </p>
            }
            visible={infoHovered}
            referenceElement={infoElement}
            position="bottom"
          />
        </>
      )}
    </StyledExpansionBannerRow>
  );
};
