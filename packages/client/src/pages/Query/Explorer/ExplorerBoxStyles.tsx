import styled from "styled-components";

/** The box's content: control bar, then the table or stats filling the rest. */
export const StyledExplorerColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

/** Strip above the results announcing an active result expansion (#2969). */
export const StyledExpansionBannerRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background-color: ${({ theme }) => theme.color["gray"][150]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledExpansionBannerLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color["gray"][700]};
`;

interface StyledExpansionBannerChip {
  $variant: "equivalent" | "subordinate";
}
// one active expansion; clicking it switches that expansion off, so it doubles
// as the shortcut back to the plain result set
export const StyledExpansionBannerChip = styled.button<StyledExpansionBannerChip>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid
    ${({ theme, $variant }) => theme.color[$variant === "equivalent" ? "info" : "warning"]};
  border-radius: ${({ theme }) => theme.borderRadius["full"]};
  background-color: ${({ theme, $variant }) =>
    theme.color["invertedBg"][$variant === "equivalent" ? "info" : "warning"]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;

  svg {
    color: ${({ theme }) => theme.color["gray"][700]};
  }

  &:hover svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledExpansionBannerChipCount = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
`;

/** Holds the active view - table or stats - filling what the control bar leaves. */
export const StyledExplorerViewArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;
