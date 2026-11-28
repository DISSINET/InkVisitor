import styled from "styled-components";

/** Said after a name form, quieter than the form itself, and set off from it by its own margin. */
export const StyledScopeMark = styled.span`
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
`;
