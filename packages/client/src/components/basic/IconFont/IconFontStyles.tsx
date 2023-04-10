import styled from "styled-components";
import { Colors } from "types";

interface StyledIconFont {
  color: typeof Colors[number];
  size: number;
}
export const StyledIconFont = styled.p<StyledIconFont>`
  background-color: ${({ theme, color }) => theme.color[color]};
  color: ${({ theme }) => theme.color["white"]};
  height: ${({ size }) => `${size / 10}rem`};
  width: ${({ size }) => `${size / 10}rem`};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  font-size: 0.9rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
