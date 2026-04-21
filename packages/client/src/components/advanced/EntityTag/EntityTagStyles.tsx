import styled from "styled-components";
import { ThemeColor } from "Theme/theme";

interface StyledEntityTagWrap {
  $flexListMargin: boolean;
}
export const StyledEntityTagWrap = styled.div<StyledEntityTagWrap>`
  display: inline-flex;
  overflow: hidden;
  margin-right: ${({ $flexListMargin }) => ($flexListMargin ? "0.5rem" : "")};
  margin-bottom: ${({ $flexListMargin }) => ($flexListMargin ? "0.5rem" : "")};
`;

interface StyledEntityTag {
  $color: keyof ThemeColor;
  $isTemplate: boolean;
}
export const StyledEntityTag = styled.div<StyledEntityTag>`
  background: ${({ $color, $isTemplate, theme }) =>
    $isTemplate
      ? `linear-gradient(-45deg, ${theme.color[$color]} 0%, ${theme.color[$color]} 50%, ${theme.color["gray"][100]} 50%)`
      : theme.color[$color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.space[7]};
`;
