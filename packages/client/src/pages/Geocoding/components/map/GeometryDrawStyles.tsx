import styled, { DefaultTheme } from "styled-components";
import { StyledMapToggle } from "./MapControlsStyles";

/**
 * The geometry drawing controls, in the column of map controls on the right.
 *
 * The toggle sits in the third slot, under the layers switch and the region
 * drawing switch, and the panel opens to its left.
 */

const TOGGLE_SIZE = "2.6rem";
const SLOT = ({ theme }: { theme: DefaultTheme }) =>
  `calc(${theme.space[2]} + (${TOGGLE_SIZE} + ${theme.space[2]}) * 2)`;

export const StyledShapeToggle = styled(StyledMapToggle).attrs<{ $armed: boolean }>(({ $armed }) => ({
  $slot: 2,
  $tone: $armed ? "armed" : "idle",
}))<{ $armed: boolean }>``;

export const StyledShapePanel = styled.div`
  position: absolute;
  top: ${SLOT};
  right: calc(${({ theme }) => theme.space[2]} + ${TOGGLE_SIZE} + ${({ theme }) => theme.space[2]});
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  max-width: 26rem;
  padding: ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

export const StyledShapeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledShapeHint = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledShapeError = styled(StyledShapeHint)`
  color: ${({ theme }) => theme.color["danger"]};
`;
