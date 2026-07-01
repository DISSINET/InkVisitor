import styled from "styled-components";
import { ThemeColor } from "Theme/theme";

interface StyledTypeBar {
  $entity: keyof ThemeColor;
  $noMargin: boolean;
  $isTemplate: boolean;
  $dimColor: boolean;
  $width: number;
}
export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, $entity }) => theme.color[$entity]};
  width: ${({ $width }) => $width}px;
  left: ${({ $noMargin }) => ($noMargin ? 0 : "1px")};
  top: ${({ $noMargin }) => ($noMargin ? 0 : "1px")};
  bottom: ${({ $noMargin, $isTemplate }) => ($isTemplate ? "50%" : $noMargin ? 0 : "1px")};
  opacity: ${({ $dimColor }) => ($dimColor ? 0.6 : 1)};
`;
