import styled from "styled-components";

interface StyledWrapper {
  $border?: boolean;
  $sharpCorners?: boolean;
  $warning?: boolean;
}
export const StyledWrapper = styled.div<StyledWrapper>`
  position: relative;
  display: inline-flex;
  height: ${({ theme, $border }) => ($border ? theme.space[8] : theme.space[8])};
  border: ${({ theme, $border }) =>
    $border ? `${theme.borderWidth[1]} solid ${theme.color["grey"]}` : ""};
  border-color: ${({ theme, $warning }) =>
    $warning ? theme.color["warningBorder"] : theme.color["grey"]};
  border-radius: ${({ theme, $sharpCorners }) =>
    $sharpCorners ? theme.borderRadius["none"] : theme.borderRadius["sm"]};
  overflow: hidden;
  background-color: ${({ theme }) => theme.color.invertedBg["grey"]};
  flex-shrink: 0;

  &::after {
    content: ${({ $warning }) => ($warning ? '""' : "none")};
    position: absolute;
    inset: 0;
    border: ${({ theme }) => `${theme.borderWidth[2]} solid ${theme.color["warningBorder"]}`};
    /* inset:0 sits at the padding box; when the group has its own border the
       ring is that border-width inside the outer corner, so shrink its radius
       to match (no border → inherit the wrapper radius, as in the suggester). */
    border-radius: ${({ theme, $border, $sharpCorners }) => {
      const base = $sharpCorners ? theme.borderRadius["none"] : theme.borderRadius["sm"];
      return $border ? `calc(${base} - ${theme.borderWidth[1]})` : base;
    }};
    pointer-events: none;
  }
`;

export const StyledBold = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
