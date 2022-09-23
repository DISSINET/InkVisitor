import styled from "styled-components";
import { Colors } from "types";

interface StyledCircle {
  color: typeof Colors[number];
}
export const StyledCircle = styled.div<StyledCircle>`
  border: 1px solid;
  border-color: ${({ theme, color }) => theme.color[color]};
  border-radius: 5rem;
`;
