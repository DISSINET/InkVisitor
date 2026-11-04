import styled from "styled-components";

/** What a hover card is anchored to: no box of its own. */
export const StyledCoordinateAnchor = styled.span`
  display: inline-flex;
`;

/** The icon-only tag a coordinate is shown as until it is asked about. */
export const StyledCoordinateTag = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0.1rem 0.3rem;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["primary"]};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledCoordinateCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  width: 24rem;
  text-align: left;
`;

export const StyledCoordinateKind = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

export const StyledCoordinateText = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

export const StyledCoordinateExtent = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.85;
`;

export const StyledMiniMap = styled.div`
  width: 100%;
  height: 14rem;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  overflow: hidden;
  background-color: ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledCoordinateNote = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.75;
`;
