import styled from "styled-components";
import { Colors } from "types";

interface StyledIconFont {
  color?: typeof Colors[number];
}
export const StyledIconFont = styled.p<StyledIconFont>`
  background-color: ${({ theme, color }) =>
    color ? theme.color[color] : theme.color["greyer"]};
  color: ${({ theme }) => theme.color["white"]};
  height: 1.6rem;
  width: 1.6rem;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  font-size: 0.9rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
