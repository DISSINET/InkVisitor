import styled from "styled-components";

// the full nesting, one subproperty per line, each level indented behind a bar
export const StyledValuesTree = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
`;

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
