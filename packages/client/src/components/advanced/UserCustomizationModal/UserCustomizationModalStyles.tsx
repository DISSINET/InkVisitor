import styled from "styled-components";

// shared column geometry so every row (across all sections) lines up
const labelColumn = "17rem";
const controlColumn = "21rem";

export const StyledUserCustomization = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]};
  padding-block: ${({ theme }) => theme.space[1]};
`;

export const StyledUserCustomizationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

export const StyledSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin: 0;
  padding-bottom: ${({ theme }) => theme.space[2]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  text-transform: uppercase;
  letter-spacing: 0.09em;
`;

export const StyledSectionTitleIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1;
  width: 1.3rem;
`;

export const StyledFieldGrid = styled.div`
  display: grid;
  grid-template-columns: ${labelColumn} ${controlColumn} max-content;
  align-items: center;
  row-gap: ${({ theme }) => theme.space[3]};
  column-gap: ${({ theme }) => theme.space[3]};
`;

export const StyledFieldLabel = styled.label`
  justify-self: end;
  align-self: start;
  margin-top: 0.4rem;
  text-align: right;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: 1.3rem;
  line-height: 1.2;
`;

export const StyledFieldControl = styled.div`
  min-width: 0;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
`;

export const StyledFieldHelp = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
`;

// spans the control column so hints/actions sit flush under their inputs
export const StyledFieldSpan = styled.div`
  grid-column: 2 / 3;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledInlineAction = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export const StyledRightsLabel = styled.div`
  margin-top: 0.2rem;
  justify-self: end;
  align-self: start;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: 1.3rem;
`;

export const StyledRightsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  max-width: 23.5rem;
`;

export const StyledRightsGrid = styled.div`
  display: grid;
  grid-template-columns: ${labelColumn} max-content;
  align-items: center;
  row-gap: ${({ theme }) => theme.space[4]};
  column-gap: ${({ theme }) => theme.space[4]};
`;
