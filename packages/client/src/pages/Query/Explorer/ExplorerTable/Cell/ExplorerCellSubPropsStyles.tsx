import styled from "styled-components";

// rows have a fixed height, so the nesting reads left to right: a bar opens
// each subproperty level right after the value it belongs to
export const StyledSubPropGroup = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[1]};
  border-left: 2px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledSubPropLevel = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledSubProp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

// a value and its subproperties on one line: the value tag keeps its width and
// the subproperties clip, with a "..." that opens the full tree
export const StyledValueWithSubProps = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 0;
  max-width: 100%;
`;

export const StyledValueTag = styled.span`
  display: inline-flex;
  flex-shrink: 0;
`;

export const StyledSubPropsClip = styled.span`
  display: flex;
  min-width: 0;
  overflow: hidden;
`;

export const StyledSubPropsMore = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["primary"]};
  cursor: default;
`;

// the full nesting, one subproperty per line, each level indented behind a bar
export const StyledValueTree = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledSubPropTree = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]};
  margin-left: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  border-left: 2px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledSubPropTreeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;
