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

export const StyledSubProp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;
