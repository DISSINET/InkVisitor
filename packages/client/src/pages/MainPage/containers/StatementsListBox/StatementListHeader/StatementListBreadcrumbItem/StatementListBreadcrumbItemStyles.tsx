import styled from "styled-components";

export const StyledItemBox = styled.div`
  position: relative;
  display: flex;
  color: ${({ theme }) => theme.color["info"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
`;
