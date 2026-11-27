import styled from "styled-components";

/** The rule for a suggestion's coordinate: its label, then the choice across the rest of the row. */
export const StyledCitingRule = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 16rem minmax(0, 40rem);
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
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
