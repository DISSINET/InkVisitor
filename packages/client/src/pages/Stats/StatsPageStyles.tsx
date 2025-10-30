import styled from "styled-components";

export const StyledContainer = styled.div`
  position: relative;
  padding: 20px;
  display: grid;
  grid-template-rows: auto auto 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
  height: 100%;
`;

export const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StyledHeading = styled.h1`
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledFieldGroup = styled.div`
  display: grid;
  width: 100%;
  padding-bottom: 10px;
  grid-template-columns: repeat(6, auto);
  gap: 5rem;
  align-items: end;
  justify-content: center;
`;

export const StyledField = styled.div`
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto 2.5rem;
  justify-content: start;
  align-items: center;
`;

export const StyledFieldLabel = styled.div`
  display: flex;
  color: ${({ theme }) => theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledFieldInput = styled.div`
  display: grid;
  justify-content: start;
  align-items: center;
`;
export const StyledDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
`;

export const StyledFieldLValueSmall = styled.i`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
`;

export const StyledResultsChart = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  /* Allow shrinking inside CSS Grid */
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const StyledResultsTable = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${(props) => props.theme.space[5]};
  width: 100%;
  height: 100%;
  /* Allow shrinking inside CSS Grid */
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const StyledResponseSection = styled.div``;

export const StyledStyledQueryState = styled.div`
  color: ${({ theme }) => theme.color.primary};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const StyledEndpointStatus = styled.div<{ $isMaterialized: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  background-color: ${({ theme, $isMaterialized }) =>
    $isMaterialized ? theme.color.success : theme.color.warning};
  color: ${({ theme }) => theme.color.white};
`;
