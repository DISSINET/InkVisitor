import styled from "styled-components";

export const StyledFindReplaceRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

/** Occurrence counter shown inside the find input, GDocs style. */
export const StyledFindReplaceResults = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding-right: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

/** Search flags as a labelled column — words rather than icon-only toggles. */
export const StyledFindReplaceFlags = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledFindReplaceFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]};
  padding-top: ${({ theme }) => theme.space[1]};
`;

/** Wraps a button so its Loader can be absolutely positioned over it. */
export const StyledFindReplaceButtonWrap = styled.div`
  position: relative;
`;

export const StyledNoResults = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;

/** Entity tags share a row with the suggester and wrap once they fill it. */
export const StyledEntityMultiPickerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

/** Grey note in the footer, in the slot the action button would otherwise fill. */
export const StyledFindReplaceFooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color.gray["500"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
