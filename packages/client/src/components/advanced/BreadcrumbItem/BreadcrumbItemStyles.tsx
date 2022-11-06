import styled from "styled-components";

export const StyledItemBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
