import styled from "styled-components";

/** The rule for a suggestion's coordinate: its label, the choice, and the way to its explanation. */
export const StyledCitingRule = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 16rem minmax(0, 24rem) auto;
  justify-content: start;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

/** Opens and closes the explanation of the rules, which starts closed. */
export const StyledCitingToggle = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["primary"]};
  text-decoration: underline;

  svg {
    font-size: ${({ theme }) => theme.fontSize.xxs};
    transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    transition: transform 0.15s;
  }
`;

/** Where the explanation of the rules opens, across the whole width. */
export const StyledCitingExplanation = styled.div`
  grid-column: 1 / -1;
`;

/** One distance per gazetteer location type, as many to a line as fit. */
export const StyledCitingDistances = styled.div`
  grid-column: 1 / -1;
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
