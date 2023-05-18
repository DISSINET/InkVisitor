import styled from "styled-components";

export const StyledIconFont = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  overflow: hidden;
  position: relative;
`;
interface StyledIconFont {}
export const StyledText = styled.p<StyledIconFont>`
  color: ${({ theme }) => theme.color["white"]};
  position: absolute;
  font-size: 0.9rem;

  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
