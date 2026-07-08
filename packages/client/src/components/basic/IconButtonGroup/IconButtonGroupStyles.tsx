import styled from "styled-components";

interface StyledWrapper {
  $border?: boolean;
  $sharpCorners?: boolean;
}
export const StyledWrapper = styled.div<StyledWrapper>`
  display: inline-flex;
  height: ${({ theme, $border }) => ($border ? theme.space[8] : theme.space[8])};
  border: ${({ theme, $border }) =>
    $border ? `${theme.borderWidth[1]} solid ${theme.color["grey"]}` : ""};
  border-radius: ${({ theme, $sharpCorners }) =>
    $sharpCorners ? theme.borderRadius["none"] : theme.borderRadius["sm"]};
  overflow: ${({ $border }) => ($border ? "hidden" : "")};
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledBold = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
