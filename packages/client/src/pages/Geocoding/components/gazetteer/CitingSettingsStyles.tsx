import styled from "styled-components";

/** One of the section's two settings: its head, what it decides, and its controls. */
export const StyledCitingBlock = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  }
`;

export const StyledCitingBlockHead = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledCitingBlockNote = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.5;
`;

/** The rule's choice and what the rule chosen picks, side by side; one below the other where they do not fit. */
export const StyledCitingRule = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};

  > :first-child {
    flex: 0 1 24rem;
    min-width: 0;
  }

  > :last-child {
    flex: 1 1 30rem;
  }
`;

/** Opens and closes the guide to the rules, which starts closed. */
export const StyledCitingToggle = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["primary"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $open }) => ($open ? theme.color["blue"][50] : "transparent")};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["primary"]};

  svg:last-child {
    font-size: ${({ theme }) => theme.fontSize.xxs};
    transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    transition: transform 0.15s;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["primary"]};
    outline-offset: 2px;
  }
`;

/** One distance per gazetteer location type, as many to a line as fit. */
export const StyledCitingDistances = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[4]};
`;

export const StyledCitingDistance = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} 0;
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledCitingLabel = styled.span`
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledCitingUnit = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;
