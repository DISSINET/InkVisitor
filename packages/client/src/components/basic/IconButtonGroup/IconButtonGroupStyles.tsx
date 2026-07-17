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
  border-radius: ${({ theme, $sharpCorners }) =>
    $sharpCorners ? theme.borderRadius["none"] : theme.borderRadius["sm"]};
  overflow: ${({ $border, $warning }) => ($border || $warning ? "hidden" : "")};
  background-color: ${({ theme }) => theme.color["white"]};
  flex-shrink: 0;

  &::after {
    content: ${({ $warning }) => ($warning ? '""' : "none")};
    position: absolute;
    inset: 0;
    border: ${({ theme }) => `${theme.borderWidth[2]} solid ${theme.color["warningBorder"]}`};
    border-radius: inherit;
    pointer-events: none;
  }
`;

export const StyledBold = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
