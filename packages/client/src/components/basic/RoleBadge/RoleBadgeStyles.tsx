import styled from "styled-components";

/*
 * Mirrors an AttributeButtonGroup segment - same text size, padding, border
 * width and radius - so a role shown as a value matches the footprint of the
 * control it stands in for. The group fills itself white and marks the selected
 * segment; this stays unfilled, which is what separates a value from a control
 * at a glance. Outer spacing belongs to the caller: the group carries its own
 * margins where it is used, other layouts sit flush.
 */
export const StyledRoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  /* a labelled Button keeps this one size at every size step, so a group
     segment reads at xs no matter how the group is configured */
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  line-height: 1;
  color: ${({ theme }) => theme.color["gray"][700]};
  white-space: nowrap;
`;
