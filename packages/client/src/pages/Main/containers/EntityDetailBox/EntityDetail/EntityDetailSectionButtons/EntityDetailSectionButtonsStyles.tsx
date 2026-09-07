import { ButtonGroup } from "components";
import styled from "styled-components";

/** `ButtonGroup` clips its overflow, which lets a flex row shrink it below the
 * size of the buttons — the section header row is such a row */
export const StyledSectionButtonsGroup = styled(ButtonGroup)`
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[2]};
  flex-shrink: 0;
`;

interface StyledSectionButtonsBorder {
  $rightMargin?: boolean;
}
export const StyledSectionButtonsBorder = styled.div<StyledSectionButtonsBorder>`
  border-right: 1px dashed;
  border-right-color: ${({ theme }) => theme.color.black};
  margin-left: 0.3rem;
  margin-right: ${({ $rightMargin }) => ($rightMargin ? "0.3rem" : "")};
`;
