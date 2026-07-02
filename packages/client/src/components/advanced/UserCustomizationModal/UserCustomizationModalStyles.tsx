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
  margin: 0;
  padding-bottom: ${({ theme }) => theme.space[2]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  text-transform: uppercase;
  letter-spacing: 0.09em;
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
  text-align: right;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: 1.3rem;
  line-height: 1.2;
`;

export const StyledFieldControl = styled.div`
  min-width: 0;
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

export const StyledRightsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledRightsGrid = styled.div`
  display: grid;
  grid-template-columns: ${labelColumn} max-content;
  align-items: center;
  row-gap: ${({ theme }) => theme.space[3]};
  column-gap: ${({ theme }) => theme.space[3]};
`;

export const StyledRightsLabel = styled.div`
  justify-self: end;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
