import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledMessage {
  $color: keyof ThemeColor;
}
export const StyledMessage = styled.div<StyledMessage>`
  background-color: ${({ theme, $color }) => theme.color[$color]};
  padding: ${({ theme }) => theme.space[4]};
`;
