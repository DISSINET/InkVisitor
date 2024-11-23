import styled from "styled-components";

export const StyledGridForm = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  margin-left: 0.8rem;
  margin-bottom: 2.5rem;
`;
export const StyledGridSectionHeading = styled.div`
  display: grid;
  justify-content: end;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-top: 1rem;
`;
interface StyledGridFormLabel {
  $disabled: boolean;
}
export const StyledGridFormLabel = styled.div<StyledGridFormLabel>`
  display: grid;
  justify-content: end;
  align-items: center;
  color: ${({ theme, $disabled }) => ($disabled ? theme.color["greyer"] : "")};
`;
export const StyledValidationList = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 1.5rem;
`;
export const StyledBlockSeparator = styled.div`
  width: 100%;
  grid-column: span 2;
  border-top: 1px dashed grey;
`;
interface StyledToggleWrap {
  $active: boolean;
  $disabled: boolean;
}
export const StyledToggleWrap = styled.div<StyledToggleWrap>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme, $active, $disabled }) =>
    $disabled
      ? theme.color["greyer"]
      : $active
      ? theme.color["info"]
      : theme.color["danger"]};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;

export const StyledSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledValidationCount = styled.p`
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
