import styled from "styled-components";

export const StyledTreeWrapper = styled.div`
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;
export const StyledNoResults = styled.p`
  font-style: italic;
  font-size: 1.4rem;
  margin: 0.5rem;
  color: ${({ theme }) => theme.color.black};
`;
